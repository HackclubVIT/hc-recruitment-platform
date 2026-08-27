import { NextRequest, NextResponse } from "next/server"
import { prisma } from "./prisma"
import { verifyToken, extractTokenFromHeader, JWTPayload } from "./auth"
import { Role, ApplicationStatus } from "./status"

export interface AuthenticatedUser {
  id: number
  name: string
  email: string
  role: Role
  deptIds: number[]
}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  const token = extractTokenFromHeader(request.headers.get("authorization")) ||
    request.cookies.get("hc_session_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Access token required" }, { status: 401 })
  }

  const user = await getUserFromToken(token)
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired session token" }, { status: 403 })
  }

  return user
}

async function getUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { email: payload.email || undefined },
  })

  if (!user) return null

  // Derive deptIds from the string department field
  let deptIds: number[] = []
  if (user.department) {
    const dept = await prisma.department.findFirst({ where: { name: user.department } })
    if (dept) deptIds = [dept.id]
  }

  return {
    id: Number(user.id),
    name: user.name,
    email: user.email || "",
    role: user.role as Role,
    deptIds,
  }
}

export function requireRoles(...allowedRoles: Role[]) {
  return (user: AuthenticatedUser): NextResponse | null => {
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 })
    }
    return null
  }
}

export async function requireDeptAccess(
  user: AuthenticatedUser,
  targetDeptId: number
): Promise<NextResponse | null> {
  if (user.role === Role.ADMIN) return null
  if (!user.deptIds.includes(targetDeptId)) {
    return NextResponse.json({ error: "Forbidden: Not authorized for this department" }, { status: 403 })
  }
  return null
}

export async function requireApplicationAccess(
  user: AuthenticatedUser,
  applicationId: number
): Promise<NextResponse | null> {
  if (user.role === Role.ADMIN) return null

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { departmentId: true },
  })

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  return requireDeptAccess(user, application.departmentId)
}

export async function requireInterviewAccess(
  user: AuthenticatedUser,
  interviewId: number
): Promise<NextResponse | null> {
  if (user.role === Role.ADMIN) return null

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: true },
  })

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 })
  }

  return requireDeptAccess(user, interview.application.departmentId)
}