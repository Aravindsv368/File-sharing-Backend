const crypto = require("crypto");

class OTPService {
  // Generate a 6-digit OTP
  static generate() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Hash OTP for storage
  static hash(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  // Verify OTP
  static verify(candidateOTP, hashedOTP) {
    const candidateHash = this.hash(candidateOTP);
    return candidateHash === hashedOTP;
  }

  // Check if OTP is expired
  static isExpired(expiryDate) {
    return new Date() > expiryDate;
  }
}

module.exports = OTPService;
