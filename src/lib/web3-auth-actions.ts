"use server";

import { prisma } from "@/lib/auth";
import { cookies } from "next/headers";
import { recoverMessageAddress } from "viem";
import crypto from "crypto";

export async function loginWithWeb3(address: string, signature: string) {
    try {
        const message = "Sign in to Hoopify";

        const recoveredAddress = await recoverMessageAddress({
            message,
            signature: signature as `0x${string}`,
        });

        const effectiveAddress = recoveredAddress.toLowerCase();

        // 1. Find or create user and ensure profile is up to date
        let userId: string;

        const account = await prisma.account.findUnique({
            where: {
                providerId_accountId: {
                    providerId: "web3",
                    accountId: effectiveAddress,
                },
            },
        });

        const shortAddress = effectiveAddress.slice(0, 8);
        const profileImage = `https://api.dicebear.com/9.x/identicon/svg?seed=${effectiveAddress}`;

        if (account) {
            userId = account.userId;
            await prisma.user.update({
                where: { id: userId },
                data: {
                    name: shortAddress,
                    image: profileImage,
                }
            });
        } else {
            const email = `${effectiveAddress}@web3.hoopify`;

            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                userId = existingUser.id;
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        name: shortAddress,
                        image: profileImage,
                    }
                });
            } else {
                const newUser = await prisma.user.create({
                    data: {
                        email,
                        name: shortAddress,
                        image: profileImage,
                        emailVerified: true,
                        role: "USER",
                    }
                });
                userId = newUser.id;
            }

            if (!account) {
                await prisma.account.create({
                    data: {
                        userId,
                        accountId: effectiveAddress,
                        providerId: "web3",
                    }
                });
            }
        }

        // 2. Create Session manually
        const token = crypto.randomBytes(32).toString("hex");
        // better-auth by default usually expects hashed token in DB if not configured otherwise
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        await prisma.session.create({
            data: {
                userId,
                token: hashedToken,
                expiresAt,
                userAgent: "web3-login",
            }
        });

        // 3. Set Cookie with Correct Signature (Base64URL)
        const secret = process.env.BETTER_AUTH_SECRET || "fjVIfL/J+5gKP76VZBZR0XWgPydHHVYXrltv0lUL9i4=";

        // Manual signature logic (Base64URL compliant)
        const signatureBuffer = crypto.createHmac("sha256", secret).update(token).digest();
        const signatureBase64 = signatureBuffer.toString("base64");
        // Replace URL-unsafe chars and strip padding
        const signatureBase64Url = signatureBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

        const cookieValue = `${token}.${signatureBase64Url}`;

        const cookieStore = await cookies();

        cookieStore.set("better-auth.session_token", cookieValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: expiresAt
        });

        return { success: true };

    } catch (error: unknown) {
        console.error("Web3 Login Error:", error);
        return { error: (error instanceof Error ? error.message : "Failed to login with Web3") };
    }
}
