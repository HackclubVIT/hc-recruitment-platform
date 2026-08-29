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
          some: { user_id: BigInt(session.id) }
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

    const interviews = await prisma.recruitmentInterview.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: { date: 'asc' }
    })

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

    return res.status(200).json({ interviews: formattedInterviews })
  } catch (error) {
    console.error("Error fetching interviews:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
