const express = require("express");
const { body } = require("express-validator");
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("aadhaar")
    .isLength({ min: 12, max: 12 })
    .isNumeric()
    .withMessage("Aadhaar must be a 12-digit number"),
  body("phone")
    .isLength({ min: 10, max: 10 })
    .isNumeric()
    .withMessage("Phone must be a 10-digit number"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const otpValidation = [
  body("userId").notEmpty().withMessage("User ID is required"),
  body("otp")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be a 6-digit number"),
];

// Routes
router.post("/register", registerValidation, validate, register);
router.post("/verify-otp", otpValidation, validate, verifyOTP);
router.post("/resend-otp", body("userId").notEmpty(), validate, resendOTP);
router.post("/login", loginValidation, validate, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

module.exports = router;
