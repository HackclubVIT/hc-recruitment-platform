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

    const forms = await prisma.form.findMany({
      include: { questions: true },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ forms }, { status: 200 })
  } catch (error) {
    console.error("Fetch forms error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { title, description } = await req.json()

    if (!title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const form = await prisma.form.create({
      data: {
        title,
        description,
        status: "DRAFT"
      },
      include: { questions: true }
    })

    await logAudit(session.id, "CREATED_FORM", "Form", form.id)

    return NextResponse.json({ form }, { status: 201 })
  } catch (error) {
    console.error("Create form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
