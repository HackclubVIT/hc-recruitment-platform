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

const DEPARTMENTS = [
  "Projects", "Operations", "Technical", "Finance", "Research and Development", "Design & Social Media"
]

export default function ShortlistedCandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  // Broadcast Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState("Projects")
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    fetchCandidates()
  }, [search])

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const res = await fetchApi(`/api/candidates?q=${search}&status=SHORTLISTED`)
      const data = await res.json()
      setCandidates(data.candidates || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setStatusFeedback({ type: 'error', message: 'Title and message are required.' })
      return
    }

    setSending(true)
    setStatusFeedback(null)
    try {
      const res = await fetchApi("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: selectedDept,
          target_status: "SHORTLISTED",
          title: broadcastTitle,
          message: broadcastMessage
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to broadcast message")

      setStatusFeedback({
        type: 'success',
        message: `✓ Broadcast successfully sent! Email delivered to ${data.count} candidate(s) and posted to their dashboards.`
      })
      setBroadcastTitle("")
      setBroadcastMessage("")
      setTimeout(() => {
        setIsModalOpen(false)
        setStatusFeedback(null)
      }, 3000)
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Failed to send broadcast' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Candidate Management</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            Shortlisted Pool
          </h1>
        </div>
        <Button 
          variant="primary" 
          onClick={() => { setIsModalOpen(true); setStatusFeedback(null); }}
          className="bg-[#d07d22] text-[#0a0202] hover:bg-[#e08d32] font-bold py-2.5 px-5 flex items-center gap-2 w-fit"
        >
          📢 Broadcast Task / Message
        </Button>
      </header>

      {/* Broadcast Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-col gap-6">
          <div className="border-b border-[#2a0d0d] pb-3">
            <h2 className="font-display font-bold text-[22px] text-[#f4ede4]">
              Broadcast Task / Message
            </h2>
            <p className="text-[#bfa8a2] text-xs font-mono mt-1">
              Send an email and display this task on the dashboard for shortlisted candidates.
            </p>
          </div>

          {statusFeedback && (
            <div className={`p-3 rounded text-sm ${statusFeedback.type === 'success' ? 'bg-[#2ecc71]/10 text-[#2ecc71] border border-[#2ecc71]/40' : 'bg-[#ac120c]/10 text-[#ac120c] border border-[#ac120c]/40'}`}>
              {statusFeedback.message}
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="flex flex-col gap-4">
            <div>
              <label className="block text-[#bfa8a2] font-mono text-xs uppercase mb-1.5">Target Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-[#1a0606] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded text-sm focus:border-[#d07d22] outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <p className="text-[11px] text-[#bfa8a2] mt-1 font-mono">
                Only candidates shortlisted in this department will receive this task/message.
              </p>
            </div>

            <div>
              <label className="block text-[#bfa8a2] font-mono text-xs uppercase mb-1.5">Task / Message Title</label>
              <Input
                placeholder="e.g. Round 1 Task: Projects Department Assignment"
                value={broadcastTitle}
                onChange={(e: any) => setBroadcastTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[#bfa8a2] font-mono text-xs uppercase mb-1.5">Task Details & Instructions</label>
              <textarea
                rows={6}
                placeholder="Write your task guidelines, deadline, submission Google Form/GitHub link, etc..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-[#1a0606] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded text-sm focus:border-[#d07d22] outline-none resize-none leading-relaxed"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={sending} className="bg-[#d07d22] text-[#0a0202] hover:bg-[#e08d32] font-bold">
                {sending ? "Sending Broadcast..." : "Send Email & Post to Dashboard"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Card className="flex flex-col sm:flex-row gap-4 p-4 items-center">
        <div className="w-full">
          <Input 
            placeholder="Search shortlisted candidates..." 
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="ghost" className="w-full sm:w-auto h-[46px]" onClick={fetchCandidates}>
          REFRESH
        </Button>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">REG NO</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DEPARTMENT</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono">NO SHORTLISTED CANDIDATES FOUND.</td></tr>
              ) : (
                candidates.map((candidate) => {
                  return (
                    <tr key={candidate.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                      <td className="p-4 text-[#d07d22] font-mono text-[13px] font-bold">{candidate.registration_number}</td>
                      <td className="p-4">
                        <p className="text-[#f4ede4] font-medium">{candidate.name}</p>
                        <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">{candidate.email}</p>
                      </td>
                      <td className="p-4 text-[#bfa8a2]">{candidate.department}</td>
                      <td className="p-4 flex gap-3">
                        <Link href={`/recruiter/meetings/schedule?candidate=${candidate.id}`}>
                          <Button variant="cta" className="py-2 px-4 text-xs">SCHEDULE</Button>
                        </Link>
                        <Link href={`/recruiter/candidates/view?id=${candidate.id}`}>
                          <Button variant="ghost" className="py-2 px-4 text-xs">VIEW</Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
