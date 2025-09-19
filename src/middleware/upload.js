const multer = require("multer");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

// Create uploads directory if it doesn't exist
const uploadsDir = "./uploads";
const profileDir = "./uploads/profiles";
const documentsDir = "./uploads/documents";

[uploadsDir, profileDir, documentsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

// Storage configuration for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(`Invalid file type upload attempt: ${file.mimetype}`);
    cb(
      new Error(
        "Invalid file type. Only PDF, Word documents, and images are allowed."
      ),
      false
    );
  }
};

// File filter for profile pictures
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(`Invalid image type upload attempt: ${file.mimetype}`);
    cb(
      new Error("Invalid file type. Only JPEG, PNG images are allowed."),
      false
    );
  }
};

// Multer configuration for documents
const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
  fileFilter: documentFileFilter,
});

// Multer configuration for profile pictures
const uploadProfile = multer({
  storage: profileStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for profile pictures
  },
  fileFilter: imageFileFilter,
});

// Error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size too large" });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Unexpected file field" });
    }
  }
  console.log(error);

  // if (error.message) {
  //   return res.status(400).json({ message: error.message });
  // }

  next(error);
};

// Export middleware functions
exports.uploadFile = (req, res, next) => {
  uploadDocument.single("document")(req, res, (err) => {
    handleMulterError(err, req, res, next);
  });
};

exports.uploadProfileImage = (req, res, next) => {
  uploadProfile.single("profileImage")(req, res, (err) => {
    handleMulterError(err, req, res, next);
  });
};
