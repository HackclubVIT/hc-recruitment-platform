import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/guards"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const notificationId = parseInt(id, 10)

  const notification = await prisma.notification.findUnique({ where: { id: notificationId } })
  if (!notification || notification.userId !== BigInt(auth.id)) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 })
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}