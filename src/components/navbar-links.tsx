"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Calendar, Settings, Mail, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { getUpcomingRemindersCount } from "@/lib/calendar-actions";
import { getPendingInvitesCountAction } from "@/lib/invite-actions";

interface NavbarLinksProps {
    initialSession?: any;
    pathname: string;
}

export function NavbarLinks({ initialSession, pathname }: NavbarLinksProps) {
    const { data: session } = useSession();
    const effectiveSession = session ?? initialSession;
    const user = effectiveSession?.user;

    const [reminderCount, setReminderCount] = useState(0);
    const [inviteCount, setInviteCount] = useState(0);

    useEffect(() => {
        async function fetchCounts() {
            if (user) {
                try {
                    const [rCount, iCount] = await Promise.all([
                        getUpcomingRemindersCount(),
                        getPendingInvitesCountAction()
                    ]);
                    setReminderCount(rCount);
                    setInviteCount(iCount);
                } catch (error) {
                    console.error("Failed to fetch counts:", error);
                }
            }
        }
        fetchCounts();
    }, [user]);

    const isCalendarPage = pathname === "/calendar";
    const isSettingsPage = pathname === "/settings";
    const isInvitesPage = pathname === "/invites";
    const isRemindersPage = pathname === "/reminders";

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
                            {inviteCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-medium">
                                    {inviteCount}
                                </span>
                            )}
                        </div>
                        <span className={isInvitesPage ? "" : "hidden md:inline"}>Invites</span>
                    </Link>

                    <Link
                        href="/reminders"
                        className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-2"
                    >
                        <div className="relative">
                            <Bell className="h-5 w-5 md:h-4 md:w-4" />
                            {reminderCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-medium">
                                    {reminderCount}
                                </span>
                            )}
                        </div>
                        <span className={isRemindersPage ? "" : "hidden md:inline"}>Upcoming</span>
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
