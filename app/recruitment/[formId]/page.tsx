"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { DiamondIcon } from "@/components/ui/Icons"

export default function DynamicRecruitmentPage() {
  const router = useRouter()
  const params = useParams()
  const [formId, setFormId] = useState<number>(1)
  const [questions, setQuestions] = useState<any[]>([])
  
  const [formData, setFormData] = useState<Record<string, string>>({
    name: "",
    email: "",
    phone: "",
    registration_number: "",
    department: "CSE",
    resume_url: "",
  })
  
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (params?.formId) {
      setFormId(parseInt(params.formId as string, 10))
    }
  }, [params])

  useEffect(() => {
    if (formId) {
      fetchQuestions()
    }
  }, [formId])

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`)
      if (!res.ok) throw new Error("Form not found")
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleDynamicChange = (questionId: string, value: string) => {
    setDynamicAnswers({ ...dynamicAnswers, [questionId]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const payload = {
        ...formData,
        form_id: formId,
        answers: dynamicAnswers
      }

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application")
      }

      router.push("/application-success")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0202] flex items-center justify-center">
        <DiamondIcon className="text-[#ac120c] animate-pulse w-10 h-10" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0202] flex items-center justify-center p-6 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#ac120c] opacity-[0.03] blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#d07d22] opacity-[0.02] blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="w-full max-w-[700px] animate-[rise_0.6s_cubic-bezier(0.2,0.8,0.2,1)] relative z-10">
        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#120202] border border-[#ac120c]/30 flex items-center justify-center shadow-[0_0_40px_rgba(172,18,12,0.2)] relative">
            <DiamondIcon className="text-[#ac120c] w-6 h-6 animate-[pulse-scale_2s_infinite]" />
          </div>
          <div className="text-center">
            <h1 className="font-display font-black text-[24px] sm:text-[32px] text-[#f4ede4] tracking-wide uppercase">
              Recruitment Form #{formId}
            </h1>
            <p className="font-mono text-[#bfa8a2] text-[12px] uppercase tracking-[0.1em] mt-2">
              System Initiation
            </p>
          </div>
        </div>

        <Card className="p-8 sm:p-10 bg-[#120202]/80 backdrop-blur-md border border-[#2a0d0d] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ac120c] to-transparent opacity-50" />
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {error && (
              <div className="bg-[#ac120c]/10 border border-[#ac120c]/50 text-[#f4ede4] p-4 rounded-sm text-sm font-mono tracking-wide">
                <span className="text-[#ac120c] font-bold mr-2">ERR:</span> {error}
              </div>
            )}
            
            <div className="flex flex-col gap-6">
              <h3 className="font-display text-[#d07d22] text-sm uppercase tracking-widest border-b border-[#2a0d0d] pb-2">Base Identity</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] text-[#bfa8a2] uppercase tracking-[0.2em]">Full Name</label>
                  <Input name="name" type="text" value={formData.name} onChange={handleBaseChange} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] text-[#bfa8a2] uppercase tracking-[0.2em]">Registration No.</label>
                  <Input name="registration_number" type="text" value={formData.registration_number} onChange={handleBaseChange} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] text-[#bfa8a2] uppercase tracking-[0.2em]">Email Address</label>
                  <Input name="email" type="email" value={formData.email} onChange={handleBaseChange} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] text-[#bfa8a2] uppercase tracking-[0.2em]">Phone Number</label>
                  <Input name="phone" type="tel" value={formData.phone} onChange={handleBaseChange} required />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="font-mono text-[10px] text-[#bfa8a2] uppercase tracking-[0.2em]">Target Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleBaseChange}
                    className="w-full bg-[#1a0606] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-none font-mono text-[13px] focus:outline-none focus:border-[#d07d22] transition-colors"
                    required
                  >
                    <option value="CSE">Computer Science</option>
                    <option value="ECE">Electronics</option>
                    <option value="DESIGN">Design</option>
                    <option value="MANAGEMENT">Management</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="font-mono text-[10px] text-[#bfa8a2] uppercase tracking-[0.2em]">Resume Link</label>
                  <Input name="resume_url" type="url" value={formData.resume_url} onChange={handleBaseChange} placeholder="https://..." required />
                </div>
              </div>
            </div>

            {questions.length > 0 && (
              <div className="flex flex-col gap-6">
                <h3 className="font-display text-[#d07d22] text-sm uppercase tracking-widest border-b border-[#2a0d0d] pb-2">Technical Evaluation</h3>
                
                {questions.map((q) => (
                  <div key={q.id} className="flex flex-col gap-2">
                    <label className="font-mono text-[10px] text-[#bfa8a2] uppercase tracking-[0.2em]">
                      {q.question} {q.required && <span className="text-[#ac120c]">*</span>}
                    </label>
                    
                    {q.type === "TEXT" && (
                      <Input 
                        value={dynamicAnswers[q.id] || ""} 
                        onChange={(e) => handleDynamicChange(q.id.toString(), e.target.value)} 
                        required={q.required} 
                      />
                    )}
                    
                    {q.type === "PARAGRAPH" && (
                      <textarea 
                        value={dynamicAnswers[q.id] || ""} 
                        onChange={(e) => handleDynamicChange(q.id.toString(), e.target.value)} 
                        required={q.required}
                        className="w-full bg-[#1a0606] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-none font-mono text-[13px] focus:outline-none focus:border-[#d07d22] transition-colors min-h-[100px]"
                      />
                    )}

                    {q.type === "RADIO" && q.options && (
                      <div className="flex flex-col gap-2 mt-2">
                        {q.options.map((opt: string, idx: number) => (
                          <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="radio" 
                              name={`question_${q.id}`} 
                              value={opt}
                              checked={dynamicAnswers[q.id] === opt}
                              onChange={() => handleDynamicChange(q.id.toString(), opt)}
                              required={q.required}
                              className="appearance-none w-4 h-4 rounded-full border border-[#d07d22] checked:bg-[#ac120c] transition-all"
                            />
                            <span className="font-mono text-[12px] text-[#bfa8a2] group-hover:text-[#f4ede4] transition-colors">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[#2a0d0d] flex justify-end">
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto px-10 bg-[#ac120c] hover:bg-[#8a0e0a] text-[#f4ede4] font-display uppercase tracking-widest text-sm h-12 rounded-none border-none relative overflow-hidden group">
                <span className="relative z-10">{submitting ? "UPLOADING..." : "TRANSMIT"}</span>
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
