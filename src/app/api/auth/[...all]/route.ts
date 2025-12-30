import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { Resend } from "resend";
import ResetPasswordEmail from "@/components/emails/reset-password";
import EmailCode from "@/components/emails/verification-code";
import { prisma } from "@/lib/auth";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const handlers = toNextJsHandler(auth);
const resend = new Resend(process.env.RESEND_API_KEY || "");
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SECRET = process.env.BETTER_AUTH_SECRET || "";

const isResetPath = (pathname: string) => pathname.endsWith("/reset-password");
const isVerifyEmailPath = (pathname: string) => pathname.endsWith("/verify-email");
const isResendVerificationPath = (pathname: string) => pathname.endsWith("/resend-verification");

export const GET = async (req: Request, ctx: any) => {
    const params = ctx?.params ? await ctx.params : undefined;
    const pathname = new URL(req.url).pathname;

    if (isResetPath(pathname)) {
        try {
            const url = new URL(req.url);
            const email = url.searchParams.get("email")?.trim();

            if (!email) {
                return new Response(JSON.stringify({ error: "Missing email" }), { 
                    status: 400, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                return new Response(JSON.stringify({ ok: true }), { 
                    status: 200, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            const token = jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: "1h" });
            const resetUrl = `${APP_URL}/auth?tab=set-password&token=${encodeURIComponent(token)}`;

            try {
                await resend.emails.send({
                    from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
                    to: user.email,
                    subject: "Reset your password",
                    react: ResetPasswordEmail({ username: user.name ?? undefined, resetUrl }),
                });
            } catch (err: any) {
                console.error("Failed to send reset email:", err);
                return new Response(JSON.stringify({ error: "Failed to send email" }), { 
                    status: 500, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            return new Response(JSON.stringify({ ok: true }), { 
                status: 200, 
                headers: { "Content-Type": "application/json" } 
            });
        } catch (err: any) {
            console.error("reset-password GET error:", err);
            return new Response(JSON.stringify({ error: "Internal error" }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }
    }

    if (typeof handlers.GET === "function") {
        return handlers.GET(req);
    }

    return new Response(JSON.stringify({ error: "Not implemented" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
    });
};

export const POST = async (req: Request, ctx: any) => {
    const params = ctx?.params ? await ctx.params : undefined;
    const pathname = new URL(req.url).pathname;

    if (isVerifyEmailPath(pathname)) {
        try {
            const body = await req.json().catch(() => ({}));
            const { email, code } = body;

            if (!email || !code) {
                return new Response(JSON.stringify({ error: "Missing email or code" }), { 
                    status: 400, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            const user = await prisma.user.findUnique({ where: { email } });
            
            if (!user) {
                return new Response(JSON.stringify({ error: "User not found" }), { 
                    status: 404, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            const verification = await prisma.verification.findFirst({
                where: { 
                    identifier: email,
                    value: code,
                    expiresAt: { gte: new Date() }
                }
            });

            if (!verification) {
                return new Response(JSON.stringify({ error: "Invalid or expired code" }), { 
                    status: 400, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            // Update user email verification status
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: true }
            });

            // Delete used verification code
            await prisma.verification.delete({
                where: { id: verification.id }
            });

            // Return success with user credentials for auto-login
            return new Response(JSON.stringify({ 
                ok: true, 
                autoLogin: true,
                email: user.email 
            }), { 
                status: 200, 
                headers: { "Content-Type": "application/json" } 
            });
        } catch (err: any) {
            console.error("verify-email POST error:", err);
            return new Response(JSON.stringify({ error: "Internal error" }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }
    }

    if (isResendVerificationPath(pathname)) {
        try {
            const body = await req.json().catch(() => ({}));
            const { email } = body;

            if (!email) {
                return new Response(JSON.stringify({ error: "Missing email" }), { 
                    status: 400, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            const user = await prisma.user.findUnique({ where: { email } });
            
            if (!user) {
                return new Response(JSON.stringify({ ok: true }), { 
                    status: 200, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Delete old verification codes
            await prisma.verification.deleteMany({
                where: { identifier: email }
            });

            // Create new verification code
            await prisma.verification.create({
                data: {
                    identifier: email,
                    value: verificationCode,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                }
            });

            await resend.emails.send({
                from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
                to: email,
                subject: "Your verification code",
                react: EmailCode({ 
                    username: user.name || email.split('@')[0], 
                    verificationCode 
                }),
            });

            return new Response(JSON.stringify({ ok: true }), { 
                status: 200, 
                headers: { "Content-Type": "application/json" } 
            });
        } catch (err: any) {
            console.error("resend-verification POST error:", err);
            return new Response(JSON.stringify({ error: "Internal error" }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }
    }

    if (isResetPath(pathname)) {
        try {
            const body = await req.json().catch(() => ({}));
            const token = body?.token;
            const newPassword = body?.newPassword;

            if (!token || !newPassword) {
                return new Response(JSON.stringify({ error: "Missing token or newPassword" }), { 
                    status: 400, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            let payload: any;
            try {
                payload = jwt.verify(token, SECRET);
            } catch (err) {
                return new Response(JSON.stringify({ error: "Invalid or expired token" }), { 
                    status: 400, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            const userId = payload?.sub;
            if (!userId) {
                return new Response(JSON.stringify({ error: "Invalid token payload" }), { 
                    status: 400, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return new Response(JSON.stringify({ error: "User not found" }), { 
                    status: 404, 
                    headers: { "Content-Type": "application/json" } 
                });
            }

            const hashed = await bcrypt.hash(newPassword, 10);

            await prisma.account.updateMany({
                where: { userId, providerId: "email" },
                data: { password: hashed },
            });

            return new Response(JSON.stringify({ ok: true }), { 
                status: 200, 
                headers: { "Content-Type": "application/json" } 
            });
        } catch (err: any) {
            console.error("reset-password POST error:", err);
            return new Response(JSON.stringify({ error: "Internal error" }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }
    }

    if (typeof handlers.POST === "function") {
        return handlers.POST(req);
    }

    return new Response(JSON.stringify({ error: "Not implemented" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
    });
};