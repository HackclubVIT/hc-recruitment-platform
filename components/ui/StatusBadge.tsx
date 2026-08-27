"use client"

import { ApplicationStatus } from "@/lib/status"

const statusStyles: Record<string, string> = {
  APPLIED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  UNDER_REVIEW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ON_HOLD: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  SHORTLISTED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  INTERVIEW_SCHEDULED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  INTERVIEWED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  SELECTED: "bg-green-500/10 text-green-400 border-green-500/20",
  WAITLISTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
}

const statusLabels: Record<string, string> = {
  APPLIED: "Applied",
  UNDER_REVIEW: "Under Review",
  ON_HOLD: "On Hold",
  SHORTLISTED: "Shortlisted",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  INTERVIEWED: "Interviewed",
  SELECTED: "Selected",
  WAITLISTED: "Waitlisted",
  REJECTED: "Rejected",
}

interface StatusBadgeProps {
  status: ApplicationStatus | string
  size?: "sm" | "md"
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20"
  const label = statusLabels[status] || status

  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"

  return (
    <span className={`inline-flex items-center ${padding} font-mono font-medium border rounded ${style}`}>
      {label}
    </span>
  )
}