const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const {
  getParents,
  removeParent,
  switchActiveParent,
} = require("../controllers/parentChildController");

// Authentication for all routes
router.use(authenticate);

// Parent + Child can read their relationships
router.get(
  "/",
  authorize("parent", "child"),
  getParents
);

// Child-only relationship management

router.delete(
  "/:id",
  authorize("child"),
  removeParent
);

router.patch(
  "/active/:id",
  authorize("child"),
  switchActiveParent
);

module.exports = router;
