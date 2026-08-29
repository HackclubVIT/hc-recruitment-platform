import { Request, Response } from "express";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"
import { createNotification } from "../lib/notify"
import { logAudit } from "../lib/audit"
import { z } from "zod"
import { getISTDateBounds } from "../lib/timezone"

const applicationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  department: z.string().min(2),
  registration_number: z.string().min(4),
  resume_url: z.string().url().refine(val => val.startsWith('https://'), { message: "resume_url must use HTTPS protocol" }).optional().or(z.literal('')),
  form_id: z.number().int().positive(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional()
})

// Generate an ID for BigInt PK if not auto-incrementing. 
// Assuming it is generated at DB level or we need to provide one.
// The main HC DB schema for RecruitmentApplication might have BigInt ID, typically autoincrement.
// If it's autoincrement, we don't supply it.

export const POST = async (req: Request, res: Response) => {
  try {
    const body = req.body
    const parsed = applicationSchema.safeParse(body)
    
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid form data", details: parsed.error.format() })
    }

    const data = parsed.data

    const form = await prisma.recruitmentForm.findUnique({ 
      where: { id: data.form_id },
      include: { questions: true }
    })
    
    if (!form || form.status !== "PUBLISHED") {
      return res.status(400).json({ error: "Form is not active or does not exist." })
    }

    const submittedAnswers: Record<string, any> = data.answers || {}
    
    const validQuestionIds = new Set(form.questions.map((q: any) => q.id.toString()))
    for (const key in submittedAnswers) {
      if (!validQuestionIds.has(key)) {
        return res.status(400).json({ error: `Unknown question ID submitted: ${key}` })
      }
    }

    for (const q of form.questions) {
      const answer = submittedAnswers[q.id.toString()]
      
      if (q.required && (answer === undefined || answer === null || answer === "" || (Array.isArray(answer) && answer.length === 0))) {
        return res.status(400).json({ error: `Question '${q.question}' is required.` })
      }

      if (answer !== undefined && answer !== null && answer !== "") {
        if ((q.type === 'RADIO' || q.type === 'DROPDOWN') && q.options.length > 0) {
          if (!q.options.includes(String(answer))) {
            return res.status(400).json({ error: `Invalid option selected for '${q.question}'.` })
          }
        }
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

    const existingApp = await prisma.recruitmentApplication.findFirst({
      where: {
        OR: [
          { email: data.email },
          { registerNumber: data.registration_number }
        ]
      }
    })

    if (existingApp) {
      if (existingApp.email !== data.email || existingApp.registerNumber !== data.registration_number) {
        return res.status(400).json({ error: "Identity mismatch. Please use the exact email and registration number you previously used." })
      }
      return res.status(409).json({ error: "An application already exists for this candidate." })
    }

    // Check if they are an existing HC member
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { registerNumber: data.registration_number }
        ]
      }
    })

    const appId = existingUser ? existingUser.id : BigInt(Date.now());

    const application = await prisma.recruitmentApplication.create({
      data: {
        id: appId,
        recruitmentId: "recruitment-2026",
        name: data.name,
        email: data.email,
        phoneNumber: data.phone,
        domain: data.department,
        registerNumber: data.registration_number,
        portfolio: data.resume_url || null,
        yearOfStudy: "1",
        status: "APPLIED",
        appliedDate: new Date().toISOString(),
        formSubmission: {
          create: {
            form_id: form.id,
            answers: {
              create: form.questions.map((q: any) => ({
                question_id: q.id,
                answer: String(data.answers?.[q.id] || "")
              }))
            }
          }
        }
      },
    })

    // Notify recruiters
    const recruiters = await prisma.recruitmentRoleAssignment.findMany({
      where: {
        role: "RECRUITER",
        active: true
      },
    })

    for (const recruiter of recruiters) {
      if (recruiter.departments.includes(data.department)) {
         await createNotification(
           recruiter.user_id.toString(),
           "New Application Submitted",
           `${application.name} applied for the ${application.domain} department.`
         )
      }
    }

    await logAudit(undefined, "APPLICATION_SUBMITTED", "Application", application.id.toString())

    return res.status(201).json(
      { message: "Application submitted successfully", applicationId: application.id.toString() })
  } catch (error: any) {
    console.error("Application submission error:", error)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "An application already exists." })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const searchParams = new URLSearchParams(req.query as any)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10))
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const department = searchParams.get("department") || ""
    
    // We don't have date filtering here easily because appliedDate is a string in HC DB schema
    
    const skip = (page - 1) * limit

    const where: any = { recruitmentId: "recruitment-2026" }

    if (department) {
      if (session.role === "RECRUITER") {
        if (session.departments.includes(department)) {
          where.domain = department
        } else {
          return res.status(403).json({ error: "Forbidden: Department not assigned" })
        }
      } else if (session.role === "ADMIN") {
        where.domain = department
      }
    } else if (session.role === "RECRUITER") {
      where.domain = { in: session.departments }
    } else if (session.role === "PANEL_MEMBER") {
      where.interviews = {
        some: {
          assigned_members: {
            some: { user_id: BigInt(session.id) }
          }
        }
      }
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" }
    }

    if (status) {
      where.status = status
    }

    const [applications, total] = await Promise.all([
      prisma.recruitmentApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.recruitmentApplication.count({ where })
    ])
    
    // map to frontend structure
    const items = applications.map(app => ({
        id: app.id.toString(),
        candidate_id: app.id.toString(),
        form_id: 1,
        status: app.status,
        submitted_at: app.appliedDate || new Date().toISOString(),
        candidate: {
            id: app.id.toString(),
            name: app.name,
            email: app.email,
            department: app.domain,
            registration_number: app.registerNumber
        }
    }))

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
