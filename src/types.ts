export const TOPICS = {
  numerical: [
    "Percentage", "Number System", "Arithmetic", "Data Interpretation",
    "Geometry & Mensuration", "Profit & Loss", "Ratio & Proportion",
    "Time & Work", "Simplification", "Speed, Time & Distance",
    "LCM & HCF", "Linear Equation", "Mixture & Alligation",
    "Permutation & Combination", "Simple & Compound Interest",
    "Average", "Divisibility Rules", "Partnership", "Probability",
    "Age Problems", "Train Problems"
  ],
  logical: [
    "Logical Deduction", "Letter & Number Series", "Data Sufficiency",
    "Pattern Recognition", "Syllogism", "Blood Relation",
    "Data Arrangement", "Visual Reasoning", "Spatial Reasoning",
    "Attention to Detail", "Venn Diagrams", "Calendar",
    "Coding-Decoding", "Directions", "Seating Arrangement"
  ],
  verbal: [
    "Reading Comprehension", "Cloze Test", "Error Spotting",
    "Sentence Completion", "Synonyms & Antonyms", "Vocabulary",
    "Para Jumbles", "Grammar", "Tense",
    "Articles, Prepositions, Conjunctions", "Subject-Verb Agreement"
  ]
} as const;

export type PracticeSection = keyof typeof TOPICS;
export type AppSection = "dashboard" | "mock" | "practice" | "coding" | "interview" | "analytics" | "profile";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type PracticeMode = "practice" | "timed";
export type MockMode = "aptitude" | "coding" | "full";
export type InterviewType = "HR" | "Technical" | "Panel";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface AnswerPayload {
  question_index: number;
  topic: string;
  subtopic: string;
  time_spent: number;
  question: string;
  selected?: string;
  correct: string;
}

export interface PracticeConfig {
  section: PracticeSection;
  topic: string;
  difficulty: Difficulty;
  mode: PracticeMode;
}

export interface PracticeFeedback {
  score: number;
  total: number;
  accuracy: number;
  correct: number;
  wrong: number;
  skipped: number;
  avgTimePerQ: number;
  strongestTopic: string;
  weakestTopic: string;
  speedLabel: string;
  recommendation: string;
}

export interface Recommendation {
  section: string;
  topic: string | null;
  difficulty: Difficulty;
  mode: PracticeMode;
  reason: string;
}

export interface LatestSummary {
  category: string;
  topic: string;
  difficulty: Difficulty;
  mode: PracticeMode;
  score: number;
  total: number;
  accuracy: number;
  avg_time_per_q: number;
  created_at: string;
}

export interface DashboardData {
  recommendation: Recommendation;
  weakTopics: string[];
  streak: number;
  latestSummary: LatestSummary | null;
  insights: string[];
  overall: {
    tests: number;
    accuracy: number;
    avg_score: number;
  };
  readiness: ReadinessSummary;
  nextRecommendedTrack: {
    type: "mock" | "interview";
    label: string;
    reason: string;
  };
  recentMocks: RecentMockSummary[];
  interviewAnalytics: InterviewAnalyticsSummary;
  weeklyTarget: {
    target: number;
    completed: number;
  };
  milestones: string[];
}

export interface SectionPerformance {
  section: string;
  tests: number;
  accuracy: number;
  avg_score: number;
  avg_time: number;
}

export interface TopicMasteryRow {
  topic: string;
  totalAttempts: number;
  accuracy: number;
  avg_time: number;
}

export interface DifficultyBreakdownRow {
  difficulty: string;
  tests: number;
  accuracy: number;
  avg_time: number;
}

export interface RecentAttempt {
  category: string;
  topic: string;
  difficulty: string;
  mode: PracticeMode;
  accuracy: number;
  score: number;
  total: number;
  avg_time_per_q: number;
  created_at: string;
}

export interface CodingStats {
  submissions: number;
  avg_pass_rate: number;
  avg_solve_time: number;
  latest_submission: string | null;
  recent: Array<{
    problem_title: string;
    difficulty: string;
    language: string;
    solve_time: number;
    passed_visible: number;
    total_visible: number;
    passed_hidden: number;
    total_hidden: number;
    created_at: string;
  }>;
}

