const User = require("../models/User");
const logger = require("../utils/logger"); // This was missing
const path = require("path");
const fs = require("fs");

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    console.log("Update profile request:", {
      name,
      phone,
      address,
      userId: req.user.id,
    });

    // Validate input
    if (name && (name.trim().length < 2 || name.trim().length > 50)) {
      return res
        .status(400)
        .json({ message: "Name must be between 2 and 50 characters" });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone must be a 10-digit number" });
    }

    if (address && address.pincode && !/^\d{6}$/.test(address.pincode)) {
      return res
        .status(400)
        .json({ message: "Pincode must be a 6-digit number" });
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    console.log("Update data:", updateData);

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`Profile updated for user: ${user.email}`);

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        aadhaar: user.aadhaar,
        isVerified: user.isVerified,
        documentsCount: user.documentsCount,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    logger.error("Update profile error:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Upload Profile Picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const user = await User.findById(req.user.id);

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPath = path.join(__dirname, "../../", user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.profilePicture = req.file.path;
    await user.save();

    logger.info(`Profile picture updated for user: ${user.email}`);

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    logger.error("Upload profile picture error:", error);
    res.status(500).json({ message: "Failed to upload profile picture" });
  }
};
