const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("🚀 CareBridge Backend is Running");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CareBridge API is working",
  });
});

module.exports = app;