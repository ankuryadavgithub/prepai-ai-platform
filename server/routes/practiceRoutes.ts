import express from "express";
import axios from "axios";
import { createRateLimit } from "../middleware/rateLimit.js";

const router = express.Router();
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const practiceRateLimit = createRateLimit({ windowMs: 10 * 60 * 1000, max: 20, keyPrefix: "practice-mcq" });

function findJsonArrayBlock(content: string) {
  const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("[");

  if (start === -1) {
    throw new Error("Invalid AI response: no JSON array found");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;

    if (depth === 0) {
      return cleaned.slice(start, index + 1);
    }
  }

  throw new Error("Invalid AI response: unterminated JSON array");
}

function parseQuestionArray(content: string) {
  return JSON.parse(findJsonArrayBlock(content));
}

async function callGroq(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing AI API key");
  }

  const response = await axios.post(
    GROQ_URL,
    {
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: [
            "You generate placement-prep questions.",
            "Return valid JSON only.",
            "Every string must be valid JSON with escaped quotes.",
            "Do not include markdown, comments, or prose before/after the JSON."
          ].join(" ")
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.35,
      max_tokens: 2200
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 20000
    }
  );

  const content = response?.data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty AI response");
  }

  return content;
}

async function generateQuestions(payload: {
  category: string;
  topic: string;
  difficulty: string;
  mode: string;
}, attempt = 0) {
  const prompt = `
Generate EXACTLY 10 placement-prep MCQs as a JSON array.

Rules:
- Category: ${payload.category}
- Topic: ${payload.topic}
- Difficulty: ${payload.difficulty}
- Mode: ${payload.mode === "practice" ? "practice drill with teaching bias" : "timed placement test"}
- Keep questions suitable for Indian fresher campus placements.
- Return strict JSON only.
- Escape all double quotes inside string values.
- Each object must contain:
  {
    "question": "",
    "options": ["", "", "", ""],
    "correct_answer": "",
    "explanation": ""
  }
- Do not include markdown.
`;

  try {
    const content = await callGroq(prompt);
    const parsed = parseQuestionArray(content);

    if (!Array.isArray(parsed)) {
      throw new Error("AI did not return an array");
    }

    const valid = parsed.filter(
      (item: any) =>
        item?.question &&
        Array.isArray(item?.options) &&
        item.options.length === 4 &&
        item?.correct_answer &&
        item?.explanation
    );

    if (valid.length < 5) {
      throw new Error("Insufficient question quality from AI");
    }

    return valid.slice(0, 10);
  } catch (error) {
    if (attempt < 2) {
      console.warn(`Retrying MCQ generation after parse failure (attempt ${attempt + 2}/3)`);
      return generateQuestions(payload, attempt + 1);
    }
    throw error;
  }
}

router.post("/mcq", practiceRateLimit, async (req, res) => {
  try {
    const { category, topic, difficulty, mode } = req.body;

    if (
      typeof category !== "string" ||
      typeof topic !== "string" ||
      typeof difficulty !== "string" ||
      !category.trim() ||
      !topic.trim() ||
      !difficulty.trim()
    ) {
      return res.status(400).json({ error: "Missing generation inputs" });
    }

    const questions = await generateQuestions({
      category: category.trim(),
      topic: topic.trim(),
      difficulty: difficulty.trim(),
      mode: mode === "practice" ? "practice" : "timed",
    });
    res.json(questions);
  } catch (err) {
    console.error("MCQ GENERATION ERROR:", err);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

export default router;
