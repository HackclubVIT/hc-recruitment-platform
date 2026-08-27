import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles, requireApplicationAccess } from "@/lib/guards"
import { Role, ApplicationStatus, FeedbackRecommendation } from "@/lib/status"
import { createNotification } from "@/lib/notifications"
import { NOTIFICATION_TYPES } from "@/lib/notifications"
import { sendDecisionEmail } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const { id } = await params
  const applicationId = parseInt(id, 10)

  const accessCheck = await requireApplicationAccess(auth, applicationId)
  if (accessCheck) return accessCheck

  const { decision, reason, override } = await request.json()

  const validDecisions = [ApplicationStatus.SELECTED, ApplicationStatus.REJECTED, ApplicationStatus.WAITLISTED]
  if (!decision || !validDecisions.includes(decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 })
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      interviews: { where: { status: "COMPLETED" }, include: { feedbacks: true } },
    },
  })

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  if (!override && application.status !== ApplicationStatus.INTERVIEWED) {
    return NextResponse.json(
      { error: "Decision can only be made after interview is completed" },
      { status: 400 }
    )
  }

  if (!override && application.interviews.length === 0) {
    return NextResponse.json(
      { error: "No completed interviews found for this application" },
      { status: 400 }
    )
  }

  if (!override) {
    const hasFeedback = application.interviews.some(i => i.feedbacks.length > 0)
    if (!hasFeedback) {
      return NextResponse.json(
        { error: "Feedback must be submitted before making a decision. Use override to bypass." },
        { status: 400 }
      )
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: { status: decision },
    })

    await tx.statusHistory.create({
      data: {
        applicationId,
        fromStatus: application.status as ApplicationStatus,
        toStatus: decision,
        changedByUserId: auth.id,
        reason: reason || `Decision: ${decision}${override ? " (override)" : ""}`,
      },
    })

    await createNotification({
      userId: auth.id,
      type: NOTIFICATION_TYPES.DECISION_MADE,
      message: `Final decision for ${application.name}: ${decision}`,
      relatedEntityType: "application",
      relatedEntityId: applicationId,
    })
  })

  await sendDecisionEmail(application.email, application.name, decision, reason)

  return NextResponse.json({ success: true, decision })
}