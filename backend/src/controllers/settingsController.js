const bcrypt = require("bcrypt");
const User = require("../models/User");
const Parent = require("../models/Parent");

const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let parentProfile = null;

    if (user.role === "parent") {
      parentProfile = await Parent.findOne({
        user: user._id,
      }).select("address emergencyContact bloodGroup dateOfBirth");
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          gender: user.gender || "",
          role: user.role,
        },
        parentProfile,
        settings: user.settings,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, dateOfBirth, gender } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required",
      });
    }

    if (phone !== undefined && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    if (
      gender !== undefined &&
      !["male", "female", ""].includes(gender)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.fullName = fullName.trim();

    if (phone !== undefined) {
      user.phone = phone;
    }

    if (gender !== undefined) {
      user.gender = gender;
    }

    if (!user.settings) {
      user.settings = {};
    }

    if (!user.settings.profile) {
      user.settings.profile = {};
    }

    if (dateOfBirth !== undefined) {
      user.settings.profile.dateOfBirth = dateOfBirth || "";
    }

    await user.save();

    /*
     * Keep the existing Parent profile DOB synchronized when
     * this account is a parent.
     */
    if (user.role === "parent" && dateOfBirth !== undefined) {
      await Parent.findOneAndUpdate(
        { user: user._id },
        { dateOfBirth: dateOfBirth || "" },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        gender: user.gender || "",
        dateOfBirth:
          user.settings?.profile?.dateOfBirth || "",
      },
    });
  } catch (error) {
    console.error("Update settings profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateAccount = async (req, res) => {
  try {
    const { email, phone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      user.email = normalizedEmail;
    }

    if (phone !== undefined) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be exactly 10 digits",
        });
      }

      user.phone = phone;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Account information updated successfully",
      data: {
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Update account error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateNotifications = async (req, res) => {
  try {
    const allowedFields = [
      "messages",
      "familySnaps",
      "careTasks",
      "reminders",
      "appointments",
      "emergencyAlerts",
      "locationUpdates",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (typeof req.body[field] === "boolean") {
        updates[`settings.notifications.${field}`] =
          req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid notification settings provided",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("settings.notifications");

    res.status(200).json({
      success: true,
      message: "Notification settings saved",
      data: user.settings.notifications,
    });
  } catch (error) {
    console.error("Update notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateAppearance = async (req, res) => {
  try {
    const { appearance } = req.body;

    if (!["light", "dark", "system"].includes(appearance)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appearance option",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          "settings.appearance": appearance,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("settings.appearance");

    res.status(200).json({
      success: true,
      message: "Appearance saved",
      data: {
        appearance: user.settings.appearance,
      },
    });
  } catch (error) {
    console.error("Update appearance error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    if (!language || language !== "English") {
      return res.status(400).json({
        success: false,
        message: "Only English is currently available",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          "settings.language": language,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("settings.language");

    res.status(200).json({
      success: true,
      message: "Language saved",
      data: {
        language: user.settings.language,
      },
    });
  } catch (error) {
    console.error("Update language error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updatePrivacy = async (req, res) => {
  try {
    const updates = {};

    if (typeof req.body.analytics === "boolean") {
      updates["settings.privacy.analytics"] =
        req.body.analytics;
    }

    if (
      typeof req.body.personalizedExperience === "boolean"
    ) {
      updates[
        "settings.privacy.personalizedExperience"
      ] = req.body.personalizedExperience;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid privacy settings provided",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("settings.privacy");

    res.status(200).json({
      success: true,
      message: "Privacy settings saved",
      data: user.settings.privacy,
    });
  } catch (error) {
    console.error("Update privacy error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  getSettings,
  updateProfile,
  updateAccount,
  changePassword,
  updateNotifications,
  updateAppearance,
  updateLanguage,
  updatePrivacy,
};
