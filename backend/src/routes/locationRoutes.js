const express = require("express");

const router = express.Router();

const {
  startSharing,
  updateLocation,
  stopSharing,
  getSharedLocation,
} = require("../controllers/locationController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

router.use(
  authenticate,
  authorize("parent", "child")
);

router.patch(
  "/start",
  startSharing
);

router.patch(
  "/update",
  updateLocation
);

router.patch(
  "/stop",
  stopSharing
);

router.get(
  "/",
  getSharedLocation
);

module.exports = router;
