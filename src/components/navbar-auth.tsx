"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface NavbarAuthProps {
    initialSession: any; // Using any for now to avoid complex type matching from server-client, or we can import Session type
}

export function NavbarAuth({ initialSession }: NavbarAuthProps) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    // effectiveSession is the client-side session if available (or null if known logged out), 
    // falling back to initialSession for SSR/first render.
    // Note: better-auth useSession might return undefined if loading, null if not logged in.
    // If useSession is active, we rely on it. If it's still initializing, we might show initialSession.
    // However, simple approach: if session is undefined (loading), use initialSession.

    const effectiveSession = session === undefined ? initialSession : session;
    const user = effectiveSession?.user;

    return (
        <div className="flex items-center gap-4">
            {user ? (
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{user.name}</span>
                    <Button
                        variant="outline"
                        onClick={async () => {
                            await signOut();
                            router.refresh(); // Refresh to update server components if needed
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
