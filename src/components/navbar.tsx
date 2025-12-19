import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth-actions";
import { UserNav } from "./user-nav";
import { ModeToggle } from "./mode-toggle";
import { Logo } from "./logo";

export async function Navbar() {
  const session = await getSession();
  const user = session?.user;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="hidden sm:block">
              <Logo />
            </div>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/docs"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Docs
            </Link>
            <Link
              href="/components"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Components
            </Link>
            {user && (
              <Link
                href="/calendar"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Calendar
              </Link>
            )}
          </nav>
        </div>

        {/* Mobile Logo (visible only on small screens) */}
        <div className="flex md:hidden">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search here later if needed */}
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            {user ? (
              <UserNav user={user} />
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
        </div>
      </div>
    </nav>
  );
}
