import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000)

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "PANEL_MEMBER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)
    const endOfWeek = addDays(endOfToday, 7)

    // 1. Interviews Today
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

    // 2. Upcoming (Week)
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
    // Interviews that have completed or passed their start time, where this member hasn't submitted feedback
    const panelMemberRows = await prisma.panelMember.findMany({
      where: { user_id: session.id }
    })
    const panelMemberIds = panelMemberRows.map(pm => pm.id)

    const pendingFeedbackCount = await prisma.interview.count({
      where: {
        status: { in: ["SCHEDULED", "FEEDBACK_PENDING"] },
        start_time: { lt: new Date() }, // Past interviews
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

    // 4. Today's Schedule
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

    return NextResponse.json({
      stats: {
        todayInterviewsCount,
        upcomingInterviewsCount,
        pendingFeedbackCount
      },
      todaySchedule
    }, { status: 200 })
  } catch (error) {
    console.error("Panel dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
