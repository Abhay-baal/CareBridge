const express = require("express");
const cors = require("cors");

const parentRoutes = require("./routes/parentRoutes");
const carePlanRoutes = require("./routes/carePlanRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const authRoutes = require("./routes/authRoutes");
const childRoutes = require("./routes/childRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const emergencyEventRoutes = require("./routes/emergencyEventRoutes");
const locationRoutes = require("./routes/locationRoutes");
const healthRecordRoutes = require("./routes/healthRecordRoutes");
const parentChildRoutes = require("./routes/parentChildRoutes");
const messageRoutes = require("./routes/messageRoutes");
const providerRoutes = require("./routes/providerRoutes");

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
app.use("/api/emergency-events", emergencyEventRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/health-records", healthRecordRoutes);
app.use("/api/parent-child", parentChildRoutes);

app.use("/api/messages", messageRoutes);
app.use("/api/providers", providerRoutes);
module.exports = app;
