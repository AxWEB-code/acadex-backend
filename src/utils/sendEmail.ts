import nodemailer from "nodemailer";
console.log("SMTP_USER:", process.env.SMTP_USER);

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ Email credentials missing in .env file.");
    return;
  }


  console.log("🧩 Loaded SMTP ENV:", {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS ? "✅ Exists" : "❌ Missing",
  from: process.env.SMTP_FROM,
  service: process.env.SMTP_SERVICE,
});



  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || `"AcadeX Notifications" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw err;
  }
}
