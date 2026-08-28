"use client"

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    candidate_id: initialCandidateId ? parseInt(initialCandidateId) : "",
    panel_id: "",
    date: "",
    start_time: "",
    meeting_link: ""
  })

  useEffect(() => {
    // Fetch dependencies
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/panels`, { credentials: "include" }).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/candidates?status=SHORTLISTED`, { credentials: "include" }).then(r => r.json())
    ]).then(([panelData, candidateData]) => {
      setPanels(panelData.panels || [])
      setCandidates(candidateData.candidates || [])
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/interviews/schedule`, { credentials: "include", 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          candidate_id: Number(formData.candidate_id),
          panel_id: Number(formData.panel_id)
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Scheduling failed")
      }

      router.push("/admin/interviews")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
            value={formData.candidate_id}
            onChange={e => setFormData({ ...formData, candidate_id: e.target.value })}
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono focus:border-[#d07d22] outline-none"
            required
          >
            <option value="" disabled>Select Shortlisted Candidate</option>
            {candidates.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.registration_number})</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Interview Panel</label>
          <select
            value={formData.panel_id}
            onChange={e => setFormData({ ...formData, panel_id: e.target.value })}
            className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono focus:border-[#d07d22] outline-none"
            required
          >
            <option value="" disabled>Select Panel</option>
            {panels.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Date</label>
            <Input 
              type="date"
              value={formData.date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Time (10-min slots)</label>
            <Input 
              type="time"
              step="600"
              value={formData.start_time}
              onChange={e => setFormData({ ...formData, start_time: e.target.value })}
              required
            />
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
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
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
