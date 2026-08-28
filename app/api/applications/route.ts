import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { createNotification } from "@/lib/notify"
import { logAudit } from "@/lib/audit"

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // 1. Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        registration_number: data.registration_number,
        resume_url: data.resume_url,
      },
    })

    // 2. Create Application
    const application = await prisma.application.create({
      data: {
        candidate_id: candidate.id,
        form_id: data.form_id || 1,
        status: "APPLIED",
        answers: data.answers || {},
      },
    })

    // Find recruiters in this department to notify them
    const recruiters = await prisma.user.findMany({
      where: {
        role: "RECRUITER",
        departments: {
          has: data.department,
        },
      },
    })

    for (const recruiter of recruiters) {
      await createNotification(
        recruiter.id,
        "New Application Submitted",
        `${candidate.name} applied for the ${candidate.department} department.`
      )
    }

    // System audit log
    await logAudit("SYSTEM", "APPLICATION_SUBMITTED", "Application", application.id)

    return NextResponse.json(
      { message: "Application submitted successfully", applicationId: application.id },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Application submission error:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Registration number or email already applied." }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
