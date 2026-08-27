import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles, requireInterviewAccess } from "@/lib/guards"
import { Role, InterviewStatus, InterviewMode } from "@/lib/status"
import { hasSchedulingConflict } from "@/lib/conflict"
import { NOTIFICATION_TYPES } from "@/lib/notifications"
import { sendInterviewRescheduledEmail, sendInterviewCancelledEmail } from "@/lib/email"

const VALID_MODES: InterviewMode[] = ["ONLINE", "OFFLINE"]

function isValidMode(mode: string): mode is InterviewMode {
  return VALID_MODES.includes(mode as InterviewMode)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const { id } = await params
  const interviewId = parseInt(id, 10)

  const accessCheck = await requireInterviewAccess(auth, interviewId)
  if (accessCheck) return accessCheck

  const { action, startTime, endTime, mode, locationOrLink, panelistUserIds, status } = await request.json()

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: true,
      panelists: { include: { panelist: { select: { id: true, name: true, email: true } } } },
    },
  })

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 })
  }

  if (action === "reschedule") {
    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Start and end time required for reschedule" }, { status: 400 })
    }

    let modeValue: InterviewMode = interview.mode as InterviewMode
    if (mode && isValidMode(mode)) {
      modeValue = mode
    }

    const checkPanelists = panelistUserIds?.map((id: number) => BigInt(id)) || interview.panelists.map(p => p.panelistUserId)
    const conflict = await hasSchedulingConflict(
      interview.applicationId,
      checkPanelists,
      new Date(startTime),
      new Date(endTime),
      interviewId
    )

    if (conflict.conflict) {
      return NextResponse.json({ error: "Scheduling conflict detected", conflicts: conflict.conflictingWith }, { status: 409 })
    }

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        mode: modeValue,
        locationOrLink: locationOrLink || interview.locationOrLink,
        status: InterviewStatus.RESCHEDULED,
        panelists: panelistUserIds ? {
          deleteMany: {},
          create: panelistUserIds.map((userId: number) => ({ panelistUserId: BigInt(userId) })),
        } : undefined,
      },
      include: { panelists: { include: { panelist: { select: { id: true, name: true, email: true } } } }, application: true },
    })

    const panelistIds = updated.panelists.map(p => p.panelistUserId)
    await createNotificationsForUsers(panelistIds, NOTIFICATION_TYPES.INTERVIEW_RESCHEDULED, `Interview rescheduled for ${updated.application.name}`, "interview", updated.id)
    await sendInterviewRescheduledEmail(
      updated.application.email,
      updated.application.name,
      interview.startTime,
      updated.startTime,
      updated.mode as "ONLINE" | "OFFLINE",
      updated.locationOrLink
    )

    return NextResponse.json({ interview: updated })
  }

  if (action === "cancel") {
    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: { status: InterviewStatus.CANCELLED },
      include: { application: true },
    })

    const panelistIds = interview.panelists.map(p => p.panelistUserId)
    await createNotificationsForUsers(panelistIds, NOTIFICATION_TYPES.INTERVIEW_CANCELLED, `Interview cancelled for ${updated.application.name}`, "interview", updated.id)
    await sendInterviewCancelledEmail(updated.application.email, updated.application.name, updated.startTime)

    return NextResponse.json({ interview: updated })
  }

  if (action === "complete") {
    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: { status: InterviewStatus.COMPLETED },
    })
    return NextResponse.json({ interview: updated })
  }

  if (status) {
    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: { status: status as InterviewStatus },
    })
    return NextResponse.json({ interview: updated })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

async function createNotificationsForUsers(userIds: bigint[], type: string, message: string, relatedEntityType?: string, relatedEntityId?: number) {
  if (!userIds.length) return
  await prisma.notification.createMany({
    data: userIds.map(userId => ({ userId, type, message, relatedEntityType, relatedEntityId })),
  })
}