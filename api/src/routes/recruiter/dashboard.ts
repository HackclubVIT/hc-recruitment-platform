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

    const pendingReviewsCount = await prisma.recruitmentApplication.count({
      where: {
        status: { in: ["APPLIED", "UNDER_REVIEW"] },
        domain: { in: departments }
      }
    })

    const shortlistedCount = await prisma.recruitmentApplication.count({
      where: {
        status: "SHORTLISTED",
        domain: { in: departments }
      }
    })

    const interviewsTodayCount = await prisma.recruitmentInterview.count({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        status: { not: "CANCELLED" },
        application: { domain: { in: departments } }
      }
    })

    const recentApplications = await prisma.recruitmentApplication.findMany({
      where: {
        domain: { in: departments }
      },
      orderBy: { id: 'desc' }, // or appliedDate if DateTime, but id descending is close enough
      take: 5
    })

    // map back to old format
    const mappedApplications = recentApplications.map((app: any) => ({
      id: app.id.toString(),
      candidate_id: app.id.toString(),
      status: app.status,
      submitted_at: app.appliedDate || new Date().toISOString(),
      candidate: {
        id: app.id.toString(),
        name: app.name,
        email: app.email,
        department: app.domain,
        registration_number: app.registerNumber,
      }
    }))

    return res.status(200).json({
      stats: {
        pendingReviewsCount,
        shortlistedCount,
        interviewsTodayCount
      },
      recentApplications: mappedApplications,
      departments
    })
  } catch (error) {
    console.error("Recruiter dashboard error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
