import { Request, Response } from "express";
import prisma from "../../../../lib/db"
import { getSession } from "../../../../lib/auth"
import { logAudit } from "../../../../lib/audit"

export const PUT = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const resolvedParams = req.params
    const formId = parseInt((resolvedParams.id as string), 10)
    const questionId = parseInt((resolvedParams.questionId as string), 10)

    if (isNaN(formId) || isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid ID" })
    }

    const form = await prisma.form.findUnique({
      where: { id: formId }
    })

    if (!form) {
      return res.status(404).json({ error: "Form not found" })
    }

    // Usually only allow editing DRAFT forms, but maybe we allow modifying PUBLISHED ones if needed. 
    // Spec says: "Only DRAFT forms should allow question modifications unless there is an explicit safe editing policy."
    if (form.status !== "DRAFT") {
      return res.status(400).json({ error: "Cannot modify questions on a non-DRAFT form" })
    }

    const { question, type, required, options } = req.body

    if (!question || !type) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Verify question belongs to form
    const existingQuestion = await prisma.formQuestion.findFirst({
      where: { id: questionId, form_id: formId }
    })

    if (!existingQuestion) {
      return res.status(404).json({ error: "Question not found or does not belong to this form" })
    }

    const updatedQuestion = await prisma.formQuestion.update({
      where: { id: questionId },
      data: {
        question,
        type,
        required: required ?? false,
        options: options || []
      }
    })

    await logAudit(session.id, "UPDATED_QUESTION", "FormQuestion", updatedQuestion.id)

    return res.status(200).json({ question: updatedQuestion })
  } catch (error) {
    console.error("Update question error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const DELETE = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const resolvedParams = req.params
    const formId = parseInt((resolvedParams.id as string), 10)
    const questionId = parseInt((resolvedParams.questionId as string), 10)

    if (isNaN(formId) || isNaN(questionId)) {
      return res.status(400).json({ error: "Invalid ID" })
    }

    const form = await prisma.form.findUnique({
      where: { id: formId }
    })

    if (!form) {
      return res.status(404).json({ error: "Form not found" })
    }

    if (form.status !== "DRAFT") {
      return res.status(400).json({ error: "Cannot delete questions on a non-DRAFT form" })
    }

    const existingQuestion = await prisma.formQuestion.findFirst({
      where: { id: questionId, form_id: formId }
    })

    if (!existingQuestion) {
      return res.status(404).json({ error: "Question not found or does not belong to this form" })
    }

    await prisma.formQuestion.delete({
      where: { id: questionId }
    })

    await logAudit(session.id, "DELETED_QUESTION", "FormQuestion", questionId)

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Delete question error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
