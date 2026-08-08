const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
} = require("../controllers/bookingController");

// All booking endpoints require authentication.
router.use(authenticate);

// Child creates a booking.
router.post(
  "/",
  authorize("child"),
  createBooking
);

// Child, Provider, and Parent can view their related bookings.
router.get(
  "/",
  authorize("child", "provider", "parent"),
  getBookings
);

// Child, Provider, and Parent can view an authorized booking.
router.get(
  "/:id",
  authorize("child", "provider", "parent"),
  getBooking
);

// Status changes are handled by the controller
// according to the authenticated user's role and
// the current booking status.
router.patch(
  "/:id/status",
  authorize("child", "provider"),
  updateBookingStatus
);

module.exports = router;
