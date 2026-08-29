import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles } from "@/lib/guards"
import { Role } from "@/lib/status"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const deptIds = auth.role === Role.ADMIN
    ? (await prisma.department.findMany({ select: { id: true } })).map(d => d.id)
    : auth.deptIds

  const applications = await prisma.application.findMany({
    where: { departmentId: { in: deptIds } },
    include: {
      department: { select: { id: true, name: true } },
      assignedRecruiter: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const headers = [
    "ID",
    "Name",
    "Email",
    "Register Number",
    "Phone",
    "Year",
    "Role Applied",
    "Department",
    "Status",
    "Assigned Recruiter",
    "Created At",
    "Technical Skills",
    "Answers",
  ]

  const rows = applications.map(app => [
    app.id,
    app.name,
    app.email,
    app.registerNumber,
    app.phoneNumber || "",
    app.yearOfStudy,
    app.roleAppliedFor,
    app.department.name,
    app.status,
    app.assignedRecruiter?.name || "",
    app.createdAt.toISOString(),
    app.technicalSkills,
    app.answers,
  ])

  const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="applications-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}