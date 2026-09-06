import { Request, Response } from "express";
import prisma from "../../lib/db"
import { getSession } from "../../lib/auth"

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session || session.role === "NONE") return res.status(401).json({ error: "Unauthorized" })
    
    const resolvedParams = req.params
    const id = BigInt(resolvedParams.id as string)

    let includeClause: any = {
      interviews: {
        include: { panel: true, feedback: true }
      },
      formSubmission: {
        include: { answers: true }
      }
    }

    if (session.role === "PANEL_MEMBER") {
      includeClause = {
        interviews: {
          where: {
            assigned_members: { some: { user_id: session.id } }
          },
          include: { feedback: true } // Removed panel include to restrict unnecessary data
        }
      }
    }

    const application = await prisma.recruitmentApplication.findUnique({
      where: { id },
      include: includeClause
    })

    if (!application) return res.status(404).json({ error: "Not found" })

    // Access control: Recruiter can view if 1st pref, 2nd pref, or domain matches their departments
    if (session.role === "RECRUITER" && !session.departments.includes("*")) {
      const allowedDepts = new Set(session.departments.map(d => d.toLowerCase()));
      const matches = [application.domain, application.firstPreference, application.secondPreference]
        .filter(Boolean)
        .some(d => {
          const str = (d as string).toLowerCase();
          return allowedDepts.has(str) || 
                 (str.includes("research") && Array.from(allowedDepts).some(ad => ad.includes("research"))) ||
                 (str.includes("design") && Array.from(allowedDepts).some(ad => ad.includes("design"))) ||
                 (str.includes("technical") && Array.from(allowedDepts).some(ad => ad.includes("technical")));
        });

      if (!matches) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    // Access control: Panel Member
    if (session.role === "PANEL_MEMBER" && (application as any).interviews.length === 0) {
      return res.status(403).json({ error: "Forbidden" })
    }

    const serializedApplication = {
      ...application,
      id: application.id.toString(),
      decided_by: application.decided_by?.toString() || null,
      interviews: (application as any).interviews?.map((i: any) => ({
        ...i,
        id: typeof i.id === 'bigint' ? i.id.toString() : i.id,
        application_id: i.application_id?.toString() || null,
        recruiter_id: i.recruiter_id?.toString() || null,
        panel_id: typeof i.panel_id === 'bigint' ? i.panel_id.toString() : i.panel_id,
        feedback: i.feedback?.map((f: any) => ({
          ...f,
          id: typeof f.id === 'bigint' ? f.id.toString() : f.id,
          interview_id: f.interview_id?.toString() || null,
          user_id: f.user_id?.toString() || null,
        })) || [],
      })) || [],
      formSubmission: (application as any).formSubmission ? {
        ...(application as any).formSubmission,
        id: typeof (application as any).formSubmission.id === 'bigint' ? (application as any).formSubmission.id.toString() : (application as any).formSubmission.id,
        application_id: (application as any).formSubmission.application_id?.toString() || null,
        answers: (application as any).formSubmission.answers?.map((a: any) => ({
          ...a,
          id: typeof a.id === 'bigint' ? a.id.toString() : a.id,
          submission_id: a.submission_id?.toString() || null,
        })) || [],
      } : null,
    };

    return res.status(200).json({ candidate: serializedApplication })
  } catch (error) {
    console.error("Fetch candidate error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
