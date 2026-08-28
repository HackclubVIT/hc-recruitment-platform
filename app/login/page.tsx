"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { DiamondIcon } from "@/components/ui/Icons"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/login`, {
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

  return (
    <div className="min-h-screen bg-login flex items-center justify-center p-6">
      <div className="w-full max-w-[440px] animate-[rise_0.6s_cubic-bezier(0.2,0.8,0.2,1)]">
        
        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#120202] border border-[#ac120c]/30 flex items-center justify-center shadow-[0_0_40px_rgba(172,18,12,0.2)]">
            <DiamondIcon className="text-[#ac120c] w-6 h-6 animate-[pulse-scale_2s_infinite]" />
          </div>
          <div className="text-center">
            <h1 className="font-display font-black text-[24px] text-[#f4ede4] tracking-wide">
              SYSTEM ACCESS
            </h1>
            <p className="font-mono text-[#bfa8a2] text-[12px] uppercase tracking-[0.1em] mt-2">
              Authorized Personnel Only
            </p>
          </div>
        </div>

        <Card className="p-8 sm:p-10">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            {error && (
              <div className="bg-[#ac120c]/10 border border-[#ac120c]/50 text-[#ac120c] p-4 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">
                Identifier (Email)
              </label>
              <Input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@hackclubvit.co"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">
                Security Key
              </label>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button type="submit" variant="cta" disabled={loading} className="w-full justify-center">
                {loading ? "AUTHENTICATING..." : "INITIATE PROTOCOL"}
              </Button>
            </div>
          </form>
        </Card>
        
      </div>
    </div>
  )
}
