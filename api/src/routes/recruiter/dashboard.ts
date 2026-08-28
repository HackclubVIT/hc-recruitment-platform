import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"
import { getISTDateBounds } from "../../lib/timezone"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "RECRUITER") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const { startOfDay: startOfToday, endOfDay: endOfToday } = getISTDateBounds()
    const departments = session.departments || []

    const pendingReviewsCount = await prisma.application.count({
      where: {
        status: { in: ["APPLIED", "UNDER_REVIEW"] },
        candidate: { department: { in: departments } }
      }
    })

    const shortlistedCount = await prisma.application.count({
      where: {
        status: "SHORTLISTED",
        candidate: { department: { in: departments } }
      }
    })

    const interviewsTodayCount = await prisma.interview.count({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        status: { not: "CANCELLED" },
        candidate: { department: { in: departments } }
      }
    })

    const recentApplications = await prisma.application.findMany({
      where: {
        candidate: { department: { in: departments } }
      },
      include: { candidate: true },
      orderBy: { submitted_at: 'desc' },
      take: 5
    })

    return res.status(200).json({
      stats: {
        pendingReviewsCount,
        shortlistedCount,
        interviewsTodayCount
      },
      recentApplications,
      departments
    })
  } catch (error) {
    console.error("Recruiter dashboard error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
