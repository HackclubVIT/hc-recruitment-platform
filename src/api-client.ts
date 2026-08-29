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

// Legacy interface for backward compatibility with existing dashboard code
export interface BackendApplication {
  id: number | string;
  recruitmentId?: string;
  name: string;
  registerNumber: string;
  email: string;
  phoneNumber?: string;
  domain?: string;
  firstPreference?: string;
  secondPreference?: string;
  firstPrefReason?: string;
  secondPrefReason?: string;
  yearOfStudy?: string;
  technicalSkills?: string[] | string;
  skillLevel?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  sevenDaysBuild?: string;
  skillToLearn?: string;
  whyHackclub?: string;
  expectations?: string;
  productiveWebsiteQuestions?: string;
  threeDaysProjectTradeoffs?: string;
  anythingElse?: string;
  whyJoin?: string;
  projectDetails?: string;
  status: string;
  appliedDate?: string;
}

// Token management functions
export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('hc_recruitment_token', token);
  } else {
    localStorage.removeItem('hc_recruitment_token');
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('hc_recruitment_token') || localStorage.getItem('hc_session_token');
  }
  return null;
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hc_recruitment_token');
  }
}

// API base URL configuration
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

if (!API_BASE) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_API_URL must be defined in production.");
  }
  console.warn("NEXT_PUBLIC_API_URL is not defined! API calls will fail.");
}

// Generic fetch function that handles authentication
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const text = await response.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Server returned an invalid response format.');
    }
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error((data.error as string | undefined) || 'You do not have permission to access recruitment management.');
    }
    throw new Error((data.error as string | undefined) || `Request failed with status ${response.status}`);
  }

  return data as T;
}

// Centralized API client with typed methods
export const api = {
  // Authentication
  async login(email: string, password: string, role = 'admin'): Promise<{ token: string }> {
    const data = await apiFetch<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  async getMe() {
    return apiFetch('/auth/me');
  },

  async logout() {
    await apiFetch('/auth/logout', { method: 'POST' });
    clearToken();
  },

  // Users
  async getUsers() {
    return apiFetch('/users');
  },

  // Recruitment Applications (Legacy - for dashboard compatibility)
  async getRecruitmentApplications(): Promise<BackendApplication[]> {
    return apiFetch<BackendApplication[]>('/recruitment/applications');
  },

  async getRecruitmentStats() {
    return apiFetch('/recruitment/stats');
  },

  async updateRecruitmentStatus(id: number | string, status: string) {
    return apiFetch(`/recruitment/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async batchUpdateRecruitmentStatus(ids: (number | string)[], status: string) {
    return apiFetch('/recruitment/applications/batch-status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    });
  },

  async deleteRecruitmentApplication(id: number | string) {
    return apiFetch(`/recruitment/applications/${id}`, {
      method: 'DELETE',
    });
  },

  // New API endpoints from upstream
  async getApplications() {
    return apiFetch<RecruitmentApplication[]>('/api/applications');
  },

  async getCandidates(query: string = "") {
    return apiFetch(`/api/candidates${query}`);
  },

  // Forms
  async getForms() {
    return apiFetch('/api/forms');
  },

  // Panels
  async getPanels() {
    return apiFetch('/api/panels');
  },

  // Interviews
  async getInterviews() {
    return apiFetch('/api/interviews');
  },

  // Feedback
  async getFeedback() {
    return apiFetch('/api/feedback');
  },

  // Notifications
  async getNotifications() {
    return apiFetch('/api/notifications');
  },

  // Analytics
  async getAnalytics() {
    return apiFetch('/api/analytics');
  },

  // Audit Logs
  async getAuditLogs() {
    return apiFetch('/api/audit-logs');
  },

  // Generic HTTP methods for flexibility
  get: async (path: string) => {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res;
  },

  post: async (path: string, body: unknown) => {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return res;
  },

  put: async (path: string, body: unknown) => {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return res;
  },

  delete: async (path: string) => {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res;
  },
};
