
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, ""),
  },
});

async function sendOtpEmail(email, otp) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Gmail credentials are missing from backend .env");
  }

  await transporter.sendMail({
    from: `"IT Support Ticketing System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your Email Verification Code",
    text: `Your verification code is ${otp}. It expires in 10 minutes. If you did not request this code, ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>IT Support Ticketing System</h2>
        <p>Use this code to verify your email address:</p>
        <h1 style="letter-spacing: 8px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this code, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };
