import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth-actions";
import { UserNav } from "./user-nav";
import { ModeToggle } from "./mode-toggle";
import { Logo } from "./logo";
import { NavbarAuth } from "./navbar-auth";

export async function Navbar() {
  const session = await getSession();
  const user = session?.user;
  console.log("Navbar Session:", session);
  console.log("Navbar User:", session?.user);
  if (session?.user) {
    console.log("User Name:", session.user.name);
    console.log("User Image:", session.user.image);
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
                <ModeToggle />
              <NavbarAuth initialSession={session} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
