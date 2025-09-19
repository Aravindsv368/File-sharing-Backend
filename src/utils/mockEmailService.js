const fs = require("fs");
const path = require("path");
const logger = require("./logger");

class MockEmailService {
  constructor() {
    // Create emails directory if it doesn't exist
    this.emailsDir = path.join(__dirname, "../../emails");
    if (!fs.existsSync(this.emailsDir)) {
      fs.mkdirSync(this.emailsDir, { recursive: true });
    }
  }

  async sendEmail(to, subject, htmlContent, plainText = "") {
    const timestamp = new Date().toISOString();
    const fileName = `email_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}.html`;
    const filePath = path.join(this.emailsDir, fileName);

    // Email content for file
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { background: #e5e7eb; padding: 10px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 Mock Email Service</h1>
    </div>
    <div class="content">
        <p><strong>To:</strong> ${to}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Sent:</strong> ${timestamp}</p>
        <hr>
        ${htmlContent}
    </div>
    <div class="footer">
        <p>This is a development email. In production, this would be sent via real email service.</p>
    </div>
</body>
</html>
    `;

    try {
      // Save email to file
      if (process.env.LOG_EMAILS_TO_FILE === "true") {
        fs.writeFileSync(filePath, emailContent);
      }

      // Log email to console with styling
      console.log("\n" + "=".repeat(80));
      console.log("📧 MOCK EMAIL SENT");
      console.log("=".repeat(80));
      console.log(`📬 To: ${to}`);
      console.log(`📋 Subject: ${subject}`);
      console.log(`⏰ Time: ${timestamp}`);
      console.log(`📁 Saved to: ${fileName}`);
      console.log("-".repeat(80));
      console.log("📄 Content:");
      console.log(plainText || "Check HTML file for full content");
      console.log("=".repeat(80) + "\n");

      // Log to application logger
      logger.info("Mock email sent", {
        to,
        subject,
        timestamp,
        fileName,
      });

      return {
        messageId: `mock_${Date.now()}`,
        accepted: [to],
        response: "Mock email sent successfully",
      };
    } catch (error) {
      logger.error("Mock email service error:", error);
      throw new Error("Failed to send mock email");
    }
  }
}

module.exports = new MockEmailService();
