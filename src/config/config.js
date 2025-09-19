module.exports = {
  // Database
  database: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/secure-gov-docs",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "your-super-secret-jwt-key",
    expiresIn: process.env.JWT_EXPIRE || "30d",
  },

  // Email
  email: {
    service: process.env.EMAIL_SERVICE || "gmail",
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  // File Upload
  upload: {
    path: process.env.UPLOAD_PATH || "./uploads",
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: {
      documents: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      images: ["image/jpeg", "image/png", "image/jpg"],
    },
  },

  // Server
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || "development",
  },

  // Client
  client: {
    url: process.env.CLIENT_URL || "http://localhost:3000",
  },

  // Security
  security: {
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // requests per window
    authRateLimitMax: 5, // auth requests per window
  },

  // OTP
  otp: {
    expiryMinutes: 10,
    length: 6,
  },
};
