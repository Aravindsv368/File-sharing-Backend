const Document = require("../models/Document");
const SharedDocument = require("../models/SharedDocument");
const User = require("../models/User");
const logger = require("../utils/logger");

// Share Document
exports.shareDocument = async (req, res) => {
  try {
    const {
      documentId,
      shareWithEmail,
      permissions,
      relationshipType,
      shareMessage,
    } = req.body;

    // Find the document
    const document = await Document.findOne({
      _id: documentId,
      uploadedBy: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Find the user to share with
    const shareWithUser = await User.findOne({ email: shareWithEmail });
    if (!shareWithUser) {
      return res
        .status(404)
        .json({ message: "User not found with this email" });
    }

    if (shareWithUser._id.toString() === req.user.id) {
      return res
        .status(400)
        .json({ message: "Cannot share document with yourself" });
    }

    // Check if already shared
    const existingShare = await SharedDocument.findOne({
      document: documentId,
      sharedBy: req.user.id,
      sharedWith: shareWithUser._id,
      isActive: true,
    });

    if (existingShare) {
      return res
        .status(400)
        .json({ message: "Document already shared with this user" });
    }

    // Create share record
    const sharedDocument = await SharedDocument.create({
      document: documentId,
      sharedBy: req.user.id,
      sharedWith: shareWithUser._id,
      permissions: permissions || "view",
      relationshipType: relationshipType || "other",
      shareMessage,
    });

    // Update document's shared status
    await Document.findByIdAndUpdate(documentId, {
      isShared: true,
      $push: {
        sharedWith: {
          user: shareWithUser._id,
          permissions: permissions || "view",
        },
      },
    });

    logger.info(
      `Document shared: ${document.title} by ${req.user.email} with ${shareWithEmail}`
    );

    res.status(201).json({
      message: "Document shared successfully",
      sharedDocument,
    });
  } catch (error) {
    logger.error("Share document error:", error);
    res.status(500).json({
      message: "Failed to share document",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get Shared Documents (received)
exports.getSharedWithMe = async (req, res) => {
  try {
    const sharedDocuments = await SharedDocument.find({
      sharedWith: req.user.id,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .populate(
        "document",
        "title description category type originalName fileSize createdAt mimeType"
      )
      .populate("sharedBy", "name email")
      .sort({ createdAt: -1 });

    logger.info(
      `Shared documents retrieved for user ${req.user.email}: ${sharedDocuments.length} documents`
    );

    res.status(200).json({ sharedDocuments });
  } catch (error) {
    logger.error("Get shared documents error:", error);
    res.status(500).json({
      message: "Failed to retrieve shared documents",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get Documents I Shared
exports.getMySharedDocuments = async (req, res) => {
  try {
    const sharedDocuments = await SharedDocument.find({
      sharedBy: req.user.id,
    })
      .populate("document", "title description category type originalName")
      .populate("sharedWith", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ sharedDocuments });
  } catch (error) {
    logger.error("Get my shared documents error:", error);
    res.status(500).json({
      message: "Failed to retrieve shared documents",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Revoke Document Share
exports.revokeShare = async (req, res) => {
  try {
    const { shareId } = req.params;

    const sharedDocument = await SharedDocument.findOne({
      _id: shareId,
      sharedBy: req.user.id,
    });

    if (!sharedDocument) {
      return res.status(404).json({ message: "Shared document not found" });
    }

    sharedDocument.isActive = false;
    await sharedDocument.save();

    logger.info(`Document share revoked: ${shareId} by user ${req.user.email}`);

    res.status(200).json({ message: "Document share revoked successfully" });
  } catch (error) {
    logger.error("Revoke share error:", error);
    res.status(500).json({
      message: "Failed to revoke document share",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get shared document for viewing (by shared user)
exports.viewSharedDocument = async (req, res) => {
  try {
    const { shareId } = req.params;

    const sharedDocument = await SharedDocument.findOne({
      _id: shareId,
      sharedWith: req.user.id,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .populate("document")
      .populate("sharedBy", "name email");

    if (!sharedDocument) {
      return res
        .status(404)
        .json({ message: "Shared document not found or expired" });
    }

    // Update access count and last accessed
    sharedDocument.accessCount += 1;
    sharedDocument.lastAccessed = new Date();
    await sharedDocument.save();

    res.status(200).json({ sharedDocument });
  } catch (error) {
    logger.error("View shared document error:", error);
    res.status(500).json({
      message: "Failed to retrieve shared document",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
