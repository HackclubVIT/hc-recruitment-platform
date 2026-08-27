import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, requireRoles } from "@/lib/guards"
import { Role } from "@/lib/status"
import { getPanelistAvailability } from "@/lib/conflict"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const roleCheck = requireRoles(Role.LEAD, Role.ADMIN)(auth)
  if (roleCheck) return roleCheck

  const { searchParams } = new URL(request.url)
  const startTime = searchParams.get("startTime")
  const endTime = searchParams.get("endTime")

  const depts = await prisma.department.findMany({
    where: auth.role === Role.ADMIN ? undefined : { id: { in: auth.deptIds } },
  })
  const deptNames = depts.map((d) => d.name)

  const panelists = await prisma.user.findMany({
    where: { 
      role: Role.PANEL, 
      isReviewer: true,
      department: { in: deptNames } 
    },
  })

  let availability: Record<string, { busy: boolean; conflictingInterviews: number[] }> = {}
  if (startTime && endTime) {
    availability = await getPanelistAvailability(
      panelists.map(p => p.id), // p.id is already BigInt
      new Date(startTime),
      new Date(endTime)
    )
  }

  return NextResponse.json({
    panelists: panelists.map(p => {
      // Find the department object if needed by the frontend
      const deptObj = depts.find(d => d.name === p.department)
      return {
        id: Number(p.id),
        name: p.name,
        email: p.email,
        departments: deptObj ? [deptObj] : [],
        availability: availability[p.id.toString()] || { busy: false, conflictingInterviews: [] },
      }
    }),
  })
}