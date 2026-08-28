import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session || !["ADMIN", "RECRUITER"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Recruiters only see active panels
    const whereClause = session.role === "RECRUITER" ? { status: "ACTIVE" } : {}

    const panels = await prisma.panel.findMany({
      where: whereClause,
      include: {
        members: {
          include: { user: { select: { name: true, email: true } } }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ panels }, { status: 200 })
  } catch (error) {
    console.error("Fetch panels error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, description } = await req.json()

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    const panel = await prisma.panel.create({
      data: { name, description },
    })

    await logAudit(session.id, "CREATED_PANEL", "Panel", panel.id)

    return NextResponse.json({ panel }, { status: 201 })
  } catch (error) {
    console.error("Create panel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, name, description, status } = await req.json()

    if (!id || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const panel = await prisma.panel.update({
      where: { id },
      data: { name, description, status }
    })

    await logAudit(session.id, "UPDATED_PANEL", "Panel", panel.id)

    return NextResponse.json({ panel }, { status: 200 })
  } catch (error) {
    console.error("Update panel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "Missing panel ID" }, { status: 400 })
    }

    // Must delete panel members first due to foreign key
    await prisma.panelMember.deleteMany({
      where: { panel_id: id }
    })

    await prisma.panel.delete({
      where: { id }
    })

    await logAudit(session.id, "DELETED_PANEL", "Panel", id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Delete panel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

