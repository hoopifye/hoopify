"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserNav } from "./user-nav";
import { ModeToggle } from "./mode-toggle";
import { Logo } from "./logo";
import { NavbarAuth } from "./navbar-auth";
import { NavbarLinks } from "./navbar-links";

interface NavbarProps {
  session: any;
}

export function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const user = session?.user;

  // Determine what to show on mobile
  const getPageTitle = () => {
    if (pathname === "/") return "Home";
    if (pathname === "/calendar") return "Calendar";
    return null;
  };

  const pageTitle = getPageTitle();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="mr-4 flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="hidden sm:block">
              <Logo />
            </div>
            <div className="block sm:hidden">
              {pathname === "/" ? <Logo /> : <Logo square />}
            </div>
          </Link>
          <NavbarLinks initialSession={session} pathname={pathname} />
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search here later if needed */}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="hidden md:block">
                  <ModeToggle />
                </div>
              <NavbarAuth initialSession={session} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
