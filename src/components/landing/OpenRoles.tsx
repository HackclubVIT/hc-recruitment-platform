"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { api } from "@/api-client"

export function OpenRoles() {
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPublishedForms()
      .then(data => {
        setForms(data.forms || [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  return (
    <section id="recruitment" className="relative py-24 px-6 max-w-[1200px] mx-auto">
      <ScrollReveal delay={100}>
        <div className="flex flex-col items-center mb-16 text-center">
          <h2 className="font-display font-bold text-[32px] sm:text-[40px] text-[#f4ede4] mb-4">
            Open <span className="text-[#ac120c]">Opportunities</span>
          </h2>
          <p className="font-body text-[#bfa8a2] max-w-2xl text-[16px] sm:text-[18px]">
            Find where you fit in. We are actively recruiting for the following domains.
          </p>
        </div>
      </ScrollReveal>

      {loading ? (
        <ScrollReveal delay={200}>
          <div className="flex justify-center items-center py-20 font-mono text-[14px] text-[#bfa8a2] tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#d07d22] animate-pulse mr-3"></span>
            Scanning for opportunities...
          </div>
        </ScrollReveal>
      ) : forms.length === 0 ? (
        <ScrollReveal delay={200}>
          <div className="text-center p-12 bg-[#120202] border border-[#2a0d0d] rounded-[24px]">
            <p className="font-mono text-[#bfa8a2] text-[14px] tracking-widest uppercase mb-4">No active recruitment</p>
            <p className="font-body text-[#f4ede4]">We aren't actively recruiting right now. Check back later!</p>
          </div>
        </ScrollReveal>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form, i) => (
            <ScrollReveal key={form.id} delay={300 + i * 150}>
              <Link 
                href={`/recruitment/${form.id}`} 
                className="group relative flex flex-col p-8 rounded-[20px] bg-[#120202] border border-[#2a0d0d] transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-2 hover:border-[#ac120c]/40 overflow-hidden"
                style={{ textDecoration: "none" }}
              >
                {/* Subtle hover glow */}
                <div className="absolute -inset-4 bg-[#ac120c] opacity-0 blur-xl group-hover:opacity-10 transition-opacity duration-500 rounded-full z-0 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71]"></span>
                    <span className="font-mono text-[10px] text-[#bfa8a2] uppercase tracking-widest">Active Portal</span>
                  </div>
                  
                  <h3 className="font-display font-bold text-[22px] text-[#f4ede4] mb-3 group-hover:text-white transition-colors duration-300">
                    {form.title}
                  </h3>
                  
                  <p className="font-body text-[#bfa8a2] text-[14px] leading-relaxed mb-8 flex-1 line-clamp-3">
                    {form.description || "Join this domain and build amazing things."}
                  </p>
                  
                  <div className="flex justify-between items-center mt-auto font-mono text-[12px] uppercase tracking-widest text-[#d07d22]">
                    <span className="group-hover:text-[#ac120c] transition-colors duration-300">Login</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 group-hover:text-[#ac120c] transition-all duration-300">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}
    </section>
  )
}
