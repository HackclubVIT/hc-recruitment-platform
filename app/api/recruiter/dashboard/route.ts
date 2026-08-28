import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "RECRUITER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)

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

    return NextResponse.json({
      stats: {
        pendingReviewsCount,
        shortlistedCount,
        interviewsTodayCount
      },
      recentApplications,
      departments
    }, { status: 200 })
  } catch (error) {
    console.error("Recruiter dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
