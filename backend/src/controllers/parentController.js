const Parent = require("../models/Parent");

// Create Parent Profile
const createParentProfile = async (req, res) => {
  try {
    const {
      address,
      emergencyContact,
      bloodGroup,
      dateOfBirth,
    } = req.body;

    if (!address || !emergencyContact) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingProfile = await Parent.findOne({
      user: req.user.id,
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Parent profile already exists",
      });
    }

    const parent = await Parent.create({
      user: req.user.id,
      address,
      emergencyContact,
      bloodGroup,
      dateOfBirth,
    });

    res.status(201).json({
      success: true,
      message: "Parent profile created successfully",
      data: parent,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get My Profile
const getMyParentProfile = async (req, res) => {
  try {
    const parent = await Parent.findOne({
      user: req.user.id,
    }).populate("user", "fullName email phone");

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: parent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update Profile
const updateMyParentProfile = async (req, res) => {
  try {
    const {
      address,
      emergencyContact,
      bloodGroup,
      dateOfBirth,
    } = req.body;

    const parent = await Parent.findOneAndUpdate(
      { user: req.user.id },
      {
        address,
        emergencyContact,
        bloodGroup,
        dateOfBirth,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: parent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Delete Profile
const deleteMyParentProfile = async (req, res) => {
  try {
    const parent = await Parent.findOneAndDelete({
      user: req.user.id,
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Parent profile deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  createParentProfile,
  getMyParentProfile,
  updateMyParentProfile,
  deleteMyParentProfile,
};