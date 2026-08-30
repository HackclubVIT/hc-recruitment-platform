"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

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

      <div className="relative z-10 flex flex-col items-center w-full max-w-[1180px]">
        
        <ScrollReveal delay={100}>
          <div className="relative group/logo cursor-default">
            <h1 
              className="font-display font-black leading-[1.0] mb-6 tracking-tight relative text-center flex items-center justify-center transition-transform duration-700 group-hover/logo:scale-105"
              style={{ fontSize: "clamp(3.5rem, 10vw, 7.5rem)" }}
            >
              {/* White Glow behind HACK */}
              <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white opacity-0 group-hover/logo:opacity-10 blur-3xl rounded-full transition-opacity duration-700 pointer-events-none"></div>
              
              <span className="text-[#FFF] drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover/logo:drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all duration-500 z-10">
                HACK
              </span>
              
              <span className="text-[#ff2a1f] relative inline-block drop-shadow-[0_0_15px_rgba(252,42,31,0.2)] group-hover/logo:drop-shadow-[0_0_35px_rgba(252,42,31,0.5)] transition-all duration-500 z-10">
                CLUB
                {/* Intense Red Glow behind CLUB */}
                <div className="absolute -inset-4 bg-[#ff2a1f] opacity-20 blur-2xl -z-10 rounded-full group-hover/logo:opacity-40 group-hover/logo:scale-110 transition-all duration-700 animate-pulse-slow"></div>
              </span>
            </h1>
          </div>
        </ScrollReveal>
        
        <ScrollReveal delay={200}>
          <p className="font-display font-bold text-[#f4ede4] max-w-2xl mx-auto mb-4 text-[18px] sm:text-[22px] leading-[1.6]">
            Making dreams a collective reality.
          </p>
        </ScrollReveal>



        <ScrollReveal delay={300}>
          <p className="font-body text-[#bfa8a2] max-w-2xl mx-auto mb-10 text-[16px] sm:text-[18px] leading-[1.7]">
            A technical club for builders — web, ML, hardware and everything in between.
            No experience needed. Just bring the itch to make things.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={400} className="w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16">
            
            {/* Animated Apply Button */}
            <div className="relative group/btn w-full sm:w-auto">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#ac120c] to-[#d07d22] rounded-full blur-lg opacity-30 group-hover/btn:opacity-60 transition duration-700 animate-pulse-slow"></div>
              <Link 
                href="/login" 
                className="relative btn-primary flex items-center justify-center gap-2 w-full sm:w-auto overflow-hidden group-hover/btn:shadow-[0_0_30px_rgba(172,18,12,0.6)]"
                style={{ padding: "16px 36px", fontSize: "15px", textDecoration: "none" }}
              >
                <span className="relative z-10 font-bold tracking-widest">LOGIN</span>
                <svg className="relative z-10" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                {/* Glitch overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
              </Link>
            </div>
            <a 
              href="#why-join" 
              className="w-full sm:w-auto btn-ghost flex items-center justify-center gap-2"
              style={{ padding: "16px 36px", fontSize: "15px", textDecoration: "none" }}
            >
              EXPLORE
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg>
            </a>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {STATS.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={500 + i * 100}>
              <div 
                className="relative border border-[#2a0d0d] rounded-xl p-6 bg-[#120202]/60 backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] text-left hover:border-[#ac120c]/50"
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
            </ScrollReveal>
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
