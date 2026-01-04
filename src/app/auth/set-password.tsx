"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams?.get("token") || "";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!token) {
            setError("Missing reset token.");
            return;
        }

        setIsLoading(true);
        try {
            const body = { token, newPassword: password };
            console.debug("POST /api/auth/reset-password (set) body:", body);

            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const text = await res.text();
            let data: any;
            try { data = JSON.parse(text); } catch { data = { text }; }
            console.debug("reset-password (set) response:", res.status, data);

            if (res.ok) {
                router.push("/auth?tab=login");
            } else {
                setError(data?.message || data?.error || data?.text || `Failed to set password (status ${res.status})`);
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
                    <CardTitle>Set a New Password</CardTitle>
                    <CardDescription>Choose a new password for your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New password</Label>
                            <Input
                                id="new-password"
                                name="newPassword"
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm password</Label>
                            <Input
                                id="confirm-password"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Set password and Log in"}
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