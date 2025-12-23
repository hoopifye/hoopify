import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    // Social Providers (enabled when secrets are provided)
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
                input: false, // Don't allow user to set role on signup
            },
        },
    },
    secret: process.env.BETTER_AUTH_SECRET,
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
