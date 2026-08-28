import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { panel_id, user_id } = await req.json()

    if (!panel_id || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user is a panel member role
    const user = await prisma.user.findUnique({ where: { id: user_id } })
    if (!user || user.role !== "PANEL_MEMBER") {
      return NextResponse.json({ error: "User is not a Panel Member" }, { status: 400 })
    }

    // Check if already in panel
    const existing = await prisma.panelMember.findFirst({
      where: { panel_id, user_id }
    })
    
    if (existing) {
      return NextResponse.json({ error: "User already in panel" }, { status: 409 })
    }

    const member = await prisma.panelMember.create({
      data: { panel_id, user_id }
    })

    await logAudit(session.id, "ADDED_PANEL_MEMBER", "PanelMember", member.id)

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error("Add panel member error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { panel_id, user_id } = await req.json()

    if (!panel_id || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const member = await prisma.panelMember.findFirst({
      where: { panel_id, user_id }
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found in panel" }, { status: 404 })
    }

    await prisma.panelMember.delete({
      where: { id: member.id }
    })

    await logAudit(session.id, "REMOVED_PANEL_MEMBER", "PanelMember", member.id)

    return NextResponse.json({ message: "Member removed" }, { status: 200 })
  } catch (error) {
    console.error("Remove panel member error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
