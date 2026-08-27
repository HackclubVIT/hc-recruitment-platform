const API_BASE = "/api"

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
        window.location.href = "/login"
      }
    }
    const error = (data as { error?: string }).error || `API Request failed with status ${response.status}`
    throw new Error(error)
  }

  return data
}

export const api = {
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

  async logout() {
    clearToken()
  },

  async getMe() {
    return apiFetch("/auth/me")
  },

  async getApplications(params?: { status?: string; search?: string; roleAppliedFor?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.search) searchParams.set("search", params.search)
    if (params?.roleAppliedFor) searchParams.set("roleAppliedFor", params.roleAppliedFor)
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))
    return apiFetch(`/recruiter/applications?${searchParams.toString()}`)
  },

  async getApplication(id: number) {
    return apiFetch(`/recruiter/applications/${id}`)
  },

  async updateApplicationStatus(id: number, status: string, reason?: string) {
    return apiFetch(`/recruiter/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    })
  },

  async addNote(id: number, body: string) {
    return apiFetch(`/recruiter/applications/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ body }),
    })
  },

  async bulkUpdateStatus(applicationIds: number[], status: string, reason?: string) {
    return apiFetch("/recruiter/applications/bulk-status", {
      method: "POST",
      body: JSON.stringify({ applicationIds, status, reason }),
    })
  },

  async getLeadDashboard() {
    return apiFetch("/lead/dashboard")
  },

  async getLeadRecruiters() {
    return apiFetch("/lead/recruiters")
  },

  async getPanelCandidates(startTime?: string, endTime?: string) {
    const params = new URLSearchParams()
    if (startTime) params.set("startTime", startTime)
    if (endTime) params.set("endTime", endTime)
    return apiFetch(`/lead/panel-candidates?${params.toString()}`)
  },

  async getInterviews(params?: { status?: string; applicationId?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.applicationId) searchParams.set("applicationId", String(params.applicationId))
    return apiFetch(`/lead/interviews?${searchParams.toString()}`)
  },

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

  async getFeedback(applicationId: number) {
    return apiFetch(`/lead/applications/${applicationId}/feedback`)
  },

  async makeDecision(applicationId: number, decision: string, reason?: string, override?: boolean) {
    return apiFetch(`/lead/applications/${applicationId}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, reason, override }),
    })
  },

  async getAnalytics() {
    return apiFetch("/lead/analytics")
  },

  async exportApplications() {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`
    const response = await fetch(`${API_BASE}/lead/applications/export`, { headers })
    return response.blob()
  },

  async getNotifications(limit = 50, offset = 0, unreadOnly = false) {
    const params = new URLSearchParams()
    params.set("limit", String(limit))
    params.set("offset", String(offset))
    if (unreadOnly) params.set("unreadOnly", "true")
    return apiFetch(`/notifications?${params.toString()}`)
  },

  async markNotificationRead(id: number) {
    return apiFetch(`/notifications/${id}`, { method: "PATCH" })
  },
}