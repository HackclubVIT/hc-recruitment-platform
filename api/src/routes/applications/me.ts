import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const application = await prisma.recruitmentApplication.findFirst({
      where: {
        email: session.email,
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
        decided_by: application.decided_by?.toString()
      }
    })

  } catch (error) {
    console.error("Fetch application me error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
