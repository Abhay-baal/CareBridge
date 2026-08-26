const mongoose = require("mongoose");

const familySchema = new mongoose.Schema(
  {
    familyCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    father: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    mother: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    children: [
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

module.exports = mongoose.model("Family", familySchema);
