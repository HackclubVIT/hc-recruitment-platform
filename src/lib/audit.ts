import prisma from "./db"

export async function logAudit(
  user_id: string,
  action: string,
  entity: string,
  entity_id?: number
) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id,
        action,
        entity,
        entity_id,
      },
    })
  } catch (error) {
    console.error("Failed to log audit event:", error)
  }
}
