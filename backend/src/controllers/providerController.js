const CareProvider = require("../models/CareProvider");
const User = require("../models/User");

const sanitizeProvider = (provider) => ({
  id: provider._id,
  name: provider.name,
  phone: provider.phone,
  bio: provider.bio,
  experience: provider.experience,
  services: provider.services,
  availability: provider.availability,
  status: provider.status,
  createdAt: provider.createdAt,
  updatedAt: provider.updatedAt,
});

// Register Provider Profile
const registerProvider = async (req, res) => {
  try {
    const {
      name,
      phone,
      bio,
      experience,
      services,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const phoneRegex = /^\d{10}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    if (
      experience !== undefined &&
      (typeof experience !== "number" || experience < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Experience must be a non-negative number",
      });
    }

    if (services !== undefined && !Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        message: "Services must be an array",
      });
    }

    const user = await User.findOne({
      _id: req.user.id,
      role: "provider",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Provider user account not found",
      });
    }

    const existingProvider = await CareProvider.findOne({
      user: req.user.id,
    });

    if (existingProvider) {
      return res.status(409).json({
        success: false,
        message: "Provider profile already exists",
      });
    }

    const provider = await CareProvider.create({
      user: req.user.id,
      name,
      phone,
      bio,
      experience,
      services,
    });

    return res.status(201).json({
      success: true,
      message: "Provider profile created successfully",
      data: sanitizeProvider(provider),
    });
  } catch (error) {
    console.error("Register provider error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Provider profile already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get All Providers
const getProviders = async (req, res) => {
  try {
    const providers = await CareProvider.find({
      status: "active",
    })
      .select(
        "name phone bio experience services availability status createdAt updatedAt"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: providers.length,
      data: providers,
    });
  } catch (error) {
    console.error("Get providers error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Provider By ID
const getProviderById = async (req, res) => {
  try {
    const provider = await CareProvider.findOne({
      _id: req.params.id,
      status: "active",
    }).select(
      "name phone bio experience services availability status createdAt updatedAt"
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error("Get provider error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get My Provider Profile
const getMyProviderProfile = async (req, res) => {
  try {
    const provider = await CareProvider.findOne({
      user: req.user.id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeProvider(provider),
    });
  } catch (error) {
    console.error("Get my provider profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update Provider Profile
const updateProviderProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      bio,
      experience,
      services,
    } = req.body;

    if (
      name === undefined &&
      phone === undefined &&
      bio === undefined &&
      experience === undefined &&
      services === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one profile field is required",
      });
    }

    if (phone !== undefined) {
      const phoneRegex = /^\d{10}$/;

      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be exactly 10 digits",
        });
      }
    }

    if (
      experience !== undefined &&
      (typeof experience !== "number" || experience < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Experience must be a non-negative number",
      });
    }

    if (services !== undefined && !Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        message: "Services must be an array",
      });
    }

    const updates = {};

    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (experience !== undefined) updates.experience = experience;
    if (services !== undefined) updates.services = services;

    const provider = await CareProvider.findOneAndUpdate(
      {
        user: req.user.id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Provider profile updated successfully",
      data: sanitizeProvider(provider),
    });
  } catch (error) {
    console.error("Update provider profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update Provider Availability
const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    if (typeof availability !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Availability must be true or false",
      });
    }

    const provider = await CareProvider.findOneAndUpdate(
      {
        user: req.user.id,
      },
      {
        availability,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: availability
        ? "Provider is now available"
        : "Provider is now unavailable",
      data: {
        availability: provider.availability,
      },
    });
  } catch (error) {
    console.error("Update provider availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  registerProvider,
  getProviders,
  getProviderById,
  getMyProviderProfile,
  updateProviderProfile,
  updateAvailability,
};
