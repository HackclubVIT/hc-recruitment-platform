import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    const form = await prisma.form.findUnique({
      where: { id },
      include: { questions: { orderBy: { id: 'asc' } } }
    })

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }

    return NextResponse.json({ form }, { status: 200 })
  } catch (error) {
    console.error("Fetch form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const body = await req.json()
    const { status, title, description } = body

    const existingForm = await prisma.form.findUnique({ where: { id } })
    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
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

    return NextResponse.json({ form }, { status: 200 })
  } catch (error) {
    console.error("Update form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    // Ensure we delete form questions first
    await prisma.$transaction([
      prisma.formQuestion.deleteMany({ where: { form_id: id } }),
      prisma.form.delete({ where: { id } })
    ])

    await logAudit(session.id, `DELETED_FORM`, "Form", id)

    return NextResponse.json({ message: "Form deleted" }, { status: 200 })
  } catch (error) {
    console.error("Delete form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
