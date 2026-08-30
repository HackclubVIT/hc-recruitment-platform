"use client"
import { api } from "@/api-client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"

const DECISION_VARIANT: Record<string, "selected" | "pending" | "rejected"> = {
  RECOMMENDED: "selected",
  MAYBE: "pending",
  REJECTED: "rejected"
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const data = await api.getFeedback()
        setFeedback(data.feedback || [])
      } catch (e) {
        setError("Failed to load feedback.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out] pb-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Global Data View</span>
        </div>
        <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
          Interview Feedback
        </h1>
      </header>

      {error && <p className="text-[#ac120c] font-mono text-[12px]">{error}</p>}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DEPT</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">PANELIST</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">SCORES</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">OVERALL</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DECISION</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">COMMENTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING DATA...</td></tr>
              ) : feedback.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-[#bfa8a2] font-mono">NO FEEDBACK FOUND.</td></tr>
              ) : (
                feedback.map((fb) => (
                  <tr key={fb.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                    <td className="p-4 text-[#f4ede4] font-medium">
                      {fb.candidateId ? (
                        <a href={`/admin/candidates/${fb.candidateId}`} className="hover:underline text-[#d07d22]">{fb.candidateName}</a>
                      ) : fb.candidateName}
                    </td>
                    <td className="p-4 text-[#bfa8a2]">{fb.department}</td>
                    <td className="p-4 text-[#bfa8a2]">{fb.panelMemberName}</td>
                      <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">
                      T:{fb.technical_score} C:{fb.communication_score} P:{fb.problem_solving_score} CF:{fb.confidence_score} TW:{fb.teamwork_score}
                    </td>
                    <td className="p-4 text-[#d07d22] font-mono font-bold text-[12px]">{fb.overall_score ?? "-"}/5</td>
                    <td className="p-4">
                      <StatusPill status={DECISION_VARIANT[fb.decision] || "pending"}>{fb.decision}</StatusPill>
                    </td>
                    <td className="p-4 text-[#bfa8a2] max-w-[260px]"><p className="truncate" title={fb.comments}>{fb.comments || "-"}</p></td>
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
