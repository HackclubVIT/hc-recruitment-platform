import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"

export const PUT = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: "Unauthorized" })

    const { id } = req.body || {}

    let userIdBigInt: bigint;
    try {
      userIdBigInt = BigInt(session.id);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (id) {
      const result = await prisma.recruitmentNotification.updateMany({
        where: { id: parseInt(id, 10), user_id: userIdBigInt },
        data: { read: true }
      })
      if (result.count === 0) {
        return res.status(404).json({ error: "Notification not found or unauthorized" })
      }
    } else {
      await prisma.recruitmentNotification.updateMany({
        where: { user_id: userIdBigInt, read: false },
        data: { read: true }
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" })
  }
}
