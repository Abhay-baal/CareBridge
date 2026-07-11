const express = require("express");

const authRoutes = require("./routes/authRoutes");

const app = express();

// Parse JSON request body
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 CareBridge Backend is Running");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CareBridge API is working",
  });
});

// Register auth routes
app.use("/api/auth", authRoutes);

module.exports = app;