const express = require("express");

const router = express.Router();

const {
  createParentProfile,
  getMyParentProfile,
  updateMyParentProfile,
  deleteMyParentProfile,
  getMyConnectionCode,
} = require("../controllers/parentController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

router.post(
  "/",
  authenticate,
  authorize("parent"),
  createParentProfile
);

router.get(
  "/me",
  authenticate,
  authorize("parent"),
  getMyParentProfile
);

router.get(
  "/connection-code",
  authenticate,
  authorize("parent"),
  getMyConnectionCode
);

router.put(
  "/me",
  authenticate,
  authorize("parent"),
  updateMyParentProfile
);

router.delete(
  "/me",
  authenticate,
  authorize("parent"),
  deleteMyParentProfile
);

module.exports = router;
