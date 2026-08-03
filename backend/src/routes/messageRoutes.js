const express = require("express");

const router = express.Router();

const {
  sendMessage,
  getMessages,
  markMessagesRead,
} = require("../controllers/messageController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

// Parent + Child can use Chat
router.use(
  authenticate,
  authorize("parent", "child")
);

// Send message
router.post("/", sendMessage);

// Get conversation
router.get("/:parentChildId", getMessages);

// Mark received messages as read
router.patch("/read", markMessagesRead);

module.exports = router;
