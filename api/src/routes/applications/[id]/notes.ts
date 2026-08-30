import { Request, Response } from "express";
import prisma from "../../../lib/db"
import { getSession } from "../../../lib/auth"
import { logAudit } from "../../../lib/audit"
import { z } from "zod"

async function authorize(req: Request, applicationId: bigint) {
  const session = await getSession(req)
  if (!session) return { session: null, error: "Unauthorized" as string }

  if (session.role === "ADMIN") return { session, error: null }

  const application = await prisma.recruitmentApplication.findUnique({ where: { id: applicationId } })
  if (!application) return { session, error: "Application not found" }

  if (session.role === "RECRUITER") {
    if (!session.departments.includes(application.domain as string)) {
      return { session, error: "Forbidden" }
    }
    return { session, error: null }
  }

  if (session.role === "PANEL_MEMBER") {
    const hasAccess = await prisma.recruitmentInterview.findFirst({
      where: {
        application_id: applicationId,
        assigned_members: { some: { user_id: BigInt(session.id) } }
      }
    })
    if (!hasAccess) return { session, error: "Forbidden" }
    return { session, error: null }
  }

  return { session, error: "Forbidden" }
}

export const GET = async (req: Request, res: Response) => {
  try {
    const id = BigInt((req.params as any).id as string)
    const { error } = await authorize(req, id)
    if (error) return res.status(error === "Unauthorized" ? 401 : 403).json({ error })

    const notes = await prisma.recruitmentNote.findMany({
      where: { application_id: id },
      include: { author: { select: { name: true } } },
      orderBy: { created_at: "desc" }
    })

    const items = notes.map((n: any) => ({
      id: n.id,
      content: n.content,
      authorName: (n.author as any)?.name || "Unknown",
      createdAt: n.created_at
    }))

    return res.status(200).json({ notes: items })
  } catch (error) {
    console.error("Fetch notes error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

const noteSchema = z.object({
  content: z.string().min(1).max(5000)
})

export const POST = async (req: Request, res: Response) => {
  try {
    const id = BigInt((req.params as any).id as string)
    const { session, error } = await authorize(req, id)
    if (error) return res.status(error === "Unauthorized" ? 401 : 403).json({ error })
    if (!session) return res.status(401).json({ error: "Unauthorized" })

    const parsed = noteSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Note content is required" })
    }

    const note = await prisma.recruitmentNote.create({
      data: {
        application_id: id,
        author_id: BigInt(session.id),
        content: parsed.data.content
      },
      include: { author: { select: { name: true } } }
    })

    await logAudit(BigInt(session.id), "CREATED_NOTE", "Application", id.toString())

    return res.status(201).json({
      note: {
        id: note.id,
        content: note.content,
        authorName: (note.author as any)?.name || "Unknown",
        createdAt: note.created_at
      }
    })
  } catch (error) {
    console.error("Create note error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
