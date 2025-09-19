exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        phone,
        address,
      },
      { new: true, runValidators: true }
    );

    logger.info(`Profile updated for user: ${user.email}`);

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    logger.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
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
