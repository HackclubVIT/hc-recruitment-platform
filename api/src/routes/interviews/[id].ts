import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"

const VALID_INTERVIEW_STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "FEEDBACK_PENDING", "FEEDBACK_SUBMITTED"]

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  "SCHEDULED": ["IN_PROGRESS", "CANCELLED"],
  "IN_PROGRESS": ["COMPLETED", "CANCELLED"],
  "COMPLETED": ["FEEDBACK_PENDING"],
  "FEEDBACK_PENDING": ["FEEDBACK_SUBMITTED"],
  "CANCELLED": [],
  "FEEDBACK_SUBMITTED": []
}

export const GET = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: "Unauthorized" })
    
    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)

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

    if (!interview) return res.status(404).json({ error: "Not found" })

    // Access control
    if (session.role === "PANEL_MEMBER") {
      const isMember = interview.panel.members.some((m: any) => m.user_id === session.id)
      if (!isMember) return res.status(403).json({ error: "Forbidden" })
    }

    if (session.role === "RECRUITER") {
      if (!session.departments.includes(interview.candidate.department)) {
        return res.status(403).json({ error: "Forbidden" })
      }
    }

    return res.status(200).json({ interview })
  } catch (error) {
    console.error("Fetch interview error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const PUT = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const session = await getSession(req)
    if (!session || (session.role !== "ADMIN" && session.role !== "RECRUITER")) {
      return res.status(403).json({ error: "Forbidden" })
    }

    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)
    const { status, date, start_time, meeting_link } = req.body

    const existingInterview = await prisma.interview.findUnique({
      where: { id },
      include: { candidate: true, panel: { include: { members: true } } }
    })

    if (!existingInterview) {
      return res.status(404).json({ error: "Interview not found" })
    }

    if (session.role === "RECRUITER" && !session.departments.includes(existingInterview.candidate.department)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    // Validate interview status enum
    if (status) {
      if (!VALID_INTERVIEW_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid interview status. Must be one of: ${VALID_INTERVIEW_STATUSES.join(", ")}` })
      }

      // Validate status transition
      const allowed = VALID_STATUS_TRANSITIONS[existingInterview.status] || []
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: `Invalid status transition from ${existingInterview.status} to ${status}` })
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
    const interview = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (date && start_time) {
        // 1. Conflict Detection for Panel Members (excluding self)
        const memberUserIds = existingInterview.panel.members.map((m: any) => m.user_id)
        const conflict = await tx.interview.findFirst({
          where: {
            id: { not: id },
            date: targetDate,
            status: { not: "CANCELLED" },
            OR: [
              {
                start_time: { lt: endObj },
                end_time: { gt: startObj }
              }
            ],
            panel: {
              members: {
                some: {
                  user_id: { in: memberUserIds }
                }
              }
            }
          }
        })

        if (conflict) {
          if (conflict.panel_id === existingInterview.panel_id) {
            throw new Error("SLOT_UNAVAILABLE")
          } else {
            throw new Error("MEMBER_CONFLICT")
          }
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
    const { logAudit } = await import("../../lib/audit")
    await logAudit(session.id, `UPDATED_INTERVIEW_${status || 'RESCHEDULED'}`, "Interview", id)

    // Notify Panel Members
    const { createNotification } = await import("../../lib/notify")
    const action = status === "CANCELLED" ? "cancelled" : "updated"
    for (const pm of interview.panel.members) {
      await createNotification(
        pm.user_id,
        `Interview ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        `The interview with ${interview.candidate.name} has been ${action}.`
      )
    }

    return res.status(200).json({ interview })
  } catch (error: any) {
    if (error.message === "SLOT_UNAVAILABLE") {
      return res.status(409).json({ error: "Slot unavailable. The panel is already booked for this time." })
    }
    if (error.message === "MEMBER_CONFLICT") {
      return res.status(409).json({ error: "Slot unavailable. One or more panel members are already booked in another panel for this time." })
    }
    if (error.message === "CANDIDATE_CONFLICT") {
      return res.status(409).json({ error: "Candidate is already scheduled for an interview during this time." })
    }
    console.error("Update interview error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
