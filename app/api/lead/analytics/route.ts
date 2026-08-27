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
    funnelCounts,
    panelLoad,
    feedbackRecs,
  ] = await Promise.all([
    prisma.application.groupBy({
      by: ["status"],
      where: { departmentId: { in: deptIds } },
      _count: true,
    }),
    (async () => {
      const depts = await prisma.department.findMany({
        where: auth.role === Role.ADMIN ? undefined : { id: { in: auth.deptIds } },
      })
      const deptNames = depts.map(d => d.name)
      return prisma.user.findMany({
        where: { role: Role.PANEL, isReviewer: true, department: { in: deptNames } },
        include: {
          panelistAssignments: {
            include: { interview: true },
          },
        },
      })
    })(),
    prisma.feedback.groupBy({
      by: ["recommendation"],
      where: { interview: { application: { departmentId: { in: deptIds } } } },
      _count: true,
    }),
  ])

  const funnel = funnelCounts.reduce((acc, item) => {
    acc[item.status] = item._count
    return acc
  }, {} as Record<string, number>)

  const panelWorkload = panelLoad.map(p => {
    const assignments = (p as any).panelistAssignments || []
    const upcoming = assignments.filter((a: any) => 
      a.interview?.status === "SCHEDULED" || a.interview?.status === "RESCHEDULED"
    ).length
    return {
      id: Number(p.id),
      name: p.name,
      email: p.email,
      upcomingInterviews: upcoming,
    }
  })

  const recommendationDist = feedbackRecs.reduce((acc, item) => {
    acc[item.recommendation] = item._count
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json({
    funnel,
    panelWorkload,
    recommendationDist,
    totalApplications: Object.values(funnel).reduce((a, b) => a + b, 0),
  })
}