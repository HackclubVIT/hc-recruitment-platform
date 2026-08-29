import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"
import { logAudit } from "../../lib/audit"

export const GET = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)

    const form = await prisma.recruitmentForm.findUnique({
      where: { id },
      include: { questions: { orderBy: { id: 'asc' } } }
    })

    if (!form) {
      return res.status(404).json({ error: "Form not found or not currently available" })
    }

    if (form.status !== "PUBLISHED") {
      const session = await getSession(req)
      if (!session || session.role !== "ADMIN") {
        return res.status(404).json({ error: "Form not found or not currently available" })
      }
    }

    return res.status(200).json({ form })
  } catch (error) {
    console.error("Fetch form error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

import { z } from "zod"

const updateFormSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional()
})

export const PUT = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }
    
    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)
    
    const parsed = updateFormSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid form data", details: parsed.error.format() })
    }
    const { status, title, description } = parsed.data

    const existingForm = await prisma.recruitmentForm.findUnique({ where: { id } })
    if (!existingForm) {
      return res.status(404).json({ error: "Form not found" })
    }

    const updateData: any = {}
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    
    if (status && status !== existingForm.status) {
      // Enforce form status lifecycle (Req 27)
      const validFormTransitions: Record<string, string[]> = {
        "DRAFT": ["PUBLISHED", "CLOSED"],
        "PUBLISHED": ["CLOSED"],
        "CLOSED": []
      }
      const allowed = validFormTransitions[existingForm.status] || []
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: `Invalid form status transition from ${existingForm.status} to ${status}` })
      }
      
      updateData.status = status
      if (status === "PUBLISHED") updateData.published_at = new Date()
      if (status === "CLOSED") updateData.closed_at = new Date()
    }

    const form = await prisma.recruitmentForm.update({
      where: { id },
      data: updateData,
      include: { questions: true }
    })

    await logAudit(session.id, `UPDATED_FORM`, "Form", id)

    return res.status(200).json({ form })
  } catch (error) {
    console.error("Update form error:", error)
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
    const id = parseInt((resolvedParams.id as string), 10)

    const form = await prisma.recruitmentForm.findUnique({ where: { id } })
    if (!form) return res.status(404).json({ error: "Form not found" })

    if (form.status !== "DRAFT") {
      return res.status(409).json({ error: "This form cannot be deleted because it has been published. Close the form instead." })
    }

    // Ensure we delete form questions first
    await prisma.$transaction([
      prisma.recruitmentFormQuestion.deleteMany({ where: { form_id: id } }),
      prisma.recruitmentForm.delete({ where: { id } })
    ])

    await logAudit(session.id, `DELETED_FORM`, "Form", id)

    return res.status(200).json({ message: "Form deleted" })
  } catch (error) {
    console.error("Delete form error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
