"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"

export default function FormsPage() {
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({ 
    title: "", 
    description: "" 
  })

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/forms`)
      const data = await res.json()
      setForms(data.forms || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      setIsModalOpen(false)
      fetchForms()
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/forms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      fetchForms()
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
            <span>Form Builder</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            Recruitment Forms
          </h1>
        </div>
        <Button variant="cta" onClick={() => setIsModalOpen(true)}>CREATE FORM</Button>
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ID</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">TITLE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">STATUS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">QUESTIONS</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING FORMS...</td></tr>
              ) : forms.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">NO FORMS CONFIGURED.</td></tr>
              ) : (
                forms.map(f => (
                  <tr key={f.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                    <td className="p-4 text-[#d07d22] font-mono text-[13px] font-bold">{f.id}</td>
                    <td className="p-4">
                      <p className="text-[#f4ede4] font-medium">{f.title}</p>
                      <p className="text-[#bfa8a2] font-mono text-[11px] mt-1">{f.description}</p>
                    </td>
                    <td className="p-4">
                      <StatusPill status={f.status === 'PUBLISHED' ? 'active' : f.status === 'CLOSED' ? 'rejected' : 'pending'}>{f.status}</StatusPill>
                    </td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">
                      {f.questions?.length || 0} Questions
                    </td>
                    <td className="p-4 flex gap-2">
                      {f.status === "DRAFT" && (
                        <Button variant="ghost" className="py-2 px-4 text-xs" onClick={() => handleStatusChange(f.id, "PUBLISHED")}>PUBLISH</Button>
                      )}
                      {f.status === "PUBLISHED" && (
                        <Button variant="ghost" className="py-2 px-4 text-xs" onClick={() => handleStatusChange(f.id, "CLOSED")}>CLOSE</Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="font-display font-bold text-[24px] text-[#f4ede4] mb-6">Create New Form</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Form Title</label>
            <Input 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
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
            <Button type="submit" variant="primary">CREATE FORM</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
