import prisma from "./db"

export async function logAudit(
  user_id: string | string | undefined | null,
  action: string,
  entity: string,
  entity_id?: string | number
) {
  try {
    const parsedUserId = user_id ? user_id : null;
    await prisma.recruitmentAuditLog.create({
      data: {
        user_id: parsedUserId,
        action,
        entity,
        entity_id: entity_id !== undefined ? String(entity_id) : null,
      },
    })
  } catch (error) {
    console.error("Failed to log audit event:", error)
  }
}
