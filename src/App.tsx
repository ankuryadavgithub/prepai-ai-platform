import { useEffect, useRef, useState } from "react";
import Auth from "./Auth";
import AnalyticsView from "./components/AnalyticsView";
import CodingView from "./components/CodingView";
import DashboardView from "./components/DashboardView";
import InterviewView from "./components/InterviewView";
import MockView from "./components/MockView";
import PracticeView from "./components/PracticeView";
import ProfileView from "./components/ProfileView";
import { analyticsApi, authApi, codingApi, interviewApi, mockApi, practiceApi } from "./services/gemini";
import {
  TOPICS,
  type MCQQuestion,
  type AnalyticsData,
  type AppSection,
  type CodingProblem,
  type CodingSubmissionResult,
  type DashboardData,
  type Difficulty,
  type InterviewSession,
  type InterviewSetup,
  type MockMode,
  type MockSession,
  type MockTrack,
  type PracticeConfig,
  type PracticeSection,
  type User,
} from "./types";
import { buildPracticeFeedback } from "./utils/practice";

const defaultPracticeConfig: PracticeConfig = {
  section: "numerical",
  topic: TOPICS.numerical[0],
  difficulty: "Medium",
  mode: "practice",
};

const defaultInterviewSetup: InterviewSetup = {
  interviewType: "HR",
  targetRole: "Software Engineer",
  focusArea: "",
  resumeSummary: "",
  projects: "",
  internships: "",
  achievements: "",
};

const navigationItems: Array<{ id: AppSection; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "mock", label: "Mock Tracks" },
  { id: "practice", label: "Practice" },
  { id: "coding", label: "Coding" },
  { id: "interview", label: "Interview" },
  { id: "analytics", label: "Analytics" },
  { id: "profile", label: "Profile" },
];

