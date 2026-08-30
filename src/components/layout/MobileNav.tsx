"use client"

import React, { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const MobileNav = ({ 
  links,
  title = "Menu"
}: { 
  links: { label: string; href: string; icon?: React.ReactNode }[]
  title?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="lg:hidden">
      {/* Mobile Header Toggle */}
      <div className="flex items-center justify-between p-4 bg-[#020000] border-b border-[#2a0d0d] sticky top-[64px] z-40">
        <span className="font-display font-bold text-[#f4ede4] text-[18px]">{title}</span>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-[#bfa8a2] hover:text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 top-[125px] z-50 bg-[#020000] border-t border-[#2a0d0d] overflow-y-auto">
          <nav className="flex flex-col p-4 gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 rounded-[12px] font-mono text-[14px] tracking-wide transition-all duration-200",
                    isActive 
                      ? "bg-[#ac120c]/10 text-[#f4ede4] border border-[#ac120c]/30 shadow-[inset_0_0_12px_rgba(172,18,12,0.1)]"
                      : "text-[#bfa8a2] hover:bg-[#2a0d0d]/50 hover:text-[#f4ede4] border border-transparent"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </div>
  )
}
