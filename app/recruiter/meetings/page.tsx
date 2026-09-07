"use client"
import { fetchApi } from "@/api-client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { downloadInterviewsCsv } from "@/lib/csvExport"

export default function RecruiterMeetingsPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Upcoming")
  const [search, setSearch] = useState("")

  // Reschedule Modal State
  const [rescheduleData, setRescheduleData] = useState<{ id: number, panel_id: number, date: string, start_time: string } | null>(null)
  const [rescheduleError, setRescheduleError] = useState("")
  const [rescheduling, setRescheduling] = useState(false)

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
    return new Date(dateStr).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", month: "short", day: "numeric", year: "numeric" })
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

  const uniquePanels = Array.from(new Set(interviews.map(inv => inv.panel?.name))).filter(Boolean)

  const filteredInterviews = interviews.filter(inv => {
    let tabMatch = false
    if (activeTab === "Upcoming") tabMatch = isUpcoming(inv.start_time) && inv.status !== "CANCELLED"
    if (activeTab === "Today") tabMatch = isToday(inv.start_time)
    if (activeTab === "Completed") tabMatch = inv.status === "COMPLETED" || inv.status === "FEEDBACK_SUBMITTED"
    if (activeTab === "Cancelled") tabMatch = inv.status === "CANCELLED"

    const searchMatch = inv.application?.name.toLowerCase().includes(search.toLowerCase())

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

  const [viewMode, setViewMode] = useState<"LIST" | "CALENDAR">("LIST")
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rescheduleData) return
    setRescheduling(true)
    setRescheduleError("")

    try {
      const res = await fetchApi(`/api/interviews/${rescheduleData.id}`, {  
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: rescheduleData.date,
          start_time: rescheduleData.start_time
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Rescheduling failed")
      
      setRescheduleData(null)
      fetchInterviews()
    } catch (err: unknown) {
      setRescheduleError((err instanceof Error ? err.message : String(err)))
    } finally {
      setRescheduling(false)
    }
  }

  const generateSlots = () => {
    const slots = []
    for (let h = 10; h <= 17; h++) {
      for (let m = 0; m < 60; m += 10) {
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
      }
    }
    return slots
  }

  const allSlots = generateSlots()

  const getOccupiedSlots = () => {
    if (!rescheduleData || !rescheduleData.date) return new Set()
    
    const occupied = new Set()
    interviews.forEach(inv => {
      if (inv.id === rescheduleData.id) return
      
      if (inv.panel_id === rescheduleData.panel_id) {
        const invDate = new Date(inv.date).toISOString().split('T')[0]
        if (invDate === rescheduleData.date) {
          const invTime = new Date(inv.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
          occupied.add(invTime)
        }
      }
    })
    return occupied
  }

  const occupiedSlots = getOccupiedSlots()

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out] pb-10">
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
        <div className="flex gap-3 items-center flex-wrap">
          <Button 
            variant="ghost" 
            onClick={() => downloadInterviewsCsv(filteredInterviews, dateFilter, panelFilter)}
            className="border-[#2a0d0d] hover:border-[#ac120c]/50 text-[#d07d22] flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            EXPORT SHEET
          </Button>
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
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
            {uniquePanels.map((p: string) => (
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
                        <p className="text-[#f4ede4] font-medium">{interview.application?.name}</p>
                        <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">{interview.application?.domain}</p>
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
                      <td className="p-4 flex gap-2 items-center flex-wrap">
                        {interview.meeting_link ? (
                          <a href={interview.meeting_link} target="_blank" className="text-[#2e7d32] font-medium text-sm hover:underline">
                            JOIN
                          </a>
                        ) : (
                          <span className="text-[#bfa8a2] font-mono text-[11px]">N/A</span>
                        )}
                        {interview.status !== "CANCELLED" && interview.status !== "COMPLETED" && (
                          <>
                            <button 
                              onClick={async () => {
                                if(confirm("Mark this interview as COMPLETED?")) {
                                  await fetchApi(`/api/interviews/${interview.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) })
                                  fetchInterviews()
                                }
                              }}
                              className="text-[#2ecc71] font-mono text-[10px] ml-4 hover:underline uppercase"
                            >
                              COMPLETE
                            </button>
                            <button 
                              onClick={() => setRescheduleData({ 
                                id: interview.id, 
                                panel_id: interview.panel_id,
                                date: new Date(interview.date).toISOString().split('T')[0],
                                start_time: new Date(interview.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) 
                              })}
                              className="text-[#d07d22] font-mono text-[10px] ml-2 hover:underline uppercase"
                            >
                              RESCHEDULE
                            </button>
                            <button 
                              onClick={async () => {
                                if(confirm("Cancel this interview?")) {
                                  await fetchApi(`/api/interviews/${interview.id}`, {   method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) })
                                  fetchInterviews()
                                }
                              }}
                              className="text-[#ac120c] font-mono text-[10px] ml-2 hover:underline uppercase"
                            >
                              CANCEL
                            </button>
                          </>
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
                        {formatTime(inv.start_time)} {inv.application?.name}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Modal isOpen={!!rescheduleData} onClose={() => setRescheduleData(null)}>
        <h2 className="font-display font-bold text-[24px] text-[#f4ede4] mb-6">Reschedule Interview</h2>
        {rescheduleError && (
          <div className="bg-[#ac120c]/10 border border-[#ac120c]/50 text-[#ac120c] p-3 rounded-lg text-sm font-medium mb-4">
            {rescheduleError}
          </div>
        )}
        <form onSubmit={handleReschedule} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Date</label>
            <Input 
              type="date"
              value={rescheduleData?.date || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRescheduleData(prev => prev ? { ...prev, date: e.target.value, start_time: "" } : null)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Time Slot (10 mins)</label>
            <select
              value={rescheduleData?.start_time || ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRescheduleData(prev => prev ? { ...prev, start_time: e.target.value } : null)}
              className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono focus:border-[#d07d22] outline-none"
              required
              disabled={!rescheduleData?.date}
            >
              <option value="" disabled>Select Slot</option>
              {allSlots.map(slot => {
                const isOccupied = occupiedSlots.has(slot)
                return (
                  <option key={slot} value={slot} disabled={isOccupied}>
                    {slot} {isOccupied ? "(Occupied)" : "(Available)"}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setRescheduleData(null)}>CANCEL</Button>
            <Button type="submit" variant="cta" disabled={rescheduling}>
              {rescheduling ? "SAVING..." : "CONFIRM"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
