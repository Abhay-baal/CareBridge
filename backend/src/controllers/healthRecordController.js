const HealthRecord = require("../models/HealthRecord");
const cloudinary = require("../config/cloudinary");

const getParentId = (req) => req.user?.id || req.user?._id || req.user?.userId;

const getHealthRecords = async (req, res) => {
  try {
    const parentId = getParentId(req);

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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file",
      });
    }

    const parentId = getParentId(req);

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
    const parentId = getParentId(req);

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
      const resourceType = record.fileType === "application/pdf"
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
