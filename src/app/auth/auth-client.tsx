"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { signIn, signUp } from "@/lib/auth-client";
import { loginWithWeb3 } from "@/lib/web3-auth-actions";
import { Chrome, Wallet, AlertCircle } from "lucide-react";

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export default function AuthPageClient({ initialTab, error: urlError }: { initialTab: string; error?: string }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showErrorDialog, setShowErrorDialog] = useState(!!urlError);

    useEffect(() => {
        if (urlError) {
            // Clean up the URL
            const url = new URL(window.location.href);
            url.searchParams.delete('error');
            window.history.replaceState({}, '', url.toString());
        }
    }, [urlError]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        router.push(`/auth?tab=${value}`);
        setError(null);
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;


        if (!isValidEmail(email)) {
            setError("Please enter a valid email address");
            setIsLoading(false);
            return;
        }

        await signIn.email({
            email,
            password,
            callbackURL: "/",
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                },
                onResponse: () => {
                    setIsLoading(false);
                },
                onRequest: () => {
                    setIsLoading(true);
                },
                onError: (ctx) => {
                    setError(ctx.error.message);
                    setIsLoading(false);
                },
            },
        });
    };

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        if (!isValidEmail(email)) {
            setError("Please enter a valid email address");
            setIsLoading(false);
            return;
        }

        await signUp.email({
            email,
            password,
            name,
            fetchOptions: {
                onResponse: () => {
                    setIsLoading(false);
                },
                onRequest: () => {
                    setIsLoading(true);
                },
                onSuccess: () => {
                    sessionStorage.setItem('pending_password', password);
                    router.push(`/auth?tab=verify-code&email=${encodeURIComponent(email)}`);
                },
                onError: (ctx) => {
                    setError(ctx.error.message);
                    setIsLoading(false);
                },
            },
        });
    };

    const handleWeb3Login = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const ethereum = (window as any).ethereum;
            if (!ethereum) {
                setError("No crypto wallet found. Please install MetaMask.");
                setIsLoading(false);
                return;
            }

            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            const address = accounts[0];
            const message = "Sign in to Hoopify";

            const signature = await ethereum.request({
                method: "personal_sign",
                params: [message, address],
            });

            const result = await loginWithWeb3(address, signature);

            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
            } else if (result?.success) {
                window.location.href = "/";
            } else {
                setIsLoading(false);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Web3 login failed");
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);

        const result = await signIn.social({
            provider: "google",
            callbackURL: "/",
        });

        if (result?.error) {
            setError(result.error.message || "Google login failed");
            setIsLoading(false);
            return;
        }

        if (result?.data?.url) {
            window.location.href = result.data.url;
            return;
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-[calc(100vh-3.5rem)] pt-20 px-4">
            <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <DialogTitle>Oops!</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">
                            Something went wrong!
                            <br />
                            <br />
                            Try logging in or signing up again now, and if the problem persists try again later or try a different authentication method.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="default"
                            onClick={() => setShowErrorDialog(false)}
                        >
                            Got it
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Welcome to Hoopifye</CardTitle>
                    <CardDescription>Sign in to your account or create a new one</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                            {error}
                        </div>
                    )}
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        <div className="min-h-70">
                            <TabsContent value="login">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">Email</Label>
                                        <Input
                                            id="login-email"
                                            name="email"
                                            type="email"
                                            placeholder="example@example.com"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">Password</Label>
                                        <Input
                                            id="login-password"
                                            name="password"
                                            type="password"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? "Logging in..." : "Log in"}
                                    </Button>
                                </form>
                                <div className="text-center my-4">
                                    <a href="/auth?tab=reset-password"
                                        className="bg-background px-2 text-muted-foreground"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setError(null);
                                            router.push("/auth?tab=reset-password");
                                        }}>
                                        Forgot your password?
                                    </a>
                                </div>
                            </TabsContent>

                            <TabsContent value="signup">
                                <form onSubmit={handleSignup} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-name">Name</Label>
                                        <Input
                                            id="signup-name"
                                            name="name"
                                            type="text"
                                            placeholder="John Doe"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email</Label>
                                        <Input
                                            id="signup-email"
                                            name="email"
                                            type="email"
                                            placeholder="example@example.com"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Password</Label>
                                        <Input
                                            id="signup-password"
                                            name="password"
                                            type="password"
                                            required
                                            disabled={isLoading}
                                            minLength={8}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? "Creating account..." : "Sign up"}
                                    </Button>
                                </form>
                            </TabsContent>
                        </div>
                    </Tabs>
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                            <Chrome className="mr-2 h-4 w-4" />
                            Google Account
                        </Button>
                        <Button variant="outline" type="button" className="w-full" onClick={handleWeb3Login} disabled={isLoading}>
                            <Wallet className="mr-2 h-4 w-4" />
                            Ethereum Wallet
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}