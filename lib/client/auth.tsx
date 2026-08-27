"use client"

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

  const login = async (email: string, password: string) => {
    await api.login(email, password)
    await refreshUser()
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

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

export function useRequireAuth(allowedRoles?: string[]) {
  const { user, loading } = useAuth()
  if (loading) return { user: null, loading: true, authorized: false }
  if (!user) return { user: null, loading: false, authorized: false }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { user, loading: false, authorized: false }
  }
  return { user, loading: false, authorized: true }
}