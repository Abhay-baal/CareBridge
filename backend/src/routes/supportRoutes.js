const express = require("express");

const {
  createSupportTicket,
  getMySupportTickets,
} = require("../controllers/supportController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.post("/", createSupportTicket);
router.get("/mine", getMySupportTickets);

module.exports = router;
