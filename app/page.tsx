"use client"

import React, { useState } from "react"
import { LaunchScreen } from "@/components/landing/LaunchScreen"
import { BackgroundEffects } from "@/components/landing/BackgroundEffects"
import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { WhyJoin } from "@/components/landing/WhyJoin"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { OpenRoles } from "@/components/landing/OpenRoles"
import { FAQ } from "@/components/landing/FAQ"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { Footer } from "@/components/landing/Footer"
import { MemorableEvents } from "@/components/landing/MemorableEvents"
import { Board } from "@/components/landing/Board"

export default function Home() {
  const [launchComplete, setLaunchComplete] = useState(false)

  return (
    <main className="relative min-h-[100dvh] bg-[#020000] text-white overflow-x-hidden font-body selection:bg-[#ac120c]/30 selection:text-white">
      {!launchComplete && (
        <LaunchScreen onComplete={() => setLaunchComplete(true)} />
      )}
      
      {/* Content fades in after launch screen */}
      <div 
        className={`transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          launchComplete ? "opacity-100" : "opacity-0 pointer-events-none h-[100dvh] overflow-hidden"
        }`}
      >
        <BackgroundEffects />
        <Navbar />
        
        <Hero />
        <HowItWorks />
        <MemorableEvents />
        <Board />
        <WhyJoin />
        <OpenRoles />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </main>
  )
}
