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

    gender: {
      type: String,
      enum: ["male", "female", ""],
      default: "",
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    settings: {
      profile: {
        dateOfBirth: {
          type: String,
          default: "",
        },
      },

      notifications: {
        messages: {
          type: Boolean,
          default: true,
        },
        familySnaps: {
          type: Boolean,
          default: true,
        },
        careTasks: {
          type: Boolean,
          default: true,
        },
        reminders: {
          type: Boolean,
          default: true,
        },
        appointments: {
          type: Boolean,
          default: true,
        },
        emergencyAlerts: {
          type: Boolean,
          default: true,
        },
        locationUpdates: {
          type: Boolean,
          default: true,
        },
      },

      appearance: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "light",
      },

      language: {
        type: String,
        default: "English",
      },

      privacy: {
        analytics: {
          type: Boolean,
          default: true,
        },
        personalizedExperience: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
