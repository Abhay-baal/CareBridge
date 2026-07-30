const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const {
  getChildDashboard,
  updateChildCarePlan,
} = require("../controllers/childController");

router.use(authenticate, authorize("child"));

router.get("/dashboard", getChildDashboard);

router.put(
  "/care-plans/:id",
  updateChildCarePlan
);

module.exports = router;
