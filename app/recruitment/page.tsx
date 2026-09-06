"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { fetchApi } from "@/api-client"

export default function RecruitmentLandingPage() {
  const [publishedForms, setPublishedForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadForms() {
      try {
        const res = await fetchApi('/api/forms/published')
        if (res.ok) {
          const data = await res.json()
          setPublishedForms(data.forms || [])
        }
      } catch (err) {
        console.error("Failed to fetch published forms:", err)
      } finally {
        setLoading(false)
      }
    }
    loadForms()
  }, [])

  return (
    <div className="min-h-screen bg-[#020000] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full animate-[fadeIn_0.5s_ease-out]">
        <div className="mb-12">
          <h1 className="font-display font-black text-white text-4xl sm:text-5xl lg:text-6xl mb-6 tracking-tight uppercase">
            Recruitment Portals
          </h1>
          <p className="font-body text-[#bfa8a2] text-lg max-w-2xl mx-auto leading-relaxed">
            Select an active recruitment form below to begin your application process. 
            Ensure you meet all prerequisites before applying.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {loading ? (
            <div className="col-span-1 md:col-span-2 text-[#bfa8a2] font-mono border border-[#2a0d0d] bg-[#120202] p-10 rounded-xl">
              Loading active recruitment cycles...
            </div>
          ) : publishedForms.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-[#bfa8a2] font-mono border border-[#2a0d0d] bg-[#120202] p-10 rounded-xl">
              No recruitment cycles are currently active. Please check back later.
            </div>
          ) : (
            publishedForms.map(form => (
              <Link 
                href={`/recruitment/apply?formId=${form.id}`} 
                key={form.id}
                className="group flex flex-col text-left border border-[#2a0d0d] bg-[#120202] rounded-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:border-[#ac120c]/40 shadow-lg hover:shadow-[0_0_20px_rgba(172,18,12,0.15)]"
              >
                <h2 className="font-display font-bold text-2xl text-[#f4ede4] mb-3 group-hover:text-white transition-colors">
                  {form.title}
                </h2>
                <p className="font-body text-[#bfa8a2] flex-1 line-clamp-3 leading-relaxed mb-6">
                  {form.description || "No description provided."}
                </p>
                <div className="flex justify-between items-center mt-auto font-mono text-[11px] uppercase tracking-wider">
                  <span className="text-[#2ecc71] font-bold">● Active</span>
                  <span className="text-[#ac120c] font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                    Apply Now
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14m-7-7 7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
