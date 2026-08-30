import React from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"

const RECRUITIE_LINKS = [
  { label: "MY APPLICATION", href: "/recruitie/dashboard" },
]

export default function RecruitieLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <MobileNav links={RECRUITIE_LINKS} title="Applicant Menu" />
        <Sidebar links={RECRUITIE_LINKS} />
        <main className="flex-1 p-4 lg:p-10 overflow-y-auto max-w-[1180px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
