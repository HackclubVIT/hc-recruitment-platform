"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics").then(res => res.json()),
      fetch("/api/audit-logs").then(res => res.json())
    ]).then(([analyticsData, logsData]) => {
      setMetrics(analyticsData.metrics || {})
      setRecentLogs((logsData.logs || []).slice(0, 10)) // Get top 10 recent
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8 text-[#bfa8a2] font-mono">LOADING SYSTEM METRICS...</div>
  }

  const stats = [
    { label: "TOTAL APPLICATIONS", value: metrics?.totalApplications || 0, highlight: false },
    { label: "SHORTLISTED", value: metrics?.shortlisted || 0, highlight: true },
    { label: "SCHEDULED INTERVIEWS", value: metrics?.scheduledInterviews || 0, highlight: false },
    { label: "SELECTED CANDIDATES", value: metrics?.selectedCandidates || 0, highlight: true },
    { label: "TOTAL PANELS", value: metrics?.totalPanels || 0, highlight: false },
    { label: "ACTIVE RECRUITERS", value: metrics?.totalRecruiters || 0, highlight: false },
    { label: "PENDING FEEDBACK", value: metrics?.pendingFeedback || 0, highlight: true },
    { label: "COMPLETED INTERVIEWS", value: metrics?.completedInterviews || 0, highlight: false },
  ]

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`
  }

  return (
    <div className="flex flex-col gap-10 animate-[fadeIn_0.5s_ease-out]">
      {/* Header Section */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>System Overview</span>
        </div>
        <h1 className="font-display font-bold text-[clamp(30px,4.6vw,52px)] leading-[1.08] text-[#f4ede4]">
          Admin Dashboard
        </h1>
        <p className="text-[#bfa8a2] font-body text-[16px] max-w-2xl mt-2">
          Global metrics and complete recruitment lifecycle tracking across all registered technical departments.
        </p>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card 
            key={i} 
            className="flex flex-col justify-between min-h-[140px] group"
          >
            <span className="font-mono text-[10px] sm:text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">
              {stat.label}
            </span>
            <div className="flex items-end justify-between mt-4">
              <span className={`font-display font-black text-[32px] sm:text-[40px] leading-none ${stat.highlight ? "text-[#ac120c]" : "text-[#f4ede4]"}`}>
                {stat.value}
              </span>
              <DiamondIcon className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${stat.highlight ? "text-[#ac120c]" : "text-[#d07d22]"}`} />
            </div>
          </Card>
        ))}
      </section>

      {/* Recent Activity Table */}
      <section className="flex flex-col gap-6">
        <h2 className="font-display font-bold text-[19px] text-[#f4ede4] flex items-center gap-3">
          <DiamondIcon className="text-[#ac120c]" />
          Recent Activity
        </h2>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">USER / SYSTEM</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTION</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ENTITY</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a0d0d]">
                {recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#bfa8a2] font-mono text-sm">NO RECENT ACTIVITY</td>
                  </tr>
                ) : (
                  recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                      <td className="p-4">
                        <p className="text-[#f4ede4] font-medium">{log.user?.name || log.user_id}</p>
                        <p className="text-[#bfa8a2] font-mono text-[10px]">{log.user?.role || "SYSTEM"}</p>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono tracking-[0.06em] uppercase bg-[#d07d22]/10 text-[#d07d22] border border-[#d07d22]/30">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-[#bfa8a2] font-mono text-[12px]">{log.entity} #{log.entity_id}</td>
                      <td className="p-4 text-[#bfa8a2] font-mono text-[12px]">{formatTimestamp(log.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}
