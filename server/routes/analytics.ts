import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  getAllUsersPerformance,
  getCodingStatsByUser,
  getDifficultyPerformanceByUser,
  getRecentCodingSubmissionsByUser,
  getTestsByUser,
  getTopicPerformanceByUser,
} from "../models/testModel.js";
import { getInterviewStatsByUser, getInterviewHistory } from "../models/interviewModel.js";
import { getMockStatsByUser, getRecentCompletedMocks } from "../models/mockModel.js";

const router = express.Router();
const sectionNames = ["numerical", "logical", "verbal", "coding"];

const toNumber = (value: any) => Number(value ?? 0);

function buildInsights({ sections, topicMastery, difficultyBreakdown, recentAttempts }: any) {
  const insights: string[] = [];

  const weakestSection = [...sections].sort((a, b) => a.accuracy - b.accuracy)[0];
  const strongestSection = [...sections].sort((a, b) => b.accuracy - a.accuracy)[0];

  if (weakestSection && weakestSection.tests > 0) {
    insights.push(
      `${weakestSection.section} accuracy is your weakest area. Focus on one short ${weakestSection.section} drill before the next mixed test.`
    );
  }

  if (strongestSection && strongestSection.tests > 0 && strongestSection.accuracy >= 0.75) {
    insights.push(
      `${strongestSection.section} is becoming stable. Increase difficulty there to keep improving without losing momentum.`
    );
  }

  const slowTopic = [...topicMastery].sort((a, b) => b.avg_time - a.avg_time)[0];
  if (slowTopic && slowTopic.totalAttempts >= 2 && slowTopic.avg_time > 45) {
    insights.push(
      `${slowTopic.topic} is slowing you down. Use a timed drill on that topic to improve decision speed.`
    );
  }

  const hard = difficultyBreakdown.find((item: any) => item.difficulty === "Hard");
  if (hard && hard.tests > 0 && hard.accuracy < 0.5) {
    insights.push("Hard questions are dragging accuracy down. Stay on medium difficulty until accuracy stabilizes above 70%.");
  }

  if (recentAttempts.length >= 2 && recentAttempts[0].accuracy > recentAttempts[1].accuracy) {
    insights.push("Your latest attempt improved over the previous one. Keep the same cadence and revise mistakes instead of switching topics too quickly.");
  }

  return insights.slice(0, 4);
}

function buildRecommendation({ sections, weakTopics, overall }: any) {
  const weakestSection = [...sections].sort((a, b) => a.accuracy - b.accuracy)[0];
  const strongestSection = [...sections].sort((a, b) => b.accuracy - a.accuracy)[0];

  if (!overall.tests) {
    return {
      section: "numerical",
      topic: "Percentage",
      difficulty: "Easy",
      mode: "practice",
      reason: "Start with a short numerical practice test to establish your baseline."
    };
  }

  if (weakTopics.length > 0) {
    return {
      section: weakestSection?.section ?? "numerical",
      topic: weakTopics[0],
      difficulty: overall.accuracy >= 0.7 ? "Medium" : "Easy",
      mode: "practice",
      reason: `Your recent data shows weakness in ${weakTopics[0]}. Review it in practice mode before the next timed test.`
    };
  }

  return {
    section: strongestSection?.section ?? "numerical",
    topic: null,
    difficulty: strongestSection?.accuracy >= 0.8 ? "Hard" : "Medium",
    mode: "timed",
    reason: "Your baseline is steady enough for a timed drill. Use this to improve placement-test readiness."
  };
}

function buildReadiness({ overall, sections, codingStats, mockStats, interviewStats }: any) {
  const codingReadiness = Math.min(100, Math.round(toNumber(codingStats?.avg_pass_rate) * 100));
  const aptitudeReadiness = Math.min(100, Math.round(toNumber(overall.accuracy) * 100));
  const interviewReadiness = Math.min(100, Math.round(toNumber(interviewStats?.avg_score)));
  const mockReadiness = Math.min(100, Math.round(toNumber(mockStats?.avg_readiness)));

  const readinessScore = Math.round(
    aptitudeReadiness * 0.35 +
      codingReadiness * 0.25 +
      interviewReadiness * 0.2 +
      mockReadiness * 0.2
  );

  const sortedSections = [...sections].sort((a, b) => b.accuracy - a.accuracy);

  return {
    readinessScore,
    strongestRoundType: sortedSections[0]?.section ?? "numerical",
    weakestRoundType: sortedSections[sections.length - 1]?.section ?? "numerical",
    aptitudeReadiness,
    codingReadiness,
    interviewReadiness,
    mockReadiness,
    interviewStatus: interviewStats?.completed_interviews
      ? interviewReadiness >= 70
        ? "Interview readiness is trending positive."
        : "Interview readiness needs another targeted round."
      : "No completed interview yet.",
  };
}

