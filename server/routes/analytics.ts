import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getTestsByUser, getAllUsersPerformance } from "../models/testModel.js";

const router = express.Router();

router.get("/user", verifyToken, async (req: any, res) => {
  try {
    const user_id = req.user.id;

    const tests = await getTestsByUser(user_id);

    // ================= NO DATA CASE =================
    if (!tests || tests.length === 0) {
      return res.json({
        overall: {},
        sections: {},
        weakTopics: [],
        avgTime: 0,
        trend: [],
        globalRank: {}
      });
    }

    // ================= OVERALL =================
    const totalTests = tests.length;

    const totalScore = tests.reduce((sum, t) => sum + (t.score || 0), 0);
    const totalQuestions = tests.reduce((sum, t) => sum + (t.total || 0), 0);

    const overall = {
      tests: totalTests,
      accuracy: totalQuestions ? totalScore / totalQuestions : 0,
      avg_score: totalTests ? totalScore / totalTests : 0
    };

    // ================= SECTION WISE =================
    const sectionNames = ["numerical", "logical", "verbal", "coding"];
    const sections: any = {};

    sectionNames.forEach(sec => {
      const secTests = tests.filter(t => t.category === sec);

      const score = secTests.reduce((s, t) => s + (t.score || 0), 0);
      const total = secTests.reduce((s, t) => s + (t.total || 0), 0);

      sections[sec] = {
        tests: secTests.length,
        accuracy: total ? score / total : 0,
        avg_score: secTests.length ? score / secTests.length : 0
      };
    });

    // ================= WEAK TOPICS =================
    const weakTopics = tests
      .filter(t => t.accuracy !== null && t.accuracy < 0.5)
      .map(t => t.topic)
      .filter(Boolean);

    // Remove duplicates
    const uniqueWeakTopics = [...new Set(weakTopics)];

    // ================= SPEED ANALYSIS =================
    const avgTime =
      tests.length
        ? tests.reduce((sum, t) => sum + (t.avg_time_per_q || 0), 0) / tests.length
        : 0;

    // ================= TREND (FOR GRAPH) =================
    const trend = tests.map(t => ({
      date: t.created_at,
      accuracy: t.accuracy || 0
    }));

    // ================= GLOBAL RANK =================
    let globalRank = {};

    try {
      const users = await getAllUsersPerformance();

      if (users && users.length > 0) {
        const rank =
          users.findIndex((u: any) => u.user_id === user_id) + 1;

        globalRank = {
          rank,
          total_users: users.length,
          percentile:
            users.length
              ? ((users.length - rank) / users.length) * 100
              : 0
        };
      }
    } catch (err) {
      console.error("Ranking error:", err);
      globalRank = {};
    }

    // ================= FINAL RESPONSE =================
    res.json({
      overall,
      sections,
      weakTopics: uniqueWeakTopics,
      avgTime,
      trend,
      globalRank
    });

  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;