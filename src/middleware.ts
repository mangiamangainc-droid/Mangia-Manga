import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/library", "/profile", "/notifications"];
const ADMIN_PATHS = ["/admin"];
const AUTH_PATHS = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session")?.value;
  const isAdminCookie = request.cookies.get("isAdmin")?.value;
  const isBannedCookie = request.cookies.get("banned")?.value;
  const isAuthenticated = !!sessionCookie;
  const isAdmin = isAdminCookie === "true";
  const isBanned = isBannedCookie === "true";

  // Redirect banned users
  if (isBanned && !pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login?banned=true", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect explicitly required paths
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isAuthenticated && isProtected) {
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
    );
  }

  // Protect admin routes
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|images|firebase-messaging-sw.js).*)",
  ],
};
