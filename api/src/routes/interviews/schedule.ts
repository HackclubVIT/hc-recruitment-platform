import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"
import { logAudit } from "../../lib/audit"
import { createNotification } from "../../lib/notify"
import { z } from "zod"

const VALID_INTERVIEW_STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "FEEDBACK_PENDING", "FEEDBACK_SUBMITTED"]

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  "SCHEDULED": ["IN_PROGRESS", "CANCELLED"],
  "IN_PROGRESS": ["COMPLETED", "CANCELLED"],
  "COMPLETED": ["FEEDBACK_PENDING"],
  "FEEDBACK_PENDING": ["FEEDBACK_SUBMITTED"],
  "CANCELLED": [],
  "FEEDBACK_SUBMITTED": []
}

const scheduleSchema = z.object({
  candidate_id: z.number().int().positive(),
  panel_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  meeting_link: z.string().url().optional().or(z.literal(''))
})

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || (session.role !== "ADMIN" && session.role !== "RECRUITER")) {
      return res.status(403).json({ error: "Forbidden" })
    }

    const body = req.body
    const parsed = scheduleSchema.safeParse(body)
    
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload data", details: parsed.error.format() })
    }

    const { candidate_id, panel_id, date, start_time, meeting_link } = parsed.data

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidate_id },
      include: { applications: { orderBy: { submitted_at: 'desc' }, take: 1 } }
    })

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" })
    }

    if (session.role === "RECRUITER") {
      const isAssigned = session.departments?.includes(candidate.department)
      if (!isAssigned) {
        return res.status(403).json({ error: "Forbidden: Candidate belongs to unassigned department" })
      }
    }

    const appStatus = candidate.applications[0]?.status
    if (appStatus !== "SHORTLISTED" && appStatus !== "FURTHER_ROUND") {
      return res.status(400).json({ error: `Candidate is not eligible for scheduling (Current status: ${appStatus})` })
    }

    // Validate panel exists and is active
    const panel = await prisma.panel.findUnique({ where: { id: panel_id } })
    if (!panel) {
      return res.status(404).json({ error: "Panel not found" })
    }
    if (panel.status !== "ACTIVE") {
      return res.status(400).json({ error: "Panel is not active" })
    }

    const startObj = new Date(`${date}T${start_time}:00Z`)
    const endObj = new Date(startObj.getTime() + 10 * 60000) // 10 minutes default

    // Calculate next round number
    const lastInterview = await prisma.interview.findFirst({
      where: { candidate_id, status: { not: "CANCELLED" } },
      orderBy: { round: 'desc' }
    })
    const nextRound = lastInterview ? lastInterview.round + 1 : 1

    // Prevent scheduling conflicts with a transaction
    const application_id = candidate.applications[0].id;
    const interview = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
          application_id,
          panel_id,
          recruiter_id: session.id,
          round: nextRound,  // Use calculated round
          date: new Date(date),
          start_time: startObj,
          end_time: endObj,
          meeting_link: meeting_link || null,
          status: "SCHEDULED"
        },
        include: { candidate: true, panel: true }
      })

      await tx.application.update({
        where: { id: application_id },
        data: { status: "INTERVIEW_SCHEDULED" }
      })

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

    return res.status(201).json({ message: "Interview scheduled successfully", interview })
  } catch (error: any) {
    if (error.message === "SLOT_UNAVAILABLE") {
      return res.status(409).json({ error: "Slot unavailable. The panel is already booked for this time." })
    }
    if (error.message === "CANDIDATE_CONFLICT") {
      return res.status(409).json({ error: "Candidate is already scheduled for an interview during this time." })
    }
    console.error("Schedule interview error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
