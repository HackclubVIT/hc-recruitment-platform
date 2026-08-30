import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: "Unauthorized" })

    const searchParams = new URLSearchParams(req.query as Record<string, string>)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20))
    const skip = (page - 1) * limit

    const [notifications, total] = await Promise.all([
      prisma.recruitmentNotification.findMany({
        where: { user_id: BigInt(session.id) },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.recruitmentNotification.count({
        where: { user_id: BigInt(session.id) }
      })
    ])

    const unreadCount = await prisma.recruitmentNotification.count({
      where: { user_id: BigInt(session.id), read: false }
    })

    return res.status(200).json({ 
      notifications, 
      unreadCount,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}
