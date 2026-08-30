import { Request, Response } from "express";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "../lib/db"
import { getSession } from "../lib/auth"
import { createNotification } from "../lib/notify"
import { logAudit } from "../lib/audit"
import { sendEmail, templates } from "../lib/email"
import { z } from "zod"
import { getISTDateBounds } from "../lib/timezone"

const applicationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  department: z.string().min(2),
  registration_number: z.string().min(4),
  yearOfStudy: z.string().optional(),
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

    const submittedAnswers: Record<string, unknown> = data.answers || {}
    
    const validQuestionIds = new Set(form.questions.map((q: { id: number }) => q.id.toString()))
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

    // Check if they are an existing HC member with EXACT matching identity
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        registerNumber: data.registration_number
      }
    })

    if (!existingUser) {
      return res.status(403).json({ error: "Identity mismatch or user not found. Ensure your email and registration number exactly match your Hack Club account." })
    }

      const application = await prisma.$transaction(async (tx) => {
        const existingApp = await tx.recruitmentApplication.findFirst({
          where: {
            recruitmentId: "recruitment-2026",
            OR: [
              { email: existingUser.email || data.email },
              { registerNumber: existingUser.registerNumber || data.registration_number }
            ]
          }
        })
        
        if (existingApp) {
          throw new Error("DUPLICATE_APPLICATION")
        }

        const newAppId = crypto.randomBytes(8).readBigUInt64LE() & 0x7FFFFFFFFFFFFFFFn;

        return await tx.recruitmentApplication.create({
          data: {
            id: newAppId,
            recruitmentId: "recruitment-2026",
            name: existingUser.name,
            email: existingUser.email || data.email,
            phoneNumber: existingUser.phoneNumber || data.phone,
            domain: existingUser.department || data.department,
            registerNumber: existingUser.registerNumber || data.registration_number,
            portfolio: data.resume_url || null,
            yearOfStudy: data.yearOfStudy || (() => {
              const regMatch = (existingUser.registerNumber || data.registration_number).match(/^(\d{2})/);
              if (regMatch) {
                const startYear = 2000 + parseInt(regMatch[1], 10);
                const currentYear = new Date().getFullYear();
                const studyYear = currentYear - startYear;
                return studyYear > 0 && studyYear <= 5 ? studyYear.toString() : "";
              }
              return "";
            })(),
            status: "APPLIED",
            appliedDate: new Date().toISOString(),
            formSubmission: {
              create: {
                form_id: form.id,
                answers: {
                  create: form.questions.map((q: { id: number }) => ({
                    question_id: q.id,
                    answer: String(data.answers?.[q.id] || "")
                  }))
                }
              }
            }
          },
        })
      })

    // Notify recruiters
    const recruiters = await prisma.recruitmentRoleAssignment.findMany({
      where: {
        role: "RECRUITER",
        active: true
      },
    })

    const notificationsToCreate = []
    for (const recruiter of recruiters) {
      if (application.domain && recruiter.departments.includes(application.domain)) {
         notificationsToCreate.push({
           user_id: recruiter.user_id,
           title: "New Application Submitted",
           message: `${application.name} applied for the ${application.domain} department.`,
           read: false
         })
      }
    }
    
    if (notificationsToCreate.length > 0) {
      await prisma.recruitmentNotification.createMany({
        data: notificationsToCreate
      })
    }


    await logAudit(undefined, "APPLICATION_SUBMITTED", "Application", application.id.toString())

    return res.status(201).json(
      { message: "Application submitted successfully", applicationId: application.id.toString() })
  } catch (error: unknown) {
    console.error("Application submission error:", error)
    if (error instanceof Error && error.message === "DUPLICATE_APPLICATION") {
      return res.status(409).json({ error: "An application already exists for this candidate." })
    }
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2002') {
      return res.status(409).json({ error: "An application already exists." })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role === "NONE") {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const searchParams = new URLSearchParams(req.query as Record<string, string>)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10))
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const department = searchParams.get("department") || ""
    
    // We don't have date filtering here easily because appliedDate is a string in HC DB schema
    
    const skip = (page - 1) * limit

    const where: Prisma.RecruitmentApplicationWhereInput = { recruitmentId: "recruitment-2026" }

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
            some: { user_id: session.id }
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
    
    // return direct application structure
    const items = applications.map(app => ({
      ...app,
      id: app.id.toString(),
      decided_by: app.decided_by?.toString() || null
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
