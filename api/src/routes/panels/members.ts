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

    const userIdBigInt = BigInt(user_id)

    // Verify panel exists and is ACTIVE
    const panel = await prisma.recruitmentPanel.findUnique({ where: { id: panel_id } })
    if (!panel) {
      return res.status(404).json({ error: "Panel not found" })
    }
    if (panel.status !== "ACTIVE") {
      return res.status(400).json({ error: "Cannot add members to an inactive panel" })
    }

    // Check if user is a panel member role and is active
    const roleAssignment = await prisma.recruitmentRoleAssignment.findUnique({ 
      where: { user_id: userIdBigInt } 
    })
    
    if (!roleAssignment || roleAssignment.role !== "PANEL_MEMBER") {
      return res.status(400).json({ error: "User is not a Panel Member" })
    }
    if (!roleAssignment.active) {
      return res.status(400).json({ error: "Cannot add inactive user to panel" })
    }

    // Check if already in panel
    const existing = await prisma.recruitmentPanelMember.findFirst({
      where: { panel_id, user_id: userIdBigInt }
    })
    
    let member;
    if (existing) {
      if (existing.active) {
        return res.status(409).json({ error: "User already in panel" })
      } else {
        member = await prisma.recruitmentPanelMember.update({
          where: { id: existing.id },
          data: { active: true }
        })
      }
    } else {
      member = await prisma.recruitmentPanelMember.create({
        data: { panel_id, user_id: userIdBigInt }
      })
    }

    await logAudit(BigInt(session.id), "ADDED_PANEL_MEMBER", "PanelMember", member.id.toString())

    return res.status(201).json({ member: { ...member, user_id: member.user_id.toString() } })
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

    const userIdBigInt = BigInt(user_id)

    const member = await prisma.recruitmentPanelMember.findFirst({
      where: { panel_id, user_id: userIdBigInt, active: true }
    })

    if (!member) {
      return res.status(404).json({ error: "Member not found in panel" })
    }

    // Safe historical deletion
    await prisma.recruitmentPanelMember.update({
      where: { id: member.id },
      data: { active: false }
    })

    await logAudit(BigInt(session.id), "REMOVED_PANEL_MEMBER", "PanelMember", member.id.toString())

    return res.status(200).json({ message: "Member removed" })
  } catch (error) {
    console.error("Remove panel member error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
