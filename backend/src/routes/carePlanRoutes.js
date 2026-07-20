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

router.post("/", authenticate, authorize("parent"), createCarePlan);

router.get("/", authenticate, authorize("parent"), getCarePlans);

router.put("/:id", authenticate, authorize("parent"), updateCarePlan);

router.delete("/:id", authenticate, authorize("parent"), deleteCarePlan);

module.exports = router;