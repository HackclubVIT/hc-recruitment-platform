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

    let userIdBigInt: bigint;
    try {
      userIdBigInt = BigInt(session.id);
    } catch {
      return res.status(200).json({
        notifications: [],
        unreadCount: 0,
        page,
        limit,
        total: 0,
        totalPages: 0
      });
    }

    const [notifications, total] = await Promise.all([
      prisma.recruitmentNotification.findMany({
        where: { user_id: userIdBigInt },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.recruitmentNotification.count({
        where: { user_id: userIdBigInt }
      })
    ])

    const unreadCount = await prisma.recruitmentNotification.count({
      where: { user_id: userIdBigInt, read: false }
    })

    const formattedNotifications = notifications.map(n => ({
      ...n,
      user_id: n.user_id.toString()
    }))

    return res.status(200).json({ 
      notifications: formattedNotifications, 
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
