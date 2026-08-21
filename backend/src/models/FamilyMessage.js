const mongoose = require("mongoose");

const familyMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

familyMessageSchema.index({
  recipients: 1,
  createdAt: -1,
});

familyMessageSchema.index({
  sender: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "FamilyMessage",
  familyMessageSchema
);
