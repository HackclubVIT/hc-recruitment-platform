export interface BackendApplication {
  id: number | string;
  name?: string;
  email: string;
  status: string;
  firstPreference?: string;
  secondPreference?: string;
  domain?: string;
  registerNumber?: string;
  yearOfStudy?: string;
  appliedDate?: string;
  whyJoin?: string;
  firstPrefReason?: string;
  secondPrefReason?: string;
  phoneNumber?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  sevenDaysBuild?: string;
  projectDetails?: string;
  skillToLearn?: string;
  whyHackclub?: string;
  expectations?: string;
  productiveWebsiteQuestions?: string;
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

export const api = {
  getMe: async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
    if (!res.ok) throw new Error("Not logged in");
    return res.json();
  },
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include"
    });
    if (!res.ok) throw new Error("Invalid credentials");
    return res.json();
  },
  logout: async () => {
    await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
  },
  getRecruitmentApplications: async () => {
    const res = await fetch(`${API_BASE}/api/applications`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch applications");
    const json = await res.json();
    return json.applications;
  },
  updateRecruitmentStatus: async (id: number | string, status: string) => {
    const res = await fetch(`${API_BASE}/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      credentials: "include"
    });
    if (!res.ok) throw new Error("Failed to update status");
    return res.json();
  }
};
