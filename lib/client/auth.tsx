"use client"

/**
 * Client-side Authentication Context
 * Manages user session state, login/logout, and role-based access
 * 
 * PROVIDES: user, loading, login, logout, refreshUser
 * CONSUMED BY: All dashboard pages and protected components
 * 
 * TOKEN STORAGE: localStorage (hc_session_token) + httpOnly cookie (set by API)
 * INTEGRATION: Main site handles auth; this app proxies login and verifies tokens
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { api, getToken, clearToken } from "./api"

export interface User {
  id: number
  name: string
  email: string
  role: string
  deptIds: number[]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * refreshUser - Fetches current user profile from /api/auth/me
   * Called on mount and after login
   * Clears token and user on failure (expired/invalid session)
   */
  const refreshUser = async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const data = await api.getMe()
      setUser((data as { user: User }).user)
    } catch {
      clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  /**
   * login - Authenticates via API proxy to main site
   * Sets token in localStorage, then refreshes user
   */
  const login = async (email: string, password: string) => {
    await api.login(email, password)
    await refreshUser()
  }

  /**
   * logout - Clears local token and user state
   * Server-side cookie cleared by API route
   */
  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  // Initialize auth on mount
  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

/**
 * useRequireAuth - Hook for role-based route/component protection
 * Returns { user, loading, authorized }
 * 
 * @param allowedRoles - Optional array of allowed role strings
 * @returns Object with authorization state
 * 
 * USAGE: const { authorized, loading } = useRequireAuth(["LEAD", "ADMIN"])
 *        if (loading) return <Loading />
 *        if (!authorized) return <AccessDenied />
 */
export function useRequireAuth(allowedRoles?: string[]) {
  const { user, loading } = useAuth()
  if (loading) return { user: null, loading: true, authorized: false }
  if (!user) return { user: null, loading: false, authorized: false }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { user, loading: false, authorized: false }
  }
  return { user, loading: false, authorized: true }
}