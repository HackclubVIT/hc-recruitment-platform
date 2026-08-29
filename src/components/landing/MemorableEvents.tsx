"use client"

import React, { useRef } from "react"
import Image from "next/image"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

const EVENTS = [
  {
    id: "hacknight",
    tag: "HACKATHON",
    name: "HackNight 24-25",
    date: "March 1-3, 2025",
    desc: "Our flagship 36h hackathon. Filled with energetic vibes and crazy innovations across the event.",
    image: "/images/hacknight.jpg",
  },
  {
    id: "webdev",
    tag: "WORKSHOP",
    name: "WebVerse",
    date: "August 8, 2025",
    desc: "A hands-on workshop taking absolute beginners from a blank file to a deployed personal site in one afternoon.",
    image: "/images/webverse.jpg",
  },
  {
    id: "hackwell",
    tag: "HACKATHON",
    name: "Hackwell",
    date: "September 15, 2025",
    desc: "One Day Hackathon. Sponsored by WellDoc.",
    image: "/images/hackwell.jpg",
  },
  {
    id: "epoch",
    tag: "BUILDATHON",
    name: "Epochesque",
    date: "September 22-23, 2025",
    desc: "2 day high powered buildathon along with speaker session by Sudhakar Rayavaram",
    image: "/images/epoch.jpg",
  },
  {
    id: "debug",
    tag: "EVENT",
    name: "Debug The Drama",
    date: "October 31, 2025",
    desc: "Decode the clues, spark your creativity, and race against time to debug the drama!",
    image: "/images/debug-the-drama.jpg",
  },
  {
    id: "sketch2stage",
    tag: "EVENT",
    name: "Sketch2Stage",
    date: "October 31, 2025",
    desc: "A UI/UX design and prototyping competition where participants sketch a concept, design it using digital tools like Figma, and pitch their final creation to the judges.",
    image: "/images/sketch2stage.jpg",
  },
  {
    id: "codegolf",
    tag: "EVENT",
    name: "Code Golf",
    date: "November 1, 2025",
    desc: "A competitive solo programming challenge where you must solve problems using the fewest possible characters because the shortest code wins.",
    image: "/images/code-golf.jpg",
  },
  {
    id: "finedge hackathon",
    tag: "HACKATHON",
    name: "VInd FinEdge Hackathon",
    date: "April 6, 2026",
    desc: "A multi-stage financial technology hackathon backed by the Ministry of Finance.",
    image: "/images/finedge-hackathon.jpg",
  }
]

