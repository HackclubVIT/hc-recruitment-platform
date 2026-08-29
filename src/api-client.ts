export interface BackendCandidate {
  id: string;
  name: string;
  email: string;
  department: string;
  registration_number: string;
}

export interface BackendApplication {
  id: string;
  candidate_id: string;
  form_id: number;
  status: string;
  submitted_at: string;
  candidate: BackendCandidate;
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
  round: number;
  date: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
  status: string;
  application?: BackendApplication;
  candidate?: BackendCandidate;
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
