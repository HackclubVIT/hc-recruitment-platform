import { NextRequest, NextResponse } from "next/server"
import { prisma } from "./prisma"
import { verifyToken, extractTokenFromHeader } from "./auth"
import { Role } from "./status"

/**
 * AuthenticatedUser - Shape of user after token verification
 * Includes deptIds for department-level access control
 */
export interface AuthenticatedUser {
  id: number
  name: string
  email: string
  role: Role
  deptIds: number[]
}

/**
 * authenticateRequest - Main authentication guard for API routes
 * Extracts token from Authorization header or httpOnly cookie
 * Verifies JWT and fetches latest user data from database
 * 
 * @param request - Next.js request object
 * @returns AuthenticatedUser | NextResponse (error response)
 * 
 * INTEGRATION: Used by all protected API routes
 * TODO: [INTEGRATION] Add rate limiting for failed auth attempts
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  // Token can come from Authorization header (Bearer) or httpOnly cookie
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

/**
 * getUserFromToken - Internal helper to verify JWT and fetch user from DB
 * Re-fetches user on each request to pick up role/department changes immediately
 * 
 * @param token - JWT token string
 * @returns AuthenticatedUser | null
 */
async function getUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { email: payload.email || undefined },
  })

  if (!user) return null

  // Derive deptIds from the string department field by looking up Department table
  // NOTE: User model stores department as string name, not foreign key
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

/**
 * requireRoles - Higher-order function for role-based authorization
 * Returns a guard function that checks if user's role is in allowedRoles
 * 
 * @param allowedRoles - Array of roles that are allowed
 * @returns Function that returns NextResponse (error) or null (allowed)
 * 
 * USAGE: const roleCheck = requireRoles(Role.LEAD, Role.ADMIN)(auth)
 *        if (roleCheck) return roleCheck
 */
export function requireRoles(...allowedRoles: Role[]) {
  return (user: AuthenticatedUser): NextResponse | null => {
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 })
    }
    return null
  }
}

/**
 * requireDeptAccess - Checks if user has access to a specific department
 * ADMIN bypasses all department checks
 * 
 * @param user - Authenticated user
 * @param targetDeptId - Department ID to check access for
 * @returns NextResponse (error) or null (allowed)
 */
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

/**
 * requireApplicationAccess - Checks if user can access a specific application
 * Verifies application exists and user has department access
 * 
 * @param user - Authenticated user
 * @param applicationId - Application ID to check
 * @returns NextResponse (error) or null (allowed)
 * 
 * INTEGRATION: Used by all application-scoped API routes
 */
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

/**
 * requireInterviewAccess - Checks if user can access a specific interview
 * Verifies interview exists and user has department access via the application
 * 
 * @param user - Authenticated user
 * @param interviewId - Interview ID to check
 * @returns NextResponse (error) or null (allowed)
 */
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