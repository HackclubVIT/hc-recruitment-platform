"use client"

import React, { useState, useEffect, useCallback } from "react"
import { api, AuditLogEntry } from "@/api-client"
import { Card } from "@/components/ui/Card"
import { DiamondIcon, SearchIcon } from "@/components/ui/Icons"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEntity, setSelectedEntity] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getAuditLogs({
        page,
        limit: 25,
        q: searchQuery.trim() || undefined,
        entity: selectedEntity !== "ALL" ? selectedEntity : undefined
      })

      // Backend returns { items, logs, total, totalPages }
      const items = data.items || data.logs || []
      setLogs(items)
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.total || items.length)
    } catch (err: any) {
      console.error("Failed to fetch audit logs:", err)
      setError(err?.message || "Failed to load audit logs. Check your permissions or network connection.")
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, selectedEntity])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    } catch {
      return dateStr
    }
  }

  const getActionBadgeClass = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes("CREATE") || act.includes("ADDED") || act.includes("SUBMITTED") || act.includes("SCHEDULED")) {
      return "bg-[#18392b] text-[#2ebd85] border border-[#2ebd85]/30"
    }
    if (act.includes("DELETE") || act.includes("REMOVED") || act.includes("DEACTIVATED") || act.includes("REJECTED")) {
      return "bg-[#451210] text-[#ea675d] border border-[#ea675d]/30"
    }
    if (act.includes("UPDATE") || act.includes("STATUS_CHANGED") || act.includes("TEST")) {
      return "bg-[#4d3205] text-[#f5a623] border border-[#f5a623]/30"
    }
    return "bg-[#370b09] text-[#bfa8a2] border border-[#bfa8a2]/20"
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Security & Operations</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            System Audit Logs
          </h1>
          <p className="text-[#bfa8a2] text-sm">
            Real-time trail of administrative actions, status updates, interview schedules, and configurations.
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            setPage(1)
            fetchLogs()
          }}
          disabled={loading}
          className="self-start sm:self-auto text-xs font-mono border border-[#370b09] text-[#bfa8a2] hover:text-[#f4ede4]"
        >
          {loading ? "REFRESHING..." : "↻ REFRESH"}
        </Button>
      </header>

      {/* Filters & Search Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bfa8a2]/50 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, user, email, or entity ID..."
              className="pl-10 text-sm font-mono"
            />
          </div>
          <Button type="submit" variant="primary" className="text-xs font-mono px-4 py-2">
            FILTER
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <label className="text-[#bfa8a2] font-mono text-[11px] whitespace-nowrap uppercase">Entity:</label>
          <select
            value={selectedEntity}
            onChange={(e) => {
              setSelectedEntity(e.target.value)
              setPage(1)
            }}
            aria-label="Filter by Entity"
            className="input-glass bg-[#1a0606] text-xs font-mono px-3 py-2 border border-[#370b09] rounded text-[#f4ede4] outline-none"
          >
            <option value="ALL">ALL ENTITIES</option>
            <option value="Application">Application</option>
            <option value="Interview">Interview</option>
            <option value="Panel">Panel</option>
            <option value="PanelMember">Panel Member</option>
            <option value="User">User</option>
            <option value="Form">Form</option>
            <option value="FormQuestion">Form Question</option>
            <option value="Settings">Settings</option>
            <option value="InterviewFeedback">Interview Feedback</option>
          </select>
        </div>
      </Card>

      {error && (
        <div className="p-4 rounded-lg bg-[#451210]/60 border border-[#ea675d]/30 text-[#ea675d] text-sm font-mono flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" onClick={fetchLogs} className="text-xs text-[#ea675d] underline">Retry</Button>
        </div>
      )}

      {/* Audit Log Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">TIMESTAMP (IST)</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTOR</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTION</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ENTITY TARGET</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[#bfa8a2] font-mono text-sm animate-pulse">
                    RETRIEVING AUDIT LOGS...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[#bfa8a2] font-mono text-sm">
                    NO AUDIT ENTRIES FOUND
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px] whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <div>
                          <p className="text-[#f4ede4] font-medium text-sm">{log.user.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {log.user.email && (
                              <span className="text-[#bfa8a2] font-mono text-[10px]">{log.user.email}</span>
                            )}
                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#370b09] text-[#d07d22] border border-[#d07d22]/20">
                              {log.user.role}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#d07d22] font-mono text-[11px] font-semibold tracking-wider">
                          SYSTEM
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">
                      <span className="text-[#f4ede4] font-semibold">{log.entity}</span>
                      {log.entity_id ? (
                        <span className="ml-1.5 text-[#d07d22] font-mono bg-[#2a0d0d] px-1.5 py-0.5 rounded text-[10px]">
                          #{log.entity_id}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {!loading && totalCount > 0 && (
          <div className="p-4 bg-[#370b09]/20 border-t border-[#2a0d0d] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[#bfa8a2] font-mono text-xs">
              Showing {logs.length} of {totalCount} total entries (Page {page} of {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="text-xs font-mono border border-[#370b09] px-3 py-1 text-[#bfa8a2] disabled:opacity-30"
              >
                PREVIOUS
              </Button>
              <span className="font-mono text-xs px-2 text-[#f4ede4]">{page}</span>
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="text-xs font-mono border border-[#370b09] px-3 py-1 text-[#bfa8a2] disabled:opacity-30"
              >
                NEXT
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

