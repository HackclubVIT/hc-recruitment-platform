import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

export function formatDateTime(dateStr: string | Date): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`
}

const APPLICATION_STATUS_VARIANT: Record<string, "active" | "pending" | "inactive" | "scheduled" | "completed" | "cancelled" | "rejected" | "selected"> = {
  APPLIED: "pending",
  UNDER_REVIEW: "pending",
  SHORTLISTED: "scheduled",
  INTERVIEW_SCHEDULED: "scheduled",
  INTERVIEW_COMPLETED: "completed",
  FURTHER_ROUND: "pending",
  WAITLISTED: "pending",
  SELECTED: "selected",
  REJECTED: "rejected",
}

export function applicationStatusVariant(status: string): "active" | "pending" | "inactive" | "scheduled" | "completed" | "cancelled" | "rejected" | "selected" {
  return APPLICATION_STATUS_VARIANT[status] ?? "pending"
}
