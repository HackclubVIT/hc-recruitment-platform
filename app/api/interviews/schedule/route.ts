import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { createNotification } from "@/lib/notify"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "RECRUITER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { candidate_id, panel_id, date, start_time, meeting_link } = await req.json()

    if (!candidate_id || !panel_id || !date || !start_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Default duration 10 minutes based on requirements
    const startObj = new Date(`${date}T${start_time}:00Z`)
    const endObj = new Date(startObj.getTime() + 10 * 60000)

    // 1. Conflict Detection: Double-booking Prevention
    const conflict = await prisma.interview.findFirst({
      where: {
        panel_id,
        date: new Date(date),
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
      return NextResponse.json({ error: "Slot unavailable. The panel is already booked for this time." }, { status: 409 })
    }

    // 2. Prevent candidate overlap
    const candidateConflict = await prisma.interview.findFirst({
      where: {
        candidate_id,
        date: new Date(date),
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
      return NextResponse.json({ error: "Candidate is already scheduled for an interview during this time." }, { status: 409 })
    }

    // Create the interview
    const interview = await prisma.interview.create({
      data: {
        candidate_id,
        panel_id,
        recruiter_id: session.id,
        date: new Date(date),
        start_time: startObj,
        end_time: endObj,
        meeting_link,
        status: "SCHEDULED"
      },
      include: { candidate: true, panel: true }
    })

    // Update Application Status
    const application = await prisma.application.findFirst({
      where: { candidate_id },
      orderBy: { submitted_at: 'desc' }
    })
    
    if (application) {
      await prisma.application.update({
        where: { id: application.id },
        data: { status: "INTERVIEW_SCHEDULED" }
      })
    }

    await logAudit(session.id, "SCHEDULED_INTERVIEW", "Interview", interview.id)

    // Notify Panel Members
    const panelMembers = await prisma.panelMember.findMany({ where: { panel_id } })
    for (const pm of panelMembers) {
      await createNotification(
        pm.user_id,
        "New Interview Scheduled",
        `You have a new interview scheduled with ${interview.candidate.name} on ${date} at ${start_time}.`
      )
    }

    return NextResponse.json({ message: "Interview scheduled successfully", interview }, { status: 201 })
  } catch (error) {
    console.error("Schedule interview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
