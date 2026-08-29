"use client"
import { fetchApi } from "@/api-client"

import React, { useState } from "react"
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
  const [loginMode, setLoginMode] = useState<"user" | "admin">("user")

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

      if (data.user.role === "ADMIN") router.push("/admin/dashboard")
      else if (data.user.role === "RECRUITER") router.push("/recruiter/dashboard")
      else router.push("/panel/dashboard")

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleAdminMode = () => {
    setLoginMode(prev => prev === "admin" ? "user" : "admin")
    setError("")
  }

  return (
    <div className="min-h-screen bg-login flex items-center justify-center p-4 sm:p-6">
      <div 
        className="w-full max-w-[520px] animate-[rise_0.6s_cubic-bezier(0.2,0.8,0.2,1)]"
        style={{
          background: "rgba(18, 2, 2, 0.97)",
          border: "1px solid rgba(172, 18, 12, 0.25)",
          borderRadius: "24px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
          padding: "40px"
        }}
      >
        
        {/* HackClub Logo */}
        <div 
          className="flex items-center justify-center font-black text-white"
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #720907, #ac120c)",
            fontSize: "36px",
            marginBottom: "32px"
          }}
        >
          h.
        </div>
        
        <h1 
          className="font-display font-black text-[#f4ede4]"
          style={{
            fontSize: "clamp(2rem, 5vw, 2.75rem)",
            lineHeight: "52px"
          }}
        >
          HackClub VIT Chennai
        </h1>
        
        <div 
          className="font-body font-bold text-[#f4ede4] uppercase tracking-wider"
          style={{
            marginTop: "32px",
            marginBottom: "30px"
          }}
        >
          {loginMode === "admin" ? "ADMIN PORTAL" : "USER PORTAL"}
        </div>

        <form onSubmit={handleLogin} className="flex flex-col">
          {error && (
            <div 
              className="mb-6 p-4 text-sm font-medium"
              style={{
                background: "rgba(172, 18, 12, 0.10)",
                border: "1px solid rgba(172, 18, 12, 0.5)",
                color: "#ffb4ab",
                borderRadius: "12px",
                fontFamily: "var(--font-body)"
              }}
            >
              {error}
            </div>
          )}
          
          <div className="flex flex-col mb-[28px]">
            <label 
              className="font-body text-[14px] text-[#bfa8a2] mb-[8px]"
            >
              Email address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@vitstudent.ac.in"
              required
              className="w-full focus:outline-none placeholder:text-[#bfa8a2]"
              style={{
                height: "45px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f4ede4",
                padding: "0 16px",
                fontFamily: "var(--font-body)"
              }}
            />
          </div>

          <div className="flex flex-col relative">
            <label 
              className="font-body text-[14px] text-[#bfa8a2] mb-[8px]"
            >
              Password
            </label>
            <div className="relative w-full">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full focus:outline-none placeholder:text-[#bfa8a2]"
                style={{
                  height: "45px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f4ede4",
                  padding: "0 45px 0 16px",
                  fontFamily: "var(--font-body)"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-[45px] px-3 flex items-center justify-center text-gray-400 hover:text-gray-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ background: "transparent", border: "none" }}
              >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="w-full text-right mt-[12px]">
              <Link 
                href="/recruitment"
                className="text-[#d07d22] font-body text-[14px] hover:brightness-125 transition-all"
                style={{ textDecoration: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  alert("Password reset would be integrated here.");
                }}
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <div className="mt-[28px] flex flex-col gap-[12px]">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center text-white font-body font-bold transition-all"
              style={{
                background: "#720907",
                height: "48px",
                borderRadius: "999px",
                boxShadow: "0 18px 40px rgba(172, 18, 12, 0.3)",
                border: "none",
                transform: loading ? "none" : undefined
              }}
              onMouseEnter={(e) => {
                if(!loading) {
                  e.currentTarget.style.background = "#AC120C";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if(!loading) {
                  e.currentTarget.style.background = "#720907";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
            
            <button
              type="button"
              onClick={toggleAdminMode}
              className="w-full flex items-center justify-center text-white font-body transition-all"
              style={{
                background: "transparent",
                border: "1px solid rgba(172, 18, 12, 0.3)",
                height: "50px",
                borderRadius: "999px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(172, 18, 12, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {loginMode === "admin" ? "Login as user" : "Login as admin"}
            </button>

            <Link 
              href="/recruitment"
              className="w-full flex items-center justify-center font-body transition-all"
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#f4ede4",
                height: "50px",
                borderRadius: "999px",
                textDecoration: "none"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Create new account (Sign Up)
            </Link>

            <Link 
              href="/recruitment"
              className="w-full flex items-center justify-center font-body transition-all"
              style={{
                background: "rgba(18, 2, 2, 0.5)",
                border: "1px solid rgba(172, 18, 12, 0.2)",
                color: "#bfa8a2",
                height: "50px",
                borderRadius: "999px",
                textDecoration: "none"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(172, 18, 12, 0.1)";
                e.currentTarget.style.color = "#f4ede4";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(18, 2, 2, 0.5)";
                e.currentTarget.style.color = "#bfa8a2";
              }}
            >
              Back to Landing Page
            </Link>
          </div>
        </form>
        
      </div>
    </div>
  )
}
