const FamilyMessage = require("../models/FamilyMessage");
const FamilySnap = require("../models/FamilySnap");
const ParentChild = require("../models/ParentChild");
const User = require("../models/User");

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
  const visited = new Set();
  const queue = [userId.toString()];

  while (queue.length > 0) {
    const current = queue.shift();

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const relationships = await ParentChild.find({
      $or: [
        { parent: current },
        { child: current },
      ],
    }).select("parent child");

    for (const relationship of relationships) {
      const parentId = relationship.parent.toString();
      const childId = relationship.child.toString();

      if (!visited.has(parentId)) {
        queue.push(parentId);
      }

      if (!visited.has(childId)) {
        queue.push(childId);
      }
    }
  }

  return [...visited];
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
          message: "One or more recipients are not family members",
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

    const created = await FamilyMessage.create({
      sender: req.user.id,
      recipients,
      message: message.trim(),
    });

    const populated = await FamilyMessage.findById(created._id)
      .populate("sender", "fullName role")
      .populate("recipients", "fullName role");

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error("Send family message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send family message",
    });
  }
};

const getFamilyMessages = async (req, res) => {
  try {
    const familyIds = await getFamilyMemberIds(req.user.id);

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
      .limit(30);

    return res.status(200).json({
      success: true,
      data: messages,
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
    } = req.body;

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
  getFamilyMessages,
  createFamilySnap,
  getFamilySnaps,
  deleteFamilySnap,
};
