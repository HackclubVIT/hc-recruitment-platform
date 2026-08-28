"use client"

import React, { useState, useEffect } from "react"
import { DiamondIcon, BellIcon } from "@/components/ui/Icons"
import { fetchApi } from "@/api-client"

export const Navbar = () => {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
    // Simple polling for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetchApi("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {}
  }

  const markAllRead = async () => {
    try {
      await fetchApi("/api/notifications/read", { method: "PUT" })
      setUnreadCount(0)
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (err) {}
  }

  const markAsRead = async (id: number) => {
    try {
      await fetchApi("/api/notifications/read", {
        method: "PUT",
        body: JSON.stringify({ id })
      })
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) {}
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between h-[64px] px-8 bg-[#120202]/80 backdrop-blur-[20px] border-b border-[#2a0d0d]">
      <div className="flex items-center gap-3">
        <DiamondIcon className="text-[#ac120c] animate-pulse" />
        <span className="font-display font-bold tracking-[2px] text-lg text-[#f4ede4]">
          HACKCLUB VIT
        </span>
      </div>
      <div className="flex items-center gap-6">
        
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative flex items-center justify-center p-2 text-[#bfa8a2] hover:text-[#f4ede4] hover:bg-[#2a0d0d] rounded-full transition-colors"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ac120c] rounded-full border-2 border-[#120202]"></span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#120202] border border-[#2a0d0d] rounded-[8px] shadow-2xl overflow-hidden flex flex-col z-50">
              <div className="flex items-center justify-between p-4 border-b border-[#2a0d0d] bg-[#1a0606]">
                <h3 className="font-mono text-[11px] text-[#f4ede4] tracking-widest uppercase">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[#d07d22] hover:text-[#f4ede4] font-mono text-[10px] tracking-wider uppercase transition-colors">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[#bfa8a2] font-mono text-[11px]">NO NOTIFICATIONS</div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => !notif.read && markAsRead(notif.id)}
                      className={`p-4 border-b border-[#2a0d0d] cursor-pointer transition-colors ${notif.read ? 'bg-transparent opacity-60' : 'bg-[#ac120c]/10 hover:bg-[#ac120c]/20'}`}
                    >
                      <h4 className="font-display text-[13px] text-[#f4ede4] mb-1">{notif.title}</h4>
                      <p className="font-mono text-[11px] text-[#bfa8a2] leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 py-1.5 border border-[#2a0d0d] rounded-[6px] font-mono text-[11px] tracking-[1.5px] text-[#bfa8a2]">
          <span className="w-2 h-2 bg-[#2e7d32] rounded-full animate-pulse"></span>
          SYSTEM ONLINE
        </div>
      </div>
    </nav>
  )
}
