"use client"
import { fetchApi, RecruitmentApplication, api } from "@/api-client"
import { applicationStatusVariant } from "@/lib/utils"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"

const ALL_STATUSES = [
  "APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED", "WAITLISTED", "SELECTED", "REJECTED", "FURTHER_ROUND"
]

function exportCsv(rows: RecruitmentApplication[]) {
  const headers = ["ID", "Name", "Email", "Department", "Status", "Applied Date", "Registration Number"]
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  const lines = rows.map(r => [
    r.id, r.name, r.email, r.domain, r.status, r.appliedDate || "", r.registerNumber
  ].map(escape).join(","))
  const csv = [headers.map(escape).join(","), ...lines].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RecruiterApplicationsPage() {
  const [applications, setApplications] = useState<RecruitmentApplication[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [department, setDepartment] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sort, setSort] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkMsg, setBulkMsg] = useState("")

  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchApplications()
  }, [debouncedSearch, status, department, dateFrom, dateTo, sort, page])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: debouncedSearch,
        status,
        department,
        sort,
        date_from: dateFrom,
        date_to: dateTo,
      })
      const res = await fetchApi(`/api/applications?${query.toString()}`)
      const data = await res.json()
      setApplications(data.items || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata",
      month: "short", day: "numeric", year: "numeric"
    })
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected(prev =>
      prev.size === applications.length ? new Set() : new Set(applications.map(a => a.id))
    )
  }

  const applyBulk = async () => {
    if (selected.size === 0 || !bulkStatus) {
      setBulkMsg("Select at least one application and a status.")
      return
    }
    setBulkLoading(true)
    setBulkMsg("")
    try {
      const res = await api.bulkUpdateApplications(Array.from(selected), bulkStatus)
      if (res && res.results && res.results.some((r: any) => !r.success)) {
        setBulkMsg(res.message || "Some updates failed.")
      } else {
        setBulkMsg(`Updated ${selected.size} application(s) to ${bulkStatus}.`)
      }
      setSelected(new Set())
      setBulkStatus("")
      fetchApplications()
    } catch (err) {
      setBulkMsg("Bulk update failed.")
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out] pb-10">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Department View</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            Applications Master
          </h1>
        </div>
        <Button variant="cta" onClick={() => exportCsv(applications)} disabled={applications.length === 0}>
          EXPORT CSV
        </Button>
      </header>

      {selected.size > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#120202] p-4 rounded-xl border border-[#2a0d0d]">
          <span className="font-mono text-[12px] text-[#bfa8a2]">{selected.size} selected</span>
          <select
            className="bg-[#1a0606] border border-[#2a0d0d] rounded-lg px-4 py-2 text-[#f4ede4] font-mono text-[12px]"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            <option value="">Set status…</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button variant="primary" onClick={applyBulk} disabled={bulkLoading}>
            {bulkLoading ? "APPLYING…" : "APPLY"}
          </Button>
          <Button variant="ghost" onClick={() => setSelected(new Set())}>CLEAR</Button>
          {bulkMsg && <span className="font-mono text-[12px] text-[#d07d22]">{bulkMsg}</span>}
        </div>
      )}
      {selected.size === 0 && bulkMsg && (
        <div className="font-mono text-[12px] text-[#bfa8a2]">{bulkMsg}</div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#120202] p-4 rounded-xl border border-[#2a0d0d]">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search candidate name..."
            className="w-full bg-[#1a0606] border border-[#2a0d0d] rounded-lg px-4 py-2.5 text-[#f4ede4] font-mono text-[12px] focus:outline-none focus:border-[#ac120c]"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            className="bg-[#1a0606] border border-[#2a0d0d] rounded-lg px-4 py-2.5 text-[#f4ede4] font-mono text-[12px] focus:outline-none focus:border-[#ac120c]"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            className="bg-[#1a0606] border border-[#2a0d0d] rounded-lg px-4 py-2.5 text-[#f4ede4] font-mono text-[12px] focus:outline-none focus:border-[#ac120c]"
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
          >
            <option value="">All Assigned Depts</option>
            <option value="Projects">Projects</option>
            <option value="Operations">Operations</option>
            <option value="Technical">Technical</option>
            <option value="Finance">Finance</option>
            <option value="Research and Development">Research and Development</option>
            <option value="Design & Social Media">Design & Social Media</option>
          </select>
          <input type="date" className="bg-[#1a0606] border border-[#2a0d0d] rounded-lg px-4 py-2.5 text-[#f4ede4] font-mono text-[12px] focus:outline-none focus:border-[#ac120c]" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} placeholder="From" />
          <input type="date" className="bg-[#1a0606] border border-[#2a0d0d] rounded-lg px-4 py-2.5 text-[#f4ede4] font-mono text-[12px] focus:outline-none focus:border-[#ac120c]" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} placeholder="To" />
          <select className="bg-[#1a0606] border border-[#2a0d0d] rounded-lg px-4 py-2.5 text-[#f4ede4] font-mono text-[12px] focus:outline-none focus:border-[#ac120c]" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="">Sort By</option>
            <option value="appliedDate:desc">Applied Date (Newest)</option>
            <option value="appliedDate:asc">Applied Date (Oldest)</option>
            <option value="status:asc">Status</option>
            <option value="name:asc">Name</option>
          </select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 w-10"><input type="checkbox" checked={selected.size === applications.length && applications.length > 0} onChange={toggleSelectAll} /></th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE NAME</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">EMAIL</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DEPT</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">APP DATE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">APP STATUS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ASSIGNED PANEL</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">INTERVIEW STATUS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em] text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={9} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-[#bfa8a2] font-mono">NO APPLICATIONS FOUND.</td></tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                    <td className="p-4"><input type="checkbox" checked={selected.has(app.id)} onChange={() => toggleSelect(app.id)} /></td>
                    <td className="p-4 text-[#f4ede4] font-medium">{app.name || "Unknown"}</td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">{app.email || "-"}</td>
                    <td className="p-4 text-[#bfa8a2]">{app.domain || "-"}</td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">
                      {app.appliedDate ? formatDate(app.appliedDate) : "-"}
                    </td>
                     <td className="p-4">
                      <StatusPill status={applicationStatusVariant(app.status)}>
                        {app.status || "APPLIED"}
                      </StatusPill>
                    </td>
                    <td className="p-4 text-[#bfa8a2] text-[11px] font-mono">{app.assignedPanel ?? "-"}</td>
                    <td className="p-4 text-[#bfa8a2] text-[11px] font-mono">{app.interviewStatus ?? "-"}</td>
                    <td className="p-4 text-right">
                      <a href={`/recruiter/candidates/${app.id}`} className="text-[#d07d22] font-mono text-[10px] uppercase hover:underline">
                        VIEW PROFILE
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-[#120202] p-4 rounded-xl border border-[#2a0d0d]">
          <Button
            variant="ghost"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            PREV
          </Button>
          <span className="font-mono text-[#bfa8a2] text-[12px]">
            PAGE {page} OF {totalPages}
          </span>
          <Button
            variant="ghost"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            NEXT
          </Button>
        </div>
      )}
    </div>
  )
}
