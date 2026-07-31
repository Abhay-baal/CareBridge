const express = require("express");

const {
  getHealthRecords,
  uploadHealthRecord,
  deleteHealthRecord,
} = require("../controllers/healthRecordController");

const { authenticate } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", authenticate, getHealthRecords);

router.post(
  "/",
  authenticate,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("MULTER/CLOUDINARY UPLOAD ERROR:", err);

        return res.status(400).json({
          success: false,
          message: err.message || "Unable to upload file",
        });
      }

      next();
    });
  },
  uploadHealthRecord
);

router.delete("/:id", authenticate, deleteHealthRecord);

module.exports = router;
