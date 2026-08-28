import prisma from "./db";
export async function createNotification(user_id, title, message) {
    try {
        await prisma.notification.create({
            data: {
                user_id,
                title,
                message,
                read: false,
            },
        });
    }
    catch (error) {
        console.error("Failed to create notification:", error);
    }
}
