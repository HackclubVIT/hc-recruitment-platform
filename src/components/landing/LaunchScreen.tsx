"use client"
import React, { useState, useEffect } from "react"

export function LaunchScreen({ onComplete }: { onComplete: () => void }) {
  const [showSplashPhase, setShowSplashPhase] = useState(0)
  const [splashText, setSplashText] = useState('')

  useEffect(() => {
    const textTimer = window.setTimeout(() => {
      setShowSplashPhase(1)
    }, 1200)

    const text = 'HackClub'
    const intervals: NodeJS.Timeout[] = []
    for (let i = 1; i <= text.length; i++) {
        const timer = setTimeout(() => {
            setSplashText(text.substring(0, i))
        }, 1200 + (i * 100))
        intervals.push(timer)
    }

    const hideTimer = window.setTimeout(() => {
      if (onComplete) onComplete()
    }, 1200 + (text.length * 100) + 800)

    return () => {
      window.clearTimeout(textTimer)
      window.clearTimeout(hideTimer)
      intervals.forEach(clearTimeout)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020000] overflow-hidden">
      {/* Dynamic Background Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(172,18,12,0.15)_0%,rgba(2,0,0,1)_70%)] animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#f25b24] rounded-full blur-[150px] opacity-10 animate-[spin_10s_linear_infinite]" />
      
      {/* Floating Particles (CSS only) */}
      <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCA5MCwgNzksIDEpIi8+PC9zdmc+')] [mask-image:radial-gradient(circle,black,transparent_80%)] animate-[pulse_4s_ease-in-out_infinite]" />

      {/* Glassmorphic Container */}
      <div className="relative z-10 flex items-center justify-center min-w-[280px] sm:min-w-[400px] h-[160px] sm:h-[220px] px-8 py-6 rounded-3xl bg-[#0a0101]/40 backdrop-blur-xl border border-[#ac120c]/20 shadow-[0_0_80px_rgba(172,18,12,0.2)] transition-all duration-700">
        
        {/* Animated Rings around the container */}
        <div className="absolute inset-0 rounded-3xl border border-[#f25b24]/30 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
        
        {showSplashPhase === 0 ? (
          <div className="flex items-end justify-center font-display font-black text-[120px] sm:text-[160px] tracking-tighter leading-none animate-[zoom-in-bounce_0.8s_ease-out_forwards] drop-shadow-[0_0_30px_rgba(242,91,36,0.6)]">
            <span className="text-[#ff5a4f]">h</span>
            <span className="text-[#f25b24] animate-[pulse_1s_ease-in-out_infinite]">.</span>
          </div>
        ) : (
          <div className="flex items-center justify-center font-display font-black text-[70px] sm:text-[110px] tracking-tight text-[#ff5a4f] drop-shadow-[0_0_20px_rgba(242,91,36,0.5)] whitespace-nowrap">
            {splashText}
            <span className="ml-1 w-[6px] sm:w-[8px] h-[60px] sm:h-[100px] bg-[#f25b24] animate-[pulse_0.8s_steps(2,start)_infinite]"></span>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes zoom-in-bounce {
          0% { opacity: 0; transform: scale(0.3) translateY(20px); }
          50% { opacity: 1; transform: scale(1.1) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </div>
  )
}
