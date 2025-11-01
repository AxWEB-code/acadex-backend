import nodemailer from "nodemailer";
console.log("SMTP_USER:", process.env.SMTP_USER);


/**
 * Sends an email using SMTP (Gmail, Outlook, or custom provider).
 * Requires .env variables:
 *  EMAIL_USER, EMAIL_PASS, EMAIL_FROM
 */
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
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ Email credentials missing in .env file.");
    return;
  }

  // ✅ Create transporter
  const transporter = nodemailer.createTransport({
    service: "gmail", // change to your provider if not Gmail
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // ✅ Define mail options
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"AcadeX Notifications" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  // ✅ Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw err;
  }
}
