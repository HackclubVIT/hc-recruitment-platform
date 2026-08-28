import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // TASK 9: Proper pagination
    const { searchParams } = new URL(req.url)
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

    return NextResponse.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 })
  } catch (error) {
    console.error("Fetch audit logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
