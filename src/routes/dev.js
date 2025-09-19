const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Only enable in development
if (process.env.NODE_ENV !== "development") {
  module.exports = router;
  return;
}

// Get list of mock emails
router.get("/emails", (req, res) => {
  try {
    const emailsDir = path.join(__dirname, "../../emails");

    if (!fs.existsSync(emailsDir)) {
      return res.json({ emails: [] });
    }

    const files = fs
      .readdirSync(emailsDir)
      .filter((file) => file.endsWith(".html"))
      .map((file) => ({
        filename: file,
        created: fs.statSync(path.join(emailsDir, file)).birthtime,
        size: fs.statSync(path.join(emailsDir, file)).size,
      }))
      .sort((a, b) => b.created - a.created);

    res.json({ emails: files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// View specific email
router.get("/emails/:filename", (req, res) => {
  try {
    const emailsDir = path.join(__dirname, "../../emails");
    const filePath = path.join(emailsDir, req.params.filename);

    if (!fs.existsSync(filePath) || !req.params.filename.endsWith(".html")) {
      return res.status(404).json({ error: "Email not found" });
    }

    const content = fs.readFileSync(filePath, "utf8");
    res.send(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all mock emails
router.delete("/emails", (req, res) => {
  try {
    const emailsDir = path.join(__dirname, "../../emails");

    if (fs.existsSync(emailsDir)) {
      const files = fs.readdirSync(emailsDir);
      files.forEach((file) => {
        if (file.endsWith(".html")) {
          fs.unlinkSync(path.join(emailsDir, file));
        }
      });
    }

    res.json({ message: "All mock emails cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
