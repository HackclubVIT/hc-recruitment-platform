import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "active" | "pending" | "inactive" | "scheduled" | "completed" | "cancelled" | "rejected" | "selected"
}

export const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, status, ...props }, ref) => {
    // Map abstract business statuses to the UI variants
    const isActive = ["active", "completed", "selected"].includes(status)
    const isPending = ["pending", "scheduled"].includes(status)
    const isInactive = ["inactive", "cancelled", "rejected"].includes(status)

    return (
      <span
        ref={ref}
        className={cn(
          "status-base",
          {
            "status-active": isActive,
            "status-pending": isPending,
            "status-inactive": isInactive,
          },
          className
        )}
        {...props}
      />
    )
  }
)
StatusPill.displayName = "StatusPill"
