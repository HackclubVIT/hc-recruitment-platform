"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"

export default function PanelsPage() {
  const [panels, setPanels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<{id?: number, name: string, description: string, status?: string}>({ name: "", description: "" })

  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState("")
  const [activePanel, setActivePanel] = useState<number | null>(null)

  useEffect(() => {
    fetchPanels()
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(data.users?.filter((u: any) => u.role === 'PANEL_MEMBER') || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPanels = async () => {
    try {
      const res = await fetch("/api/panels")
      const data = await res.json()
      setPanels(data.panels || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = formData.id ? "PUT" : "POST"
      await fetch("/api/panels", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      setIsModalOpen(false)
      fetchPanels()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this panel?")) return
    try {
      await fetch("/api/panels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      fetchPanels()
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleStatus = async (panel: any) => {
    try {
      const newStatus = panel.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      await fetch("/api/panels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: panel.id, name: panel.name, description: panel.description, status: newStatus })
      })
      fetchPanels()
    } catch (err) {
      console.error(err)
    }
  }

  const openCreateModal = () => {
    setFormData({ name: "", description: "" })
    setIsModalOpen(true)
  }

  const handleAddMember = async (panel_id: number) => {
    if (!selectedUser) return
    try {
      await fetch("/api/panels/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panel_id, user_id: selectedUser })
      })
      setSelectedUser("")
      setActivePanel(null)
      fetchPanels()
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveMember = async (panel_id: number, user_id: string) => {
    try {
      await fetch("/api/panels/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panel_id, user_id })
      })
      fetchPanels()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Infrastructure Management</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            Interview Panels
          </h1>
        </div>
        <Button variant="cta" onClick={openCreateModal}>CREATE PANEL</Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-[#bfa8a2] font-mono">LOADING PANELS...</p>
        ) : (
          panels.map(panel => (
            <Card key={panel.id} className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold text-[20px] text-[#f4ede4] flex items-center gap-2">
                    {panel.name}
                    <button 
                      onClick={() => { setFormData({ id: panel.id, name: panel.name, description: panel.description, status: panel.status }); setIsModalOpen(true); }}
                      className="text-[#d07d22] hover:text-[#f4ede4] transition-colors"
                      title="Edit Panel"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(panel.id)}
                      className="text-[#ac120c] hover:text-[#f4ede4] transition-colors"
                      title="Delete Panel"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </h3>
                  <p className="text-[#bfa8a2] text-sm mt-1">{panel.description}</p>
                </div>
                <button onClick={() => handleToggleStatus(panel)} className="hover:opacity-80 transition-opacity">
                  <StatusPill status={panel.status.toLowerCase()}>{panel.status}</StatusPill>
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2a0d0d]">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-mono text-[#d07d22] text-[10px] tracking-widest">MEMBERS</p>
                  <Button variant="ghost" className="text-[10px] py-1 px-2" onClick={() => setActivePanel(activePanel === panel.id ? null : panel.id)}>
                    + ADD
                  </Button>
                </div>
                
                {activePanel === panel.id && (
                  <div className="flex gap-2 mb-3">
                    <select 
                      className="flex-1 bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-1.5 rounded-[4px] font-mono text-[11px]"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">Select Panel Member...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <Button variant="primary" className="py-1.5 px-3 text-[10px]" onClick={() => handleAddMember(panel.id)}>
                      OK
                    </Button>
                  </div>
                )}

                {panel.members?.length === 0 ? (
                  <p className="text-[#bfa8a2] text-xs font-mono">NO MEMBERS ASSIGNED</p>
                ) : (
                  <ul className="text-[#f4ede4] text-sm font-medium flex flex-col gap-2">
                    {panel.members?.map((m: any) => (
                      <li key={m.id} className="flex justify-between items-center group">
                        <span>- {m.user.name}</span>
                        <button 
                          onClick={() => handleRemoveMember(panel.id, m.user_id)}
                          className="text-[#ac120c] font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          REMOVE
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="font-display font-bold text-[24px] text-[#f4ede4] mb-6">Create New Panel</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Panel Name</label>
            <Input 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Description</label>
            <Input 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>CANCEL</Button>
            <Button type="submit" variant="primary">CREATE</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
