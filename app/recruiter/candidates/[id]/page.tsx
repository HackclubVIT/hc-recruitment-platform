"use client"
import { fetchApi, RecruitmentApplication, BackendInterview } from "@/api-client"


import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"

export default function RecruiterCandidateProfile() {
  const { id } = useParams()
  const router = useRouter()
  const [candidate, setCandidate] = useState<RecruitmentApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCandidate()
  }, [id])

  const fetchCandidate = async () => {
    try {
      const res = await fetchApi(`/api/candidates/${id}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setCandidate(data.candidate)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (appId: string, status: string) => {
    if (!confirm(`Are you sure you want to mark this application as ${status}?`)) return;
    
    setActionLoading(true)
    setError("")
    try {
      const res = await fetchApi(`/api/applications/${appId}`, {  
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to update status")
      }
      fetchCandidate()
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-[#bfa8a2] font-mono">LOADING PROFILE...</div>
  if (!candidate) return <div className="p-8 text-center text-[#bfa8a2] font-mono">CANDIDATE NOT FOUND.</div>

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center">
        <h1 className="font-display font-bold text-[32px] sm:text-[40px] text-[#f4ede4]">
          {candidate.name}
        </h1>
        <Button variant="ghost" onClick={() => router.back()}>BACK</Button>
      </div>

      {error && (
        <div className="bg-[#ac120c]/10 border border-[#ac120c]/50 text-[#ac120c] p-4 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-[#d07d22] font-mono text-[14px] uppercase mb-4">Contact Information</h2>
          <div className="flex flex-col gap-3 text-[#f4ede4]">
            <p><span className="text-[#bfa8a2] font-mono mr-2">EMAIL:</span> {candidate.email}</p>
            <p><span className="text-[#bfa8a2] font-mono mr-2">PHONE:</span> {candidate.phoneNumber}</p>
            <p><span className="text-[#bfa8a2] font-mono mr-2">REG NO:</span> {candidate.registerNumber}</p>
            <p><span className="text-[#bfa8a2] font-mono mr-2">DEPT:</span> {candidate.domain}</p>
            {candidate.portfolio && (
              <p>
                <span className="text-[#bfa8a2] font-mono mr-2">RESUME:</span>
                <a href={candidate.portfolio} target="_blank" rel="noreferrer" className="text-[#d07d22] underline">View Resume</a>
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-[#d07d22] font-mono text-[14px] uppercase mb-4">Applications</h2>
          <div className="flex flex-col gap-4">
            {[candidate].map((app: RecruitmentApplication) => (
              <div key={app.id} className="bg-[#1a0606] p-4 rounded border border-[#2a0d0d]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[#bfa8a2] text-[12px]">Application #{app.id}</span>
                  <StatusPill status={app.status.toLowerCase().includes('reject') ? 'rejected' : 'pending'}>
                    {app.status}
                  </StatusPill>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  {(app.formSubmission?.answers?.length ?? 0) > 0 ? (
                    (app.formSubmission?.answers || []).map((ans: { question_id: number, answer: string }) => (
                      <div key={ans.question_id} className="bg-[#2a0d0d]/30 p-3 rounded">
                        <div className="font-mono text-[10px] text-[#bfa8a2] mb-1">QUESTION ID: {ans.question_id}</div>
                        <div className="font-body text-[14px] text-[#f4ede4] whitespace-pre-wrap">{String(ans.answer)}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[12px] text-[#bfa8a2]">No answers provided.</p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap border-t border-[#2a0d0d] pt-3 mt-4">
                  {(app.status === "APPLIED") && (
                    <>
                      <Button variant="ghost" onClick={() => updateApplicationStatus(app.id, "UNDER_REVIEW")} disabled={actionLoading} className="text-[#3498db] border border-[#3498db] hover:bg-[#3498db] hover:text-[#0a0202]">Mark Under Review</Button>
                      <Button variant="ghost" onClick={() => updateApplicationStatus(app.id, "REJECTED")} disabled={actionLoading} className="text-[#ac120c] border border-[#ac120c] hover:bg-[#ac120c] hover:text-[#f4ede4]">Reject</Button>
                    </>
                  )}
                  {(app.status === "UNDER_REVIEW") && (
                    <>
                      <Button variant="ghost" onClick={() => updateApplicationStatus(app.id, "SHORTLISTED")} disabled={actionLoading} className="text-[#d07d22] border border-[#d07d22] hover:bg-[#d07d22] hover:text-[#0a0202]">Shortlist</Button>
                      <Button variant="ghost" onClick={() => updateApplicationStatus(app.id, "REJECTED")} disabled={actionLoading} className="text-[#ac120c] border border-[#ac120c] hover:bg-[#ac120c] hover:text-[#f4ede4]">Reject</Button>
                    </>
                  )}
                  
                  {(app.status === "SHORTLISTED" || app.status === "FURTHER_ROUND") && (
                    <>
                      <Button variant="primary" onClick={() => router.push(`/recruiter/meetings?scheduleFor=${candidate.id}`)} disabled={actionLoading}>Schedule Interview</Button>
                      <Button variant="ghost" onClick={() => updateApplicationStatus(app.id, "REJECTED")} disabled={actionLoading} className="text-[#ac120c] border border-[#ac120c] hover:bg-[#ac120c] hover:text-[#f4ede4]">Reject</Button>
                    </>
                  )}
                  
                  {(app.status === "INTERVIEW_COMPLETED" || app.status === "WAITLISTED") && (
                    <>
                      <Button variant="ghost" onClick={() => updateApplicationStatus(app.id, "SELECTED")} disabled={actionLoading} className="text-[#2ecc71] border border-[#2ecc71] hover:bg-[#2ecc71] hover:text-[#0a0202]">Select</Button>
                      <Button variant="ghost" onClick={() => updateApplicationStatus(app.id, "WAITLISTED")} disabled={actionLoading} className="text-[#f1c40f] border border-[#f1c40f] hover:bg-[#f1c40f] hover:text-[#0a0202]">Waitlist</Button>
                      <Button variant="ghost" onClick={() => updateApplicationStatus(app.id, "FURTHER_ROUND")} disabled={actionLoading} className="text-[#3498db] border border-[#3498db] hover:bg-[#3498db] hover:text-[#0a0202]">Further Round</Button>
                      <Button variant="ghost" onClick={() => updateApplicationStatus(app.id, "REJECTED")} disabled={actionLoading} className="text-[#ac120c] border border-[#ac120c] hover:bg-[#ac120c] hover:text-[#f4ede4]">Reject</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-[#d07d22] font-mono text-[14px] uppercase mb-4">Interview History</h2>
        {candidate.interviews?.length === 0 ? (
          <p className="text-[#bfa8a2] font-mono">No interviews scheduled.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {candidate.interviews?.map((interview: BackendInterview, i: number) => (
              <div key={interview.id} className="bg-[#1a0606] p-4 rounded border border-[#2a0d0d] flex flex-col gap-4">
                <div className="flex justify-between border-b border-[#2a0d0d] pb-2">
                  <h3 className="text-[#f4ede4] font-medium">Round {i + 1} - {new Date(interview.date).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}</h3>
                  <StatusPill status={interview.status === 'COMPLETED' ? 'selected' : 'pending'}>{interview.status}</StatusPill>
                </div>
                
                <div className="flex flex-col gap-2">
                  <p className="text-[#bfa8a2] text-sm">Time: {new Date(interview.start_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })} - {new Date(interview.end_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
                  {interview.meeting_link && (
                    <a href={interview.meeting_link} target="_blank" rel="noreferrer" className="text-[#d07d22] text-sm underline">Join Meeting</a>
                  )}
                </div>

                {interview.feedback && interview.feedback.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-[#d07d22] font-mono text-[12px] uppercase mb-2">Feedback</h4>
                    {interview.feedback.map((fb: { id: number, feedback: string, user_id: string, overall_score: number, recommendation: string, comments: string }) => (
                      <div key={fb.id} className="bg-[#2a0d0d]/30 p-3 rounded mb-2 text-sm text-[#f4ede4]">
                        <p><span className="text-[#bfa8a2]">Score:</span> {fb.overall_score} / 25</p>
                        <p><span className="text-[#bfa8a2]">Recommendation:</span> {fb.recommendation}</p>
                        <p className="mt-1 text-[#bfa8a2] italic">"{fb.comments}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
