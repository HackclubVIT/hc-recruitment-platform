"use client"

interface HistoryEntry {
  id: number
  fromStatus: string | null
  toStatus: string
  changedAt: string
  reason: string | null
  changedBy: { id: number; name: string; email: string }
}

interface StatusHistoryTimelineProps {
  history: HistoryEntry[]
}

export function StatusHistoryTimeline({ history }: StatusHistoryTimelineProps) {
  if (!history.length) return <p className="text-gray-400 text-center py-4">No history</p>

  return (
    <div className="space-y-4">
      {history.map((entry, index) => (
        <div key={entry.id} className="flex gap-3 relative">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-red-600 rounded-full border-2 border-gray-900 z-10" />
            {index < history.length - 1 && (
              <div className="w-0.5 h-full bg-red-900/30 mt-1" />
            )}
          </div>
          <div className="flex-1 bg-gray-900/30 border border-red-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span className="font-mono">{entry.changedBy.name}</span>
              <span>•</span>
              <span>{new Date(entry.changedAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {entry.fromStatus && (
                <>
                  <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs font-mono">
                    {entry.fromStatus}
                  </span>
                  <span className="text-red-500">→</span>
                </>
              )}
              <span className="px-2 py-0.5 bg-red-900/30 text-red-400 rounded text-xs font-mono">
                {entry.toStatus}
              </span>
            </div>
            {entry.reason && (
              <p className="mt-2 text-xs text-gray-500">Reason: {entry.reason}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}