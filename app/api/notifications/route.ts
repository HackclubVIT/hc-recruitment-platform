import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const notifications = await prisma.notification.findMany({
      where: { user_id: session.id },
      orderBy: { created_at: 'desc' },
      take: 20
    })

    const unreadCount = await prisma.notification.count({
      where: { user_id: session.id, read: false }
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
