const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { connectDB } = require("./utils/database");
const logger = require("./utils/logger");
const loggerMiddleware = require("./middleware/logger");

// Import routes
const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const userRoutes = require("./routes/users");
const shareRoutes = require("./routes/share"); // Make sure this is imported

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// CORS Configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : "http://localhost:3000",
    credentials: true,
  })
);

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased from 5 to 50 for development
  message: "Too many authentication attempts, please try again later.",
});
app.use("/api/auth", authLimiter);

// Body Parser Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging Middleware
app.use(loggerMiddleware);

// Static Files
app.use("/uploads", express.static("uploads"));

// Routes - MAKE SURE ALL ROUTES ARE REGISTERED
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/share", shareRoutes); // THIS MUST BE PRESENT

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// 404 Handler
app.use("/", (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error("Global error handler:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  });
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  mongoose.connection.close(() => {
    logger.info("MongoDB connection closed.");
    process.exit(0);
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`🚀 Server running on port ${PORT}`);
});
