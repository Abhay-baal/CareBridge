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

router.use(
  authenticate,
  authorize("parent", "child")
);

router.post("/", sendMessage);

router.get(
  "/:parentChildId",
  getMessages
);

router.patch(
  "/read",
  markMessagesRead
);

module.exports = router;
