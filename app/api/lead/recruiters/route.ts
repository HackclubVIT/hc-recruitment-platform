import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles } from "@/lib/guards"
import { Role } from "@/lib/status"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const depts = await prisma.department.findMany({
    where: auth.role === Role.ADMIN ? undefined : { id: { in: auth.deptIds } },
  })
  const deptNames = depts.map(d => d.name)

  const recruiters = await prisma.user.findMany({
    where: { role: Role.RECRUITER, department: { in: deptNames } },
    include: {
      _count: { select: { assignedApps: { where: { status: { notIn: ["SELECTED", "REJECTED"] } } } } },
    },
  })

  return NextResponse.json({
    recruiters: recruiters.map(r => ({
      id: Number(r.id),
      name: r.name,
      email: r.email,
      activeApplications: r._count.assignedApps,
      departments: r.department ? depts.filter(d => d.name === r.department) : [],
    })),
  })
}