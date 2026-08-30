"use client"

import React, { useState } from "react"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

const faqs = [
  {
    question: "Who can apply?",
    answer: "Any student of VIT Chennai, regardless of their major or year of study, can apply. We value passion and willingness to learn over formal qualifications."
  },
  {
    question: "Do I need prior experience?",
    answer: "No! While prior experience is helpful for some roles (like Core Development), we have openings for beginners where we evaluate your learning curve, enthusiasm, and problem-solving mindset."
  },
  {
    question: "What roles can I apply for?",
    answer: "You can apply for the roles listed in the Open Opportunities section. Typically, this includes Development, AI/ML, Design, and Event Management."
  },
  {
    question: "What happens after I apply?",
    answer: "Your application is reviewed by our panel. If shortlisted, you will be invited for an interview (or task round). You can track your application status anytime via the portal."
  },
  {
    question: "How does the interview work?",
    answer: "Interviews are casual but technical. We'll discuss your past projects, how you approach problem-solving, and see if you're a good culture fit for the club."
  },
  {
    question: "Can beginners apply?",
    answer: "Absolutely. Hack Club is about learning together. If you're a beginner who is highly motivated to learn and build, we want you."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="relative py-24 bg-[#0a0101] border-t border-[#2a0d0d]">
      <ScrollReveal>
      <div className="max-w-[800px] mx-auto px-6">
        <div className="flex flex-col items-center mb-16 text-center">
          <h2 className="font-display font-bold text-[32px] sm:text-[40px] text-[#f4ede4] mb-4">
            Frequently Asked <span className="text-[#ac120c]">Questions</span>
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div 
                key={i} 
                className={`border transition-colors duration-300 rounded-[16px] overflow-hidden ${
                  isOpen ? 'border-[#d07d22]/50 bg-[#120202]' : 'border-[#2a0d0d] bg-transparent hover:border-[#ac120c]/40'
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full text-left px-6 py-5 flex justify-between items-center focus:outline-none focus-visible:bg-[#1a0404]"
                >
                  <span className="font-mono font-bold text-[15px] text-[#f4ede4]">
                    {faq.question}
                  </span>
                  <div className={`shrink-0 ml-4 w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isOpen ? 'border-[#d07d22] text-[#d07d22] rotate-180' : 'border-[#2a0d0d] text-[#bfa8a2]'
                  }`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </div>
                </button>
                
                <div 
                  className={`px-6 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                    isOpen ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'
                  }`}
                >
                  <p className="font-body text-[#bfa8a2] text-[15px] leading-relaxed pt-2 border-t border-[#2a0d0d]/50">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      </ScrollReveal>
    </section>
  )
}

