import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        applications: true,
        interviews: {
          include: { panel: true, feedback: true }
        }
      }
    })

    if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Access control: Recruiter can only view their own department
    if (session.role === "RECRUITER" && !session.departments.includes(candidate.department)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ candidate }, { status: 200 })
  } catch (error) {
    console.error("Fetch candidate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
