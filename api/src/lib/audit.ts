import prisma from "./db"

export async function logAudit(
  user_id: string | undefined | null,
  action: string,
  entity: string,
  entity_id?: string | number
) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id,
        action,
        entity,
        entity_id: entity_id !== undefined ? String(entity_id) : null,
      },
    })
  } catch (error) {
    console.error("Failed to log audit event:", error)
  }
}
