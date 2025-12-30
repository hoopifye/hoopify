"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

export default function VerificationCodePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams?.get("email") || "";
    
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [password, setPassword] = useState("");

    useEffect(() => {
        const storedPassword = sessionStorage.getItem('pending_password');
        if (storedPassword) {
            setPassword(storedPassword);
        }
    }, []);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) {
            value = value[0];
        }

        if (!/^\d*$/.test(value)) {
            return;
        }

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError(null);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        
        if (!/^\d+$/.test(pastedData)) {
            return;
        }

        const newCode = [...code];
        for (let i = 0; i < pastedData.length && i < 6; i++) {
            newCode[i] = pastedData[i];
        }
        setCode(newCode);

        const nextEmptyIndex = newCode.findIndex(val => !val);
        if (nextEmptyIndex !== -1) {
            inputRefs.current[nextEmptyIndex]?.focus();
        } else {
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const verificationCode = code.join("");
        if (verificationCode.length !== 6) {
            setError("Please enter all 6 digits");
            return;
        }

        if (!password) {
            setError("Session expired. Please sign up again.");
            setTimeout(() => router.push("/auth?tab=signup"), 2000);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: verificationCode }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                sessionStorage.removeItem('pending_password');

                await signIn.email({
                    email,
                    password,
                    callbackURL: "/",
                    fetchOptions: {
                        onSuccess: () => {
                            window.location.href = "/";
                        },
                        onError: (ctx) => {
                            setError("Email verified! Redirecting to login...");
                            setTimeout(() => {
                                router.push("/auth?tab=login");
                            }, 2000);
                        },
                    },
                });
            } else {
                setError(data?.message || data?.error || "Invalid verification code");
            }
        } catch (err: any) {
            setError(err?.message || "Network error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                setError(null);
                alert("Verification code resent! Check your email.");
            } else {
                setError(data?.message || "Failed to resend code");
            }
        } catch (err: any) {
            setError(err?.message || "Network error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-3.5rem)] pt-20 px-4">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Verify Your Email</CardTitle>
                    <CardDescription>
                        Enter the 6-digit code sent to {email}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                            {code.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    disabled={isLoading}
                                    className="w-12 h-12 text-center text-lg font-bold"
                                />
                            ))}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading || code.some(d => !d)}>
                            {isLoading ? "Verifying..." : "Verify & Login"}
                        </Button>

                        <div className="text-center space-y-2">
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={isLoading}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Didn't receive a code? Resend
                            </button>
                            <div>
                                <a href="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                                    Back to login
                                </a>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}