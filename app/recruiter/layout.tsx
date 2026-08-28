import React from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"

const RECRUITER_LINKS = [
  { label: "DASHBOARD", href: "/recruiter/dashboard" },
  { label: "APPLICATIONS", href: "/recruiter/applications" },
  { label: "CANDIDATES", href: "/recruiter/candidates" },
  { label: "SHORTLISTED", href: "/recruiter/shortlisted" },
  { label: "MEETINGS", href: "/recruiter/meetings" },
  { label: "PANELS", href: "/recruiter/panels" },
]

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const activePath = "/recruiter/dashboard" 

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={RECRUITER_LINKS} activePath={activePath} />
        <main className="flex-1 p-8 lg:p-10 overflow-y-auto max-w-[1180px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
