import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-actions";
import AuthPageClient from "./auth-client";
import ResetPasswordPage from "./reset-password";
import SetPasswordPage from "./set-password";
import VerificationCodePage from "./verification-code";

export default async function AuthPage({
    searchParams,
}: {
    searchParams?: any;
}) {
    const session = await getSession();

    if (session?.user) {
        redirect("/");
    }

    const params = (await searchParams) as { tab?: string; error?: string } | undefined;
    const tab = params?.tab ?? "login";
    const error = params?.error;

    if (tab === "reset-password") {
        return <ResetPasswordPage />;
    }

    if (tab === "set-password") {
        return <SetPasswordPage />;
    }

    if (tab === "verify-code") {
        return <VerificationCodePage />;
    }

    const activeTab = tab === "signup" ? "signup" : "login";

    return <AuthPageClient initialTab={activeTab} error={error} />;
}