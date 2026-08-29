const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

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

export const api = {
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
  }
};
