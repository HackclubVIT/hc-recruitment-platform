import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { logAudit } from "@/lib/audit"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departments: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ users }, { status: 200 })
  } catch (error) {
    console.error("Fetch users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, email, password, role, departments } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        departments: departments || []
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    await logAudit(session.id, "CREATED_USER", "User", undefined)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error: any) {
    console.error("Create user error:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, name, email, role, departments } = await req.json()

    if (!id || !name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name, email, role, departments: departments || [] },
      select: { id: true, name: true, email: true, role: true }
    })

    await logAudit(session.id, "UPDATED_USER", "User", undefined)

    return NextResponse.json({ user }, { status: 200 })
  } catch (error: any) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    // Prevent deleting self
    if (session.id === id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id }
    })

    await logAudit(session.id, "DELETED_USER", "User", undefined)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

