const Message = require("../models/Message");
const ParentChild = require("../models/ParentChild");

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
    const { parentChildId, message } = req.body;

    if (!parentChildId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "parentChildId and message are required",
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

    const receiver =
      relationship.parent.toString() === req.user.id.toString()
        ? relationship.child
        : relationship.parent;

    const newMessage = await Message.create({
      sender: req.user.id,
      receiver,
      parentChild: relationship._id,
      message: message.trim(),
      messageType: "text",
      read: false,
    });

    const populatedMessage = await Message.findById(
      newMessage._id
    )
      .populate("sender", "fullName role")
      .populate("receiver", "fullName role");

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

    return res.status(200).json({
      success: true,
      data: messages,
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
