"use client";

import React, { createContext, useContext } from "react";
import { useSession, signIn as betterSignIn, signUp as betterSignUp, signOut as betterSignOut } from "@/lib/auth-client";

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();

    const login = async (email: string, password: string) => {
        const result = await betterSignIn.email({
            email,
            password,
        });

        if (result.error) {
            throw new Error(result.error.message || "Login failed");
        }
    };

    const signup = async (name: string, email: string, password: string) => {
        const result = await betterSignUp.email({
            email,
            password,
            name,
        });

        if (result.error) {
            throw new Error(result.error.message || "Signup failed");
        }
    };

    const logout = async () => {
        await betterSignOut();
    };

    const user: User | null = session?.user
        ? {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              avatar: session.user.image || undefined,
          }
        : null;

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, isLoading: isPending }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
