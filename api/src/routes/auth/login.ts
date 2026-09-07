import { Request, Response } from "express";
import bcrypt from "bcryptjs"
import prisma from "../../lib/db"
import { signToken } from "../../lib/auth"

export const POST = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // --- TEMPORARY DEV AUTH BYPASS ---
    if (process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true") {
      const devAccounts: Record<string, { password: string; role: "ADMIN" | "RECRUITER" | "PANEL_MEMBER" | "NONE" }> = {
        "admin.test@hackclubvit.local": { password: "AdminTest123!", role: "ADMIN" },
        "recruiter.test@hackclubvit.local": { password: "RecruiterTest123!", role: "RECRUITER" },
        "panel.test@hackclubvit.local": { password: "PanelTest123!", role: "PANEL_MEMBER" },
        "applicant.test@hackclubvit.local": { password: "ApplicantTest123!", role: "NONE" }
      };

      const devUser = devAccounts[email];
      if (devUser && devUser.password === password) {
        const token = await signToken({
          id: "dev-mock-id-" + devUser.role.toLowerCase(),
          email: email,
          role: devUser.role,
          departments: ["Projects", "Operations", "Technical", "Finance", "Research and Development", "Design & Social Media", "*"],
        });

        res.cookie("session", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });

        return res.status(200).json({
          message: "Dev login successful",
          token,
          user: { id: "dev-mock-id", email, role: devUser.role }
        });
      } else if (devUser) {
        return res.status(401).json({ error: "Invalid dev credentials" });
      }
    }
    // --- END DEV AUTH BYPASS ---


    if (!email || !password) {
      return res.status(400).json(
        { error: "Email and password are required" })
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    let user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
      include: { recruitmentRole: true }
    });

    const emailPrefix = cleanEmail.split('@')[0];
    const expectedPasswordLower = `hackclub@${emailPrefix}`;

    if (!user) {
      // Check if this is a candidate from recruitmentApplication
      const app = await prisma.recruitmentApplication.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } }
      });
      const expectedRegPasswordLower = app?.registerNumber ? `hackclub@${app.registerNumber.toLowerCase()}` : null;
      if (app && (
        cleanPassword.toLowerCase() === expectedPasswordLower || 
        (expectedRegPasswordLower && cleanPassword.toLowerCase() === expectedRegPasswordLower) ||
        cleanPassword.toLowerCase() === "hackclub@2026"
      )) {
        const hashedPassword = await bcrypt.hash(cleanPassword, 10);
        user = await prisma.user.create({
          data: {
            id: BigInt(Date.now()),
            name: app.name,
            email: app.email,
            password: hashedPassword,
            registerNumber: app.registerNumber,
            phoneNumber: app.phoneNumber,
            role: "Member",
            status: "Active",
            recruitmentRole: {
              create: {
                role: "NONE",
                active: true,
                departments: []
              }
            }
          },
          include: { recruitmentRole: true }
        });
      } else {
        return res.status(401).json(
          { error: "Invalid credentials" });
      }
    }

    if (user.status !== "Active") {
      return res.status(403).json(
        { error: "Account is inactive" })
    }

    const expectedRegPasswordLower = user.registerNumber ? `hackclub@${user.registerNumber.toLowerCase()}` : null;

    if (!user.password) {
      if (
        cleanPassword.toLowerCase() === expectedPasswordLower || 
        (expectedRegPasswordLower && cleanPassword.toLowerCase() === expectedRegPasswordLower) ||
        cleanPassword.toLowerCase() === "hackclub@2026"
      ) {
        const hashedPassword = await bcrypt.hash(cleanPassword, 10);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword, status: "Active" },
          include: { recruitmentRole: true }
        });
      } else {
        return res.status(401).json(
          { error: "Invalid credentials" });
      }
    }

    let isPasswordValid = false;
    if (user.password) {
      if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
        isPasswordValid = await bcrypt.compare(cleanPassword, user.password);
        if (!isPasswordValid) {
          // Also check lowercased password in case user typed capital letters like hackclub@Ivan...
          isPasswordValid = await bcrypt.compare(cleanPassword.toLowerCase(), user.password);
        }
      } else {
        // Plain text password stored in database (e.g. Hackclub@2026)
        if (cleanPassword === user.password || cleanPassword.toLowerCase() === user.password.toLowerCase()) {
          isPasswordValid = true;
          // Automatically upgrade plain text password to bcrypt hash for future security
          try {
            const hashedPassword = await bcrypt.hash(cleanPassword, 10);
            await prisma.user.update({
              where: { id: user.id },
              data: { password: hashedPassword }
            });
          } catch (e) {
            console.error("Failed to upgrade plain password to bcrypt hash:", e);
          }
        }
      }
    }

    // Allow default hackclub@<prefix> or hackclub@<regNo> or Hackclub@2026 if password matches pattern
    if (!isPasswordValid && (
      cleanPassword.toLowerCase() === expectedPasswordLower || 
      (expectedRegPasswordLower && cleanPassword.toLowerCase() === expectedRegPasswordLower) ||
      cleanPassword.toLowerCase() === "hackclub@2026"
    )) {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      return res.status(401).json(
        { error: "Invalid credentials" })
    }

    const active = user.recruitmentRole?.active ?? true
    if (!active) {
      return res.status(403).json(
        { error: "Recruitment access is inactive" })
    }

    const recruitmentRole = user.recruitmentRole?.role || "NONE"
    const departments = user.recruitmentRole?.departments || []

    // Generate JWT
    const token = await signToken({
      id: user.id.toString(),
      email: user.email!,
      role: recruitmentRole,
      departments: departments,
    })

    // Create response and set cookie
    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      path: "/",
    })

    return res.status(200).json(
      { 
        message: "Logged in successfully",
        token,
        user: { id: user.id.toString(), email: user.email, role: recruitmentRole }
      }
    )
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json(
      { error: error?.message || "Internal server error" });
  }
}
