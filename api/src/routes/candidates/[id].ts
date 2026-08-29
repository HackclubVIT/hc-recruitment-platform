import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: "Unauthorized" })
    
    const resolvedParams = req.params
    const id = BigInt(resolvedParams.id as string)

    let includeClause: any = {
      interviews: {
        include: { panel: true, feedback: true }
      }
    }

    if (session.role === "PANEL_MEMBER") {
      includeClause = {
        interviews: {
          where: {
            assigned_members: { some: { user_id: BigInt(session.id) } }
          },
          include: { feedback: true } // Removed panel include to restrict unnecessary data
        }
      }
    }

    const application = await prisma.recruitmentApplication.findUnique({
      where: { id },
      include: includeClause
    })

    if (!application) return res.status(404).json({ error: "Not found" })

    // Access control: Recruiter can only view their own department
    if (session.role === "RECRUITER" && !session.departments.includes(application.domain as string)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    // Access control: Panel Member
    if (session.role === "PANEL_MEMBER" && (application as any).interviews.length === 0) {
      return res.status(403).json({ error: "Forbidden" })
    }

    const mappedCandidate = {
      id: application.id.toString(),
      name: application.name,
      email: application.email,
      department: application.domain,
      registration_number: application.registerNumber,
      resume_url: application.portfolio,
      phone: application.phoneNumber,
      created_at: application.appliedDate || new Date().toISOString(),
      applications: [{
        id: application.id.toString(),
        candidate_id: application.id.toString(),
        form_id: 1,
        status: application.status,
        submitted_at: application.appliedDate || new Date().toISOString(),
        answers: {
          technicalSkills: application.technicalSkills,
          github: application.github,
          firstPreference: application.firstPreference,
          secondPreference: application.secondPreference,
          yearOfStudy: application.yearOfStudy,
        }
      }],
      interviews: (application as any).interviews
    }

    return res.status(200).json({ candidate: mappedCandidate })
  } catch (error) {
    console.error("Fetch candidate error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
