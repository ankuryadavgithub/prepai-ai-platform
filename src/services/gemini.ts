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

export const mockApi = {
  tracks: () => request<MockTrack[]>("/api/mock/tracks", undefined, true),
  active: () => request<{ session: MockSession | null }>("/api/mock/sessions/active", undefined, true),
  history: () => request<{ sessions: MockSession[] }>("/api/mock/sessions/history", undefined, true),
  start: (payload: { trackId: string; mode: MockMode }) =>
    request<{ session: MockSession }>("/api/mock/sessions/start", {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
  completeRound: (sessionId: number, roundKey: string, payload: { score: number; maxScore?: number; accuracy?: number; summary?: string }) =>
    request<{ session: MockSession }>(`/api/mock/sessions/${sessionId}/rounds/${roundKey}/complete`, {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
};

export const interviewApi = {
  active: () => request<{ session: InterviewSession | null }>("/api/interview/sessions/active", undefined, true),
  history: () => request<{ sessions: InterviewSession[] }>("/api/interview/sessions/history", undefined, true),
  start: (payload: InterviewSetup) =>
    request<{ session: InterviewSession }>("/api/interview/sessions/start", {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
  answer: (sessionId: number, payload: { answer: string; responseTime: number }) =>
    request<{ session: InterviewSession; completed: boolean; answerFeedback: string }>(`/api/interview/sessions/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify(payload),
    }, true),
  finish: (sessionId: number) =>
    request<{ session: InterviewSession }>(`/api/interview/sessions/${sessionId}/finish`, {
      method: "POST",
    }, true),
};
