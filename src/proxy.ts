import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname === "/" || pathname.startsWith("/auth")) {
        return NextResponse.next();
    }

    const sessionCookie = request.cookies.get("__Secure-better-auth.session_token") 
        ?? request.cookies.get("better-auth.session_token");
    
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
