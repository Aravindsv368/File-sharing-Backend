const mongoose = require("mongoose");

const sharedDocumentSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  permissions: {
    type: String,
    enum: ["view", "download"],
    default: "view",
  },
  shareType: {
    type: String,
    enum: ["family", "temporary", "permanent"],
    default: "family",
  },
  expiresAt: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  accessCount: {
    type: Number,
    default: 0,
  },
  lastAccessed: Date,
  shareMessage: {
    type: String,
    maxlength: [200, "Share message cannot exceed 200 characters"],
  },
  relationshipType: {
    type: String,
    enum: ["father", "mother", "spouse", "child", "sibling", "other"],
    default: "other",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
sharedDocumentSchema.index({ sharedWith: 1, isActive: 1 });
sharedDocumentSchema.index({ sharedBy: 1, createdAt: -1 });
sharedDocumentSchema.index({ expiresAt: 1 });

// Remove expired shares
sharedDocumentSchema.statics.removeExpired = async function () {
  return await this.updateMany(
    { expiresAt: { $lt: new Date() } },
    { isActive: false }
  );
};

module.exports = mongoose.model("SharedDocument", sharedDocumentSchema);
