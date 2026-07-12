"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const mongo_adapter_1 = require("@better-auth/mongo-adapter");
const mongo_client_1 = require("./mongo-client");
const email_service_1 = require("../services/email.service");
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, mongo_adapter_1.mongodbAdapter)(mongo_client_1.db),
    emailAndPassword: {
        enabled: true,
        async sendVerificationEmail(data) {
            const verificationUrl = `${process.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${data.token}&callbackURL=${process.env.CLIENT_URL}`;
            await (0, email_service_1.sendEmail)({
                to: data.user.email,
                subject: "Verify your ServiceHub account",
                html: `
          <h3>Welcome to ServiceHub</h3>
          <p>Hi ${data.user.name},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
        `,
            });
        },
        async sendResetPassword(data) {
            const resetUrl = `${process.env.CLIENT_URL}/reset-password/${data.token}`;
            await (0, email_service_1.sendEmail)({
                to: data.user.email,
                subject: "Reset your ServiceHub password",
                html: `
          <h3>Reset Password</h3>
          <p>Hi ${data.user.name},</p>
          <p>You requested a password reset. Please click the link below to set a new password:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>If you did not request this, you can safely ignore this email.</p>
        `,
            });
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "placeholder_client_id",
            clientSecret: process.env.GOOGLE_SECRET_ID || "placeholder_client_secret",
        },
    },
    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
            httpOnly: true,
        },
    },
    trustedOrigins: [
        process.env.PRODUCTION_URL || process.env.PORT_URL || process.env.CLIENT_URL || "http://localhost:3000",
    ],
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "customer",
            },
            banned: {
                type: "boolean",
                required: false,
                defaultValue: false,
            },
            providerBio: {
                type: "string",
                required: false,
                defaultValue: "",
            },
            providerVerified: {
                type: "boolean",
                required: false,
                defaultValue: false,
            },
            savedServices: {
                type: "string[]",
                required: false,
                defaultValue: [],
            },
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    return {
                        data: {
                            ...user,
                            role: user.role || "customer",
                        },
                    };
                },
            },
        },
    },
});
