import { Request, Response } from "express";
import prisma from "../lib/db"

export const GET = async (req: Request, res: Response) => {
  try {
    // Optional: Check database connectivity
    await prisma.$queryRaw`SELECT 1`
    
    return res.status(200).json({
      status: "ok",
      database: "connected"
    })
  } catch (error) {
    console.error("Health check error:", error)
    return res.status(500).json({
      status: "error",
      database: "disconnected"
    })
  }
}
