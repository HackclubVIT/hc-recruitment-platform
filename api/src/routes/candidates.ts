import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const searchParams = new URLSearchParams(req.query as any)
    const q = searchParams.get("q") || ""
    const status = searchParams.get("status") || "ALL"
    const department = searchParams.get("department")

    const whereClause: any = {}
    
    if (department) {
      if (session.role === "RECRUITER") {
        if (session.departments.includes(department)) {
          whereClause.department = department
        } else {
          return res.status(403).json({ error: "Forbidden: Department not assigned" })
        }
      } else if (session.role === "ADMIN") {
        whereClause.department = department
      }
    } else if (session.role === "RECRUITER") {
      whereClause.department = { in: session.departments }
    } else if (session.role === "PANEL_MEMBER") {
      whereClause.interviews = {
        some: {
          assigned_members: {
            some: { user_id: session.id }
          },
          ...(status !== "ALL" ? { application: { status: status } } : {})
        }
      }
    } 
    
    if (status !== "ALL" && session.role !== "PANEL_MEMBER") {
      whereClause.applications = {
        some: {
          status: status
        }
      }
    }

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { registration_number: { contains: q, mode: 'insensitive' } },
      ]
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10))
    const skip = (page - 1) * limit

    let includeClause: any = {
      applications: true,
      interviews: true
    }

    if (session.role === "PANEL_MEMBER") {
      // Req 5: Authorization must happen at the query level. Do not load all and filter in JS.
      includeClause = {
        applications: {
          where: {
            interviews: {
              some: {
                assigned_members: { some: { user_id: session.id } }
              }
            }
          }
        },
        interviews: {
          where: {
            assigned_members: { some: { user_id: session.id } }
          }
        }
      }
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where: whereClause,
        include: includeClause,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.candidate.count({ where: whereClause })
    ])

    return res.status(200).json({ 
      candidates, // keeping candidates array for backward compatibility
      items: candidates,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Error fetching candidates:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
