"use client"

import React from "react"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

const steps = [
  {
    number: "01",
    title: "APPLICATION",
    description: "Submit your application form detailing your background, skills, and why you want to join."
  },
  {
    number: "02",
    title: "REVIEW",
    description: "Our panel members review your profile, projects, and form responses carefully."
  },
  {
    number: "03",
    title: "INTERVIEW",
    description: "A technical or behavioral interview to understand your mindset, problem-solving skills, and culture fit."
  },
  {
    number: "04",
    title: "SELECTION",
    description: "Final evaluation and onboarding into the HackClub VIT Chennai ecosystem."
  }
]

export function HowItWorks() {
  return (
    <section id="process" className="relative py-24 bg-[#0a0101] border-y border-[#2a0d0d]">
      <ScrollReveal delay={200}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col items-center mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-[#ac120c]/30 bg-[rgba(172,18,12,0.1)] text-[#ac120c] font-mono text-[11px] tracking-[0.1em] uppercase">
            Recruitment Process
          </div>
          <h2 className="font-display font-bold text-[32px] sm:text-[40px] text-[#f4ede4]">
            How to get <span className="text-[#ac120c]">in.</span>
          </h2>
        </div>

        {/* Desktop Horizontal Timeline, Mobile Vertical Timeline */}
        <div className="relative flex flex-col md:flex-row justify-between gap-12 md:gap-4">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[28px] left-[50px] right-[50px] h-[2px] bg-gradient-to-r from-transparent via-[#ac120c]/40 to-transparent z-0"></div>
          
          {/* Connector Line (Mobile) */}
          <div className="md:hidden absolute top-[50px] bottom-[50px] left-[28px] w-[2px] bg-gradient-to-b from-transparent via-[#ac120c]/40 to-transparent z-0"></div>

          {steps.map((step, i) => (
            <div key={i} className="relative z-10 flex flex-row md:flex-col items-start md:items-center gap-6 md:gap-6 w-full md:w-1/4 group cursor-default">
              {/* Number Circle */}
              <div className="shrink-0 w-14 h-14 rounded-full bg-[#120202] border border-[#d07d22]/30 flex items-center justify-center font-mono font-bold text-[18px] text-[#d07d22] shadow-[0_0_20px_rgba(208,125,34,0.1)] group-hover:scale-110 group-hover:border-[#d07d22] group-hover:shadow-[0_0_30px_rgba(208,125,34,0.3)] transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] relative">
                {step.number}
                <div className="absolute inset-0 rounded-full border border-[#d07d22]/0 group-hover:border-[#d07d22]/50 group-hover:animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
              </div>
              
              {/* Content */}
              <div className="flex flex-col md:items-center text-left md:text-center mt-2 md:mt-0">
                <h3 className="font-mono font-bold text-[16px] text-[#f4ede4] tracking-widest mb-2 group-hover:text-[#d07d22] transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="font-body text-[#bfa8a2] text-[14px] leading-relaxed max-w-[250px]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </ScrollReveal>
    </section>
  )
}
