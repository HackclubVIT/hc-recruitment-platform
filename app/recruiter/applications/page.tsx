"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"

export default function RecruiterApplicationsPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/applications`, { credentials: "include" })
      const data = await res.json()
      setCandidates(data.items || []) // Storing applications, keeping variable name 'candidates' to minimize diff
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    })
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Department Data View</span>
        </div>
        <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
          Applications Management
        </h1>
      </header>

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
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ASSIGNED PANEL</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">INTERVIEW STATUS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em] text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-[#bfa8a2] font-mono">NO APPLICATIONS FOUND IN YOUR DEPARTMENTS.</td></tr>
              ) : (
                candidates.map((app) => {
                  const c = app.candidate
                  const interview = app.interviews?.[app.interviews.length - 1]
                  return (
                    <tr key={app.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                      <td className="p-4 text-[#f4ede4] font-medium">{c?.name || "Unknown"}</td>
                      <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">{c?.email || "-"}</td>
                      <td className="p-4 text-[#bfa8a2]">{c?.department || "-"}</td>
                      <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">
                        {app.submitted_at ? formatDate(app.submitted_at) : "-"}
                      </td>
                      <td className="p-4">
                        <StatusPill status={app.status.toLowerCase().includes('reject') ? 'rejected' : 'pending'}>
                          {app.status || "APPLIED"}
                        </StatusPill>
                      </td>
                      <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">
                        {interview?.panel_id ? `Panel #${interview.panel_id}` : "-"}
                      </td>
                      <td className="p-4">
                        {interview ? (
                          <StatusPill status={interview.status.toLowerCase() === 'completed' ? 'completed' : 'active'}>
                            {interview.status}
                          </StatusPill>
                        ) : (
                          <span className="text-[#bfa8a2] font-mono text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <a href={`/recruiter/candidates/${c?.id}`} className="text-[#d07d22] font-mono text-[10px] uppercase hover:underline">
                          VIEW PROFILE
                        </a>
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
