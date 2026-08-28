const express = require("express");

const router = express.Router();

const {
  authenticate,
} = require("../middleware/authMiddleware");

const {
  registerPushToken,
  removePushToken,
} = require("../controllers/notificationController");

router.use(authenticate);

router.post("/devices", registerPushToken);
router.delete("/devices", removePushToken);

module.exports = router;
