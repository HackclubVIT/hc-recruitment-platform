import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles, requireApplicationAccess } from "@/lib/guards"
import { Role } from "@/lib/status"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.RECRUITER, Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const { id } = await params
  const applicationId = parseInt(id, 10)

  const accessCheck = await requireApplicationAccess(auth, applicationId)
  if (accessCheck) return accessCheck

  const { body } = await request.json()

  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "Note body is required" }, { status: 400 })
  }

  const note = await prisma.applicationNote.create({
    data: {
      applicationId,
      authorId: auth.id,
      body: body.trim(),
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({ note }, { status: 201 })
}