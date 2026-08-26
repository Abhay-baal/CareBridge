const FamilyMessage = require("../models/FamilyMessage");
const FamilyMessageStreak = require("../models/FamilyMessageStreak");
const FamilySnap = require("../models/FamilySnap");
const ParentChild = require("../models/ParentChild");
const User = require("../models/User");
const Family = require("../models/Family");

/*
 * Family membership is calculated from the existing ParentChild
 * relationship graph.

 * Example:

 * Mom -> Child
 * Dad -> Child
 * Mom -> Child2

 * All four users belong to the same family graph.
 */
const getFamilyMemberIds = async (userId) => {
  /*
   * Family is now the source of truth for family membership.
   *
   * This means:
   *   Father
   *   Mother
   *   Child 1
   *   Child 2
   *
   * are all immediately available to Family Messages,
   * Family Snaps and other family-wide features.
   *
   * ParentChild remains responsible for parent-child-specific
   * features such as Chat, Care, Location and SOS.
   */
  const family = await Family.findOne({
    $or: [
      { father: userId },
      { mother: userId },
      { children: userId },
    ],
  }).select("father mother children");

  if (!family) {
    return [userId.toString()];
  }

  const ids = [
    family.father,
    family.mother,
    ...(family.children || []),
  ]
    .filter(Boolean)
    .map((id) => id.toString());

  return [...new Set(ids)];
};

const getFamilyKey = (ids) =>
  [...new Set(ids.map(String))].sort().join(":");

const getDayKey = (date) => {
  const value = new Date(date);

  return `${value.getUTCFullYear()}-${String(
    value.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(value.getUTCDate()).padStart(
    2,
    "0"
  )}`;
};

const getPreviousDayKey = (date) => {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() - 1);
  return getDayKey(value);
};

const updateFamilyMessageStreak = async (familyIds) => {
  const familyKey = getFamilyKey(familyIds);
  const now = new Date();

  let streak = await FamilyMessageStreak.findOne({
    familyKey,
  });

  if (!streak) {
    streak = await FamilyMessageStreak.create({
      familyKey,
      currentStreak: 1,
      longestStreak: 1,
      lastMessageDate: now,
    });

    return streak;
  }

  const today = getDayKey(now);
  const lastDay = streak.lastMessageDate
    ? getDayKey(streak.lastMessageDate)
    : null;

  if (lastDay === today) {
    return streak;
  }

  if (
    streak.lastMessageDate &&
    getPreviousDayKey(now) === lastDay
  ) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }

  streak.longestStreak = Math.max(
    streak.longestStreak,
    streak.currentStreak
  );

  streak.lastMessageDate = now;

  await streak.save();

  return streak;
};

const getFamilyMessageStreak = async (req, res) => {
  try {
    const familyIds = await getFamilyMemberIds(req.user.id);
    const familyKey = getFamilyKey(familyIds);

    const streak = await FamilyMessageStreak.findOne({
      familyKey,
    });

    return res.status(200).json({
      success: true,
      data: streak || {
        currentStreak: 0,
        longestStreak: 0,
        lastMessageDate: null,
      },
    });
  } catch (error) {
    console.error(
      "Get family message streak error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load family message streak",
    });
  }
};

const getFamilyMembers = async (req, res) => {
  try {
    const ids = await getFamilyMemberIds(req.user.id);

    const members = await User.find({
      _id: { $in: ids },
    }).select("_id fullName role");

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Family members error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load family members",
    });
  }
};

const sendFamilyMessage = async (req, res) => {
  try {
    const { message, recipientIds } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const familyIds = await getFamilyMemberIds(req.user.id);

    const requestedRecipients = Array.isArray(recipientIds)
      ? recipientIds.map(String)
      : [];

    let recipients;

    if (requestedRecipients.length === 0) {
      recipients = familyIds.filter(
        (id) => id !== req.user.id.toString()
      );
    } else {
      const invalidRecipient = requestedRecipients.some(
        (id) =>
          !familyIds.includes(id) ||
          id === req.user.id.toString()
      );

      if (invalidRecipient) {
        return res.status(403).json({
          success: false,
          message:
            "One or more recipients are not family members",
        });
      }

      recipients = [...new Set(requestedRecipients)];
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No family recipients available",
      });
    }

    /*
     * ONE ACTIVE FAMILY MESSAGE PER SENDER.
     *
     * A new message replaces the sender's previous
     * family message completely.
     *
     * This keeps the Family Dashboard focused on the
     * current message instead of becoming a chat history.
     */
    await FamilyMessage.deleteMany({
      sender: req.user.id,
    });

    const created = await FamilyMessage.create({
      sender: req.user.id,
      recipients,
      message: message.trim(),
    });

    /*
     * Streak is updated ONLY by family messages.
     * Snaps never touch this value.
     */
    const streak = await updateFamilyMessageStreak(
      familyIds
    );

    const populated = await FamilyMessage.findById(
      created._id
    )
      .populate("sender", "fullName role")
      .populate("recipients", "fullName role");

    return res.status(201).json({
      success: true,
      data: populated,
      streak,
    });
  } catch (error) {
    console.error(
      "Send family message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send family message",
    });
  }
};

const getUserIdForFamilyMessage = (user) => {
  if (!user) {
    return "";
  }

  return (
    user._id?.toString?.() ||
    user.id?.toString?.() ||
    ""
  );
};

