"use client"
import { api } from "@/api-client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export function NotesPanel({ applicationId }: { applicationId: string }) {
  const [notes, setNotes] = useState<Array<{ id: number; content: string; authorName: string; createdAt: string }>>([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    try {
      const data = await api.getApplicationNotes(applicationId)
      setNotes(data.notes || [])
    } catch {
      setError("Failed to load notes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(); }, [applicationId])

  const add = async () => {
    if (!content.trim()) return
    setError("")
    try {
      const data = await api.createApplicationNote(applicationId, content.trim())
      if (!data || !data.note) {
        setError(data?.error || "Failed to add note")
        return
      }
      setContent("")
      load()
    } catch {
      setError("Failed to add note")
    }
  }

  const remove = async (noteId: number) => {
    if (!confirm("Delete this note?")) return
    try {
      await api.deleteApplicationNote(applicationId, noteId)
      load()
    } catch { /* ignore */ }
  }

  return (
    <Card className="p-6">
      <h2 className="text-[#d07d22] font-mono text-[14px] uppercase mb-4">Notes</h2>
      <div className="flex flex-col gap-3">
        <textarea
          className="w-full bg-[#1a0606] border border-[#2a0d0d] rounded-lg p-3 text-[#f4ede4] font-body text-[14px] focus:outline-none focus:border-[#ac120c] min-h-[80px]"
          placeholder="Add a note about this candidate…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end">
          <Button variant="primary" onClick={add} disabled={!content.trim()}>ADD NOTE</Button>
        </div>
      </div>

      {error && <p className="text-[#ac120c] text-[12px] mt-2">{error}</p>}

      <div className="flex flex-col gap-3 mt-4">
        {loading ? (
          <p className="text-[#bfa8a2] font-mono text-[12px]">LOADING…</p>
        ) : notes.length === 0 ? (
          <p className="text-[#bfa8a2] font-mono text-[12px]">No notes yet.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="bg-[#1a0606] p-3 rounded border border-[#2a0d0d]">
              <div className="flex justify-between items-start gap-2">
                <p className="text-[#f4ede4] font-body text-[14px] whitespace-pre-wrap">{n.content}</p>
                <button onClick={() => remove(n.id)} className="text-[#bfa8a2] hover:text-[#ac120c] text-[11px] font-mono shrink-0">DELETE</button>
              </div>
              <p className="text-[#bfa8a2] font-mono text-[10px] mt-2">
                {n.authorName} · {new Date(n.createdAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
