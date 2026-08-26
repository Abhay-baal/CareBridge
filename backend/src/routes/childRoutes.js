const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const {
  getChildDashboard,
  updateChildCarePlan,
  createChildCarePlan,
} = require("../controllers/childController");

router.use(authenticate, authorize("child"));

router.get("/dashboard", getChildDashboard);

router.post("/care-plans", createChildCarePlan);

router.put(
  "/care-plans/:id",
  updateChildCarePlan
);

module.exports = router;
