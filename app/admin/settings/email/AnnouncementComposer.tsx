"use client"
import React, { useState } from "react"
import { fetchApi } from "@/api-client"
import { Card } from "@/components/ui/Card"

const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "DESIGN", "MANAGEMENT", "VIDEO", "NON_TECH"]

export function AnnouncementComposer({ onSuccess, onError }: { onSuccess: (msg: string) => void, onError: (msg: string) => void }) {
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")
  const [roles, setRoles] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [specificUsers, setSpecificUsers] = useState("")
  const [customEmails, setCustomEmails] = useState("")
  
  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)

  const toggleRole = (role: string) => {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
  }

  const toggleDept = (dept: string) => {
    setDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept])
  }

  const getPayload = (preview: boolean) => {
    return {
      subject,
      html,
      preview,
      recipients: {
        roles,
        departments,
        specificUsers: specificUsers.split(",").map(s => s.trim()).filter(s => s),
        customEmails: customEmails.split(",").map(s => s.trim()).filter(s => s)
      }
    }
  }

  const handlePreview = async () => {
    if (!subject || !html) {
      onError("Subject and message are required.")
      return
    }
    if (roles.length === 0 && specificUsers.trim() === "" && customEmails.trim() === "") {
      onError("Please select at least one recipient group or enter specific users/emails.")
      return
    }

    setPreviewing(true)
    setPreviewCount(null)
    
    try {
      const res = await fetchApi("/api/settings/email/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload(true))
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to calculate recipients")
      setPreviewCount(data.count)
      if (data.count === 0) {
        onError("No valid recipients found based on your criteria.")
      }
    } catch (err: any) {
      onError(err.message)
    } finally {
      setPreviewing(false)
    }
  }

  const handleSend = async () => {
    if (!previewCount) return
    if (!confirm(`Are you absolutely sure you want to send this email to ${previewCount} recipients?`)) return

    setSending(true)
    try {
      const res = await fetchApi("/api/settings/email/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload(false))
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send announcement")
      
      onSuccess(`Announcement successfully sent to ${data.count} recipients!`)
      setSubject("")
      setHtml("")
      setPreviewCount(null)
    } catch (err: any) {
      onError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="p-6 flex flex-col gap-6 max-w-4xl border-[#ff5925]/30">
      <div className="flex flex-col gap-1 border-b border-[#2a2a2a] pb-2">
        <h2 className="text-[#ff5925] font-medium uppercase tracking-widest text-lg">Send Custom Announcement</h2>
        <p className="text-xs text-[#bfa8a2] font-mono">Broadcast emails to specific groups securely.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-[#f4e4df] font-mono text-sm focus:border-[#ff5925] focus:outline-none transition-colors"
            placeholder="Important Recruitment Update"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">HTML Message</label>
          <textarea
            value={html}
            onChange={e => setHtml(e.target.value)}
            rows={6}
            className="bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-[#f4e4df] font-mono text-sm focus:border-[#ff5925] focus:outline-none transition-colors"
            placeholder="<p>Dear Candidate,</p><br/><p>Please note that...</p>"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[#2a2a2a]">
        
        {/* Roles & Departments */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">Target Groups</label>
            <div className="flex gap-4 flex-wrap">
              {["RECRUITER", "PANEL_MEMBER", "CANDIDATE"].map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer text-sm text-[#f4e4df] font-mono bg-[#111111] px-3 py-1.5 border border-[#2a2a2a] hover:border-[#ff5925]/50 transition-colors">
                  <input type="checkbox" checked={roles.includes(r)} onChange={() => toggleRole(r)} className="accent-[#ff5925]" />
                  {r.replace("_", " ")}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">Filter by Department</label>
            <p className="text-[10px] text-[#bfa8a2] uppercase">Leave empty for ALL departments</p>
            <div className="flex gap-2 flex-wrap max-h-40 overflow-y-auto">
              {DEPARTMENTS.map(d => (
                <label key={d} className="flex items-center gap-2 cursor-pointer text-xs text-[#f4e4df] font-mono bg-[#111111] px-2 py-1 border border-[#2a2a2a] hover:border-[#ff5925]/50 transition-colors">
                  <input type="checkbox" checked={departments.includes(d)} onChange={() => toggleDept(d)} className="accent-[#ff5925]" />
                  {d}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Specific People */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">Specific HC Users (UUIDs)</label>
            <p className="text-[10px] text-[#bfa8a2] uppercase">Comma separated UUIDs</p>
            <textarea
              value={specificUsers}
              onChange={e => setSpecificUsers(e.target.value)}
              rows={3}
              className="bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-[#f4e4df] font-mono text-sm focus:border-[#ff5925] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">Custom Email Addresses</label>
            <p className="text-[10px] text-[#bfa8a2] uppercase">Comma separated emails (e.g. leads@example.com)</p>
            <textarea
              value={customEmails}
              onChange={e => setCustomEmails(e.target.value)}
              rows={3}
              className="bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-[#f4e4df] font-mono text-sm focus:border-[#ff5925] focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-[#2a2a2a]">
        <div className="font-mono text-sm">
          {previewCount !== null ? (
             <span className="text-green-400">Targeting {previewCount} recipient(s)</span>
          ) : <span className="text-[#bfa8a2]">Calculate recipients before sending</span>}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handlePreview}
            disabled={previewing || sending}
            className="bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[#f4e4df] px-6 py-2 font-mono text-sm tracking-wider uppercase transition-colors disabled:opacity-50 border border-[#2a2a2a]"
          >
            {previewing ? "CALCULATING..." : "PREVIEW RECIPIENTS"}
          </button>
          {previewCount !== null && previewCount > 0 && (
            <button 
              onClick={handleSend}
              disabled={sending}
              className="bg-[#ff5925] hover:bg-[#e04e20] text-white px-6 py-2 font-mono text-sm tracking-wider uppercase transition-colors disabled:opacity-50"
            >
              {sending ? "SENDING..." : "CONFIRM & SEND"}
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}
