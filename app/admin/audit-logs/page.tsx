"use client"
import { fetchApi } from "@/api-client"


import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await fetchApi(`/api/audit-logs`)
      const data = await res.json()
      setLogs(data.logs || data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Kolkata", 
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
    })
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Security & Operations</span>
        </div>
        <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
          System Audit Logs
        </h1>
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">TIMESTAMP</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTOR</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTION</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ENTITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono">RETRIEVING LOGS...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono">NO LOGS FOUND.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px] whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <>
                          <p className="text-[#f4ede4] font-medium text-sm">{log.user.name}</p>
                          <p className="text-[#bfa8a2] font-mono text-[10px]">{log.user.role}</p>
                        </>
                      ) : (
                        <p className="text-[#d07d22] font-mono text-[11px]">SYSTEM</p>
                      )}
                    </td>
                    <td className="p-4 text-[#f4ede4] font-mono text-[12px]">{log.action}</td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">
                      {log.entity} {log.entity_id ? `(#${log.entity_id})` : ""}
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
