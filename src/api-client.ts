export interface RecruitmentApplication {
  id: string;
  recruitmentId: string;
  name: string;
  registerNumber: string;
  email: string;
  phoneNumber: string | null;
  domain: string | null;
  firstPreference: string | null;
  secondPreference: string | null;
  firstPrefReason: string | null;
  secondPrefReason: string | null;
  yearOfStudy: string;
  technicalSkills: string[] | null;
  skillLevel: string | null;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  status: string;
  appliedDate: string | null;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  formSubmission?: {
    answers: Array<{ question_id: number; answer: string }>;
  };
  interviews?: BackendInterview[];
}

export interface HCUser {
  id: string;
  name: string;
  email: string;
  registerNumber: string | null;
  hcDepartment: string | null;
  status: string;
  role: "ADMIN" | "RECRUITER" | "PANEL_MEMBER" | "NONE";
  departments: string[];
  active: boolean;
}

export interface BackendInterview {
  id: number;
  application_id: string;
  panel_id: number;
  recruiter_id: string | null;
  round: number;
  date: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
  status: string;
  application?: RecruitmentApplication;
  feedback?: Array<{
    id: number;
    feedback: string;
    user_id: string;
    overall_score: number;
    recommendation: string;
    comments: string;
  }>;
}

export interface AuditLogEntry {
  id: number;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  timestamp: string;
  user?: {
    name: string;
    email: string | null;
    role: string;
  } | null;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  logs?: AuditLogEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hc_session_token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("hc_session_token", token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("hc_session_token");
  }
}

const rawBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_BASE = rawBase.replace(/\/api\/?$/, "").replace(/\/$/, "");
if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== "undefined") {
  console.warn("NEXT_PUBLIC_API_URL is not defined! Defaulting to http://localhost:3001.");
}

export const fetchApi = async (path: string, options: RequestInit = {}) => {
  const base = API_BASE.replace(/\/$/, "");
  let cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!cleanPath.startsWith("/api/") && cleanPath !== "/api") {
    cleanPath = `/api${cleanPath}`;
  }
  const url = `${base}${cleanPath}`;
  
  const token = typeof window !== "undefined" ? localStorage.getItem("hc_session_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
  return res;
};

export const api = {
  get: async (path: string) => fetchApi(path),
  post: async (path: string, body: unknown) => fetchApi(path, { method: "POST", body: JSON.stringify(body) }),
  put: async (path: string, body: unknown) => fetchApi(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: async (path: string) => fetchApi(path, { method: "DELETE" }),

  getMe: async () => {
    const res = await fetchApi("/api/auth/me");
    if (!res.ok) throw new Error("Not logged in");
    return res.json();
  },
  login: async (email: string, password: string) => {
    const res = await fetchApi("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const json = await res.json();
    if (json.token) {
      setToken(json.token);
    }
    return json;
  },
  logout: async () => {
    try {
      await fetchApi("/api/auth/logout", { method: "POST" });
    } finally {
      clearToken();
    }
  },

  // Users
  getUsers: async () => fetchApi("/api/users").then(res => res.json()),
  createUser: async (userData: unknown) => fetchApi("/api/users", { method: "POST", body: JSON.stringify(userData) }),
  updateUser: async (userData: unknown) => fetchApi("/api/users", { method: "PUT", body: JSON.stringify(userData) }),
  deleteUser: async (id: string) => fetchApi("/api/users", { method: "DELETE", body: JSON.stringify({ id }) }),
  
  // Applications / Candidates
  getApplications: async () => fetchApi("/api/applications").then(res => res.json()),
  getCandidates: async (query: string = "") => fetchApi(`/api/candidates${query}`).then(res => res.json()),
  
  // Forms
  getForms: async () => fetchApi("/api/forms").then(res => res.json()),
  getPublishedForms: async () => fetchApi("/api/forms/published").then(res => res.json()),
  
  // Panels
  getPanels: async () => fetchApi("/api/panels").then(res => res.json()),
  
  // Interviews
  getInterviews: async () => fetchApi("/api/interviews").then(res => res.json()),
  
  // Notifications
  getNotifications: async () => fetchApi("/api/notifications").then(res => res.json()),
  
  // Analytics
  getAnalytics: async () => fetchApi("/api/analytics").then(res => res.json()),
  
  // Audit Logs
  getAuditLogs: async (params?: { page?: number; limit?: number; q?: string; action?: string; entity?: string }): Promise<AuditLogResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.q) query.set("q", params.q);
    if (params?.action) query.set("action", params.action);
    if (params?.entity) query.set("entity", params.entity);
    const qs = query.toString();
    return fetchApi(`/api/audit-logs${qs ? `?${qs}` : ""}`).then(res => res.json());
  },
};
