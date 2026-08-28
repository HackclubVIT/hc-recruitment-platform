import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

const VALID_INTERVIEW_STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "FEEDBACK_PENDING", "FEEDBACK_SUBMITTED"]

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  "SCHEDULED": ["IN_PROGRESS", "CANCELLED"],
  "IN_PROGRESS": ["COMPLETED", "CANCELLED"],
  "COMPLETED": ["FEEDBACK_PENDING"],
  "FEEDBACK_PENDING": ["FEEDBACK_SUBMITTED"],
  "CANCELLED": [],
  "FEEDBACK_SUBMITTED": []
}

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

    const existingInterview = await prisma.interview.findUnique({
      where: { id },
      include: { candidate: true, panel: { include: { members: true } } }
    })

    if (!existingInterview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

    if (session.role === "RECRUITER" && !session.departments.includes(existingInterview.candidate.department)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // TASK 7: Validate interview status enum
    if (status) {
      if (!VALID_INTERVIEW_STATUSES.includes(status)) {
        return NextResponse.json({ error: `Invalid interview status. Must be one of: ${VALID_INTERVIEW_STATUSES.join(", ")}` }, { status: 400 })
      }

      // Validate status transition
      const allowed = VALID_STATUS_TRANSITIONS[existingInterview.status] || []
      if (!allowed.includes(status) && session.role !== "ADMIN") {
        return NextResponse.json({ error: `Invalid status transition from ${existingInterview.status} to ${status}` }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link

    let startObj = existingInterview.start_time
    let endObj = existingInterview.end_time
    let targetDate = existingInterview.date

    if (date && start_time) {
      startObj = new Date(`${date}T${start_time}:00Z`)
      endObj = new Date(startObj.getTime() + 10 * 60000)
      targetDate = new Date(date)
      
      updateData.date = targetDate
      updateData.start_time = startObj
      updateData.end_time = endObj
    }

    // Transactional logic to prevent race conditions during rescheduling
    const interview = await prisma.$transaction(async (tx) => {
      if (date && start_time) {
        // 1. Conflict Detection for Panel (excluding self)
        const conflict = await tx.interview.findFirst({
          where: {
            id: { not: id },
            panel_id: existingInterview.panel_id,
            date: targetDate,
            status: { not: "CANCELLED" },
            OR: [
              {
                start_time: { lt: endObj },
                end_time: { gt: startObj }
              }
            ]
          }
        })

        if (conflict) {
          throw new Error("SLOT_UNAVAILABLE")
        }

        // 2. Conflict Detection for Candidate (excluding self)
        const candidateConflict = await tx.interview.findFirst({
          where: {
            id: { not: id },
            candidate_id: existingInterview.candidate_id,
            date: targetDate,
            status: { not: "CANCELLED" },
            OR: [
              {
                start_time: { lt: endObj },
                end_time: { gt: startObj }
              }
            ]
          }
        })

        if (candidateConflict) {
          throw new Error("CANDIDATE_CONFLICT")
        }
      }

      const updatedInterview = await tx.interview.update({
        where: { id },
        data: updateData,
        include: { candidate: true, panel: { include: { members: true } } }
      })

      return updatedInterview
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
  } catch (error: any) {
    if (error.message === "SLOT_UNAVAILABLE") {
      return NextResponse.json({ error: "Slot unavailable. The panel is already booked for this time." }, { status: 409 })
    }
    if (error.message === "CANDIDATE_CONFLICT") {
      return NextResponse.json({ error: "Candidate is already scheduled for an interview during this time." }, { status: 409 })
    }
    console.error("Update interview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
