import { Request, Response } from "express";
import prisma from "../../lib/db";
import { getSession } from "../../lib/auth";
import { logAudit } from "../../lib/audit";
import { decryptPassword } from "../../lib/encryption";
import { z } from "zod";
import nodemailer from "nodemailer";

const emailTestSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  secure: z.boolean(),
  user: z.string().email(),
  pass: z.string().optional(),
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
  testRecipient: z.string().email()
});

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const parsed = emailTestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload data", details: parsed.error.format() });
    }

    const data = parsed.data;
    let finalPass = data.pass;
    
    if (!finalPass || finalPass === "********") {
      const existing = await prisma.collection.findUnique({
        where: { name: "smtp_settings" }
      });
      if (existing && existing.data) {
        finalPass = decryptPassword((existing.data as Record<string, any>).pass);
      }
    }

    if (!finalPass) {
       return res.status(400).json({ error: "Password is required to test email delivery" });
    }

    const transporter = nodemailer.createTransport({
      host: data.host,
      port: data.port,
      secure: data.secure,
      auth: {
        user: data.user,
        pass: finalPass
      }
    });

    // 1. Verify connection
    try {
      await transporter.verify();
    } catch (verifyError: any) {
      console.error("[SMTP TEST VERIFY ERROR]:", verifyError);
      return res.status(400).json({ 
        error: "Failed to connect to SMTP server. Please check host, port, secure settings, and credentials.", 
        details: "Unable to connect to the configured SMTP server." 
      });
    }

    // 2. Send test email
    const fromAddress = `"${data.fromName}" <${data.fromEmail}>`;
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: data.testRecipient,
        subject: "HackClub VIT Recruitment - Test Email",
        html: `<h2>SMTP Test Successful</h2><p>If you are receiving this email, your SMTP configuration is correct.</p>`
      });
      
      await logAudit(session.id, "TEST_SMTP_EMAIL", "Settings", data.testRecipient);
      
      return res.status(200).json({ message: "Test email sent successfully!" });
    } catch (sendError: any) {
      console.error("[SMTP TEST SEND ERROR]:", sendError);
      return res.status(400).json({ 
        error: "SMTP connection succeeded, but failed to send the email.", 
        details: "Test email could not be sent. Check the SMTP configuration." 
      });
    }

  } catch (error) {
    console.error("Failed to test email settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
