import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"
import { parseISTDateToUTC } from "../../lib/timezone"

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
  try {
    const session = await getSession(req)
    if (!session || session.role === "NONE") return res.status(401).json({ error: "Unauthorized" })
    
    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)

    const includeClause: any = {
      panel: {
        include: { members: { include: { user: { select: { name: true, email: true } } } } }
      },
      assigned_members: { include: { user: { select: { name: true, email: true } } } },
      feedback: true,
      application: true
    }

    if (session.role === "PANEL_MEMBER") {
      includeClause.application = {
        select: {
          id: true,
          name: true,
          email: true,
          domain: true,
          registerNumber: true
        }
      }
    }

    const interview = await prisma.recruitmentInterview.findUnique({
      where: { id },
      include: includeClause
    })

    if (!interview) return res.status(404).json({ error: "Not found" })

    // Access control
    if (session.role === "PANEL_MEMBER") {
      const isMember = (interview as any).assigned_members.some((m: any) => m.user_id.toString() === session.id)
      if (!isMember) return res.status(403).json({ error: "Forbidden" })
    } else if (session.role === "RECRUITER") {
      if (!session.departments.includes((interview.application as any).domain)) {
        return res.status(403).json({ error: "Forbidden" })
      }
    }

    if (session.role === "PANEL_MEMBER") {
      delete (interview as any).panel;
    }

    const formattedInterview = {
       ...interview,
       application_id: interview.application_id.toString(),
       candidate: interview.application ? {
           id: (interview.application as any).id.toString(),
           name: (interview.application as any).name,
           department: (interview.application as any).domain,
           registration_number: (interview.application as any).registerNumber
       } : undefined
    }

    return res.status(200).json({ interview: formattedInterview })
  } catch (error) {
    console.error("Fetch interview error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const PUT = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || (session.role !== "ADMIN" && session.role !== "RECRUITER" && session.role !== "PANEL_MEMBER")) {
      return res.status(403).json({ error: "Forbidden" })
    }

    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)
    const { status, date, start_time, meeting_link } = req.body

    if (session.role === "PANEL_MEMBER") {
      if (date || start_time || meeting_link !== undefined) {
        return res.status(403).json({ error: "Panel members cannot reschedule or change meeting links" })
      }
    }

    if ((date && !start_time) || (!date && start_time)) {
      return res.status(400).json({ error: "Both date and start_time must be provided together when rescheduling." })
    }

    if (start_time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start_time)) {
      return res.status(400).json({ error: "Invalid time format, use HH:MM (00:00 - 23:59)" })
    }

    if (date) {
      const [yr, mo, dy] = date.split('-').map(Number)
      const dateCheck = new Date(yr, mo - 1, dy)
      if (isNaN(dateCheck.getTime()) || dateCheck.getFullYear() !== yr || dateCheck.getMonth() !== mo - 1 || dateCheck.getDate() !== dy) {
        return res.status(400).json({ error: `Invalid calendar date: ${date}` })
      }
    }

    const existingInterview = await prisma.recruitmentInterview.findUnique({
      where: { id },
      include: { application: true, panel: { include: { members: true } }, assigned_members: true }
    })

    if (!existingInterview) {
      return res.status(404).json({ error: "Interview not found" })
    }

    if (session.role === "RECRUITER" && !session.departments.includes(existingInterview.application.domain as string)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    if (session.role === "PANEL_MEMBER") {
      const isMember = existingInterview.assigned_members.some((m: any) => m.user_id.toString() === session.id)
      if (!isMember) {
        return res.status(403).json({ error: "Forbidden: Not an active member of this interview panel" })
      }
    }

    if (status) {
      if (session.role === "PANEL_MEMBER" && !["IN_PROGRESS", "COMPLETED"].includes(status)) {
        return res.status(403).json({ error: "Panel Members may only transition status to IN_PROGRESS or COMPLETED." })
      }
      if (!VALID_INTERVIEW_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid interview status. Must be one of: ${VALID_INTERVIEW_STATUSES.join(", ")}` })
      }

      if (status === "FEEDBACK_PENDING" || status === "FEEDBACK_SUBMITTED") {
        return res.status(400).json({ error: "Cannot manually transition to feedback states. These are managed automatically." })
      }

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
      startObj = parseISTDateToUTC(date, start_time)
      endObj = new Date(startObj.getTime() + 10 * 60000)
      targetDate = new Date(date)
      
      updateData.date = targetDate
      updateData.start_time = startObj
      updateData.end_time = endObj
    }

    const interview = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (date && start_time) {
        const memberUserIds = existingInterview.assigned_members.map((m: any) => m.user_id)
        const conflict = await tx.recruitmentInterview.findFirst({
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
            assigned_members: {
              some: {
                user_id: { in: memberUserIds }
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

        const candidateConflict = await tx.recruitmentInterview.findFirst({
          where: {
            id: { not: id },
            application_id: existingInterview.application_id,
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

      const updatedInterview = await tx.recruitmentInterview.update({
        where: { id },
        data: updateData,
        include: { application: true, assigned_members: { include: { user: true } } }
      })

      return updatedInterview
    })

    const { logAudit } = await import("../../lib/audit")
    await logAudit(BigInt(session.id), `UPDATED_INTERVIEW_${status || 'RESCHEDULED'}`, "Interview", id)

    const { createNotification, getRecruitersByDepartment } = await import("../../lib/notify")
    const { sendEmail, templates } = await import("../../lib/email")
    const action = status === "CANCELLED" ? "cancelled" : "updated"
    for (const pm of interview.assigned_members) {
      await createNotification(
        pm.user_id.toString(),
        `Interview ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        `The interview with ${interview.application.name} has been ${action}.`
      )
      
      // Email panel members
      if (pm.user?.email) {
        sendEmail({
          to: pm.user.email,
          subject: `HackClub VIT Recruitment - Interview ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          html: `The interview with ${interview.application.name} (Round ${interview.round}) has been ${action}.<br/>${date ? `New Date: ${date}<br/>New Time: ${start_time}<br/>` : ''}`
        }).catch(console.error);
      }
    }

    if (status === "CANCELLED") {
      sendEmail({
        to: interview.application.email,
        subject: `HackClub VIT Recruitment - Interview Cancelled`,
        html: templates.interviewCancelled(interview.application.name, interview.round)
      }).catch(console.error);
    } else if (date && start_time) {
      sendEmail({
        to: interview.application.email,
        subject: `HackClub VIT Recruitment - Interview Rescheduled (Round ${interview.round})`,
        html: templates.interviewRescheduled(
          interview.application.name, 
          date, 
          start_time, 
          interview.round, 
          meeting_link || interview.meeting_link || "TBD"
        )
      }).catch(console.error);
    }
    
    // Email relevant department recruiters
    if (interview.application.domain && (status === "CANCELLED" || (date && start_time))) {
      const recruiters = await getRecruitersByDepartment(interview.application.domain);
      for (const r of recruiters) {
        if (r.email) {
           sendEmail({
             to: r.email,
             subject: `HackClub VIT Recruitment - Interview ${action.charAt(0).toUpperCase() + action.slice(1)} for ${interview.application.domain}`,
             html: `The interview for candidate ${interview.application.name} (Round ${interview.round}) has been ${action}.<br/>${date ? `New Date: ${date}<br/>New Time: ${start_time}<br/>` : ''}`
           }).catch(console.error);
        }
      }
    }

    return res.status(200).json({ interview: { ...interview, application_id: interview.application_id.toString() } })
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
