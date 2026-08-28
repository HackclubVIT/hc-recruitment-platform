import * as React from "react"
import { cn } from "@/lib/utils"

export const DiamondIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 18 18" 
    width="14" 
    height="14" 
    aria-hidden="true"
    className={cn("inline-block", className)}
    {...props}
  >
    <rect
      x="4.5"
      y="4.5"
      width="9"
      height="9"
      rx="1.5"
      transform="rotate(45 9 9)"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
)

export const BellIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("inline-block", className)} {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
)

