const Document = require("../models/Document");
const User = require("../models/User");
const logger = require("../utils/logger");
const path = require("path");
const fs = require("fs");

// Upload Document
// Upload Document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, description, category, type, tags } = req.body;

    const document = await Document.create({
      title,
      description,
      category,
      type,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    });

    // Update user's document count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { documentsCount: 1 },
    });

    logger.info(
      `Document uploaded: ${document.title} by user ${req.user.email}`
    );

    res.status(201).json({
      message: "Document uploaded successfully",
      document: {
        id: document._id,
        title: document.title,
        description: document.description,
        category: document.category,
        type: document.type,
        fileName: document.fileName,
        originalName: document.originalName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        tags: document.tags,
        createdAt: document.createdAt,
        isShared: document.isShared,
      },
    });
  } catch (error) {
    logger.error("Document upload error:", error);
    res.status(500).json({
      message: "Document upload failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get User Documents - Fix the query and response
exports.getDocuments = async (req, res) => {
  try {
    const { category, type, page = 1, limit = 12, search } = req.query;

    const query = {
      uploadedBy: req.user.id,
      isArchived: false,
    };

    if (category) query.category = category;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-filePath"); // Don't expose file paths

    const total = await Document.countDocuments(query);

    logger.info(
      `Documents retrieved for user ${req.user.email}: ${documents.length} documents`
    );

    res.status(200).json({
      documents,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    logger.error("Get documents error:", error);
    res.status(500).json({
      message: "Failed to retrieve documents",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
// Get Single Document
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
    }).populate("uploadedBy", "name email");

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    logger.info(
      `Document accessed: ${document.title} by user ${req.user.email}`
    );

    res.status(200).json({ document });
  } catch (error) {
    logger.error("Get document error:", error);
    res.status(500).json({ message: "Failed to retrieve document" });
  }
};

// Download Document
exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const filePath = path.join(__dirname, "../../", document.filePath);

    if (!fs.existsSync(filePath)) {
      logger.error(`File not found on disk: ${filePath}`);
      return res.status(404).json({ message: "File not found on server" });
    }

    logger.info(
      `Document downloaded: ${document.title} by user ${req.user.email}`
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.originalName}"`
    );
    res.setHeader("Content-Type", document.mimeType);

    res.sendFile(filePath);
  } catch (error) {
    logger.error("Download document error:", error);
    res.status(500).json({ message: "Failed to download document" });
  }
};

// Update Document
exports.updateDocument = async (req, res) => {
  try {
    const { title, description, category, type, tags } = req.body;

    const document = await Document.findOneAndUpdate(
      {
        _id: req.params.id,
        uploadedBy: req.user.id,
      },
      {
        title,
        description,
        category,
        type,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    logger.info(
      `Document updated: ${document.title} by user ${req.user.email}`
    );

    res.status(200).json({
      message: "Document updated successfully",
      document,
    });
  } catch (error) {
    logger.error("Update document error:", error);
    res.status(500).json({ message: "Failed to update document" });
  }
};

// Delete Document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, "../../", document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete document from database
    await Document.findByIdAndDelete(req.params.id);

    // Update user's document count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { documentsCount: -1 },
    });

    logger.info(
      `Document deleted: ${document.title} by user ${req.user.email}`
    );

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    logger.error("Delete document error:", error);
    res.status(500).json({ message: "Failed to delete document" });
  }
};
