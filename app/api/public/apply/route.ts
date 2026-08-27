import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const applicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  registerNumber: z.string().min(1, "Register number is required"),
  phoneNumber: z.string().optional().nullable(),
  yearOfStudy: z.string().min(1, "Year of study is required"),
  roleAppliedFor: z.string().min(1, "Role/Department is required"),
  firstPreference: z.string().optional(),
  secondPreference: z.string().optional(),
  firstPrefReason: z.string().optional(),
  secondPrefReason: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  projectDetails: z.string().optional(),
  skillToLearn: z.string().optional(),
  whyHackclub: z.string().optional(),
  productiveWebsiteQuestions: z.string().optional(),
  departmentId: z.number().int().positive("Invalid department"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = applicationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existing = await prisma.application.findFirst({
      where: {
        OR: [{ email: data.email }, { registerNumber: data.registerNumber }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An application with this email or register number already exists" },
        { status: 409 }
      );
    }

    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Invalid department selected" },
        { status: 400 }
      );
    }

    const answers = {
      firstPreference: data.firstPreference,
      secondPreference: data.secondPreference,
      firstPrefReason: data.firstPrefReason,
      secondPrefReason: data.secondPrefReason,
      github: data.github,
      linkedin: data.linkedin,
      projectDetails: data.projectDetails,
      skillToLearn: data.skillToLearn,
      whyHackclub: data.whyHackclub,
      productiveWebsiteQuestions: data.productiveWebsiteQuestions,
    };

    const application = await prisma.application.create({
      data: {
        departmentId: data.departmentId,
        name: data.name,
        email: data.email,
        registerNumber: data.registerNumber.toUpperCase(),
        phoneNumber: data.phoneNumber,
        yearOfStudy: data.yearOfStudy,
        roleAppliedFor: data.roleAppliedFor,
        answers: JSON.stringify(answers),
        status: "APPLIED",
      },
      include: { department: true },
    });

    await prisma.statusHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: null,
        toStatus: "APPLIED",
        changedByUserId: application.id, // Will be updated if we have a system user
        reason: "Application submitted by candidate",
      },
    });

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        name: application.name,
        email: application.email,
        department: application.department.name,
        roleAppliedFor: application.roleAppliedFor,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("Application submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return NextResponse.json(
      { error: "Failed to load departments" },
      { status: 500 }
    );
  }
}