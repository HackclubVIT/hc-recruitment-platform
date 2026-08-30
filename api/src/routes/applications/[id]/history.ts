import { Request, Response } from "express";
import prisma from "../../../lib/db"
import { getSession } from "../../../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: "Unauthorized" })

    const id = BigInt((req.params as any).id as string)

    if (session.role === "RECRUITER") {
      const application = await prisma.recruitmentApplication.findUnique({ where: { id } })
      if (!application) return res.status(404).json({ error: "Application not found" })
      if (!session.departments.includes(application.domain as string)) {
        return res.status(403).json({ error: "Forbidden" })
      }
    } else if (session.role === "PANEL_MEMBER") {
      const hasAccess = await prisma.recruitmentInterview.findFirst({
        where: {
          application_id: id,
          assigned_members: { some: { user_id: BigInt(session.id) } }
        }
      })
      if (!hasAccess) return res.status(403).json({ error: "Forbidden" })
    } else if (session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const logs = await prisma.recruitmentAuditLog.findMany({
      where: {
        entity: "Application",
        entity_id: id.toString()
      },
      include: { user: { select: { name: true } } },
      orderBy: { timestamp: "desc" }
    })

    const items = logs.map(l => ({
      id: l.id,
      action: l.action,
      user: (l.user as any)?.name || "System",
      timestamp: l.timestamp
    }))

    return res.status(200).json({ history: items })
  } catch (error) {
    console.error("Fetch history error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