export interface AnalyticsData {
  overall: {
    tests: number;
    accuracy: number;
    avg_score: number;
  };
  sections: SectionPerformance[];
  weakTopics: string[];
  avgTime: number;
  trend: Array<{
    date: string;
    accuracy: number;
    score: number;
    total: number;
  }>;
  globalRank: {
    rank?: number;
    total_users?: number;
    percentile?: number;
  };
  topicMastery: TopicMasteryRow[];
  difficultyBreakdown: DifficultyBreakdownRow[];
  recentAttempts: RecentAttempt[];
  insights: string[];
  recommendation: Recommendation;
  streak: number;
  latestSummary: LatestSummary | null;
  readiness: ReadinessSummary;
  nextRecommendedTrack: {
    type: "mock" | "interview";
    label: string;
    reason: string;
  };
  recentMocks: RecentMockSummary[];
  interviewAnalytics: InterviewAnalyticsSummary;
  weeklyTarget: {
    target: number;
    completed: number;
  };
  milestones: string[];
  codingStats: CodingStats;
}

export interface ReadinessSummary {
  readinessScore: number;
  strongestRoundType: string;
  weakestRoundType: string;
  aptitudeReadiness: number;
  codingReadiness: number;
  interviewReadiness: number;
  mockReadiness: number;
  interviewStatus: string;
}

export interface RecentMockSummary {
  track_name: string;
  mode: MockMode;
  readiness_score: number;
  passed: boolean;
  strongest_round: string | null;
  weakest_round: string | null;
  completed_at: string;
}

export interface InterviewAnalyticsSummary {
  completedInterviews: number;
  avgScore: number;
  latestCompletion: string | null;
  recentThemes: string[];
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  functionName: string;
  visibleTests: Array<{
    input: any[];
    expected: any;
  }>;
  starterCode: Record<string, string>;
  supportedLanguages: string[];
}

export interface CodingSubmissionResult {
  summary: {
    passedVisible: number;
    totalVisible: number;
    passedHidden: number;
    totalHidden: number;
    passedAll: boolean;
  };
  visibleResults: Array<{
    passed: boolean;
    actual: any;
    expected: any;
    runtimeMs: number;
    error?: string;
  }>;
  feedback: string;
}

export interface MockTrack {
  id: string;
  name: string;
  description: string;
  target: string;
  modes: MockMode[];
  rounds: MockRound[];
}

export interface MockRound {
  id?: number;
  roundKey: string;
  roundLabel: string;
  roundType: "aptitude" | "coding";
  section: string | null;
  topic: string | null;
  difficulty: Difficulty;
  timeLimit: number;
  cutoffScore: number;
  status?: "pending" | "completed";
  score?: number;
  maxScore?: number;
  accuracy?: number;
  summary?: string | null;
  completedAt?: string | null;
}

export interface MockSession {
  id: number;
  trackId: string;
  trackName: string;
  mode: MockMode;
  status: string;
  readinessScore: number;
  passed: boolean;
  strongestRound: string | null;
  weakestRound: string | null;
  nextPriority: string | null;
  recommendedFollowUp: string | null;
  startedAt: string;
  completedAt: string | null;
  rounds: MockRound[];
}

export interface InterviewSetup {
  interviewType: InterviewType;
  targetRole: string;
  focusArea: string;
  resumeSummary: string;
  projects: string;
  internships: string;
  achievements: string;
}

export interface InterviewTurn {
  id: number;
  turnIndex: number;
  interviewerId: string;
  interviewerName: string;
  interviewerStyle: string;
  question: string;
  candidateAnswer?: string | null;
  followupReason?: string | null;
  evaluation: {
    relevance: number;
    clarity: number;
    correctness: number;
    structure: number;
    confidence: number;
    followupHandling: number;
  };
  responseTime: number;
  createdAt: string;
}

export interface InterviewSession {
  id: number;
  interviewType: InterviewType;
  targetRole: string;
  focusArea?: string | null;
  resumeSummary?: string | null;
  projects?: string | null;
  internships?: string | null;
  achievements?: string | null;
  status: string;
  activeTurn: number;
  personas: Array<{
    id: string;
    name: string;
    style: string;
    specialty: string;
  }>;
  overallScore: number;
  readinessScore: number;
  recommendation?: string | null;
  finalSummary: {
    averages?: Record<string, number>;
    strengths?: string[];
    weakSignals?: string[];
    expectedBetterAnswer?: string;
    answerRewrite?: string;
    hiringSummary?: string;
  };
  createdAt: string;
  completedAt?: string | null;
  transcript: InterviewTurn[];
}
