const mongoose = require("mongoose");

const emergencyEventSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    relationship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParentChild",
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"],
      default: "ACTIVE",
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    message: {
      type: String,
      trim: true,
      default: "Emergency SOS triggered",
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

emergencyEventSchema.index({
  parent: 1,
  child: 1,
  createdAt: -1,
});

emergencyEventSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "EmergencyEvent",
  emergencyEventSchema
);
