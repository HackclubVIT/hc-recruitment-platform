"use client"

import React, { useMemo } from "react"
import { useReducedMotion } from "@/lib/hooks/useReducedMotion"

function generateStars(count: number) {
  let shadow = ""
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 2000)
    const y = Math.floor(Math.random() * 2000)
    shadow += `${x}px ${y}px #FFF${i === count - 1 ? "" : ", "}`
  }
  return shadow
}

export function BackgroundEffects() {
  const prefersReducedMotion = useReducedMotion()
  
  // Memoize static box-shadows so they don't re-render and cause hydration mismatches
  const { stars1, stars2 } = useMemo(() => {
    // Only generate stars on client to avoid hydration mismatch, or provide a deterministic seed
    // For simplicity, we just use random and suppress hydration warnings or render on mount
    return {
      stars1: generateStars(200),
      stars2: generateStars(100)
    }
  }, [])

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#020000]">
      
      {/* CSS Starfield */}
      {mounted && !prefersReducedMotion && (
        <div className="absolute inset-0 opacity-40">
          <div 
            className="w-[1px] h-[1px] bg-transparent animate-stars"
            style={{ boxShadow: stars1 }}
          />
          <div 
            className="w-[2px] h-[2px] bg-transparent animate-stars-slow opacity-60"
            style={{ boxShadow: stars2 }}
          />
        </div>
      )}

      {/* Radial glow top left */}
      <div 
        className="absolute w-[800px] h-[800px] rounded-full opacity-30 mix-blend-screen animate-pulse-slow"
        style={{
          top: "-300px",
          left: "-200px",
          background: "radial-gradient(circle, rgba(172, 18, 12, 0.4) 0%, transparent 70%)"
        }}
      />
      
      {/* Radial glow bottom right */}
      <div 
        className="absolute w-[900px] h-[900px] rounded-full opacity-25 mix-blend-screen animate-pulse-slow"
        style={{
          bottom: "-400px",
          right: "-300px",
          background: "radial-gradient(circle, rgba(208, 125, 34, 0.25) 0%, transparent 65%)",
          animationDelay: "1s"
        }}
      />
      
      {/* Subtle Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />
    </div>
  )
}
