"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"

export default function FormsPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({ 
    question: "", 
    type: "text", 
    required: true,
    options: ""
  })

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/forms")
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      setIsModalOpen(false)
      fetchQuestions()
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
        <Button variant="cta" onClick={() => setIsModalOpen(true)}>ADD QUESTION</Button>
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">ID</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">QUESTION</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">TYPE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">REQUIRED</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2] font-normal tracking-[0.06em]">OPTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">LOADING QUESTIONS...</td></tr>
              ) : questions.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">NO CUSTOM QUESTIONS CONFIGURED.</td></tr>
              ) : (
                questions.map(q => (
                  <tr key={q.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                    <td className="p-4 text-[#d07d22] font-mono text-[13px] font-bold">{q.id}</td>
                    <td className="p-4 text-[#f4ede4] font-medium">{q.question}</td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px] uppercase">{q.type}</td>
                    <td className="p-4">
                      <StatusPill status={q.required ? 'active' : 'pending'}>{q.required ? 'YES' : 'NO'}</StatusPill>
                    </td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px] max-w-xs truncate">
                      {q.options || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="font-display font-bold text-[24px] text-[#f4ede4] mb-6">Add Form Question</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Question Text</label>
            <Input 
              value={formData.question}
              onChange={e => setFormData({ ...formData, question: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Input Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono focus:border-[#d07d22] outline-none"
            >
              <option value="text">Short Text</option>
              <option value="textarea">Long Text</option>
              <option value="dropdown">Dropdown</option>
              <option value="radio">Radio</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="checkbox"
              checked={formData.required}
              onChange={e => setFormData({ ...formData, required: e.target.checked })}
              className="accent-[#ac120c] w-4 h-4"
            />
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Is Required</label>
          </div>
          {(formData.type === "dropdown" || formData.type === "radio") && (
            <div className="flex flex-col gap-2 mt-2">
              <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Options (Comma Separated)</label>
              <Input 
                value={formData.options}
                onChange={e => setFormData({ ...formData, options: e.target.value })}
                placeholder="Option 1, Option 2, Option 3"
                required
              />
            </div>
          )}
          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>CANCEL</Button>
            <Button type="submit" variant="primary">ADD QUESTION</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
