const crypto = require('crypto');

const generateOTP = () => {
  // FIX: Generates a cryptographically secure 6-digit number between 100000 and 999999
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
};

module.exports = generateOTP;