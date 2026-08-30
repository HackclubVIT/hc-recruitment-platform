"use client"
import { fetchApi } from "@/api-client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApi(`/api/analytics`)
      .then(res => res.json())
      .then(analyticsData => {
        setData(analyticsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8 text-[#bfa8a2] font-mono">LOADING SYSTEM METRICS...</div>
  }

  const metrics = data?.metrics || {}
  const recentLogs = data?.recentActivity || []
  const appsByStatus = data?.applicationsByStatus || {}
  const deptApps = data?.applicationsByDepartment || []
  const selectedVsRejected = data?.selectedVsRejected || { SELECTED: 0, REJECTED: 0 }
  const interviewsByDay = data?.interviewsByDay || []

  const stats = [
    { label: "TOTAL CANDIDATES", value: metrics.totalCandidates || 0, highlight: false },
    { label: "TOTAL APPLICATIONS", value: metrics.totalApplications || 0, highlight: false },
    { label: "SHORTLISTED", value: metrics.shortlisted || 0, highlight: true },
    { label: "SCHEDULED INTERVIEWS", value: metrics.scheduledInterviews || 0, highlight: false },
    { label: "COMPLETED INTERVIEWS", value: metrics.completedInterviews || 0, highlight: false },
    { label: "PENDING FEEDBACK", value: metrics.pendingFeedback || 0, highlight: true },
    { label: "SELECTED CANDIDATES", value: metrics.selectedCandidates || 0, highlight: true },
    { label: "REJECTED CANDIDATES", value: metrics.rejectedCandidates || 0, highlight: false },
    { label: "TOTAL PANELS", value: metrics.totalPanels || 0, highlight: false },
    { label: "ACTIVE RECRUITERS", value: metrics.totalRecruiters || 0, highlight: false },
  ]

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })} ${d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit'})}`
  }

  // Helper for simple bar percentage
  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }
  
  const totalDecisions = (selectedVsRejected.SELECTED || 0) + (selectedVsRejected.REJECTED || 0);

  return (
    <div className="flex flex-col gap-10 animate-[fadeIn_0.5s_ease-out] pb-10">
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
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <Card 
            key={i} 
            className="flex flex-col justify-between min-h-[120px] group p-5"
          >
            <span className="font-mono text-[9px] sm:text-[10px] text-[#bfa8a2] uppercase tracking-[0.06em]">
              {stat.label}
            </span>
            <div className="flex items-end justify-between mt-2">
              <span className={`font-display font-black text-[28px] sm:text-[32px] leading-none ${stat.highlight ? "text-[#ac120c]" : "text-[#f4ede4]"}`}>
                {stat.value}
              </span>
            </div>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status */}
        <Card className="p-6">
          <h2 className="font-display font-bold text-[19px] text-[#f4ede4] flex items-center gap-3 mb-6">
            <DiamondIcon className="text-[#ac120c] w-4 h-4" />
            Applications By Status
          </h2>
          <div className="flex flex-col gap-4">
            {Object.entries(appsByStatus).map(([status, count]: [string, any]) => (
              <div key={status} className="flex flex-col gap-1">
                <div className="flex justify-between font-mono text-[11px] text-[#bfa8a2]">
                  <span>{status}</span>
                  <span className="text-[#f4ede4]">{count}</span>
                </div>
                <div className="h-2 w-full bg-[#1a0606] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#d07d22]" 
                    style={{ width: `${getPercentage(count, metrics.totalApplications)}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {Object.keys(appsByStatus).length === 0 && (
              <div className="text-[#bfa8a2] font-mono text-[11px]">No applications found.</div>
            )}
          </div>
        </Card>

        {/* Department Wise Applications */}
        <Card className="p-6">
          <h2 className="font-display font-bold text-[19px] text-[#f4ede4] flex items-center gap-3 mb-6">
            <DiamondIcon className="text-[#ac120c] w-4 h-4" />
            Applications By Department
          </h2>
          <div className="flex flex-col gap-4">
            {deptApps.map((dept: { department: string, count: number }) => (
              <div key={dept.department} className="flex flex-col gap-1">
                <div className="flex justify-between font-mono text-[11px] text-[#bfa8a2]">
                  <span>{dept.department}</span>
                  <span className="text-[#f4ede4]">{dept.count}</span>
                </div>
                <div className="h-2 w-full bg-[#1a0606] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#ac120c]" 
                    style={{ width: `${getPercentage(dept.count, Math.max(...deptApps.map((d: { count: number }) => d.count)))}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {deptApps.length === 0 && (
              <div className="text-[#bfa8a2] font-mono text-[11px]">No departments found.</div>
            )}
          </div>
        </Card>

        {/* Selected vs Rejected */}
        <Card className="p-6">
          <h2 className="font-display font-bold text-[19px] text-[#f4ede4] flex items-center gap-3 mb-6">
            <DiamondIcon className="text-[#ac120c] w-4 h-4" />
            Decision Ratio
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="font-mono text-[11px] text-[#bfa8a2] mb-1">SELECTED</div>
              <div className="font-display text-[24px] text-[#2ecc71]">{selectedVsRejected.SELECTED || 0}</div>
            </div>
            <div className="flex-1 text-right">
              <div className="font-mono text-[11px] text-[#bfa8a2] mb-1">REJECTED</div>
              <div className="font-display text-[24px] text-[#ac120c]">{selectedVsRejected.REJECTED || 0}</div>
            </div>
          </div>
          <div className="mt-4 h-3 w-full bg-[#1a0606] rounded-full overflow-hidden flex">
            {totalDecisions > 0 ? (
              <>
                <div className="h-full bg-[#2ecc71]" style={{ width: `${getPercentage(selectedVsRejected.SELECTED || 0, totalDecisions)}%` }}></div>
                <div className="h-full bg-[#ac120c]" style={{ width: `${getPercentage(selectedVsRejected.REJECTED || 0, totalDecisions)}%` }}></div>
              </>
            ) : (
              <div className="h-full w-full bg-[#2a0d0d]"></div>
            )}
          </div>
        </Card>

        {/* Interviews by Day */}
        <Card className="p-6">
          <h2 className="font-display font-bold text-[19px] text-[#f4ede4] flex items-center gap-3 mb-6">
            <DiamondIcon className="text-[#ac120c] w-4 h-4" />
            Interviews By Day
          </h2>
          <div className="flex items-end h-[120px] gap-2 border-b border-[#2a0d0d] pb-2">
            {interviewsByDay.length > 0 ? (
              interviewsByDay.map((day: { date: string, count: number }) => {
                const maxInterviews = Math.max(...interviewsByDay.map((d: { count: number }) => d.count));
                const heightPercentage = getPercentage(day.count, maxInterviews);
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="w-full bg-[#ac120c]/20 hover:bg-[#ac120c] transition-colors rounded-t-sm" style={{ height: `${heightPercentage}%`, minHeight: '4px' }}></div>
                    {/* Tooltip */}
                    <div className="absolute -top-8 bg-[#1a0606] border border-[#2a0d0d] text-[#f4ede4] font-mono text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {day.date}: {day.count}
                    </div>
                  </div>
                )
              })
            ) : (
               <div className="w-full h-full flex items-center justify-center text-[#bfa8a2] font-mono text-[11px]">No interviews scheduled.</div>
            )}
          </div>
          <div className="flex justify-between mt-2 font-mono text-[9px] text-[#bfa8a2]">
            <span>{interviewsByDay[0]?.date || 'START'}</span>
            <span>{interviewsByDay[interviewsByDay.length - 1]?.date || 'END'}</span>
          </div>
        </Card>
      </div>

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
                  recentLogs.map((log: { id: number, action: string, target_type: string, target_id: string, created_at: string, user: { name: string, email: string, role: string } }) => (
                    <tr key={log.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                      <td className="p-4">
                        <p className="text-[#f4ede4] font-medium">{log.user?.name || log.user?.email}</p>
                        <p className="text-[#bfa8a2] font-mono text-[10px]">{log.user?.role || "SYSTEM"}</p>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono tracking-[0.06em] uppercase bg-[#d07d22]/10 text-[#d07d22] border border-[#d07d22]/30">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-[#bfa8a2] font-mono text-[12px]">{log.target_type} #{log.target_id}</td>
                      <td className="p-4 text-[#bfa8a2] font-mono text-[12px]">{formatTimestamp(log.created_at)}</td>
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
