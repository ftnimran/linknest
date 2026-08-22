const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// HTML parameter is passed here
const sendEmail = async (to, subject, text, html) => {
  const info = await transporter.sendMail({
    from: `"LinkNest Support" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    text,
    html,
  });
  console.log(`Email sent successfully to ${to}`);
  return info;
};

module.exports = sendEmail;