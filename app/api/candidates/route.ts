import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const status = searchParams.get("status") || "ALL"
    const department = searchParams.get("department")

    let whereClause: any = {}
    
    if (session.role === "RECRUITER") {
      whereClause.department = { in: session.departments }
    } else if (session.role === "PANEL_MEMBER") {
      whereClause.interviews = {
        some: {
          panel: {
            members: {
              some: {
                user_id: session.id
              }
            }
          }
        }
      }
    } else if (department) {
      whereClause.department = department
    }

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { registration_number: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (status !== "ALL") {
      whereClause.applications = {
        some: {
          status: status
        }
      }
    }

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where: whereClause,
        include: {
          applications: true,
          interviews: true
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.candidate.count({ where: whereClause })
    ])

    return NextResponse.json({ 
      candidates, // keeping candidates array for backward compatibility
      items: candidates,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching candidates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
