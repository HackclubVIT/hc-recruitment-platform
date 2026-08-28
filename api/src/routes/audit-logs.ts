import { Request, Response } from "express";
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    // TASK 9: Proper pagination
    const searchParams = new URLSearchParams(req.query as any)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: {
          user: { select: { name: true, email: true, role: true } }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count()
    ])

    return res.status(200).json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Fetch audit logs error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
