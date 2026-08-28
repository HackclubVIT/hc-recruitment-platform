"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"

export default function SingleInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [interview, setInterview] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInterview()
  }, [])

  const fetchInterview = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/interviews/${resolvedParams.id}`)
      const data = await res.json()
      setInterview(data.interview)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit"
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    })
  }

  if (loading) return <div className="p-8 text-[#bfa8a2] font-mono">LOADING INTERVIEW...</div>
  if (!interview) return <div className="p-8 text-[#ac120c] font-mono">INTERVIEW NOT FOUND</div>

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Interview Session</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            {interview.candidate?.name}
          </h1>
          <StatusPill status={interview.status.toLowerCase() === 'completed' || interview.status === 'FEEDBACK_SUBMITTED' ? 'completed' : 'active'}>
            {interview.status}
          </StatusPill>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-8">
            <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-4">
              Meeting Details
            </h2>
            <div className="flex flex-col gap-6">
              <div>
                <p className="font-mono text-[#d07d22] text-[10px] tracking-widest mb-1">DATE</p>
                <p className="text-[#f4ede4] text-lg font-medium">{formatDate(interview.date)}</p>
              </div>
              <div>
                <p className="font-mono text-[#d07d22] text-[10px] tracking-widest mb-1">TIME</p>
                <p className="text-[#f4ede4] text-lg font-medium">
                  {formatTime(interview.start_time)} - {formatTime(interview.end_time)}
                </p>
              </div>
              {interview.meeting_link && (
                <div className="mt-4">
                  <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">
                    <Button variant="cta" className="w-full sm:w-auto">JOIN MEETING</Button>
                  </a>
                </div>
              )}
            </div>
          </Card>
          
          <Card className="p-8">
            <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-4">
              Candidate Dossier
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-mono text-[#d07d22] text-[10px] tracking-widest">DEPARTMENT</p>
                <p className="text-[#f4ede4] font-medium">{interview.candidate?.department}</p>
              </div>
              <div>
                <p className="font-mono text-[#d07d22] text-[10px] tracking-widest">REG NO</p>
                <p className="text-[#f4ede4] font-medium">{interview.candidate?.registration_number}</p>
              </div>
              <div className="col-span-2">
                <p className="font-mono text-[#d07d22] text-[10px] tracking-widest">RESUME</p>
                <a href={interview.candidate?.resume_url} target="_blank" className="text-[#2e7d32] font-medium hover:underline">
                  VIEW DOCUMENT
                </a>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-6 bg-[#0a0202]">
            <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-4">
              Panel Action
            </h2>
            <div className="flex flex-col gap-3">
              {interview.status !== "FEEDBACK_SUBMITTED" ? (
                <>
                  <p className="text-[#bfa8a2] text-sm mb-4">
                    After the interview concludes, you must submit a structured evaluation for this candidate.
                  </p>
                  <Button 
                    onClick={() => router.push(`/panel/feedback/${interview.id}`)} 
                    variant="primary" 
                    className="w-full justify-center"
                  >
                    SUBMIT FEEDBACK
                  </Button>
                </>
              ) : (
                <p className="text-[#2e7d32] font-mono text-sm text-center">
                  EVALUATION SUBMITTED
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