function buildMockRecommendation({ readiness, weakTopics, codingStats, interviewStats }: any) {
  if (!toNumber(interviewStats?.completed_interviews)) {
    return {
      type: "interview",
      label: "Start HR Interview",
      reason: "You have no interview baseline yet. Start with an HR round to measure structure, confidence, and clarity.",
    };
  }

  if (readiness.codingReadiness < 55) {
    return {
      type: "mock",
      label: "Coding-Only Product Mock",
      reason: "Your coding pass rate is lagging behind aptitude. Take a coding-heavy mock before the next full sequence.",
    };
  }

  if (weakTopics.length > 0 || readiness.aptitudeReadiness < 65) {
    return {
      type: "mock",
      label: "Aptitude-Heavy Mock",
      reason: "Your aptitude trend still has weak spots. Repair timed aptitude performance before shifting focus.",
    };
  }

  if (readiness.interviewReadiness < 70) {
    return {
      type: "interview",
      label: "Technical Interview Retry",
      reason: "Interview readiness is the weakest signal now. Run a technical round and defend one project deeply.",
    };
  }

  return {
    type: "mock",
    label: "Full Product Mock",
    reason: "Your baseline is steady enough for a tougher end-to-end readiness check.",
  };
}

function buildMilestones(payload: any) {
  const milestones: string[] = [];

  if (payload.readiness.readinessScore >= 70) {
    milestones.push("Readiness score crossed 70. Start mixing harder mock tracks.");
  }

  if (payload.streak >= 5) {
    milestones.push(`Consistency unlocked: ${payload.streak}-day streak.`);
  }

  if (toNumber(payload.mockStats?.passed_mocks) >= 1) {
    milestones.push("You have already cleared at least one mock track cutoff.");
  }

  if (toNumber(payload.interviewStats?.completed_interviews) >= 2) {
    milestones.push("Interview repetition is building. Compare transcript weak signals before the next round.");
  }

  return milestones.slice(0, 3);
}

