"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/client/api"

interface Panelist {
  id: number
  name: string
  email: string
  departments: { id: number; name: string }[]
  availability: { busy: boolean; conflictingInterviews: number[] }
}

interface PanelistPickerProps {
  selectedIds: number[]
  onChange: (ids: number[]) => void
  startTime?: string
  endTime?: string
  departmentId?: number
}

export function PanelistPicker({ selectedIds, onChange, startTime, endTime, departmentId }: PanelistPickerProps) {
  const [panelists, setPanelists] = useState<Panelist[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPanelists = useCallback(async () => {
    if (!startTime || !endTime) return
    setLoading(true)
    try {
      const data = await api.getPanelCandidates(startTime, endTime)
      const result = data as { panelists: Panelist[] }
      let filtered = result.panelists
      if (departmentId) {
        filtered = filtered.filter(p => p.departments.some(d => d.id === departmentId))
      }
      setPanelists(filtered)
    } catch (error) {
      console.error("Failed to fetch panelists:", error)
    } finally {
      setLoading(false)
    }
  }, [startTime, endTime, departmentId])

  useEffect(() => {
    (async () => {
      await fetchPanelists()
    })()
  }, [fetchPanelists])

  const togglePanelist = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="text-center py-4 text-gray-400">Loading panelists...</div>
      ) : panelists.length === 0 ? (
        <div className="text-center py-4 text-gray-400">No available panelists for this time slot</div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {panelists.map(p => (
            <label
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedIds.includes(p.id)
                  ? "bg-red-900/30 border-red-600/50"
                  : "bg-gray-900/30 border-red-900/20 hover:border-red-900/50"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={() => togglePanelist(p.id)}
                className="w-4 h-4 text-red-600 border-red-900/30 rounded focus:ring-red-500"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{p.name}</div>
                <div className="text-xs text-gray-500">{p.email}</div>
                <div className="flex gap-1 mt-1">
                  {p.departments.map(d => (
                    <span key={d.id} className="px-1.5 py-0.5 text-xs bg-red-900/30 text-red-400 rounded">
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
              {p.availability.busy && (
                <span className="px-2 py-1 text-xs bg-amber-900/30 text-amber-400 rounded">
                  Busy
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}