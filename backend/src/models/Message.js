const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    parentChild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParentChild",
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

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({
  parentChild: 1,
  createdAt: 1,
});

module.exports = mongoose.model("Message", messageSchema);
