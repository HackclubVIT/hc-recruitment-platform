import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { createNotification } from "@/lib/notify"
import { z } from "zod"

// TASK 5: Strict validation for feedback scores and decision
const feedbackSchema = z.object({
  interview_id: z.number().int().positive(),
  technical_score: z.number().int().min(1).max(5),
  communication_score: z.number().int().min(1).max(5),
  problem_solving_score: z.number().int().min(1).max(5),
  confidence_score: z.number().int().min(1).max(5),
  teamwork_score: z.number().int().min(1).max(5),
  comments: z.string().optional(),
  decision: z.enum(["RECOMMENDED", "MAYBE", "REJECTED"])
})

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "PANEL_MEMBER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    
    // TASK 5: Validate all fields
    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid feedback data", details: parsed.error.format() }, { status: 400 })
    }

    const {
      interview_id,
      technical_score,
      communication_score,
      problem_solving_score,
      confidence_score,
      teamwork_score,
      comments,
      decision
    } = parsed.data

    // Verify Panel Member is assigned to this interview
    const interview = await prisma.interview.findUnique({
      where: { id: interview_id },
      include: { panel: { include: { members: true } }, candidate: true }
    })

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

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

    // TASK 6: Use $transaction for atomicity
    const feedback = await prisma.$transaction(async (tx) => {
      const newFeedback = await tx.feedback.create({
        data: {
          interview_id,
          panel_member_id: panelMember.id,
          technical_score,
          communication_score,
          problem_solving_score,
          confidence_score,
          teamwork_score,
          comments: comments || null,
          decision
        }
      })

      // TASK 23: Check if ALL panel members have submitted feedback
      const totalMembers = interview.panel.members.length
      const feedbackCount = await tx.feedback.count({
        where: { interview_id }
      })

      const allSubmitted = feedbackCount >= totalMembers

      await tx.interview.update({
        where: { id: interview_id },
        data: { status: allSubmitted ? "FEEDBACK_SUBMITTED" : "FEEDBACK_PENDING" }
      })

      // Update Application Status if all feedback submitted
      if (allSubmitted) {
        const application = await tx.application.findFirst({
          where: { candidate_id: interview.candidate_id },
          orderBy: { submitted_at: 'desc' }
        })
        
        if (application) {
          await tx.application.update({
            where: { id: application.id },
            data: { status: "INTERVIEW_COMPLETED" }
          })
        }
      }

      return newFeedback
    })

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
