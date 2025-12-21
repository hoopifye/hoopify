"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

interface NavbarLinksProps {
    initialSession?: any;
}

export function NavbarLinks({ initialSession }: NavbarLinksProps) {
    const { data: session } = useSession();
    const effectiveSession = session === undefined ? initialSession : session;
    const user = effectiveSession?.user;

    return (
        <nav className="flex items-center gap-6 text-sm font-medium">
            {user && (
                <Link
                    href="/calendar"
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                    Calendar
                </Link>
            )}
        </nav>
    );
}
