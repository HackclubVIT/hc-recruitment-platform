import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles } from "@/lib/guards"
import { Role } from "@/lib/status"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.RECRUITER, Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const search = searchParams.get("search")
  const roleAppliedFor = searchParams.get("roleAppliedFor")
  const departmentId = searchParams.get("departmentId")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const where: Record<string, unknown> = {}

  if (status) where.status = status
  if (roleAppliedFor) where.roleAppliedFor = { contains: roleAppliedFor, mode: "insensitive" }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { registerNumber: { contains: search, mode: "insensitive" } },
    ]
  }

  if (auth.role !== Role.ADMIN) {
    where.departmentId = { in: auth.deptIds }
  } else if (departmentId) {
    where.departmentId = parseInt(departmentId, 10)
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        assignedRecruiter: { select: { id: true, name: true, email: true } },
        _count: { select: { interviews: true, notes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where }),
  ])

  return NextResponse.json({
    applications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}