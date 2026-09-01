import { Request, Response } from "express";
import prisma from "../../lib/db";
import { getSession } from "../../lib/auth";
import { logAudit } from "../../lib/audit";
import { encryptPassword } from "../../lib/encryption";
import { z } from "zod";

const emailSettingsSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  secure: z.boolean(),
  user: z.string().email(),
  pass: z.string().optional(),
  fromEmail: z.string().email(),
  fromName: z.string().min(1)
});

export const GET = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const setting = await prisma.collection.findUnique({
      where: { name: "smtp_settings" }
    });

    if (setting && setting.data) {
      const data = setting.data as Record<string, any>;
      // DO NOT return the actual password
      data.pass = data.pass ? "********" : "";
      return res.status(200).json(data);
    }

    return res.status(200).json(null);
  } catch (error) {
    console.error("Failed to fetch email settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const POST = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const parsed = emailSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload data", details: parsed.error.format() });
    }

    const newSettings = parsed.data;

    const existing = await prisma.collection.findUnique({
      where: { name: "smtp_settings" }
    });

    let finalPass = newSettings.pass;
    
    if (!finalPass || finalPass === "********") {
       if (existing && existing.data) {
         finalPass = (existing.data as Record<string, any>).pass;
       }
    } else {
       // Only encrypt if it's a freshly provided password from the user
       finalPass = encryptPassword(finalPass);
    }

    const updatedData = {
      host: newSettings.host,
      port: newSettings.port,
      secure: newSettings.secure,
      user: newSettings.user,
      pass: finalPass,
      fromEmail: newSettings.fromEmail,
      fromName: newSettings.fromName
    };

    await prisma.collection.upsert({
      where: { name: "smtp_settings" },
      update: { data: updatedData },
      create: { name: "smtp_settings", data: updatedData }
    });

    await logAudit(session.id, "UPDATED_SMTP_SETTINGS", "Settings", "smtp_settings");

    // Mask password in response
    updatedData.pass = updatedData.pass ? "********" : "";
    
    return res.status(200).json({ message: "Settings saved successfully", settings: updatedData });
  } catch (error) {
    console.error("Failed to update email settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
