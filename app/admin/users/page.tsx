"use client"
import { fetchApi, api } from "@/api-client"


import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  registerNumber: string | null;
  hcDepartment: string | null;
  status: string;
  role: "ADMIN" | "RECRUITER" | "PANEL_MEMBER" | "NONE";
  departments: string[];
  active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({ 
    id: "",
    name: "", 
    email: "", 
    password: "",
    registerNumber: "",
    role: "PANEL_MEMBER",
    departments: "CSE",
    active: true
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await api.getUsers()
      setUsers(data.users || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this user's recruitment access?")) return;
    try {
      const res = await api.deleteUser(id)
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        alert(`Failed to revoke access: ${error.error || "Unknown error"}`);
        return;
      }
      alert("Access revoked successfully.");
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while revoking access.");
    }
  }

  const openCreateModal = () => {
    setFormData({
      id: "",
      name: "",
      email: "",
      password: "",
      registerNumber: "",
      role: "PANEL_MEMBER",
      departments: "CSE",
      active: true
    })
    setIsCreateMode(true)
    setIsModalOpen(true)
  }

  const openEditModal = (user: AdminUser) => {
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email || "",
      password: "",
      registerNumber: user.registerNumber || "",
      role: user.role,
      departments: user.departments?.join(", ") || "",
      active: user.active
    })
    setIsCreateMode(false)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const deptArray = formData.departments
        ? formData.departments.split(',').map(d => d.trim()).filter(Boolean)
        : []

      if (isCreateMode) {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim() || undefined,
          registerNumber: formData.registerNumber.trim() || undefined,
          role: formData.role,
          departments: deptArray,
          active: formData.active
        }

        const res = await api.createUser(payload)
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          alert(`Failed to create user: ${data.error || "Validation error"}`)
          return
        }

        alert(data.message || "User added successfully!")
      } else {
        const payload = {
          id: formData.id,
          role: formData.role,
          departments: deptArray,
          active: formData.active
        }

        const res = await api.updateUser(payload)
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          alert(`Failed to update user: ${data.error || "Validation error"}`)
          return
        }

        alert("User updated successfully!")
      }

      setIsModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to save user")
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.registerNumber?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Access Control</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            User Management
          </h1>
        </div>
        <Button variant="cta" onClick={openCreateModal}>+ ADD USER</Button>
      </header>

      <div className="flex items-center gap-4">
        <Input 
          placeholder="Search by name, email, register number, or role..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-md bg-[#120202] border-[#2a0d0d] text-[#f4ede4] text-xs font-mono"
        />
      </div>

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
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">{searchQuery ? "NO MATCHING USERS FOUND." : "NO USERS FOUND."}</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                    <td className="p-4">
                      <p className="text-[#f4ede4] font-medium">{user.name}</p>
                      <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">{user.email || "No email"}</p>
                    </td>
                    <td className="p-4">
                      <StatusPill status={user.role === 'ADMIN' ? 'active' : user.role === 'NONE' ? 'rejected' : 'pending'}>{user.role}</StatusPill>
                    </td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">
                      {user.departments?.length ? user.departments.join(", ") : "-"}
                    </td>
                    <td className="p-4">
                      {user.active ? (
                        <span className="text-[#2e7d32] font-mono text-[11px]">ACTIVE</span>
                      ) : (
                        <span className="text-[#ac120c] font-mono text-[11px]">DISABLED</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="text-[#d07d22] font-mono text-[10px] uppercase hover:underline cursor-pointer"
                      >
                        EDIT
                      </button>
                      <button 
                        onClick={() => handleRevoke(user.id)}
                        className="text-[#ac120c] font-mono text-[10px] uppercase hover:underline ml-2 cursor-pointer"
                      >
                        REVOKE ACCESS
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
        <h2 className="font-display font-bold text-[24px] text-[#f4ede4] mb-6">
          {isCreateMode ? "Add New User" : "Edit User Access"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">
              Full Name {isCreateMode && <span className="text-[#ac120c]">*</span>}
            </label>
            <Input 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              readOnly={!isCreateMode}
              required={isCreateMode}
              placeholder="e.g. Alex Morgan"
              className={!isCreateMode ? "opacity-50 cursor-not-allowed" : ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">
              Email Address {isCreateMode && <span className="text-[#ac120c]">*</span>}
            </label>
            <Input 
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              readOnly={!isCreateMode}
              required={isCreateMode}
              placeholder="e.g. alex@hackclubvit.in"
              className={!isCreateMode ? "opacity-50 cursor-not-allowed" : ""}
            />
          </div>

          {isCreateMode && (
            <>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">
                  Initial Password
                </label>
                <Input 
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty for hackclub@<username>"
                />
                <span className="font-mono text-[10px] text-[#bfa8a2]">
                  Defaults to &apos;hackclub@&lt;email_prefix&gt;&apos; if left blank (min 6 characters)
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">
                  Registration Number
                </label>
                <Input 
                  value={formData.registerNumber}
                  onChange={e => setFormData({ ...formData, registerNumber: e.target.value })}
                  placeholder="e.g. 23BCE1002"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Recruitment Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[4px] font-mono text-xs focus:border-[#d07d22] outline-none"
            >
              <option value="PANEL_MEMBER">PANEL MEMBER (Interviewer)</option>
              <option value="RECRUITER">RECRUITER (Scheduler / Reviewer)</option>
              <option value="ADMIN">ADMINISTRATOR (Full Access)</option>
              <option value="NONE">NO ACCESS</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Assigned Departments (Comma separated)</label>
            <Input 
              value={formData.departments}
              onChange={e => setFormData({ ...formData, departments: e.target.value })}
              placeholder="e.g. CSE, ECE, Technical"
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 accent-[#ac120c] cursor-pointer"
            />
            <label htmlFor="active" className="font-mono text-[12px] text-[#bfa8a2] uppercase tracking-widest cursor-pointer select-none">
              Active User Account
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>CANCEL</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "SAVING..." : isCreateMode ? "CREATE USER" : "SAVE CHANGES"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
