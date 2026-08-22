const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, maxlength: 100 },
  url: { type: String, required: true, maxlength: 1000 }
}, { _id: false }); 

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 100 },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 30 },
  password: { type: String, required: true },
  
  role: { type: String, default: 'user' },
  
  isVerified: { type: Boolean, default: false },

  // Note: otp aur otpExpires ko completely hata diya gya hai

  avatar: { type: String, default: '' },
  typedText: { type: String, default: 'MERN Stack Developer, Full Stack Developer', maxlength: 300 },
  resumeLink: { type: String, default: '' },
  resumeName: { type: String, default: '' },
  
  links: [linkSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);