import { Request, Response } from "express";
import bcrypt from "bcryptjs"
import prisma from "../../lib/db"
import { signToken } from "../../lib/auth"

export const POST = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json(
        { error: "Email and password are required" })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { recruitmentRole: true }
    })

    if (!user) {
      return res.status(401).json(
        { error: "Invalid credentials" })
    }

    if (user.status !== "Active") {
      return res.status(403).json(
        { error: "Account is inactive" })
    }

    if (!user.password) {
      return res.status(401).json(
        { error: "Invalid credentials" })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json(
        { error: "Invalid credentials" })
    }

    const active = user.recruitmentRole?.active ?? true
    if (!active) {
      return res.status(403).json(
        { error: "Recruitment access is inactive" })
    }

    const recruitmentRole = user.recruitmentRole?.role || "NONE"
    const departments = user.recruitmentRole?.departments || []

    // Generate JWT
    const token = await signToken({
      id: user.id.toString(),
      email: user.email!,
      role: recruitmentRole,
      departments: departments,
    })

    // Create response and set cookie
    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      path: "/",
    })

    return res.status(200).json(
      { 
        message: "Logged in successfully",
        user: { id: user.id.toString(), email: user.email, role: recruitmentRole }
      }
    )
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json(
      { error: "Internal server error" })
  }
}
