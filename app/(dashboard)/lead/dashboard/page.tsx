"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ApplicationTable } from "@/components/ui/ApplicationTable"
import { NotesThread } from "@/components/ui/NotesThread"
import { StatusHistoryTimeline } from "@/components/ui/StatusHistoryTimeline"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { InterviewSchedulerModal } from "@/components/ui/InterviewSchedulerModal"
import { FeedbackSummary } from "@/components/ui/FeedbackSummary"
import { api } from "@/lib/client/api"
import { useAuth, useRequireAuth } from "@/lib/client/auth"
import { getValidNextStatuses, ApplicationStatus, Role } from "@/lib/status"

interface ApplicationDetail {
  id: number
  name: string
  email: string
  registerNumber: string
  phoneNumber: string | null
  yearOfStudy: string
  roleAppliedFor: string
  resumeUrl: string | null
  technicalSkills: string
  answers: string
  status: string
  department: { id: number; name: string }
  assignedRecruiter: { id: number; name: string; email: string } | null
  notes: { id: number; body: string; createdAt: string; author: { id: number; name: string; email: string } }[]
  history: { id: number; fromStatus: string | null; toStatus: string; changedAt: string; reason: string | null; changedBy: { id: number; name: string; email: string } }[]
  interviews: Array<{
    id: number
    startTime: string
    endTime: string
    mode: string
    locationOrLink: string
    status: string
    panelists: Array<{ panelist: { id: number; name: string; email: string } }>
    feedbacks: Array<{
      panelist: { id: number; name: string; email: string }
      ratings: Record<string, number>
      overall: number
      recommendation: string
      comments: string | null
    }>
  }>
  createdAt: string
  _count: { interviews: number; notes: number }
}

interface DashboardData {
  totalApplications: number
  funnel: Record<string, number>
  recentActivity: Array<{ id: number; changedBy: { name: string }; application: { name: string }; toStatus: string; reason: string | null; changedAt: string }>
  recruiterLoad: { id: number; name: string; email: string; activeApplications: number }[]
}

interface Recruiter {
  id: number
  name: string
  email: string
  departments: { id: number; name: string }[]
  activeApplications: number
}

interface AnalyticsData {
  funnel: Record<string, number>
  panelWorkload: { id: number; name: string; email: string; upcomingInterviews: number }[]
  recommendationDist: Record<string, number>
  totalApplications: number
}

