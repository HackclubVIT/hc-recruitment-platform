"use client"

import React from "react"
import Link from "next/link"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

export function FinalCTA() {
  return (
    <section className="relative py-32 px-6 max-w-[1000px] mx-auto text-center">
      <ScrollReveal>
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[radial-gradient(circle_at_center,rgba(208,125,34,0.1)_0,transparent_70%)] blur-[40px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center">
        <h2 
          className="font-display font-black text-[#f4ede4] mb-6 leading-tight"
          style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
        >
          READY TO BUILD WITH <span className="text-[#ac120c]">US?</span>
        </h2>
        
        <p className="font-mono text-[#bfa8a2] text-[16px] sm:text-[20px] mb-12 tracking-wider">
          Your next project could start here.
        </p>

        <Link 
          href="/login" 
          className="btn-primary inline-flex items-center justify-center gap-3"
          style={{ padding: "20px 48px", fontSize: "16px", textDecoration: "none" }}
        >
          LOGIN
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </Link>
      </div>
      </ScrollReveal>
    </section>
  )
}

