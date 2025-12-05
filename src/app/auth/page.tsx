import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-actions";
import AuthPageClient from "./auth-client";

export default async function AuthPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const session = await getSession();

    // Redirect if already logged in
    if (session?.user) {
        redirect("/");
    }

    const params = await searchParams;
    const activeTab = params.tab === "signup" ? "signup" : "login";

    return <AuthPageClient initialTab={activeTab} />;
}
