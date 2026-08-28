import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"
import bcrypt from "bcryptjs"
import { logAudit } from "../lib/audit"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departments: true,
        active: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' }
    })

    return res.status(200).json({ users })
  } catch (error) {
    console.error("Fetch users error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

import { z } from "zod"

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "RECRUITER", "PANEL_MEMBER"]),
  departments: z.array(z.string()).optional(),
  active: z.boolean().optional()
})

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const parsed = userSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid user data", details: parsed.error.format() })
    }

    const { name, email, password, role, departments, active } = parsed.data

    if (!password) {
      return res.status(400).json({ error: "Password is required for new users" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        departments: departments || [],
        active: active !== undefined ? active : true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true
      }
    })

    await logAudit(session.id, "CREATED_USER", "User", user.id)

    return res.status(201).json({ user })
  } catch (error: any) {
    console.error("Create user error:", error)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Email already exists" })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const PUT = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const { id, ...bodyData } = req.body

    if (!id) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const parsed = userSchema.safeParse(bodyData)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid user data", details: parsed.error.format() })
    }

    const { name, email, role, departments, active } = parsed.data

    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" })
    }

    const updateData: any = { name, email, role, departments: departments || [] }
    if (active !== undefined) {
      updateData.active = active
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, active: true }
    })

    // Req 13: Prevent inconsistent active relationships if role changed from PANEL_MEMBER
    if (existingUser.role === "PANEL_MEMBER" && role !== "PANEL_MEMBER") {
      await prisma.panelMember.updateMany({
        where: { user_id: id },
        data: { active: false }
      })
    }

    await logAudit(session.id, "UPDATED_USER", "User", user.id)

    return res.status(200).json({ user })
  } catch (error: any) {
    console.error("Update user error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const DELETE = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const { id } = req.body

    if (!id) {
      return res.status(400).json({ error: "Missing user ID" })
    }

    // Prevent deleting self
    if (session.id === id) {
      return res.status(400).json({ error: "Cannot delete yourself" })
    }

    const relations = await prisma.user.findUnique({
      where: { id },
      include: {
        panel_members: { take: 1 },
        interviews: { take: 1 },
        notifications: { take: 1 },
        audit_logs: { take: 1 }
      }
    })

    if (!relations) {
      return res.status(404).json({ error: "User not found" })
    }

    const hasRelations = (
      relations.panel_members.length > 0 ||
      relations.interviews.length > 0 ||
      relations.notifications.length > 0 ||
      relations.audit_logs.length > 0
    )

    if (hasRelations) {
      // Deactivate instead of delete
      await prisma.user.update({
        where: { id },
        data: { active: false }
      })
      await logAudit(session.id, "DEACTIVATED_USER", "User", id)
      return res.status(200).json({ success: true, message: "User deactivated because they have historical records." })
    }

    await prisma.user.delete({
      where: { id }
    })

    await logAudit(session.id, "DELETED_USER", "User", id)

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error("Delete user error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

