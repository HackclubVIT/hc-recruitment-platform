import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string, questionId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const resolvedParams = await params
    const formId = parseInt(resolvedParams.id, 10)
    const questionId = parseInt(resolvedParams.questionId, 10)

    if (isNaN(formId) || isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const form = await prisma.form.findUnique({
      where: { id: formId }
    })

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }

    // Usually only allow editing DRAFT forms, but maybe we allow modifying PUBLISHED ones if needed. 
    // Spec says: "Only DRAFT forms should allow question modifications unless there is an explicit safe editing policy."
    if (form.status !== "DRAFT") {
      return NextResponse.json({ error: "Cannot modify questions on a non-DRAFT form" }, { status: 400 })
    }

    const { question, type, required, options } = await req.json()

    if (!question || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify question belongs to form
    const existingQuestion = await prisma.formQuestion.findFirst({
      where: { id: questionId, form_id: formId }
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found or does not belong to this form" }, { status: 404 })
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

    return NextResponse.json({ question: updatedQuestion }, { status: 200 })
  } catch (error) {
    console.error("Update question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string, questionId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const resolvedParams = await params
    const formId = parseInt(resolvedParams.id, 10)
    const questionId = parseInt(resolvedParams.questionId, 10)

    if (isNaN(formId) || isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const form = await prisma.form.findUnique({
      where: { id: formId }
    })

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }

    if (form.status !== "DRAFT") {
      return NextResponse.json({ error: "Cannot delete questions on a non-DRAFT form" }, { status: 400 })
    }

    const existingQuestion = await prisma.formQuestion.findFirst({
      where: { id: questionId, form_id: formId }
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found or does not belong to this form" }, { status: 404 })
    }

    await prisma.formQuestion.delete({
      where: { id: questionId }
    })

    await logAudit(session.id, "DELETED_QUESTION", "FormQuestion", questionId)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Delete question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
