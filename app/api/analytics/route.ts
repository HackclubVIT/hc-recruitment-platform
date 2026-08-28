import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Basic metrics aggregation for dashboard
    const totalApplications = await prisma.application.count()
    const totalCandidates = await prisma.candidate.count()
    const totalInterviews = await prisma.interview.count()
    const totalRecruiters = await prisma.user.count({ where: { role: 'RECRUITER' } })
    const totalPanels = await prisma.panel.count()

    const shortlisted = await prisma.application.count({ where: { status: 'SHORTLISTED' } })
    const scheduledInterviews = await prisma.application.count({ where: { status: 'INTERVIEW_SCHEDULED' } })
    const completedInterviews = await prisma.application.count({ where: { status: 'INTERVIEW_COMPLETED' } })
    const selectedCandidates = await prisma.application.count({ where: { status: 'SELECTED' } })
    const rejectedCandidates = await prisma.application.count({ where: { status: 'REJECTED' } })
    
    // In our system, feedback pending can be determined by interviews without sufficient feedback or specific application status.
    // For simplicity, we just count applications that are waitlisted or require review
    const pendingFeedback = await prisma.interview.count({ where: { status: 'FEEDBACK_PENDING' } })

    // Analytics: Applications by status
    const applicationsByStatusRaw = await prisma.application.groupBy({
      by: ['status'],
      _count: { status: true }
    })
    const applicationsByStatus = applicationsByStatusRaw.reduce((acc: any, curr: any) => {
      acc[curr.status] = curr._count.status
      return acc
    }, {})

    // Analytics: Department Distribution
    const departmentRaw = await prisma.candidate.groupBy({
      by: ['department'],
      _count: { department: true }
    })
    const applicationsByDepartment = departmentRaw.map((d: any) => ({
      department: d.department,
      count: d._count.department
    }))

    // Analytics: Selected vs Rejected
    const selectedVsRejected = {
      SELECTED: selectedCandidates,
      REJECTED: rejectedCandidates
    }

    // Analytics: Interviews by day
    // We will fetch all interviews and group them in memory since Prisma doesn't natively group by Date cast easily in raw JS
    const allInterviews = await prisma.interview.findMany({
      select: { start_time: true }
    })
    
    const interviewsByDayRaw: Record<string, number> = {}
    allInterviews.forEach(inv => {
      const day = inv.start_time.toISOString().split('T')[0]
      interviewsByDayRaw[day] = (interviewsByDayRaw[day] || 0) + 1
    })

    const interviewsByDay = Object.keys(interviewsByDayRaw)
      .sort()
      .map(date => ({ date, count: interviewsByDayRaw[date] }))

    // TASK 8: Recent activity from audit logs
    const recentActivity = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    return NextResponse.json({
      metrics: {
        totalApplications,
        totalCandidates,
        totalInterviews,
        totalRecruiters,
        totalPanels,
        shortlisted,
        scheduledInterviews,
        completedInterviews,
        selectedCandidates,
        rejectedCandidates,
        pendingFeedback
      },
      applicationsByStatus,
      applicationsByDepartment,
      selectedVsRejected,
      interviewsByDay,
      recentActivity
    }, { status: 200 })
  } catch (error) {
    console.error("Fetch analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
