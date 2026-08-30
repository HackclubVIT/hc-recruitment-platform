import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"
import { logAudit } from "../../lib/audit"
import { createNotification, getRecruitersByDepartment } from "../../lib/notify"
import { sendEmail, templates } from "../../lib/email"
import { z } from "zod"
import { parseISTDateToUTC } from "../../lib/timezone"

const scheduleSchema = z.object({
  application_id: z.string(), // Since BigInt is stringified in frontend JSON
  panel_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format, use YYYY-MM-DD" }),
  start_time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, { message: "Invalid time format, use HH:MM (00:00 - 23:59)" }),
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

    const { application_id, panel_id, date, start_time, meeting_link } = parsed.data
    const appIdBigInt = BigInt(application_id)

    const [year, month, day] = date.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
      return res.status(400).json({ error: `Invalid calendar date: ${date}` })
    }

    const application = await prisma.recruitmentApplication.findUnique({
      where: { id: appIdBigInt }
    })

    if (!application) {
      return res.status(404).json({ error: "Application not found" })
    }

    if (session.role === "RECRUITER") {
      const isAssigned = session.departments?.includes(application.domain as string)
      if (!isAssigned) {
        return res.status(403).json({ error: "Forbidden: Candidate belongs to unassigned department" })
      }
    }

    const appStatus = application.status
    if (appStatus !== "SHORTLISTED" && appStatus !== "FURTHER_ROUND") {
      return res.status(400).json({ error: `Application is not eligible for scheduling (Current status: ${appStatus})` })
    }

    const panel = await prisma.recruitmentPanel.findUnique({ 
      where: { id: panel_id },
      include: { members: { where: { active: true, user: { status: "Active" } }, include: { user: true } } }
    })
    if (!panel) {
      return res.status(404).json({ error: "Panel not found" })
    }
    if (panel.status !== "ACTIVE") {
      return res.status(400).json({ error: "Panel is not active" })
    }

    const startObj = parseISTDateToUTC(date, start_time)
    const endObj = new Date(startObj.getTime() + 10 * 60000)

    const lastInterview = await prisma.recruitmentInterview.findFirst({
      where: { application_id: appIdBigInt, status: { not: "CANCELLED" } },
      orderBy: { round: 'desc' }
    })
    const nextRound = lastInterview ? lastInterview.round + 1 : 1

    const interview = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const candidateConflict = await tx.recruitmentInterview.findFirst({
        where: {
          application_id: appIdBigInt,
          date: new Date(date),
          status: { not: "CANCELLED" },
          OR: [
            { start_time: { lt: endObj }, end_time: { gt: startObj } }
          ]
        }
      })
      if (candidateConflict) {
        throw new Error("CANDIDATE_CONFLICT")
      }

      const panelConflict = await tx.recruitmentInterview.findFirst({
        where: {
          panel_id: panel_id,
          date: new Date(date),
          status: { not: "CANCELLED" },
          OR: [
            { start_time: { lt: endObj }, end_time: { gt: startObj } }
          ]
        }
      })
      if (panelConflict) {
        throw new Error("SLOT_UNAVAILABLE")
      }

      const memberUserIds = panel.members.map((m: any) => m.user_id)
      if (memberUserIds.length > 0) {
        const memberConflict = await tx.recruitmentInterview.findFirst({
          where: {
            date: new Date(date),
            status: { not: "CANCELLED" },
            OR: [
              { start_time: { lt: endObj }, end_time: { gt: startObj } }
            ],
            assigned_members: {
              some: { user_id: { in: memberUserIds } }
            }
          }
        })
        if (memberConflict) {
          throw new Error("MEMBER_CONFLICT")
        }
      }

      const activePanelMembers = panel.members.map((m: any) => ({ id: m.id }))

      const newInterview = await tx.recruitmentInterview.create({
        data: {
          application_id: appIdBigInt,
          panel_id,
          recruiter_id: BigInt(session.id),
          round: nextRound,
          date: new Date(date),
          start_time: startObj,
          end_time: endObj,
          meeting_link: meeting_link || null,
          status: "SCHEDULED",
          assigned_members: {
            connect: activePanelMembers
          }
        },
        include: { application: true, panel: true, assigned_members: true }
      })

      await tx.recruitmentApplication.update({
        where: { id: appIdBigInt },
        data: { status: "INTERVIEW_SCHEDULED" }
      })

      return newInterview
    })

    await logAudit(BigInt(BigInt(session.id).toString()), "SCHEDULED_INTERVIEW", "Interview", interview.id)

    for (const pm of panel.members) {
      await createNotification(
        pm.user_id.toString(),
        "New Interview Scheduled",
        `You have a new interview scheduled with ${application.name} on ${date} at ${start_time}.`
      )
      
      // Email panel members
      if (pm.user.email) {
        sendEmail({
          to: pm.user.email,
          subject: `HackClub VIT Recruitment - Interview Panel Assignment`,
          html: `You have been assigned to an interview panel for candidate ${application.name} (Round ${interview.round}).<br/>Date: ${date}<br/>Time: ${start_time}<br/>Link: ${meeting_link || "TBD"}`
        }).catch(console.error);
      }
    }

    // Email candidate
    if (application.email) {
      sendEmail({
        to: application.email,
        subject: `HackClub VIT Recruitment - Interview Scheduled (Round ${interview.round})`,
        html: templates.interviewScheduled(application.name, date, start_time, 10, interview.round, meeting_link || "TBD")
      }).catch(console.error);
    }

    // Email relevant department recruiters
    if (application.domain) {
      const recruiters = await getRecruitersByDepartment(application.domain);
      for (const r of recruiters) {
        if (r.email) {
           sendEmail({
             to: r.email,
             subject: `HackClub VIT Recruitment - Interview Scheduled for ${application.domain}`,
             html: `An interview has been scheduled for candidate ${application.name} (Round ${interview.round}).<br/>Date: ${date}<br/>Time: ${start_time}<br/>Link: ${meeting_link || "TBD"}`
           }).catch(console.error);
        }
      }
    }

    return res.status(201).json({ message: "Interview scheduled successfully", interview: { ...interview, application_id: interview.application_id.toString() } })
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
    console.error("Schedule interview error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
