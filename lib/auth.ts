import jwt, { JwtPayload as JwtPayloadType } from "jsonwebtoken"
import { prisma } from "./prisma"
import { Role } from "./status"

/**
 * JWT Configuration
 * SECRET: Should be overridden in production via JWT_SECRET env var
 * EXPIRES_IN: Token lifetime (7 days)
 */
const JWT_SECRET = process.env.JWT_SECRET || "HACKCLUB_VIT_SECRET_SESSION_TOKEN_KEY_2026"
const JWT_EXPIRES_IN = "7d"

/**
 * JWTPayload - Shape of decoded JWT token
 * Includes deptIds for department-scoped access control
 */
export interface JWTPayload {
  sub: number
  name: string
  email: string
  role: Role
  deptIds: number[]
}

/**
 * signToken - Creates a signed JWT
 * @param payload - User data to encode
 * @returns Signed token string
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * verifyToken - Verifies and decodes JWT
 * Maps raw role strings to standardized Role enum
 * Handles role mapping from main site's role format
 * 
 * @param token - JWT string
 * @returns JWTPayload or null if invalid/expired
 * 
 * INTEGRATION: Main site may use different role names - mapping handles this
 * TODO: [INTEGRATION] Add token refresh mechanism for long sessions
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (typeof decoded === "string") return null
    const payload = decoded as JwtPayloadType
    
    // Map main site role strings to our Role enum
    const rawRole = payload.role ? String(payload.role).toUpperCase() : "MEMBER"
    let mappedRole = rawRole
    if (rawRole.includes("ADMIN")) mappedRole = "ADMIN"
    else if (rawRole.includes("LEAD")) mappedRole = "LEAD"
    else if (rawRole.includes("RECRUITER")) mappedRole = "RECRUITER"
    else if (rawRole.includes("PANEL")) mappedRole = "PANEL"
    else mappedRole = "CANDIDATE"

    return {
      sub: payload.sub ? Number(payload.sub) : 0,
      name: String(payload.name || ""),
      email: String(payload.email || ""),
      role: mappedRole as Role,
      deptIds: Array.isArray(payload.deptIds) ? payload.deptIds.map(Number) : [],
    }
  } catch (e: unknown) {
    return null
  }
}

/**
 * getUserFromToken - Verifies token and fetches fresh user data from DB
 * Re-fetches on each call to pick up role/department changes immediately
 * Derives deptIds by looking up department name in Department table
 * 
 * @param token - JWT string
 * @returns AuthenticatedUser or null
 * 
 * INTEGRATION: Called by authenticateRequest guard
 * NOTE: User model stores department as string name, not FK
 */
export async function getUserFromToken(token: string) {
  const payload = verifyToken(token)
  if (!payload || !payload.email) return null

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  })

  if (!user) return null

  // Derive deptIds from the string department field by looking up the Department table
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
 * extractTokenFromHeader - Extracts Bearer token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") return null
  return parts[1]
}