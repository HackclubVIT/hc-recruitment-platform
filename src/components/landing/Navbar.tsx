"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header 
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-[1200px] transition-all duration-300 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div 
        className="flex items-center justify-between px-6 py-3 rounded-[20px]"
        style={{
          background: "rgba(18, 2, 2, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(172, 18, 12, 0.2)"
        }}
      >
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#720907] to-[#ac120c] flex items-center justify-center font-display font-black text-white text-[18px]">
            h.
          </div>
          <span className="hidden md:block font-display font-bold text-[#f4ede4] tracking-wide">
            HackClub VIT Chennai
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 font-body font-medium text-[14px]">
          <a href="#" className="text-[#bfa8a2] hover:text-[#f4ede4] transition-colors duration-200">Home</a>
          <a href="#recruitment" className="text-[#bfa8a2] hover:text-[#f4ede4] transition-colors duration-200">Recruitment</a>
          <a href="#process" className="text-[#bfa8a2] hover:text-[#f4ede4] transition-colors duration-200">Process</a>
          <a href="#faq" className="text-[#bfa8a2] hover:text-[#f4ede4] transition-colors duration-200">FAQ</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="btn-primary py-2 px-5 text-[12px] font-mono uppercase tracking-widest"
            style={{ textDecoration: "none" }}
          >
            LOGIN
          </Link>
          
          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-[#f4ede4]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`absolute top-full left-0 right-0 mt-2 p-4 rounded-[20px] md:hidden transition-all duration-300 origin-top overflow-hidden ${mobileMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 p-0 border-0'}`}
        style={{
          background: "rgba(18, 2, 2, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: mobileMenuOpen ? "1px solid rgba(172, 18, 12, 0.2)" : "none"
        }}
      >
        <nav className="flex flex-col gap-4 font-body font-medium text-center">
          <a href="#" onClick={() => setMobileMenuOpen(false)} className="text-[#f4ede4] py-2 border-b border-[#2a0d0d]">Home</a>
          <a href="#recruitment" onClick={() => setMobileMenuOpen(false)} className="text-[#f4ede4] py-2 border-b border-[#2a0d0d]">Recruitment</a>
          <a href="#process" onClick={() => setMobileMenuOpen(false)} className="text-[#f4ede4] py-2 border-b border-[#2a0d0d]">Process</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-[#f4ede4] py-2 border-b border-[#2a0d0d]">FAQ</a>
          <Link href="/login" className="text-[#d07d22] py-2 font-mono uppercase tracking-widest text-[12px]">Login</Link>
        </nav>
      </div>
    </header>
  )
}
