"use server";

import { auth, prisma } from "@/lib/auth";
import { cookies } from "next/headers";
import { recoverMessageAddress } from "viem";
import crypto from "crypto";
import { getCookies } from "better-auth/cookies";

export async function loginWithWeb3(address: string, signature: string) {
    try {
        console.log("=== WEB3 LOGIN START ===");
        console.log("NODE_ENV:", process.env.NODE_ENV);
        console.log("BETTER_AUTH_SECRET Present:", !!process.env.BETTER_AUTH_SECRET);
        console.log("Address:", address);

        const message = "Sign in to Hoopify";

        const recoveredAddress = await recoverMessageAddress({
            message,
            signature: signature as `0x${string}`,
        });

        console.log("Recovered address:", recoveredAddress);

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

        const shortAddress = effectiveAddress.startsWith("0x")
            ? effectiveAddress.slice(2, 10)
            : effectiveAddress.slice(0, 8);
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
        const sessionMaxAgeSeconds = 60 * 60 * 24 * 30; // 30 days default
        const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000);

        await prisma.session.create({
            data: {
                userId,
                token,
                expiresAt,
                userAgent: "web3-login",
            }
        });

        // 3. Set signed session cookie for Better Auth
        const secret = auth.options.secret || process.env.BETTER_AUTH_SECRET;
        if (!secret) {
            console.error("Missing BETTER_AUTH_SECRET");
            return { error: "Missing BETTER_AUTH_SECRET. Set it to enable web3 login." };
        }

        const cookieSignature = crypto.createHmac("sha256", secret).update(token).digest("base64");
        const cookieValue = `${token}.${cookieSignature}`;

        const cookieStore = await cookies();
        const { sessionToken } = getCookies(auth.options);
        
        console.log("Setting cookie:", sessionToken.name);
        console.log("Cookie options:", {
            domain: sessionToken.options.domain,
            httpOnly: sessionToken.options.httpOnly,
            path: sessionToken.options.path,
            secure: sessionToken.options.secure,
            sameSite: sessionToken.options.sameSite,
        });
        
        // Create a properly typed cookie options object
        const sameSite = sessionToken.options.sameSite?.toLowerCase() as 'lax' | 'strict' | 'none' | undefined;
        
        // Only use secure cookies when using HTTPS
        const useSecure = sessionToken.options.secure ?? false;
        
        cookieStore.set(sessionToken.name, cookieValue, {
            domain: sessionToken.options.domain,
            httpOnly: sessionToken.options.httpOnly ?? true,
            path: sessionToken.options.path ?? "/",
            secure: useSecure,
            sameSite: sameSite ?? "lax",
            maxAge: sessionMaxAgeSeconds,
        });

        console.log("=== WEB3 LOGIN SUCCESS ===");
        return { success: true };

    } catch (error: unknown) {
        console.error("Web3 Login Error:", error);
        return { error: (error instanceof Error ? error.message : "Failed to login with Web3") };
    }
}
