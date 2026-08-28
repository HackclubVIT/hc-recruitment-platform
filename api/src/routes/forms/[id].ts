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

    const form = await prisma.form.findUnique({
      where: { id },
      include: { questions: { orderBy: { id: 'asc' } } }
    })

    if (!form) {
      return res.status(404).json({ error: "Form not found" })
    }

    return res.status(200).json({ form })
  } catch (error) {
    console.error("Fetch form error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const PUT = async (req: Request, res: Response) => {
  const params = req.params;
  try {
    const session = await getSession(req)
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" })
    }
    
    const resolvedParams = req.params
    const id = parseInt((resolvedParams.id as string), 10)
    const body = req.body
    const { status, title, description } = body

    const existingForm = await prisma.form.findUnique({ where: { id } })
    if (!existingForm) {
      return res.status(404).json({ error: "Form not found" })
    }

    const updateData: any = {}
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    
    if (status && status !== existingForm.status) {
      updateData.status = status
      if (status === "PUBLISHED") updateData.published_at = new Date()
      if (status === "CLOSED") updateData.closed_at = new Date()
    }

    const form = await prisma.form.update({
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

    // Ensure we delete form questions first
    await prisma.$transaction([
      prisma.formQuestion.deleteMany({ where: { form_id: id } }),
      prisma.form.delete({ where: { id } })
    ])

    await logAudit(session.id, `DELETED_FORM`, "Form", id)

    return res.status(200).json({ message: "Form deleted" })
  } catch (error) {
    console.error("Delete form error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
