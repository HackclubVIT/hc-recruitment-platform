import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let whereClause: any = {}

    if (session.role === "PANEL_MEMBER") {
      // Panel members only see interviews for panels they are part of
      const userPanels = await prisma.panelMember.findMany({
        where: { user_id: session.id },
        select: { panel_id: true }
      })
      const panelIds = userPanels.map((p: any) => p.panel_id)
      
      whereClause = { panel_id: { in: panelIds } }
    } else if (session.role === "RECRUITER") {
      // Recruiters see interviews for candidates in their departments
      whereClause = {
        candidate: {
          department: { in: session.departments }
        }
      }
    }

    const interviews = await prisma.interview.findMany({
      where: whereClause,
      include: {
        candidate: true,
        panel: true,
      },
      orderBy: { date: 'asc' }
    })

    return NextResponse.json({ interviews }, { status: 200 })
  } catch (error) {
    console.error("Error fetching interviews:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
