import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await req.json().catch(() => ({}))

    if (id) {
      await prisma.notification.update({
        where: { id: parseInt(id, 10) },
        data: { read: true }
      })
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
