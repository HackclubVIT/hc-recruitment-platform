"use client"

import { useState } from "react"
import { api } from "@/lib/client/api"
import { useAuth } from "@/lib/client/auth"

interface Note {
  id: number
  body: string
  createdAt: string
  author: { id: number; name: string; email: string }
}

interface NotesThreadProps {
  applicationId: number
}

export function NotesThread({ applicationId }: NotesThreadProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const fetchNotes = async () => {
    try {
      const app = await api.getApplication(applicationId)
      setNotes((app as { notes: Note[] }).notes || [])
    } catch (error) {
      console.error("Failed to fetch notes:", error)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    setLoading(true)
    try {
      await api.addNote(applicationId, newNote)
      setNewNote("")
      fetchNotes()
    } catch (error) {
      console.error("Failed to add note:", error)
      alert("Failed to add note")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddNote} className="space-y-2">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Add an internal note..."
          rows={3}
          className="w-full px-4 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
        />
        <button
          type="submit"
          disabled={loading || !newNote.trim()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Adding..." : "Add Note"}
        </button>
      </form>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No notes yet</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-gray-900/30 border border-red-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <span className="font-mono">{note.author.name}</span>
                <span>•</span>
                <span>{new Date(note.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap">{note.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}