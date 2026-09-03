const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    type: {
      type: String,
      enum: ["announcement", "update", "maintenance", "important"],
      default: "announcement",
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    image: {
      type: String,
      default: "",
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Announcement", announcementSchema);
