import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"
import { logAudit } from "../lib/audit"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || !["ADMIN", "RECRUITER"].includes(session.role)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    // Recruiters only see active panels
    const whereClause = session.role === "RECRUITER" ? { status: "ACTIVE" } : {}

    const panels = await prisma.recruitmentPanel.findMany({
      where: whereClause,
      include: {
        members: {
          include: { user: { select: { name: true, email: true } } }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return res.status(200).json({ panels })
  } catch (error) {
    console.error("Fetch panels error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

import { z } from "zod"

const panelSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
})

const panelUpdateSchema = panelSchema.extend({
  id: z.number().int().positive(),
  status: z.enum(["ACTIVE", "INACTIVE"])
})

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const parsed = panelSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid panel data", details: parsed.error.format() })
    }

    const { name, description } = parsed.data

    const panel = await prisma.recruitmentPanel.create({
      data: { name, description },
    })

    await logAudit(session.id, "CREATED_PANEL", "Panel", panel.id)

    return res.status(201).json({ panel })
  } catch (error) {
    console.error("Create panel error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const PUT = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const parsed = panelUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid panel update data", details: parsed.error.format() })
    }

    const { id, name, description, status } = parsed.data

    const panel = await prisma.recruitmentPanel.update({
      where: { id },
      data: { name, description, status }
    })

    await logAudit(session.id, "UPDATED_PANEL", "Panel", panel.id)

    return res.status(200).json({ panel })
  } catch (error: any) {
    console.error("Update panel error:", error)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Panel not found" })
    }
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
      return res.status(400).json({ error: "Missing panel ID" })
    }

    const panelRelations = await prisma.recruitmentPanel.findUnique({
      where: { id },
      include: { interviews: { take: 1 } }
    })

    if (!panelRelations) {
      return res.status(404).json({ error: "Panel not found" })
    }

    if (panelRelations.interviews.length > 0) {
      // Prevent deletion, deactivate instead
      await prisma.recruitmentPanel.update({
        where: { id },
        data: { status: "INACTIVE" }
      })
      await logAudit(session.id, "DEACTIVATED_PANEL", "Panel", id)
      return res.status(200).json({ success: true, message: "Panel deactivated because it has historical interviews." })
    }

    // Must delete panel members first due to foreign key
    await prisma.recruitmentPanelMember.deleteMany({
      where: { panel_id: id }
    })

    await prisma.recruitmentPanel.delete({
      where: { id }
    })

    await logAudit(session.id, "DELETED_PANEL", "Panel", id)

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Delete panel error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

