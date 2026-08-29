import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"
import { logAudit } from "../lib/audit"
import { z } from "zod"

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
        registerNumber: true,
        department: true, // This is HC main department
        status: true,
        recruitmentRole: {
          select: {
            role: true,
            departments: true, // This is recruitment departments
            active: true
          }
        }
      },
    })

    const formattedUsers = users.map(u => ({
      id: u.id.toString(),
      name: u.name,
      email: u.email,
      registerNumber: u.registerNumber,
      hcDepartment: u.department,
      status: u.status,
      role: u.recruitmentRole?.role || "NONE",
      departments: u.recruitmentRole?.departments || [],
      active: u.recruitmentRole?.active ?? true
    }))

    return res.status(200).json({ users: formattedUsers })
  } catch (error) {
    console.error("Fetch users error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

const updateSchema = z.object({
  id: z.string(),
  role: z.enum(["ADMIN", "RECRUITER", "PANEL_MEMBER", "NONE"]),
  departments: z.array(z.string()).optional(),
  active: z.boolean().optional()
})

// POST /users is intentionally omitted. Creating users via recruitment API is disallowed.

export const PUT = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid user data", details: parsed.error.format() })
    }

    const { id, role, departments, active } = parsed.data
    const userIdBigInt = BigInt(id)

    const existingUser = await prisma.user.findUnique({ where: { id: userIdBigInt } })
    if (!existingUser) {
      return res.status(404).json({ error: "HC User not found" })
    }

    const assignment = await prisma.recruitmentRoleAssignment.upsert({
      where: { user_id: userIdBigInt },
      update: {
        role,
        departments: departments || [],
        active: active !== undefined ? active : true
      },
      create: {
        user_id: userIdBigInt,
        role,
        departments: departments || [],
        active: active !== undefined ? active : true
      }
    })

    if (role !== "PANEL_MEMBER") {
      await prisma.recruitmentPanelMember.updateMany({
        where: { user_id: userIdBigInt },
        data: { active: false }
      })
    }

    await logAudit(BigInt(session.id), "UPDATED_RECRUITMENT_ROLE", "RecruitmentRoleAssignment", assignment.id.toString())

    return res.status(200).json({ 
      user: {
        id: id,
        role: assignment.role,
        departments: assignment.departments,
        active: assignment.active
      } 
    })
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

    if (session.id === id) {
      return res.status(400).json({ error: "Cannot deactivate yourself" })
    }

    const userIdBigInt = BigInt(id)

    // Deactivate instead of delete
    await prisma.recruitmentRoleAssignment.update({
      where: { user_id: userIdBigInt },
      data: { active: false, role: 'NONE' }
    })
    
    await logAudit(BigInt(session.id), "DEACTIVATED_RECRUITMENT_ROLE", "User", id)
    return res.status(200).json({ success: true, message: "User recruitment access deactivated." })
  } catch (error: any) {
    console.error("Deactivate user error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
