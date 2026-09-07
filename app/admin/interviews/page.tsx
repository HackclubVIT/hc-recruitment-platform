"use client"
import { fetchApi } from "@/api-client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { downloadInterviewsCsv } from "@/lib/csvExport"
import Link from "next/link"

export default function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [panels, setPanels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [panelFilter, setPanelFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Reschedule Modal State
  const [rescheduleData, setRescheduleData] = useState<{ id: number, panel_id: number, date: string, start_time: string } | null>(null)
  const [rescheduleError, setRescheduleError] = useState("")
  const [rescheduling, setRescheduling] = useState(false)

  useEffect(() => {
    fetchInterviews()
    fetchPanels()
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

  const fetchPanels = async () => {
    try {
      const res = await fetchApi(`/api/panels`)
      const data = await res.json()
      setPanels(data.panels || [])
    } catch (err) {
      console.error("Failed to load panels:", err)
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

  // Derive unique panels from both fetched panels and loaded interviews
  const panelNamesSet = new Set<string>()
  panels.forEach(p => p.name && panelNamesSet.add(p.name))
  interviews.forEach(inv => inv.panel?.name && panelNamesSet.add(inv.panel.name))
  const uniquePanels = Array.from(panelNamesSet).sort()

  const filteredInterviews = interviews.filter((inv) => {
    const searchMatch = !search ||
      inv.application?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.application?.registerNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.application?.domain?.toLowerCase().includes(search.toLowerCase());

    let dateMatch = true;
    if (dateFilter) {
      const invDate = new Date(inv.date).toISOString().split('T')[0];
      dateMatch = invDate === dateFilter;
    }

    let panelMatch = true;
    if (panelFilter !== "ALL") {
      panelMatch = inv.panel?.name === panelFilter;
    }

    let statusMatch = true;
    if (statusFilter !== "ALL") {
      statusMatch = inv.status === statusFilter;
    }

    return searchMatch && dateMatch && panelMatch && statusMatch;
  });

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

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this interview?")) return
    try {
      await fetchApi(`/api/interviews/${id}`, {  
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" })
      })
      fetchInterviews()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out] pb-10">
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Global Data View</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            All Interviews
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
          <Link href="/admin/interviews/schedule">
            <Button variant="cta">SCHEDULE</Button>
          </Link>
        </div>
      </header>

      {/* Filters Bar */}
      <Card className="p-4 bg-[#120202] border-[#2a0d0d] flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input 
            placeholder="Search candidate, domain, reg no..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a0606] border-[#2a0d0d] text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase">Date:</span>
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-[#1a0606] border border-[#2a0d0d] text-[#f4ede4] px-3 py-2 text-xs font-mono rounded-none focus:outline-none focus:border-[#d07d22]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase">Panel:</span>
          <select 
            value={panelFilter}
            onChange={(e) => setPanelFilter(e.target.value)}
            className="bg-[#1a0606] border border-[#2a0d0d] text-[#f4ede4] px-3 py-2 text-xs font-mono rounded-none focus:outline-none focus:border-[#d07d22]"
          >
            <option value="ALL">All Panels</option>
            {uniquePanels.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase">Status:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1a0606] border border-[#2a0d0d] text-[#f4ede4] px-3 py-2 text-xs font-mono rounded-none focus:outline-none focus:border-[#d07d22]"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {(search || dateFilter || panelFilter !== "ALL" || statusFilter !== "ALL") && (
          <button 
            onClick={() => {
              setSearch("");
              setDateFilter("");
              setPanelFilter("ALL");
              setStatusFilter("ALL");
            }}
            className="text-xs font-mono text-[#ac120c] hover:underline"
          >
            CLEAR FILTERS
          </button>
        )}

        <div className="ml-auto font-mono text-[11px] text-[#bfa8a2]">
          Showing {filteredInterviews.length} of {interviews.length}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DATE & TIME</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">PANEL</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">STATUS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">MEETING</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em] text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
              ) : filteredInterviews.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#bfa8a2] font-mono">NO INTERVIEWS MATCHING CURRENT FILTERS.</td></tr>
              ) : (
                filteredInterviews.map((interview) => (
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
                    <td className="p-4 text-[#f4ede4] font-medium">
                      <p>{interview.panel?.name}</p>
                      {interview.assigned_members && interview.assigned_members.length > 0 && (
                        <p className="text-[#bfa8a2] font-mono text-[10px] mt-0.5 font-normal truncate max-w-[200px]" title={interview.assigned_members.map((m: any) => m.user?.name).filter(Boolean).join(", ")}>
                          {interview.assigned_members.map((m: any) => m.user?.name).filter(Boolean).join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusPill status={interview.status.toLowerCase().includes('cancel') ? 'rejected' : interview.status.toLowerCase().includes('complete') ? 'completed' : 'active'}>
                        {interview.status}
                      </StatusPill>
                    </td>
                    <td className="p-4">
                      {interview.meeting_link ? (
                        <a href={interview.meeting_link} target="_blank" className="text-[#2e7d32] font-medium text-sm hover:underline">
                          JOIN
                        </a>
                      ) : (
                        <span className="text-[#bfa8a2] font-mono text-[11px]">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      {interview.status === "SCHEDULED" && (
                        <>
                          <Button 
                            variant="ghost" 
                            className="text-[10px] py-1 px-3"
                            onClick={() => setRescheduleData({ 
                              id: interview.id, 
                              panel_id: interview.panel_id,
                              date: new Date(interview.date).toISOString().split('T')[0],
                              start_time: new Date(interview.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) 
                            })}
                          >
                            RESCHEDULE
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="text-[#ac120c] text-[10px] py-1 px-3"
                            onClick={() => handleCancel(interview.id)}
                          >
                            CANCEL
                          </Button>
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
