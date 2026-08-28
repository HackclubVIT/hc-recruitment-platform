"use client"
import { fetchApi } from "@/api-client"


import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

export default function RecruiterMeetingsPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Upcoming")
  const [search, setSearch] = useState("")

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
    return new Date(dateStr).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit"
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", month: "short", day: "numeric", year: "numeric"
    })
  }

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
  }

  const isUpcoming = (dateStr: string) => {
    return new Date(dateStr) > new Date()
  }

  const [dateFilter, setDateFilter] = useState("")
  const [panelFilter, setPanelFilter] = useState("ALL")

  // Extract unique panels for filter dropdown
  const uniquePanels = Array.from(new Set(interviews.map(inv => inv.panel?.name))).filter(Boolean)

  // Filter based on tabs, search, and explicit filters
  const filteredInterviews = interviews.filter(inv => {
    let tabMatch = false
    if (activeTab === "Upcoming") tabMatch = isUpcoming(inv.start_time) && inv.status !== "CANCELLED"
    if (activeTab === "Today") tabMatch = isToday(inv.start_time)
    if (activeTab === "Completed") tabMatch = inv.status === "COMPLETED" || inv.status === "FEEDBACK_SUBMITTED"
    if (activeTab === "Cancelled") tabMatch = inv.status === "CANCELLED"

    let searchMatch = inv.candidate?.name.toLowerCase().includes(search.toLowerCase())

    let dateMatch = true
    if (dateFilter) {
      const invDate = new Date(inv.date).toISOString().split('T')[0]
      dateMatch = invDate === dateFilter
    }

    let panelMatch = true
    if (panelFilter !== "ALL") {
      panelMatch = inv.panel?.name === panelFilter
    }

    return tabMatch && searchMatch && dateMatch && panelMatch
  })

  // Calendar logic
  const [viewMode, setViewMode] = useState<"LIST" | "CALENDAR">("LIST")
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Meetings Module</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            Meetings Dashboard
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex bg-[#120202] border border-[#2a0d0d] rounded-md overflow-hidden p-1">
            <button 
              onClick={() => setViewMode("LIST")}
              className={`px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors ${viewMode === "LIST" ? "bg-[#ac120c] text-[#f4ede4]" : "text-[#bfa8a2] hover:text-[#f4ede4]"}`}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode("CALENDAR")}
              className={`px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors ${viewMode === "CALENDAR" ? "bg-[#ac120c] text-[#f4ede4]" : "text-[#bfa8a2] hover:text-[#f4ede4]"}`}
            >
              Calendar
            </button>
          </div>
          <Link href="/recruiter/meetings/schedule">
            <Button variant="cta">SCHEDULE</Button>
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#2a0d0d] pb-2">
        {["Upcoming", "Today", "Completed", "Cancelled"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-2 font-mono text-[13px] uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? "text-[#d07d22] border-b-2 border-[#d07d22]" 
                : "text-[#bfa8a2] hover:text-[#f4ede4]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="flex flex-col sm:flex-row gap-4 p-4 items-center">
        <div className="w-full sm:w-1/3">
          <Input 
            placeholder="Search candidate..." 
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-1/3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-none font-mono text-[13px] focus:outline-none focus:border-[#d07d22] transition-colors"
          />
        </div>
        <div className="w-full sm:w-1/3">
          <select
            value={panelFilter}
            onChange={(e) => setPanelFilter(e.target.value)}
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-none font-mono text-[13px] focus:outline-none focus:border-[#d07d22] transition-colors"
          >
            <option value="ALL">All Panels</option>
            {uniquePanels.map((p: any) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </Card>

      {viewMode === "LIST" ? (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">PANEL</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DATE & TIME</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">STATUS</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">MEETING</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a0d0d]">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
                ) : filteredInterviews.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">NO INTERVIEWS MATCH THIS CRITERIA.</td></tr>
                ) : (
                  filteredInterviews.map((interview) => (
                    <tr key={interview.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                      <td className="p-4">
                        <p className="text-[#f4ede4] font-medium">{interview.candidate?.name}</p>
                        <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">{interview.candidate?.department}</p>
                      </td>
                      <td className="p-4 text-[#f4ede4] font-medium">
                        {interview.panel?.name}
                      </td>
                      <td className="p-4">
                        <p className="text-[#f4ede4] font-medium">{formatDate(interview.date)}</p>
                        <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">
                          {formatTime(interview.start_time)}
                        </p>
                      </td>
                      <td className="p-4">
                        <StatusPill status={interview.status.toLowerCase().includes('cancel') ? 'rejected' : 'active'}>
                          {interview.status}
                        </StatusPill>
                      </td>
                      <td className="p-4 flex gap-2">
                        {interview.meeting_link ? (
                          <a href={interview.meeting_link} target="_blank" className="text-[#2e7d32] font-medium text-sm hover:underline">
                            JOIN
                          </a>
                        ) : (
                          <span className="text-[#bfa8a2] font-mono text-[11px]">N/A</span>
                        )}
                        {interview.status !== "CANCELLED" && interview.status !== "COMPLETED" && (
                          <button 
                            onClick={async () => {
                              if(confirm("Cancel this interview?")) {
                                await fetchApi(`/api/interviews/${interview.id}`, {   method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) })
                                // In a real app we'd trigger a re-fetch here, but for brevity we rely on a manual refresh or a state update function
                                window.location.reload()
                              }
                            }}
                            className="text-[#ac120c] font-mono text-[10px] ml-2 hover:underline uppercase"
                          >
                            CANCEL
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map(empty => (
              <div key={`empty-${empty}`} className="min-h-[100px] bg-[#0a0202]/50 border border-[#2a0d0d]/30 rounded-md"></div>
            ))}
            {calendarDays.map(day => {
              const dayInterviews = filteredInterviews.filter(inv => {
                const d = new Date(inv.date)
                return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear
              })

              return (
                <div key={day} className="min-h-[100px] bg-[#120202] border border-[#2a0d0d] rounded-md p-2 flex flex-col gap-1 transition-colors hover:border-[#d07d22]/50">
                  <span className="font-mono text-[12px] text-[#f4ede4]">{day}</span>
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayInterviews.map(inv => (
                      <div key={inv.id} className="text-[10px] font-mono bg-[#ac120c]/20 text-[#f4ede4] p-1 rounded-sm whitespace-nowrap overflow-hidden text-ellipsis border border-[#ac120c]/30">
                        {formatTime(inv.start_time)} {inv.candidate?.name}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
