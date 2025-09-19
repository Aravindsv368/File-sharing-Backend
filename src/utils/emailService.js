const nodemailer = require("nodemailer");
const mockEmailService = require("./mockEmailService");
const logger = require("./logger");

// Determine if we should use mock email service
const useMockEmail = () => {
  return (
    process.env.NODE_ENV === "development" && process.env.EMAIL_MODE === "mock"
  );
};

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  if (useMockEmail()) {
    return null; // We'll use mock service instead
  }

  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send OTP Email
exports.sendOTPEmail = async (email, otp, userName) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1>🏛️ Secure Government Document System</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2>Hello ${userName},</h2>
          <p>Thank you for registering with our Secure Government Document Management System.</p>
          <p>Please use the following OTP to verify your email address:</p>
          <div style="background-color: #1f2937; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This OTP is valid for 10 minutes only</li>
            <li>Do not share this OTP with anyone</li>
            <li>If you didn't request this, please ignore this email</li>
          </ul>
          <p>Best regards,<br>Secure Gov Docs Team</p>
        </div>
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const plainText = `
Hello ${userName},

Your OTP for Secure Government Document System is: ${otp}

This OTP is valid for 10 minutes only.
Do not share this OTP with anyone.

Best regards,
Secure Gov Docs Team
    `;

    if (useMockEmail()) {
      // Use mock email service
      await mockEmailService.sendEmail(
        email,
        "Email Verification - OTP",
        htmlContent,
        plainText
      );

      // Log OTP prominently for development
      console.log("\n🔐 OTP FOR TESTING 🔐");
      console.log(`Email: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log(`User: ${userName}`);
      console.log("Copy this OTP for verification\n");

      logger.info(`OTP generated for testing: ${otp} (email: ${email})`);
      return;
    }

    // Use real email service (original code)
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Secure Gov Docs" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email Verification - OTP",
      html: htmlContent,
      text: plainText,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent successfully to: ${email}`);
  } catch (error) {
    logger.error("Email sending error:", error);
    throw new Error("Failed to send OTP email");
  }
};

// Send Document Share Notification Email
exports.sendShareNotificationEmail = async (
  recipientEmail,
  senderName,
  documentTitle,
  shareMessage
) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
          <h1>📄 Document Shared</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2>Hello,</h2>
          <p><strong>${senderName}</strong> has shared a document with you on the Secure Government Document System.</p>
          <div style="background-color: #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Document: ${documentTitle}</h3>
            ${shareMessage ? `<p><em>"${shareMessage}"</em></p>` : ""}
          </div>
          <p>To view this document, please log in to your account on our platform.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.CLIENT_URL || "http://localhost:3000"
            }/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Document
            </a>
          </div>
          <p>Best regards,<br>Secure Gov Docs Team</p>
        </div>
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const plainText = `
Hello,

${senderName} has shared a document with you: ${documentTitle}

${shareMessage ? `Message: "${shareMessage}"` : ""}

Visit ${
      process.env.CLIENT_URL || "http://localhost:3000"
    }/dashboard to view the document.

Best regards,
Secure Gov Docs Team
    `;

    if (useMockEmail()) {
      // Use mock email service
      await mockEmailService.sendEmail(
        recipientEmail,
        "Document Shared With You",
        htmlContent,
        plainText
      );

      logger.info(`Mock share notification sent to: ${recipientEmail}`);
      return;
    }

    // Use real email service (original code)
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Secure Gov Docs" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: "Document Shared With You",
      html: htmlContent,
      text: plainText,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Share notification email sent to: ${recipientEmail}`);
  } catch (error) {
    logger.error("Share notification email error:", error);
    // Don't throw error as this is not critical
  }
};
