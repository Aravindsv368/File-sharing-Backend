const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Document title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  category: {
    type: String,
    required: [true, "Document category is required"],
    enum: [
      "education",
      "healthcare",
      "railway",
      "identity",
      "financial",
      "legal",
      "other",
    ],
  },
  type: {
    type: String,
    required: [true, "Document type is required"],
    enum: [
      "marksheet",
      "certificate",
      "pan_card",
      "aadhaar",
      "passport",
      "driving_license",
      "other",
    ],
  },
  fileName: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isShared: {
    type: Boolean,
    default: false,
  },
  sharedWith: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      sharedAt: {
        type: Date,
        default: Date.now,
      },
      permissions: {
        type: String,
        enum: ["view", "download"],
        default: "view",
      },
    },
  ],
  tags: [String],
  isArchived: {
    type: Boolean,
    default: false,
  },
  fileHash: String, // For integrity verification
  encryptionKey: String, // For file encryption (if implemented)
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
documentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
documentSchema.index({ uploadedBy: 1, category: 1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model("Document", documentSchema);
