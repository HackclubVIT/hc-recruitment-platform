"use client"

/**
 * Recruiter Dashboard - Application management for Recruiters
 * 
 * FUNCTIONALITY:
 * - Paginated, filterable application table (scoped to recruiter's department)
 * - Bulk status updates for multiple applications
 * - Application detail modal with full candidate info
 * - Status transitions with role-based validation
 * - Notes and status history viewing
 * 
 * INTEGRATION POINTS:
 * - Uses ApplicationTable component with selection support
 * - API calls via client/api.ts: getApplications, getApplication, updateApplicationStatus, bulkUpdateStatus
 * - Status validation via getValidNextStatuses from lib/status
 * 
 * TODO: [INTEGRATION] Add real-time updates via WebSocket for live table refresh
 * TODO: [INTEGRATION] Connect stats cards to actual API data (currently hardcoded to 0)
 * FIXME: [BUG] Navbar uses fixed pt-20 which may not match actual navbar height
 * FIXME: [BUG] Bulk update dialog shows all statuses without filtering by valid transitions
 * FIXME: [BUG] No loading skeleton for initial table load
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ApplicationTable } from "@/components/ui/ApplicationTable"
import { NotesThread } from "@/components/ui/NotesThread"
import { StatusHistoryTimeline } from "@/components/ui/StatusHistoryTimeline"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { api } from "@/lib/client/api"
import { useAuth, useRequireAuth } from "@/lib/client/auth"
import { getValidNextStatuses, ApplicationStatus, Role } from "@/lib/status"

/**
 * ApplicationDetail - Full shape matching Lead dashboard for consistency
 * Includes all nested relations needed for detail modal
 */
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
  interviews: Array<{ id: number; startTime: string; endTime: string; mode: string; locationOrLink: string; status: string; panelists: Array<{ panelist: { id: number; name: string; email: string } }>; feedbacks: Array<{ panelist: { id: number; name: string; email: string }; ratings: Record<string, number>; overall: number; recommendation: string; comments: string | null }> }>
  createdAt: string
  _count: { interviews: number; notes: number }
}

export default function RecruiterDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  // Allow RECRUITER, LEAD, ADMIN - Leads/Admins can also view recruiter dashboard
  const { authorized } = useRequireAuth(["RECRUITER", "LEAD", "ADMIN"])

  const [selectedApp, setSelectedApp] = useState<ApplicationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  
  // Bulk action state
  const [bulkIds, setBulkIds] = useState<number[]>([])
  const [bulkStatus, setBulkStatus] = useState("")
  const [bulkReason, setBulkReason] = useState("")
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  
  // Status change dialog state
  const [statusChange, setStatusChange] = useState<{ appId: number; fromStatus: string; toStatus: string; reason: string } | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!authorized || !user)) {
      router.push("/login")
    }
  }, [authLoading, authorized, user, router])

  if (authLoading || !authorized) return null

  /**
   * handleRowClick - Opens application detail modal
   * Fetches full application data including nested relations
   * API: GET /api/recruiter/applications/[id]
   */
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

  /**
   * handleStatusChange - Initiates status change dialog for single application
   */
  const handleStatusChange = (appId: number, fromStatus: string, toStatus: string) => {
    setStatusChange({ appId, fromStatus, toStatus, reason: "" })
    setShowStatusDialog(true)
  }

  /**
   * confirmStatusChange - Submits status change to API
   * API: PATCH /api/recruiter/applications/[id]/status
   * Refreshes selected app detail on success
   */
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

  /**
   * handleBulkAction - Submits bulk status update
   * API: POST /api/recruiter/applications/bulk-status
   * FIXME: [BUG] No validation that all selected apps can transition to the target status
   * FIXME: [BUG] Shows all statuses in dropdown without filtering by current status/role
   */
  const handleBulkAction = async () => {
    if (!bulkIds.length || !bulkStatus) return
    try {
      await api.bulkUpdateStatus(bulkIds, bulkStatus, bulkReason)
      setShowBulkDialog(false)
      setBulkIds([])
      setBulkStatus("")
      setBulkReason("")
    } catch (error) {
      console.error("Bulk update failed:", error)
      alert("Bulk update failed")
    }
  }

  // Compute valid next statuses for selected app based on current status and user role
  const validNextStatuses = selectedApp
    ? getValidNextStatuses(selectedApp.status as ApplicationStatus, user?.role as Role)
    : []

  // FIXME: [BUG] Stats are hardcoded to 0 - should fetch from API
  // TODO: [INTEGRATION] Add API endpoint for recruiter stats or compute from applications list
  const stats = selectedApp ? {
    total: 0, // Would need from parent
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    selected: 0,
  } : {}

