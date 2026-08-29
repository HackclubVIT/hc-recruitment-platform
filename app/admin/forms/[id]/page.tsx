"use client"
import { fetchApi } from "@/api-client"


import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { StatusPill } from "@/components/ui/StatusPill"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"

export default function FormDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  
  const [qData, setQData] = useState({
    question: "",
    type: "TEXT",
    required: true,
    options: ""
  })

  useEffect(() => {
    fetchForm()
  }, [])

  const fetchForm = async () => {
    try {
      const res = await fetchApi(`/api/forms/${params.id}`)
      if (!res.ok) {
        router.push("/admin/forms")
        return
      }
      const data = await res.json()
      setForm(data.form)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const optionsArray = qData.options.split(",").map(s => s.trim()).filter(Boolean)
      
      await fetchApi(`/api/forms/${params.id}/questions`, {  
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: qData.question,
          type: qData.type,
          required: qData.required,
          options: (qData.type === 'RADIO' || qData.type === 'DROPDOWN' || qData.type === 'CHECKBOX') ? optionsArray : []
        })
      })
      setIsQuestionModalOpen(false)
      setQData({ question: "", type: "TEXT", required: true, options: "" })
      fetchForm()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm("Delete this question?")) return
    try {
      await fetchApi(`/api/forms/${params.id}/questions/${qId}`, {  
        method: "DELETE"
      })
      fetchForm()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-[#bfa8a2] font-mono">LOADING FORM...</div>
  if (!form) return <div className="p-8 text-[#ac120c] font-mono">FORM NOT FOUND</div>

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
            <DiamondIcon />
            <span>Form Builder</span>
          </div>
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            {form.title}
          </h1>
          <p className="text-[#bfa8a2] font-mono mt-1">{form.description}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => router.push("/admin/forms")}>BACK TO FORMS</Button>
          {form.status === "DRAFT" && (
            <Button variant="cta" onClick={() => setIsQuestionModalOpen(true)}>ADD QUESTION</Button>
          )}
        </div>
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-[#2a0d0d] flex justify-between items-center">
          <h2 className="font-mono text-[#f4ede4] text-[14px]">Questions ({form.questions?.length || 0})</h2>
          <StatusPill status={form.status === 'PUBLISHED' ? 'active' : form.status === 'CLOSED' ? 'rejected' : 'pending'}>
            {form.status}
          </StatusPill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#370b09]/50 border-b border-[#2a0d0d]">
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2]">QUESTION</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2]">TYPE</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2]">REQUIRED</th>
                <th className="p-4 font-mono text-[12px] text-[#bfa8a2]">OPTIONS</th>
                {form.status === "DRAFT" && <th className="p-4 font-mono text-[12px] text-[#bfa8a2]">ACTIONS</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a0d0d]">
              {(!form.questions || form.questions.length === 0) ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#bfa8a2] font-mono">NO QUESTIONS ADDED.</td></tr>
              ) : (
                form.questions.map((q: any) => (
                  <tr key={q.id} className="hover:bg-[#1a0606] transition-colors duration-200">
                    <td className="p-4 text-[#f4ede4] font-medium">{q.question}</td>
                    <td className="p-4 text-[#d07d22] font-mono text-[11px] font-bold">{q.type}</td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">{q.required ? "YES" : "NO"}</td>
                    <td className="p-4 text-[#bfa8a2] font-mono text-[11px]">{q.options?.join(", ") || "-"}</td>
                    {form.status === "DRAFT" && (
                      <td className="p-4">
                        <Button variant="ghost" className="py-2 px-4 text-xs text-[#ac120c]" onClick={() => handleDeleteQuestion(q.id)}>DELETE</Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)}>
        <h2 className="font-display font-bold text-[24px] text-[#f4ede4] mb-6">Add Question</h2>
        <form onSubmit={handleAddQuestion} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Question Text</label>
            <Input 
              value={qData.question}
              onChange={e => setQData({ ...qData, question: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Type</label>
            <select
              value={qData.type}
              onChange={e => setQData({ ...qData, type: e.target.value })}
              className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 focus:outline-none focus:border-[#d07d22] font-mono text-sm"
            >
              <option value="TEXT">Short Text</option>
              <option value="PARAGRAPH">Paragraph</option>
              <option value="RADIO">Radio (Single Choice)</option>
              <option value="DROPDOWN">Dropdown</option>
              <option value="CHECKBOX">Checkbox (Multiple Choice)</option>
            </select>
          </div>
          {(qData.type === 'RADIO' || qData.type === 'DROPDOWN' || qData.type === 'CHECKBOX') && (
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Options (Comma separated)</label>
              <Input 
                value={qData.options}
                onChange={e => setQData({ ...qData, options: e.target.value })}
                required
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              checked={qData.required} 
              onChange={e => setQData({ ...qData, required: e.target.checked })}
              id="req"
            />
            <label htmlFor="req" className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Required Field</label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsQuestionModalOpen(false)}>CANCEL</Button>
            <Button type="submit" variant="primary">ADD QUESTION</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
