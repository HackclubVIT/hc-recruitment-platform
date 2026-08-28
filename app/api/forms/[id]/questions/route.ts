import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

const VALID_QUESTION_TYPES = ["TEXT", "PARAGRAPH", "RADIO", "DROPDOWN", "CHECKBOX"]

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

    // Validate question type
    if (!VALID_QUESTION_TYPES.includes(type)) {
      return NextResponse.json({ error: `Invalid question type. Must be one of: ${VALID_QUESTION_TYPES.join(", ")}` }, { status: 400 })
    }

    // Validate options for types that require them
    if (["RADIO", "DROPDOWN", "CHECKBOX"].includes(type)) {
      if (!options || !Array.isArray(options) || options.length === 0) {
        return NextResponse.json({ error: `Options are required for ${type} question type` }, { status: 400 })
      }
    }

    // Check form exists and is in DRAFT state
    const form = await prisma.form.findUnique({ where: { id } })
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }
    if (form.status !== "DRAFT") {
      return NextResponse.json({ error: "Cannot add questions to a non-DRAFT form" }, { status: 400 })
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

    return NextResponse.json({ question: formQuestion }, { status: 201 })
  } catch (error) {
    console.error("Create form question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
