import { Request, Response } from "express";
import prisma from "../../../../lib/db"
import { getSession } from "../../../../lib/auth"

export const DELETE = async (req: Request, res: Response) => {
  try {
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: "Unauthorized" })

    const noteId = parseInt((req.params as any).noteId as string, 10)
    const note = await prisma.recruitmentNote.findUnique({ where: { id: noteId } })
    if (!note) return res.status(404).json({ error: "Note not found" })

    if (session.role !== "ADMIN" && note.author_id.toString() !== session.id) {
      return res.status(403).json({ error: "Forbidden" })
    }

    await prisma.recruitmentNote.delete({ where: { id: noteId } })
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Delete note error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
