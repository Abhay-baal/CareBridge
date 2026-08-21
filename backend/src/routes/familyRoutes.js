const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const {
  getFamilyMembers,
  sendFamilyMessage,
  getFamilyMessageStreak,
  getFamilyMessages,
  createFamilySnap,
  getFamilySnaps,
  deleteFamilySnap,
} = require("../controllers/familyCommunicationController");

router.use(
  authenticate,
  authorize("parent", "child")
);

router.get(
  "/members",
  getFamilyMembers
);

router.get(
  "/message-streak",
  getFamilyMessageStreak
);

router.get(
  "/messages",
  getFamilyMessages
);

router.post(
  "/messages",
  sendFamilyMessage
);

router.get(
  "/snaps",
  getFamilySnaps
);

router.post(
  "/snaps",
  createFamilySnap
);

router.delete(
  "/snaps/:id",
  deleteFamilySnap
);

module.exports = router;
