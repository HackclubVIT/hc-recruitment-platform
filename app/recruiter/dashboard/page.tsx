"use client"
import { api, RecruitmentApplication, fetchApi } from "@/api-client"


import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"

export default function RecruiterDashboard() {
  const router = useRouter()
  const [data, setData] = useState<{
    stats: { pendingReviewsCount: number, shortlistedCount: number, selectedCount: number, interviewsTodayCount: number };
    recentApplications: RecruitmentApplication[];
    departments: string[];
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchApi("/api/recruiter/dashboard")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (e) {
        console.error("Failed to fetch dashboard data:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8 text-[#bfa8a2] font-mono">LOADING RECRUITER DASHBOARD...</div>
  }

  function mapAppStatus(status: string): "active" | "pending" | "inactive" | "scheduled" | "completed" | "cancelled" | "rejected" | "selected" {
    const s = status.toUpperCase()
    if (s === "SELECTED") return "selected"
    if (s === "SHORTLISTED" || s === "FURTHER_ROUND") return "active"
    if (s === "INTERVIEW_SCHEDULED" || s === "INTERVIEW_COMPLETED" || s === "FEEDBACK_PENDING" || s === "FEEDBACK_SUBMITTED") return "scheduled"
    if (s === "UNDER_REVIEW") return "pending"
    if (s === "APPLIED" || s === "PENDING") return "pending"
    if (s === "WAITLISTED") return "inactive"
    if (s.includes("REJECT")) return "rejected"
    return "pending"
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata",
      month: "short", day: "numeric", year: "numeric"
    })

  const { stats, recentApplications, departments } = data || { stats: { pendingReviewsCount: 0, shortlistedCount: 0, selectedCount: 0, interviewsTodayCount: 0 }, recentApplications: [], departments: [] }

  return (
    <div className="flex flex-col gap-10 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Department Recruitment</span>
        </div>
        <h1 className="font-display font-bold text-[clamp(30px,4.6vw,52px)] leading-[1.08] text-[#f4ede4]">
          Recruiter Dashboard
        </h1>
        <p className="text-[#bfa8a2] font-body text-[16px] max-w-2xl mt-2">
          Manage candidates, review applications, and schedule interviews for the {departments.join(", ")} department(s).
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col justify-between min-h-[120px] group">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Pending Reviews</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display font-black text-[36px] leading-none text-[#d07d22]">{stats.pendingReviewsCount}</span>
          </div>
        </Card>
        <Card className="flex flex-col justify-between min-h-[120px] group">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Shortlisted</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display font-black text-[36px] leading-none text-[#f39c12]">{stats.shortlistedCount}</span>
          </div>
        </Card>
        <Card className="flex flex-col justify-between min-h-[120px] group">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Selected</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display font-black text-[36px] leading-none text-[#2ecc71]">{stats.selectedCount || 0}</span>
          </div>
        </Card>
        <Card className="flex flex-col justify-between min-h-[120px] group">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Interviews Today</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display font-black text-[36px] leading-none text-[#f4ede4]">{stats.interviewsTodayCount}</span>
          </div>
        </Card>
      </div>

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-[19px] text-[#f4ede4] flex items-center gap-3">
            <DiamondIcon className="text-[#ac120c]" />
            Recent Applications
          </h2>
          <Button variant="ghost" onClick={() => router.push("/recruiter/candidates")}>VIEW ALL</Button>
        </div>
        
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">APPLIED ON</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">STATUS</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a0d0d]">
                {recentApplications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono">NO RECENT APPLICATIONS.</td>
                  </tr>
                ) : (
                  recentApplications.map((app: RecruitmentApplication) => (
                    <tr key={app.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                      <td className="p-4">
                        <p className="text-[#f4ede4] font-medium">{app.name}</p>
                        <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">{app.domain}</p>
                      </td>
                      <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">
                        {app.appliedDate ? formatDate(app.appliedDate) : "-"}
                      </td>
                      <td className="p-4">
                        <StatusPill status={mapAppStatus(app.status)}>
                          {app.status}
                        </StatusPill>
                      </td>
                      <td className="p-4">
                        <Button variant="primary" className="py-2 px-4 text-xs" onClick={() => router.push(`/recruiter/candidates/view?id=${app.id}`)}>REVIEW</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}
