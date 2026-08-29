import prisma from "./db"

export async function createNotification(
  user_id: string,
  title: string,
  message: string
) {
  try {
    await prisma.recruitmentNotification.create({
      data: {
        user_id: BigInt(user_id),
        title,
        message,
        read: false,
      },
    })
  } catch (error) {
    console.error("Failed to create notification:", error)
  }
}