function computeStreak(tests: any[]) {
  if (!tests.length) return 0;

  const uniqueDays = [...new Set(tests.map((test) => new Date(test.created_at).toISOString().slice(0, 10)))];
  let streak = 0;
  let cursor = new Date(uniqueDays[0]);

  for (const day of uniqueDays) {
    const current = new Date(day);
    if (cursor.toISOString().slice(0, 10) === current.toISOString().slice(0, 10)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

async function buildAnalyticsPayload(user_id: number) {
  const [tests, users, topicRows, difficultyRows, codingStats, recentCodingSubmissions, mockStats, recentMocks, interviewStats, interviewHistory] = await Promise.all([
    getTestsByUser(user_id),
    getAllUsersPerformance(),
    getTopicPerformanceByUser(user_id),
    getDifficultyPerformanceByUser(user_id),
    getCodingStatsByUser(user_id),
    getRecentCodingSubmissionsByUser(user_id),
    getMockStatsByUser(user_id),
    getRecentCompletedMocks(user_id),
    getInterviewStatsByUser(user_id),
    getInterviewHistory(user_id),
  ]);

  const totalTests = tests.length;
  const totalScore = tests.reduce((sum, test) => sum + toNumber(test.score), 0);
  const totalQuestions = tests.reduce((sum, test) => sum + toNumber(test.total), 0);

  const overall = {
    tests: totalTests,
    accuracy: totalQuestions ? totalScore / totalQuestions : 0,
    avg_score: totalTests ? totalScore / totalTests : 0
  };

  const sections = sectionNames.map((section) => {
    const sectionTests = tests.filter((test) => test.category === section);
    const sectionScore = sectionTests.reduce((sum, test) => sum + toNumber(test.score), 0);
    const sectionTotal = sectionTests.reduce((sum, test) => sum + toNumber(test.total), 0);

    return {
      section,
      tests: sectionTests.length,
      accuracy: sectionTotal ? sectionScore / sectionTotal : 0,
      avg_score: sectionTests.length ? sectionScore / sectionTests.length : 0,
      avg_time: sectionTests.length
        ? sectionTests.reduce((sum, test) => sum + toNumber(test.avg_time_per_q), 0) / sectionTests.length
        : 0
    };
  });

  const weakTopics = topicRows
    .filter((row: any) => row.topic && toNumber(row.accuracy) < 0.55)
    .sort((a: any, b: any) => toNumber(a.accuracy) - toNumber(b.accuracy))
    .map((row: any) => row.topic)
    .slice(0, 5);

  const topicMastery = topicRows.slice(0, 12).map((row: any) => ({
    topic: row.topic,
    totalAttempts: toNumber(row.total_attempts),
    accuracy: toNumber(row.accuracy),
    avg_time: toNumber(row.avg_time)
  }));

  const difficultyBreakdown = difficultyRows.map((row: any) => ({
    difficulty: row.difficulty,
    tests: toNumber(row.tests),
    accuracy: toNumber(row.accuracy),
    avg_time: toNumber(row.avg_time)
  }));

  const avgTime = tests.length
    ? tests.reduce((sum, test) => sum + toNumber(test.avg_time_per_q), 0) / tests.length
    : 0;

  const trend = [...tests].slice(0, 8).reverse().map((test) => ({
    date: test.created_at,
    accuracy: toNumber(test.accuracy),
    score: toNumber(test.score),
    total: toNumber(test.total)
  }));

  const recentAttempts = tests.slice(0, 6).map((test) => ({
    category: test.category,
    topic: test.topic,
    difficulty: test.difficulty,
    mode: test.mode ?? "timed",
    accuracy: toNumber(test.accuracy),
    score: toNumber(test.score),
    total: toNumber(test.total),
    avg_time_per_q: toNumber(test.avg_time_per_q),
    created_at: test.created_at
  }));

  const userRank = users.findIndex((user: any) => user.user_id === user_id) + 1;
  const globalRank = userRank > 0 ? {
    rank: userRank,
    total_users: users.length,
    percentile: users.length ? ((users.length - userRank) / users.length) * 100 : 0
  } : {};

  const latest = tests[0];
  const latestSummary = latest ? {
    category: latest.category,
    topic: latest.topic,
    difficulty: latest.difficulty,
    mode: latest.mode ?? "timed",
    score: toNumber(latest.score),
    total: toNumber(latest.total),
    accuracy: toNumber(latest.accuracy),
    avg_time_per_q: toNumber(latest.avg_time_per_q),
    created_at: latest.created_at,
  } : null;

  const readiness = buildReadiness({ overall, sections, codingStats, mockStats, interviewStats });
  const nextRecommendedTrack = buildMockRecommendation({ readiness, weakTopics, codingStats, interviewStats });
  const weeklyTargetCompleted = Math.min(4, recentAttempts.filter((attempt) => {
    const created = new Date(attempt.created_at).getTime();
    return Date.now() - created <= 7 * 24 * 60 * 60 * 1000;
  }).length + recentMocks.length);

  const interviewThemes = interviewHistory
    .filter((session: any) => session?.status === "completed")
    .map((session: any) => session.finalSummary?.weakSignals ?? [])
    .flat()
    .filter(Boolean)
    .slice(0, 4);

  return {
    overall,
    sections,
    weakTopics,
    avgTime,
    trend,
    globalRank,
    topicMastery,
    difficultyBreakdown,
    recentAttempts,
    insights: buildInsights({ sections, topicMastery, difficultyBreakdown, recentAttempts }),
    recommendation: buildRecommendation({ sections, weakTopics, overall }),
    streak: computeStreak(tests),
    latestSummary,
    readiness,
    nextRecommendedTrack,
    recentMocks: recentMocks.map((mock: any) => ({
      track_name: mock.track_name,
      mode: mock.mode,
      readiness_score: toNumber(mock.readiness_score),
      passed: Boolean(mock.passed),
      strongest_round: mock.strongest_round,
      weakest_round: mock.weakest_round,
      completed_at: mock.completed_at,
    })),
    interviewAnalytics: {
      completedInterviews: toNumber(interviewStats?.completed_interviews),
      avgScore: toNumber(interviewStats?.avg_score),
      latestCompletion: interviewStats?.latest_completion ?? null,
      recentThemes: interviewThemes,
    },
    weeklyTarget: {
      target: 4,
      completed: weeklyTargetCompleted,
    },
    milestones: buildMilestones({
      readiness,
      streak: computeStreak(tests),
      mockStats,
      interviewStats,
    }),
    codingStats: {
      submissions: toNumber(codingStats?.submissions),
      avg_pass_rate: toNumber(codingStats?.avg_pass_rate),
      avg_solve_time: toNumber(codingStats?.avg_solve_time),
      latest_submission: codingStats?.latest_submission ?? null,
      recent: recentCodingSubmissions,
    },
  };
}

router.get("/user", verifyToken, async (req: any, res) => {
  try {
    const payload = await buildAnalyticsPayload(req.user.id);
    res.json(payload);
  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.get("/dashboard", verifyToken, async (req: any, res) => {
  try {
    const payload = await buildAnalyticsPayload(req.user.id);
    res.json({
      recommendation: payload.recommendation,
      weakTopics: payload.weakTopics,
      streak: payload.streak,
      latestSummary: payload.latestSummary,
      insights: payload.insights,
      overall: payload.overall,
      readiness: payload.readiness,
      nextRecommendedTrack: payload.nextRecommendedTrack,
      recentMocks: payload.recentMocks,
      interviewAnalytics: payload.interviewAnalytics,
      weeklyTarget: payload.weeklyTarget,
      milestones: payload.milestones,
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

export default router;
