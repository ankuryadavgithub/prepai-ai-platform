import type {
  AnalyticsData,
  CodingProblem,
  CodingSubmissionResult,
  DashboardData,
  Difficulty,
  InterviewSession,
  InterviewSetup,
  MCQQuestion,
  MockMode,
  MockSession,
  MockTrack,
  PracticeMode,
  User,
} from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function buildUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

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
    if (response.status === 401 && authenticated) {
      localStorage.removeItem("token");
    }
    throw new Error(data.error || "Request failed");
  }

  return data as T;
}

export const authApi = {
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User }>(buildUrl("/api/auth/login"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload: { name: string; email: string; phone: string; password: string }) =>
    request<{ message: string; user: User }>(buildUrl("/api/auth/register"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request<{ user: User }>(buildUrl("/api/auth/me"), undefined, true),
};

export const practiceApi = {
  generateMCQ: (payload: { category: string; topic: string; difficulty: Difficulty; mode: PracticeMode }) =>
    request<MCQQuestion[]>(buildUrl("/api/practice/mcq"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  saveTest: (payload: unknown) =>
    request<{ success: boolean }>(buildUrl("/api/test/save"), {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
};

export const analyticsApi = {
  dashboard: () => request<DashboardData>(buildUrl("/api/analytics/dashboard"), undefined, true),
  full: () => request<AnalyticsData>(buildUrl("/api/analytics/user"), undefined, true),
};

export const codingApi = {
  generateProblem: (difficulty: Difficulty) =>
    request<CodingProblem>(buildUrl("/api/code/problem"), {
      method: "POST",
      body: JSON.stringify({ difficulty }),
    }, true),
  submit: (payload: { problemId: string; code: string; language: string; solveTime: number }) =>
    request<CodingSubmissionResult>(buildUrl("/api/code/submit"), {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
};

export const mockApi = {
  tracks: () => request<MockTrack[]>(buildUrl("/api/mock/tracks"), undefined, true),
  active: () => request<{ session: MockSession | null }>(buildUrl("/api/mock/sessions/active"), undefined, true),
  history: () => request<{ sessions: MockSession[] }>(buildUrl("/api/mock/sessions/history"), undefined, true),
  start: (payload: { trackId: string; mode: MockMode }) =>
    request<{ session: MockSession }>(buildUrl("/api/mock/sessions/start"), {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
  completeRound: (sessionId: number, roundKey: string, payload: { score: number; maxScore?: number; accuracy?: number; summary?: string }) =>
    request<{ session: MockSession }>(buildUrl(`/api/mock/sessions/${sessionId}/rounds/${roundKey}/complete`), {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
};

export const interviewApi = {
  active: () => request<{ session: InterviewSession | null }>(buildUrl("/api/interview/sessions/active"), undefined, true),
  history: () => request<{ sessions: InterviewSession[] }>(buildUrl("/api/interview/sessions/history"), undefined, true),
  start: (payload: InterviewSetup) =>
    request<{ session: InterviewSession }>(buildUrl("/api/interview/sessions/start"), {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
  answer: (sessionId: number, payload: { answer: string; responseTime: number }) =>
    request<{ session: InterviewSession; completed: boolean; answerFeedback: string }>(buildUrl(`/api/interview/sessions/${sessionId}/answer`), {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
  finish: (sessionId: number) =>
    request<{ session: InterviewSession }>(buildUrl(`/api/interview/sessions/${sessionId}/finish`), {
      method: "POST",
    }, true),
};
