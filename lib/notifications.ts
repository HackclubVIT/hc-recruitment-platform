import { prisma } from "./prisma"

/**
 * CreateNotificationInput - Input shape for creating a notification
 */
export interface CreateNotificationInput {
  userId: number
  type: string
  message: string
  relatedEntityType?: string
  relatedEntityId?: number
}

/**
 * createNotification - Creates a single notification for a user
 * Called within database transactions to ensure consistency with status changes
 * 
 * @param input - Notification data
 * @returns Created notification
 * 
 * INTEGRATION: Called from status change APIs, interview scheduling APIs
 * FIXME: [BUG] userId expects number but Prisma uses BigInt - may cause type issues
 */
export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: input,
  })
}

/**
 * createNotificationsForUsers - Bulk creates notifications for multiple users
 * Used for interview scheduling to notify all panelists at once
 * 
 * @param userIds - Array of user IDs (BigInt from Prisma)
 * @param type - Notification type from NOTIFICATION_TYPES
 * @param message - Notification message
 * @param relatedEntityType - Optional entity type (e.g., "interview")
 * @param relatedEntityId - Optional entity ID
 * 
 * FIXME: [BUG] userIds parameter expects number[] but receives bigint[] from Prisma
 * TODO: [INTEGRATION] Add push notification support for mobile
 */
export async function createNotificationsForUsers(
  userIds: number[],
  type: string,
  message: string,
  relatedEntityType?: string,
  relatedEntityId?: number
) {
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      message,
      relatedEntityType,
      relatedEntityId,
    })),
  })
}

/**
 * markAsRead - Marks a single notification as read
 */
export async function markAsRead(notificationId: number) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
}

/**
 * markAllAsRead - Marks all unread notifications for a user as read
 */
export async function markAllAsRead(userId: number) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}

/**
 * getUnreadCount - Returns count of unread notifications for badge display
 */
export async function getUnreadCount(userId: number) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  })
}

/**
 * getNotifications - Fetches paginated notifications for a user
 */
export async function getNotifications(userId: number, limit = 50, offset = 0) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  })
}

/**
 * NOTIFICATION_TYPES - Standardized notification type constants
 * Used throughout the codebase for consistent notification categorization
 */
export const NOTIFICATION_TYPES = {
  APPLICATION_SHORTLISTED: "APPLICATION_SHORTLISTED",
  INTERVIEW_SCHEDULED: "INTERVIEW_SCHEDULED",
  INTERVIEW_RESCHEDULED: "INTERVIEW_RESCHEDULED",
  INTERVIEW_CANCELLED: "INTERVIEW_CANCELLED",
  DECISION_MADE: "DECISION_MADE",
  FEEDBACK_SUBMITTED: "FEEDBACK_SUBMITTED",
} as const