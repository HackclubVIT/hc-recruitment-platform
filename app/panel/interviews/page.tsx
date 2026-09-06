"use client"
import { fetchApi, BackendInterview } from "@/api-client"


import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"

export default function PanelInterviewsPage() {
  const [interviews, setInterviews] = useState<BackendInterview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInterviews()
  }, [])

  const fetchInterviews = async () => {
    try {
      const res = await fetchApi(`/api/interviews`)
      const data = await res.json()
      setInterviews(data.interviews || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", 
      hour: "2-digit", minute: "2-digit"
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", 
      month: "short", day: "numeric", year: "numeric"
    })
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>My Assignments</span>
        </div>
        <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
          Assigned Interviews
        </h1>
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DATE & TIME</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">STATUS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
              ) : interviews.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono">NO INTERVIEWS ASSIGNED.</td></tr>
              ) : (
                interviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                    <td className="p-4">
                      <p className="text-[#f4ede4] font-medium">{formatDate(interview.date)}</p>
                      <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">
                        {formatTime(interview.start_time)} - {formatTime(interview.end_time)}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-[#f4ede4] font-medium">{interview.application?.name}</p>
                      <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">{interview.application?.domain}</p>
                    </td>
                    <td className="p-4">
                      <StatusPill status={interview.status.toLowerCase() === 'completed' || interview.status === 'FEEDBACK_SUBMITTED' ? 'completed' : 'active'}>
                        {interview.status}
                      </StatusPill>
                    </td>
                    <td className="p-4 flex gap-3">
                      <Link href={`/panel/interview/room?id=${interview.id}`}>
                        <Button variant="ghost" className="py-2 px-4 text-xs">VIEW</Button>
                      </Link>
                      {interview.status !== "FEEDBACK_SUBMITTED" && (
                        <Link href={`/panel/feedback/submit?id=${interview.id}`}>
                          <Button variant="primary" className="py-2 px-4 text-xs">EVALUATE</Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
