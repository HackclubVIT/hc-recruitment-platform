"use client"
import { fetchApi } from "@/api-client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import Link from "next/link"

export default function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
    return new Date(dateStr).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", 
      hour: "2-digit", minute: "2-digit"
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", 
      month: "short", day: "numeric", year: "numeric"
    })
  }

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
      // Don't block the slot of the interview being rescheduled
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
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out] pb-10">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Global Data View</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            All Interviews
          </h1>
        </div>
        <Link href="/admin/interviews/schedule">
          <Button variant="cta">SCHEDULE</Button>
        </Link>
      </header>

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
              ) : interviews.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#bfa8a2] font-mono">NO INTERVIEWS FOUND.</td></tr>
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
                    <td className="p-4 text-[#f4ede4] font-medium">
                      {interview.panel?.name}
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
