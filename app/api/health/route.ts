import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET() {
  try {
    // Optional: Check database connectivity
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: "ok",
      database: "connected"
    }, { status: 200 })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json({
      status: "error",
      database: "disconnected"
    }, { status: 500 })
  }
}
