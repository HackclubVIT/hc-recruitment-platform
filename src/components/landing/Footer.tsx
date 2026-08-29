"use client"

import React from "react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative border-t border-[#2a0d0d] bg-[#0a0101] py-12 px-6">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <Link href="/" className="flex items-center gap-3 no-underline group">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#720907] to-[#ac120c] flex items-center justify-center font-display font-black text-white text-[18px] group-hover:scale-110 transition-transform">
              h.
            </div>
            <span className="font-display font-bold text-[#f4ede4] tracking-wide">
              HackClub VIT Chennai
            </span>
          </Link>
          <p className="font-mono text-[#bfa8a2] text-[12px] tracking-widest uppercase mt-2">
            Recruitment Platform © {new Date().getFullYear()}
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 font-mono text-[12px] uppercase tracking-widest text-[#bfa8a2]">
          <a href="#" className="hover:text-[#d07d22] transition-colors duration-200">Home</a>
          <a href="#recruitment" className="hover:text-[#d07d22] transition-colors duration-200">Recruitment</a>
          <a href="#faq" className="hover:text-[#d07d22] transition-colors duration-200">FAQ</a>
          <Link href="/login" className="hover:text-[#d07d22] transition-colors duration-200">Login</Link>
        </div>

      </div>
    </footer>
  )
}
