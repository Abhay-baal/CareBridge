const mongoose = require("mongoose");

const careProviderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    experience: {
      type: Number,
      min: 0,
      default: 0,
    },

    services: {
      type: [String],
      default: [],
    },

    availability: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["pending", "active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CareProvider", careProviderSchema);
