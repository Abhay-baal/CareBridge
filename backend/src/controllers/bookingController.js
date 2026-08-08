const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const User = require("../models/User");
const Parent = require("../models/Parent");
const ParentChild = require("../models/ParentChild");
const CareProvider = require("../models/CareProvider");

const VALID_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
  "completed",
];

const STATUS_TRANSITIONS = {
  child: {
    pending: ["cancelled"],
    accepted: ["cancelled"],
  },

  provider: {
    pending: ["accepted", "rejected"],
    accepted: ["completed"],
  },
};

const bookingPopulate = [
  {
    path: "child",
    select: "fullName email phone role",
  },
  {
    path: "parent",
    select: "user address emergencyContact bloodGroup dateOfBirth",
    populate: {
      path: "user",
      select: "fullName email phone role",
    },
  },
  {
    path: "provider",
    select: "name phone bio experience services availability status",
  },
];

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const getBookingWithAuthorization = async (req) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return {
      error: {
        status: 404,
        message: "Booking not found",
      },
    };
  }

  const booking = await Booking.findById(id);

  if (!booking) {
    return {
      error: {
        status: 404,
        message: "Booking not found",
      },
    };
  }

  const userId = req.user.id.toString();

  let authorized = false;

  if (req.user.role === "child") {
    authorized = booking.child.toString() === userId;
  }

  if (req.user.role === "provider") {
    const provider = await CareProvider.findOne({
      _id: booking.provider,
      user: req.user.id,
    });

    authorized = Boolean(provider);
  }

  if (req.user.role === "parent") {
    const parent = await Parent.findOne({
      _id: booking.parent,
      user: req.user.id,
    });

    authorized = Boolean(parent);
  }

  if (!authorized) {
    return {
      error: {
        status: 403,
        message: "You are not authorized to access this booking",
      },
    };
  }

  return { booking };
};

// Create Booking
const createBooking = async (req, res) => {
  try {
    const {
      parent,
      provider,
      service,
      date,
      time,
      notes,
    } = req.body;

    if (!parent) {
      return res.status(400).json({
        success: false,
        message: "Parent is required",
      });
    }

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: "Provider is required",
      });
    }

    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Service is required",
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    if (!time) {
      return res.status(400).json({
        success: false,
        message: "Time is required",
      });
    }

    if (!isValidObjectId(parent)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent ID",
      });
    }

    if (!isValidObjectId(provider)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    const bookingDate = new Date(date);

    if (Number.isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking date",
      });
    }

    // Verify authenticated child.
    const child = await User.findOne({
      _id: req.user.id,
      role: "child",
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child account not found",
      });
    }

    // parent in request is the Parent profile ID.
    const parentProfile = await Parent.findById(parent);

    if (!parentProfile) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    // Verify the Parent profile belongs to a valid parent user.
    const parentUser = await User.findOne({
      _id: parentProfile.user,
      role: "parent",
    });

    if (!parentUser) {
      return res.status(404).json({
        success: false,
        message: "Parent account not found",
      });
    }

    // CRITICAL SECURITY CHECK:
    // Verify this child is actually connected to this parent.
    const relationship = await ParentChild.findOne({
      parent: parentUser._id,
      child: child._id,
      active: true,
    });

    // Backward compatibility with the original User.parent relationship.
    const legacyRelationship =
      child.parent &&
      child.parent.toString() === parentUser._id.toString();

    if (!relationship && !legacyRelationship) {
      return res.status(403).json({
        success: false,
        message: "This parent is not connected to the child",
      });
    }

    // Verify provider.
    const careProvider = await CareProvider.findById(provider);

    if (!careProvider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    if (careProvider.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Provider is not active",
      });
    }

    if (careProvider.availability !== true) {
      return res.status(400).json({
        success: false,
        message: "Provider is currently unavailable",
      });
    }

    // Verify requested service belongs to provider.
    const normalizedService = service.trim();

    const validService = careProvider.services.some(
      (providerService) =>
        providerService.toLowerCase() ===
        normalizedService.toLowerCase()
    );

    if (!validService) {
      return res.status(400).json({
        success: false,
        message: "Service is not offered by this provider",
      });
    }

    const booking = await Booking.create({
      child: child._id,
      parent: parentProfile._id,
      provider: careProvider._id,
      service: normalizedService,
      date: bookingDate,
      time: time.trim(),
      notes: notes ? notes.trim() : "",
      status: "pending",
    });

    const populatedBooking = await Booking.findById(
      booking._id
    ).populate(bookingPopulate);

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: populatedBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Bookings
const getBookings = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "child") {
      query.child = req.user.id;
    }

    if (req.user.role === "provider") {
      const provider = await CareProvider.findOne({
        user: req.user.id,
      });

      if (!provider) {
        return res.status(404).json({
          success: false,
          message: "Provider profile not found",
        });
      }

      query.provider = provider._id;
    }

    if (req.user.role === "parent") {
      const parent = await Parent.findOne({
        user: req.user.id,
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent profile not found",
        });
      }

      query.parent = parent._id;
    }

    const bookings = await Booking.find(query)
      .populate(bookingPopulate)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Single Booking
const getBooking = async (req, res) => {
  try {
    const result = await getBookingWithAuthorization(req);

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const booking = await Booking.findById(
      result.booking._id
    ).populate(bookingPopulate);

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update Booking Status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }

    const result = await getBookingWithAuthorization(req);

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const booking = result.booking;
    const currentStatus = booking.status;
    const role = req.user.role;

    const allowedTransitions =
      STATUS_TRANSITIONS[role]?.[currentStatus] || [];

    if (!allowedTransitions.includes(status)) {
      return res.status(403).json({
        success: false,
        message: `Cannot change booking status from ${currentStatus} to ${status}`,
      });
    }

    booking.status = status;

    await booking.save();

    const updatedBooking = await Booking.findById(
      booking._id
    ).populate(bookingPopulate);

    return res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
};
