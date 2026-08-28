import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await req.json().catch(() => ({}))

    if (id) {
      const result = await prisma.notification.updateMany({
        where: { id: parseInt(id, 10), user_id: session.id },
        data: { read: true }
      })
      if (result.count === 0) {
        return NextResponse.json({ error: "Notification not found or unauthorized" }, { status: 404 })
      }
    } else {
      await prisma.notification.updateMany({
        where: { user_id: session.id, read: false },
        data: { read: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
