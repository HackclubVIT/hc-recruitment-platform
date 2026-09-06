"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    // If a user navigated to a dynamic route on static hosting
    let path = window.location.pathname
    const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
    let cleanBasePath = ""
    if (configuredBasePath) {
      try {
        cleanBasePath = (configuredBasePath.startsWith("http://") || configuredBasePath.startsWith("https://"))
          ? new URL(configuredBasePath).pathname
          : configuredBasePath
      } catch {}
      cleanBasePath = cleanBasePath.replace(/\/+$/, "")
      if (cleanBasePath && !cleanBasePath.startsWith("/")) {
        cleanBasePath = `/${cleanBasePath}`
      }
    }
    if (cleanBasePath && path.startsWith(cleanBasePath)) {
      path = path.slice(cleanBasePath.length) || "/"
    }

    const match = path.match(/\/(admin|recruiter)\/candidates\/([^/]+)/) ||
                  path.match(/\/(admin|recruiter|panel)\/(interview|feedback|forms)\/([^/]+)/) ||
                  path.match(/\/recruitment\/([^/]+)/)

    if (match) {
      setRedirecting(true)
      router.replace(path)
    }
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] text-[#f4ede4] p-4">
      <h1 className="text-6xl font-bold font-mono text-[#ac120c] mb-4">404</h1>
      <p className="text-xl text-[#bfa8a2] font-mono mb-8">
        {redirecting ? "Resolving route..." : "The requested page could not be found."}
      </p>
      <Link
        href="/"
        className="px-6 py-2 bg-[#ac120c] text-white font-mono rounded hover:bg-[#8e0e09] transition-colors"
      >
        RETURN HOME
      </Link>
    </div>
  )
}
