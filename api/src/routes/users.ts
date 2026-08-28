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

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const { name, email, password, role, departments } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        departments: departments || []
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

    const { id, name, email, role, departments, active } = req.body

    if (!id || !name || !email || !role) {
      return res.status(400).json({ error: "Missing required fields" })
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

