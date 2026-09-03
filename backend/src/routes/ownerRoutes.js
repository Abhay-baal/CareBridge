const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  ownerLogin,
  verifyOwnerKey,
  getOwnerStats,
  getOwnerOverview,
  getOwnerUsers,
  getOwnerAnalytics,
  getOwnerCalendar,
  getOwnerSupport,
  updateSupportTicket,
  replyToSupportTicket,
  createAnnouncement,
  getOwnerNews,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/ownerController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

const ownerAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many owner authentication attempts. Please try again later.",
  },
});

router.post(
  "/verify-key",
  ownerAuthLimiter,
  verifyOwnerKey
);

router.post(
  "/login",
  ownerAuthLimiter,
  ownerLogin
);

router.use(
  authenticate,
  authorize("owner")
);

router.get("/stats", getOwnerStats);
router.get("/overview", getOwnerOverview);
router.get("/users", getOwnerUsers);
router.get("/analytics", getOwnerAnalytics);
router.get("/calendar", getOwnerCalendar);

router.get("/support", getOwnerSupport);
router.patch(
  "/support/:id",
  updateSupportTicket
);
router.post(
  "/support/:id/reply",
  replyToSupportTicket
);

router.get("/news", getOwnerNews);
router.post("/news", createAnnouncement);
router.patch(
  "/news/:id",
  updateAnnouncement
);
router.delete(
  "/news/:id",
  deleteAnnouncement
);

module.exports = router;
