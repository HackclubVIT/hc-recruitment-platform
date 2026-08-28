import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"
import { logAudit } from "../lib/audit"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const forms = await prisma.form.findMany({
      include: { questions: true },
      orderBy: { created_at: 'desc' }
    })

    return res.status(200).json({ forms })
  } catch (error) {
    console.error("Fetch forms error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

import { z } from "zod"

const createFormSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional()
})

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const parsed = createFormSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid form data", details: parsed.error.format() })
    }

    const { title, description } = parsed.data

    const form = await prisma.form.create({
      data: {
        title,
        description,
        status: "DRAFT"
      },
      include: { questions: true }
    })

    await logAudit(session.id, "CREATED_FORM", "Form", form.id)

    return res.status(201).json({ form })
  } catch (error) {
    console.error("Create form error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