const getFamilyMessages = async (req, res) => {
  try {
    const familyIds = await getFamilyMemberIds(req.user.id);

    /*
     * Get all messages that belong to the current family
     * conversation.
     *
     * We intentionally fetch multiple messages here and then
     * keep only the latest message from EACH sender.
     *
     * This means:
     *
     * Mom -> latest Mom message
     * Dad -> latest Dad message
     * Son -> latest Son message
     *
     * A new message from Son replaces ONLY Son's previous
     * family message. It never replaces Mom's or Dad's message.
     */

    const messages = await FamilyMessage.find({
      $or: [
        {
          sender: req.user.id,
          recipients: {
            $elemMatch: {
              $in: familyIds,
            },
          },
        },
        {
          recipients: req.user.id,
          sender: {
            $in: familyIds,
          },
        },
      ],
    })
      .populate("sender", "fullName role")
      .populate("recipients", "fullName role")
      .sort({ createdAt: -1 })
      .limit(100);

    /*
     * Keep only the newest message from each sender.
     *
     * Because the query is sorted newest -> oldest,
     * the first message we encounter for a sender is
     * automatically that sender's latest message.
     */
    const latestBySender = new Map();

    for (const message of messages) {
      const senderId = getUserIdForFamilyMessage(
        message.sender
      );

      if (!senderId) {
        continue;
      }

      if (!latestBySender.has(senderId)) {
        latestBySender.set(senderId, message);
      }
    }

    const latestMessages = [...latestBySender.values()].sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      data: latestMessages,
    });
  } catch (error) {
    console.error("Get family messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load family messages",
    });
  }
};

const createFamilySnap = async (req, res) => {
  try {
    const {
      imageData,
      caption,
      recipientIds,
      location,
    } = req.body;

    const snapLocation =
      location &&
      typeof location === "object" &&
      location.enabled === true
        ? {
            enabled: true,
            name:
              typeof location.name === "string"
                ? location.name.trim().slice(0, 120)
                : "",
          }
        : {
            enabled: false,
            name: "",
          };

    if (
      snapLocation.enabled &&
      !snapLocation.name
    ) {
      return res.status(400).json({
        success: false,
        message: "Location name is required when location is enabled",
      });
    }

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: "Snap image is required",
      });
    }

    if (typeof imageData !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid snap image",
      });
    }

    /*
     * Keep the MVP safe for MongoDB document size.
     * Approx. 5MB source image max.
     */
    if (imageData.length > 7000000) {
      return res.status(400).json({
        success: false,
        message: "Snap image is too large. Maximum size is 5MB.",
      });
    }

    const familyIds = await getFamilyMemberIds(req.user.id);

    const requestedRecipients = Array.isArray(recipientIds)
      ? recipientIds.map(String)
      : [];

    let recipients;

    if (requestedRecipients.length === 0) {
      recipients = familyIds.filter(
        (id) => id !== req.user.id.toString()
      );
    } else {
      const invalidRecipient = requestedRecipients.some(
        (id) =>
          !familyIds.includes(id) ||
          id === req.user.id.toString()
      );

      if (invalidRecipient) {
        return res.status(403).json({
          success: false,
          message: "One or more snap recipients are not family members",
        });
      }

      recipients = [...new Set(requestedRecipients)];
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No family recipients available",
      });
    }

    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    /*
     * One document per sender -> recipient relationship.
     * This guarantees that replacing a snap for Mom does not
     * destroy the active snap being shown to Dad.
     */
    const createdSnaps = [];

    for (const recipient of recipients) {
      await FamilySnap.deleteMany({
        sender: req.user.id,
        recipient,
      });

      const snap = await FamilySnap.create({
        sender: req.user.id,
        recipient,
        imageData,
        caption: caption?.trim() || "",
        location: snapLocation,
        expiresAt,
      });

      createdSnaps.push(snap);
    }

    const populated = await FamilySnap.find({
      _id: {
        $in: createdSnaps.map((snap) => snap._id),
      },
    })
      .populate("sender", "fullName role")
      .populate("recipient", "fullName role");

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error("Create family snap error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create family snap",
    });
  }
};

const getFamilySnaps = async (req, res) => {
  try {
    const familyIds = await getFamilyMemberIds(req.user.id);

    await FamilySnap.deleteMany({
      expiresAt: {
        $lte: new Date(),
      },
    });

    const snaps = await FamilySnap.find({
      $or: [
        {
          recipient: req.user.id,
          sender: {
            $in: familyIds,
          },
        },
        {
          sender: req.user.id,
          recipient: {
            $in: familyIds,
          },
        },
      ],
      expiresAt: {
        $gt: new Date(),
      },
    })
      .populate("sender", "fullName role")
      .populate("recipient", "fullName role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: snaps,
    });
  } catch (error) {
    console.error("Get family snaps error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load family snaps",
    });
  }
};

const deleteFamilySnap = async (req, res) => {
  try {
    const snap = await FamilySnap.findOne({
      _id: req.params.id,
      sender: req.user.id,
    });

    if (!snap) {
      return res.status(404).json({
        success: false,
        message: "Snap not found",
      });
    }

    await snap.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Snap deleted",
    });
  } catch (error) {
    console.error("Delete family snap error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete snap",
    });
  }
};

module.exports = {
  getFamilyMembers,
  sendFamilyMessage,
  getFamilyMessageStreak,
  getFamilyMessages,
  createFamilySnap,
  getFamilySnaps,
  deleteFamilySnap,
};
