"use client"
import React, { useEffect, useState } from "react"

export function LaunchScreen({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setReduceMotion(isReduced)

    if (isReduced) {
      onComplete()
      return
    }

    // Stage 0: Dark screen (0 - 400ms)
    // Stage 1: "h." (400ms - 1200ms)
    // Stage 2: "HackClub" (1200ms - 2200ms)
    // Complete: 2500ms

    const t1 = setTimeout(() => setStage(1), 400)
    const t2 = setTimeout(() => setStage(2), 1200)
    const t3 = setTimeout(() => {
      setStage(3)
      setTimeout(onComplete, 500)
    }, 2200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  if (reduceMotion || stage === 3) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020000] text-[#f4ede4] font-display font-black overflow-hidden selection:bg-transparent">
      <div 
        className={`transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${stage === 0 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        <span 
          className="text-white text-[4rem] sm:text-[6rem] md:text-[8rem] tracking-tighter"
          style={{ letterSpacing: "-0.05em" }}
        >
          {stage === 1 && (
            <span className="animate-[fadeInUp_0.5s_cubic-bezier(0.2,0.8,0.2,1)]">h.</span>
          )}
          {stage === 2 && (
            <span className="animate-[fadeInUp_0.5s_cubic-bezier(0.2,0.8,0.2,1)] inline-flex items-center">
              HackClub
              <span className="text-[#ac120c]">.</span>
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
