import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role === "NONE") {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const searchParams = new URLSearchParams(req.query as any)
    const q = searchParams.get("q") || ""
    const status = searchParams.get("status") || "ALL"
    const department = searchParams.get("department")

    const whereClause: any = { recruitmentId: "recruitment-2026" }
    
    if (department) {
      if (session.role === "RECRUITER") {
        if (session.departments.includes(department)) {
          whereClause.domain = department
        } else {
          return res.status(403).json({ error: "Forbidden: Department not assigned" })
        }
      } else if (session.role === "ADMIN") {
        whereClause.domain = department
      }
    } else if (session.role === "RECRUITER") {
      whereClause.domain = { in: session.departments }
    } else if (session.role === "PANEL_MEMBER") {
      whereClause.interviews = {
        some: {
          assigned_members: {
            some: { user_id: BigInt(session.id) }
          }
        }
      }
    } 
    
    if (status !== "ALL") {
       whereClause.status = status
    }

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { registerNumber: { contains: q, mode: 'insensitive' } },
      ]
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10))
    const skip = (page - 1) * limit

    let includeClause: any = {
      interviews: true
    }

    if (session.role === "PANEL_MEMBER") {
      includeClause = {
        interviews: {
          where: {
            assigned_members: { some: { user_id: BigInt(session.id) } }
          }
        }
      }
    }

    const [applications, total] = await Promise.all([
      prisma.recruitmentApplication.findMany({
        where: whereClause,
        include: includeClause,
        skip,
        take: limit,
        orderBy: { id: 'desc' } // or appliedDate if it was a DateTime
      }),
      prisma.recruitmentApplication.count({ where: whereClause })
    ])

    // Format for frontend compatibility - serialize BigInts
    const candidates = applications.map(app => ({
      ...app,
      id: app.id.toString(),
      decided_by: app.decided_by?.toString() || null,
      interviews: app.interviews
    }))

    return res.status(200).json({ 
      candidates,
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
