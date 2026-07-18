const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected route
router.get("/me", authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

// Parent-only route
router.get(
  "/parent-dashboard",
  authenticate,
  authorize("parent"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Parent",
    });
  }
);

module.exports = router;