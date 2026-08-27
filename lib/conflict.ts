import { prisma } from "./prisma"
import { InterviewStatus } from "./status"

export interface ConflictResult {
  conflict: boolean
  conflictingWith?: {
    type: "panelist" | "candidate"
    userId?: bigint
    applicationId?: number
    interviewId: number
    interviewStart: Date
    interviewEnd: Date
  }[]
}

export async function hasSchedulingConflict(
  applicationId: number,
  panelistUserIds: bigint[],
  startTime: Date,
  endTime: Date,
  excludeInterviewId?: number
): Promise<ConflictResult> {
  const scheduledStatuses = [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED]

  const existingInterviews = await prisma.interview.findMany({
    where: {
      status: { in: scheduledStatuses },
      id: excludeInterviewId ? { not: excludeInterviewId } : undefined,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    include: {
      panelists: true,
      application: true,
    },
  })

  const conflicts: ConflictResult["conflictingWith"] = []

  for (const interview of existingInterviews) {
    const panelistConflict = interview.panelists.find((p) =>
      panelistUserIds.includes(p.panelistUserId)
    )
    if (panelistConflict) {
      conflicts.push({
        type: "panelist",
        userId: panelistConflict.panelistUserId,
        interviewId: interview.id,
        interviewStart: interview.startTime,
        interviewEnd: interview.endTime,
      })
    }

    if (interview.applicationId === applicationId) {
      conflicts.push({
        type: "candidate",
        applicationId: interview.applicationId,
        interviewId: interview.id,
        interviewStart: interview.startTime,
        interviewEnd: interview.endTime,
      })
    }
  }

  return {
    conflict: conflicts.length > 0,
    conflictingWith: conflicts.length > 0 ? conflicts : undefined,
  }
}

export async function getPanelistAvailability(panelistUserIds: bigint[], startTime: Date, endTime: Date) {
  const scheduledStatuses = [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED]

  const bookings = await prisma.interview.findMany({
    where: {
      status: { in: scheduledStatuses },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      panelists: {
        some: { panelistUserId: { in: panelistUserIds } },
      },
    },
    include: { panelists: true },
  })

  const availability: Record<string, { busy: boolean; conflictingInterviews: number[] }> = {}
  for (const id of panelistUserIds) {
    availability[id.toString()] = { busy: false, conflictingInterviews: [] }
  }

  for (const interview of bookings) {
    for (const panelist of interview.panelists) {
      const pid = panelist.panelistUserId.toString()
      if (pid in availability) {
        availability[pid].busy = true
        availability[pid].conflictingInterviews.push(interview.id)
      }
    }
  }

  return availability
}

export async function getCandidateConflicts(candidateApplicationId: number, startTime: Date, endTime: Date) {
  const scheduledStatuses = [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED]

  return prisma.interview.findMany({
    where: {
      status: { in: scheduledStatuses },
      applicationId: candidateApplicationId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  })
}