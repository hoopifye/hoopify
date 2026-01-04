"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const parseResponse = async (res: Response) => {
        const text = await res.text().catch(() => "");
        try { return text ? JSON.parse(text) : {}; } catch { return { text }; }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        setError(null);

        try {
            const url = `/api/auth/reset-password?email=${encodeURIComponent(email.trim())}`;
            console.debug("GET", url);
            const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
            const data = await parseResponse(res);
            console.debug("reset-password GET response:", res.status, data);

            if (res.ok || res.status === 404) {
                setMessage("If an account with that email exists, a reset link has been sent.");
            } else {
                setError(data?.message || data?.error || data?.text || `Failed to send reset email (status ${res.status})`);
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
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>Enter your email to receive a password reset link.</CardDescription>
                </CardHeader>
                <CardContent>
                    {message && <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded">{message}</div>}
                    {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                                id="reset-email"
                                name="email"
                                type="email"
                                placeholder="example@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading || email.trim() === ""}>
                            {isLoading ? "Sending..." : "Send reset link"}
                        </Button>

                        <div className="text-center">
                            <a href="/auth" className="bg-background px-2 text-muted-foreground">
                                Back to login
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}