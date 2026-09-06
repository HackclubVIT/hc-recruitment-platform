"use client"
import { fetchApi } from "@/api-client"


import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [departmentFilter, setDepartmentFilter] = useState("ALL")
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
  }, [debouncedSearch, statusFilter, departmentFilter, limit])

  useEffect(() => {
    fetchCandidates()
  }, [debouncedSearch, statusFilter, departmentFilter, page, limit])

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const deptQuery = departmentFilter !== "ALL" ? `&department=${departmentFilter}` : ""
      const res = await fetchApi(`/api/candidates?page=${page}&limit=${limit}&q=${debouncedSearch}&status=${statusFilter}${deptQuery}`)
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
            <span>Global Data View</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            All Candidates
          </h1>
        </div>
        <div className="font-mono text-[13px] text-[#d07d22] bg-[#120202] px-4 py-2 rounded-lg border border-[#2a0d0d]">
          Total Candidates: <span className="font-bold text-[#f4ede4]">{totalCandidates}</span>
        </div>
      </header>

      <Card className="flex flex-col sm:flex-row gap-4 p-4 items-center">
        <div className="w-full sm:w-1/3">
          <Input 
            placeholder="Search by name, email, or registration..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-1/4">
          <select 
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono text-[12px] focus:outline-none focus:border-[#d07d22]"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            <option value="Projects">Projects</option>
            <option value="Operations">Operations</option>
            <option value="Technical">Technical</option>
            <option value="Finance">Finance</option>
            <option value="Research and Development">Research and Development</option>
            <option value="Design & Social Media">Design & Social Media</option>
          </select>
        </div>
        <div className="w-full sm:w-1/4">
          <select 
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono text-[12px] focus:outline-none focus:border-[#d07d22]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="REJECTED">Rejected</option>
            <option value="SELECTED">Selected</option>
          </select>
        </div>
        <div className="w-full sm:w-1/6">
          <select
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono text-[12px] focus:outline-none focus:border-[#d07d22]"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={15}>15 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
        <Button variant="ghost" className="w-full sm:w-auto h-[46px]" onClick={fetchCandidates}>
          REFRESH
        </Button>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">REG NO</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DEPARTMENT</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono">NO CANDIDATES FOUND.</td></tr>
              ) : (
                candidates.map((candidate) => {
                  const appStatus = candidate.status || "APPLIED"
                  return (
                    <tr key={candidate.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                      <td className="p-4">
                        <Link href={`/admin/candidates/view?id=${candidate.id}`} className="text-[#d07d22] font-mono text-[13px] font-bold hover:underline">
                          {candidate.registration_number}
                        </Link>
                      </td>
                      <td className="p-4">
                        <Link href={`/admin/candidates/view?id=${candidate.id}`} className="text-[#f4ede4] font-medium hover:underline">
                          {candidate.name}
                        </Link>
                        <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">{candidate.email}</p>
                      </td>
                      <td className="p-4 text-[#bfa8a2]">{candidate.department}</td>
                      <td className="p-4">
                        <StatusPill status={appStatus.toLowerCase().includes('reject') ? 'rejected' : 'pending'}>
                          {appStatus}
                        </StatusPill>
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
