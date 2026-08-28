import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formId = parseInt(id, 10)

    if (isNaN(formId)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 })
    }

    const questions = await prisma.formQuestion.findMany({
      where: { form_id: formId },
      orderBy: { id: 'asc' }
    })

    return NextResponse.json({ questions }, { status: 200 })
  } catch (error) {
    console.error("Fetch form questions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
