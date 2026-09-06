import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { decodeTokenPayload } from "./src/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("session")?.value

  // Paths that are explicitly public
  if (
    pathname === "/" ||
    pathname.startsWith("/login") || 
    pathname.startsWith("/recruitment") || 
    pathname.startsWith("/application-success") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/icon.svg")
  ) {
    // If logged in user tries to access /login, redirect to their dashboard
    if (pathname === "/login" && token) {
      const payload = decodeTokenPayload(token)
      if (payload) {
        if (payload.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", request.url))
        if (payload.role === "RECRUITER") return NextResponse.redirect(new URL("/recruiter/dashboard", request.url))
        if (payload.role === "PANEL_MEMBER") return NextResponse.redirect(new URL("/panel/dashboard", request.url))
        return NextResponse.redirect(new URL("/recruitie/dashboard", request.url))
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
    if (role === "RECRUITER") return NextResponse.redirect(new URL("/recruiter/dashboard", request.url))
    if (role === "PANEL_MEMBER") return NextResponse.redirect(new URL("/panel/dashboard", request.url))
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  if (pathname.startsWith("/recruiter") && role !== "RECRUITER") {
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    if (role === "PANEL_MEMBER") return NextResponse.redirect(new URL("/panel/dashboard", request.url))
    return NextResponse.redirect(new URL("/login", request.url))
  }
  
  if (pathname.startsWith("/panel") && role !== "PANEL_MEMBER") {
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    if (role === "RECRUITER") return NextResponse.redirect(new URL("/recruiter/dashboard", request.url))
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (pathname.startsWith("/recruitie") && role !== "NONE") {
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    if (role === "RECRUITER") return NextResponse.redirect(new URL("/recruiter/dashboard", request.url))
    if (role === "PANEL_MEMBER") return NextResponse.redirect(new URL("/panel/dashboard", request.url))
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
