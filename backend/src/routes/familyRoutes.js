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

const {
  getMyFamily,
  createFamily,
  joinFamily,
  leaveFamily,
} = require("../controllers/familyController");

const {
  getFamilyChatMembers,
  getFamilyGroupMessages,
  sendFamilyGroupMessage,
  getDirectFamilyMessages,
  sendDirectFamilyMessage,
} = require("../controllers/familyChatController");

router.use(
  authenticate,
  authorize("parent", "child")
);

/*
 * =========================================================
 * FAMILY FOUNDATION
 * =========================================================
 */

router.get(
  "/me",
  getMyFamily
);

router.post(
  "/create",
  createFamily
);

router.post(
  "/join",
  joinFamily
);

router.post(
  "/leave",
  leaveFamily
);

/*
 * =========================================================
 * EXISTING FAMILY COMMUNICATION
 *
 * DO NOT REMOVE.
 * Dashboard Messages / Snaps / Streak continue using these.
 * =========================================================
 */

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

/*
 * =========================================================
 * NEW CHAT SYSTEM
 *
 * /chat/group
 *     Family Group
 *
 * /chat/direct/:userId
 *     Individual family-member chat
 * =========================================================
 */

router.get(
  "/chat/members",
  getFamilyChatMembers
);

router.get(
  "/chat/group/messages",
  getFamilyGroupMessages
);

router.post(
  "/chat/group/messages",
  sendFamilyGroupMessage
);

router.get(
  "/chat/direct/:userId",
  getDirectFamilyMessages
);

router.post(
  "/chat/direct/:userId",
  sendDirectFamilyMessage
);

module.exports = router;
