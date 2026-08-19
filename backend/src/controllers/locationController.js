const Parent = require("../models/Parent");
const ParentChild = require("../models/ParentChild");

const getParentProfile = async (parentUserId) => {
  return Parent.findOne({
    user: parentUserId,
  }).populate("user", "fullName phone email");
};

const validateCoordinates = (latitude, longitude) => {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

const startSharing = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Only parents can share their location",
      });
    }

    const parent = await Parent.findOne({
      user: req.user.id,
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const { latitude, longitude, accuracy } = req.body;

    if (!validateCoordinates(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    parent.latitude = latitude;
    parent.longitude = longitude;
    parent.accuracy =
      typeof accuracy === "number" && Number.isFinite(accuracy)
        ? accuracy
        : null;
    parent.isSharing = true;
    parent.locationUpdatedAt = new Date();

    await parent.save();

    return res.status(200).json({
      success: true,
      message: "Location sharing started",
      data: {
        latitude: parent.latitude,
        longitude: parent.longitude,
        accuracy: parent.accuracy,
        isSharing: true,
        updatedAt: parent.locationUpdatedAt,
      },
    });
  } catch (error) {
    console.error("Start location sharing error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start location sharing",
    });
  }
};

const updateLocation = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Only parents can update their location",
      });
    }

    const parent = await Parent.findOne({
      user: req.user.id,
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    if (!parent.isSharing) {
      return res.status(400).json({
        success: false,
        message: "Location sharing is not active",
      });
    }

    const { latitude, longitude, accuracy } = req.body;

    if (!validateCoordinates(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    parent.latitude = latitude;
    parent.longitude = longitude;
    parent.accuracy =
      typeof accuracy === "number" && Number.isFinite(accuracy)
        ? accuracy
        : null;
    parent.locationUpdatedAt = new Date();

    await parent.save();

    return res.status(200).json({
      success: true,
      data: {
        latitude: parent.latitude,
        longitude: parent.longitude,
        accuracy: parent.accuracy,
        isSharing: true,
        updatedAt: parent.locationUpdatedAt,
      },
    });
  } catch (error) {
    console.error("Update location error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update location",
    });
  }
};

const stopSharing = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Only parents can stop location sharing",
      });
    }

    const parent = await Parent.findOne({
      user: req.user.id,
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    parent.isSharing = false;
    parent.locationUpdatedAt = new Date();

    await parent.save();

    return res.status(200).json({
      success: true,
      message: "Location sharing stopped",
      data: {
        isSharing: false,
        updatedAt: parent.locationUpdatedAt,
      },
    });
  } catch (error) {
    console.error("Stop location sharing error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to stop location sharing",
    });
  }
};

const getSharedLocation = async (req, res) => {
  try {
    let parentUserId;

    if (req.user.role === "parent") {
      parentUserId = req.user.id;
    } else if (req.user.role === "child") {
      const relationship = await ParentChild.findOne({
        child: req.user.id,
        active: true,
      });

      if (!relationship) {
        return res.status(404).json({
          success: false,
          message: "No active parent-child relationship found",
        });
      }

      parentUserId = relationship.parent;
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const parent = await getParentProfile(parentUserId);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        parentName: parent.user?.fullName,
        phone: parent.user?.phone,
        address: parent.address,
        latitude: parent.latitude ?? null,
        longitude: parent.longitude ?? null,
        accuracy: parent.accuracy ?? null,
        isSharing: parent.isSharing === true,
        updatedAt: parent.locationUpdatedAt ?? null,
      },
    });
  } catch (error) {
    console.error("Get shared location error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch shared location",
    });
  }
};

module.exports = {
  startSharing,
  updateLocation,
  stopSharing,
  getSharedLocation,
};
