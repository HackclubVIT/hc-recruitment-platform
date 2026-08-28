import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"
import { createNotification } from "../lib/notify"
import { logAudit } from "../lib/audit"
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

export const POST = async (req: Request, res: Response) => {
  try {
    const body = req.body
    const parsed = applicationSchema.safeParse(body)
    
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid form data", details: parsed.error.format() })
    }

    const data = parsed.data

    // Check if form is published and load questions
    const form = await prisma.form.findUnique({ 
      where: { id: data.form_id },
      include: { questions: true }
    })
    
    if (!form || form.status !== "PUBLISHED") {
      return res.status(400).json({ error: "Form is not active or does not exist." })
    }

    // Dynamic Answer Validation
    const submittedAnswers: Record<string, any> = data.answers || {}
    for (const q of form.questions) {
      const answer = submittedAnswers[q.id.toString()]
      
      // 1. Required check
      if (q.required && (answer === undefined || answer === null || answer === "" || (Array.isArray(answer) && answer.length === 0))) {
        return res.status(400).json({ error: `Question '${q.question}' is required.` })
      }

      if (answer) {
        // 2. Options validation for RADIO and DROPDOWN
        if ((q.type === 'RADIO' || q.type === 'DROPDOWN') && q.options.length > 0) {
          if (!q.options.includes(String(answer))) {
            return res.status(400).json({ error: `Invalid option selected for '${q.question}'.` })
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
              return res.status(400).json({ error: `Invalid option '${s}' selected for '${q.question}'.` })
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

    return res.status(201).json(
      { message: "Application submitted successfully", applicationId: application.id })
  } catch (error: any) {
    console.error("Application submission error:", error)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Candidate with this Registration number or email already exists." })
    }
    return res.status(500).json(
      { error: "Internal server error" })
  }
}

export const GET = async (req: Request, res: Response) => {
  try {
        const session = await getSession(req)
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const searchParams = new URLSearchParams(req.query as any)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const department = searchParams.get("department") || ""
    const date = searchParams.get("date") || ""

    const skip = (page - 1) * limit

    const where: any = {}

        // Build candidate filter object
    const candidateFilter: any = {}

    if (department) {
      if (session.role === "RECRUITER") {
        if (session.departments.includes(department)) {
          candidateFilter.department = department
        } else {
          return res.status(403).json({ error: "Forbidden: Department not assigned" })
        }
      } else if (session.role === "ADMIN") {
        candidateFilter.department = department
      }
    } else if (session.role === "RECRUITER") {
      candidateFilter.department = { in: session.departments }
    } else if (session.role === "PANEL_MEMBER") {
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

    // Only set where.candidate if we have filters
    if (Object.keys(candidateFilter).length > 0) {
      where.candidate = candidateFilter
    }

    if (status) {
      where.status = status
    }

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

    return res.status(200).json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Fetch applications error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
