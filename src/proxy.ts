import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow access to homepage and auth routes
    if (
        pathname === "/" ||
        pathname.startsWith("/auth")
    ) {
        return NextResponse.next();
    }

    // For all other routes, check authentication
    const sessionCookie = getSessionCookie(request);
    
    if (!sessionCookie) {
        return NextResponse.redirect(new URL("/auth", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all routes except static files and API routes
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
