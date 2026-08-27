import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles, requireApplicationAccess } from "@/lib/guards"
import { Role } from "@/lib/status"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.RECRUITER, Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const { id } = await params
  const applicationId = parseInt(id, 10)

  const accessCheck = await requireApplicationAccess(auth, applicationId)
  if (accessCheck) return accessCheck

  const interviews = await prisma.interview.findMany({
    where: { applicationId, status: { in: ["COMPLETED", "SCHEDULED", "RESCHEDULED"] } },
    include: {
      feedbacks: {
        include: { panelist: { select: { id: true, name: true, email: true } } },
      },
      panelists: { include: { panelist: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { startTime: "desc" },
  })

  const feedbackSummary = interviews.flatMap(interview =>
    interview.feedbacks.map(fb => ({
      interviewId: interview.id,
      interviewDate: interview.startTime,
      panelist: fb.panelist,
      ratings: JSON.parse(fb.ratings || "{}"),
      overall: fb.overall,
      recommendation: fb.recommendation,
      comments: fb.comments,
      submittedAt: fb.submittedAt,
    }))
  )

  return NextResponse.json({ feedbacks: feedbackSummary, interviews })
}