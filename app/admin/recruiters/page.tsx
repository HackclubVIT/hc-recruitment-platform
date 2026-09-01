import { redirect } from "next/navigation"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"

const DEPARTMENTS = [
  "Projects", "Operations", "Technical", "Finance", "Research and Development", "Design & Social Media"
]

export default function AdminRecruitersPage() {
  const [recruiters, setRecruiters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await api.getUsers()
        setRecruiters((data.users || []).filter((u: any) => u.role === "RECRUITER"))
      } catch {
        setMsg("Failed to load recruiters.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const update = async (rec: any, patch: Partial<{ departments: string[]; active: boolean }>) => {
    setSavingId(rec.id)
    setMsg("")
    try {
      const resp = await api.put("/users", {
        id: rec.id,
        role: "RECRUITER",
        departments: patch.departments !== undefined ? patch.departments : rec.departments,
        active: patch.active !== undefined ? patch.active : rec.active
      })
      const res = await resp.json()
      if (res && res.user) {
        setRecruiters(prev => prev.map((r: any) => r.id === rec.id ? { ...r, ...patch } : r))
      } else {
        setMsg("Update failed.")
      }
    } catch {
      setMsg("Update failed.")
    } finally {
      setSavingId(null)
    }
  }

  const toggleDept = (rec: any, dept: string) => {
    const set = new Set<string>(rec.departments || [])
    if (set.has(dept)) set.delete(dept); else set.add(dept)
    update(rec, { departments: Array.from(set) })
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out] pb-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Access Management</span>
        </div>
        <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
          Recruiter Management
        </h1>
      </header>

      {msg && <p className="text-[#d07d22] font-mono text-[12px]">{msg}</p>}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">NAME</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">EMAIL</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DEPARTMENTS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">STATUS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em] text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
              ) : recruiters.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">NO RECRUITERS FOUND.</td></tr>
              ) : (
                recruiters.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                    <td className="p-4 text-[#f4ede4] font-medium">{rec.name}</td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">{rec.email}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[320px]">
                        {DEPARTMENTS.map((d) => {
                          const active = (rec.departments || []).includes(d)
                          return (
                            <button
                              key={d}
                              disabled={savingId === rec.id}
                              onClick={() => toggleDept(rec, d)}
                              className={`text-[10px] font-mono px-2 py-1 rounded border ${active ? "bg-[#d07d22] text-[#0a0202] border-[#d07d22]" : "text-[#bfa8a2] border-[#2a0d0d] hover:border-[#d07d22]"}`}
                            >
                              {d}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusPill status={rec.active ? "active" : "inactive"}>{rec.active ? "ACTIVE" : "INACTIVE"}</StatusPill>
                    </td>
                    <td className="p-4 text-right">
                      {rec.active ? (
                        <Button
                          variant="ghost"
                          className="text-[#ac120c] text-[10px] py-1 px-3"
                          disabled={savingId === rec.id}
                          onClick={() => update(rec, { active: false })}
                        >
                          DEACTIVATE
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          className="text-[#2e7d32] text-[10px] py-1 px-3"
                          disabled={savingId === rec.id}
                          onClick={() => update(rec, { active: true })}
                        >
                          ACTIVATE
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
