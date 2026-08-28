import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"
import { logAudit } from "../../lib/audit"

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const { panel_id, user_id } = req.body

    if (!panel_id || !user_id) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Check if user is a panel member role
    const user = await prisma.user.findUnique({ where: { id: user_id } })
    if (!user || user.role !== "PANEL_MEMBER") {
      return res.status(400).json({ error: "User is not a Panel Member" })
    }

    // Check if already in panel
    const existing = await prisma.panelMember.findFirst({
      where: { panel_id, user_id }
    })
    
    if (existing) {
      return res.status(409).json({ error: "User already in panel" })
    }

    const member = await prisma.panelMember.create({
      data: { panel_id, user_id }
    })

    await logAudit(session.id, "ADDED_PANEL_MEMBER", "PanelMember", member.id)

    return res.status(201).json({ member })
  } catch (error) {
    console.error("Add panel member error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const DELETE = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const { panel_id, user_id } = req.body

    if (!panel_id || !user_id) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const member = await prisma.panelMember.findFirst({
      where: { panel_id, user_id }
    })

    if (!member) {
      return res.status(404).json({ error: "Member not found in panel" })
    }

    await prisma.panelMember.delete({
      where: { id: member.id }
    })

    await logAudit(session.id, "REMOVED_PANEL_MEMBER", "PanelMember", member.id)

    return res.status(200).json({ message: "Member removed" })
  } catch (error) {
    console.error("Remove panel member error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
