"use client"
import { fetchApi } from "@/api-client"


import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetchApi(`/api/analytics`)
      const result = await res.json()
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-[#bfa8a2] font-mono">CALCULATING METRICS...</div>
  if (!data) return <div className="p-8 text-[#ac120c] font-mono">ERROR FETCHING DATA</div>

  const totalSelectionsAndRejections = (data.selectedVsRejected?.SELECTED || 0) + (data.selectedVsRejected?.REJECTED || 0)
  const maxInterviews = data.interviewsByDay ? Math.max(...data.interviewsByDay.map((d: any) => d.count), 1) : 1

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>System Telemetry</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            Global Analytics
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8">
          <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-6">Application Funnel</h2>
          <div className="flex flex-col gap-4">
            {Object.entries(data.applicationsByStatus).map(([status, count]) => {
              const max = data.metrics.totalApplications || 1
              const percentage = ((count as number) / max) * 100
              return (
                <div key={status} className="flex flex-col gap-1">
                  <div className="flex justify-between font-mono text-[11px] text-[#f4ede4]">
                    <span>{status}</span>
                    <span>{count as number}</span>
                  </div>
                  <div className="w-full bg-[#120202] h-2 rounded-full overflow-hidden border border-[#2a0d0d]">
                    <div 
                      className="bg-[#ac120c] h-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-6">Department Distribution</h2>
          <div className="flex flex-col gap-4">
            {data.applicationsByDepartment.map((dept: any) => {
              const max = data.metrics.totalCandidates || 1
              const percentage = (dept.count / max) * 100
              return (
                <div key={dept.department} className="flex flex-col gap-1">
                  <div className="flex justify-between font-mono text-[11px] text-[#f4ede4]">
                    <span>{dept.department}</span>
                    <span>{dept.count}</span>
                  </div>
                  <div className="w-full bg-[#120202] h-2 rounded-full overflow-hidden border border-[#2a0d0d]">
                    <div 
                      className="bg-[#d07d22] h-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-6">Selected vs Rejected Ratio</h2>
          <div className="flex flex-col gap-4">
            {["SELECTED", "REJECTED"].map((decision) => {
              const count = data.selectedVsRejected?.[decision] || 0
              const percentage = totalSelectionsAndRejections > 0 ? (count / totalSelectionsAndRejections) * 100 : 0
              return (
                <div key={decision} className="flex flex-col gap-1">
                  <div className="flex justify-between font-mono text-[11px] text-[#f4ede4]">
                    <span>{decision}</span>
                    <span>{count}</span>
                  </div>
                  <div className="w-full bg-[#120202] h-2 rounded-full overflow-hidden border border-[#2a0d0d]">
                    <div 
                      className={`${decision === 'SELECTED' ? 'bg-[#2e7d32]' : 'bg-[#ac120c]'} h-full transition-all duration-1000`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em] mb-6">Interviews by Day</h2>
          <div className="flex flex-col justify-end h-[150px] gap-2 border-l border-b border-[#2a0d0d] p-4">
            <div className="flex items-end gap-2 h-full">
              {data.interviewsByDay?.length === 0 ? (
                 <span className="font-mono text-[10px] text-[#bfa8a2]">No data</span>
              ) : (
                data.interviewsByDay?.map((day: any) => {
                  const heightPercentage = (day.count / maxInterviews) * 100
                  return (
                    <div key={day.date} className="relative flex flex-col justify-end items-center group h-full flex-1">
                      <div className="w-full bg-[#ac120c]/80 hover:bg-[#ac120c] transition-all" style={{ height: `${heightPercentage}%`, minHeight: '4px' }} />
                      <div className="absolute -bottom-6 font-mono text-[8px] text-[#bfa8a2] whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                        {new Date(day.date).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata',  month: 'short', day: 'numeric'})}
                      </div>
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px] text-[#f4ede4]">
                        {day.count}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </Card>

      </div>
    </div>
  )
}
