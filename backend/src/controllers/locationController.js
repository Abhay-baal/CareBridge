const Parent = require("../models/Parent");
const ParentChild = require("../models/ParentChild");

const getRelationshipForUser = async (req) => {
  return ParentChild.findOne({
    active: true,
    $or: [
      { parent: req.user.id },
      { child: req.user.id },
    ],
  });
};

const getParentProfile = async (parentUserId) => {
  return Parent.findOne({
    user: parentUserId,
  }).populate(
    "user",
    "fullName phone email"
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

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    parent.latitude = latitude;
    parent.longitude = longitude;
    parent.accuracy =
      typeof accuracy === "number" ? accuracy : null;
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
        isSharing: parent.isSharing,
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

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    parent.latitude = latitude;
    parent.longitude = longitude;
    parent.accuracy =
      typeof accuracy === "number" ? accuracy : null;
    parent.locationUpdatedAt = new Date();

    await parent.save();

    return res.status(200).json({
      success: true,
      data: {
        latitude: parent.latitude,
        longitude: parent.longitude,
        accuracy: parent.accuracy,
        isSharing: parent.isSharing,
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
    const relationship = await getRelationshipForUser(req);

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "No active parent-child relationship found",
      });
    }

    const parent = await getParentProfile(
      relationship.parent
    );

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
        latitude: parent.latitude || null,
        longitude: parent.longitude || null,
        accuracy: parent.accuracy || null,
        isSharing: parent.isSharing || false,
        updatedAt: parent.locationUpdatedAt || null,
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
