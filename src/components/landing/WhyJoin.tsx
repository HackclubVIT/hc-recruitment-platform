"use client"

import React from "react"

export function WhyJoin() {
  return (
    <section id="why-join" className="relative py-24 px-6 max-w-[1000px] mx-auto">
      
      <div className="flex flex-col items-center mb-16 text-center">
        <div className="inline-flex items-center gap-2 mb-4 font-mono text-[11.5px] tracking-[0.26em] text-[#ac120c] uppercase">
          <svg viewBox="0 0 18 18" width="14" height="14" aria-hidden="true">
            <rect x="4.5" y="4.5" width="9" height="9" rx="1.5" transform="rotate(45 9 9)" fill="none" stroke="#ac120c" strokeWidth="2" />
          </svg>
          WHO WE ARE
        </div>
        <h2 className="font-display font-bold text-[32px] sm:text-[48px] text-[#f4ede4] mb-12">
          About Us
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 opacity-100 translate-y-0 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
        
        {/* Left: Text Content */}
        <div className="flex flex-col gap-5 text-left">
          <p className="font-display font-medium text-[#f4ede4] text-[19px] sm:text-[24px] leading-[1.5]">
            We're a group of enthusiastic students building an inclusive environment for anyone starting out with tech projects.
          </p>
          <p className="font-body text-[#bfa8a2] text-[16px] leading-[1.75]">
            The name says hack, but nobody's breaking into anything — we hack in the original sense: clever, fast, joyful building. From your first <code className="font-mono text-[#d07d22] bg-[rgba(172,18,12,0.1)] px-2 py-0.5 rounded text-[0.88em]">console.log</code> to shipping models in production, there's a seat and a senior for you here.
          </p>
          <p className="font-body text-[#bfa8a2] text-[16px] leading-[1.75]">
            We firmly believe <strong className="text-[#ac120c]">no task is insurmountable</strong> and <strong className="text-[#ac120c]">no goal is out of reach</strong>.
          </p>
        </div>

        {/* Right: Info Panel */}
        <div className="flex flex-col gap-4 border border-[#2a0d0d] rounded-[10px] bg-[rgba(18,2,2,0.6)] p-6 font-mono text-[13px] self-start w-full">
          <div className="flex flex-col gap-1 text-[#f4ede4]">
            <span className="text-[#ac120c] text-[11px] tracking-[0.12em] uppercase">// domains</span>
            web · app · ml · hardware · systems
          </div>
          <div className="flex flex-col gap-1 text-[#f4ede4]">
            <span className="text-[#ac120c] text-[11px] tracking-[0.12em] uppercase">// founded</span>
            2021, by 6 students and one whiteboard
          </div>
          <div className="flex flex-col gap-1 text-[#f4ede4]">
            <span className="text-[#ac120c] text-[11px] tracking-[0.12em] uppercase">// meets</span>
            every week, all semester
          </div>
          <div className="flex flex-col gap-1 text-[#f4ede4]">
            <span className="text-[#ac120c] text-[11px] tracking-[0.12em] uppercase">// entry barrier</span>
            none. seriously.
          </div>
          
          <div className="mt-2 h-[70px] flex items-end gap-1.5 border-t border-dashed border-[rgba(244,237,228,0.1)] pt-3" aria-hidden="true">
            {[68, 90, 45, 78, 58, 84, 36, 95, 62, 74].map((h, i) => (
              <i 
                key={i} 
                className="flex-1 bg-gradient-to-t from-[rgba(172,18,12,0.85)] to-[rgba(208,125,34,0.25)] rounded-t-[2px] origin-bottom animate-[hc-bar_2.6s_ease-in-out_infinite_alternate]"
                style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
              />
            ))}
          </div>
        </div>

      </div>

    </section>
  )
}
