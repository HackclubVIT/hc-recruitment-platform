import * as React from "react"
import { cn } from "@/lib/utils"

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, children, ...props }, ref) => {
    if (!isOpen) return null

    return (
      <div 
        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]"
        onClick={onClose}
      >
        <div
          ref={ref}
          className={cn(
            "relative w-full max-w-[560px] max-h-[85vh] overflow-y-auto p-8 rounded-[24px]",
            "border border-[rgba(208,125,34,0.3)]",
            "bg-gradient-to-br from-[rgba(25,3,3,0.95)] to-[rgba(12,1,1,0.98)]",
            "shadow-[0_32px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]",
            "animate-[slideUp_0.4s_cubic-bezier(0.2,0.8,0.2,1)]",
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)
Modal.displayName = "Modal"
