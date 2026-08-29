"use client"

import React from "react"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

const BOARD = [
  { 
    name: "Atul Krishnan", 
    role: "Chairperson", 
    blurb: "Leading the vision and execution of HackClub VIT Chennai."
  },
  { 
    name: "Harleen", 
    role: "Vice Chairperson", 
    blurb: "\"I don't exist\"" 
  },
  { 
    name: "Ojas Singh", 
    role: "Secretary", 
    blurb: "The calm behind the calendar chaos." 
  },
  { 
    name: "Ivan George", 
    role: "Co-Secretary", 
    blurb: "\"I don't know what's going on either, but I'm here.\"" 
  },
];

const CORE = [
  { name: "Prachi", role: "Projects Lead" },
  { name: "Manan", role: "R&D Lead" },
  { name: "Jesta", role: "Technical Lead" },
  { name: "Kushagra", role: "Design Lead" },
  { name: "Arya", role: "Operations Lead" },
];

export function Board() {
  return (
    <section id="board" className="relative py-24 bg-[#070101] border-y border-[#2a0d0d]">
      <div className="max-w-[1000px] mx-auto px-6">
        
        <ScrollReveal delay={100}>
          <div className="flex flex-col items-center mb-16 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-[#d07d22]/30 bg-[rgba(208,125,34,0.1)] text-[#d07d22] font-mono text-[11px] tracking-[0.1em] uppercase">
              Leadership
            </div>
            <h2 className="font-display font-bold text-[32px] sm:text-[40px] text-[#f4ede4]">
              Meet the <span className="text-[#d07d22]">Board.</span>
            </h2>
            <p className="font-body text-[#bfa8a2] mt-4 max-w-2xl">
              The students making sure the servers don't crash and the pizzas arrive on time.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {BOARD.map((member, i) => (
            <ScrollReveal key={member.name} delay={300 + i * 150}>
              <div className="group relative flex items-center p-6 rounded-2xl border border-[#2a0d0d] bg-[#120202]/60 backdrop-blur-md transition-all duration-500 hover:border-[#d07d22]/80 hover:bg-[#1a0505] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(208,125,34,0.15)] overflow-hidden">
                
                {/* Glow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d07d22]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                {/* Avatar Placeholder */}
                <div className="shrink-0 w-20 h-20 rounded-full border border-[#2a0d0d] bg-[#070101] flex items-center justify-center font-display font-black text-2xl text-[#f4ede4] opacity-80 group-hover:opacity-100 group-hover:border-[#d07d22] group-hover:shadow-[0_0_20px_rgba(208,125,34,0.4)] group-hover:scale-110 transition-all duration-500 z-10">
                  {member.name.charAt(0)}
                </div>

                <div className="ml-6 flex flex-col">
                  <h3 className="font-display font-bold text-[22px] text-[#f4ede4] leading-none mb-1 group-hover:text-[#d07d22] transition-colors">
                    {member.name}
                  </h3>
                  <div className="font-mono text-[#ac120c] text-[11px] tracking-widest uppercase mb-3">
                    {member.role}
                  </div>
                  <p className="font-body text-[#bfa8a2] text-[14px] leading-relaxed italic">
                    {member.blurb}
                  </p>
                </div>

                {/* Decorative Element */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 group-hover:rotate-90 transition-all duration-700">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d07d22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"></path><path d="M12 2v20"></path></svg>
                </div>

              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Core Team Section */}
        <ScrollReveal delay={200}>
          <div className="flex flex-col items-center mt-24 mb-12 text-center">
            <h3 className="font-display font-bold text-[28px] text-[#f4ede4]">
              Core <span className="text-[#ac120c]">Team.</span>
            </h3>
            <div className="w-12 h-1 bg-[#2a0d0d] mt-4 rounded-full"></div>
          </div>
        </ScrollReveal>

        <div className="flex flex-wrap justify-center gap-4 max-w-[800px] mx-auto">
          {CORE.map((member, i) => (
            <ScrollReveal key={member.name} delay={100 + i * 100}>
              <div className="group flex items-center gap-4 px-6 py-4 rounded-xl border border-[#2a0d0d] bg-[#070101]/80 backdrop-blur transition-all duration-500 hover:border-[#ac120c]/60 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(172,18,12,0.2)] hover:bg-[#120202]">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#120202] border border-[#2a0d0d] flex items-center justify-center font-display font-bold text-[#f4ede4] group-hover:border-[#ac120c] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(172,18,12,0.4)] transition-all duration-500">
                  {member.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-[#f4ede4] group-hover:text-[#ff5a4f] transition-colors">{member.name}</span>
                  <span className="font-mono text-[10px] text-[#ac120c] uppercase tracking-widest">{member.role}</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  )
}
