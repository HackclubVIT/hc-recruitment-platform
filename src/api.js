const RAW_API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

const TOKEN_KEYS = ['hc_session_token', 'token', 'jwt', 'session_token', 'authToken'];

export function setToken(token) {
  if (typeof window === 'undefined') return;
  TOKEN_KEYS.forEach(key => {
    try {
      if (token) {
        localStorage.setItem(key, token);
        sessionStorage.setItem(key, token);
      } else {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`Storage access warning for ${key}:`, e.message);
    }
  });
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    for (const key of TOKEN_KEYS) {
      const val = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (val && typeof val === 'string' && val.trim() !== '') {
        return val.trim();
      }
    }
  } catch (e) {
    console.warn('Failed to access storage for getToken:', e);
  }
  return null;
}

export function clearToken() {
  setToken(null);
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${formattedEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error('Server returned an invalid response format.', { cause: err });
    }
  }

  if (!response.ok) {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error('Backend server is temporarily connecting or offline. Please make sure the backend server is running on port 5000.');
    }
    throw new Error(data.error || `API Request failed with status ${response.status}`);
  }

  return data;
}

// Client API Layer Callers
export const api = {
  // Authentication
  async login(email, password, role) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    setToken(data.token);
    return data;
  },

  async signup(name, email, password, registerNumber, department) {
    return apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, registerNumber, department }),
    });
  },

  // Forgot password — requests a 6-digit reset code sent to email
  async forgotPassword(email) {
    return apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify reset code — validates the 6-digit code
  async verifyResetCode(resetCode) {
    return apiFetch('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ resetCode }),
    });
  },

  // Reset password — submits the new password with the 6-digit reset code
  async resetPassword(resetCode, newPassword) {
    return apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetCode, newPassword }),
    });
  },

  async getMe() {
    return apiFetch('/auth/me');
  },

  // Global Sync
  async getData() {
    return apiFetch('/data');
  },

  // Public Leaderboard (No auth required)
  async getPublicLeaderboard() {
    return apiFetch('/public/leaderboard');
  },

  // Projects
  async submitProject(projectData) {
    return apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  async rateProject(projectId, rating, comment) {
    return apiFetch(`/projects/${projectId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  },

  async getProjectLeaderboard() {
    return apiFetch('/projects/leaderboard');
  },

  // Uploads
  async updateUploadStatus(uploadId, status) {
    return apiFetch(`/uploads/${uploadId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Announcements
  async createAnnouncement(announcementData) {
    return apiFetch('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    });
  },

  // User Administration
  async updateUser(userId, userData) {
    return apiFetch(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(userId) {
    return apiFetch(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Feedback & Bug Reports
  async submitFeedback(feedbackData) {
    return apiFetch('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  },

  // Leaderboard Actions
  async refreshLeaderboard() {
    return apiFetch('/leaderboard/refresh', {
      method: 'POST',
    });
  },

  async publishWinners(winnersData) {
    return apiFetch('/leaderboard/winners', {
      method: 'POST',
      body: JSON.stringify(winnersData),
    });
  },

  // Recruitment
  async submitRecruitmentApplication(applicationData) {
    return apiFetch('/recruitment/apply', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  async getRecruitmentApplications() {
    return apiFetch('/recruitment/applications');
  },

  async updateRecruitmentApplicationStatus(applicationId, status, department) {
    return apiFetch(`/recruitment/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, department }),
    });
  },

  async deleteRecruitmentApplication(applicationId) {
    return apiFetch(`/recruitment/applications/${applicationId}`, {
      method: 'DELETE',
    });
  },

  async clearAllRecruitmentApplications() {
    return apiFetch('/recruitment/applications/all', {
      method: 'DELETE',
    });
  },

  // Recruitment — Interviews
  async getRecruitmentInterviews() {
    return apiFetch('/recruitment/interviews');
  },

  async scheduleRecruitmentInterview(data) {
    return apiFetch('/recruitment/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRecruitmentInterview(id, data) {
    return apiFetch(`/recruitment/interviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async cancelRecruitmentInterview(id) {
    return apiFetch(`/recruitment/interviews/${id}`, {
      method: 'DELETE',
    });
  },

  // Recruitment — Panels
  async getRecruitmentPanels() {
    return apiFetch('/recruitment/panels');
  },

  // Signup Allowlist (Admin)
  async getAllowlist() {
    return apiFetch('/allowlist');
  },

  async addAllowedEmail(email) {
    return apiFetch('/allowlist', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async removeAllowedEmail(id) {
    return apiFetch(`/allowlist/${id}`, {
      method: 'DELETE',
    });
  },
};
