"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/client/api"
import { ConfirmDialog } from "./ConfirmDialog"
import { PanelistPicker } from "./PanelistPicker"

interface InterviewSchedulerModalProps {
  open: boolean
  onClose: () => void
  applicationId: number
  applicationName: string
  applicationEmail: string
  departmentId: number
  onSuccess: () => void
}

export function InterviewSchedulerModal({
  open,
  onClose,
  applicationId,
  applicationName,
  applicationEmail,
  departmentId,
  onSuccess,
}: InterviewSchedulerModalProps) {
  const [panelistIds, setPanelistIds] = useState<number[]>([])
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [mode, setMode] = useState<"ONLINE" | "OFFLINE">("ONLINE")
  const [locationOrLink, setLocationOrLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflictError, setConflictError] = useState<any>(null)
  const [showConflictDialog, setShowConflictDialog] = useState(false)

  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getMinutes() % 15)
  const minDateTime = now.toISOString().slice(0, 16)

  useEffect(() => {
    if (!startTime) {
      const defaultStart = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      defaultStart.setHours(10, 0, 0, 0)
      setStartTime(defaultStart.toISOString().slice(0, 16))
    }
    if (!endTime && startTime) {
      const defaultEnd = new Date(new Date(startTime).getTime() + 60 * 60 * 1000)
      setEndTime(defaultEnd.toISOString().slice(0, 16))
    }
  }, [startTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setConflictError(null)

    if (panelistIds.length === 0) {
      setError("Please select at least one panelist")
      return
    }
    if (!startTime || !endTime) {
      setError("Please select start and end time")
      return
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setError("End time must be after start time")
      return
    }
    if (!locationOrLink.trim()) {
      setError("Please provide location or meeting link")
      return
    }

    setLoading(true)
    try {
      await api.createInterview({
        applicationId,
        panelistUserIds: panelistIds,
        startTime,
        endTime,
        mode,
        locationOrLink,
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      if (err.message?.includes("conflict") || err.message?.includes("409")) {
        setConflictError(err.message)
        setShowConflictDialog(true)
      } else {
        setError(err.message || "Failed to schedule interview")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-red-900/30 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
        <div className="p-6 border-b border-red-900/30">
          <h2 className="text-xl font-bold text-white">Schedule Interview</h2>
          <p className="text-gray-400 mt-1">{applicationName} • {applicationEmail}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-600/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Panelists *</label>
            <PanelistPicker
              selectedIds={panelistIds}
              onChange={setPanelistIds}
              startTime={startTime}
              endTime={endTime}
              departmentId={departmentId}
            />
            {panelistIds.length === 0 && (
              <p className="text-xs text-red-500 mt-1">At least one panelist required</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Time *</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                min={minDateTime}
                className="w-full px-4 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Time *</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                min={minDateTime}
                className="w-full px-4 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Mode *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="ONLINE"
                  checked={mode === "ONLINE"}
                  onChange={() => setMode("ONLINE")}
                  className="w-4 h-4 text-red-600 border-red-900/30 focus:ring-red-500"
                />
                <span className="text-gray-300">Online</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="OFFLINE"
                  checked={mode === "OFFLINE"}
                  onChange={() => setMode("OFFLINE")}
                  className="w-4 h-4 text-red-600 border-red-900/30 focus:ring-red-500"
                />
                <span className="text-gray-300">In-Person</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {mode === "ONLINE" ? "Meeting Link *" : "Location *"}
            </label>
            <input
              type="text"
              value={locationOrLink}
              onChange={e => setLocationOrLink(e.target.value)}
              placeholder={mode === "ONLINE" ? "https://meet.google.com/..." : "Room 101, Building A"}
              className="w-full px-4 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-red-900/30">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-red-900/30 text-gray-300 rounded-lg hover:bg-red-900/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Scheduling..." : "Schedule Interview"}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={showConflictDialog}
        onClose={() => setShowConflictDialog(false)}
        onConfirm={() => setShowConflictDialog(false)}
        title="Scheduling Conflict"
        message="The selected time slot conflicts with existing interviews. Please choose a different time or panelists."
        confirmText="OK"
        variant="danger"
      />
    </div>
  )
}