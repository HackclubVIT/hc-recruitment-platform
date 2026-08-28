import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles } from "@/lib/guards"
import { Role } from "@/lib/status"

/**
 * GET /api/lead/dashboard
 * Returns aggregated dashboard data for Lead/ADMIN
 * 
 * AUTH: Requires LEAD or ADMIN role
 * SCOPE: Department-scoped (ADMIN sees all departments)
 * 
 * RESPONSE: {
 *   totalApplications: number,
 *   funnel: Record<status, count>,
 *   recentActivity: Array<{id, changedBy, application, toStatus, reason, changedAt}>,
 *   recruiterLoad: Array<{id, name, email, activeApplications}>
 * }
 * 
 * TODO: [INTEGRATION] Add pagination for recentActivity (currently hardcoded take: 20)
 * TODO: [INTEGRATION] Add caching headers for dashboard data
 */

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  // Determine department scope: ADMIN sees all, LEAD sees only their departments
  const deptIds = auth.role === Role.ADMIN
    ? (await prisma.department.findMany({ select: { id: true } })).map(d => d.id)
    : auth.deptIds

  // Parallel fetch of all dashboard data
  const [
    totalApplications,
    statusCounts,
    recentActivity,
    recruiterLoad,
  ] = await Promise.all([
    // Total application count in scope
    prisma.application.count({ where: { departmentId: { in: deptIds } } }),
    // Funnel counts grouped by status
    prisma.application.groupBy({
      by: ["status"],
      where: { departmentId: { in: deptIds } },
      _count: true,
    }),
    // Recent status changes (last 20)
    prisma.statusHistory.findMany({
      where: { application: { departmentId: { in: deptIds } } },
      include: { application: { select: { id: true, name: true } } },
      orderBy: { changedAt: "desc" },
      take: 20, // FIXME: [BUG] Hardcoded limit - no pagination
    }),
    // Recruiter workload: recruiters in scope with active app counts
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

  // Transform statusCounts array to funnel object
  const funnel = statusCounts.reduce((acc, item) => {
    acc[item.status] = item._count
    return acc
  }, {} as Record<string, number>)

  // Fetch changedBy user names separately (BigInt IDs require string conversion)
  const changedByUserIds = [...new Set(recentActivity.map(a => a.changedByUserId))]
  const users = await prisma.user.findMany({
    where: { id: { in: changedByUserIds } },
    select: { id: true, name: true }
  })
  const userMap = new Map(users.map(u => [u.id.toString(), u.name]))

  // Build recent activity with user names
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