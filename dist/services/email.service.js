"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter = null;
async function getTransporter() {
    if (transporter)
        return transporter;
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && port && user && pass) {
        transporter = nodemailer_1.default.createTransport({
            host,
            port: parseInt(port),
            secure: port === "465",
            auth: { user, pass },
        });
        console.log("[Email]: Configured transporter using SMTP environment variables.");
    }
    else {
        try {
            const testAccount = await nodemailer_1.default.createTestAccount();
            transporter = nodemailer_1.default.createTransport({
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
        }
        catch (err) {
            console.error("[Email]: Failed to create Ethereal test account, logging to console only.", err);
            transporter = {
                sendMail: async (options) => {
                    console.log(`[MOCK EMAIL SENT TO ${options.to}]:`, options.subject);
                    console.log("Body:", options.text || options.html);
                    return { messageId: "mock-id" };
                }
            };
        }
    }
    return transporter;
}
async function sendEmail({ to, subject, text, html }) {
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
        const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[Email]: Ethereal Preview URL: ${previewUrl}`);
        }
        return info;
    }
    catch (error) {
        console.error(`[Email]: Failed to send email to ${to}`, error);
        throw error;
    }
}
