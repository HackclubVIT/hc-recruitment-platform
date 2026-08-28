import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { createNotification } from "@/lib/notify"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const applicationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  department: z.string().min(2),
  registration_number: z.string().min(4),
  resume_url: z.string().url().optional().or(z.literal('')),
  form_id: z.number().int().positive(),
  answers: z.record(z.string(), z.string()).optional()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = applicationSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form data", details: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data

    // Check if form is published
    const form = await prisma.form.findUnique({ where: { id: data.form_id } })
    if (!form || form.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Form is not active or does not exist." }, { status: 400 })
    }

    // 1. Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        registration_number: data.registration_number,
        resume_url: data.resume_url || null,
      },
    })

    // 2. Create Application
    const application = await prisma.application.create({
      data: {
        candidate_id: candidate.id,
        form_id: data.form_id,
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
      return NextResponse.json({ error: "Candidate with this Registration number or email already exists." }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
