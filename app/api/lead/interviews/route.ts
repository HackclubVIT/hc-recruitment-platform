import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles, requireDeptAccess } from "@/lib/guards"
import { Role, InterviewStatus, InterviewMode } from "@/lib/status"
import { hasSchedulingConflict } from "@/lib/conflict"
import { createNotification } from "@/lib/notifications"
import { NOTIFICATION_TYPES } from "@/lib/notifications"
import { sendInterviewScheduledEmail, sendInterviewRescheduledEmail, sendInterviewCancelledEmail } from "@/lib/email"

const VALID_MODES: InterviewMode[] = ["ONLINE", "OFFLINE"]

function isValidMode(mode: string): mode is InterviewMode {
  return VALID_MODES.includes(mode as InterviewMode)
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.LEAD, Role.ADMIN, Role.RECRUITER)(auth)
  if (roleCheck) return roleCheck

  const deptIds = auth.role === Role.ADMIN
    ? (await prisma.department.findMany({ select: { id: true } })).map(d => d.id)
    : auth.deptIds

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const applicationId = searchParams.get("applicationId")

  const where: Record<string, unknown> = { application: { departmentId: { in: deptIds } } }
  if (status) where.status = status
  if (applicationId) where.applicationId = parseInt(applicationId, 10)

  const interviews = await prisma.interview.findMany({
    where,
    include: {
      application: { select: { id: true, name: true, email: true, department: true } },
      panelists: { include: { panelist: { select: { id: true, name: true, email: true } } } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startTime: "asc" },
  })

  return NextResponse.json({ interviews })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const { applicationId, panelistUserIds, startTime, endTime, mode, locationOrLink } = await request.json()

  if (!applicationId || !panelistUserIds?.length || !startTime || !endTime || !mode || !locationOrLink) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!isValidMode(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
  }

  const deptCheck = await requireDeptAccess(auth, applicationId)
  if (deptCheck) return deptCheck

  // Convert panelistUserIds to BigInt for Prisma
  const panelistUserIdsBigInt = panelistUserIds.map((id: number) => BigInt(id))

  const conflict = await hasSchedulingConflict(
    applicationId,
    panelistUserIdsBigInt,
    new Date(startTime),
    new Date(endTime)
  )

  if (conflict.conflict) {
    return NextResponse.json(
      { error: "Scheduling conflict detected", conflicts: conflict.conflictingWith },
      { status: 409 }
    )
  }

  const interview = await prisma.interview.create({
    data: {
      applicationId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      mode: mode as InterviewMode,
      locationOrLink,
      status: InterviewStatus.SCHEDULED,
      createdByUserId: BigInt(auth.id),
      panelists: { create: panelistUserIdsBigInt.map((userId: bigint) => ({ panelistUserId: userId })) },
    },
    include: {
      panelists: { include: { panelist: { select: { id: true, name: true, email: true } } } },
      application: { select: { id: true, name: true, email: true } },
    },
  })

  const panelistIds = interview.panelists.map(p => p.panelistUserId)
  await createNotificationsForUsers(panelistIds, NOTIFICATION_TYPES.INTERVIEW_SCHEDULED, `Interview scheduled for ${interview.application.name}`, "interview", interview.id)
  await sendInterviewScheduledEmail(
    interview.application.email,
    interview.application.name,
    interview.startTime,
    interview.mode as "ONLINE" | "OFFLINE",
    interview.locationOrLink,
    interview.panelists.map(p => p.panelist.name)
  )

  return NextResponse.json({ interview }, { status: 201 })
}

async function createNotificationsForUsers(userIds: bigint[], type: string, message: string, relatedEntityType?: string, relatedEntityId?: number) {
  if (!userIds.length) return
  await prisma.notification.createMany({
    data: userIds.map(userId => ({ userId, type, message, relatedEntityType, relatedEntityId })),
  })
}