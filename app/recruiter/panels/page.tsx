"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"

interface PanelMember {
  id: number
  user: { name: string; email: string }
}

interface Panel {
  id: number
  name: string
  description: string | null
  status: string
  members: PanelMember[]
}

export default function RecruiterPanelsPage() {
  const [panels, setPanels] = useState<Panel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPanels() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/panels`, { credentials: "include" })
        if (res.ok) {
          const json = await res.json()
          setPanels(json.panels || [])
        }
      } catch (e) {
        console.error("Failed to fetch panels:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchPanels()
  }, [])

  if (loading) {
    return <div className="p-8 text-[#bfa8a2] font-mono">LOADING PANELS...</div>
  }

  const activePanels = panels.filter(p => p.status === "ACTIVE")

  return (
    <div className="flex flex-col gap-10 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Interview Panels</span>
        </div>
        <h1 className="font-display font-bold text-[clamp(30px,4.6vw,52px)] leading-[1.08] text-[#f4ede4]">
          Eligible Panels
        </h1>
        <p className="text-[#bfa8a2] font-body text-[16px] max-w-2xl mt-2">
          View active panels available for scheduling interviews.
        </p>
      </header>

      {activePanels.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[#bfa8a2] font-mono">NO ACTIVE PANELS AVAILABLE.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activePanels.map(panel => (
            <Card key={panel.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-[18px] text-[#f4ede4]">{panel.name}</h3>
                <StatusPill status="active">{panel.status}</StatusPill>
              </div>
              {panel.description && (
                <p className="text-[#bfa8a2] text-[14px]">{panel.description}</p>
              )}
              <div className="border-t border-[#2a0d0d] pt-3">
                <p className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-2">
                  Panel Members ({panel.members.length})
                </p>
                <div className="flex flex-col gap-1">
                  {panel.members.map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="text-[#f4ede4] text-[13px]">{m.user.name}</span>
                      <span className="text-[#bfa8a2] text-[11px] font-mono">{m.user.email}</span>
                    </div>
                  ))}
                  {panel.members.length === 0 && (
                    <p className="text-[#bfa8a2] text-[12px] font-mono">No members assigned</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
