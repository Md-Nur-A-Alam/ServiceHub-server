import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port === "465",
      auth: { user, pass },
    });
    console.log("[Email]: Configured transporter using SMTP environment variables.");
  } else {
    try {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Skipping Ethereal in production (Vercel blocks outbound SMTP port 587)");
      }
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("[Email]: Configured fallback Ethereal SMTP test account.");
      console.log(`[Email]: Test Credentials - User: ${testAccount.user}, Pass: ${testAccount.pass}`);
    } catch (err) {
      console.error("[Email]: Failed to create Ethereal test account, logging to console only.", err);
      transporter = {
        sendMail: async (options: any) => {
          console.log(`[MOCK EMAIL SENT TO ${options.to}]:`, options.subject);
          console.log("Body:", options.text || options.html);
          return { messageId: "mock-id" };
        }
      } as unknown as nodemailer.Transporter;
    }
  }
  return transporter;
}

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text?: string; html?: string }) {
  try {
    const client = await getTransporter();
    const info = await client.sendMail({
      from: process.env.SMTP_FROM || '"ServiceHub" <no-reply@servicehub.com>',
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email]: Sent email to ${to} (MessageID: ${info.messageId})`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email]: Ethereal Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error(`[Email]: Failed to send email to ${to}`, error);
    throw error;
  }
}
