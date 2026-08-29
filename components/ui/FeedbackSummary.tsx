"use client"

export interface Feedback {
  interviewId: number
  interviewDate: string
  panelist: { id: number; name: string; email: string }
  ratings: Record<string, number>
  overall: number
  recommendation: string
  comments: string | null
  submittedAt: string
}

export interface FeedbackSummaryProps {
  feedbacks: Feedback[]
}

const recommendationStyles: Record<string, string> = {
  STRONG_HIRE: "bg-green-900/30 text-green-400 border-green-600/30",
  HIRE: "bg-blue-900/30 text-blue-400 border-blue-600/30",
  MAYBE: "bg-amber-900/30 text-amber-400 border-amber-600/30",
  NO_HIRE: "bg-red-900/30 text-red-400 border-red-600/30",
}

const recommendationLabels: Record<string, string> = {
  STRONG_HIRE: "Strong Hire",
  HIRE: "Hire",
  MAYBE: "Maybe",
  NO_HIRE: "No Hire",
}

export function FeedbackSummary({ feedbacks }: FeedbackSummaryProps) {
  if (!feedbacks.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No feedback submitted yet</p>
      </div>
    )
  }

  const avgOverall = feedbacks.reduce((sum, f) => sum + f.overall, 0) / feedbacks.length
  const recommendations = feedbacks.reduce((acc, f) => {
    acc[f.recommendation] = (acc[f.recommendation] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/30 border border-red-900/20 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-white">{avgOverall.toFixed(1)}</div>
          <div className="text-gray-500 text-sm">Average Score</div>
        </div>
        <div className="bg-gray-900/30 border border-red-900/20 rounded-lg p-4">
          <div className="text-gray-500 text-sm mb-2">Recommendations</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(recommendations).map(([rec, count]) => (
              <span
                key={rec}
                className={`px-2 py-1 text-xs font-mono rounded border ${recommendationStyles[rec]}`}
              >
                {recommendationLabels[rec]} ({count})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {feedbacks.map(fb => (
          <div key={fb.interviewId} className="bg-gray-900/30 border border-red-900/20 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="font-medium text-white">{fb.panelist.name}</div>
                <div className="text-xs text-gray-500">{fb.panelist.email}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Interview: {new Date(fb.interviewDate).toLocaleString()} • Submitted: {new Date(fb.submittedAt).toLocaleString()}
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-mono rounded border ${recommendationStyles[fb.recommendation]}`}>
                {recommendationLabels[fb.recommendation]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              {Object.entries(fb.ratings).map(([criterion, score]) => (
                <div key={criterion} className="text-center">
                  <div className="text-2xl font-bold text-white">{score}/5</div>
                  <div className="text-xs text-gray-500 capitalize">{criterion}</div>
                </div>
              ))}
              <div className="text-center col-span-2">
                <div className="text-2xl font-bold text-white">{fb.overall}/100</div>
                <div className="text-xs text-gray-500">Overall</div>
              </div>
            </div>

            {fb.comments && (
              <div className="pt-3 border-t border-red-900/20">
                <div className="text-xs text-gray-500 mb-1">Comments</div>
                <p className="text-gray-300 whitespace-pre-wrap">{fb.comments}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}