import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"
import { logAudit } from "../../lib/audit"
import { createNotification } from "../../lib/notify"
import { z } from "zod"

export const GET = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const session = await getSession(req)
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)

    let includeClause: any = {
      form: { include: { questions: true } }
    }

    if (session.role === "PANEL_MEMBER") {
      includeClause.candidate = {
        select: {
          id: true,
          name: true,
          department: true,
          registration_number: true
        }
      }
    } else {
      includeClause.candidate = true
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: includeClause
    })

    if (!application) {
      return res.status(404).json({ error: "Application not found" })
    }

    // Authorization
    if (session.role === "RECRUITER") {
      if (!session.departments?.includes((application.candidate as any).department)) {
        return res.status(403).json({ error: "Forbidden" })
      }
    }

    if (session.role === "PANEL_MEMBER") {
      const hasAccess = await prisma.interview.findFirst({
        where: {
          application_id: id,
          assigned_members: { some: { user_id: session.id } }
        }
      })
      if (!hasAccess) {
        return res.status(403).json({ error: "Forbidden" })
      }
    }

    return res.status(200).json({ application })
  } catch (error) {
    console.error("Fetch application error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

const updateSchema = z.object({
  status: z.enum([
    "APPLIED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED", 
    "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", 
    "SELECTED", "WAITLISTED", "FURTHER_ROUND"
  ])
})

export const PUT = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const session = await getSession(req)
    if (!session || (session.role !== "ADMIN" && session.role !== "RECRUITER")) {
      return res.status(403).json({ error: "Forbidden" })
    }
    
    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)
    
    const body = req.body
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid status value" })
    }
    const { status } = parsed.data

    const existingApplication = await prisma.application.findUnique({
      where: { id },
      include: { candidate: true }
    })

    if (!existingApplication) {
      return res.status(404).json({ error: "Application not found" })
    }

    // Recruiter Department Authorization
    if (session.role === "RECRUITER") {
      const isAssigned = session.departments?.includes(existingApplication.candidate.department)
      if (!isAssigned) {
        return res.status(403).json({ error: "Forbidden: Candidate belongs to unassigned department" })
      }
    }

    // Valid Status Lifecycle checks
    const currentStatus = existingApplication.status
    const validTransitions: Record<string, string[]> = {
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

    // Req 7: Block generic PUT from manually setting INTERVIEW_COMPLETED
    if (status === "INTERVIEW_COMPLETED") {
      return res.status(400).json({ error: "Interview completion is controlled by the interview feedback workflow" })
    }

    // Final decisions require full feedback verification
    const finalDecisions = ["SELECTED", "WAITLISTED"]
    const isFinalDecision = finalDecisions.includes(status) || (status === "REJECTED" && currentStatus === "INTERVIEW_COMPLETED")

    // FURTHER_ROUND also requires feedback verification but is NOT a final decision
    const requiresFeedbackVerification = isFinalDecision || status === "FURTHER_ROUND"

    if (requiresFeedbackVerification) {
      // Must verify actual workflow, not just application status
      const latestInterview = await prisma.interview.findFirst({
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

    // Only true final decisions set decided_by/decided_at. FURTHER_ROUND is NOT a final decision.
    const isTrueFinal = ["SELECTED", "REJECTED", "WAITLISTED"].includes(status)
    if (isTrueFinal) {
      updateData.decided_by = session.id
      updateData.decided_at = new Date()
      if (body.reason) {
        updateData.decision_reason = body.reason
      }
    }

    const application = await prisma.application.update({
      where: { id },
      data: updateData,
      include: { candidate: true }
    })

    // Log the audit event
    await logAudit(session.id, `UPDATED_APPLICATION_STATUS_TO_${status}`, "Application", id)

    await createNotification(
      session.id,
      `Application Status Updated`,
      `${application.candidate.name}'s application was marked as ${status}.`
    )

    return res.status(200).json({ application })
  } catch (error) {
    console.error("Update application error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
