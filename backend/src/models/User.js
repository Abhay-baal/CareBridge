const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["parent", "child", "provider"],
      required: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    connectionCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
