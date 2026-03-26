import type {
  AnalyticsData,
  CodingProblem,
  CodingSubmissionResult,
  DashboardData,
  Difficulty,
  MCQQuestion,
  PracticeMode,
  User,
} from "../types";

async function request<T>(url: string, init?: RequestInit, authenticated = false): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (authenticated) {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, { ...init, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data as T;
}

export const authApi = {
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload: { name: string; email: string; phone: string; password: string }) =>
    request<{ message: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request<{ user: User }>("/api/auth/me", undefined, true),
};

export const practiceApi = {
  generateMCQ: (payload: { category: string; topic: string; difficulty: Difficulty; mode: PracticeMode }) =>
    request<MCQQuestion[]>("/api/practice/mcq", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  saveTest: (payload: unknown) =>
    request<{ success: boolean }>("/api/test/save", {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
};

export const analyticsApi = {
  dashboard: () => request<DashboardData>("/api/analytics/dashboard", undefined, true),
  full: () => request<AnalyticsData>("/api/analytics/user", undefined, true),
};

export const codingApi = {
  generateProblem: (difficulty: Difficulty) =>
    request<CodingProblem>("/api/code/problem", {
      method: "POST",
      body: JSON.stringify({ difficulty }),
    }, true),
  submit: (payload: { problemId: string; code: string; language: string; solveTime: number }) =>
    request<CodingSubmissionResult>("/api/code/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
};
