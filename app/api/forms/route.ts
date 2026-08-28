import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const questions = await prisma.formQuestion.findMany({
      orderBy: { id: 'asc' }
    })

    return NextResponse.json({ questions }, { status: 200 })
  } catch (error) {
    console.error("Fetch form questions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { question, type, required, options } = await req.json()

    if (!question || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const formQuestion = await prisma.formQuestion.create({
      data: {
        form_id: 1, // Default form
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
