const mongoose = require("mongoose");

const familyChatMessageSchema = new mongoose.Schema(
  {
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    messageType: {
      type: String,
      enum: ["text", "snap"],
      default: "text",
    },

    snapData: {
      type: String,
      default: null,
    },

    snapExpiresAt: {
      type: Date,
      default: null,
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

familyChatMessageSchema.index({
  family: 1,
  createdAt: 1,
});

module.exports = mongoose.model(
  "FamilyChatMessage",
  familyChatMessageSchema
);
