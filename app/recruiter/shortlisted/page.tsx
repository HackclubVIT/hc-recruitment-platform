"use client"
import { fetchApi } from "@/api-client"


import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

export default function ShortlistedCandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCandidates()
  }, [search])

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const res = await fetchApi(`/api/candidates?q=${search}&status=SHORTLISTED`)
      const data = await res.json()
      setCandidates(data.candidates || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Candidate Management</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            Shortlisted Pool
          </h1>
        </div>
      </header>

      <Card className="flex flex-col sm:flex-row gap-4 p-4 items-center">
        <div className="w-full">
          <Input 
            placeholder="Search shortlisted candidates..." 
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
          />
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
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono">NO SHORTLISTED CANDIDATES FOUND.</td></tr>
              ) : (
                candidates.map((candidate) => {
                  return (
                    <tr key={candidate.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                      <td className="p-4 text-[#d07d22] font-mono text-[13px] font-bold">{candidate.registerNumber || candidate.registration_number || "-"}</td>
                      <td className="p-4">
                        <p className="text-[#f4ede4] font-medium">{candidate.name}</p>
                        <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">{candidate.email}</p>
                      </td>
                      <td className="p-4 text-[#bfa8a2]">{candidate.domain || candidate.department || "-"}</td>
                      <td className="p-4 flex gap-3">
                        <Link href={`/recruiter/meetings/schedule?candidate=${candidate.id}`}>
                          <Button variant="cta" className="py-2 px-4 text-xs">SCHEDULE</Button>
                        </Link>
                        <Link href={`/recruiter/candidates/${candidate.id}`}>
                          <Button variant="ghost" className="py-2 px-4 text-xs">VIEW</Button>
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
    </div>
  )
}
