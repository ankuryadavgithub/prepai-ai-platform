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
  const [tests, users, topicRows, difficultyRows, codingStats, recentCodingSubmissions] = await Promise.all([
    getTestsByUser(user_id),
    getAllUsersPerformance(),
    getTopicPerformanceByUser(user_id),
    getDifficultyPerformanceByUser(user_id),
    getCodingStatsByUser(user_id),
    getRecentCodingSubmissionsByUser(user_id),
  ]);

  if (!tests.length) {
    return {
      overall: { tests: 0, accuracy: 0, avg_score: 0 },
      sections: [],
      weakTopics: [],
      avgTime: 0,
      trend: [],
      globalRank: {},
      topicMastery: [],
      difficultyBreakdown: [],
      recentAttempts: [],
      insights: [],
      recommendation: {
        section: "numerical",
        topic: "Percentage",
        difficulty: "Easy",
        mode: "practice",
        reason: "Take your first practice test to unlock adaptive recommendations."
      },
      streak: 0,
      latestSummary: null,
      codingStats: {
        submissions: 0,
        avg_pass_rate: 0,
        avg_solve_time: 0,
        latest_submission: null,
        recent: []
      }
    };
  }

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
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

export default router;
