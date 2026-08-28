import { Request, Response } from "express";
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || !["ADMIN", "RECRUITER"].includes(session.role)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    // Recruiters only see active panels
    const whereClause = session.role === "RECRUITER" ? { status: "ACTIVE" } : {}

    const panels = await prisma.panel.findMany({
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

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const { name, description } = req.body

    if (!name) return res.status(400).json({ error: "Name is required" })

    const panel = await prisma.panel.create({
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

    const { id, name, description, status } = req.body

    if (!id || !name) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const panel = await prisma.panel.update({
      where: { id },
      data: { name, description, status }
    })

    await logAudit(session.id, "UPDATED_PANEL", "Panel", panel.id)

    return res.status(200).json({ panel })
  } catch (error) {
    console.error("Update panel error:", error)
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

    // Must delete panel members first due to foreign key
    await prisma.panelMember.deleteMany({
      where: { panel_id: id }
    })

    await prisma.panel.delete({
      where: { id }
    })

    await logAudit(session.id, "DELETED_PANEL", "Panel", id)

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Delete panel error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

