const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");
const { sendOTPEmail } = require("../utils/emailService");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, aadhaar, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { aadhaar }],
    });

    if (existingUser) {
      logger.warn(`Registration attempt with existing credentials: ${email}`);
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Aadhaar already registered",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      aadhaar,
      phone,
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP Email
    await sendOTPEmail(user.email, otp, user.name);

    logger.info(`User registered successfully: ${user.email}`);

    // Response object
    const response = {
      message:
        "User registered successfully. Please verify your email with OTP.",
      userId: user._id,
    };

    // In development, include OTP in response for easy testing
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SHOW_OTP_IN_RESPONSE === "true"
    ) {
      response.developmentOTP = otp;
      response.note = "OTP included for development testing only";
    }

    res.status(201).json(response);
  } catch (error) {
    logger.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (!user.verifyOTP(otp)) {
      logger.warn(`Invalid OTP attempt for user: ${user.email}`);
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Update user verification status
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User verified successfully: ${user.email}`);

    res.status(200).json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        aadhaar: user.aadhaar,
        phone: user.phone,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    logger.error("OTP verification error:", error);
    res
      .status(500)
      .json({ message: "OTP verification failed", error: error.message });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP Email
    await sendOTPEmail(user.email, otp, user.name);

    logger.info(`OTP resent to user: ${user.email}`);

    // Response object
    const response = {
      message: "OTP sent successfully",
    };

    // In development, include OTP in response for easy testing
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SHOW_OTP_IN_RESPONSE === "true"
    ) {
      response.developmentOTP = otp;
      response.note = "OTP included for development testing only";
    }

    res.status(200).json(response);
  } catch (error) {
    logger.error("Resend OTP error:", error);
    res
      .status(500)
      .json({ message: "Failed to resend OTP", error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user (include password field)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is verified
    if (!user.isVerified) {
      logger.warn(`Login attempt with unverified account: ${email}`);
      return res.status(400).json({
        message: "Please verify your email first",
        userId: user._id,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`Invalid password attempt for user: ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User logged in successfully: ${user.email}`);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        aadhaar: user.aadhaar,
        phone: user.phone,
        isVerified: user.isVerified,
        documentsCount: user.documentsCount,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// Logout User (Client-side token removal, but log the action)
exports.logout = async (req, res) => {
  try {
    logger.info(`User logged out: ${req.user.email}`);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};

// Get Current User
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        aadhaar: user.aadhaar,
        phone: user.phone,
        address: user.address,
        isVerified: user.isVerified,
        documentsCount: user.documentsCount,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    logger.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user data" });
  }
};
