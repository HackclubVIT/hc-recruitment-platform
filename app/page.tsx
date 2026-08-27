"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/client/auth"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === "LEAD" || user.role === "ADMIN") {
          router.push("/lead")
        } else if (user.role === "RECRUITER") {
          router.push("/recruiter")
        } else {
          router.push("/login")
        }
      } else {
        router.push("/login")
      }
    }
  }, [loading, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="text-3xl text-red-600 animate-pulse">◆</span>
          <span className="font-display font-bold text-3xl tracking-wider text-white">HACKCLUB</span>
        </div>
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    </div>
  )
}