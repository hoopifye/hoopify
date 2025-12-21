"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavbarAuthProps {
    initialSession: any;
}

export function NavbarAuth({ initialSession }: NavbarAuthProps) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    const effectiveSession = session === undefined ? initialSession : session;
    const user = effectiveSession?.user;

    // Use user image or fallback to DiceBear with user name (which is the address fragment) or ID as seed
    const displayImage = user?.image || `https://api.dicebear.com/9.x/identicon/svg?seed=${user?.id || 'default'}`;

    return (
        <div className="flex items-center gap-4">
            {user ? (
                <div className="flex items-center gap-4">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={displayImage} alt={user.name ?? "User"} />
                        <AvatarFallback>{(user.name ?? "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline-block">
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
