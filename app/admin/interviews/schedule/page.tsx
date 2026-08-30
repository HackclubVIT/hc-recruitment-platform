"use client"
import { fetchApi } from "@/api-client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

function ScheduleForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCandidateId = searchParams.get("candidate") || ""

  const [panels, setPanels] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [existingInterviews, setExistingInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    application_id: initialCandidateId ? parseInt(initialCandidateId) : "",
    panel_id: "",
    date: "",
    start_time: "",
    meeting_link: ""
  })

  useEffect(() => {
    Promise.all([
      fetchApi(`/api/panels`).then(r => r.json()),
      fetchApi(`/api/candidates?status=SHORTLISTED`).then(r => r.json()),
      fetchApi(`/api/interviews`).then(r => r.json())
    ]).then(([panelData, candidateData, interviewData]) => {
      setPanels(panelData.panels || [])
      setCandidates(candidateData.candidates || [])
      setExistingInterviews(interviewData.interviews || [])
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetchApi(`/api/interviews/schedule`, {  
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          application_id: String(formData.application_id),
          panel_id: Number(formData.panel_id)
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Scheduling failed")
      }

      router.push("/admin/interviews")
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  // Generate 10-minute slots from 10:00 to 18:00
  const generateSlots = () => {
    const slots = []
    for (let h = 10; h <= 17; h++) {
      for (let m = 0; m < 60; m += 10) {
        const hh = h.toString().padStart(2, '0')
        const mm = m.toString().padStart(2, '0')
        slots.push(`${hh}:${mm}`)
      }
    }
    return slots
  }
  
  const allSlots = generateSlots()

  // Get occupied slots for selected panel and date
  const getOccupiedSlots = () => {
    if (!formData.panel_id || !formData.date) return new Set()
    
    const occupied = new Set()
    existingInterviews.forEach(inv => {
      if (inv.panel_id.toString() === formData.panel_id.toString()) {
        const invDate = new Date(inv.date).toISOString().split('T')[0]
        if (invDate === formData.date) {
          const invTime = new Date(inv.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
          occupied.add(invTime)
        }
      }
    })
    return occupied
  }

  const occupiedSlots = getOccupiedSlots()

  return (
    <Card className="p-8 max-w-2xl">
      {error && (
        <div className="bg-[#ac120c]/10 border border-[#ac120c]/50 text-[#ac120c] p-4 rounded-lg text-sm font-medium mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Candidate</label>
          <select
            value={formData.application_id}
            onChange={e => setFormData({ ...formData, application_id: e.target.value })}
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono focus:border-[#d07d22] outline-none"
            required
          >
            <option value="" disabled>Select Shortlisted Candidate</option>
            {candidates.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.registration_number})</option>
            ))}
          </select>
        </div>

        {/* Application select removed as candidate is the application */}

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Interview Panel</label>
          <select
            value={formData.panel_id}
            onChange={e => setFormData({ ...formData, panel_id: e.target.value, start_time: "" })}
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono focus:border-[#d07d22] outline-none"
            required
          >
            <option value="" disabled>Select Panel</option>
            {panels.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Date</label>
            <Input 
              type="date"
              value={formData.date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, date: e.target.value, start_time: "" })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Time Slot (10 mins)</label>
            <select
              value={formData.start_time}
              onChange={e => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono focus:border-[#d07d22] outline-none"
              required
              disabled={!formData.date || !formData.panel_id}
            >
              <option value="" disabled>
                {!formData.date || !formData.panel_id ? "Select Panel & Date first" : "Select Slot"}
              </option>
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
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Meeting Link</label>
          <Input 
            type="url"
            placeholder="https://meet.google.com/..."
            value={formData.meeting_link}
            onChange={e => setFormData({ ...formData, meeting_link: e.target.value })}
            required
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="submit" variant="cta" disabled={loading} className="w-full sm:w-auto">
            {loading ? "SCHEDULING..." : "SCHEDULE INTERVIEW"}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default function SchedulePage() {
  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out] pb-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Meetings Module</span>
        </div>
        <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
          Schedule Interview
        </h1>
      </header>

      <Suspense fallback={<div className="text-[#bfa8a2] font-mono p-8">LOADING...</div>}>
        <ScheduleForm />
      </Suspense>
    </div>
  )
}
