import React from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"

const ADMIN_LINKS = [
  { label: "DASHBOARD", href: "/admin/dashboard" },
  { label: "USERS", href: "/admin/users" },
  { label: "FORMS", href: "/admin/forms" },
  { label: "APPLICATIONS", href: "/admin/applications" },
  { label: "CANDIDATES", href: "/admin/candidates" },
  { label: "INTERVIEWS", href: "/admin/interviews" },
  { label: "RECRUITERS", href: "/admin/recruiters" },
  { label: "PANELS", href: "/admin/panels" },
  { label: "ANALYTICS", href: "/admin/analytics" },
  { label: "AUDIT LOGS", href: "/admin/audit-logs" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <MobileNav links={ADMIN_LINKS} title="Admin Menu" />
        <Sidebar links={ADMIN_LINKS} />
        <main className="flex-1 p-4 lg:p-10 overflow-y-auto max-w-[1180px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
