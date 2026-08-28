import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
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

    // Analytics: Department Distribution (by applications, not candidates)
    const departmentsWithApps = await prisma.candidate.findMany({
      select: {
        department: true,
        _count: { select: { applications: true } }
      }
    })
    
    const deptMap: Record<string, number> = {}
    for (const d of departmentsWithApps) {
      deptMap[d.department] = (deptMap[d.department] || 0) + d._count.applications
    }
    
    const applicationsByDepartment = Object.keys(deptMap).map(dept => ({
      department: dept,
      count: deptMap[dept]
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
    allInterviews.forEach((inv: any) => {
      // Convert to Asia/Kolkata date for grouping (Req 25)
      const istDate = inv.start_time.toLocaleString("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" })
      interviewsByDayRaw[istDate] = (interviewsByDayRaw[istDate] || 0) + 1
    })

    const interviewsByDay = Object.keys(interviewsByDayRaw)
      .sort()
      .map(date => ({ date, count: interviewsByDayRaw[date] }))

    // Recent activity from audit logs
    const recentActivity = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    return res.status(200).json({
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
    })
  } catch (error) {
    console.error("Fetch analytics error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
