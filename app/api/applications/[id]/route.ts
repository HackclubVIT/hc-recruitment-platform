import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { createNotification } from "@/lib/notify"
import { z } from "zod"

const updateSchema = z.object({
  status: z.enum([
    "APPLIED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED", 
    "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", 
    "SELECTED", "WAITLISTED", "FURTHER_ROUND"
  ])
})

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
    
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }
    const { status } = parsed.data

    const existingApplication = await prisma.application.findUnique({
      where: { id },
      include: { candidate: true }
    })

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Recruiter Department Authorization
    if (session.role === "RECRUITER") {
      const isAssigned = session.departments?.includes(existingApplication.candidate.department)
      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden: Candidate belongs to unassigned department" }, { status: 403 })
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

    // Admins can bypass transition rules for edge cases, but Recruiters cannot
    if (session.role !== "ADMIN") {
      const allowedNext = validTransitions[currentStatus] || []
      if (!allowedNext.includes(status)) {
        return NextResponse.json({ error: `Invalid transition from ${currentStatus} to ${status}` }, { status: 400 })
      }
    }

    const finalDecisions = ["SELECTED", "REJECTED", "WAITLISTED", "FURTHER_ROUND"]
    const isFinalDecision = finalDecisions.includes(status)

    const updateData: any = { status }

    if (isFinalDecision) {
      updateData.decided_by = session.id
      updateData.decided_at = new Date()
      // If the frontend sent a reason, capture it.
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

    return NextResponse.json({ application }, { status: 200 })
  } catch (error) {
    console.error("Update application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
