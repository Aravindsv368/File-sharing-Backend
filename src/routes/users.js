const express = require("express");
const { body } = require("express-validator");
const {
  updateProfile,
  uploadProfilePicture,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { uploadProfileImage } = require("../middleware/upload");
const { validate } = require("../middleware/validation");

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation rules
const profileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .isLength({ min: 10, max: 10 })
    .isNumeric()
    .withMessage("Phone must be a 10-digit number"),
  body("address.pincode")
    .optional()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Pincode must be a 6-digit number"),
];

// Routes
router.put("/profile", profileValidation, validate, updateProfile);
router.post("/profile-picture", uploadProfileImage, uploadProfilePicture);

module.exports = router;
