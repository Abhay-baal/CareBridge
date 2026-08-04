const express = require("express");

const router = express.Router();

const {
  createSOS,
  getEmergencyHistory,
  acknowledgeEmergency,
  resolveEmergency,
} = require("../controllers/emergencyEventController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

router.use(
  authenticate,
  authorize("parent", "child")
);

router.post("/sos", createSOS);

router.get(
  "/history",
  getEmergencyHistory
);

router.patch(
  "/:id/acknowledge",
  acknowledgeEmergency
);

router.patch(
  "/:id/resolve",
  resolveEmergency
);

module.exports = router;
