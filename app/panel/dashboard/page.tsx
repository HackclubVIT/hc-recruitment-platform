import React from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"

export default function PanelDashboard() {
  return (
    <div className="flex flex-col gap-10 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Panel Operations</span>
        </div>
        <h1 className="font-display font-bold text-[clamp(30px,4.6vw,52px)] leading-[1.08] text-[#f4ede4]">
          Panel Dashboard
        </h1>
        <p className="text-[#bfa8a2] font-body text-[16px] max-w-2xl mt-2">
          Your assigned interviews and pending feedback evaluations.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between min-h-[120px] group">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Interviews Today</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display font-black text-[36px] leading-none text-[#d07d22]">3</span>
          </div>
        </Card>
        <Card className="flex flex-col justify-between min-h-[120px] group">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Upcoming (Week)</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display font-black text-[36px] leading-none text-[#f4ede4]">12</span>
          </div>
        </Card>
        <Card className="flex flex-col justify-between min-h-[120px] group">
          <span className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-[0.06em]">Pending Feedback</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display font-black text-[36px] leading-none text-[#ac120c]">2</span>
          </div>
        </Card>
      </div>

      <section className="flex flex-col gap-6">
        <h2 className="font-display font-bold text-[19px] text-[#f4ede4] flex items-center gap-3">
          <DiamondIcon className="text-[#ac120c]" />
          Today's Schedule
        </h2>
        
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">TIME</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">CANDIDATE</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">STATUS</th>
                  <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">MEETING</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a0d0d]">
                <tr className="hover:bg-[#1a0606] transition-colors duration-200">
                  <td className="p-4 text-[#d07d22] font-mono text-[13px] font-bold">5:00 PM</td>
                  <td className="p-4 text-[#f4ede4] font-medium">David Miller</td>
                  <td className="p-4">
                    <StatusPill status="scheduled">SCHEDULED</StatusPill>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" className="py-2 px-4 text-xs tracking-wider border-[#2e7d32]/50 text-[#2e7d32] hover:bg-[#2e7d32]/10">JOIN</Button>
                  </td>
                </tr>
                <tr className="hover:bg-[#1a0606] transition-colors duration-200">
                  <td className="p-4 text-[#d07d22] font-mono text-[13px] font-bold">5:15 PM</td>
                  <td className="p-4 text-[#f4ede4] font-medium">Elena Rodriguez</td>
                  <td className="p-4">
                    <StatusPill status="scheduled">SCHEDULED</StatusPill>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" className="py-2 px-4 text-xs tracking-wider border-[#2e7d32]/50 text-[#2e7d32] hover:bg-[#2e7d32]/10">JOIN</Button>
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
