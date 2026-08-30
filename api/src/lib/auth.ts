import { SignJWT, jwtVerify } from "jose"
import { Request } from "express"
import prisma from "./db"

function getSecretKey() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be provided in production")
  }
  return process.env.JWT_SECRET || "development_secret_only"
}

const getEncodedKey = () => new TextEncoder().encode(getSecretKey())

export interface JWTPayload {
  id: string;
  email?: string;
  role?: string;
  departments?: string[];
  [key: string]: unknown;
}

export async function signToken(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey())
}

export async function verifyToken(token: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    })
    return payload
  } catch (error) {
    return null
  }
}

interface SessionPayload {
  id: string
  email: string
  role: string
  departments: string[]
}

export async function getSession(req?: Request): Promise<SessionPayload | null> {
  if (!req) return null
  const token = req.cookies?.session
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || !payload.id) return null
  
  if (typeof payload.id === "string" && payload.id.startsWith("dev-mock-id")) {
    if (process.env.NODE_ENV === "production") return null;
    return {
      id: payload.id,
      email: payload.email as string,
      role: payload.role as string,
      departments: payload.departments as string[]
    }
  }

  let userId: string
  try {
    userId = payload.id as string
  } catch (e) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) }
  })
  
  if (!user || user.status !== "Active") return null

  const assignment = await prisma.recruitmentRoleAssignment.findUnique({
    where: { user_id: BigInt(userId) }
  })

  return {
    id: user.id.toString(),
    email: user.email || (payload.email as string) || "",
    role: assignment?.active ? assignment.role : "NONE",
    departments: assignment?.active ? assignment.departments : []
  }
}
