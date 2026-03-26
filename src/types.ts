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
export type AppSection = "dashboard" | "practice" | "coding" | "analytics" | "profile";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type PracticeMode = "practice" | "timed";

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
  codingStats: CodingStats;
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
