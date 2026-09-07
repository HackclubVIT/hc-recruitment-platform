"use client"
import { fetchApi } from "@/api-client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"

export default function RecruiterApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters & Pagination
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [department, setDepartment] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchApplications()
  }, [debouncedSearch, status, department, page])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: debouncedSearch,
        status,
        department
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

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out] pb-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Department View</span>
        </div>
        <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
          Applications Master
        </h1>
      </header>

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
            <option value="APPLIED">Applied</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
            <option value="INTERVIEW_COMPLETED">Interview Completed</option>
            <option value="WAITLISTED">Waitlisted</option>
            <option value="SELECTED">Selected</option>
            <option value="REJECTED">Rejected</option>
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
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE NAME</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">EMAIL</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DEPT</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">APP DATE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">APP STATUS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em] text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#bfa8a2] font-mono">NO APPLICATIONS FOUND.</td></tr>
              ) : (
                applications.map((app) => {
                  const candidateName = app.name || app.candidate?.name || "Unknown"
                  const candidateEmail = app.email || app.candidate?.email || "-"
                  const candidateDept = app.domain || app.department || app.firstPreference || app.candidate?.department || "-"
                  const appDate = app.appliedDate || app.submitted_at
                  const appId = app.id || app.candidate?.id

                  return (
                    <tr key={app.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                      <td className="p-4 text-[#f4ede4] font-medium">{candidateName}</td>
                      <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">{candidateEmail}</td>
                      <td className="p-4 text-[#bfa8a2]">{candidateDept}</td>
                      <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">
                        {appDate ? formatDate(appDate) : "-"}
                      </td>
                      <td className="p-4">
                        <StatusPill status={app.status?.toLowerCase().includes('reject') ? 'rejected' : 'pending'}>
                          {app.status || "APPLIED"}
                        </StatusPill>
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/recruiter/candidates/view?id=${appId}`} className="text-[#d07d22] font-mono text-[10px] uppercase hover:underline">
                          VIEW PROFILE
                        </Link>
                      </td>
                    </tr>
                  )
                })
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
