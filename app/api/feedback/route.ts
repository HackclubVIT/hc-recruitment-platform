import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { createNotification } from "@/lib/notify"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "PANEL_MEMBER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await req.json()
    const {
      interview_id,
      technical_score,
      communication_score,
      problem_solving_score,
      confidence_score,
      teamwork_score,
      comments,
      decision
    } = data

    // Verify Panel Member is assigned to this interview
    const interview = await prisma.interview.findUnique({
      where: { id: interview_id },
      include: { panel: { include: { members: true } }, candidate: true }
    })

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

    const isMember = interview.panel.members.some((m: any) => m.user_id === session.id)
    const panelMember = interview.panel.members.find((m: any) => m.user_id === session.id)
    if (!panelMember) {
      return NextResponse.json({ error: "You are not authorized to review this interview." }, { status: 403 })
    }

    // Check for duplicate submissions
    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        interview_id,
        panel_member_id: panelMember.id
      }
    })

    if (existingFeedback) {
      return NextResponse.json({ error: "Feedback already submitted for this interview." }, { status: 409 })
    }

    // Save feedback
    const feedback = await prisma.feedback.create({
      data: {
        interview_id,
        panel_member_id: panelMember.id,
        technical_score,
        communication_score,
        problem_solving_score,
        confidence_score,
        teamwork_score,
        comments,
        decision
      }
    })

    // Check if all panel members have submitted feedback
    const totalMembers = interview.panel.members.length
    const feedbackCount = await prisma.feedback.count({
      where: { interview_id }
    })

    const allSubmitted = feedbackCount >= totalMembers

    await prisma.interview.update({
      where: { id: interview_id },
      data: { status: allSubmitted ? "FEEDBACK_SUBMITTED" : "FEEDBACK_PENDING" }
    })

    // Update Application Status if all feedback submitted
    if (allSubmitted) {
      const application = await prisma.application.findFirst({
        where: { candidate_id: interview.candidate_id },
        orderBy: { submitted_at: 'desc' }
      })
      
      if (application) {
        await prisma.application.update({
          where: { id: application.id },
          data: { status: "INTERVIEW_COMPLETED" }
        })
      }
    }

    await logAudit(session.id, "SUBMITTED_FEEDBACK", "Feedback", feedback.id)

    // Notify Recruiter
    await createNotification(
      interview.recruiter_id,
      "Feedback Submitted",
      `Panel feedback has been submitted for ${interview.candidate.name}.`
    )

    return NextResponse.json({ message: "Feedback submitted successfully", feedback }, { status: 201 })
  } catch (error) {
    console.error("Submit feedback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
