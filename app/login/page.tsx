"use client"
import { fetchApi } from "@/api-client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { EyeIcon, EyeOffIcon } from "@/components/ui/Icons"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetchApi(`/api/auth/login`, {  
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to login")
      }

      const userRole = (data.user?.role || "NONE").toUpperCase()
      let targetUrl = "/recruitie/dashboard"
      if (userRole === "ADMIN") targetUrl = "/admin/dashboard"
      else if (userRole === "RECRUITER") targetUrl = "/recruiter/dashboard"
      else if (userRole === "PANEL_MEMBER") targetUrl = "/panel/dashboard"
      else targetUrl = "/recruitie/dashboard"

      router.push(targetUrl)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Prevent hydration mismatch
  if (!mounted) return null

  return (
    <div className="relative min-h-screen bg-login flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Animated Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] animate-aurora-1 opacity-40 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full blur-[150px] animate-aurora-2 opacity-30 pointer-events-none" />
      
      <div className="card-glass w-full max-w-[480px] z-10 animate-fade-in-up" style={{ animationDuration: '0.6s' }}>
        
        {/* HackClub Logo */}
        <div className="flex flex-col items-center justify-center mb-8 text-center animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div 
            className="flex items-center justify-center font-black text-white shadow-[0_0_40px_rgba(172,18,12,0.5)] transition-transform hover:scale-105 hover:rotate-3 duration-300"
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "22px",
              background: "linear-gradient(135deg, #720907, #ac120c)",
              fontSize: "40px",
              marginBottom: "24px"
            }}
          >
            h.
          </div>
          <h1 className="font-display font-black text-[#f4ede4] text-3xl sm:text-4xl leading-tight mb-1 tracking-tight">
            HackClub
          </h1>
          <h2 className="font-display font-bold text-accent text-xl sm:text-2xl opacity-90 tracking-wide">
            VIT Chennai
          </h2>
          
          <div className="mt-6 flex items-center justify-center space-x-3">
            <span className="h-[2px] w-12 bg-gradient-to-r from-transparent to-accent/50 rounded-full" />
            <span className="font-mono text-[13px] font-bold text-highlight tracking-widest uppercase">
              Recruitment Portal
            </span>
            <span className="h-[2px] w-12 bg-gradient-to-l from-transparent to-accent/50 rounded-full" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          {error && (
            <div className="p-4 text-[14px] font-medium bg-[rgba(172,18,12,0.15)] border border-[rgba(172,18,12,0.4)] text-[#ffb4ab] rounded-xl animate-fade-in-up flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex flex-col gap-2 group">
            <label className="font-body text-[14px] text-text-muted font-medium ml-1 transition-colors group-focus-within:text-white">
              Email address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@vitstudent.ac.in"
              required
              className="input-glass text-[15px] h-[50px] px-4"
            />
          </div>

          <div className="flex flex-col gap-2 group">
            <label className="font-body text-[14px] text-text-muted font-medium ml-1 transition-colors group-focus-within:text-white">
              Password
            </label>
            <div className="relative w-full">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="input-glass text-[15px] h-[50px] pl-4 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-text-muted hover:text-white transition-colors rounded-full hover:bg-white/5"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center text-[16px] h-[54px] relative overflow-hidden group shadow-[0_10px_30px_rgba(172,18,12,0.3)] transition-all hover:shadow-[0_15px_40px_rgba(172,18,12,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </>
                ) : "Sign In"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
            </button>
            


            <Link 
              href="/"
              className="mt-2 flex items-center justify-center text-[14px] font-medium text-text-muted hover:text-white transition-all py-3 rounded-full hover:bg-white/5 group"
            >
              <span className="flex items-center transform group-hover:-translate-x-1 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Landing Page
              </span>
            </Link>
          </div>
        </form>
        
      </div>
    </div>
  )
}
