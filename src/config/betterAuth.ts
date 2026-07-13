import { db } from "./mongo-client";
import { sendEmail } from "../services/email.service";
// NFT trace hints for Vercel
if (false) {
  require.resolve("better-auth");
  require.resolve("@better-auth/mongo-adapter");
}

let authInstance: any = null;

export const getAuth = async () => {
  if (authInstance) return authInstance;

  const _importDynamic = new Function('modulePath', 'return import(modulePath)');
  const { betterAuth } = await _importDynamic("better-auth");
  const { mongodbAdapter } = await _importDynamic("@better-auth/mongo-adapter");

  authInstance = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || process.env.SERVER_URL,
    database: mongodbAdapter(db),
    emailAndPassword: {
      enabled: true,
      async sendVerificationEmail(data: any) {
        const verificationUrl = `${process.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${data.token}&callbackURL=${process.env.CLIENT_URL}`;
        try {
          await sendEmail({
            to: data.user.email,
            subject: "Verify your ServiceHub account",
            html: `
              <h3>Welcome to ServiceHub</h3>
              <p>Hi ${data.user.name},</p>
              <p>Please verify your email address by clicking the link below:</p>
              <a href="${verificationUrl}">${verificationUrl}</a>
            `,
          });
        } catch (error) {
          console.error("Failed to send verification email:", error);
        }
      },
      async sendResetPassword(data: any) {
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${data.token}`;
        try {
          await sendEmail({
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
        } catch (error) {
          console.error("Failed to send password reset email:", error);
        }
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
      process.env.CLIENT_URL || "",
    ].filter(Boolean),
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
          before: async (user: any) => {
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

  return authInstance;
};
