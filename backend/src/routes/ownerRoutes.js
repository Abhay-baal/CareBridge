const express = require("express");
const rateLimit = require("express-rate-limit");
const { ownerLogin, verifyOwnerKey, getOwnerStats } = require("../controllers/ownerController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const ownerAuthLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: "draft-7",
	legacyHeaders: false,
	message: {
		success: false,
		message: "Too many owner authentication attempts. Please try again later.",
	},
});

router.post("/verify-key", ownerAuthLimiter, verifyOwnerKey);
router.post("/login", ownerAuthLimiter, ownerLogin);
router.get("/stats", authenticate, authorize("owner"), getOwnerStats);

module.exports = router;