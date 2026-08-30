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

    const todayInterviewsCount = await prisma.recruitmentInterview.count({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        status: { not: "CANCELLED" },
        assigned_members: {
          some: { user_id: session.id }
        }
      }
    })

    const upcomingInterviewsCount = await prisma.recruitmentInterview.count({
      where: {
        date: {
          gt: endOfToday,
          lte: endOfWeek
        },
        status: { not: "CANCELLED" },
        assigned_members: {
          some: { user_id: session.id }
        }
      }
    })

    const panelMemberRows = await prisma.recruitmentPanelMember.findMany({
      where: { user_id: session.id }
    })
    const panelMemberIds = panelMemberRows.map((pm: any) => pm.id)

    const pendingFeedbackCount = await prisma.recruitmentInterview.count({
      where: {
        status: { in: ["COMPLETED", "FEEDBACK_PENDING"] },
        assigned_members: {
          some: { user_id: session.id }
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

    const todaySchedule = await prisma.recruitmentInterview.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        status: { not: "CANCELLED" },
        assigned_members: {
          some: { user_id: session.id }
        }
      },
      include: {
        application: {
          select: {
            id: true,
            name: true,
            email: true,
            domain: true,
            registerNumber: true
          }
        }
      },
      orderBy: {
        start_time: 'asc'
      }
    })

    const mappedSchedule = todaySchedule.map((i: any) => ({
      ...i,
      candidate: i.application ? {
        id: i.application.id.toString(),
        name: i.application.name,
        email: i.application.email,
        department: i.application.domain,
        registration_number: i.application.registerNumber
      } : undefined
    }))

    return res.status(200).json({
      stats: {
        todayInterviewsCount,
        upcomingInterviewsCount,
        pendingFeedbackCount
      },
      todaySchedule: mappedSchedule
    })
  } catch (error) {
    console.error("Panel dashboard error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
