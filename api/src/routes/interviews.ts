import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    let whereClause: any = {}

    if (session.role === "PANEL_MEMBER") {
      whereClause = {
        assigned_members: {
          some: { user_id: session.id }
        }
      }
    } else if (session.role === "RECRUITER") {
      // Recruiters see interviews for candidates in their departments
      whereClause = {
        candidate: {
          department: { in: session.departments }
        }
      }
    }

    const includeClause: any = {
      panel: true,
    }

    if (session.role === "PANEL_MEMBER") {
      includeClause.candidate = {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          registration_number: true,
        }
      }
    } else {
      includeClause.candidate = true
    }

    const interviews = await prisma.interview.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: { date: 'asc' }
    })

    return res.status(200).json({ interviews })
  } catch (error) {
    console.error("Error fetching interviews:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
