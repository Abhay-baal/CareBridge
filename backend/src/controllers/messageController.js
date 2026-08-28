const Message = require("../models/Message");
const ParentChild = require("../models/ParentChild");
const { sendPushToUser } = require("../services/pushService");

const getRelationshipForUser = async (req, relationshipId) => {
  return ParentChild.findOne({
    _id: relationshipId,
    $or: [
      { parent: req.user.id },
      { child: req.user.id },
    ],
  });
};

const sendMessage = async (req, res) => {
  try {
    const {
      parentChildId,
      message,
      messageType = "text",
      snapData = null,
      snapExpiresAt = null,
    } = req.body;

    if (!parentChildId) {
      return res.status(400).json({
        success: false,
        message: "parentChildId is required",
      });
    }

    const relationship = await getRelationshipForUser(
      req,
      parentChildId
    );

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized parent-child relationship",
      });
    }

    if (!["text", "snap"].includes(messageType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message type",
      });
    }

    if (messageType === "text") {
      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message cannot be empty",
        });
      }

      if (message.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Message is too long",
        });
      }
    }

    if (messageType === "snap") {
      if (!snapData) {
        return res.status(400).json({
          success: false,
          message: "Snap image is required",
        });
      }

      if (!snapData.startsWith("data:image/")) {
        return res.status(400).json({
          success: false,
          message: "Invalid snap image",
        });
      }

      /*
       * Keep the snap reasonably small because this version stores
       * the image directly in MongoDB.
       */
      if (snapData.length > 1500000) {
        return res.status(400).json({
          success: false,
          message: "Snap is too large. Please choose a smaller image.",
        });
      }
    }

    const receiver =
      relationship.parent.toString() === req.user.id.toString()
        ? relationship.child
        : relationship.parent;

    const newMessage = await Message.create({
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
        messageType === "snap" && snapExpiresAt
          ? new Date(snapExpiresAt)
          : null,
      read: false,
    });

    const populatedMessage = await Message.findById(
      newMessage._id
    )
      .populate("sender", "fullName role")
      .populate("receiver", "fullName role");

    const senderName =
      populatedMessage?.sender?.fullName || "New message";

    sendPushToUser(receiver, {
      title: "New message",
      body:
        messageType === "snap"
          ? `${senderName} sent a snap`
          : `${senderName}: ${message.trim().slice(0, 90)}`,
      data: {
        type: "message",
        parentChildId: relationship._id.toString(),
        senderId: req.user.id.toString(),
      },
      clickAction: "/chat",
    }).catch((error) => {
      console.warn("Push notification send failed:", error.message);
    });

    return res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send message",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const relationship = await getRelationshipForUser(
      req,
      req.params.parentChildId
    );

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized parent-child relationship",
      });
    }

    const messages = await Message.find({
      parentChild: relationship._id,
    })
      .populate("sender", "fullName role")
      .populate("receiver", "fullName role")
      .sort({ createdAt: 1 });

    /*
     * Do not expose expired snap images.
     * The message itself remains so the sender still has a
     * conversation history entry.
     */
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

    return res.status(200).json({
      success: true,
      data: safeMessages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch messages",
    });
  }
};

const markMessagesRead = async (req, res) => {
  try {
    const { parentChildId } = req.body;

    if (!parentChildId) {
      return res.status(400).json({
        success: false,
        message: "parentChildId is required",
      });
    }

    const relationship = await getRelationshipForUser(
      req,
      parentChildId
    );

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized parent-child relationship",
      });
    }

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

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("Mark messages read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update read status",
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markMessagesRead,
};
