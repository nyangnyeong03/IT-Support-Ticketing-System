
const { Resend } = require("resend");

async function sendOtpEmail(email, otp) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  const resend = new Resend(apiKey);
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  console.log("Starting Resend OTP request...");

  try {
    const { data, error } = await resend.emails.send({
      from: `FaultLiNE <${fromEmail}>`,
      to: [email],
      subject: "Your FaultLiNE Verification Code",
      text: `Your verification code is ${otp}. It expires in 10 minutes. If you did not request this code, ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
          <h2>FaultLiNE Management System</h2>
          <p>Your email verification code is:</p>
          <h1 style="letter-spacing: 8px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(error.message || "Resend API request failed.");
    }

    console.log("OTP email accepted by Resend:", data?.id);
    return data;
  } catch (error) {
    console.error("Resend request failed:", error.message);
    throw error;
  }
}

module.exports = { sendOtpEmail };
