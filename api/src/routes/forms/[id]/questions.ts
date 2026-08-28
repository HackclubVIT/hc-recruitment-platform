import { Request, Response } from "express";
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

const VALID_QUESTION_TYPES = ["TEXT", "PARAGRAPH", "RADIO", "DROPDOWN", "CHECKBOX"]

export const POST = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }
    
    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)
    
    const { question, type, required, options } = req.body

    if (!question || !type) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Validate question type
    if (!VALID_QUESTION_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid question type. Must be one of: ${VALID_QUESTION_TYPES.join(", ")}` })
    }

    // Validate options for types that require them
    if (["RADIO", "DROPDOWN", "CHECKBOX"].includes(type)) {
      if (!options || !Array.isArray(options) || options.length === 0) {
        return res.status(400).json({ error: `Options are required for ${type} question type` })
      }
    }

    // Check form exists and is in DRAFT state
    const form = await prisma.form.findUnique({ where: { id } })
    if (!form) {
      return res.status(404).json({ error: "Form not found" })
    }
    if (form.status !== "DRAFT") {
      return res.status(400).json({ error: "Cannot add questions to a non-DRAFT form" })
    }

    const formQuestion = await prisma.formQuestion.create({
      data: {
        form_id: id,
        question,
        type,
        required: Boolean(required),
        options: options || []  // TASK 3: Never insert null into String[]
      }
    })

    await logAudit(session.id, "CREATED_FORM_QUESTION", "FormQuestion", formQuestion.id)

    return res.status(201).json({ question: formQuestion })
  } catch (error) {
    console.error("Create form question error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
