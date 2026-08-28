"use client"

/**
 * ApplicationTable - Reusable paginated, filterable table for applications
 * Used by both Lead and Recruiter dashboards
 * 
 * FEATURES:
 * - Server-side pagination, search, status filter, department filter
 * - Row selection for bulk actions (checkbox column)
 * - Row click handler for detail view
 * - Role-aware department filter (only shows for LEAD/ADMIN)
 * 
 * PROPS:
 * - initialApplications: Optional initial data (for SSR/hydration)
 * - onRowClick: Callback when row clicked (opens detail modal)
 * - showDepartmentFilter: Whether to show department dropdown
 * - selectedIds: Currently selected row IDs (controlled)
 * - onSelectionChange: Callback for selection changes
 * 
 * FIXME: [BUG] Department filter only shows departments from current page
 * FIXME: [BUG] "Select All" checkbox logic flawed for partial selections
 * FIXME: [BUG] Selection persists across page changes (should reset or sync)
 * TODO: [INTEGRATION] Add column sorting
 * TODO: [INTEGRATION] Add virtualized rows for large datasets
 */

import { useState, useEffect } from "react"
import { api } from "@/lib/client/api"
import { StatusBadge } from "./StatusBadge"
import { useAuth } from "@/lib/client/auth"

interface BaseApplication {
  id: number
  name: string
  email: string
  registerNumber: string
  phoneNumber: string | null
  yearOfStudy: string
  roleAppliedFor: string
  status: string
  department: { id: number; name: string }
  assignedRecruiter: { id: number; name: string; email: string } | null
  createdAt: string
  _count: { interviews: number; notes: number }
}

interface ApplicationTableProps<T extends BaseApplication = BaseApplication> {
  initialApplications?: T[]
  onRowClick?: (app: T) => void
  showDepartmentFilter?: boolean
  selectedIds?: number[]
  onSelectionChange?: (ids: number[]) => void
}

export function ApplicationTable<T extends BaseApplication = BaseApplication>({ 
  initialApplications, 
  onRowClick, 
  showDepartmentFilter = true,
  selectedIds = [],
  onSelectionChange
}: ApplicationTableProps<T>) {
  const [applications, setApplications] = useState<T[]>(initialApplications || [])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deptFilter, setDeptFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const { user } = useAuth()
  const perPage = 10

  const isLead = user?.role === "LEAD"

  /**
   * fetchApplications - Calls API with current filters and pagination
   * Resets to page 1 when filters change (handled by onChange handlers)
   */
  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), limit: String(perPage) }
      if (search) params.search = search
      if (statusFilter !== "all") params.status = statusFilter
      if (deptFilter !== "all") params.departmentId = deptFilter
      const data = await api.getApplications(params)
      const result = data as { applications: T[]; pagination: { total: number; totalPages: number } }
      setApplications(result.applications)
      setTotal(result.pagination.total)
      setTotalPages(result.pagination.totalPages)
    } catch (error) {
      console.error("Failed to fetch applications:", error)
    } finally {
      setLoading(false)
    }
  }

  // Refetch when pagination or filters change
  useEffect(() => {
    const load = async () => {
      await fetchApplications();
    };
    load();
  }, [page, search, statusFilter, deptFilter]);

  /**
   * toggleSelection - Toggles a single row's selection state
   * Called by row checkbox onChange
   */
  const toggleSelection = (id: number) => {
    if (!onSelectionChange) return
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id]
    onSelectionChange(newSelected)
  }

  /**
   * departments - Unique departments from current page's applications
   * FIXME: [BUG] Only reflects departments on current page, not all departments
   * TODO: [INTEGRATION] Fetch all departments from separate API endpoint
   */
  const departments = Array.from(new Set(applications.map((a) => a.department)));


  return (
    <div className="space-y-4">
      {/* Filter Bar - Search, Status Filter, Department Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <input
            type="text"
            placeholder="Search name, email, register number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full px-4 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
        >
          <option value="all">All Status</option>
          <option value="APPLIED">Applied</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
          <option value="INTERVIEWED">Interviewed</option>
          <option value="SELECTED">Selected</option>
          <option value="WAITLISTED">Waitlisted</option>
          <option value="REJECTED">Rejected</option>
        </select>
        {/* Department Filter - Only for LEAD/ADMIN */}
        {showDepartmentFilter && isLead && (
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-gray-900/50 border border-red-900/30 rounded-lg text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Loading / Empty / Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No applications found</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-red-900/30">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50">
                <tr className="text-left text-gray-400 font-mono text-xs uppercase tracking-wider">
                  {/* Select All Checkbox */}
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-red-600 border-red-900/30 rounded focus:ring-red-500"
                      checked={applications.length > 0 && applications.every(app => selectedIds.includes(app.id))}
                      onChange={() => {
                        if (!onSelectionChange) return
                        const allSelected = applications.every(app => selectedIds.includes(app.id))
                        if (allSelected) {
                          onSelectionChange(selectedIds.filter(id => !applications.some(app => app.id === id)))
                        } else {
                          onSelectionChange([...selectedIds, ...applications.map(app => app.id).filter(id => !selectedIds.includes(id))])
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Recruiter</th>
                  <th className="px-4 py-3">Applied</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-900/20">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => onRowClick?.(app)}
                    className="hover:bg-red-900/10 cursor-pointer transition-colors"
                  >
                    {/* Row Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-red-600 border-red-900/30 rounded focus:ring-red-500"
                        checked={selectedIds.includes(app.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSelection(app.id)
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{app.name}</div>
                      <div className="text-xs text-gray-500">{app.email}</div>
                      <div className="text-xs text-gray-500 font-mono">{app.registerNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{app.department.name}</td>
                    <td className="px-4 py-3 text-gray-300">{app.roleAppliedFor}</td>
                    <td className="px-4 py-3 text-gray-500">{app.yearOfStudy}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} size="sm" /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {app.assignedRecruiter?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    {/* View Button - stops row click propagation */}
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); onRowClick?.(app); }}
                        className="text-red-500 hover:text-red-400 text-sm font-mono"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-red-900/30 rounded text-gray-300 hover:bg-red-900/20 disabled:opacity-50"
                >
                  Prev
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-red-900/30 rounded text-gray-300 hover:bg-red-900/20 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}