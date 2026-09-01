import { Request, Response } from "express";
import prisma from "../../lib/db";

export const GET = async (req: Request, res: Response) => {
  try {
    const forms = await prisma.recruitmentForm.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { created_at: "desc" }
    });

    return res.status(200).json({ forms });
  } catch (error) {
    console.error("Fetch published forms error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