export default function LeadDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { authorized } = useRequireAuth(["LEAD", "ADMIN"])

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [recruiters, setRecruiters] = useState<Array<{ id: number; name: string; email: string; departments: { id: number; name: string }[]; activeApplications: number }>>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [selectedApp, setSelectedApp] = useState<ApplicationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const pathname = usePathname()
  const initialTab = pathname.includes("/applications") ? "applications" 
    : pathname.includes("/recruiters") ? "recruiters"
    : pathname.includes("/scheduling") || pathname.includes("/interviews") ? "scheduling"
    : pathname.includes("/analytics") ? "analytics"
    : "overview"
    
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "recruiters" | "scheduling" | "analytics">(initialTab)

  const [schedulerOpen, setSchedulerOpen] = useState(false)
  const [schedulerApp, setSchedulerApp] = useState<ApplicationDetail | null>(null)

  const [feedbackApp, setFeedbackApp] = useState<ApplicationDetail | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const [decisionApp, setDecisionApp] = useState<ApplicationDetail | null>(null)
  const [decisionStatus, setDecisionStatus] = useState("")
  const [decisionReason, setDecisionReason] = useState("")
  const [decisionOverride, setDecisionOverride] = useState(false)
  const [showDecisionDialog, setShowDecisionDialog] = useState(false)

  const [exportLoading, setExportLoading] = useState(false)
  const [statusChange, setStatusChange] = useState<{ appId: number; fromStatus: string; toStatus: string; reason: string } | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.getLeadDashboard()
      setDashboardData(data as DashboardData)
    } catch (error) {
      console.error("Failed to load dashboard:", error)
    }
  }, [])

  const loadRecruiters = useCallback(async () => {
    try {
      const data = await api.getLeadRecruiters()
      setRecruiters((data as { recruiters: Array<{ id: number; name: string; email: string; departments: { id: number; name: string }[]; activeApplications: number }> }).recruiters)
    } catch (error) {
      console.error("Failed to load recruiters:", error)
    }
  }, [])

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await api.getAnalytics()
      setAnalytics(data as AnalyticsData)
    } catch (error) {
      console.error("Failed to load analytics:", error)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && (!authorized || !user)) {
      router.push("/login")
    }
  }, [authLoading, authorized, user, router])

  useEffect(() => {
    if (authorized && user) {
      loadDashboard()
      loadRecruiters()
      loadAnalytics()
    }
  }, [authorized, user, loadDashboard, loadRecruiters, loadAnalytics])

  const handleRowClick = async (app: ApplicationDetail) => {
    setDetailLoading(true)
    try {
      const data = await api.getApplication(app.id)
      setSelectedApp(data as ApplicationDetail)
    } catch (error) {
      console.error("Failed to load application:", error)
    } finally {
      setDetailLoading(false)
    }
  }

  const openScheduler = (app: ApplicationDetail) => {
    setSchedulerApp(app)
    setSchedulerOpen(true)
  }

  const handleScheduleSuccess = () => {
    setSchedulerOpen(false)
    setSchedulerApp(null)
    loadDashboard()
  }

  const openFeedback = async (app: ApplicationDetail) => {
    setFeedbackLoading(true)
    try {
      const data = await api.getFeedback(app.id)
      setFeedbackApp({ ...app, ...(data as { feedbacks: Array<{ interviewId: number; interviewDate: string; panelist: { id: number; name: string; email: string }; ratings: Record<string, number>; overall: number; recommendation: string; comments: string | null; submittedAt: string }>; interviews: any[] }) })
    } catch (error) {
      console.error("Failed to load feedback:", error)
    } finally {
      setFeedbackLoading(false)
    }
  }

  const openDecision = (app: ApplicationDetail) => {
    setDecisionApp(app)
    setDecisionStatus("")
    setDecisionReason("")
    setDecisionOverride(false)
    setShowDecisionDialog(true)
  }

  const handleStatusChange = (appId: number, fromStatus: string, toStatus: string) => {
    setStatusChange({ appId, fromStatus, toStatus, reason: "" })
    setShowStatusDialog(true)
  }

  const confirmStatusChange = async () => {
    if (!statusChange) return
    try {
      await api.updateApplicationStatus(statusChange.appId, statusChange.toStatus, statusChange.reason)
      setShowStatusDialog(false)
      setStatusChange(null)
      if (selectedApp?.id === statusChange.appId) {
        handleRowClick(selectedApp)
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      alert("Failed to update status")
    }
  }

  const handleDecision = async () => {
    if (!decisionApp || !decisionStatus) return
    try {
      await api.makeDecision(decisionApp.id, decisionStatus, decisionReason, decisionOverride)
      setShowDecisionDialog(false)
      setDecisionApp(null)
      loadDashboard()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to make decision")
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const blob = await api.exportApplications()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `applications-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed")
    } finally {
      setExportLoading(false)
    }
  }

  if (authLoading || !authorized) return null

  const validNextStatuses = selectedApp
    ? getValidNextStatuses(selectedApp.status as ApplicationStatus, user?.role as Role)
    : []

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl tracking-tight text-white">Lead Dashboard</h1>
            <p className="text-gray-500 mt-1">Department overview and management</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} disabled={exportLoading} className="px-4 py-2 border border-red-900/30 text-gray-300 rounded-lg hover:bg-red-900/20 text-sm font-mono">
              {exportLoading ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>
      </div>

        {/* Tabs are now handled by the Shell navigation sidebar, so we can hide this redundant tablist */}

        {activeTab === "overview" && dashboardData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <StatCard label="Total Applications" value={dashboardData.totalApplications} />
              <StatCard label="Applied" value={dashboardData.funnel.APPLIED || 0} color="yellow" />
              <StatCard label="Under Review" value={dashboardData.funnel.UNDER_REVIEW || 0} color="blue" />
              <StatCard label="Shortlisted" value={dashboardData.funnel.SHORTLISTED || 0} color="purple" />
              <StatCard label="Selected" value={dashboardData.funnel.SELECTED || 0} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900/30 border border-red-900/20 rounded-xl p-6">
                <h3 className="font-mono text-red-600 text-xs tracking-wider mb-4">Recruiter Workload</h3>
                <div className="space-y-3">
                  {dashboardData.recruiterLoad.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <div>
                        <div className="font-medium text-white">{r.name}</div>
                        <div className="text-xs text-gray-500">{r.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-400">{r.activeApplications}</div>
                        <div className="text-xs text-gray-500">Active Apps</div>
                      </div>
                    </div>
                  ))}
                  {dashboardData.recruiterLoad.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recruiters assigned</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-900/30 border border-red-900/20 rounded-xl p-6">
                <h3 className="font-mono text-red-600 text-xs tracking-wider mb-4">Recent Activity</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {dashboardData.recentActivity.slice(0, 10).map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center text-xs font-mono text-red-400">
                        {a.changedBy?.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white">{a.changedBy?.name} moved <span className="font-medium">{a.application?.name}</span> to <span className="font-medium text-red-400">{a.toStatus}</span></div>
                        <div className="text-xs text-gray-500">{a.reason || "No reason"}</div>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(a.changedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {dashboardData.recentActivity.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "applications" && (
          <ApplicationTable<ApplicationDetail>
            onRowClick={handleRowClick}
            showDepartmentFilter={true}
          />
        )}

        {activeTab === "recruiters" && (
          <div className="space-y-4">
            <div className="bg-gray-900/30 border border-red-900/20 rounded-xl p-6">
              <h3 className="font-mono text-red-600 text-xs tracking-wider mb-4">Recruiter Team</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-400 font-mono text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Departments</th>
                      <th className="px-4 py-3">Active Applications</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-900/20">
                    {recruiters.map((r) => (
                      <tr key={r.id} className="hover:bg-red-900/10">
                        <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                        <td className="px-4 py-3 text-gray-400">{r.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {r.departments.map((d) => (
                              <span key={d.id} className="px-2 py-0.5 text-xs bg-red-900/30 text-red-400 rounded border border-red-600/30">
                                {d.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-red-400">{r.activeApplications}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "scheduling" && (
          <div className="space-y-6">
            <div className="bg-gray-900/30 border border-red-900/20 rounded-xl p-6">
              <h3 className="font-mono text-red-600 text-xs tracking-wider mb-4">Schedule Interviews</h3>
              <p className="text-gray-500 mb-4">Select shortlisted candidates from the Applications tab, then use the Schedule button to book interviews.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-red-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Shortlisted Candidates</h4>
                  <p className="text-sm text-gray-500">Filter applications by "Shortlisted" status to see candidates ready for interview scheduling.</p>
                </div>
                <div className="bg-gray-900/50 border border-red-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Panel Availability</h4>
                  <p className="text-sm text-gray-500">When scheduling, panelist availability will be shown based on the selected time slot.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Total Applications" value={analytics.totalApplications} />
              <StatCard label="Shortlisted" value={analytics.funnel.SHORTLISTED || 0} color="purple" />
              <StatCard label="Interviewed" value={analytics.funnel.INTERVIEWED || 0} color="cyan" />
              <StatCard label="Selected" value={analytics.funnel.SELECTED || 0} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900/30 border border-red-900/20 rounded-xl p-6">
                <h3 className="font-mono text-red-600 text-xs tracking-wider mb-4">Funnel</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.funnel).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <span className="text-gray-300">{status.replace(/_/g, " ")}</span>
                      <span className="font-bold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900/30 border border-red-900/20 rounded-xl p-6">
                <h3 className="font-mono text-red-600 text-xs tracking-wider mb-4">Panel Workload</h3>
                <div className="space-y-3">
                  {analytics.panelWorkload.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <div>
                        <div className="font-medium text-white">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-400">{p.upcomingInterviews}</div>
                        <div className="text-xs text-gray-500">Upcoming</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900/30 border border-red-900/20 rounded-xl p-6">
                <h3 className="font-mono text-red-600 text-xs tracking-wider mb-4">Feedback Recommendations</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analytics.recommendationDist).map(([rec, count]) => (
                    <span key={rec} className="px-3 py-1 text-sm font-mono rounded border bg-gray-900/50 text-gray-300">
                      {rec.replace(/_/g, " ")}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
            <div className="relative bg-gray-900 border border-red-900/30 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
              <div className="p-6 border-b border-red-900/30 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-2xl text-white">{selectedApp.name}</h2>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span>{selectedApp.email}</span>
                    <span>•</span>
                    <span className="font-mono">{selectedApp.registerNumber}</span>
                    <span>•</span>
                    <span>{selectedApp.department.name}</span>
                    <span>•</span>
                    <StatusBadge status={selectedApp.status} />
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-white text-2xl" aria-label="Close">✕</button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/30 border border-red-900/20 rounded-lg p-4">
                    <h3 className="font-mono text-red-600 text-xs tracking-wider mb-2">BASIC INFO</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">Role Applied:</span> <span className="text-white ml-2">{selectedApp.roleAppliedFor}</span></div>
                      <div><span className="text-gray-500">Year:</span> <span className="text-white ml-2">{selectedApp.yearOfStudy}</span></div>
                      <div><span className="text-gray-500">Phone:</span> <span className="text-white ml-2">{selectedApp.phoneNumber || "—"}</span></div>
                      <div><span className="text-gray-500">Assigned Recruiter:</span> <span className="text-white ml-2">{selectedApp.assignedRecruiter?.name || "Unassigned"}</span></div>
                      <div><span className="text-gray-500">Applied:</span> <span className="text-white ml-2">{new Date(selectedApp.createdAt).toLocaleString()}</span></div>
                    </div>
                  </div>

                  <div className="bg-gray-900/30 border border-red-900/20 rounded-lg p-4">
                    <h3 className="font-mono text-red-600 text-xs tracking-wider mb-2">SKILLS</h3>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(selectedApp.technicalSkills || "[]").map((s: string) => (
                        <span key={s} className="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded border border-red-600/30">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/30 border border-red-900/20 rounded-lg p-4">
                  <h3 className="font-mono text-red-600 text-xs tracking-wider mb-3">ANSWERS</h3>
                  <div className="space-y-3 text-sm">
                    {Object.entries(JSON.parse(selectedApp.answers || "{}")).map(([key, value]) => (
                      <div key={key} className="bg-gray-900/50 rounded-lg p-3">
                        <div className="font-mono text-red-600 text-xs tracking-wider mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                        <p className="text-gray-300 whitespace-pre-wrap">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-mono text-red-600 text-xs tracking-wider mb-3">NOTES</h3>
                    <NotesThread applicationId={selectedApp.id} />
                  </div>
                  <div>
                    <h3 className="font-mono text-red-600 text-xs tracking-wider mb-3">STATUS HISTORY</h3>
                    <StatusHistoryTimeline history={selectedApp.history} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono text-red-600 text-xs tracking-wider">INTERVIEWS</h3>
                    <button
                      onClick={() => openScheduler(selectedApp!)}
                      disabled={!["SHORTLISTED", "INTERVIEW_SCHEDULED"].includes(selectedApp.status)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {selectedApp.status === "SHORTLISTED" ? "Schedule Interview" : "Reschedule"}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {selectedApp.interviews.map((iv) => (
                      <div key={iv.id} className="bg-gray-900/30 border border-red-900/20 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">
                              {new Date(iv.startTime).toLocaleString()} - {new Date(iv.endTime).toLocaleTimeString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {iv.mode} • {iv.locationOrLink}
                            </div>
                          </div>
                          <StatusBadge status={iv.status} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {iv.panelists.map((p) => (
                            <span key={p.panelist.id} className="px-2 py-1 text-xs bg-gray-900/50 text-gray-300 rounded">
                              {p.panelist.name}
                            </span>
                          ))}
                        </div>
                        {iv.feedbacks && iv.feedbacks.length > 0 && (
                          <div className="mt-3 p-3 bg-green-900/20 border border-green-600/30 rounded">
                            <div className="text-xs text-green-400 mb-1">Feedback Submitted</div>
                            <div className="text-sm text-green-300">
                              {iv.feedbacks.map((f: any) => `${f.panelist.name}: ${f.recommendation} (${f.overall}/100)`).join("; ")}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {selectedApp.interviews.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No interviews scheduled</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-red-600 text-xs tracking-wider mb-3">FEEDBACK SUMMARY</h3>
                  {feedbackApp && feedbackApp.id === selectedApp.id ? (
                    feedbackLoading ? (
                      <div className="text-center py-4 text-gray-500">Loading feedback...</div>
                    ) : (
                      <FeedbackSummary feedbacks={(feedbackApp as any).feedbacks || []} />
                    )
                  ) : (
                    <button
                      onClick={() => openFeedback(selectedApp!)}
                      className="px-4 py-2 border border-red-900/30 text-gray-300 rounded-lg hover:bg-red-900/20 text-sm"
                    >
                      Load Feedback
                    </button>
                  )}
                </div>

                <div className="pt-4 border-t border-red-900/20 flex justify-end gap-3">
                  {validNextStatuses.length > 0 && (
                    <select
                      value={statusChange?.toStatus || ""}
                      onChange={(e) => setStatusChange((prev) => prev ? { ...prev, toStatus: e.target.value, reason: "" } : null)}
                      className="px-4 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                    >
                      <option value="">Change Status</option>
                      {validNextStatuses.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => openDecision(selectedApp!)}
                    disabled={!["INTERVIEWED", "WAITLISTED"].includes(selectedApp.status)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Final Decision
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {feedbackApp && feedbackApp.id === selectedApp?.id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
            <div className="relative bg-gray-900 border border-red-900/30 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
              <div className="p-6 border-b border-red-900/30 flex items-center justify-between">
                <h3 className="font-display font-bold text-xl text-white">Feedback for {feedbackApp.name}</h3>
                <button onClick={() => setFeedbackApp(null)} className="text-gray-400 hover:text-white text-2xl" aria-label="Close">✕</button>
              </div>
              <div className="p-6">
                <FeedbackSummary feedbacks={(feedbackApp as any).feedbacks || []} />
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={showDecisionDialog}
          onClose={() => { setShowDecisionDialog(false); setDecisionApp(null); }}
          onConfirm={handleDecision}
          title="Final Decision"
          message={decisionApp ? `Make final decision for ${decisionApp.name}?` : ""}
          confirmText="Confirm Decision"
          variant="danger"
        >
          {decisionApp && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Decision</label>
                <select
                  value={decisionStatus}
                  onChange={(e) => setDecisionStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                >
                  <option value="SELECTED">Selected</option>
                  <option value="WAITLISTED">Waitlisted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Reason (required)</label>
                <textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={decisionOverride}
                  onChange={(e) => setDecisionOverride(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-red-900/30 rounded focus:ring-red-500"
                />
                Override feedback requirement (log reason)
              </label>
            </div>
          )}
        </ConfirmDialog>

        <ConfirmDialog
          open={showStatusDialog}
          onClose={() => { setShowStatusDialog(false); setStatusChange(null); }}
          onConfirm={confirmStatusChange}
          title="Change Application Status"
          message={statusChange ? `Change status from ${statusChange.fromStatus} to ${statusChange.toStatus}?` : ""}
          confirmText="Confirm"
          variant="primary"
        >
          {statusChange && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Reason (required for rejection)</label>
              <textarea
                value={statusChange.reason}
                onChange={(e) => setStatusChange({ ...statusChange, reason: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                required={["REJECTED", "WAITLISTED"].includes(statusChange.toStatus)}
              />
            </div>
          )}
        </ConfirmDialog>

        <InterviewSchedulerModal
          open={schedulerOpen}
          onClose={() => { setSchedulerOpen(false); setSchedulerApp(null); }}
          applicationId={schedulerApp?.id || 0}
          applicationName={schedulerApp?.name || ""}
          applicationEmail={schedulerApp?.email || ""}
          departmentId={selectedApp?.department.id || 0}
          onSuccess={handleScheduleSuccess}
        />
      </div>
  )
}

function StatCard({ label, value, color = "red" }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    red: "bg-red-900/30 text-red-400 border-red-600/30",
    yellow: "bg-yellow-900/30 text-yellow-400 border-yellow-600/30",
    blue: "bg-blue-900/30 text-blue-400 border-blue-600/30",
    purple: "bg-purple-900/30 text-purple-400 border-purple-600/30",
    green: "bg-green-900/30 text-green-400 border-green-600/30",
    cyan: "bg-cyan-900/30 text-cyan-400 border-cyan-600/30",
  }

  return (
    <div className={`bg-gray-900/30 border rounded-xl p-6 ${colors[color] || colors.red}`}>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-xs font-mono tracking-wider text-gray-500 mt-1">{label}</div>
    </div>
  )
}