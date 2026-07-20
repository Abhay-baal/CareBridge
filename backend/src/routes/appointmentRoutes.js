const express = require("express");
const router = express.Router();

const {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

router.post("/", authenticate, authorize("parent"), createAppointment);

router.get("/", authenticate, authorize("parent"), getAppointments);

router.put("/:id", authenticate, authorize("parent"), updateAppointment);

router.delete("/:id", authenticate, authorize("parent"), deleteAppointment);

module.exports = router;