import React from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"

const ADMIN_LINKS = [
  { label: "DASHBOARD", href: "/admin/dashboard" },
  { label: "CANDIDATES", href: "/admin/candidates" },
  { label: "INTERVIEWS", href: "/admin/interviews" },
  { label: "RECRUITERS", href: "/admin/recruiters" },
  { label: "PANELS", href: "/admin/panels" },
  { label: "ANALYTICS", href: "/admin/analytics" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Hardcode active path for layout shell purposes
  const activePath = "/admin/dashboard" 

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={ADMIN_LINKS} activePath={activePath} />
        <main className="flex-1 p-8 lg:p-10 overflow-y-auto max-w-[1180px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
