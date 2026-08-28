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

    let includeClause: any = {
      applications: true,
      interviews: {
        include: { panel: true, feedback: true }
      }
    }

    if (session.role === "PANEL_MEMBER") {
      includeClause = {
        applications: {
          where: {
            interviews: {
              some: {
                panel: { members: { some: { user_id: session.id, active: true } } } // Req 13
              }
            }
          }
        },
        interviews: {
          where: {
            panel: { members: { some: { user_id: session.id, active: true } } } // Req 13
          },
          include: { panel: true, feedback: true }
        }
      }
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: includeClause
    })

    if (!candidate) return res.status(404).json({ error: "Not found" })

    // Access control: Recruiter can only view their own department
    if (session.role === "RECRUITER" && !session.departments.includes(candidate.department)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    // Access control: Panel Member
    if (session.role === "PANEL_MEMBER" && candidate.interviews.length === 0) {
      return res.status(403).json({ error: "Forbidden" })
    }

    return res.status(200).json({ candidate })
  } catch (error) {
    console.error("Fetch candidate error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
