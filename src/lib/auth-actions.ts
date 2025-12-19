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
        await auth.api.signOut({
            headers: {
                cookie: cookieStore.toString(),
            },
        });

    } catch (error: any) {
        return { error: error?.message || "Failed to sign out" };
    }

    redirect("/auth");
}

export async function getSession() {
    try {
        const cookieStore = await cookies();
        const session = await auth.api.getSession({
            headers: {
                cookie: cookieStore.toString(),
            },
        });

        return session;
    } catch (error) {
        return null;
    }
}