return (
    <div className="min-h-screen bg-gray-950">
      {/* Fixed Navbar - FIXME: [BUG] pt-20 on main may not match actual navbar height */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-gray-900/80 backdrop-blur border-b border-red-900/30 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="text-xl text-red-600 animate-pulse">◆</span>
          <span className="font-display font-bold text-xl tracking-wider text-white">HACKCLUB</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">{user?.name} ({user?.role})</span>
          <button
            onClick={async () => { await api.logout(); router.push("/login"); router.refresh(); }}
            className="px-3 py-1 text-gray-400 hover:text-red-400 font-mono tracking-wider"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="pt-20 pb-8 px-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl tracking-tight text-white">Applications</h1>
          <p className="text-gray-500 mt-1">Review and manage applications for your department</p>
        </div>

        {/* Application Table with bulk selection support */}
        <ApplicationTable<ApplicationDetail>
          onRowClick={handleRowClick}
          {/* Show department filter for LEAD/ADMIN only */}
          showDepartmentFilter={user?.role === "LEAD" || user?.role === "ADMIN"}
          selectedIds={bulkIds}
          onSelectionChange={setBulkIds}
        />

        {/* Bulk Action Bar - appears when items selected */}
        {bulkIds.length > 0 && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-600/30 rounded-lg flex items-center justify-between">
            <span className="text-white">{bulkIds.length} applications selected</span>
            <button
              onClick={() => setShowBulkDialog(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Bulk Update
            </button>
          </div>
        )}
      </main>

      {/* APPLICATION DETAIL MODAL */}
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
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info & Skills */}
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

              {/* Answers */}
              <div className="bg-gray-900/30 border border-red-900/20 rounded-lg p-4">
                <h3 className="font-mono text-red-600 text-xs tracking-wider mb-3">ANSWERS</h3>
                <div className="space-y-3 text-sm">
                  {Object.entries(JSON.parse(selectedApp.answers || "{}")).map(([key, value]) => (
                    <div key={key} className="bg-gray-900/50 rounded-lg p-3">
                      <div className="font-mono text-red-600 text-xs tracking-wider mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <p className="text-gray-300 whitespace-pre-wrap">{value as string}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes & Status History */}
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

              {/* Interviews - read only for recruiters */}
              {selectedApp.interviews.length > 0 && (
                <div>
                  <h3 className="font-mono text-red-600 text-xs tracking-wider mb-3">INTERVIEWS</h3>
                  <div className="space-y-3">
                    {selectedApp.interviews.map((iv: any) => (
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
                          {iv.panelists.map((p: any) => (
                            <span key={p.panelist.id} className="px-2 py-1 text-xs bg-gray-900/50 text-gray-300 rounded">
                              {p.panelist.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar - Status Change dropdown */}
              <div className="pt-4 border-t border-red-900/20 flex justify-end gap-3">
                {validNextStatuses.length > 0 && (
                  <select
                    value={statusChange?.toStatus || ""}
                    onChange={e => setStatusChange(prev => prev ? { ...prev, toStatus: e.target.value, reason: "" } : null)}
                    className="px-4 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  >
                    <option value="">Change Status</option>
                    {validNextStatuses.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                )}
                {statusChange && (
                  <button
                    onClick={confirmStatusChange}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Confirm Status Change
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE CONFIRMATION DIALOG */}
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
              onChange={e => setStatusChange({ ...statusChange, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              required={["REJECTED", "WAITLISTED"].includes(statusChange.toStatus)}
            />
          </div>
        )}
      </ConfirmDialog>

      {/* BULK UPDATE DIALOG */}
      <ConfirmDialog
        open={showBulkDialog}
        onClose={() => setShowBulkDialog(false)}
        onConfirm={handleBulkAction}
        title="Bulk Update Applications"
        message={`Update ${bulkIds.length} selected applications to ${bulkStatus}?`}
        confirmText="Apply"
        variant="primary"
      >
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">New Status</label>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Reason (required for rejection)</label>
          <textarea
            value={bulkReason}
            onChange={e => setBulkReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}