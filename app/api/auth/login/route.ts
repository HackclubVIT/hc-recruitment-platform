import { NextRequest, NextResponse } from "next/server"

/**
 * Local login route — acts as a thin proxy to the main site's auth API.
 * The client calls the main site directly for login, but this route exists
 * as a fallback / for server-side token verification flows.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Proxy to the main site's auth API
    const MAIN_SITE_API = process.env.MAIN_SITE_API || "http://localhost:5000/api"
    const upstream = await fetch(`${MAIN_SITE_API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data.error || "Login failed" },
        { status: upstream.status }
      )
    }

    const response = NextResponse.json(data)

    // Also set an httpOnly cookie for server-side auth
    if (data.token) {
      response.cookies.set("hc_session_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
    }

    return response
  } catch (error) {
    console.error("[Auth Login] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}