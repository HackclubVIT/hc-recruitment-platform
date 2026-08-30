import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"
import { toISTDateString } from "../lib/timezone"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const totalApplications = await prisma.recruitmentApplication.count()
    const totalCandidates = await prisma.recruitmentApplication.count()
    const totalInterviews = await prisma.recruitmentInterview.count()
    
    // total recruiters
    const totalRecruiters = await prisma.recruitmentRoleAssignment.count({ 
      where: { role: 'RECRUITER', active: true } 
    })
    const totalPanels = await prisma.recruitmentPanel.count()

    const shortlisted = await prisma.recruitmentApplication.count({ where: { status: 'SHORTLISTED' } })
    const scheduledInterviews = await prisma.recruitmentApplication.count({ where: { status: 'INTERVIEW_SCHEDULED' } })
    const completedInterviews = await prisma.recruitmentApplication.count({ where: { status: 'INTERVIEW_COMPLETED' } })
    const selectedCandidates = await prisma.recruitmentApplication.count({ where: { status: 'SELECTED' } })
    const rejectedCandidates = await prisma.recruitmentApplication.count({ where: { status: 'REJECTED' } })
    
    const pendingFeedback = await prisma.recruitmentInterview.count({ where: { status: 'FEEDBACK_PENDING' } })

    const applicationsByStatusRaw = await prisma.recruitmentApplication.groupBy({
      by: ['status'],
      _count: { status: true }
    })
    const applicationsByStatus = applicationsByStatusRaw.reduce((acc: any, curr: any) => {
      acc[curr.status] = curr._count.status
      return acc
    }, {})

    // department grouping
    const departmentsWithApps = await prisma.recruitmentApplication.groupBy({
      by: ['domain'],
      _count: { id: true }
    })
    
    const applicationsByDepartment = departmentsWithApps.map((d: any) => ({
      department: d.domain || "Unknown",
      count: d._count.id
    }))

    const selectedVsRejected = {
      SELECTED: selectedCandidates,
      REJECTED: rejectedCandidates
    }

    const allInterviews = await prisma.recruitmentInterview.findMany({
      select: { start_time: true }
    })
    
    const interviewsByDayRaw: Record<string, number> = {}
    allInterviews.forEach((inv: any) => {
      const istDate = toISTDateString(inv.start_time)
      interviewsByDayRaw[istDate] = (interviewsByDayRaw[istDate] || 0) + 1
    })

    const interviewsByDay = Object.keys(interviewsByDayRaw)
      .sort()
      .map(date => ({ date, count: interviewsByDayRaw[date] }))

    const recentActivity = await prisma.recruitmentAuditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    // Formatting BigInts for recent activity
    const formattedActivity = recentActivity.map((a: any) => ({
       ...a,
       id: a.id.toString(),
       user_id: a.user_id ? a.user_id.toString() : null
    }))

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
      recentActivity: formattedActivity
    })
  } catch (error) {
    console.error("Fetch analytics error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
