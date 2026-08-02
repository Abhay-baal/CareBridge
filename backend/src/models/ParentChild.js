const mongoose = require("mongoose");

const parentChildSchema = new mongoose.Schema(
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

    active: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

parentChildSchema.index(
  { parent: 1, child: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ParentChild",
  parentChildSchema
);
