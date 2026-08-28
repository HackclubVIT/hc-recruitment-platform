import React from "react"
import { cn } from "@/lib/utils"

export const Sidebar = ({ 
  links, 
  activePath 
}: { 
  links: { label: string; href: string; icon?: React.ReactNode }[]
  activePath: string 
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-[280px] h-[calc(100vh-64px)] bg-[#020000] border-r border-[#2a0d0d] p-6 shrink-0 sticky top-[64px]">
      <div className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = activePath === link.href
          return (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[12px] font-mono text-[13px] tracking-wide transition-all duration-200",
                isActive 
                  ? "bg-[#ac120c]/10 text-[#f4ede4] border border-[#ac120c]/30 shadow-[inset_0_0_12px_rgba(172,18,12,0.1)]"
                  : "text-[#bfa8a2] hover:bg-[#2a0d0d]/50 hover:text-[#f4ede4] border border-transparent"
              )}
            >
              {link.label}
            </a>
          )
        })}
      </div>
    </aside>
  )
}
