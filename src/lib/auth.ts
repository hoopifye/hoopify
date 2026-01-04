import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Resend } from "resend";
import EmailCode from "../components/emails/verification-code";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

const resend = new Resend(process.env.RESEND_API_KEY || "");
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            try {
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                
                await prisma.verification.create({
                    data: {
                        identifier: user.email,
                        value: verificationCode,
                        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                    }
                });

                await resend.emails.send({
                    from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
                    to: user.email,
                    subject: "Verify your email",
                    react: EmailCode({ 
                        username: user.name, 
                        verificationCode 
                    }),
                });
                console.log("Verification code sent to", user.email);
            } catch (err) {
                console.error("Failed to send verification email for", user.email, err);
            }
        },
        sendOnSignUp: true,
    },
    socialProviders: {
        google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            enabled: Boolean(googleClientId && googleClientSecret),
            scope: ["openid", "email", "profile"],
            overrideUserInfoOnSignIn: true,
            mapProfileToUser: (profile) => ({
                id: profile.sub,
                name: profile.name || profile.email?.split("@")[0] || "Google User",
                email: profile.email,
                image: profile.picture,
                emailVerified: profile.email_verified ?? false,
            }),
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
            enabled: false,
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "USER",
                input: false,
            },
        },
    },
    secret: process.env.BETTER_AUTH_SECRET,
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;