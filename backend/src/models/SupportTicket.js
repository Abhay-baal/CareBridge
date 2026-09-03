const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userType: {
      type: String,
      enum: ["parent", "child", "admin", "other"],
      default: "other",
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    category: {
      type: String,
      enum: [
        "problem",
        "error",
        "suggestion",
        "feedback",
        "question",
        "other",
      ],
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "reopened"],
      default: "open",
      index: true,
    },

    ownerReply: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    repliedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.pre("save", async function () {
  if (this.ticketId) {
    return;
  }

  const count = await mongoose.model("SupportTicket").countDocuments();

  this.ticketId = `CB-${String(1000 + count + 1).padStart(4, "0")}`;
});

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
