const express = require('express');
const { register, verifySignupOtp, login, forgotPassword, verifyResetOtp, resetPassword } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

module.exports = router;