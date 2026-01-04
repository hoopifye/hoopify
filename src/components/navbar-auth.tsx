"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { useTheme } from "next-themes";

interface NavbarAuthProps {
    initialSession: any;
}

export function NavbarAuth({ initialSession }: NavbarAuthProps) {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const { setTheme, theme } = useTheme();

    const effectiveSession = session === undefined ? initialSession : session;
    const user = effectiveSession?.user;
    
    // Get the current theme icon
    const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

    // Use user image or fallback to DiceBear with user name (which is the address fragment) or ID as seed
    const displayImage = user?.image || `https://api.dicebear.com/9.x/identicon/svg?seed=${user?.id || 'default'}`;

    return (
        <div className="flex items-center gap-4">
            {user ? (
                <>
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center gap-4">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={displayImage} alt={user.name ?? "User"} />
                            <AvatarFallback>{(user.name ?? "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                            {user.name}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                await signOut();
                                window.location.reload();
                            }}
                        >
                            Log out
                        </Button>
                    </div>

                    {/* Mobile Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="sm" className="gap-1">
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={displayImage} alt={user.name ?? "User"} />
                                    <AvatarFallback>{(user.name ?? "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium truncate">
                                    {user.name}
                                </span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <ThemeIcon className="mr-2 h-4 w-4" />
                                    <span>Theme</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem 
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setTheme("light");
                                        }}
                                        className={theme === "light" ? "bg-accent" : ""}
                                    >
                                        <Sun className="mr-2 h-4 w-4" />
                                        <span>Light</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setTheme("dark");
                                        }}
                                        className={theme === "dark" ? "bg-accent" : ""}
                                    >
                                        <Moon className="mr-2 h-4 w-4" />
                                        <span>Dark</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setTheme("system");
                                        }}
                                        className={theme === "system" ? "bg-accent" : ""}
                                    >
                                        <Monitor className="mr-2 h-4 w-4" />
                                        <span>System</span>
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={async () => {
                                    await signOut();
                                    window.location.reload();
                                }}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            ) : (
                <>
                    <Button variant="ghost" asChild>
                        <Link href="/auth?tab=login">Log in</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/auth?tab=signup">Sign up</Link>
                    </Button>
                </>
            )}
        </div>
    );
}
