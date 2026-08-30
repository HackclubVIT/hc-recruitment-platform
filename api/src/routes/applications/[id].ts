import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"
import { logAudit } from "../../lib/audit"
import { createNotification } from "../../lib/notify"
import { sendEmail, templates } from "../../lib/email"
import { z } from "zod"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const resolvedParams = req.params
    const id = BigInt(resolvedParams.id as string)

    const includeClause = {
      formSubmission: {
        include: {
          form: { include: { questions: true } },
          answers: true
        }
      },
      interviews: {
        include: {
          assigned_members: true,
          feedback: true
        }
      }
    }

    const application = await prisma.recruitmentApplication.findUnique({
      where: { id },
      include: includeClause
    })

    if (!application) {
      return res.status(404).json({ error: "Application not found" })
    }

    // Authorization
    if (session.role === "RECRUITER") {
      if (!session.departments?.includes(application.domain as string)) {
        return res.status(403).json({ error: "Forbidden" })
      }
    }

    if (session.role === "PANEL_MEMBER") {
      const hasAccess = await prisma.recruitmentInterview.findFirst({
        where: {
          application_id: id,
          assigned_members: { some: { user_id: BigInt(session.id) } }
        }
      })
      if (!hasAccess) {
        return res.status(403).json({ error: "Forbidden" })
      }
    }

    if (session.role === "NONE") {
      if (application.email !== session.email) {
        return res.status(403).json({ error: "Forbidden" })
      }
    }
    
    // Format response to serialize BigInts
    const formattedApp = {
      ...application,
      id: application.id.toString(),
      decided_by: application.decided_by?.toString() || null,
    };

    return res.status(200).json({ application: formattedApp })
  } catch (error) {
    console.error("Fetch application error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

const updateSchema = z.object({
  status: z.enum([
    "Pending", "APPLIED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED", 
    "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", 
    "SELECTED", "WAITLISTED", "FURTHER_ROUND"
  ]),
  reason: z.string().optional()
})

export const PUT = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || (session.role !== "ADMIN" && session.role !== "RECRUITER")) {
      return res.status(403).json({ error: "Forbidden" })
    }
    
    const resolvedParams = req.params
    const id = BigInt(resolvedParams.id as string)
    
    const body = req.body
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid status value" })
    }
    const { status, reason } = parsed.data

    const existingApplication = await prisma.recruitmentApplication.findUnique({
      where: { id }
    })

    if (!existingApplication) {
      return res.status(404).json({ error: "Application not found" })
    }

    // Recruiter Department Authorization
    if (session.role === "RECRUITER") {
      const isAssigned = session.departments?.includes(existingApplication.domain as string)
      if (!isAssigned) {
        return res.status(403).json({ error: "Forbidden: Candidate belongs to unassigned department" })
      }
    }

    // Valid Status Lifecycle checks
    const currentStatus = existingApplication.status
    const validTransitions: Record<string, string[]> = {
      "Pending": ["APPLIED", "UNDER_REVIEW", "REJECTED"],
      "APPLIED": ["UNDER_REVIEW", "REJECTED"],
      "UNDER_REVIEW": ["SHORTLISTED", "REJECTED"],
      "SHORTLISTED": ["INTERVIEW_SCHEDULED", "REJECTED"],
      "INTERVIEW_SCHEDULED": ["INTERVIEW_COMPLETED", "REJECTED"],
      "INTERVIEW_COMPLETED": ["SELECTED", "REJECTED", "WAITLISTED", "FURTHER_ROUND"],
      "WAITLISTED": ["SELECTED", "REJECTED"],
      "FURTHER_ROUND": ["INTERVIEW_SCHEDULED", "REJECTED"]
    }

    const allowedNext = validTransitions[currentStatus] || []
    if (!allowedNext.includes(status)) {
      return res.status(400).json({ error: `Invalid transition from ${currentStatus} to ${status}` })
    }

    if (status === "INTERVIEW_COMPLETED") {
      return res.status(400).json({ error: "Interview completion is controlled by the interview feedback workflow" })
    }

    const finalDecisions = ["SELECTED", "WAITLISTED"]
    const isFinalDecision = finalDecisions.includes(status) || (status === "REJECTED" && currentStatus === "INTERVIEW_COMPLETED")
    const requiresFeedbackVerification = isFinalDecision || status === "FURTHER_ROUND"

    if (requiresFeedbackVerification) {
      const latestInterview = await prisma.recruitmentInterview.findFirst({
        where: { application_id: id },
        orderBy: { round: 'desc' },
        include: { assigned_members: true, feedback: true }
      })

      if (!latestInterview) {
        return res.status(400).json({ error: "Cannot transition status: No interview found for this application." })
      }

      if (latestInterview.status !== "FEEDBACK_SUBMITTED") {
        return res.status(400).json({ error: "Cannot transition status: Interview is not fully completed or feedback is missing." })
      }

      const requiredMemberIds = latestInterview.assigned_members.map((m: any) => m.id).sort()
      const submittedFeedbackIds = latestInterview.feedback.map((f: any) => f.panel_member_id).sort()

      const allSubmitted = requiredMemberIds.length > 0 && 
                           requiredMemberIds.length === submittedFeedbackIds.length && 
                           requiredMemberIds.every((mid: number, index: number) => mid === submittedFeedbackIds[index])

      if (!allSubmitted) {
        return res.status(400).json({ error: "Cannot transition status: Not all exact panel members have submitted feedback." })
      }
    }

    const updateData: any = { status }

    const isTrueFinal = ["SELECTED", "REJECTED", "WAITLISTED"].includes(status)
    if (isTrueFinal) {
      updateData.decided_by = BigInt(session.id)
      updateData.decided_at = new Date()
      if (reason) {
        updateData.decision_reason = reason
      }
    }

    const application = await prisma.recruitmentApplication.update({
      where: { id },
      data: updateData
    })

    await logAudit(BigInt(session.id), `UPDATED_APPLICATION_STATUS_TO_${status}`, "Application", id.toString())

    // Notify Candidate via In-app and Email asynchronously
    const notificationMessage = `Your application status has been updated to ${status}.`
    prisma.recruitmentNotification.create({
      data: {
        user_id: BigInt(existingApplication.id.toString()),
        title: "Application Status Updated",
        message: notificationMessage,
      }
    }).catch(console.error);

    sendEmail({
      to: existingApplication.email,
      subject: "HackClub VIT Recruitment - Status Update",
      html: templates.statusUpdated(existingApplication.name, status, reason)
    }).catch(console.error);

    // Create Notification logic can be ignored if the user isn't assigned to the recruitment app natively
    // We notify recruiters 
    // Format response to serialize BigInts
    const formattedApp = {
      ...application,
      id: application.id.toString(),
      decided_by: application.decided_by?.toString() || null,
    };
    return res.status(200).json({ application: formattedApp })
  } catch (error) {
    console.error("Update application error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
