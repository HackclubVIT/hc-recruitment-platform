import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { createNotification } from "@/lib/notify"
import { z } from "zod"

const scheduleSchema = z.object({
  candidate_id: z.number().int().positive(),
  panel_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  meeting_link: z.string().url().optional().or(z.literal(''))
})

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "RECRUITER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = scheduleSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload data", details: parsed.error.format() }, { status: 400 })
    }

    const { candidate_id, panel_id, date, start_time, meeting_link } = parsed.data

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidate_id },
      include: { applications: { orderBy: { submitted_at: 'desc' }, take: 1 } }
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    if (session.role === "RECRUITER") {
      const isAssigned = session.departments?.includes(candidate.department)
      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden: Candidate belongs to unassigned department" }, { status: 403 })
      }
    }

    const appStatus = candidate.applications[0]?.status
    if (appStatus !== "SHORTLISTED" && appStatus !== "FURTHER_ROUND") {
      return NextResponse.json({ error: `Candidate is not eligible for scheduling (Current status: ${appStatus})` }, { status: 400 })
    }

    const startObj = new Date(`${date}T${start_time}:00Z`)
    const endObj = new Date(startObj.getTime() + 10 * 60000) // 10 minutes default

    // Transactional logic to prevent race conditions during scheduling
    const interview = await prisma.$transaction(async (tx) => {
      // 1. Conflict Detection for Panel
      const conflict = await tx.interview.findFirst({
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
        throw new Error("SLOT_UNAVAILABLE")
      }

      // 2. Conflict Detection for Candidate
      const candidateConflict = await tx.interview.findFirst({
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
        throw new Error("CANDIDATE_CONFLICT")
      }

      const newInterview = await tx.interview.create({
        data: {
          candidate_id,
          panel_id,
          recruiter_id: session.id,
          date: new Date(date),
          start_time: startObj,
          end_time: endObj,
          meeting_link: meeting_link || null,
          status: "SCHEDULED"
        },
        include: { candidate: true, panel: true }
      })

      if (candidate.applications.length > 0) {
        await tx.application.update({
          where: { id: candidate.applications[0].id },
          data: { status: "INTERVIEW_SCHEDULED" }
        })
      }

      return newInterview
    })

    await logAudit(session.id, "SCHEDULED_INTERVIEW", "Interview", interview.id)

    const panelMembers = await prisma.panelMember.findMany({ where: { panel_id } })
    for (const pm of panelMembers) {
      await createNotification(
        pm.user_id,
        "New Interview Scheduled",
        `You have a new interview scheduled with ${interview.candidate.name} on ${date} at ${start_time}.`
      )
    }

    return NextResponse.json({ message: "Interview scheduled successfully", interview }, { status: 201 })
  } catch (error: any) {
    if (error.message === "SLOT_UNAVAILABLE") {
      return NextResponse.json({ error: "Slot unavailable. The panel is already booked for this time." }, { status: 409 })
    }
    if (error.message === "CANDIDATE_CONFLICT") {
      return NextResponse.json({ error: "Candidate is already scheduled for an interview during this time." }, { status: 409 })
    }
    console.error("Schedule interview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
