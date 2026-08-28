import { prisma } from "./prisma"
import { InterviewStatus } from "./status"

/**
 * ConflictResult - Result of scheduling conflict check
 * conflict: true if any conflicts found
 * conflictingWith: Array of conflict details (panelist or candidate)
 */
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

/**
 * hasSchedulingConflict - Checks for scheduling conflicts for a new interview
 * Detects two types of conflicts:
 * 1. Panelist conflict - any assigned panelist already booked during the time slot
 * 2. Candidate conflict - the applicant already has an interview during the time slot
 * 
 * @param applicationId - Application ID (for candidate conflict check)
 * @param panelistUserIds - Array of panelist user IDs (BigInt)
 * @param startTime - Proposed interview start time
 * @param endTime - Proposed interview end time
 * @param excludeInterviewId - Optional interview ID to exclude (for rescheduling)
 * @returns ConflictResult with conflict flag and details
 * 
 * INTEGRATION: Called by /api/lead/interviews POST and PATCH routes
 * TODO: [INTEGRATION] Add buffer time between interviews (e.g., 15 min gap)
 */
export async function hasSchedulingConflict(
  applicationId: number,
  panelistUserIds: bigint[],
  startTime: Date,
  endTime: Date,
  excludeInterviewId?: number
): Promise<ConflictResult> {
  const scheduledStatuses = [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED]

  // Find all interviews that overlap with the proposed time slot
  const existingInterviews = await prisma.interview.findMany({
    where: {
      status: { in: scheduledStatuses },
      id: excludeInterviewId ? { not: excludeInterviewId } : undefined,
      startTime: { lt: endTime },    // Existing starts before proposed ends
      endTime: { gt: startTime },    // Existing ends after proposed starts
    },
    include: {
      panelists: true,
      application: true,
    },
  })

  const conflicts: ConflictResult["conflictingWith"] = []

  for (const interview of existingInterviews) {
    // Check panelist conflicts
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

    // Check candidate conflicts
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

/**
 * getPanelistAvailability - Returns availability status for panelists in a time slot
 * Used by UI to show which panelists are free/busy
 * 
 * @param panelistUserIds - Array of panelist user IDs
 * @param startTime - Time slot start
 * @param endTime - Time slot end
 * @returns Record mapping userId to { busy: boolean, conflictingInterviews: number[] }
 */
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

/**
 * getCandidateConflicts - Checks if a candidate has interviews in a time slot
 * Simpler version of hasSchedulingConflict for candidate-only check
 */
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