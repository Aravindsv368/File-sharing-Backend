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

// Routes
router.post("/document", shareValidation, validate, shareDocument);
router.get("/received", getSharedWithMe);
router.get("/sent", getMySharedDocuments);
router.delete("/:shareId", revokeShare);

module.exports = router;
