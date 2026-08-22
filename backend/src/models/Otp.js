const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  // FIX 5: 60 Seconds TTL set
  createdAt: { type: Date, default: Date.now, expires: 60 } 
});

module.exports = mongoose.model('Otp', otpSchema);