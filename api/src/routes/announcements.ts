import { Request, Response } from "express";
import prisma from "../lib/db";
import { getSession } from "../lib/auth";
import { sendEmail } from "../lib/email";

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // If candidate (role NONE)
    if (session.role === "NONE") {
      const candidateEmail = session.email?.trim();
      const app = await prisma.recruitmentApplication.findFirst({
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
        select: { domain: true, status: true }
      });

      if (!app) {
        return res.status(200).json({ announcements: [] });
      }

      const announcements: any[] = await prisma.$queryRawUnsafe(`
        SELECT id, department, target_status, title, message, created_by, created_at
        FROM recruitment_announcements
        WHERE (LOWER(department) = LOWER($1) OR department = 'ALL')
          AND (target_status = 'ALL' OR target_status = $2 OR ($2 IN ('SHORTLISTED', 'FURTHER_ROUND', 'INTERVIEW_SCHEDULED') AND target_status = 'SHORTLISTED'))
        ORDER BY created_at DESC
      `, app.domain || "", app.status || "APPLIED");

      return res.status(200).json({ announcements });
    }

    // Admin or Recruiter
    let query = `
      SELECT id, department, target_status, title, message, created_by, created_at
      FROM recruitment_announcements
    `;
    const params: any[] = [];

    if (session.role === "RECRUITER" && !session.departments.includes("*")) {
      const depts = session.departments || [];
      if (depts.length > 0) {
        query += ` WHERE department = ANY($1::text[]) OR department = 'ALL'`;
        params.push(depts);
      }
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const announcements: any[] = await prisma.$queryRawUnsafe(query, ...params);
    return res.status(200).json({ announcements });
  } catch (error) {
    console.error("Fetch announcements error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== "ADMIN" && session.role !== "RECRUITER")) {
      return res.status(403).json({ error: "Forbidden: Only Admin or Recruiter can broadcast messages" });
    }

    const { department, target_status = "SHORTLISTED", title, message } = req.body;

    if (!department || !title?.trim() || !message?.trim()) {
      return res.status(400).json({ error: "Department, title, and message are required" });
    }

    // Validate recruiter department permissions
    if (session.role === "RECRUITER") {
      const allowedDepts = session.departments || [];
      const hasWildcard = allowedDepts.includes("*");
      const hasDept = allowedDepts.some((d: string) => d.toLowerCase() === department.toLowerCase());
      if (!hasWildcard && !hasDept) {
        return res.status(403).json({ error: "Forbidden: You cannot broadcast to unassigned departments" });
      }
    }

    // Insert announcement record into database
    const createdList: any[] = await prisma.$queryRawUnsafe(`
      INSERT INTO recruitment_announcements (department, target_status, title, message, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, department, target_status, title, message, created_by, created_at
    `, department, target_status, title.trim(), message.trim(), session.email || session.id);

    const newAnnouncement = createdList[0];

    // Find all matching candidates to email and notify
    function buildDepartmentCondition(deptName: string) {
      const allVariants = new Set<string>();
      allVariants.add(deptName);
      if (deptName.toLowerCase().includes("research")) {
        allVariants.add("Research and Development");
        allVariants.add("Research & Development");
        allVariants.add("R&D");
      }
      if (deptName.toLowerCase().includes("design")) {
        allVariants.add("Design & Social Media");
        allVariants.add("Design and Social Media");
        allVariants.add("Design");
      }
      if (deptName.toLowerCase().includes("technical")) {
        allVariants.add("Technical");
        allVariants.add("Web Development");
      }
      return {
        OR: Array.from(allVariants).map(v => ({ domain: { equals: v, mode: "insensitive" as const } }))
      };
    }

    const andConditions: any[] = [
      { recruitmentId: "recruitment-2026" }
    ];

    if (department !== "ALL") {
      andConditions.push(buildDepartmentCondition(department));
    }

    if (target_status === "SHORTLISTED") {
      andConditions.push({
        status: { in: ["SHORTLISTED", "FURTHER_ROUND", "INTERVIEW_SCHEDULED"] }
      });
    } else if (target_status !== "ALL") {
      andConditions.push({ status: target_status });
    }

    const candidates = await prisma.recruitmentApplication.findMany({
      where: { AND: andConditions },
      select: { id: true, name: true, email: true, domain: true, registerNumber: true }
    });

    // Send emails and create notifications asynchronously
    for (const candidate of candidates) {
      if (candidate.email) {
        sendEmail({
          to: candidate.email,
          subject: `HackClub VIT [${department}] - ${title}`,
          html: `
            <h2>📢 Update from HackClub VIT – ${department} Department</h2>
            <p>Hi ${candidate.name},</p>
            <div style="background-color: #1a0606; padding: 18px; border-left: 4px solid #d07d22; border-radius: 6px; margin: 16px 0; color: #f4ede4;">
              <h3 style="color: #d07d22; margin-top: 0; font-size: 18px;">${title}</h3>
              <div style="font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${message}</div>
            </div>
            <p>You can also log in to your <a href="${process.env.APP_URL || 'https://recruitment.hackclubvit.co'}/recruitie/dashboard" style="color: #d07d22; font-weight: bold;">Recruitment Portal Dashboard</a> to view this task and your application status.</p>
            <br/>
            <p>Best regards,<br/><strong>HackClub VIT Recruitment Team</strong></p>
          `,
          eventType: "DEPARTMENT_ANNOUNCEMENT",
          entityId: newAnnouncement.id.toString()
        }).catch(console.error);

        // Also create an in-app notification if candidate has a user account
        prisma.user.findFirst({
          where: { email: { equals: candidate.email, mode: "insensitive" } }
        }).then(user => {
          if (user) {
            prisma.recruitmentNotification.create({
              data: {
                user_id: user.id,
                title: `[${department}] ${title}`,
                message: message.slice(0, 500)
              }
            }).catch(console.error);
          }
        }).catch(console.error);
      }
    }

    return res.status(201).json({
      success: true,
      count: candidates.length,
      announcement: newAnnouncement
    });
  } catch (error) {
    console.error("Create announcement error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
