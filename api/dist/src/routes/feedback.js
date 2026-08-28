import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";
import { z } from "zod";
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
});
export const POST = async (req, res) => {
    try {
        const session = await getSession(req);
        if (!session || session.role !== "PANEL_MEMBER") {
            return res.status(403).json({ error: "Forbidden" });
        }
        const body = req.body;
        // TASK 5: Validate all fields
        const parsed = feedbackSchema.safeParse(body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid feedback data", details: parsed.error.format() });
        }
        const { interview_id, technical_score, communication_score, problem_solving_score, confidence_score, teamwork_score, comments, decision } = parsed.data;
        // Verify Panel Member is assigned to this interview
        const interview = await prisma.interview.findUnique({
            where: { id: interview_id },
            include: { panel: { include: { members: true } }, candidate: true }
        });
        if (!interview) {
            return res.status(404).json({ error: "Interview not found" });
        }
        const panelMember = interview.panel.members.find((m) => m.user_id === session.id);
        if (!panelMember) {
            return res.status(403).json({ error: "You are not authorized to review this interview." });
        }
        // Check for duplicate submissions
        const existingFeedback = await prisma.feedback.findFirst({
            where: {
                interview_id,
                panel_member_id: panelMember.id
            }
        });
        if (existingFeedback) {
            return res.status(409).json({ error: "Feedback already submitted for this interview." });
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
            });
            // TASK 23: Check if ALL panel members have submitted feedback
            const totalMembers = interview.panel.members.length;
            const feedbackCount = await tx.feedback.count({
                where: { interview_id }
            });
            const allSubmitted = feedbackCount >= totalMembers;
            await tx.interview.update({
                where: { id: interview_id },
                data: { status: allSubmitted ? "FEEDBACK_SUBMITTED" : "FEEDBACK_PENDING" }
            });
            // Update Application Status if all feedback submitted
            if (allSubmitted) {
                const application = await tx.application.findFirst({
                    where: { candidate_id: interview.candidate_id },
                    orderBy: { submitted_at: 'desc' }
                });
                if (application) {
                    await tx.application.update({
                        where: { id: application.id },
                        data: { status: "INTERVIEW_COMPLETED" }
                    });
                }
            }
            return newFeedback;
        });
        await logAudit(session.id, "SUBMITTED_FEEDBACK", "Feedback", feedback.id);
        // Notify Recruiter
        await createNotification(interview.recruiter_id, "Feedback Submitted", `Panel feedback has been submitted for ${interview.candidate.name}.`);
        return res.status(201).json({ message: "Feedback submitted successfully", feedback });
    }
    catch (error) {
        console.error("Submit feedback error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
