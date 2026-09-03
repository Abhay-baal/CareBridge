const express = require("express");
const familyRoutes = require("./routes/familyRoutes");

const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

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
const bookingRoutes = require("./routes/bookingRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const supportRoutes = require("./routes/supportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Security Headers - Helmet
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://"],
    },
  })
);

// Global Rate Limiter - 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests from this IP, please try again later.",
  // CORS preflight requests should not consume API rate-limit quota
  skip: (req) => req.method === "OPTIONS",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Apply global rate limiter to all API routes
app.use("/api/", limiter);

// Stricter Rate Limiter - Authentication (5 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again after 15 minutes.",
  skip: (req) => req.method !== "POST", // Only count POST requests
});

// Apply auth limiter to authentication endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

const buildAllowedOrigins = () => {
  const configuredOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.8:3000",
    ...configuredOrigins,
  ];
};

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = buildAllowedOrigins();

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));

// HTTPS Enforcement - Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (!req.secure && req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

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
app.use("/api/family", familyRoutes);

app.use("/api/messages", messageRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);
module.exports = app;
