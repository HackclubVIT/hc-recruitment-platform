"use client"

import React from "react"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

const overviewItems = [
  {
    title: "Technology",
    desc: "Build platforms, tools, and experiences that scale.",
    icon: (
      <svg className="w-6 h-6 text-[#ac120c] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    )
  },
  {
    title: "Design",
    desc: "Craft beautiful, intuitive, and premium interfaces.",
    icon: (
      <svg className="w-6 h-6 text-[#ac120c] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    )
  },
  {
    title: "Community",
    desc: "Foster growth, organize events, and shape the culture.",
    icon: (
      <svg className="w-6 h-6 text-[#ac120c] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  }
]

export function Overview() {
  return (
    <section id="overview" className="py-24 px-6 max-w-[1200px] mx-auto">
      <ScrollReveal className="text-center mb-16">
        <h2 className="font-display font-bold text-white text-3xl sm:text-5xl mb-6 tracking-tight">
          BUILD SOMETHING <br className="sm:hidden" /> THAT MATTERS.
        </h2>
        <p className="font-body text-[#bfa8a2] max-w-2xl mx-auto text-lg">
          HackClub VIT Chennai is looking for students who want to contribute to our core domains. We don't just talk about ideas, we ship them.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {overviewItems.map((item, i) => (
          <ScrollReveal key={i} delay={i * 150}>
            <div 
              className="card-glass flex flex-col gap-4 text-left group h-full cursor-default"
              style={{
                transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)"
              }}
            >
              <div className="w-12 h-12 rounded-[14px] bg-[#ac120c]/10 border border-[#ac120c]/30 flex items-center justify-center mb-2 group-hover:bg-[#ac120c] group-hover:border-[#ac120c] group-hover:shadow-[0_0_20px_rgba(172,18,12,0.4)] transition-all duration-300">
                {item.icon}
              </div>
              <h3 className="font-display font-bold text-white text-xl">
                {item.title}
              </h3>
              <p className="font-body text-[#bfa8a2] leading-relaxed">
                {item.desc}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
