import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  // Protected paths (Requires login)
  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/exams") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/homeworks") ||
    pathname.startsWith("/hackathons") ||
    pathname.startsWith("/teacher");

  // Auth paths
  const isAuthPath = pathname.startsWith("/login");

  if (!token && isProtectedPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && (isAuthPath || pathname === "/")) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/exams/:path*",
    "/history/:path*",
    "/homeworks/:path*",
    "/hackathons/:path*",
    "/teacher/:path*",
  ],
};
