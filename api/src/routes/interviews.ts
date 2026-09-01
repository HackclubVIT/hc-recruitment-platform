import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role === "NONE") {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const searchParams = new URLSearchParams(req.query as Record<string, string>)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "100") || 100))
    const skip = (page - 1) * limit

    let whereClause: any = {}

    if (session.role === "PANEL_MEMBER") {
      whereClause = {
        assigned_members: {
          some: { user_id: session.id }
        }
      }
    } else if (session.role === "RECRUITER") {
      // Recruiters see interviews for applications in their departments
      whereClause = {
        application: {
          domain: { in: session.departments }
        }
      }
    }

    const includeClause: any = {
      panel: true,
    }

    if (session.role === "PANEL_MEMBER") {
      includeClause.application = {
        select: {
          id: true,
          name: true,
          email: true,
          domain: true,
          registerNumber: true,
        }
      }
    } else {
      includeClause.application = true
    }

    const [interviews, total] = await Promise.all([
      prisma.recruitmentInterview.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: { date: 'asc' },
        skip,
        take: limit
      }),
      prisma.recruitmentInterview.count({ where: whereClause })
    ])

    // Format response to serialize BigInts
    const formattedInterviews = interviews.map((i: any) => {
      const interview = {
        ...i,
        application_id: i.application_id.toString(),
        recruiter_id: i.recruiter_id?.toString() || null,
      }
      if (interview.application) {
         interview.application = {
           ...interview.application,
           id: interview.application.id.toString(),
           decided_by: interview.application.decided_by?.toString() || null,
         }
      }
      return interview;
    })

    return res.status(200).json({ 
      interviews: formattedInterviews,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Error fetching interviews:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
