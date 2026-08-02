const express = require("express");

const {
  getHealthRecords,
  uploadHealthRecord,
  deleteHealthRecord,
} = require("../controllers/healthRecordController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");

const router = express.Router();

// Parent and child can view records.
router.get(
  "/",
  authenticate,
  authorize("parent", "child"),
  getHealthRecords
);

// Only parent can upload.
router.post(
  "/",
  authenticate,
  authorize("parent"),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error(
          "MULTER/CLOUDINARY UPLOAD ERROR:",
          err
        );

        return res.status(400).json({
          success: false,
          message:
            err.message || "Unable to upload file",
        });
      }

      next();
    });
  },
  uploadHealthRecord
);

// Parent and child can delete only if you intentionally
// want children to have delete permission.
// Keeping existing behavior for now.
router.delete(
  "/:id",
  authenticate,
  authorize("parent", "child"),
  deleteHealthRecord
);

module.exports = router;
