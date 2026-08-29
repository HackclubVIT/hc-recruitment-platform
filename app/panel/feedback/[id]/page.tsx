"use client"
import { fetchApi } from "@/api-client"


import React, { useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { Button } from "@/components/ui/Button"

export default function FeedbackForm({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    interview_id: parseInt(resolvedParams.id, 10),
    technical_score: 3,
    communication_score: 3,
    problem_solving_score: 3,
    confidence_score: 3,
    teamwork_score: 3,
    comments: "",
    decision: "RECOMMENDED"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetchApi(`/api/feedback`, {  
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback")
      }

      router.push("/panel/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderSlider = (label: string, field: keyof typeof formData) => (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">{label}</label>
        <span className="font-display font-bold text-[#d07d22]">{formData[field]} / 5</span>
      </div>
      <input 
        type="range" 
        min="1" max="5" 
        value={formData[field] as number}
        onChange={(e) => setFormData({ ...formData, [field]: parseInt(e.target.value) })}
        className="w-full accent-[#ac120c]"
      />
    </div>
  )

  const overallScore = Math.round(((
    formData.technical_score + 
    formData.communication_score + 
    formData.problem_solving_score + 
    formData.confidence_score + 
    formData.teamwork_score
  ) / 25) * 100)

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[#d07d22] font-mono text-[11.5px] uppercase tracking-[0.2em]">
          <DiamondIcon />
          <span>Evaluation Module</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight text-[#f4ede4]">
            Submit Feedback
          </h1>
          <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] text-[#bfa8a2] tracking-widest uppercase">Overall Score</span>
            <span className="font-display font-black text-[24px] text-[#d07d22]">{overallScore}%</span>
          </div>
        </div>
      </header>

      <Card className="p-8 max-w-3xl">
        {error && (
          <div className="bg-[#ac120c]/10 border border-[#ac120c]/50 text-[#ac120c] p-4 rounded-lg text-sm font-medium mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {renderSlider("Technical Skills", "technical_score")}
            {renderSlider("Communication", "communication_score")}
            {renderSlider("Problem Solving", "problem_solving_score")}
            {renderSlider("Confidence", "confidence_score")}
            {renderSlider("Teamwork", "teamwork_score")}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Recommendation</label>
            <select
              value={formData.decision}
              onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
              className="w-full bg-[#120202] border border-[#2a0d0d] text-[#f4ede4] p-3 rounded-[8px] font-mono focus:border-[#d07d22] outline-none"
            >
              <option value="RECOMMENDED">RECOMMENDED</option>
              <option value="MAYBE">MAYBE</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] text-[#bfa8a2] uppercase tracking-widest">Comments / Justification</label>
            <textarea 
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="w-full min-h-[120px] bg-[#120202]/60 border border-[rgba(208,125,34,0.3)] text-[#f4ede4] p-4 rounded-[8px] font-mono text-[13px] focus:outline-none focus:border-[#d07d22] focus:shadow-[0_0_15px_rgba(208,125,34,0.15)] transition-all duration-300"
              placeholder="Provide detailed feedback on candidate's performance..."
              required
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button type="submit" variant="cta" disabled={loading} className="w-full md:w-auto">
              {loading ? "SUBMITTING..." : "SUBMIT EVALUATION"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
