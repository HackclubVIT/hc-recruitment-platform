import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: "Unauthorized" })

    const notifications = await prisma.recruitmentNotification.findMany({
      where: { user_id: BigInt(session.id) },
      orderBy: { created_at: 'desc' },
      take: 20
    })

    const unreadCount = await prisma.recruitmentNotification.count({
      where: { user_id: BigInt(session.id), read: false }
    })

    return res.status(200).json({ notifications, unreadCount })
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}
