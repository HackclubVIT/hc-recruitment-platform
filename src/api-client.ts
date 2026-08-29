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
  technicalSkills: any;
  skillLevel: string | null;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  status: string;
  appliedDate: string | null;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
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
  getRecruitmentApplications: async () => {
    const res = await fetchApi("/api/applications");
    if (!res.ok) throw new Error("Failed to fetch applications");
    const json = await res.json();
    return {
      items: json.items,
      page: json.page,
      limit: json.limit,
      total: json.total,
      totalPages: json.totalPages
    };
  },
  updateRecruitmentStatus: async (id: number | string, status: string) => {
    const res = await fetchApi(`/api/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update status");
    return res.json();
  }
};
