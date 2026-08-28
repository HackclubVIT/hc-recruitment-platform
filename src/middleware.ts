import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { decodeTokenPayload } from "./lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("session")?.value

  // Paths that are explicitly public
  if (
    pathname.startsWith("/login") || 
    pathname.startsWith("/recruitment") || 
    pathname.startsWith("/application-success") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    // If logged in user tries to access /login, redirect to their dashboard
    if (pathname === "/login" && token) {
      const payload = decodeTokenPayload(token)
      if (payload) {
        if (payload.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", request.url))
        if (payload.role === "RECRUITER") return NextResponse.redirect(new URL("/recruiter/dashboard", request.url))
        if (payload.role === "PANEL_MEMBER") return NextResponse.redirect(new URL("/panel/dashboard", request.url))
      }
    }
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const payload = decodeTokenPayload(token)
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("session")
    return response
  }

  const role = payload.role as string

  // Role-based protection
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  if (pathname.startsWith("/recruiter") && !["ADMIN", "RECRUITER"].includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  if (pathname.startsWith("/panel") && !["ADMIN", "PANEL_MEMBER"].includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
