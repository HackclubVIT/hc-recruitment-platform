import { SignJWT, jwtVerify } from "jose"
import { Request } from "express"

function getSecretKey() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be provided in production")
  }
  return process.env.JWT_SECRET || "development_secret_only"
}

const getEncodedKey = () => new TextEncoder().encode(getSecretKey())

export async function signToken(payload: any) {
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
  role: string
  departments: string[]
  [key: string]: any
}

// Updated to use Express Request
export async function getSession(req?: Request): Promise<SessionPayload | null> {
  if (!req) return null
  const token = req.cookies?.session
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return payload as SessionPayload
}
