const EmergencyEvent = require("../models/EmergencyEvent");
const ParentChild = require("../models/ParentChild");
const User = require("../models/User");

const getActiveRelationship = async (userId) => {
  return ParentChild.findOne({
    active: true,
    $or: [
      { parent: userId },
      { child: userId },
    ],
  });
};

const createSOS = async (req, res) => {
  try {
    const relationship = await getActiveRelationship(req.user.id);

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "No active parent-child relationship found",
      });
    }

    const parent = await User.findOne({
      _id: relationship.parent,
      role: "parent",
    });

    const child = await User.findOne({
      _id: relationship.child,
      role: "child",
    });

    if (!parent || !child) {
      return res.status(403).json({
        success: false,
        message: "Invalid parent-child relationship",
      });
    }

    const {
      latitude,
      longitude,
      address,
      message,
    } = req.body;

    if (
      latitude !== undefined &&
      latitude !== null &&
      typeof latitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be a number",
      });
    }

    if (
      longitude !== undefined &&
      longitude !== null &&
      typeof longitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be a number",
      });
    }

    const emergencyEvent = await EmergencyEvent.create({
      parent: parent._id,
      child: child._id,
      triggeredBy: req.user.id,
      relationship: relationship._id,
      status: "ACTIVE",
      latitude:
        typeof latitude === "number" ? latitude : null,
      longitude:
        typeof longitude === "number" ? longitude : null,
      address: address || "",
      message: message || "Emergency SOS triggered",
    });

    const populatedEvent = await EmergencyEvent.findById(
      emergencyEvent._id
    )
      .populate("parent", "fullName phone email")
      .populate("child", "fullName phone email")
      .populate("triggeredBy", "fullName role")
      .populate("relationship");

    return res.status(201).json({
      success: true,
      message: "SOS emergency created successfully",
      data: populatedEvent,
    });
  } catch (error) {
    console.error("Create SOS error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create emergency SOS",
    });
  }
};

const getEmergencyHistory = async (req, res) => {
  try {
    const relationship = await getActiveRelationship(req.user.id);

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "No active parent-child relationship found",
      });
    }

    const events = await EmergencyEvent.find({
      relationship: relationship._id,
    })
      .populate("parent", "fullName phone email")
      .populate("child", "fullName phone email")
      .populate("triggeredBy", "fullName role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Emergency history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch emergency history",
    });
  }
};

const acknowledgeEmergency = async (req, res) => {
  try {
    const relationship = await getActiveRelationship(req.user.id);

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "No active parent-child relationship found",
      });
    }

    const emergencyEvent = await EmergencyEvent.findOne({
      _id: req.params.id,
      relationship: relationship._id,
    });

    if (!emergencyEvent) {
      return res.status(404).json({
        success: false,
        message: "Emergency event not found",
      });
    }

    if (emergencyEvent.status === "RESOLVED") {
      return res.status(400).json({
        success: false,
        message: "Resolved emergency cannot be acknowledged",
      });
    }

    emergencyEvent.status = "ACKNOWLEDGED";

    await emergencyEvent.save();

    const populatedEvent = await EmergencyEvent.findById(
      emergencyEvent._id
    )
      .populate("parent", "fullName phone email")
      .populate("child", "fullName phone email")
      .populate("triggeredBy", "fullName role");

    return res.status(200).json({
      success: true,
      message: "Emergency acknowledged",
      data: populatedEvent,
    });
  } catch (error) {
    console.error("Acknowledge emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to acknowledge emergency",
    });
  }
};

const resolveEmergency = async (req, res) => {
  try {
    const relationship = await getActiveRelationship(req.user.id);

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: "No active parent-child relationship found",
      });
    }

    const emergencyEvent = await EmergencyEvent.findOne({
      _id: req.params.id,
      relationship: relationship._id,
    });

    if (!emergencyEvent) {
      return res.status(404).json({
        success: false,
        message: "Emergency event not found",
      });
    }

    if (emergencyEvent.status === "RESOLVED") {
      return res.status(400).json({
        success: false,
        message: "Emergency is already resolved",
      });
    }

    emergencyEvent.status = "RESOLVED";
    emergencyEvent.resolvedAt = new Date();

    await emergencyEvent.save();

    const populatedEvent = await EmergencyEvent.findById(
      emergencyEvent._id
    )
      .populate("parent", "fullName phone email")
      .populate("child", "fullName phone email")
      .populate("triggeredBy", "fullName role");

    return res.status(200).json({
      success: true,
      message: "Emergency resolved",
      data: populatedEvent,
    });
  } catch (error) {
    console.error("Resolve emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to resolve emergency",
    });
  }
};

module.exports = {
  createSOS,
  getEmergencyHistory,
  acknowledgeEmergency,
  resolveEmergency,
};
