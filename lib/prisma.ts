import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null }

declare global {
  interface BigInt {
    toJSON(): number
  }
}

(BigInt.prototype as bigint).toJSON = function () {
  return Number(this)
}

let prismaInstance: PrismaClient | null = null

export function getPrismaClient() {
  if (prismaInstance) return prismaInstance
  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
  return prismaInstance
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return getPrismaClient()[prop as keyof PrismaClient]
  },
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = getPrismaClient()