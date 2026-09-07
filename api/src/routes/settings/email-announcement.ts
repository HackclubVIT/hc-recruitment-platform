import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../lib/db";
import { getSession } from "../../lib/auth";
import { sendEmail } from "../../lib/email";

const announcementSchema = z.object({
  subject: z.string().min(1),
  html: z.string().min(1),
  preview: z.boolean().optional(),
  recipients: z.object({
    specificUsers: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    customEmails: z.array(z.string().email()).optional()
  })
});

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "ADMIN") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = announcementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.format() });
    }

    const { subject, html, preview, recipients } = parsed.data;
    const { specificUsers = [], departments = [], roles = [], customEmails = [] } = recipients;

    const emailsToNotify = new Set<string>();

    // 1. Specific Users
    if (specificUsers.length > 0) {
      const specificUserIds = specificUsers
        .map(id => {
          try { return BigInt(id); } catch { return null; }
        })
        .filter((id): id is bigint => id !== null);

      if (specificUserIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: specificUserIds } },
          select: { email: true }
        });
        users.forEach(u => { if (u.email) emailsToNotify.add(u.email); });
      }
    }

    // 2. Roles and Departments
    let effectiveRoles = roles;
    if (roles.length === 0 && departments.length > 0) {
      // Direct Department Targeting: include candidates and recruiters
      effectiveRoles = ["CANDIDATE", "RECRUITER"];
    }

    if (effectiveRoles.includes("RECRUITER")) {
      const whereClause: any = { role: "RECRUITER", active: true };
      if (departments.length > 0) {
        whereClause.departments = { hasSome: departments };
      }
      const recruiters = await prisma.recruitmentRoleAssignment.findMany({
        where: whereClause,
        include: { user: { select: { email: true } } }
      });
      recruiters.forEach(r => { if (r.user?.email) emailsToNotify.add(r.user.email); });
    }

    if (effectiveRoles.includes("PANEL_MEMBER")) {
      // Panel members don't have explicit departments in their model, so we just get all active panel members
      const panelMembers = await prisma.recruitmentPanelMember.findMany({
        where: { active: true },
        include: { user: { select: { email: true } } }
      });
      panelMembers.forEach(pm => { if (pm.user?.email) emailsToNotify.add(pm.user.email); });
    }

    if (effectiveRoles.includes("CANDIDATE")) {
      const whereClause: any = {};
      if (departments.length > 0) {
        whereClause.domain = { in: departments };
      }
      const candidates = await prisma.recruitmentApplication.findMany({
        where: whereClause,
        select: { email: true }
      });
      candidates.forEach(c => { if (c.email) emailsToNotify.add(c.email); });
    }

    // 3. Custom Emails
    if (customEmails.length > 0) {
      customEmails.forEach(email => emailsToNotify.add(email));
    }

    // Final Deduplication and cleanup
    const finalRecipients = Array.from(emailsToNotify).filter(email => email && email.trim() !== "");

    if (preview) {
      return res.status(200).json({ count: finalRecipients.length });
    }

    if (finalRecipients.length === 0) {
      return res.status(400).json({ error: "No valid recipients found based on the provided criteria." });
    }

    const result = await sendEmail({
      to: finalRecipients,
      subject,
      html,
      eventType: "CUSTOM_ANNOUNCEMENT"
    });

    if (result && !result.success) {
      return res.status(500).json({ error: "Email delivery failed", details: result.error });
    }

    return res.status(200).json({ message: "Announcement sent successfully", count: finalRecipients.length });
  } catch (error) {
    console.error("Email announcement error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
