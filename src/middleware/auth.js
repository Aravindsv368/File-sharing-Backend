const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      if (!req.user.isVerified) {
        return res.status(401).json({ message: "Account not verified" });
      }

      next();
    } catch (error) {
      logger.error("Token verification failed:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } catch (error) {
    logger.error("Auth middleware error:", error);
    res.status(500).json({ message: "Server error in authentication" });
  }
};
