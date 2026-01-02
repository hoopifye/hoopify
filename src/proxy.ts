import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);

    // Define protected routes
    const protectedRoutes = ["/dashboard", "/admin", "/settings", "/calendar"];
    const isProtectedRoute = protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute && !sessionCookie) {
        return NextResponse.redirect(new URL("/auth?tab=login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Protect specific dashboard routes
        "/dashboard/:path*",
        "/admin/:path*",
        "/settings/:path*",
        "/calendar/:path*",
        // Don't run on static files
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
