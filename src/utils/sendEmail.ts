import nodemailer from "nodemailer";

console.log("🧩 Loaded SMTP ENV:", {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS ? "✅ Exists" : "❌ Missing",
  from: process.env.SMTP_FROM,
  service: process.env.SMTP_HOST,
});

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
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("⚠️ Missing SMTP credentials in .env");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || `"AcadeX Notifications" <${SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`📧 Email sent successfully via Brevo: ${info.messageId}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
  }
}
