import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { createNotification } from "@/lib/notify"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const applicationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  department: z.string().min(2),
  registration_number: z.string().min(4),
  resume_url: z.string().url().refine(val => val.startsWith('https://'), { message: "resume_url must use HTTPS protocol" }).optional().or(z.literal('')),
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

    // Check if form is published and load questions
    const form = await prisma.form.findUnique({ 
      where: { id: data.form_id },
      include: { questions: true }
    })
    
    if (!form || form.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Form is not active or does not exist." }, { status: 400 })
    }

    // Dynamic Answer Validation
    const submittedAnswers: Record<string, any> = data.answers || {}
    for (const q of form.questions) {
      const answer = submittedAnswers[q.id.toString()]
      
      // 1. Required check
      if (q.required && (answer === undefined || answer === null || answer === "" || (Array.isArray(answer) && answer.length === 0))) {
        return NextResponse.json({ error: `Question '${q.question}' is required.` }, { status: 400 })
      }

      if (answer) {
        // 2. Options validation for RADIO and DROPDOWN
        if ((q.type === 'RADIO' || q.type === 'DROPDOWN') && q.options.length > 0) {
          if (!q.options.includes(String(answer))) {
            return NextResponse.json({ error: `Invalid option selected for '${q.question}'.` }, { status: 400 })
          }
        }
        
        // 3. Options validation for CHECKBOX (answers could be array or comma-separated string)
        if (q.type === 'CHECKBOX' && q.options.length > 0) {
          let selected: string[] = []
          if (Array.isArray(answer)) selected = answer
          else if (typeof answer === 'string') selected = answer.split(',').map(s => s.trim())
          else selected = [String(answer)]
          
          for (const s of selected) {
            if (!q.options.includes(s)) {
              return NextResponse.json({ error: `Invalid option '${s}' selected for '${q.question}'.` }, { status: 400 })
            }
          }
        }
      }
    }

    // 1. Check duplicate candidate globally or just use unique constraint
    let candidate = await prisma.candidate.findFirst({
      where: {
        OR: [
          { email: data.email },
          { registration_number: data.registration_number }
        ]
      }
    })

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          department: data.department,
          registration_number: data.registration_number,
          resume_url: data.resume_url || null,
        },
      })
    }

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

    // System audit log (nullable user_id for system actions)
    await logAudit(undefined, "APPLICATION_SUBMITTED", "Application", application.id)

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

export async function GET(req: Request) {
  try {
    // TASK 1: Add authentication/authorization
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const department = searchParams.get("department") || ""
    const date = searchParams.get("date") || ""

    const skip = (page - 1) * limit

    const where: any = {}

    // TASK 1: Enforce role-based access
    // Build candidate filter object carefully to avoid overwrite (TASK 10)
    const candidateFilter: any = {}

    if (session.role === "RECRUITER") {
      candidateFilter.department = { in: session.departments }
    } else if (session.role === "PANEL_MEMBER") {
      // Panel members can only see applications for candidates they have interviews with
      candidateFilter.interviews = {
        some: {
          panel: {
            members: {
              some: { user_id: session.id }
            }
          }
        }
      }
    }

    // Search filter
    if (search) {
      candidateFilter.name = { contains: search, mode: "insensitive" }
    }

    // Department filter (admin only - recruiters already filtered by their departments)
    if (department && session.role === "ADMIN") {
      candidateFilter.department = department
    }

    // Only set where.candidate if we have filters
    if (Object.keys(candidateFilter).length > 0) {
      where.candidate = candidateFilter
    }

    if (status) {
      where.status = status
    }

    // TASK 2: Fix date filter to use submitted_at (not created_at which doesn't exist)
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      where.submitted_at = {
        gte: startDate,
        lt: endDate
      }
    }

    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          candidate: true,
          form: true,
        },
        skip,
        take: limit,
        orderBy: { submitted_at: "desc" },
      }),
      prisma.application.count({ where })
    ])

    return NextResponse.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Fetch applications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
