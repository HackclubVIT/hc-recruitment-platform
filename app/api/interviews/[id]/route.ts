import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: {
          include: { applications: true }
        },
        panel: {
          include: { members: true }
        }
      }
    })

    if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Access control
    if (session.role === "PANEL_MEMBER") {
      const isMember = interview.panel.members.some((m: any) => m.user_id === session.id)
      if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (session.role === "RECRUITER") {
      if (!session.departments.includes(interview.candidate.department)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json({ interview }, { status: 200 })
  } catch (error) {
    console.error("Fetch interview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "RECRUITER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const { status, date, start_time, meeting_link } = await req.json()

    const updateData: any = {}
    if (status) updateData.status = status
    if (date && start_time) {
      const startObj = new Date(`${date}T${start_time}:00Z`)
      const endObj = new Date(startObj.getTime() + 10 * 60000)
      updateData.date = new Date(date)
      updateData.start_time = startObj
      updateData.end_time = endObj
    }
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link

    const interview = await prisma.interview.update({
      where: { id },
      data: updateData,
      include: { candidate: true, panel: { include: { members: true } } }
    })

    // Log audit
    const { logAudit } = await import("@/lib/audit")
    await logAudit(session.id, `UPDATED_INTERVIEW_${status || 'RESCHEDULED'}`, "Interview", id)

    // Notify Panel Members
    const { createNotification } = await import("@/lib/notify")
    const action = status === "CANCELLED" ? "cancelled" : "updated"
    for (const pm of interview.panel.members) {
      await createNotification(
        pm.user_id,
        `Interview ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        `The interview with ${interview.candidate.name} has been ${action}.`
      )
    }

    return NextResponse.json({ interview }, { status: 200 })
  } catch (error) {
    console.error("Update interview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

