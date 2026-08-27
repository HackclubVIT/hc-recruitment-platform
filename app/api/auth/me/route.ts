import { NextRequest, NextResponse } from "next/server"
import { getUserFromToken, extractTokenFromHeader } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization")) ||
      request.cookies.get("hc_session_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 403 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[Auth Me] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}