import { Request, Response } from "express";
import prisma from "../../lib/db";
import { getSession } from "../../lib/auth";

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const logs = await prisma.recruitmentEmailLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    return res.status(200).json(logs);
  } catch (error) {
    console.error("Failed to fetch email logs:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
