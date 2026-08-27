"use client"

import { useState } from "react"
import { useAuth } from "@/lib/client/auth"
import { api } from "@/lib/client/api"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: 'D' },
  { label: 'Applications', path: '/applications', icon: 'A' },
  { label: 'Interviews', path: '/interviews', icon: 'I' },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  const [isAdminSidebarMinimized, setIsAdminSidebarMinimized] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  // Determine base path based on role
  const basePath = user?.role === 'LEAD' ? '/lead' : user?.role === 'RECRUITER' ? '/recruiter' : '/panel'

  const myName = user?.name || 'Recruiter'
  const myRole = user?.role || 'User'
  const myInitial = myName.charAt(0).toUpperCase()

  const handleLogout = async () => {
    await api.logout()
    router.push('/login')
  }

  return (
    <div className="admin-shell">
      <div className={`sidebar-backdrop ${isMobileNavOpen ? 'visible' : ''}`} onClick={() => setIsMobileNavOpen(false)} />
      
      <aside className={`admin-sidebar ${isAdminSidebarMinimized ? 'minimized' : ''} ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand" style={isAdminSidebarMinimized ? { display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' } : { display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              className="brand-mark sidebar-mark"
              style={isAdminSidebarMinimized ? { width: 40, height: 40, fontSize: '1.2rem', margin: '0' } : {}}
            >
              h.
            </div>
            {!isAdminSidebarMinimized && (
              <div>
                <p>HackClub</p>
                <span>VIT Chennai</span>
              </div>
            )}
          </div>
          <button className="toggle-sidebar-btn" onClick={() => setIsAdminSidebarMinimized(!isAdminSidebarMinimized)}>
            {isAdminSidebarMinimized ? '▶' : '◀'}
          </button>
          <button className="mobile-close-btn" onClick={() => setIsMobileNavOpen(false)} aria-label="Close menu">✕</button>
        </div>
        
        <nav className="sidebar-nav" onClick={() => setIsMobileNavOpen(false)}>
          {navItems.map((item) => {
            const fullPath = `${basePath}${item.path}`
            const isActive = pathname.startsWith(fullPath)
            
            return (
              <Link
                key={item.label}
                href={fullPath}
                className={`nav-link ${isActive ? 'active' : ''}`}
                title={item.label}
                style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>{isAdminSidebarMinimized ? item.icon : item.label}</span>
              </Link>
            )
          })}
        </nav>
        
        <div className="sidebar-footer">
          {isAdminSidebarMinimized ? (
            <span title="System status: Online" style={{ fontSize: '20px', textAlign: 'center', width: '100%' }}>🟢</span>
          ) : (
            <>
              <p>System status</p>
              <span>Online</span>
            </>
          )}
        </div>
      </aside>

      <div className="admin-layout">
        <header className="admin-header">
          <div className="header-identity">
            <button className="mobile-menu-btn" onClick={() => setIsMobileNavOpen(true)} aria-label="Open menu">☰</button>
            <div>
              <p className="eyebrow">{myRole} Portal</p>
              <h1>Welcome back, {myName}</h1>
            </div>
            <span className="badge badge-primary">{myRole}</span>
          </div>
          
          <div className="header-actions" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }} onMouseLeave={() => setShowProfileDropdown(false)}>
              <div 
                className="profile-dropdown-trigger" 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="avatar" style={{ width: '32px', height: '32px' }}>
                  <span className="avatar-initial" style={{ fontSize: '16px' }}>{myInitial}</span>
                </div>
                <span style={{ fontWeight: '500' }}>{myName}</span>
                <span style={{ fontSize: '12px' }}>▼</span>
              </div>
              
              {showProfileDropdown && (
                <div style={{ position: 'absolute', top: '100%', right: '0', paddingTop: '8px', zIndex: 9999, minWidth: '180px' }}>
                  <div className="profile-dropdown-menu" style={{ background: 'rgba(18, 2, 2, 0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
                    <button className="button button-outlined" style={{ border: 'none', justifyContent: 'flex-start', color: '#ff5555' }} onClick={handleLogout}>Logout</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}
