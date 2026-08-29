import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles, requireApplicationAccess } from "@/lib/guards"
import { Role } from "@/lib/status"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.LEAD, Role.ADMIN, Role.RECRUITER)(auth)
  if (roleCheck) return roleCheck

  const { id } = await params
  const applicationId = parseInt(id, 10)

  const accessCheck = await requireApplicationAccess(auth, applicationId)
  if (accessCheck) return accessCheck

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      department: true,
      assignedRecruiter: { select: { id: true, name: true, email: true } },
      notes: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      history: {
        include: { changedBy: { select: { id: true, name: true, email: true } } },
        orderBy: { changedAt: "desc" },
      },
      interviews: {
        include: {
          panelists: { include: { panelist: { select: { id: true, name: true, email: true } } } },
          feedbacks: { include: { panelist: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { startTime: "desc" },
      },
    },
  })

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  return NextResponse.json({ application })
}