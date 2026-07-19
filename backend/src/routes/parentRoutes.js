const express = require("express");

const router = express.Router();

const {
  createParentProfile,
  getMyParentProfile,
  updateMyParentProfile,
  deleteMyParentProfile,
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