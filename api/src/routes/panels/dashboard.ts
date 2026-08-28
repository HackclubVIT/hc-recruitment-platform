import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"

// Compute IST (Asia/Kolkata = UTC+5:30) date boundaries
function getISTDateBounds() {
  const now = new Date()
  // Get current date string in IST
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  const istDate = new Date(istString)
  
  const year = istDate.getFullYear()
  const month = istDate.getMonth()
  const day = istDate.getDate()
  
  // Start of day in IST = midnight IST = 18:30 UTC previous day
  const startOfToday = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - (5.5 * 60 * 60 * 1000))
  const endOfToday = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - (5.5 * 60 * 60 * 1000))
  const endOfWeek = new Date(endOfToday.getTime() + 7 * 86400000)
  
  return { startOfToday, endOfToday, endOfWeek }
}

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "PANEL_MEMBER") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const { startOfToday, endOfToday, endOfWeek } = getISTDateBounds()

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
