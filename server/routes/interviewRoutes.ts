import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  createInterviewSession,
  finishInterviewSession,
  getActiveInterviewSession,
  getInterviewHistory,
  submitInterviewAnswer,
  type InterviewType,
} from "../models/interviewModel.js";

const router = express.Router();

router.get("/sessions/active", verifyToken, async (req: any, res) => {
  try {
    const session = await getActiveInterviewSession(req.user.id);
    res.json({ session });
  } catch (error) {
    console.error("ACTIVE INTERVIEW ERROR:", error);
    res.status(500).json({ error: "Failed to fetch active interview session" });
  }
});

router.get("/sessions/history", verifyToken, async (req: any, res) => {
  try {
    const sessions = await getInterviewHistory(req.user.id);
    res.json({ sessions: sessions.filter(Boolean) });
  } catch (error) {
    console.error("INTERVIEW HISTORY ERROR:", error);
    res.status(500).json({ error: "Failed to fetch interview history" });
  }
});

router.post("/sessions/start", verifyToken, async (req: any, res) => {
  try {
    const { interviewType, interactionMode, targetRole, focusArea, resumeSummary, projects, internships, achievements } = req.body ?? {};
    if (!interviewType || !targetRole) {
      return res.status(400).json({ error: "interviewType and targetRole are required" });
    }

    const session = await createInterviewSession(req.user.id, interviewType as InterviewType, {
      interactionMode,
      targetRole,
      focusArea,
      resumeSummary,
      projects,
      internships,
      achievements,
    });

    res.json({ session });
  } catch (error: any) {
    console.error("START INTERVIEW ERROR:", error);
    res.status(400).json({ error: error.message || "Failed to start interview session" });
  }
});

router.post("/sessions/:id/answer", verifyToken, async (req: any, res) => {
  try {
    const { answer, responseTime } = req.body ?? {};
    if (typeof answer !== "string") {
      return res.status(400).json({ error: "answer is required" });
    }

    const result = await submitInterviewAnswer(req.user.id, Number(req.params.id), answer, Number(responseTime ?? 0));
    res.json(result);
  } catch (error: any) {
    console.error("INTERVIEW ANSWER ERROR:", error);
    res.status(400).json({ error: error.message || "Failed to submit interview answer" });
  }
});

router.post("/sessions/:id/finish", verifyToken, async (req: any, res) => {
  try {
    const session = await finishInterviewSession(req.user.id, Number(req.params.id));
    res.json({ session });
  } catch (error: any) {
    console.error("FINISH INTERVIEW ERROR:", error);
    res.status(400).json({ error: error.message || "Failed to finish interview session" });
  }
});

export default router;
