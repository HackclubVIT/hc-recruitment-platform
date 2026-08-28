import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { createNotification } from "@/lib/notify"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "RECRUITER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    const { status } = await req.json()

    const application = await prisma.application.update({
      where: { id },
      data: { status },
      include: { candidate: true }
    })

    // Log the audit event
    await logAudit(session.id, `UPDATED_APPLICATION_STATUS_TO_${status}`, "Application", id)

    // Notify the user via email or system if required (Optional based on requirements)
    // For now, notify admins
    await createNotification(
      session.id,
      `Application Status Updated`,
      `${application.candidate.name}'s application was marked as ${status}.`
    )

    return NextResponse.json({ application }, { status: 200 })
  } catch (error) {
    console.error("Update application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
