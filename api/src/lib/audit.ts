import prisma from "./db"

export async function logAudit(
  user_id: string | number | bigint | undefined | null,
  action: string,
  entity: string,
  entity_id?: string | number
) {
  try {
    let parsedUserId: bigint | null = null;
    if (user_id) {
      try {
        parsedUserId = BigInt(user_id);
      } catch {
        parsedUserId = null;
      }
    }
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
