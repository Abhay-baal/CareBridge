const express = require("express");
const cors = require("cors");

const parentRoutes = require("./routes/parentRoutes");
const carePlanRoutes = require("./routes/carePlanRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const authRoutes = require("./routes/authRoutes");
const childRoutes = require("./routes/childRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const locationRoutes = require("./routes/locationRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

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

app.use("/api/auth", authRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/care-plans", carePlanRoutes);
app.use("/api/appointments", appointmentRoutes);

app.use("/api/child", childRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/location", locationRoutes);

module.exports = app;
