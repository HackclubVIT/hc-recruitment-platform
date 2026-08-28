"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"

export default function CandidateProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [candidate, setCandidate] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCandidate()
  }, [])

  const fetchCandidate = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/candidates/${resolvedParams.id}`)
      const data = await res.json()
      setCandidate(data.candidate)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (status: string) => {
    try {
      const appId = candidate.applications[0].id
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      fetchCandidate()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-[#bfa8a2] font-mono">LOADING PROFILE...</div>
  if (!candidate) return <div className="p-8 text-[#ac120c] font-mono">CANDIDATE NOT FOUND</div>

  const appStatus = candidate.applications?.[0]?.status || "APPLIED"

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Candidate Dossier</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
              {candidate.name}
            </h1>
            <p className="font-mono text-[#bfa8a2] mt-1">{candidate.registration_number}</p>
          </div>
          <StatusPill status={appStatus.toLowerCase().includes('reject') ? 'rejected' : 'pending'}>
            {appStatus}
          </StatusPill>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-8">
            <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-mono text-[#d07d22] text-[10px] tracking-widest">EMAIL</p>
                <p className="text-[#f4ede4] font-medium">{candidate.email}</p>
              </div>
              <div>
                <p className="font-mono text-[#d07d22] text-[10px] tracking-widest">PHONE</p>
                <p className="text-[#f4ede4] font-medium">{candidate.phone}</p>
              </div>
              <div>
                <p className="font-mono text-[#d07d22] text-[10px] tracking-widest">DEPARTMENT</p>
                <p className="text-[#f4ede4] font-medium">{candidate.department}</p>
              </div>
              <div>
                <p className="font-mono text-[#d07d22] text-[10px] tracking-widest">RESUME</p>
                <a href={candidate.resume_url} target="_blank" className="text-[#2e7d32] font-medium hover:underline">
                  VIEW DOCUMENT
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-4">
              Interview History
            </h2>
            {candidate.interviews?.length === 0 ? (
              <p className="text-[#bfa8a2] text-sm">No interviews scheduled yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {candidate.interviews.map((interview: any) => (
                  <div key={interview.id} className="p-4 border border-[#2a0d0d] rounded-lg bg-[#120202]">
                    <div className="flex justify-between items-center">
                      <p className="text-[#f4ede4] font-medium">Round {interview.round}</p>
                      <StatusPill status="completed">{interview.status}</StatusPill>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-6 bg-[#0a0202]">
            <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-4">
              Recruiter Actions
            </h2>
            <div className="flex flex-col gap-3">
              {appStatus === "APPLIED" && (
                <>
                  <Button onClick={() => handleAction("SHORTLISTED")} variant="primary" className="w-full justify-center">
                    SHORTLIST CANDIDATE
                  </Button>
                  <Button onClick={() => handleAction("REJECTED")} variant="ghost" className="w-full justify-center text-[#ac120c] border-[#ac120c]/30 hover:bg-[#ac120c]/10">
                    REJECT
                  </Button>
                </>
              )}
              {appStatus === "SHORTLISTED" && (
                <Button onClick={() => router.push(`/recruiter/meetings/schedule?candidate=${candidate.id}`)} variant="cta" className="w-full justify-center">
                  SCHEDULE INTERVIEW
                </Button>
              )}
              {appStatus === "INTERVIEW_COMPLETED" && (
                <>
                  <Button onClick={() => handleAction("SELECTED")} variant="primary" className="w-full justify-center !bg-[#2e7d32] !text-white border-none">
                    FINAL SELECT
                  </Button>
                  <Button onClick={() => handleAction("WAITLISTED")} variant="ghost" className="w-full justify-center text-[#d07d22] border-[#d07d22]/30 hover:bg-[#d07d22]/10">
                    WAITLIST
                  </Button>
                  <Button onClick={() => handleAction("FURTHER_ROUND")} variant="ghost" className="w-full justify-center text-[#d07d22] border-[#d07d22]/30 hover:bg-[#d07d22]/10">
                    FURTHER ROUND
                  </Button>
                  <Button onClick={() => handleAction("REJECTED")} variant="ghost" className="w-full justify-center text-[#ac120c] border-[#ac120c]/30 hover:bg-[#ac120c]/10">
                    REJECT
                  </Button>
                </>
              )}
            </div>
          </Card>

          {candidate.applications?.[0]?.answers && (
            <Card className="p-6">
              <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-4">
                Application Answers
              </h2>
              <div className="flex flex-col gap-4 text-sm text-[#f4ede4]">
                {Object.entries(candidate.applications[0].answers).map(([qId, ans]: any) => (
                  <div key={qId} className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] text-[#d07d22]">QUESTION ID: {qId}</span>
                    <span className="bg-[#120202] p-2 rounded-md border border-[#2a0d0d]">{ans}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {candidate.interviews?.length > 0 && candidate.interviews[0].feedback?.length > 0 && (
            <Card className="p-6 bg-[#1a0606] border-[#2a0d0d]">
              <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-4">
                Interview Feedback
              </h2>
              {candidate.interviews[0].feedback.map((fb: any) => (
                <div key={fb.id} className="flex flex-col gap-2 mb-4 pb-4 border-b border-[#2a0d0d] last:border-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[#f4ede4] font-medium text-sm">Panel Member #{fb.panel_member_id}</span>
                    <StatusPill status={fb.decision === 'RECOMMENDED' ? 'active' : fb.decision === 'REJECTED' ? 'rejected' : 'pending'}>
                      {fb.decision}
                    </StatusPill>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex justify-between font-mono text-[10px] text-[#bfa8a2]"><span>TECH:</span> <span className="text-[#f4ede4]">{fb.technical_score}/5</span></div>
                    <div className="flex justify-between font-mono text-[10px] text-[#bfa8a2]"><span>COMM:</span> <span className="text-[#f4ede4]">{fb.communication_score}/5</span></div>
                    <div className="flex justify-between font-mono text-[10px] text-[#bfa8a2]"><span>PROBLEM:</span> <span className="text-[#f4ede4]">{fb.problem_solving_score}/5</span></div>
                    <div className="flex justify-between font-mono text-[10px] text-[#bfa8a2]"><span>CONF:</span> <span className="text-[#f4ede4]">{fb.confidence_score}/5</span></div>
                    <div className="flex justify-between font-mono text-[10px] text-[#bfa8a2]"><span>TEAM:</span> <span className="text-[#f4ede4]">{fb.teamwork_score}/5</span></div>
                  </div>
                  {fb.comments && (
                    <p className="text-[#bfa8a2] text-xs mt-2 italic bg-[#0a0202] p-2 rounded">"{fb.comments}"</p>
                  )}
                </div>
              ))}
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
