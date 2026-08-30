const Family = require("../models/Family");
const User = require("../models/User");
const Message = require("../models/Message");
const ParentChild = require("../models/ParentChild");
const FamilyChatMessage = require("../models/FamilyChatMessage");
const DirectFamilyMessage = require("../models/DirectFamilyMessage");

const getFamilyForUser = async (userId) => {
  return Family.findOne({
    $or: [
      { father: userId },
      { mother: userId },
      { children: userId },
    ],
  });
};

const getFamilyMemberIds = (family) => {
  return [
    family.father,
    family.mother,
    ...(family.children || []),
  ]
    .filter(Boolean)
    .map((id) => id.toString());
};

const isFamilyMember = (family, userId) => {
  return getFamilyMemberIds(family).includes(
    userId.toString()
  );
};

const getConversationKey = (userA, userB) => {
  return [userA.toString(), userB.toString()]
    .sort()
    .join(":");
};

const validateMessage = ({
  messageType,
  message,
  snapData,
}) => {
  if (!["text", "snap"].includes(messageType)) {
    return "Invalid message type";
  }

  if (messageType === "text") {
    if (!message || !message.trim()) {
      return "Message cannot be empty";
    }

    if (message.trim().length > 2000) {
      return "Message is too long";
    }
  }

  if (messageType === "snap") {
    if (!snapData) {
      return "Snap image is required";
    }

    if (
      typeof snapData !== "string" ||
      !snapData.startsWith("data:image/")
    ) {
      return "Invalid snap image";
    }

    if (snapData.length > 2000000) {
      return "Snap is too large. Please try a smaller image.";
    }
  }

  return null;
};

/*
 * FAMILY CHAT MEMBERS
 *
 * Returns every person in the current Family.
 * This intentionally does NOT use ParentChild as the
 * source of truth for the chat list.
 */
const getFamilyChatMembers = async (req, res) => {
  try {
    const family = await getFamilyForUser(req.user.id);

    if (!family) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const ids = getFamilyMemberIds(family);

    const members = await User.find({
      _id: { $in: ids },
    }).select("_id fullName email role gender");

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error(
      "Get family chat members error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load family chat members",
    });
  }
};

/*
 * FAMILY GROUP - GET
 */
const getFamilyGroupMessages = async (req, res) => {
  try {
    const family = await getFamilyForUser(req.user.id);

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family not found",
      });
    }

    const messages = await FamilyChatMessage.find({
      family: family._id,
    })
      .populate("sender", "fullName role")
      .sort({ createdAt: 1 })
      .limit(300);

    const now = new Date();

    const safeMessages = messages.map((item) => {
      const data = item.toObject();

      if (
        data.messageType === "snap" &&
        data.snapExpiresAt &&
        new Date(data.snapExpiresAt) <= now
      ) {
        data.snapData = null;
        data.message = "📸 Snap expired";
      }

      return data;
    });

    await FamilyChatMessage.updateMany(
      {
        family: family._id,
        sender: {
          $ne: req.user.id,
        },
        readBy: {
          $ne: req.user.id,
        },
      },
      {
        $addToSet: {
          readBy: req.user.id,
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: safeMessages,
    });
  } catch (error) {
    console.error(
      "Get family group messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load family group messages",
    });
  }
};

/*
 * FAMILY GROUP - SEND
 */
const sendFamilyGroupMessage = async (req, res) => {
  try {
    const family = await getFamilyForUser(req.user.id);

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family not found",
      });
    }

    const {
      message,
      messageType = "text",
      snapData = null,
      snapExpiresAt = null,
    } = req.body;

    const validationError = validateMessage({
      messageType,
      message,
      snapData,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const created = await FamilyChatMessage.create({
      family: family._id,
      sender: req.user.id,
      message:
        messageType === "text"
          ? message.trim()
          : "📸 Snap",
      messageType,
      snapData:
        messageType === "snap"
          ? snapData
          : null,
      snapExpiresAt:
        messageType === "snap" && snapExpiresAt
          ? new Date(snapExpiresAt)
          : null,
      readBy: [req.user.id],
    });

    const populated = await FamilyChatMessage.findById(
      created._id
    ).populate("sender", "fullName role");

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error(
      "Send family group message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send family group message",
    });
  }
};

/*
 * DIRECT CHAT
 *
 * Family membership decides who can chat with whom.
 *
 * Existing ParentChild messages are still read so old
 * conversations are not lost.
 *
 * New parent-parent conversations use DirectFamilyMessage.
 */
