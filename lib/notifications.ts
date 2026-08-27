import { prisma } from "./prisma"

export interface CreateNotificationInput {
  userId: number
  type: string
  message: string
  relatedEntityType?: string
  relatedEntityId?: number
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: input,
  })
}

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

export async function markAsRead(notificationId: number, userId: number) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
}

export async function markAllAsRead(userId: number) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}

export async function getUnreadCount(userId: number) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  })
}

export async function getNotifications(userId: number, limit = 50, offset = 0) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  })
}

export const NOTIFICATION_TYPES = {
  APPLICATION_SHORTLISTED: "APPLICATION_SHORTLISTED",
  INTERVIEW_SCHEDULED: "INTERVIEW_SCHEDULED",
  INTERVIEW_RESCHEDULED: "INTERVIEW_RESCHEDULED",
  INTERVIEW_CANCELLED: "INTERVIEW_CANCELLED",
  DECISION_MADE: "DECISION_MADE",
  FEEDBACK_SUBMITTED: "FEEDBACK_SUBMITTED",
} as const