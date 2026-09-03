const SupportTicket = require("../models/SupportTicket");
const User = require("../models/User");

const createSupportTicket = async (req, res) => {
  try {
    const {
      category,
      subject,
      description,
      priority = "medium",
    } = req.body;

    if (!category || !subject?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Category, subject and description are required.",
      });
    }

    const user = await User.findById(req.user.id)
      .select("email role")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const email = String(user.email || "")
      .trim()
      .toLowerCase();

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please add and verify a valid email address before contacting support.",
      });
    }

    const ticket = await SupportTicket.create({
      user: user._id,
      userType: user.role,
      email,
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority,
    });

    return res.status(201).json({
      success: true,
      message:
        "Your support request has been submitted.",
      data: ticket,
    });
  } catch (error) {
    console.error(
      "Failed to create support ticket:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to submit your support request.",
      error: process.env.NODE_ENV === "production"
        ? undefined
        : {
            name: error?.name,
            message: error?.message,
            code: error?.code,
            errors: error?.errors,
          },
    });
  }
};

const getMySupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({
      user: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error(
      "Failed to load support tickets:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load your support requests.",
    });
  }
};

module.exports = {
  createSupportTicket,
  getMySupportTickets,
};
