const HealthRecord = require("../models/HealthRecord");
const Parent = require("../models/Parent");
const ParentChild = require("../models/ParentChild");
const cloudinary = require("../config/cloudinary");

const getParentProfileId = async (req) => {
  // Parent account
  if (req.user.role === "parent") {
    const parent = await Parent.findOne({
      user: req.user.id,
    });

    return parent?._id || null;
  }

  // Child account using active parent.
  if (req.user.role === "child") {
    const activeRelationship = await ParentChild.findOne({
      child: req.user.id,
      active: true,
    });

    if (activeRelationship) {
      const parent = await Parent.findOne({
        user: activeRelationship.parent,
      });

      if (parent) {
        return parent._id;
      }
    }

    // Backward compatibility with old child accounts.
    if (req.user.parent) {
      const parent = await Parent.findOne({
        user: req.user.parent,
      });

      return parent?._id || null;
    }
  }

  return null;
};

const getHealthRecords = async (req, res) => {
  try {
    const parentId = await getParentProfileId(req);

    if (!parentId) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const records = await HealthRecord.find({
      parent: parentId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Health records fetched successfully",
      data: records,
    });
  } catch (error) {
    console.error("Get health records error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch health records",
    });
  }
};

const uploadHealthRecord = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Only parents can upload health records",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file",
      });
    }

    const parentId = await getParentProfileId(req);

    if (!parentId) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const record = await HealthRecord.create({
      parent: parentId,
      title: req.body.title,
      category: req.body.category,
      fileUrl: req.file.path,
      publicId: req.file.filename || req.file.public_id,
      fileType: req.file.mimetype,
      originalName: req.file.originalname,
    });

    return res.status(201).json({
      success: true,
      message: "Report uploaded successfully",
      data: record,
    });
  } catch (error) {
    console.error("Upload health record error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to upload report",
    });
  }
};

const deleteHealthRecord = async (req, res) => {
  try {
    const parentId = await getParentProfileId(req);

    if (!parentId) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    const record = await HealthRecord.findOne({
      _id: req.params.id,
      parent: parentId,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Health record not found",
      });
    }

    try {
      const resourceType =
        record.fileType === "application/pdf"
          ? "raw"
          : "image";

      await cloudinary.uploader.destroy(record.publicId, {
        resource_type: resourceType,
      });
    } catch (cloudinaryError) {
      console.error(
        "Cloudinary delete error:",
        cloudinaryError
      );

      return res.status(500).json({
        success: false,
        message: "Unable to delete report from storage",
      });
    }

    await HealthRecord.findByIdAndDelete(record._id);

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Delete health record error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete report",
    });
  }
};

module.exports = {
  getHealthRecords,
  uploadHealthRecord,
  deleteHealthRecord,
};
