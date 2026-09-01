import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"
import { logAudit } from "../../lib/audit"
import { createNotification } from "../../lib/notify"
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

    // Authorization: Recruiter can view if 1st pref, 2nd pref, or domain matches their departments
    if (session.role === "RECRUITER" && !session.departments?.includes("*")) {
      const allowedDepts = new Set((session.departments || []).map(d => d.toLowerCase()));
      const matches = [application.domain, application.firstPreference, application.secondPreference]
        .filter(Boolean)
        .some(d => {
          const str = (d as string).toLowerCase();
          return allowedDepts.has(str) || 
                 (str.includes("research") && Array.from(allowedDepts).some(ad => ad.includes("research"))) ||
                 (str.includes("design") && Array.from(allowedDepts).some(ad => ad.includes("design"))) ||
                 (str.includes("technical") && Array.from(allowedDepts).some(ad => ad.includes("technical")));
        });

      if (!matches) {
        return res.status(403).json({ error: "Forbidden" });
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

    const candidateUser = await prisma.user.findUnique({ where: { id: application.id } })
    if (candidateUser) {
      if (status === "SHORTLISTED") {
        await createNotification(candidateUser.id.toString(), "Application Shortlisted", `Your application has been shortlisted.`)
      }
      const finalDecisions = ["SELECTED", "WAITLISTED"]
      if (finalDecisions.includes(status) || (status === "REJECTED" && currentStatus === "INTERVIEW_COMPLETED")) {
        await createNotification(candidateUser.id.toString(), "Final Decision Made", `Your application status is now ${status}.`)
      }
    }
    if ((status as string) === "INTERVIEW_COMPLETED") {
      const latestInterview = await prisma.recruitmentInterview.findFirst({
        where: { application_id: id },
        orderBy: { round: 'desc' },
        include: { assigned_members: true },
      })
      if (latestInterview) {
        for (const m of latestInterview.assigned_members) {
          await createNotification(m.user_id.toString(), "Feedback Pending", `Please submit feedback for interview #${latestInterview.id}.`)
        }
      }
    }

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
