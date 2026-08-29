const API_BASE = "/api"

/**
 * Client-side API module
 * Handles token management (localStorage + memory cache) and authenticated fetch wrapper
 * All API calls go through apiFetch which attaches Bearer token and handles auth errors
 */

let cachedToken: string | null = null

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem("hc_session_token", token)
    cachedToken = token
  } else {
    localStorage.removeItem("hc_session_token")
    cachedToken = null
  }
}

export function getToken(): string | null {
  if (cachedToken) return cachedToken
  if (typeof window !== "undefined") {
    cachedToken = localStorage.getItem("hc_session_token")
    return cachedToken
  }
  return null
}

export function clearToken() {
  localStorage.removeItem("hc_session_token")
  cachedToken = null
}

/**
 * apiFetch - Core fetch wrapper with auth header and error handling
 * Automatically attaches Bearer token from localStorage
 * Handles 401/403 by clearing token and redirecting to login
 * 
 * @param endpoint - API endpoint (e.g., "/recruiter/applications")
 * @param options - Fetch options (method, body, headers)
 * @returns Parsed JSON response
 * @throws Error with message from API or status text
 * 
 * INTEGRATION: All client-side API calls go through this
 * TODO: [INTEGRATION] Add request/response interceptors for logging/analytics
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  const text = await response.text()
  let data: unknown = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error("Server returned an invalid response format.")
    }
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearToken()
      if (typeof window !== "undefined") {
        window.location.replace("/login")
      }
    }
    const error = (data as { error?: string }).error || `API Request failed with status ${response.status}`
    throw new Error(error)
  }

  return data
}

export const api = {
  /**
   * login - Authenticates user via main site API proxy
   * Sets token in localStorage and httpOnly cookie
   */
  async login(email: string, password: string) {
    // Use local proxy route to avoid CORS issues
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Login failed")
    setToken(data.token)
    return data
  },

  /** logout - Clears local token and server-side session cookie */
  async logout() {
    await apiFetch("/auth/logout", { method: "POST" })
    clearToken()
  },

  /** getMe - Fetches current user profile from /api/auth/me */
  async getMe() {
    return apiFetch("/auth/me")
  },

  /**
   * getApplications - Fetches paginated, filtered application list
   * Supports: status, search, roleAppliedFor, page, limit
   * API: GET /api/recruiter/applications
   */
  async getApplications(params?: { status?: string; search?: string; roleAppliedFor?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.search) searchParams.set("search", params.search)
    if (params?.roleAppliedFor) searchParams.set("roleAppliedFor", params.roleAppliedFor)
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))
    return apiFetch(`/recruiter/applications?${searchParams.toString()}`)
  },

  async getLeadApplications(params?: { status?: string; search?: string; roleAppliedFor?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.search) searchParams.set("search", params.search)
    if (params?.roleAppliedFor) searchParams.set("roleAppliedFor", params.roleAppliedFor)
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))
    return apiFetch(`/lead/applications?${searchParams.toString()}`)
  },

  /** getApplication - Fetches full application detail with nested relations */
  async getApplication(id: number) {
    return apiFetch(`/recruiter/applications/${id}`)
  },

  async getLeadApplication(id: number) {
    return apiFetch(`/lead/applications/${id}`)
  },

  /** updateApplicationStatus - Changes application status */
  async updateApplicationStatus(id: number, status: string, reason?: string) {
    return apiFetch(`/recruiter/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    })
  },

  async updateLeadApplicationStatus(id: number, status: string, reason?: string) {
    return apiFetch(`/lead/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    })
  },

  /** addNote - Adds internal note to application */
  async addNote(id: number, body: string) {
    return apiFetch(`/recruiter/applications/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ body }),
    })
  },

  /** bulkUpdateStatus - Updates status for multiple applications */
  async bulkUpdateStatus(applicationIds: number[], status: string, reason?: string) {
    return apiFetch("/recruiter/applications/bulk-status", {
      method: "POST",
      body: JSON.stringify({ applicationIds, status, reason }),
    })
  },

  async bulkUpdateLeadStatus(applicationIds: number[], status: string, reason?: string) {
    return apiFetch("/lead/applications/bulk-status", {
      method: "POST",
      body: JSON.stringify({ applicationIds, status, reason }),
    })
  },

  /** getLeadDashboard - Fetches lead dashboard stats */
  async getLeadDashboard() {
    return apiFetch("/lead/dashboard")
  },

  /** getLeadRecruiters - Fetches recruiters in lead's department */
  async getLeadRecruiters() {
    return apiFetch("/lead/recruiters")
  },

  /** getPanelCandidates - Fetches candidates for panelist scheduling */
  async getPanelCandidates(startTime?: string, endTime?: string) {
    const params = new URLSearchParams()
    if (startTime) params.set("startTime", startTime)
    if (endTime) params.set("endTime", endTime)
    return apiFetch(`/lead/panel-candidates?${params.toString()}`)
  },

  /** getInterviews - Fetches interviews with filters */
  async getInterviews(params?: { status?: string; applicationId?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.applicationId) searchParams.set("applicationId", String(params.applicationId))
    return apiFetch(`/lead/interviews?${searchParams.toString()}`)
  },

  /** createInterview - Schedules a new interview */
  async createInterview(data: {
    applicationId: number
    panelistUserIds: number[]
    startTime: string
    endTime: string
    mode: "ONLINE" | "OFFLINE"
    locationOrLink: string
  }) {
    return apiFetch("/lead/interviews", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /** updateInterview - Reschedules, cancels, or completes an interview */
  async updateInterview(id: number, data: {
    action?: "reschedule" | "cancel" | "complete"
    startTime?: string
    endTime?: string
    mode?: "ONLINE" | "OFFLINE"
    locationOrLink?: string
    panelistUserIds?: number[]
    status?: string
  }) {
    return apiFetch(`/lead/interviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  /** getFeedback - Fetches feedback summary for an application */
  async getFeedback(applicationId: number) {
    return apiFetch(`/lead/applications/${applicationId}/feedback`)
  },

  /** makeDecision - Records final hiring decision */
  async makeDecision(applicationId: number, decision: string, reason?: string, override?: boolean) {
    return apiFetch(`/lead/applications/${applicationId}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, reason, override }),
    })
  },

  /** getAnalytics - Fetches analytics data for lead dashboard */
  async getAnalytics() {
    return apiFetch("/lead/analytics")
  },

  /** exportApplications - Downloads applications as CSV blob */
  async exportApplications() {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`
    const response = await fetch(`${API_BASE}/lead/applications/export`, { headers })
    return response.blob()
  },

  /** getNotifications - Fetches user notifications */
  async getNotifications(limit = 50, offset = 0, unreadOnly = false) {
    const params = new URLSearchParams()
    params.set("limit", String(limit))
    params.set("offset", String(offset))
    if (unreadOnly) params.set("unreadOnly", "true")
    return apiFetch(`/notifications?${params.toString()}`)
  },

  /** markNotificationRead - Marks a notification as read */
  async markNotificationRead(id: number) {
    return apiFetch(`/notifications/${id}`, { method: "PATCH" })
  },
}