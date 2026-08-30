"use client"
import { fetchApi, RecruitmentApplication } from "@/api-client"
import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"

export default function RecruitieDashboard() {
  const [data, setData] = useState<{ application: RecruitmentApplication } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchApi("/api/applications/me")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else if (res.status === 401 || res.status === 403) {
          window.location.href = "/login"
        } else if (res.status === 404) {
          window.location.href = "/" // Redirect to home if no application
        } else {
          setError("Internal server error. Please try again later.")
        }
      } catch (e) {
        console.error("Failed to fetch dashboard data:", e)
        setError("Network error occurred.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8 text-[#bfa8a2] font-mono">LOADING YOUR DASHBOARD...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col gap-10 animate-[fadeIn_0.5s_ease-out]">
        <header className="flex flex-col gap-2">
           <h1 className="font-display font-bold text-[clamp(30px,4.6vw,52px)] leading-[1.08] text-[#f4ede4]">
             Applicant Dashboard
           </h1>
           <p className="text-[#ac120c] font-body text-[16px] max-w-2xl mt-2 font-bold">
             {error}
           </p>
        </header>
      </div>
    )
  }

  if (!data?.application) return null

  const { application } = data

  const renderStatus = () => {
    const rawStatus = application.status
    let displayStatus = "UNKNOWN"
    let subStatus = ""
    let variant: "active" | "rejected" | "pending" = "pending"

    switch (rawStatus) {
      case "SHORTLISTED":
        displayStatus = "SHORTLISTED"
        variant = "active"
        break
      case "INTERVIEW_SCHEDULED":
        displayStatus = "SHORTLISTED"
        subStatus = "INTERVIEW SCHEDULED"
        variant = "active"
        break
      case "REJECTED":
        displayStatus = "NOT SHORTLISTED / REJECTED"
        variant = "rejected"
        break
      case "PENDING":
      case "UNDER_REVIEW":
      case "APPLIED":
        displayStatus = "APPLICATION UNDER REVIEW"
        variant = "pending"
        break
      case "SELECTED":
        displayStatus = "SELECTED"
        variant = "active"
        break
      case "WAITLISTED":
        displayStatus = "WAITLISTED"
        variant = "pending"
        break
      case "FURTHER_ROUND":
        displayStatus = "FURTHER ROUND REQUIRED"
        variant = "pending"
        break
      case "INTERVIEW_COMPLETED":
        displayStatus = "INTERVIEW COMPLETED"
        variant = "pending"
        break
      default:
        displayStatus = rawStatus
    }

    return (
      <div className="flex flex-col gap-2">
        <StatusPill status={variant} className="w-fit text-lg py-2 px-6">
          {displayStatus}
        </StatusPill>
        {subStatus && (
          <p className="text-[#f4ede4] font-mono text-[13px] tracking-wider mt-2">
            Status Update: {subStatus}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#ac120c] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>My Application</span>
        </div>
        <h1 className="font-display font-bold text-[clamp(30px,4.6vw,52px)] leading-[1.08] text-[#f4ede4]">
          Applicant Dashboard
        </h1>
        <p className="text-[#bfa8a2] font-body text-[16px] max-w-2xl mt-2">
          View your submitted recruitment application and current status here.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col justify-between gap-4">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Current Status</span>
          {renderStatus()}
        </Card>

        {application.interviews && application.interviews.length > 0 && (
          <Card className="flex flex-col gap-4 bg-[#ac120c]/10 border-[#ac120c]/30">
            <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Interview Information</span>
            {application.interviews.sort((a, b) => b.round - a.round).slice(0, 1).map((interview) => (
              <div key={interview.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#f4ede4] font-medium">Round {interview.round}</span>
                  <span className="text-[11px] font-mono text-[#d07d22] uppercase">{interview.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm text-[#bfa8a2]">
                  <div>Date: <span className="text-[#f4ede4]">{new Date(interview.date).toLocaleDateString()}</span></div>
                  <div>Time: <span className="text-[#f4ede4]">{new Date(interview.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                </div>
                {interview.meeting_link && interview.status === "SCHEDULED" && (
                  <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="mt-2 text-[#f4ede4] bg-[#ac120c] hover:bg-[#c2140d] px-4 py-2 rounded text-center text-sm font-medium transition-colors">
                    Join Meeting
                  </a>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>

      <section className="flex flex-col gap-6">
        <h2 className="font-display font-bold text-[19px] text-[#f4ede4] flex items-center gap-3">
          <DiamondIcon className="text-[#ac120c]" />
          Application Details
        </h2>
        
        <Card className="p-6 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-left">
            <div>
              <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Name</span>
              <p className="text-[#f4ede4] font-medium text-[16px] mt-1">{application.name}</p>
            </div>
            <div>
              <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Email</span>
              <p className="text-[#f4ede4] font-medium text-[16px] mt-1">{application.email}</p>
            </div>
            <div>
              <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Register Number</span>
              <p className="text-[#f4ede4] font-medium text-[16px] mt-1">{application.registerNumber}</p>
            </div>
            <div>
              <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Department</span>
              <p className="text-[#f4ede4] font-medium text-[16px] mt-1">{application.domain || "N/A"}</p>
            </div>
            <div>
              <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Technical Skills</span>
              <p className="text-[#f4ede4] font-medium text-[16px] mt-1 whitespace-pre-wrap">
                {application.technicalSkills ? (typeof application.technicalSkills === 'string' ? application.technicalSkills : JSON.stringify(application.technicalSkills)) : "N/A"}
              </p>
            </div>
            <div>
              <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Applied On</span>
              <p className="text-[#f4ede4] font-medium text-[16px] mt-1">
                {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
