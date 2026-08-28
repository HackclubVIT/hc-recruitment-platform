"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { DiamondIcon } from "@/components/ui/Icons"

export default function ApplicationSuccessPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-login flex items-center justify-center p-6">
      <div className="w-full max-w-[440px] animate-[rise_0.6s_cubic-bezier(0.2,0.8,0.2,1)] text-center">
        
        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#2e7d32]/10 border border-[#2e7d32]/30 flex items-center justify-center shadow-[0_0_40px_rgba(46,125,50,0.2)]">
            <DiamondIcon className="text-[#2e7d32] w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-black text-[24px] text-[#f4ede4] tracking-wide uppercase">
              TRANSMISSION SUCCESS
            </h1>
            <p className="font-mono text-[#bfa8a2] text-[12px] uppercase tracking-[0.1em] mt-2">
              Application Received
            </p>
          </div>
        </div>

        <Card className="p-8 sm:p-10 flex flex-col items-center">
          <p className="text-[#bfa8a2] text-center mb-8">
            Your application to HackClub VIT has been successfully logged into our system. 
            Our recruitment team will review your profile shortly. Keep an eye on your email for further instructions.
          </p>

          <Button onClick={() => router.push("/")} variant="primary" className="w-full justify-center">
            RETURN TO HOME
          </Button>
        </Card>
        
      </div>
    </div>
  )
}
