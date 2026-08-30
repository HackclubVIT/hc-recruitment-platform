import { Request, Response } from "express";
import prisma from "../../../lib/db"
import { getSession } from "../../../lib/auth"
import { logAudit } from "../../../lib/audit"

import { z } from "zod"

const VALID_QUESTION_TYPES = ["TEXT", "PARAGRAPH", "RADIO", "DROPDOWN", "CHECKBOX"] as const;

const questionSchema = z.object({
  question: z.string().min(2),
  type: z.enum(VALID_QUESTION_TYPES),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional()
}).refine(data => {
  if (["RADIO", "DROPDOWN", "CHECKBOX"].includes(data.type)) {
    return data.options && data.options.length > 0
  }
  return true
}, { message: "Options are required for this question type", path: ["options"] })

export const POST = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }
    
    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)
    
    const parsed = questionSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid question data", details: parsed.error.format() })
    }

    const { question, type, required, options } = parsed.data

    // Check form exists and is in DRAFT state
    const form = await prisma.recruitmentForm.findUnique({ where: { id } })
    if (!form) {
      return res.status(404).json({ error: "Form not found" })
    }
    if (form.status !== "DRAFT") {
      return res.status(400).json({ error: "Cannot add questions to a non-DRAFT form" })
    }

    const formQuestion = await prisma.recruitmentFormQuestion.create({
      data: {
        form_id: id,
        question,
        type,
        required: Boolean(required),
        options: options || []  // Never insert null into String[]
      }
    })

    await logAudit(session.id, "CREATED_FORM_QUESTION", "FormQuestion", formQuestion.id)

    return res.status(201).json({ question: formQuestion })
  } catch (error) {
    console.error("Create form question error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
