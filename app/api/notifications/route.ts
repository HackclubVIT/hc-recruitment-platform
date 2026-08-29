import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/guards"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "50")
  const offset = parseInt(searchParams.get("offset") || "0")
  const unreadOnly = searchParams.get("unreadOnly") === "true"

  const where: Record<string, unknown> = { userId: auth.id }
  if (unreadOnly) where.isRead = false

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
  ])

  const unreadCount = await prisma.notification.count({
    where: { userId: auth.id, isRead: false }
  })

  return NextResponse.json({
    notifications,
    total,
    unreadCount,
    pagination: { limit, offset, total, totalPages: Math.ceil(total / limit) },
  })
}
