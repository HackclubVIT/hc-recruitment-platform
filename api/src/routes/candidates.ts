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

    function buildDepartmentCondition(deptNames: string[]) {
      const allVariants = new Set<string>();
      for (const d of deptNames) {
        allVariants.add(d);
        if (d.toLowerCase().includes("research")) {
          allVariants.add("Research and Development");
          allVariants.add("Research & Development");
          allVariants.add("R&D");
        }
        if (d.toLowerCase().includes("design")) {
          allVariants.add("Design & Social Media");
          allVariants.add("Design and Social Media");
          allVariants.add("Design");
        }
        if (d.toLowerCase().includes("technical")) {
          allVariants.add("Technical");
          allVariants.add("Web Development");
        }
      }

      const conditions: any[] = [];
      for (const variant of allVariants) {
        conditions.push(
          { domain: { equals: variant, mode: "insensitive" } },
          { firstPreference: { equals: variant, mode: "insensitive" } },
          { secondPreference: { equals: variant, mode: "insensitive" } }
        );
      }
      return { OR: conditions };
    }

    const andConditions: any[] = [
      { recruitmentId: "recruitment-2026" }
    ];
    
    if (department && department !== "ALL") {
      if (session.role === "RECRUITER") {
        const matchesDept = session.departments.some(d => d.toLowerCase() === department.toLowerCase() || d === "*")
        if (matchesDept) {
          andConditions.push(buildDepartmentCondition([department]));
        } else {
          return res.status(403).json({ error: "Forbidden: Department not assigned" })
        }
      } else if (session.role === "ADMIN") {
        andConditions.push(buildDepartmentCondition([department]));
      }
    } else if (session.role === "RECRUITER") {
      if (!session.departments.includes("*") && session.departments.length > 0) {
        andConditions.push(buildDepartmentCondition(session.departments));
      }
    } else if (session.role === "PANEL_MEMBER") {
      andConditions.push({
        interviews: {
          some: {
            assigned_members: {
              some: { user_id: BigInt(session.id) }
            }
          }
        }
      });
    } 
    
    if (status !== "ALL") {
       andConditions.push({ status });
    }

    if (q) {
      andConditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { registerNumber: { contains: q, mode: 'insensitive' } },
        ]
      });
    }

    const whereClause: any = { AND: andConditions };

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
            assigned_members: { some: { user_id: session.id } }
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
      // Aliases for frontend compatibility
      registration_number: app.registerNumber,
      department: app.domain || app.firstPreference || '',
      interviews: app.interviews ? app.interviews.map(i => ({
        ...i,
        id: typeof i.id === 'bigint' ? i.id.toString() : i.id,
        application_id: i.application_id.toString(),
        recruiter_id: i.recruiter_id?.toString() || null
      })) : []
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
