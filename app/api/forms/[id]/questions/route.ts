import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function POST(
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
    
    const { question, type, required, options } = await req.json()

    if (!question || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const formQuestion = await prisma.formQuestion.create({
      data: {
        form_id: id,
        question,
        type,
        required: Boolean(required),
        options: options || null
      }
    })

    await logAudit(session.id, "CREATED_FORM_QUESTION", "FormQuestion", formQuestion.id)

    return NextResponse.json({ question: formQuestion }, { status: 201 })
  } catch (error) {
    console.error("Create form question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
