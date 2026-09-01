const mongoose = require("mongoose");

const carePlanSchema = new mongoose.Schema(
  {
    /*
     * The user who created/gave the care item.
     *
     * Can be:
     *   parent
     *   child
     */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Universal recipient.
     *
     * This is the important change.
     *
     * A CarePlan can now be:
     *
     * Parent  -> Parent
     * Parent  -> Child
     * Child   -> Parent
     * Child   -> Child
     */
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    recipientRole: {
      type: String,
      enum: ["parent", "child"],
      required: true,
      index: true,
    },

    /*
     * Family containing creator + recipient.
     */
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
      index: true,
    },

    /*
     * Legacy relationship fields.
     *
     * These remain optional so existing Parent -> Child
     * CarePlans continue to work.
     */
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      index: true,
    },

    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    parentChild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParentChild",
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
      enum: [
        "light",
        "easy",
        "medium",
        "hard",
        "extreme",
      ],
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

    /*
     * Optional now.
     *
     * null = no specific time
     * Date   = specific date/time
     */
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Universal family feed.
 */
carePlanSchema.index({
  family: 1,
  dueDate: 1,
  createdAt: -1,
});

carePlanSchema.index({
  recipient: 1,
  status: 1,
  dueDate: 1,
});

carePlanSchema.index({
  createdBy: 1,
  createdAt: -1,
});

/*
 * Legacy query support.
 */
carePlanSchema.index({
  parent: 1,
  child: 1,
  dueDate: 1,
});

module.exports = mongoose.model(
  "CarePlan",
  carePlanSchema
);
