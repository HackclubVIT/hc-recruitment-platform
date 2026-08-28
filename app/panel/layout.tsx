import React from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"

const PANEL_LINKS = [
  { label: "DASHBOARD", href: "/panel/dashboard" },
  { label: "INTERVIEWS", href: "/panel/interviews" },
  { label: "FEEDBACK", href: "/panel/feedback" },
]

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const activePath = "/panel/dashboard" 

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={PANEL_LINKS} activePath={activePath} />
        <main className="flex-1 p-8 lg:p-10 overflow-y-auto max-w-[1180px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
