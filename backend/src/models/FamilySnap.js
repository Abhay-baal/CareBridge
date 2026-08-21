const mongoose = require("mongoose");

const familySnapSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    imageData: {
      type: String,
      required: true,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

familySnapSchema.index({
  sender: 1,
  recipient: 1,
  expiresAt: 1,
});

familySnapSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
  "FamilySnap",
  familySnapSchema
);
