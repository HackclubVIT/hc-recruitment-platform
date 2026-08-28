import React from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { Badge } from "@/components/ui/Badge"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"

export default function RecruiterDashboard() {
  return (
    <div className="flex flex-col gap-10 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Department Recruitment</span>
        </div>
        <h1 className="font-display font-bold text-[clamp(30px,4.6vw,52px)] leading-[1.08] text-[#f4ede4]">
          Recruiter Dashboard
        </h1>
        <p className="text-[#bfa8a2] font-body text-[16px] max-w-2xl mt-2">
          Manage candidates, review applications, and schedule interviews for the Engineering department.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between min-h-[120px] group">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Pending Reviews</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display font-black text-[36px] leading-none text-[#d07d22]">45</span>
          </div>
        </Card>
        <Card className="flex flex-col justify-between min-h-[120px] group">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Shortlisted</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display font-black text-[36px] leading-none text-[#2e7d32]">18</span>
          </div>
        </Card>
        <Card className="flex flex-col justify-between min-h-[120px] group">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Interviews Today</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display font-black text-[36px] leading-none text-[#f4ede4]">4</span>
          </div>
        </Card>
      </div>

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-[19px] text-[#f4ede4] flex items-center gap-3">
            <DiamondIcon className="text-[#ac120c]" />
            Recent Applications
          </h2>
          <Button variant="ghost">VIEW ALL</Button>
        </div>
        
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">APPLIED ON</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">STATUS</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a0d0d]">
                <tr className="hover:bg-[#1a0606] transition-colors duration-200">
                  <td className="p-4">
                    <p className="text-[#f4ede4] font-medium">Sarah Jenkins</p>
                    <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">sarah.j@example.com</p>
                  </td>
                  <td className="p-4 text-[#bfa8a2] font-mono text-[12px]">2026-08-27</td>
                  <td className="p-4">
                    <StatusPill status="pending">UNDER_REVIEW</StatusPill>
                  </td>
                  <td className="p-4">
                    <Button variant="primary" className="py-2 px-4 text-xs">REVIEW</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}
