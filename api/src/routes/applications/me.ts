import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const hcUser = await prisma.user.findUnique({ where: { id: BigInt(session.id) } })
    if (!hcUser) {
      return res.status(401).json({ error: "Unauthorized: HC User not found" })
    }

    const application = await prisma.recruitmentApplication.findFirst({
      where: {
        email: hcUser.email,
        recruitmentId: "recruitment-2026"
      },
      include: {
        interviews: true,
        formSubmission: {
          include: {
            answers: {
              include: {
                question: true
              }
            }
          }
        }
      }
    })

    if (!application) {
      return res.status(404).json({ error: "Application not found" })
    }

    // Convert BigInt id to string
    return res.status(200).json({
      application: {
        ...application,
        id: application.id.toString(),
        decided_by: application.decided_by?.toString() || null,
        interviews: application.interviews.map((i: any) => ({
          ...i,
          application_id: i.application_id.toString(),
          recruiter_id: i.recruiter_id?.toString() || null,
        }))
      }
    })

  } catch (error) {
    console.error("Fetch application me error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
