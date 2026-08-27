import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles } from "@/lib/guards"
import { Role } from "@/lib/status"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const deptIds = auth.role === Role.ADMIN
    ? (await prisma.department.findMany({ select: { id: true } })).map(d => d.id)
    : auth.deptIds

  const [
    totalApplications,
    statusCounts,
    recentActivity,
    recruiterLoad,
  ] = await Promise.all([
    prisma.application.count({ where: { departmentId: { in: deptIds } } }),
    prisma.application.groupBy({
      by: ["status"],
      where: { departmentId: { in: deptIds } },
      _count: true,
    }),
    prisma.statusHistory.findMany({
      where: { application: { departmentId: { in: deptIds } } },
      include: { application: { select: { id: true, name: true } } },
      orderBy: { changedAt: "desc" },
      take: 20,
    }),
    (async () => {
      const depts = await prisma.department.findMany({
        where: auth.role === Role.ADMIN ? undefined : { id: { in: auth.deptIds } },
      })
      const deptNames = depts.map(d => d.name)
      return prisma.user.findMany({
        where: { role: Role.RECRUITER, department: { in: deptNames } },
        include: { _count: { select: { assignedApps: { where: { status: { notIn: ["SELECTED", "REJECTED"] } } } } } },
      })
    })(),
  ])

  const funnel = statusCounts.reduce((acc, item) => {
    acc[item.status] = item._count
    return acc
  }, {} as Record<string, number>)

  // We need to fetch the changedBy users separately since their IDs are BigInt
  const changedByUserIds = [...new Set(recentActivity.map(a => a.changedByUserId))]
  const users = await prisma.user.findMany({
    where: { id: { in: changedByUserIds } },
    select: { id: true, name: true }
  })
  const userMap = new Map(users.map(u => [u.id.toString(), u.name]))

  const recentActivityWithUsers = recentActivity.map(a => ({
    ...a,
    id: Number(a.id),
    applicationId: Number(a.applicationId),
    changedByUserId: Number(a.changedByUserId),
    changedBy: {
      id: Number(a.changedByUserId),
      name: userMap.get(a.changedByUserId.toString()) || "Unknown",
    }
  }))

  return NextResponse.json({
    totalApplications,
    funnel,
    recentActivity: recentActivityWithUsers,
    recruiterLoad: recruiterLoad.map(r => ({
      id: Number(r.id),
      name: r.name,
      email: r.email,
      activeApplications: r._count.assignedApps,
    })),
  })
}