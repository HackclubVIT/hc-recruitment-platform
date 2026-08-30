"use client"
import { api } from "@/api-client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"

export function StatusHistoryPanel({ applicationId }: { applicationId: string }) {
  const [history, setHistory] = useState<Array<{ id: number; action: string; user: string; timestamp: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await api.getApplicationHistory(applicationId)
        if (active) setHistory(data.history || [])
      } catch {
        if (active) setHistory([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [applicationId])

  return (
    <Card className="p-6">
      <h2 className="text-[#d07d22] font-mono text-[14px] uppercase mb-4">Status History</h2>
      {loading ? (
        <p className="text-[#bfa8a2] font-mono text-[12px]">LOADING…</p>
      ) : history.length === 0 ? (
        <p className="text-[#bfa8a2] font-mono text-[12px]">No history recorded.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {history.map((h) => (
            <li key={h.id} className="border-l-2 border-[#2a0d0d] pl-3">
              <p className="text-[#f4ede4] font-mono text-[12px]">{h.action}</p>
              <p className="text-[#bfa8a2] font-mono text-[10px] mt-1">
                {h.user} · {new Date(h.timestamp).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
