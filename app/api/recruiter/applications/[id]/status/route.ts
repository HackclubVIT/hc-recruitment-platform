import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles, requireApplicationAccess } from "@/lib/guards"
import { canTransition, ApplicationStatus, Role } from "@/lib/status"
import { createNotification } from "@/lib/notifications"
import { NOTIFICATION_TYPES } from "@/lib/notifications"
import { sendShortlistedEmail, sendDecisionEmail } from "@/lib/email"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.RECRUITER, Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const { id } = await params
  const applicationId = parseInt(id, 10)

  const accessCheck = await requireApplicationAccess(auth, applicationId)
  if (accessCheck) return accessCheck

  const { status, reason } = await request.json()

  if (!status || !Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const newStatus = status as ApplicationStatus

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { status: true, departmentId: true, name: true, email: true },
  })

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  if (!canTransition(application.status as ApplicationStatus, newStatus, auth.role)) {
    return NextResponse.json(
      { error: `Cannot transition from ${application.status} to ${newStatus} for role ${auth.role}` },
      { status: 400 }
    )
  }

  await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: { status: newStatus },
    })

    await tx.statusHistory.create({
      data: {
        applicationId,
        fromStatus: application.status as ApplicationStatus | null,
        toStatus: newStatus,
        changedByUserId: auth.id,
        reason: reason || null,
      },
    })

    await createNotification({
      userId: auth.id,
      type: NOTIFICATION_TYPES.APPLICATION_SHORTLISTED,
      message: `Application ${application.name} moved to ${newStatus}`,
      relatedEntityType: "application",
      relatedEntityId: applicationId,
    })
  })

  if (newStatus === ApplicationStatus.SHORTLISTED) {
    await sendShortlistedEmail(application.email, application.name)
  }

  if (newStatus === ApplicationStatus.SELECTED || newStatus === ApplicationStatus.REJECTED || newStatus === ApplicationStatus.WAITLISTED) {
    await sendDecisionEmail(application.email, application.name, newStatus, reason)
  }

  return NextResponse.json({ success: true, status: newStatus })
}