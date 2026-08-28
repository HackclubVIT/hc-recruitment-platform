import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"

export const GET = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: "Unauthorized" })
    
    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        applications: true,
        interviews: {
          include: { panel: true, feedback: true }
        }
      }
    })

    if (!candidate) return res.status(404).json({ error: "Not found" })

    // Access control: Recruiter can only view their own department
    if (session.role === "RECRUITER" && !session.departments.includes(candidate.department)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    // Access control: Panel Member can only view candidates for their assigned interviews
    if (session.role === "PANEL_MEMBER") {
      const assignedInterviews = await prisma.interview.findMany({
        where: {
          candidate_id: candidate.id,
          panel: {
            members: {
              some: {
                user_id: session.id
              }
            }
          }
        },
        select: { application_id: true, id: true }
      })
      if (assignedInterviews.length === 0) {
        return res.status(403).json({ error: "Forbidden" })
      }
      
      const allowedAppIds = assignedInterviews.map((i: any) => i.application_id)
      const allowedInterviewIds = assignedInterviews.map((i: any) => i.id)
      
      candidate.applications = candidate.applications.filter((a: any) => allowedAppIds.includes(a.id))
      candidate.interviews = candidate.interviews.filter((i: any) => allowedInterviewIds.includes(i.id))
    }

    return res.status(200).json({ candidate })
  } catch (error) {
    console.error("Fetch candidate error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
