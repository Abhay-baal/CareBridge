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

/*
 * UNIVERSAL CARE
 *
 * Parent + Child may create care.
 *
 * Recipient can be:
 *   Parent
 *   Child
 *
 * Same-family validation is performed by the controller.
 */

router.post(
  "/",
  authenticate,
  authorize("parent", "child"),
  createCarePlan
);

router.get(
  "/",
  authenticate,
  authorize("parent", "child"),
  getCarePlans
);

router.put(
  "/:id",
  authenticate,
  authorize("parent", "child"),
  updateCarePlan
);

router.delete(
  "/:id",
  authenticate,
  authorize("parent", "child"),
  deleteCarePlan
);

module.exports = router;
