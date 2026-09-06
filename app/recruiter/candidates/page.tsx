"use client"
import { fetchApi, RecruitmentApplication } from "@/api-client"


import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<RecruitmentApplication[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [departmentFilter, setDepartmentFilter] = useState("ALL")
  const [dateFilter, setDateFilter] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [loading, setLoading] = useState(true)

  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, departmentFilter, dateFilter, limit])

  useEffect(() => {
    fetchCandidates()
  }, [debouncedSearch, statusFilter, departmentFilter, dateFilter, page, limit])

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        q: debouncedSearch,
        status: statusFilter,
      })
      if (departmentFilter !== "ALL") params.append("department", departmentFilter)

      const res = await fetchApi(`/api/candidates?${params.toString()}`)
      const data = await res.json()
      
      setCandidates(data.candidates || data.items || [])
      setTotalPages(data.totalPages || 1)
      setTotalCandidates(data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out] pb-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Candidate Management</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            Candidates Pool
          </h1>
        </div>
        <div className="font-mono text-[13px] text-[#d07d22] bg-[#120202] px-4 py-2 rounded-lg border border-[#2a0d0d]">
          Total Candidates: <span className="font-bold text-[#f4ede4]">{totalCandidates}</span>
        </div>
      </header>

      {/* Filters */}
      <Card className="flex flex-col sm:flex-row gap-4 p-4 items-center">
        <div className="w-full sm:w-2/5">
          <Input 
            placeholder="Search by name, email, or registration..." 
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-1/5">
          <select 
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono text-[12px] focus:outline-none focus:border-[#d07d22]"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="ALL">All Depts</option>
            <option value="Projects">Projects</option>
            <option value="Operations">Operations</option>
            <option value="Technical">Technical</option>
            <option value="Finance">Finance</option>
            <option value="Research and Development">Research and Development</option>
            <option value="Design & Social Media">Design & Social Media</option>
          </select>
        </div>
        <div className="w-full sm:w-1/5">
          <select 
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono text-[12px] focus:outline-none focus:border-[#d07d22]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="w-full sm:w-1/5">
          <select
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono text-[12px] focus:outline-none focus:border-[#d07d22]"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={15}>15 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
        <Button variant="ghost" className="w-full sm:w-auto h-[46px]" onClick={fetchCandidates}>
          REFRESH
        </Button>
      </Card>

      {/* Candidates Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">REG NO</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DEPARTMENT</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">STATUS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">NO CANDIDATES FOUND.</td></tr>
              ) : (
                candidates.map((candidate) => {
                  const appStatus = candidate.status || "APPLIED"
                  return (
                    <tr key={candidate.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                      <td className="p-4 text-[#d07d22] font-mono text-[13px] font-bold">{candidate.registerNumber}</td>
                      <td className="p-4">
                        <p className="text-[#f4ede4] font-medium">{candidate.name}</p>
                        <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">{candidate.email}</p>
                      </td>
                      <td className="p-4 text-[#bfa8a2]">{candidate.domain}</td>
                      <td className="p-4">
                        <StatusPill status={appStatus.toLowerCase().includes('reject') ? 'rejected' : 'pending'}>
                          {appStatus}
                        </StatusPill>
                      </td>
                      <td className="p-4">
                        <Link href={`/recruiter/candidates/view?id=${candidate.id}`}>
                          <Button variant="ghost" className="py-2 px-4 text-xs">VIEW PROFILE</Button>
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

      {/* Pagination Controls */}
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
            PAGE {page} OF {totalPages} ({totalCandidates} Candidates Total)
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
