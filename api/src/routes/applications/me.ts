import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    let hcUser = null;
    try {
      hcUser = await prisma.user.findUnique({ where: { id: BigInt(session.id) } });
    } catch {
      // not a bigint
    }

    if (!hcUser && session.email) {
      hcUser = await prisma.user.findUnique({ where: { email: session.email } });
    }

    const candidateEmail = (hcUser?.email || session.email)?.trim();
    if (!candidateEmail) {
      return res.status(401).json({ error: "Unauthorized: Candidate email not found" });
    }

    const application = await prisma.recruitmentApplication.findFirst({
      where: {
        email: {
          equals: candidateEmail,
          mode: "insensitive"
        },
        recruitmentId: "recruitment-2026"
      },
      orderBy: {
        id: "desc"
      },
      include: {
        interviews: true,
        formSubmission: {
          include: {
            answers: {
              include: {
                question: true
              }
            }
          }
        }
      }
    })

    if (!application) {
      return res.status(404).json({ error: "Application not found" })
    }

    let announcements: any[] = [];
    try {
      announcements = await prisma.$queryRawUnsafe(`
        SELECT id, department, target_status, title, message, created_by, created_at
        FROM recruitment_announcements
        WHERE (LOWER(department) = LOWER($1) OR department = 'ALL')
          AND (target_status = 'ALL' OR target_status = $2 OR ($2 IN ('SHORTLISTED', 'FURTHER_ROUND', 'INTERVIEW_SCHEDULED') AND target_status = 'SHORTLISTED'))
        ORDER BY created_at DESC
      `, application.domain || "", application.status || "APPLIED");
    } catch (e) {
      console.error("Failed to query announcements in applications/me:", e);
    }

    // Convert BigInt id to string
    return res.status(200).json({
      application: {
        ...application,
        id: application.id.toString(),
        decided_by: application.decided_by?.toString() || null,
        interviews: application.interviews ? application.interviews.map((i: any) => ({
          ...i,
          application_id: i.application_id.toString(),
          recruiter_id: i.recruiter_id?.toString() || null,
        })) : []
      },
      announcements
    })

  } catch (error) {
    console.error("Fetch application me error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
