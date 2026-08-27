// Status constants (match Prisma String fields)

export const Role = {
  ADMIN: "ADMIN",
  LEAD: "LEAD",
  RECRUITER: "RECRUITER",
  PANEL: "PANEL",
  CANDIDATE: "CANDIDATE",
} as const

export type Role = (typeof Role)[keyof typeof Role]

export const ApplicationStatus = {
  APPLIED: "APPLIED",
  UNDER_REVIEW: "UNDER_REVIEW",
  ON_HOLD: "ON_HOLD",
  SHORTLISTED: "SHORTLISTED",
  INTERVIEW_SCHEDULED: "INTERVIEW_SCHEDULED",
  INTERVIEWED: "INTERVIEWED",
  SELECTED: "SELECTED",
  WAITLISTED: "WAITLISTED",
  REJECTED: "REJECTED",
} as const

export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus]

export const InterviewStatus = {
  SCHEDULED: "SCHEDULED",
  RESCHEDULED: "RESCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const

export type InterviewStatus = (typeof InterviewStatus)[keyof typeof InterviewStatus]

export const InterviewMode = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
} as const

export type InterviewMode = (typeof InterviewMode)[keyof typeof InterviewMode]

export const FeedbackRecommendation = {
  STRONG_HIRE: "STRONG_HIRE",
  HIRE: "HIRE",
  MAYBE: "MAYBE",
  NO_HIRE: "NO_HIRE",
} as const

export type FeedbackRecommendation = (typeof FeedbackRecommendation)[keyof typeof FeedbackRecommendation]

export const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.APPLIED]: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED],
  [ApplicationStatus.UNDER_REVIEW]: [ApplicationStatus.SHORTLISTED, ApplicationStatus.ON_HOLD, ApplicationStatus.REJECTED],
  [ApplicationStatus.ON_HOLD]: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED],
  [ApplicationStatus.SHORTLISTED]: [ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.REJECTED],
  [ApplicationStatus.INTERVIEW_SCHEDULED]: [ApplicationStatus.INTERVIEWED, ApplicationStatus.SHORTLISTED],
  [ApplicationStatus.INTERVIEWED]: [ApplicationStatus.SELECTED, ApplicationStatus.WAITLISTED, ApplicationStatus.REJECTED],
  [ApplicationStatus.WAITLISTED]: [ApplicationStatus.SELECTED, ApplicationStatus.REJECTED],
  [ApplicationStatus.SELECTED]: [],
  [ApplicationStatus.REJECTED]: [],
}

export const ROLE_TRANSITION_PERMISSIONS: Record<ApplicationStatus, Partial<Record<ApplicationStatus, Role[]>>> = {
  [ApplicationStatus.APPLIED]: {
    [ApplicationStatus.UNDER_REVIEW]: [Role.RECRUITER, Role.LEAD],
    [ApplicationStatus.REJECTED]: [Role.RECRUITER, Role.LEAD],
  },
  [ApplicationStatus.UNDER_REVIEW]: {
    [ApplicationStatus.SHORTLISTED]: [Role.RECRUITER, Role.LEAD],
    [ApplicationStatus.ON_HOLD]: [Role.RECRUITER, Role.LEAD],
    [ApplicationStatus.REJECTED]: [Role.RECRUITER, Role.LEAD],
  },
  [ApplicationStatus.ON_HOLD]: {
    [ApplicationStatus.UNDER_REVIEW]: [Role.RECRUITER, Role.LEAD],
    [ApplicationStatus.REJECTED]: [Role.RECRUITER, Role.LEAD],
  },
  [ApplicationStatus.SHORTLISTED]: {
    [ApplicationStatus.INTERVIEW_SCHEDULED]: [Role.LEAD],
    [ApplicationStatus.REJECTED]: [Role.RECRUITER, Role.LEAD],
  },
  [ApplicationStatus.INTERVIEW_SCHEDULED]: {
    [ApplicationStatus.INTERVIEWED]: [Role.LEAD],
    [ApplicationStatus.SHORTLISTED]: [Role.LEAD],
  },
  [ApplicationStatus.INTERVIEWED]: {
    [ApplicationStatus.SELECTED]: [Role.LEAD],
    [ApplicationStatus.WAITLISTED]: [Role.LEAD],
    [ApplicationStatus.REJECTED]: [Role.LEAD],
  },
  [ApplicationStatus.WAITLISTED]: {
    [ApplicationStatus.SELECTED]: [Role.LEAD],
    [ApplicationStatus.REJECTED]: [Role.LEAD],
  },
  [ApplicationStatus.SELECTED]: {},
  [ApplicationStatus.REJECTED]: {},
}

export function canTransition(
  fromStatus: ApplicationStatus,
  toStatus: ApplicationStatus,
  userRole: Role
): boolean {
  const allowedNext = VALID_TRANSITIONS[fromStatus] || []
  if (!allowedNext.includes(toStatus)) return false

  const rolePermissions = ROLE_TRANSITION_PERMISSIONS[fromStatus]?.[toStatus]
  if (!rolePermissions) return false

  return rolePermissions.includes(userRole)
}

export function getValidNextStatuses(
  currentStatus: ApplicationStatus,
  userRole: Role
): ApplicationStatus[] {
  const allowedNext = VALID_TRANSITIONS[currentStatus] || []
  return allowedNext.filter((status) => {
    const permissions = ROLE_TRANSITION_PERMISSIONS[currentStatus]?.[status]
    return permissions?.includes(userRole)
  })
}

export function isTerminalStatus(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.SELECTED || status === ApplicationStatus.REJECTED
}