const express = require("express");
const { body } = require("express-validator");
const {
  uploadDocument,
  getDocuments,
  getDocument,
  downloadDocument,
  updateDocument,
  deleteDocument,
} = require("../controllers/documentController");
const { protect } = require("../middleware/auth");
const { uploadFile } = require("../middleware/upload");
const { validate } = require("../middleware/validation");

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation rules
const documentValidation = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),
  body("category")
    .isIn([
      "education",
      "healthcare",
      "railway",
      "identity",
      "financial",
      "legal",
      "other",
    ])
    .withMessage("Invalid category"),
  body("type")
    .isIn([
      "marksheet",
      "certificate",
      "pan_card",
      "aadhaar",
      "passport",
      "driving_license",
      "other",
    ])
    .withMessage("Invalid document type"),
];

// Routes
router.post(
  "/upload",
  uploadFile,
  documentValidation,
  validate,
  uploadDocument
);
router.get("/", getDocuments);
router.get("/:id", getDocument);
router.get("/:id/download", downloadDocument);
router.put("/:id", documentValidation, validate, updateDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
