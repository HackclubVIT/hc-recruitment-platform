import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"
import { getISTDateBounds } from "../../lib/timezone"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "PANEL_MEMBER") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const { startOfDay: startOfToday, endOfDay: endOfToday, endOfWeek } = getISTDateBounds()

    // 1. Interviews Today (IST)
    const todayInterviewsCount = await prisma.interview.count({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        status: { not: "CANCELLED" },
        panel: {
          members: {
            some: { user_id: session.id }
          }
        }
      }
    })

    // 2. Upcoming (Week, IST)
    const upcomingInterviewsCount = await prisma.interview.count({
      where: {
        date: {
          gt: endOfToday,
          lte: endOfWeek
        },
        status: { not: "CANCELLED" },
        panel: {
          members: {
            some: { user_id: session.id }
          }
        }
      }
    })

    // 3. Pending Feedback
    // Only COMPLETED and FEEDBACK_PENDING interviews count.
    // SCHEDULED interviews are NOT eligible for feedback (Req 12).
    const panelMemberRows = await prisma.panelMember.findMany({
      where: { user_id: session.id }
    })
    const panelMemberIds = panelMemberRows.map((pm: any) => pm.id)

    const pendingFeedbackCount = await prisma.interview.count({
      where: {
        status: { in: ["COMPLETED", "FEEDBACK_PENDING"] },
        panel: {
          members: {
            some: { user_id: session.id }
          }
        },
        NOT: {
          feedback: {
            some: {
              panel_member_id: { in: panelMemberIds }
            }
          }
        }
      }
    })

    // 4. Today's Schedule (IST)
    const todaySchedule = await prisma.interview.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        status: { not: "CANCELLED" },
        panel: {
          members: {
            some: { user_id: session.id }
          }
        }
      },
      include: {
        candidate: true
      },
      orderBy: {
        start_time: 'asc'
      }
    })

    return res.status(200).json({
      stats: {
        todayInterviewsCount,
        upcomingInterviewsCount,
        pendingFeedbackCount
      },
      todaySchedule
    })
  } catch (error) {
    console.error("Panel dashboard error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
