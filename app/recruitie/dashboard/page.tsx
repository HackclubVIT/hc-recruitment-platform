"use client"
import { fetchApi, RecruitmentApplication, api } from "@/api-client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"

export default function RecruitieDashboard() {
  const router = useRouter()
  const [data, setData] = useState<{ application: RecruitmentApplication | null; announcements?: any[] } | null>(null)
  const [currentUser, setCurrentUser] = useState<{ name?: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Also fetch user profile for contextual display
      try {
        const userRes = await api.getMe()
        if (userRes?.user) {
          setCurrentUser(userRes.user)
        }
      } catch (err) {
        console.warn("Could not retrieve current user profile", err)
      }

      const res = await fetchApi("/api/applications/me")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login")
      } else if (res.status === 404) {
        // No application found for this account
        setData({ application: null, announcements: [] })
      } else {
        setError("Unable to load application details. Please try again later.")
      }
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e)
      setError("A network error occurred while connecting to the server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogout = async () => {
    try {
      await fetchApi("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (err) {
      router.push("/login")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-[fadeIn_0.3s_ease-out] w-full max-w-4xl">
        <header className="flex flex-col gap-2">
          <div className="h-4 w-32 bg-[#2a0d0d] rounded animate-pulse" />
          <div className="h-10 w-72 bg-[#2a0d0d] rounded animate-pulse" />
          <div className="h-4 w-96 bg-[#2a0d0d]/60 rounded animate-pulse" />
        </header>

        <Card className="p-8 border border-[#2a0d0d] bg-[#120202] flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-10 h-10 border-2 border-[#d07d22] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm tracking-widest text-[#bfa8a2] uppercase">
            Loading your application status...
          </p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 animate-[fadeIn_0.3s_ease-out] w-full max-w-4xl">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#ac120c] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Applicant Dashboard</span>
          </div>
          <h1 className="font-display font-bold text-[clamp(30px,4.6vw,52px)] leading-[1.08] text-[#f4ede4]">
            Applicant Dashboard
          </h1>
        </header>

        <Card className="p-8 border border-[#ac120c]/40 bg-[#1a0606] flex flex-col gap-4">
          <div className="flex items-center gap-3 text-[#ac120c]">
            <DiamondIcon className="w-5 h-5" />
            <h2 className="font-display font-bold text-lg text-[#f4ede4]">Connection Issue</h2>
          </div>
          <p className="text-[#bfa8a2] font-body text-[15px]">{error}</p>
          <div className="pt-2">
            <button
              onClick={() => fetchData()}
              className="px-5 py-2 rounded bg-[#ac120c] hover:bg-[#c2140d] text-[#f4ede4] font-mono text-xs tracking-wider uppercase transition-colors"
            >
              Try Again
            </button>
          </div>
        </Card>
      </div>
    )
  }

  // EMPTY STATE: No application found
  if (!data?.application) {
    return (
      <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out] w-full max-w-4xl">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>My Application</span>
          </div>
          <h1 className="font-display font-bold text-[clamp(30px,4.6vw,52px)] leading-[1.08] text-[#f4ede4]">
            Applicant Dashboard
          </h1>
          <p className="text-[#bfa8a2] font-body text-[16px] max-w-2xl mt-1">
            Track your recruitment application status and updates.
          </p>
        </header>

        <Card className="p-8 sm:p-10 border-2 border-[#d07d22]/30 bg-gradient-to-b from-[#1a0606] to-[#120202] shadow-[0_0_30px_rgba(208,125,34,0.08)] flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2a0d0d] pb-6">
            <div className="flex items-center gap-3">
              <span className="bg-[#d07d22]/20 text-[#d07d22] border border-[#d07d22]/40 px-3 py-1 rounded font-mono text-[11px] font-bold uppercase tracking-wider">
                Status: Not Found
              </span>
              {currentUser?.email && (
                <span className="text-[#bfa8a2] font-mono text-[12px] truncate max-w-xs">
                  {currentUser.email}
                </span>
              )}
            </div>
            <button
              onClick={() => fetchData()}
              className="text-[#bfa8a2] hover:text-[#f4ede4] font-mono text-xs underline transition-colors"
            >
              Refresh Status
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#f4ede4] tracking-tight">
              No Application Submitted Yet
            </h2>
            <p className="text-[#bfa8a2] font-body text-[15px] leading-relaxed max-w-2xl">
              We couldn’t find an active application for <span className="text-[#f4ede4] font-semibold">Recruitment 2026</span> linked to your current account ({currentUser?.email || "this email"}).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-lg bg-[#120202] border border-[#2a0d0d] flex flex-col gap-2">
              <h3 className="font-display font-bold text-[15px] text-[#f4ede4]">
                1. Haven’t applied yet?
              </h3>
              <p className="text-[#bfa8a2] font-body text-[13px] leading-relaxed">
                Recruitment is open! Browse available domains like Web Dev, Design, AI/ML, Events, and more, and submit your form.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#120202] border border-[#2a0d0d] flex flex-col gap-2">
              <h3 className="font-display font-bold text-[15px] text-[#f4ede4]">
                2. Already applied earlier?
              </h3>
              <p className="text-[#bfa8a2] font-body text-[13px] leading-relaxed">
                Make sure you signed in with the identical email address (e.g. your VIT student mail) you filled into the application form.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/recruitment"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-[#ac120c] hover:bg-[#c2140d] text-[#f4ede4] font-display font-bold text-sm tracking-wider uppercase shadow-[0_0_15px_rgba(172,18,12,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Apply For Recruitment Now</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center px-5 py-3 rounded border border-[#2a0d0d] bg-[#120202] hover:bg-[#1a0606] text-[#bfa8a2] hover:text-[#f4ede4] font-mono text-xs tracking-wider uppercase transition-colors"
            >
              Sign In With Different Account
            </button>
          </div>
        </Card>
      </div>
    )
  }

  const { application, announcements = [] } = data

  const renderStatus = () => {
    const rawStatus = application.status.toUpperCase()
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

      {/* Department Task & Announcements Banner */}
      {announcements && announcements.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Department Tasks & Announcements</span>
          </div>
          {announcements.map((ann: any) => (
            <Card key={ann.id} className="p-6 bg-[#1a0606] border-2 border-[#d07d22]/60 shadow-[0_0_20px_rgba(208,125,34,0.15)] flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#2a0d0d] pb-3">
                <div className="flex items-center gap-3">
                  <span className="bg-[#d07d22]/20 text-[#d07d22] border border-[#d07d22]/40 px-3 py-1 rounded font-mono text-[11px] font-bold uppercase">
                    {ann.department} Task / Update
                  </span>
                  <h3 className="font-display font-bold text-[20px] text-[#f4ede4]">{ann.title}</h3>
                </div>
                <span className="text-[#bfa8a2] font-mono text-[11px]">
                  {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-[#f4ede4] text-[15px] leading-relaxed whitespace-pre-wrap font-body mt-2">
                {ann.message}
              </div>
            </Card>
          ))}
        </div>
      )}

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
