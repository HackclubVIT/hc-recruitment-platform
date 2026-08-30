"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const Sidebar = ({ 
  links 
}: { 
  links: { label: string; href: string; icon?: React.ReactNode }[]
}) => {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-[280px] h-[calc(100vh-64px)] bg-[#020000] border-r border-[#2a0d0d] p-6 shrink-0 sticky top-[64px] overflow-y-auto">
      <div className="flex flex-col gap-2">
        {links.map((link) => {
          // Exact match or active sub-route logic (e.g. /admin/candidates/123 highlights CANDIDATES)
          const isActive = pathname === link.href || (pathname.startsWith(link.href + "/") && link.href !== "/")
          return (
            <Link
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
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
