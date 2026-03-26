import express from "express";
import { saveTest } from "../models/testModel.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/save", verifyToken, async (req: any, res) => {
  try {
    const user_id = req.user.id;

    const {
      category,
      topic,
      difficulty,
      mode,
      score,
      total,
      answers,
      accuracy,
      time_taken,
      avg_time_per_q,
      correct_answers,
      wrong_answers,
      skipped
    } = req.body;

    if (!category || typeof score !== "number" || typeof total !== "number") {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const safeData = {
      user_id,
      category,
      topic,
      difficulty,
      mode: mode === "practice" ? "practice" : "timed",
      score,
      total,
      answers: Array.isArray(answers) ? answers : [],
      accuracy: accuracy ?? (total ? score / total : 0),
      time_taken: time_taken ?? 0,
      avg_time_per_q: avg_time_per_q ?? 0,
      correct_answers: correct_answers ?? score,
      wrong_answers: wrong_answers ?? Math.max(total - score, 0),
      skipped: skipped ?? 0
    };

    const result = await saveTest(safeData);
    res.json(result);
  } catch (err) {
    console.error("SAVE TEST ERROR:", err);
    res.status(500).json({ error: "Failed to save test" });
  }
});

export default router;
