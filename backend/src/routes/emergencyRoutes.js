const express = require("express");

const router = express.Router();

const {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} = require("../controllers/emergencyController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

router.use(
  authenticate,
  authorize("parent", "child")
);

router.get("/", getContacts);

router.post("/", createContact);

router.put("/:id", updateContact);

router.delete("/:id", deleteContact);

module.exports = router;
