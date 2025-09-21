const express = require("express");
const { body } = require("express-validator");
const {
  shareDocument,
  getSharedWithMe,
  getMySharedDocuments,
  revokeShare,
} = require("../controllers/shareController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation rules
const shareValidation = [
  body("documentId").notEmpty().withMessage("Document ID is required"),
  body("shareWithEmail")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("permissions")
    .optional()
    .isIn(["view", "download"])
    .withMessage("Invalid permissions"),
  body("relationshipType")
    .optional()
    .isIn(["father", "mother", "spouse", "child", "sibling", "other"])
    .withMessage("Invalid relationship type"),
  body("shareMessage")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Share message cannot exceed 200 characters"),
];

// Add this route to the existing share routes
router.get("/:shareId/download", async (req, res) => {
  try {
    const { shareId } = req.params;

    const sharedDocument = await SharedDocument.findOne({
      _id: shareId,
      sharedWith: req.user.id,
      isActive: true,
      expiresAt: { $gt: new Date() },
      permissions: "download", // Only allow download if permission is granted
    }).populate("document");

    if (!sharedDocument) {
      return res.status(404).json({
        message: "Shared document not found or download not permitted",
      });
    }

    const filePath = path.join(
      __dirname,
      "../../",
      sharedDocument.document.filePath
    );

    if (!fs.existsSync(filePath)) {
      logger.error(`Shared file not found on disk: ${filePath}`);
      return res.status(404).json({ message: "File not found on server" });
    }

    // Update access count
    sharedDocument.accessCount += 1;
    sharedDocument.lastAccessed = new Date();
    await sharedDocument.save();

    logger.info(
      `Shared document downloaded: ${sharedDocument.document.title} by user ${req.user.email}`
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sharedDocument.document.originalName}"`
    );
    res.setHeader("Content-Type", sharedDocument.document.mimeType);

    res.sendFile(filePath);
  } catch (error) {
    logger.error("Download shared document error:", error);
    res.status(500).json({ message: "Failed to download document" });
  }
});

// Routes
router.post("/document", shareValidation, validate, shareDocument);
router.get("/received", getSharedWithMe);
router.get("/sent", getMySharedDocuments);
router.delete("/:shareId", revokeShare);

module.exports = router;
