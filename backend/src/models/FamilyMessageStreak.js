const mongoose = require("mongoose");

const familyMessageStreakSchema = new mongoose.Schema(
  {
    familyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },

    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastMessageDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "FamilyMessageStreak",
  familyMessageStreakSchema
);
