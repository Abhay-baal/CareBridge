const express = require("express");

const router = express.Router();

const {
  authenticate,
} = require("../middleware/authMiddleware");

const {
  getSettings,
  updateProfile,
  updateAccount,
  changePassword,
  updateNotifications,
  updateAppearance,
  updateLanguage,
  updatePrivacy,
} = require("../controllers/settingsController");

router.use(authenticate);

router.get("/", getSettings);

router.put("/profile", updateProfile);

router.put("/account", updateAccount);

router.put("/password", changePassword);

router.put(
  "/notifications",
  updateNotifications
);

router.put(
  "/appearance",
  updateAppearance
);

router.put(
  "/language",
  updateLanguage
);

router.put(
  "/privacy",
  updatePrivacy
);

module.exports = router;
