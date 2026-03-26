import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  completeMockRound,
  getActiveMockSession,
  getMockSessionById,
  getMockSessionHistory,
  mockTracks,
  startMockSession,
} from "../models/mockModel.js";

const router = express.Router();

router.get("/tracks", verifyToken, async (_req, res) => {
  res.json(mockTracks);
});

router.get("/sessions/active", verifyToken, async (req: any, res) => {
  try {
    const session = await getActiveMockSession(req.user.id);
    res.json({ session });
  } catch (error) {
    console.error("ACTIVE MOCK ERROR:", error);
    res.status(500).json({ error: "Failed to fetch active mock session" });
  }
});

router.get("/sessions/history", verifyToken, async (req: any, res) => {
  try {
    const sessions = await getMockSessionHistory(req.user.id);
    res.json({ sessions: sessions.filter(Boolean) });
  } catch (error) {
    console.error("MOCK HISTORY ERROR:", error);
    res.status(500).json({ error: "Failed to fetch mock history" });
  }
});

router.post("/sessions/start", verifyToken, async (req: any, res) => {
  try {
    const { trackId, mode } = req.body ?? {};
    if (!trackId || !mode) {
      return res.status(400).json({ error: "trackId and mode are required" });
    }

    const session = await startMockSession(req.user.id, trackId, mode);
    res.json({ session });
  } catch (error: any) {
    console.error("START MOCK ERROR:", error);
    res.status(400).json({ error: error.message || "Failed to start mock session" });
  }
});

router.get("/sessions/:id", verifyToken, async (req: any, res) => {
  try {
    const session = await getMockSessionById(Number(req.params.id), req.user.id);
    if (!session) {
      return res.status(404).json({ error: "Mock session not found" });
    }
    res.json({ session });
  } catch (error) {
    console.error("GET MOCK ERROR:", error);
    res.status(500).json({ error: "Failed to fetch mock session" });
  }
});

router.post("/sessions/:id/rounds/:roundKey/complete", verifyToken, async (req: any, res) => {
  try {
    const session = await completeMockRound(req.user.id, Number(req.params.id), req.params.roundKey, req.body ?? {});
    res.json({ session });
  } catch (error: any) {
    console.error("COMPLETE MOCK ROUND ERROR:", error);
    res.status(400).json({ error: error.message || "Failed to complete mock round" });
  }
});

export default router;
