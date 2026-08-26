const mongoose = require("mongoose");

const carePlanSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
      index: true,
    },

    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    parentChild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParentChild",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    careType: {
      type: String,
      enum: ["task", "walk"],
      default: "task",
    },

    walkLevel: {
      type: String,
      enum: ["light", "easy", "medium", "hard", "extreme"],
    },

    walkDuration: {
      type: Number,
      min: 1,
      max: 240,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      index: true,
    },

    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

carePlanSchema.index({
  parent: 1,
  child: 1,
  dueDate: 1,
});

carePlanSchema.index({
  child: 1,
  status: 1,
  dueDate: 1,
});

module.exports = mongoose.model("CarePlan", carePlanSchema);
