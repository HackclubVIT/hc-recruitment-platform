"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/client/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
      router.push("/recruiter")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-3xl text-red-600 animate-pulse">◆</span>
            <span className="font-display font-bold text-3xl tracking-wider text-white">HACKCLUB</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-2">Sign In</h1>
          <p className="text-gray-500">Recruitment & Interview Management</p>
        </div>

        <div className="bg-gray-900/50 border border-red-900/30 rounded-xl p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-600/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="lead.technical@hackclub.in"
                className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 text-white font-mono tracking-wider rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in..." : "Access Dashboard"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-red-900/20 text-center text-sm text-gray-500">
            <p>Demo credentials (password: <code className="font-mono text-red-400">Hackclub@2026</code>)</p>
            <div className="mt-2 space-y-1 text-xs">
              <p>Admin: admin@hackclub.in</p>
              <p>Lead: lead.technical@hackclub.in</p>
              <p>Recruiter: recruiter1.technical@hackclub.in</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}