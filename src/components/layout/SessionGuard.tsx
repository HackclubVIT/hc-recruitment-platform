'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/api-client'

export function SessionGuard({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function verifySession() {
      try {
        const data = await api.getMe()
        const userRole = data.user?.role
        
        // Define route-to-role mappings
        let expectedRole = requiredRole
        if (!expectedRole) {
          if (pathname.startsWith('/admin')) expectedRole = 'ADMIN'
          else if (pathname.startsWith('/recruiter')) expectedRole = 'RECRUITER'
          else if (pathname.startsWith('/panel')) expectedRole = 'PANEL_MEMBER'
          else if (pathname.startsWith('/recruitie')) expectedRole = 'NONE'
        }

        if (expectedRole && userRole !== expectedRole) {
          // If the backend authoritative role doesn't match the required UI role, force redirect
          if (userRole === 'ADMIN') router.push('/admin/dashboard')
          else if (userRole === 'RECRUITER') router.push('/recruiter/dashboard')
          else if (userRole === 'PANEL_MEMBER') router.push('/panel/dashboard')
          else if (userRole === 'NONE') router.push('/recruitie/dashboard')
          else router.push('/login')
          return
        }

        setAuthorized(true)
      } catch (err) {
        console.error('Session guard error:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [pathname, router, requiredRole])

  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d07d22]"></div>
      </div>
    )
  }

  return <>{children}</>
}