function isPracticeSection(value: string): value is PracticeSection {
  return value in TOPICS;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<AppSection>("dashboard");

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [mockTracks, setMockTracks] = useState<MockTrack[]>([]);
  const [activeMockSession, setActiveMockSession] = useState<MockSession | null>(null);
  const [mockHistory, setMockHistory] = useState<MockSession[]>([]);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockError, setMockError] = useState("");
  const [pendingMockRound, setPendingMockRound] = useState<{ sessionId: number; roundKey: string } | null>(null);

  const [practiceConfig, setPracticeConfig] = useState<PracticeConfig>(defaultPracticeConfig);
  const [practiceQuestions, setPracticeQuestions] = useState<MCQQuestion[]>([]);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [questionDurations, setQuestionDurations] = useState<Record<number, number>>({});
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceTimeLeft, setPracticeTimeLeft] = useState<number | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState("");
  const [practiceFeedback, setPracticeFeedback] = useState<ReturnType<typeof buildPracticeFeedback> | null>(null);

  const [codingDifficulty, setCodingDifficulty] = useState<Difficulty>("Medium");
  const [codingPresetLabel, setCodingPresetLabel] = useState("Assessment preset");
  const [codingTimerLabel, setCodingTimerLabel] = useState("35 min");
  const [codingSubmissionCount, setCodingSubmissionCount] = useState(0);
  const [codingLanguage, setCodingLanguage] = useState("javascript");
  const [codingProblem, setCodingProblem] = useState<CodingProblem | null>(null);
  const [codingCode, setCodingCode] = useState("");
  const [codingResult, setCodingResult] = useState<CodingSubmissionResult | null>(null);
  const [codingLoading, setCodingLoading] = useState(false);
  const [codingError, setCodingError] = useState("");
  const [interviewSetup, setInterviewSetup] = useState<InterviewSetup>(defaultInterviewSetup);
  const [activeInterviewSession, setActiveInterviewSession] = useState<InterviewSession | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewSession[]>([]);
  const [interviewDraftAnswer, setInterviewDraftAnswer] = useState("");
  const [interviewAnswerFeedback, setInterviewAnswerFeedback] = useState("");
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState("");

  const questionStartRef = useRef<number | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const codingStartedAtRef = useRef<number | null>(null);
  const interviewTurnStartedAtRef = useRef<number | null>(null);

  async function refreshAnalytics() {
    try {
      setAnalyticsLoading(true);
      const [dashboardData, analyticsData, tracksResponse, activeMockResponse, mockHistoryResponse, activeInterviewResponse, interviewHistoryResponse] = await Promise.all([
        analyticsApi.dashboard(),
        analyticsApi.full(),
        mockApi.tracks(),
        mockApi.active(),
        mockApi.history(),
        interviewApi.active(),
        interviewApi.history(),
      ]);
      setDashboard(dashboardData);
      setAnalytics(analyticsData);
      setMockTracks(tracksResponse);
      setActiveMockSession(activeMockResponse.session);
      setMockHistory(mockHistoryResponse.sessions);
      setActiveInterviewSession(activeInterviewResponse.session);
      setInterviewHistory(interviewHistoryResponse.sessions);
    } catch (err) {
      console.error("Analytics refresh failed", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    async function bootstrapUser() {
      const token = localStorage.getItem("token");
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await authApi.me();
        setUser(response.user);
        await refreshAnalytics();
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    bootstrapUser();
  }, []);

  useEffect(() => {
    if (!practiceQuestions.length || practiceFeedback || practiceConfig.mode !== "timed") {
      return;
    }

    const timer = setInterval(() => {
      setPracticeTimeLeft((current) => {
        if (current === null) return current;
        if (current <= 1) {
          clearInterval(timer);
          void submitPractice();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [practiceQuestions.length, practiceFeedback, practiceConfig.mode]);

  function captureQuestionTime(index: number) {
    if (questionStartRef.current === null) return;

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000));
    setQuestionDurations((current) => ({
      ...current,
      [index]: (current[index] || 0) + elapsedSeconds,
    }));
    questionStartRef.current = Date.now();
  }

  function resetPracticeState(nextConfig = practiceConfig) {
    setPracticeConfig(nextConfig);
    setPracticeQuestions([]);
    setPracticeAnswers({});
    setQuestionDurations({});
    setPracticeIndex(0);
    setPracticeTimeLeft(nextConfig.mode === "timed" ? 600 : null);
    setPracticeError("");
    setPracticeFeedback(null);
    sessionStartedAtRef.current = null;
    questionStartRef.current = null;
  }

  function applyCodingPreset(label: string, difficulty: Difficulty, timeLimit: number) {
    setCodingPresetLabel(label);
    setCodingDifficulty(difficulty);
    setCodingTimerLabel(`${timeLimit} min`);
    setCodingSubmissionCount(0);
    setCodingProblem(null);
    setCodingResult(null);
    setCodingCode("");
  }

  async function startPractice() {
    try {
      setPracticeLoading(true);
      setPracticeError("");
      setPracticeFeedback(null);
      setPracticeQuestions([]);
      setPracticeAnswers({});
      setQuestionDurations({});
      setPracticeIndex(0);
      setPracticeTimeLeft(practiceConfig.mode === "timed" ? 600 : null);

      const questions = await practiceApi.generateMCQ({
        category: practiceConfig.section,
        topic: practiceConfig.topic,
        difficulty: practiceConfig.difficulty,
        mode: practiceConfig.mode,
      });

      setPracticeQuestions(questions);
      sessionStartedAtRef.current = Date.now();
      questionStartRef.current = Date.now();
    } catch (err: any) {
      setPracticeError(err.message || "Failed to generate practice questions.");
    } finally {
      setPracticeLoading(false);
    }
  }

  async function submitPractice() {
    if (!practiceQuestions.length || practiceFeedback) {
      return;
    }

    captureQuestionTime(practiceIndex);

    const totalTime = sessionStartedAtRef.current
      ? Math.max(1, Math.round((Date.now() - sessionStartedAtRef.current) / 1000))
      : 0;

    const answersPayload = practiceQuestions.map((question, index) => ({
      question_index: index,
      topic: practiceConfig.section,
      subtopic: practiceConfig.topic,
      time_spent: questionDurations[index] || 0,
      question: question.question,
      selected: practiceAnswers[index],
      correct: question.correct_answer,
    }));

    const feedback = buildPracticeFeedback(practiceQuestions, answersPayload, totalTime);
    setPracticeFeedback(feedback);

    try {
      await practiceApi.saveTest({
        category: practiceConfig.section,
        topic: practiceConfig.topic,
        difficulty: practiceConfig.difficulty,
        mode: practiceConfig.mode,
        score: feedback.score,
        total: feedback.total,
        accuracy: feedback.accuracy,
        time_taken: totalTime,
        avg_time_per_q: feedback.avgTimePerQ,
        correct_answers: feedback.correct,
        wrong_answers: feedback.wrong,
        skipped: feedback.skipped,
        answers: answersPayload,
      });

      if (pendingMockRound && activeMockSession) {
        const round = activeMockSession.rounds.find((item) => item.roundKey === pendingMockRound.roundKey);
        if (round?.roundType === "aptitude" && activeMockSession.id === pendingMockRound.sessionId) {
          const sessionResponse = await mockApi.completeRound(activeMockSession.id, round.roundKey, {
            score: feedback.score,
            maxScore: feedback.total,
            accuracy: feedback.accuracy,
            summary: `${round.roundLabel}: ${feedback.score}/${feedback.total} with ${Math.round(feedback.accuracy * 100)}% accuracy.`,
          });
          setActiveMockSession(sessionResponse.session);
          setPendingMockRound(null);
        }
      }

      await refreshAnalytics();
    } catch (err) {
      console.error("Failed to save test", err);
    }
  }

  function navigatePractice(direction: "prev" | "next") {
    captureQuestionTime(practiceIndex);
    setPracticeIndex((current) =>
      direction === "prev" ? Math.max(current - 1, 0) : Math.min(current + 1, practiceQuestions.length - 1)
    );
  }

  async function startRecommendedPractice() {
    if (!dashboard?.recommendation) return;

    const recommendation = dashboard.recommendation;
    const section = isPracticeSection(recommendation.section) ? recommendation.section : "numerical";
    const topic = recommendation.topic && TOPICS[section].includes(recommendation.topic as any)
      ? recommendation.topic
      : TOPICS[section][0];

    const nextConfig: PracticeConfig = {
      section,
      topic,
      difficulty: recommendation.difficulty,
      mode: recommendation.mode,
    };

    resetPracticeState(nextConfig);
    setActiveSection("practice");
  }

  async function generateCodingProblem() {
    try {
      setCodingLoading(true);
      setCodingError("");
      setCodingResult(null);
      const problem = await codingApi.generateProblem(codingDifficulty);
      setCodingProblem(problem);
      const initialLanguage = problem.supportedLanguages.includes(codingLanguage)
        ? codingLanguage
        : problem.supportedLanguages[0];
      setCodingLanguage(initialLanguage);
      setCodingCode(problem.starterCode[initialLanguage] || "");
      codingStartedAtRef.current = Date.now();
      setCodingSubmissionCount(0);
    } catch (err: any) {
      setCodingError(err.message || "Failed to generate coding problem.");
    } finally {
      setCodingLoading(false);
    }
  }

  async function submitCoding() {
    if (!codingProblem) return;

    try {
      setCodingLoading(true);
      setCodingError("");
      const solveTime = codingStartedAtRef.current
        ? Math.max(1, Math.round((Date.now() - codingStartedAtRef.current) / 1000))
        : 0;
      const result = await codingApi.submit({
        problemId: codingProblem.id,
        code: codingCode,
        language: codingLanguage,
        solveTime,
      });
      setCodingResult(result);
      setCodingSubmissionCount((current) => current + 1);

      if (pendingMockRound && activeMockSession) {
        const round = activeMockSession.rounds.find((item) => item.roundKey === pendingMockRound.roundKey);
        if (round?.roundType === "coding" && activeMockSession.id === pendingMockRound.sessionId) {
          const totalCases = result.summary.totalVisible + result.summary.totalHidden;
          const passedCases = result.summary.passedVisible + result.summary.passedHidden;
          const accuracy = totalCases ? passedCases / totalCases : 0;
          const sessionResponse = await mockApi.completeRound(activeMockSession.id, round.roundKey, {
            score: passedCases,
            maxScore: totalCases,
            accuracy,
            summary: `${round.roundLabel}: passed ${passedCases}/${totalCases} evaluation cases.`,
          });
          setActiveMockSession(sessionResponse.session);
          setPendingMockRound(null);
        }
      }

      await refreshAnalytics();
    } catch (err: any) {
      setCodingError(err.message || "Failed to evaluate code.");
    } finally {
      setCodingLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    setDashboard(null);
    setAnalytics(null);
    resetPracticeState(defaultPracticeConfig);
    setCodingProblem(null);
    setCodingResult(null);
    setActiveMockSession(null);
    setMockHistory([]);
    setActiveInterviewSession(null);
    setInterviewHistory([]);
  }

  async function startMockSession(trackId: string, mode: MockMode) {
    try {
      setMockLoading(true);
      setMockError("");
      const response = await mockApi.start({ trackId, mode });
      setActiveMockSession(response.session);
      setActiveSection("mock");
      await refreshAnalytics();
    } catch (err: any) {
      setMockError(err.message || "Failed to start mock session.");
    } finally {
      setMockLoading(false);
    }
  }

  function launchMockRound(session: MockSession, roundKey: string) {
    const round = session.rounds.find((item) => item.roundKey === roundKey);
    if (!round) return;

    setPendingMockRound({ sessionId: session.id, roundKey });
    if (round.roundType === "coding") {
      applyCodingPreset(round.roundLabel, round.difficulty, round.timeLimit);
      setActiveSection("coding");
      return;
    }

    const section = isPracticeSection(round.section || "") ? round.section : "numerical";
    resetPracticeState({
      section,
      topic: round.topic || TOPICS[section][0],
      difficulty: round.difficulty,
      mode: "timed",
    });
    setActiveSection("practice");
  }

  async function startInterviewSession() {
    try {
      setInterviewLoading(true);
      setInterviewError("");
      setInterviewAnswerFeedback("");
      const response = await interviewApi.start(interviewSetup);
      setActiveInterviewSession(response.session);
      setInterviewDraftAnswer("");
      interviewTurnStartedAtRef.current = Date.now();
      await refreshAnalytics();
    } catch (err: any) {
      setInterviewError(err.message || "Failed to start interview session.");
    } finally {
      setInterviewLoading(false);
    }
  }

  async function submitInterviewAnswer() {
    if (!activeInterviewSession || !interviewDraftAnswer.trim()) return;

    try {
      setInterviewLoading(true);
      setInterviewError("");
      const responseTime = interviewTurnStartedAtRef.current
        ? Math.max(1, Math.round((Date.now() - interviewTurnStartedAtRef.current) / 1000))
        : 0;
      const response = await interviewApi.answer(activeInterviewSession.id, {
        answer: interviewDraftAnswer,
        responseTime,
      });
      setInterviewAnswerFeedback(response.answerFeedback);
      setInterviewDraftAnswer("");

      if (response.completed) {
        const finished = await interviewApi.finish(activeInterviewSession.id);
        setActiveInterviewSession(finished.session);
      } else {
        setActiveInterviewSession(response.session);
      }

      interviewTurnStartedAtRef.current = Date.now();
      await refreshAnalytics();
    } catch (err: any) {
      setInterviewError(err.message || "Failed to submit interview answer.");
    } finally {
      setInterviewLoading(false);
    }
  }

  async function finishInterview() {
    if (!activeInterviewSession) return;
    try {
      setInterviewLoading(true);
      const response = await interviewApi.finish(activeInterviewSession.id);
      setActiveInterviewSession(response.session);
      await refreshAnalytics();
    } catch (err: any) {
      setInterviewError(err.message || "Failed to finish interview session.");
    } finally {
      setInterviewLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-300">
            Loading Prep AI...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#16301f,transparent_28%),radial-gradient(circle_at_top_right,#4a3412,transparent_24%),#020617] px-6 py-10 text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center">
          <Auth
            setUser={async (nextUser) => {
              setUser(nextUser);
              await refreshAnalytics();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_20%),#020617] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(16,185,129,0.2),rgba(251,191,36,0.08))] p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">Prep AI</p>
            <h1 className="mt-3 font-['Space_Grotesk'] text-3xl font-bold text-white">Placement cockpit</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Adaptive mock tracks, interview simulation, and readiness signals for fresher placement prep.
            </p>
          </div>

          <div className="mt-6 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeSection === item.id
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-white/8 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in</p>
            <p className="mt-2 text-lg font-medium text-white">{user.name}</p>
            <p className="mt-1 text-sm text-slate-400">{user.email}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-400/20"
          >
            Logout
          </button>
        </aside>

        <main className="rounded-[36px] border border-white/10 bg-slate-950/55 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl lg:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Prep AI workspace</p>
              <h2 className="mt-2 font-['Space_Grotesk'] text-3xl font-bold text-white">
                {navigationItems.find((item) => item.id === activeSection)?.label}
              </h2>
            </div>
            {dashboard?.recommendation && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Next: <span className="font-semibold text-white">{dashboard.nextRecommendedTrack.label}</span>
              </div>
            )}
          </div>

          {activeSection === "dashboard" && (
            <DashboardView data={dashboard} loading={analyticsLoading} onStartRecommendation={startRecommendedPractice} />
          )}

          {activeSection === "mock" && (
            <MockView
              tracks={mockTracks}
              activeSession={activeMockSession}
              history={mockHistory}
              loading={mockLoading}
              error={mockError}
              onStart={(trackId, mode) => void startMockSession(trackId, mode)}
              onLaunchRound={launchMockRound}
            />
          )}

          {activeSection === "practice" && (
            <PracticeView
              config={practiceConfig}
              questions={practiceQuestions}
              currentIndex={practiceIndex}
              answers={practiceAnswers}
              feedback={practiceFeedback}
              loading={practiceLoading}
              error={practiceError}
              timeLeft={practiceTimeLeft}
              onConfigChange={(next) => resetPracticeState(next)}
              onStart={startPractice}
              onSelectAnswer={(value) => setPracticeAnswers((current) => ({ ...current, [practiceIndex]: value }))}
              onNavigate={navigatePractice}
              onSubmit={() => void submitPractice()}
              onReset={() => resetPracticeState(practiceConfig)}
            />
          )}

          {activeSection === "coding" && (
            <CodingView
              difficulty={codingDifficulty}
              presetLabel={codingPresetLabel}
              submissionCount={codingSubmissionCount}
              timerLabel={codingTimerLabel}
              language={codingLanguage}
              problem={codingProblem}
              result={codingResult}
              loading={codingLoading}
              error={codingError}
              code={codingCode}
              onDifficultyChange={setCodingDifficulty}
              onLanguageChange={(nextLanguage) => {
                setCodingLanguage(nextLanguage);
                if (codingProblem?.starterCode[nextLanguage]) {
                  setCodingCode(codingProblem.starterCode[nextLanguage]);
                }
              }}
              onCodeChange={setCodingCode}
              onGenerate={() => void generateCodingProblem()}
              onSubmit={() => void submitCoding()}
            />
          )}

          {activeSection === "interview" && (
            <InterviewView
              setup={interviewSetup}
              activeSession={activeInterviewSession}
              history={interviewHistory}
              draftAnswer={interviewDraftAnswer}
              answerFeedback={interviewAnswerFeedback}
              loading={interviewLoading}
              error={interviewError}
              onSetupChange={setInterviewSetup}
              onDraftAnswerChange={setInterviewDraftAnswer}
              onStart={() => void startInterviewSession()}
              onSubmitAnswer={() => void submitInterviewAnswer()}
              onFinish={() => void finishInterview()}
            />
          )}

          {activeSection === "analytics" && <AnalyticsView data={analytics} loading={analyticsLoading} />}

          {activeSection === "profile" && (
            <ProfileView user={user} analytics={analytics} onLogout={handleLogout} />
          )}
        </main>
      </div>
    </div>
  );
}
