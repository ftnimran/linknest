const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../config/mailer');
const generateOTP = require('../utils/generateOTP');

const OTP_EXPIRY_MS = 60 * 1000; 

const RESERVED_USERNAMES = ['admin', 'login', 'dashboard', 'api', 'profile', 'settings', 'auth', 'home'];

const validatePassword = (password) => {
  if (!password || String(password).length < 8) return false;
  const passStr = String(password);
  const hasUpper = /[A-Z]/.test(passStr);
  const hasLower = /[a-z]/.test(passStr);
  const hasNumber = /[0-9]/.test(passStr);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(passStr);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

// ==========================================
// 🎨 LINKNEST-STYLE HTML EMAIL TEMPLATE
// ==========================================
const getEmailTemplate = (otp, type, name = 'User') => {
  const isSignup = type === 'signup';
  
  const actionText = isSignup 
    ? 'verify your email address to create your LinkNest account' 
    : 'reset the password for your LinkNest account';
    
  const ignoreText = isSignup
    ? 'If you did not attempt to sign up, please ignore this email.'
    : 'If you did not request a password reset, please ignore this email or contact support if you have concerns.';

  // FIX: Removed JavaScript space logic. We will rely ONLY on CSS letter-spacing for a clean look.
  
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: Arial, sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table border="0" cellspacing="0" cellpadding="0" style="max-width: 550px; width: 100%; background-color: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #eaeaea; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: center;">
            
            <!-- Header -->
            <tr>
              <td>
                <h1 style="color: #4F46E5; margin: 0; font-size: 28px; letter-spacing: 1px;">LinkNest</h1>
                <p style="color: #888888; letter-spacing: 1.5px; font-size: 11px; text-transform: uppercase; margin-top: 5px; margin-bottom: 25px;">
                  One Link For Everything
                </p>
                <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 0 0 25px 0;" />
              </td>
            </tr>
            
            <!-- Body -->
            <tr>
              <td style="text-align: left; color: #444444; font-size: 15px; line-height: 1.6;">
                <p style="font-weight: bold; color: #222222; font-size: 16px; margin-top: 0;">Hello ${name},</p>
                <p>We received a request to ${actionText}.</p>
                <p>Please use the following One-Time Password (OTP) to proceed. For your security, this code will expire in <strong style="color: #E53E3E;">1 minute</strong>.</p>
                
                <!-- OTP Box -->
                <div style="text-align: center; margin: 40px 0;">
                  <!-- CSS 'letter-spacing: 12px' will naturally give the perfect gap between numbers -->
                  <div style="display: inline-block; border: 2px dashed #4F46E5; border-radius: 8px; padding: 15px 30px; font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 12px; background-color: #fcfcff;">
                    ${otp}
                  </div>
                </div>
                
                <p style="font-size: 13px; color: #777777; margin-bottom: 0;">${ignoreText}</p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td>
                <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 30px 0 20px 0;" />
                <div style="font-size: 11px; color: #aaaaaa; line-height: 1.5;">
                  <p style="margin: 2px 0;">&copy; ${new Date().getFullYear()} Imran Ali. All rights reserved.</p>
                  <p style="margin: 2px 0;">This is an automated security message, please do not reply.</p>
                </div>
              </td>
            </tr>
            
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

// ==========================================
// 🚀 AUTH CONTROLLERS
// ==========================================

const register = async (req, res) => {
  const cleanEmail = req.body.email ? String(req.body.email).toLowerCase().trim() : undefined;
  const cleanUsername = req.body.username ? String(req.body.username).toLowerCase().replace(/[^a-z0-9_]/g, '') : undefined;
  const password = req.body.password ? String(req.body.password) : undefined;
  const name = req.body.name ? String(req.body.name).trim() : undefined;

  try {
    if (!name || !cleanEmail || !cleanUsername || !password) {
      return res.status(400).json({ message: 'All valid fields are required.' });
    }

    if (RESERVED_USERNAMES.includes(cleanUsername)) {
      return res.status(400).json({ message: 'This username is reserved and cannot be used.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be min 8 chars long with A-Z, a-z, 0-9, and a special char (!@#$%^&*).' });
    }

    let existingUser = await User.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or Username is already taken!' });
    }

    const otp = generateOTP();

    await Otp.deleteOne({ email: cleanEmail });
    await Otp.create({ email: cleanEmail, otp });

    try {
      const plainText = `Your Signup OTP is: ${otp}. It will expire in 1 minute.`;
      const htmlContent = getEmailTemplate(otp, 'signup', name);
      
      await sendEmail(cleanEmail, 'LinkNest - Verify Your Account', plainText, htmlContent);
    } catch (mailError) {
      console.error('Mailer failed:', mailError.message);
      return res.status(500).json({ message: 'Failed to send OTP email. Please check your email configuration.' });
    }

    res.status(200).json({ message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

const verifySignupOtp = async (req, res) => {
  try {
    const cleanEmail = req.body.email ? String(req.body.email).toLowerCase().trim() : undefined;
    const cleanUsername = req.body.username ? String(req.body.username).toLowerCase().replace(/[^a-z0-9_]/g, '') : undefined;
    const password = req.body.password ? String(req.body.password) : undefined;
    const name = req.body.name ? String(req.body.name).trim() : undefined;
    const otp = req.body.otp ? String(req.body.otp).trim() : undefined;

    if (!name || !cleanEmail || !cleanUsername || !password || !otp) {
      return res.status(400).json({ message: 'Missing data! Please try signing up again.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Security Policy: Weak Password detected.' });
    }

    const otpRecord = await Otp.findOne({ email: cleanEmail });
    
    if (!otpRecord || (Date.now() - new Date(otpRecord.createdAt).getTime() > OTP_EXPIRY_MS)) {
      return res.status(400).json({ message: 'OTP expired or not found. Please click Resend OTP.' });
    }
    
    if (String(otpRecord.otp) !== otp) {
      return res.status(400).json({ message: 'Invalid OTP! Please check and try again.' });
    }

    const existingUser = await User.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or Username got taken just now. Try another.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name: name.replace(/[<>]/g, ''), 
      email: cleanEmail,
      username: cleanUsername,
      password: hashedPassword,
      isVerified: true
    });

    await Otp.deleteOne({ email: cleanEmail });

    res.status(200).json({ message: 'Account verified and created successfully!' });
  } catch (error) {
    console.error('Signup Verification Error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

const login = async (req, res) => {
  const email = req.body.email ? String(req.body.email).toLowerCase().trim() : undefined;
  const password = req.body.password ? String(req.body.password) : undefined;

  try {
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Account not found' });
    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    await Otp.deleteOne({ email });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, role: user.role, username: user.username, message: 'Logged in successfully' });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

const forgotPassword = async (req, res) => {
  const email = req.body.email ? String(req.body.email).toLowerCase().trim() : undefined;

  try {
    if (!email) return res.status(400).json({ message: 'Email required' });

    let user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not registered' });

    const otp = generateOTP();
    
    await Otp.deleteOne({ email });
    await Otp.create({ email, otp });

    try {
      const plainText = `Your Password Reset OTP is: ${otp}. It expires in 1 minute.`;
      const htmlContent = getEmailTemplate(otp, 'reset', user.name);
      
      await sendEmail(email, 'LinkNest - Password Reset', plainText, htmlContent);
    } catch (mailError) {
      console.error('Mailer failed:', mailError.message);
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

    res.status(200).json({ message: 'OTP sent to email.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyResetOtp = async (req, res) => {
  const email = req.body.email ? String(req.body.email).toLowerCase().trim() : undefined;
  const otp = req.body.otp ? String(req.body.otp).trim() : undefined;

  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otpRecord = await Otp.findOne({ email });
    
    if (!otpRecord || (Date.now() - new Date(otpRecord.createdAt).getTime() > OTP_EXPIRY_MS)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    if (String(otpRecord.otp) !== otp) {
      return res.status(400).json({ message: 'Invalid OTP entered' });
    }
    
    await Otp.updateOne({ email }, { $set: { createdAt: Date.now() } });

    res.status(200).json({ message: 'OTP Verified. Proceed to reset password.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const email = req.body.email ? String(req.body.email).toLowerCase().trim() : undefined;
  const otp = req.body.otp ? String(req.body.otp).trim() : undefined;
  const newPassword = req.body.newPassword ? String(req.body.newPassword) : undefined;

  try {
    const otpRecord = await Otp.findOne({ email });
    
    if (!otpRecord || String(otpRecord.otp) !== otp || (Date.now() - new Date(otpRecord.createdAt).getTime() > OTP_EXPIRY_MS)) {
      return res.status(400).json({ message: 'Session expired or Invalid OTP. Please request a new OTP.' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: 'Password must be min 8 chars long with A-Z, a-z, 0-9, and a special char (!@#$%^&*).' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    let user = await User.findOne({ email });
    user.password = hashedPassword;
    await user.save();

    await Otp.deleteOne({ email });

    res.status(200).json({ message: 'Password reset successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, verifySignupOtp, login, forgotPassword, verifyResetOtp, resetPassword };