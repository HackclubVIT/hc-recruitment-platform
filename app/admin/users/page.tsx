"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ 
    id: "",
    name: "", 
    email: "", 
    password: "",
    role: "PANEL_MEMBER",
    departments: "CSE"
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        departments: formData.departments.split(',').map(d => d.trim())
      }
      const method = formData.id ? "PUT" : "POST"
      await fetch("/api/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      setIsModalOpen(false)
      fetchUsers()
    } catch (err) {
      console.error(err)
    }
  }

  const openCreateModal = () => {
    setFormData({ id: "", name: "", email: "", password: "", role: "PANEL_MEMBER", departments: "CSE" })
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Access Control</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            User Management
          </h1>
        </div>
        <Button variant="cta" onClick={openCreateModal}>CREATE USER</Button>
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">NAME</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ROLE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">DEPARTMENTS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">STATUS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em] text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING USERS...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">NO USERS FOUND.</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                    <td className="p-4">
                      <p className="text-[#f4ede4] font-medium">{user.name}</p>
                      <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">{user.email}</p>
                    </td>
                    <td className="p-4">
                      <StatusPill status={user.role === 'ADMIN' ? 'active' : 'pending'}>{user.role}</StatusPill>
                    </td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">
                      {user.departments?.join(", ") || "-"}
                    </td>
                    <td className="p-4 text-[#2e7d32] font-mono text-[11px]">ACTIVE</td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => {
                          setFormData({ 
                            id: user.id,
                            name: user.name, 
                            email: user.email, 
                            password: "",
                            role: user.role, 
                            departments: user.departments?.join(', ') || '' 
                          })
                          setIsModalOpen(true)
                        }}
                        className="text-[#d07d22] font-mono text-[10px] uppercase hover:underline"
                      >
                        EDIT
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this user?")) {
                            await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id }) })
                            fetchUsers()
                          }
                        }}
                        className="text-[#ac120c] font-mono text-[10px] uppercase hover:underline ml-2"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="font-display font-bold text-[24px] text-[#f4ede4] mb-6">Provision User</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Full Name</label>
            <Input 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Email Address</label>
            <Input 
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Temporary Password</label>
            <Input 
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">System Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono focus:border-[#d07d22] outline-none"
            >
              <option value="PANEL_MEMBER">PANEL MEMBER</option>
              <option value="RECRUITER">RECRUITER</option>
              <option value="ADMIN">ADMINISTRATOR</option>
            </select>
          </div>
          {formData.role === "RECRUITER" && (
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Departments (Comma separated)</label>
              <Input 
                value={formData.departments}
                onChange={e => setFormData({ ...formData, departments: e.target.value })}
                placeholder="CSE, ECE"
              />
            </div>
          )}
          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>CANCEL</Button>
            <Button type="submit" variant="primary">SAVE</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
