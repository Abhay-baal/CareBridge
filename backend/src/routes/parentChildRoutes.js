const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const {
  connectParent,
  getParents,
  removeParent,
  switchActiveParent,
} = require("../controllers/parentChildController");

router.use(
  authenticate,
  authorize("child")
);

router.post(
  "/connect",
  connectParent
);

router.get(
  "/",
  getParents
);

router.delete(
  "/:id",
  removeParent
);

router.patch(
  "/active/:id",
  switchActiveParent
);

module.exports = router;