export function MemorableEvents() {

  return (
    <section id="events" className="relative py-24 bg-[#020000] border-y border-[#2a0d0d] overflow-hidden">
      
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1000px] bg-[radial-gradient(ellipse_at_center,rgba(172,18,12,0.05)_0%,transparent_70%)] pointer-events-none" />

      <ScrollReveal delay={100}>
        <div className="max-w-[1400px] mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex flex-col">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-[#ac120c]/30 bg-[rgba(172,18,12,0.1)] text-[#ac120c] font-mono text-[11px] tracking-[0.1em] uppercase w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a4f] animate-pulse"></span>
              On the Launchpad
            </div>
            <h2 className="font-display font-bold text-[32px] sm:text-[48px] text-[#f4ede4] leading-tight">
              Memorable <span className="text-[#ac120c]">Events.</span>
            </h2>
            <p className="font-body text-[#bfa8a2] mt-4 max-w-xl text-[16px]">
              Workshops, hackathons, guest lectures, and collaborative build nights — here's a glimpse into the chaos we ship.
            </p>
          </div>
          
        </div>
      </ScrollReveal>

      {/* Infinite Marquee Carousel */}
      <ScrollReveal delay={200}>
        <div className="relative w-full overflow-hidden flex pb-12 pt-4 group">
          {/* Fading Edges */}
          <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-[#020000] to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-[#020000] to-transparent z-20 pointer-events-none" />

          {/* Marquee Track */}
          <div className="flex w-max marquee-track">
            
            {/* First Set */}
            <div className="flex gap-6 pr-6">
              {EVENTS.map((ev, i) => (
                <div 
                  key={`set1-${ev.id}-${i}`} 
                  className="group/card relative shrink-0 w-[300px] sm:w-[380px] h-[480px] rounded-[24px] border border-[#2a0d0d] overflow-hidden bg-[#0a0101] transition-all duration-500 hover:border-[#ac120c]/60 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(172,18,12,0.2)]"
                >
                  {/* Event Image */}
                  {ev.image ? (
                    <div className="absolute inset-0 z-0 bg-[#070101]">
                      <Image 
                        src={ev.image} 
                        alt={ev.name} 
                        fill 
                        sizes="(max-width: 640px) 300px, 380px"
                        className="object-cover opacity-50 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]" 
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#120202] to-[#2a0d0d]" />
                  )}
                  
                  {/* Dark Gradient Overlay strictly for text readability at the bottom */}
                  <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#020000] via-[#020000]/70 to-transparent opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end pointer-events-none">
                    <div className="inline-flex items-center gap-2 mb-3">
                      <span className="font-mono text-[#d07d22] text-[10px] tracking-widest uppercase bg-[#020000]/80 backdrop-blur-md px-2 py-1 rounded border border-[#d07d22]/30">
                        {ev.tag}
                      </span>
                      <span className="font-mono text-[#bfa8a2] text-[11px] tracking-widest">
                        {ev.date}
                      </span>
                    </div>
                    
                    <h3 className="font-display font-bold text-[28px] text-[#f4ede4] leading-tight mb-3 transition-colors duration-300 group-hover/card:text-[#ff5a4f]">
                      {ev.name}
                    </h3>
                    
                    {/* Description is visible on hover (via parent hover state trick) */}
                    <div className="h-auto md:h-0 md:opacity-0 md:-translate-y-4 transition-all duration-500 overflow-hidden group-hover/card:h-auto group-hover/card:opacity-100 group-hover/card:translate-y-0">
                      <p className="font-body text-[#bfa8a2] text-[15px] leading-relaxed">
                        {ev.desc}
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Second Set (Duplicate for infinite loop) */}
            <div className="flex gap-6 pr-6">
              {EVENTS.map((ev, i) => (
                <div 
                  key={`set2-${ev.id}-${i}`} 
                  className="group/card relative shrink-0 w-[300px] sm:w-[380px] h-[480px] rounded-[24px] border border-[#2a0d0d] overflow-hidden bg-[#0a0101] transition-all duration-500 hover:border-[#ac120c]/60 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(172,18,12,0.2)]"
                >
                  {/* Event Image */}
                  {ev.image ? (
                    <div className="absolute inset-0 z-0 bg-[#070101]">
                      <Image 
                        src={ev.image} 
                        alt={ev.name} 
                        fill 
                        sizes="(max-width: 640px) 300px, 380px"
                        className="object-cover opacity-50 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]" 
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#120202] to-[#2a0d0d]" />
                  )}
                  
                  {/* Dark Gradient Overlay strictly for text readability at the bottom */}
                  <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#020000] via-[#020000]/70 to-transparent opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end pointer-events-none">
                    <div className="inline-flex items-center gap-2 mb-3">
                      <span className="font-mono text-[#d07d22] text-[10px] tracking-widest uppercase bg-[#020000]/80 backdrop-blur-md px-2 py-1 rounded border border-[#d07d22]/30">
                        {ev.tag}
                      </span>
                      <span className="font-mono text-[#bfa8a2] text-[11px] tracking-widest">
                        {ev.date}
                      </span>
                    </div>
                    
                    <h3 className="font-display font-bold text-[28px] text-[#f4ede4] leading-tight mb-3 transition-colors duration-300 group-hover/card:text-[#ff5a4f]">
                      {ev.name}
                    </h3>
                    
                    {/* Description is visible on hover (via parent hover state trick) */}
                    <div className="h-auto md:h-0 md:opacity-0 md:-translate-y-4 transition-all duration-500 overflow-hidden group-hover/card:h-auto group-hover/card:opacity-100 group-hover/card:translate-y-0">
                      <p className="font-body text-[#bfa8a2] text-[15px] leading-relaxed">
                        {ev.desc}
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </ScrollReveal>
      
      {/* Hide scrollbar styles for Webkit */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 40s linear infinite;
        }
        .group:hover .marquee-track {
          animation-play-state: paused;
        }
      `}} />
    </section>
  )
}
