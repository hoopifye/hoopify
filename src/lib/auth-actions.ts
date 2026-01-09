"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signUpAction(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        await auth.api.signUpEmail({
            body: {
                name,
                email,
                password,
            },
        });

    } catch (error: any) {
        return { error: error?.message || "Failed to sign up" };
    }

    redirect("/");
}

export async function signInAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        await auth.api.signInEmail({
            body: {
                email,
                password,
            },
        });

    } catch (error: any) {
        return { error: error?.message || "Failed to sign in" };
    }

    redirect("/");
}

export async function signOutAction() {
    try {
        const cookieStore = await cookies();
        
        // Try better-auth signOut first
        try {
            await auth.api.signOut({
                headers: {
                    cookie: cookieStore.toString(),
                },
            });
        } catch {
            // If better-auth fails, manually clear the session
        }
        
        // Always clear the cookie manually to ensure logout works for Web3 sessions
        const sessionCookie = cookieStore.get("__Secure-better-auth.session_token") 
            ?? cookieStore.get("better-auth.session_token");
        
        if (sessionCookie) {
            const token = decodeURIComponent(sessionCookie.value).split(".")[0];
            const { prisma } = await import("@/lib/auth");
            await prisma.session.deleteMany({ where: { token } });
        }
        
        // Clear cookies
        cookieStore.delete("__Secure-better-auth.session_token");
        cookieStore.delete("better-auth.session_token");

    } catch (error: any) {
        return { error: error?.message || "Failed to sign out" };
    }

    redirect("/auth");
}

export async function getSession() {
    try {
        const { headers, cookies } = await import("next/headers");
        const headerList = await headers();
        
        const session = await auth.api.getSession({ headers: headerList });
        if (session) return session;

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__Secure-better-auth.session_token") 
            ?? cookieStore.get("better-auth.session_token");
        
        if (!sessionCookie) return null;

        const decodedValue = decodeURIComponent(sessionCookie.value);
        const dotIndex = decodedValue.lastIndexOf(".");
        if (dotIndex < 1) return null;

        const token = decodedValue.substring(0, dotIndex);
        const signature = decodedValue.substring(dotIndex + 1);
        const secret = process.env.BETTER_AUTH_SECRET;
        if (!secret) return null;

        const algorithm = { name: "HMAC", hash: "SHA-256" };
        const cryptoKey = await crypto.subtle.importKey(
            "raw", 
            new TextEncoder().encode(secret), 
            algorithm, 
            false, 
            ["verify"]
        );

        const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify(
            algorithm,
            cryptoKey,
            signatureBytes,
            new TextEncoder().encode(token)
        );

        if (!isValid) return null;

        const { prisma } = await import("@/lib/auth");
        const dbSession = await prisma.session.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!dbSession || dbSession.expiresAt < new Date()) return null;

        const { user, ...sessionData } = dbSession;
        return { session: sessionData, user };

    } catch (error) {
        console.error("getSession Error:", error);
        return null;
    }
}
