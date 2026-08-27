const express = require("express");

const router = express.Router();

const {
  createCarePlan,
  getCarePlans,
  updateCarePlan,
  deleteCarePlan,
} = require("../controllers/carePlanController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

// ------------------------------------------------------------
// Create
// Parent -> Child
// ------------------------------------------------------------
router.post(
  "/",
  authenticate,
  authorize("parent"),
  createCarePlan
);

// ------------------------------------------------------------
// Family-wide Care feed
// Parent + Child
// ------------------------------------------------------------
router.get(
  "/",
  authenticate,
  authorize("parent", "child"),
  getCarePlans
);

// ------------------------------------------------------------
// Update
// Parent + Child
// ------------------------------------------------------------
router.put(
  "/:id",
  authenticate,
  authorize("parent", "child"),
  updateCarePlan
);

// ------------------------------------------------------------
// Delete
// Creator only is enforced by controller.
// ------------------------------------------------------------
router.delete(
  "/:id",
  authenticate,
  authorize("parent", "child"),
  deleteCarePlan
);

module.exports = router;
