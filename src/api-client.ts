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

export function getToken() {
  return typeof document !== "undefined" ? document.cookie.includes("session=") : false;
}

export function clearToken() {
  // It's handled by POST /api/auth/logout now
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_API_URL must be defined in production.");
  }
  console.warn("NEXT_PUBLIC_API_URL is not defined! API calls will fail.");
}

export const fetchApi = async (path: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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
    return res.json();
  },
  logout: async () => {
    await fetchApi("/api/auth/logout", { method: "POST" });
  },

  // Users
  getUsers: async () => fetchApi("/api/users").then(res => res.json()),
  
  // Applications / Candidates
  getApplications: async () => fetchApi("/api/applications").then(res => res.json()),
  getCandidates: async (query: string = "") => fetchApi(`/api/candidates${query}`).then(res => res.json()),
  
  // Forms
  getForms: async () => fetchApi("/api/forms").then(res => res.json()),
  
  // Panels
  getPanels: async () => fetchApi("/api/panels").then(res => res.json()),
  
  // Interviews
  getInterviews: async () => fetchApi("/api/interviews").then(res => res.json()),
  
  // Feedback
  getFeedback: async () => fetchApi("/api/feedback").then(res => res.json()),
  
  // Notifications
  getNotifications: async () => fetchApi("/api/notifications").then(res => res.json()),
  
  // Analytics
  getAnalytics: async () => fetchApi("/api/analytics").then(res => res.json()),
  
  // Audit Logs
  getAuditLogs: async () => fetchApi("/api/audit-logs").then(res => res.json()),

  // Application notes & history
  getApplicationNotes: async (id: string) => fetchApi(`/api/applications/${id}/notes`).then(res => res.json()),
  createApplicationNote: async (id: string, content: string) =>
    fetchApi(`/api/applications/${id}/notes`, { method: "POST", body: JSON.stringify({ content }) }).then(res => res.json()),
  deleteApplicationNote: async (id: string, noteId: number) =>
    fetchApi(`/api/applications/${id}/notes/${noteId}`, { method: "DELETE" }).then(res => res.json()),
  getApplicationHistory: async (id: string) => fetchApi(`/api/applications/${id}/history`).then(res => res.json()),

  // Bulk status update
  bulkUpdateApplications: async (ids: string[], status: string) =>
    fetchApi(`/api/applications/bulk`, { method: "POST", body: JSON.stringify({ ids, status }) }).then(res => res.json()),
};
