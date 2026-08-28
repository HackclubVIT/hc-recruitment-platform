import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "highlight" | "accent"
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "highlight", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "badge-base",
          {
            "badge-highlight": variant === "highlight",
            "badge-accent": variant === "accent",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"
