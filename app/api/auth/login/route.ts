import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/db"
import { signToken } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Generate JWT
    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      departments: user.departments,
    })

    // Create response and set cookie
    const response = NextResponse.json(
      { 
        message: "Logged in successfully",
        user: { id: user.id, email: user.email, role: user.role }
      },
      { status: 200 }
    )

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
