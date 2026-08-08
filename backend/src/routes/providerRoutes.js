const express = require("express");
const router = express.Router();

const {
  registerProvider,
  getProviders,
  getProviderById,
  getMyProviderProfile,
  updateProviderProfile,
  updateAvailability,
} = require("../controllers/providerController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

// Provider-only operations
router.post(
  "/register",
  authenticate,
  authorize("provider"),
  registerProvider
);

router.get(
  "/me",
  authenticate,
  authorize("provider"),
  getMyProviderProfile
);

router.put(
  "/profile",
  authenticate,
  authorize("provider"),
  updateProviderProfile
);

router.patch(
  "/availability",
  authenticate,
  authorize("provider"),
  updateAvailability
);

// Marketplace discovery
router.get("/", getProviders);
router.get("/:id", getProviderById);

module.exports = router;
