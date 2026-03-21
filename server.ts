import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import testRoutes from "./server/routes/testRoutes.js";
import authRoutes from "./server/routes/authRoutes.js";
import codeRoutes from "./server/routes/codeRoutes.js";
import analyticsRoutes from "./server/routes/analytics.js";



dotenv.config();

async function startServer() {
  const app = express(); // ✅ MUST BE BEFORE USE
  const PORT = 3000;

  app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/analytics", analyticsRoutes);

  // ✅ REGISTER ROUTES HERE (INSIDE FUNCTION)
  app.use("/api/test", testRoutes);

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const safeParse = (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  // ============================
  // MCQ API
  // ============================
  app.post("/api/mcq", async (req, res) => {
    try {
      const { category, topic, difficulty } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Generate ONE ${difficulty} MCQ for ${category} on ${topic}.
Return ONLY JSON`,
      });

      const parsed = safeParse(response.text());

      if (!parsed) return res.status(500).json({ error: "Invalid AI response" });

      res.json(parsed);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "MCQ failed" });
    }
  });

  // ============================
  // CODING API
  // ============================
  app.post("/api/coding", async (req, res) => {
    try {
      const { difficulty } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Generate ONE ${difficulty} coding problem in JSON`,
      });

      const parsed = safeParse(response.text());

      if (!parsed) return res.status(500).json({ error: "Invalid AI response" });

      res.json(parsed);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Coding failed" });
    }
  });

  // ============================
  // VITE
  // ============================
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();