import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"
import { logAudit } from "../../lib/audit"
import { z } from "zod"

const VALID_STATUSES = [
  "APPLIED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED",
  "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED",
  "SELECTED", "WAITLISTED", "FURTHER_ROUND"
]

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(VALID_STATUSES as [string, ...string[]])
})

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || (session.role !== "ADMIN" && session.role !== "RECRUITER")) {
      return res.status(403).json({ error: "Forbidden" })
    }

    const parsed = bulkSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid bulk update payload", details: parsed.error.format() })
    }

    const { ids, status } = parsed.data
    const results: { id: string; success: boolean; error?: string }[] = []

    for (const idStr of ids) {
      try {
        const id = BigInt(idStr)
        const existing = await prisma.recruitmentApplication.findUnique({ where: { id } })
        if (!existing) {
          results.push({ id: idStr, success: false, error: "Application not found" })
          continue
        }

        if (session.role === "RECRUITER" && !session.departments.includes(existing.domain as string)) {
          results.push({ id: idStr, success: false, error: "Forbidden: department not assigned" })
          continue
        }

        await prisma.recruitmentApplication.update({
          where: { id },
          data: { status }
        })

        await logAudit(BigInt(session.id), `BULK_UPDATED_APPLICATION_STATUS_TO_${status}`, "Application", id.toString())
        results.push({ id: idStr, success: true })
      } catch (err) {
        results.push({ id: idStr, success: false, error: "Update failed" })
      }
    }

    const failed = results.filter(r => !r.success)
    return res.status(failed.length === 0 ? 200 : 207).json({
      message: `Updated ${results.length - failed.length} of ${results.length} applications`,
      results
    })
  } catch (error: unknown) {
    console.error("Bulk update error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
