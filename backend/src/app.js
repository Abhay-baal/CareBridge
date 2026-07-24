const express = require("express");
const cors = require("cors");

const parentRoutes = require("./routes/parentRoutes");
const carePlanRoutes = require("./routes/carePlanRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Allow frontend to communicate with backend
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

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
app.use("/api/parents", parentRoutes);
app.use("/api/care-plans", carePlanRoutes);
app.use("/api/appointments", appointmentRoutes);

module.exports = app;