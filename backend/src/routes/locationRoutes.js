const express = require("express");

const router = express.Router();

const {
  getParentLocation,
} = require("../controllers/locationController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  authenticate,
  authorize("child"),
  getParentLocation
);

module.exports = router;