const getDirectFamilyMessages = async (req, res) => {
  try {
    const family = await getFamilyForUser(req.user.id);

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family not found",
      });
    }

    const targetUserId = req.params.userId;

    if (
      !isFamilyMember(
        family,
        targetUserId
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "This user is not in your family",
      });
    }

    if (
      targetUserId.toString() ===
      req.user.id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot chat with yourself",
      });
    }

    const conversationKey = getConversationKey(
      req.user.id,
      targetUserId
    );

    const directMessages =
      await DirectFamilyMessage.find({
        family: family._id,
        conversationKey,
      })
        .populate("sender", "fullName role")
        .populate("receiver", "fullName role")
        .sort({ createdAt: 1 });

    const relationship =
      await ParentChild.findOne({
        $or: [
          {
            parent: req.user.id,
            child: targetUserId,
          },
          {
            parent: targetUserId,
            child: req.user.id,
          },
        ],
      });

    let legacyMessages = [];

    if (relationship) {
      legacyMessages = await Message.find({
        parentChild: relationship._id,
      })
        .populate("sender", "fullName role")
        .populate("receiver", "fullName role")
        .sort({ createdAt: 1 });

      await Message.updateMany(
        {
          parentChild: relationship._id,
          receiver: req.user.id,
          read: false,
        },
        {
          $set: {
            read: true,
          },
        }
      );
    }

    const normalizedLegacy = legacyMessages.map(
      (item) => {
        const data = item.toObject();

        if (
          data.messageType === "snap" &&
          data.snapExpiresAt &&
          new Date(data.snapExpiresAt) <=
            new Date()
        ) {
          data.snapData = null;
          data.message = "📸 Snap expired";
        }

        return {
          ...data,
          chatSource: "legacy",
        };
      }
    );

    const normalizedDirect = directMessages.map(
      (item) => ({
        ...item.toObject(),
        chatSource: "direct",
      })
    );

    const combined = [
      ...normalizedLegacy,
      ...normalizedDirect,
    ].sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );

    await DirectFamilyMessage.updateMany(
      {
        family: family._id,
        conversationKey,
        sender: {
          $ne: req.user.id,
        },
        readBy: {
          $ne: req.user.id,
        },
      },
      {
        $addToSet: {
          readBy: req.user.id,
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: combined,
    });
  } catch (error) {
    console.error(
      "Get direct family messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load direct conversation",
    });
  }
};

/*
 * DIRECT CHAT - SEND
 *
 * If a parent-child ParentChild relationship exists,
 * use the existing Message model so old chat behavior
 * remains compatible.
 *
 * Otherwise use DirectFamilyMessage.
 */
const sendDirectFamilyMessage = async (req, res) => {
  try {
    const family = await getFamilyForUser(req.user.id);

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family not found",
      });
    }

    const targetUserId = req.params.userId;

    if (
      !isFamilyMember(
        family,
        targetUserId
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "This user is not in your family",
      });
    }

    if (
      targetUserId.toString() ===
      req.user.id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot message yourself",
      });
    }

    const {
      message,
      messageType = "text",
      snapData = null,
      snapExpiresAt = null,
    } = req.body;

    const validationError = validateMessage({
      messageType,
      message,
      snapData,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const relationship =
      await ParentChild.findOne({
        $or: [
          {
            parent: req.user.id,
            child: targetUserId,
          },
          {
            parent: targetUserId,
            child: req.user.id,
          },
        ],
      });

    /*
     * Preserve the existing ParentChild chat storage
     * whenever the relationship exists.
     */
    if (relationship) {
      const receiver =
        relationship.parent.toString() ===
        req.user.id.toString()
          ? relationship.child
          : relationship.parent;

      const created = await Message.create({
        sender: req.user.id,
        receiver,
        parentChild: relationship._id,
        message:
          messageType === "text"
            ? message.trim()
            : "📸 Snap",
        messageType,
        snapData:
          messageType === "snap"
            ? snapData
            : null,
        snapExpiresAt:
          messageType === "snap" &&
          snapExpiresAt
            ? new Date(snapExpiresAt)
            : null,
        read: false,
      });

      const populated = await Message.findById(
        created._id
      )
        .populate(
          "sender",
          "fullName role"
        )
        .populate(
          "receiver",
          "fullName role"
        );

      return res.status(201).json({
        success: true,
        data: populated,
      });
    }

    /*
     * Parent-to-parent or any other family-member
     * conversation uses the new generic family chat.
     */
    const conversationKey =
      getConversationKey(
        req.user.id,
        targetUserId
      );

    const created =
      await DirectFamilyMessage.create({
        family: family._id,
        conversationKey,
        sender: req.user.id,
        receiver: targetUserId,
        message:
          messageType === "text"
            ? message.trim()
            : "📸 Snap",
        messageType,
        snapData:
          messageType === "snap"
            ? snapData
            : null,
        snapExpiresAt:
          messageType === "snap" &&
          snapExpiresAt
            ? new Date(snapExpiresAt)
            : null,
        readBy: [req.user.id],
      });

    const populated =
      await DirectFamilyMessage.findById(
        created._id
      )
        .populate(
          "sender",
          "fullName role"
        )
        .populate(
          "receiver",
          "fullName role"
        );

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error(
      "Send direct family message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send direct message",
    });
  }
};

module.exports = {
  getFamilyChatMembers,
  getFamilyGroupMessages,
  sendFamilyGroupMessage,
  getDirectFamilyMessages,
  sendDirectFamilyMessage,
};
