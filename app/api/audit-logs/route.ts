import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 100 // Limit for performance
    })

    return NextResponse.json({ logs }, { status: 200 })
  } catch (error) {
    console.error("Fetch audit logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
