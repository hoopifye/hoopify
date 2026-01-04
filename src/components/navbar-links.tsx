"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Calendar, Settings, Mail } from "lucide-react";

interface NavbarLinksProps {
    initialSession?: any;
    pathname: string;
}

// Hardcoded invite count - in a real app, this would come from an API
const INVITE_COUNT = 3;

export function NavbarLinks({ initialSession, pathname }: NavbarLinksProps) {
    const { data: session } = useSession();
    const effectiveSession = session === undefined ? initialSession : session;
    const user = effectiveSession?.user;

    const isCalendarPage = pathname === "/calendar";
    const isSettingsPage = pathname === "/settings";
    const isInvitesPage = pathname === "/invites";

    return (
        <nav className="flex items-center gap-6 text-sm font-medium">
            {user && (
                <>
                    <Link
                        href="/calendar"
                        className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-2"
                    >
                        <Calendar className="h-5 w-5 md:h-4 md:w-4" />
                        <span className={isCalendarPage ? "" : "hidden md:inline"}>Calendar</span>
                    </Link>

                    <Link
                        href="/invites"
                        className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-2"
                    >
                        <div className="relative">
                            <Mail className="h-5 w-5 md:h-4 md:w-4" />
                            {INVITE_COUNT > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-medium">
                                    {INVITE_COUNT}
                                </span>
                            )}
                        </div>
                        <span className={isInvitesPage ? "" : "hidden md:inline"}>Invites</span>
                    </Link>

                    <Link
                        href="/settings"
                        className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-2"
                    >
                        <Settings className="h-5 w-5 md:h-4 md:w-4" />
                        <span className={isSettingsPage ? "" : "hidden md:inline"}>Settings</span>
                    </Link>
                </>
            )}
        </nav>
    );
}
