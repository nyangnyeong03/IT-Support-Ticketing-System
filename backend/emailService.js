
async function sendOtpEmail(email, otp, toName = "FaultLiNE User") {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS environment variables are missing.");
  }

  const response = await fetch(
    "https://api.emailjs.com/api/v1.0/email/send",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: email,
          to_name: toName,
          otp_code: otp,
        },
      }),
    }
  );

  const result = await response.text();

  if (!response.ok) {
    console.error("EmailJS error:", response.status, result);
    throw new Error("Failed to send OTP email through EmailJS.");
  }

  console.log("OTP email sent successfully through EmailJS.");
  return result;
}

module.exports = { sendOtpEmail };
