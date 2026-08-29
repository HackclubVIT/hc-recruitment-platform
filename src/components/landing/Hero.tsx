"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"

const STATS = [
  { value: 250, suffix: "+", label: "Active Members" },
  { value: 40, suffix: "+", label: "Projects Completed" },
  { value: 20, suffix: "+", label: "Hackathons" },
  { value: 20, suffix: "+", label: "Workshops" },
]

export function Hero() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-32 px-6 text-center overflow-hidden pb-24">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNykiLz48L3N2Zz4=')] opacity-30 mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(172,18,12,0.15)_0,transparent_60%)] blur-[60px]" />
      </div>

      <div className="relative z-10 animate-fade-in-up flex flex-col items-center w-full max-w-[1180px]" style={{ animationDelay: "0.2s" }}>
        
        {/* HACKCLUB Title */}
        <h1 
          className="font-display font-black text-[#f4ede4] leading-[1.0] mb-6 tracking-tight relative"
          style={{ fontSize: "clamp(3.5rem, 10vw, 7.5rem)" }}
        >
          HACK<span className="text-[#ac120c] relative inline-block">
            CLUB
            <div className="absolute -inset-4 bg-[#ac120c] opacity-20 blur-2xl -z-10 rounded-full"></div>
          </span>
        </h1>
        
        <p className="font-display font-bold text-[#f4ede4] max-w-2xl mx-auto mb-4 text-[18px] sm:text-[22px] leading-[1.6]">
          Making dreams a collective reality.
        </p>

        <p className="font-body text-[#bfa8a2] max-w-2xl mx-auto mb-10 text-[16px] sm:text-[18px] leading-[1.7]">
          A technical club for builders — web, ML, hardware and everything in between.
          No experience needed. Just bring the itch to make things.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16">
          <Link 
            href="/login" 
            className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2"
            style={{ padding: "16px 36px", fontSize: "15px", textDecoration: "none" }}
          >
            APPLY NOW
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </Link>
          <a 
            href="#why-join" 
            className="w-full sm:w-auto btn-ghost flex items-center justify-center gap-2"
            style={{ padding: "16px 36px", fontSize: "15px", textDecoration: "none" }}
          >
            EXPLORE
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg>
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {STATS.map((stat, i) => (
            <div 
              key={stat.label} 
              className={`relative border border-[#2a0d0d] rounded-xl p-6 bg-[#120202]/60 backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] text-left hover:border-[#ac120c]/50 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="font-display font-bold text-[#f4ede4] text-3xl sm:text-4xl mb-2">
                {stat.value}<em className="text-[#ac120c] not-italic">{stat.suffix}</em>
              </div>
              <div className="font-mono text-[#bfa8a2] text-[10px] sm:text-[11px] tracking-widest uppercase">
                {stat.label}
              </div>
              <svg className="absolute left-3 bottom-3 w-4 h-4 opacity-80" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 22V10M2 2h12" stroke="#ac120c" strokeWidth="2" fill="none" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Technical Elements */}
      <div className="absolute bottom-10 left-10 hidden lg:flex flex-col gap-2 font-mono text-[10px] text-[#bfa8a2]/50 tracking-widest text-left">
        <span>SYS.STATUS: ONLINE</span>
        <span>REC.PROTOCOL: INITIATED</span>
        <span>V.2026.1</span>
      </div>
    </section>
  )
}
