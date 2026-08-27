import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles, requireApplicationAccess } from "@/lib/guards"
import { canTransition, ApplicationStatus, Role } from "@/lib/status"
import { createNotification } from "@/lib/notifications"
import { NOTIFICATION_TYPES } from "@/lib/notifications"
import { sendShortlistedEmail, sendDecisionEmail } from "@/lib/email"

const isTerminalStatus = (status: string): boolean => {
  return status === ApplicationStatus.SELECTED || status === ApplicationStatus.REJECTED || status === ApplicationStatus.WAITLISTED
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.RECRUITER, Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const { applicationIds, status, reason } = await request.json()

  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    return NextResponse.json({ error: "Application IDs array is required" }, { status: 400 })
  }

  if (!status || !Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const newStatus = status as ApplicationStatus
  const results: { id: number; success: boolean; error?: string }[] = []

  for (const applicationId of applicationIds) {
    const accessCheck = await requireApplicationAccess(auth, applicationId)
    if (accessCheck) {
      results.push({ id: applicationId, success: false, error: "Forbidden" })
      continue
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { status: true, departmentId: true, name: true, email: true },
    })

    if (!application) {
      results.push({ id: applicationId, success: false, error: "Not found" })
      continue
    }

    if (!canTransition(application.status as ApplicationStatus, newStatus, auth.role)) {
      results.push({
        id: applicationId,
        success: false,
        error: `Cannot transition from ${application.status} to ${newStatus}`,
      })
      continue
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

    if (isTerminalStatus(newStatus)) {
      await sendDecisionEmail(application.email, application.name, newStatus as "SELECTED" | "REJECTED" | "WAITLISTED", reason)
    }

    results.push({ id: applicationId, success: true })
  }

  return NextResponse.json({ results })
}