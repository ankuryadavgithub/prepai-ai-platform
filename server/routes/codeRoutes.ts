import express from "express";
import axios from "axios";
import fs from "fs";
import os from "os";
import path from "path";
import vm from "vm";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { verifyToken } from "../middleware/authMiddleware.js";
import { saveCodingSubmission } from "../models/testModel.js";

const router = express.Router();
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const SUPPORTED_LANGUAGES = ["javascript", "python"];

type CodingTestCase = {
  input: any[];
  expected: any;
};

type StoredCodingProblem = {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  functionName: string;
  visibleTests: CodingTestCase[];
  hiddenTests: CodingTestCase[];
  starterCode: Record<string, string>;
};

const problemStore = new Map<string, StoredCodingProblem>();

async function callGroq(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

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
          content: "You are an expert placement-prep problem generator. Return valid JSON only."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 2400
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

  return content.replace(/```json/g, "").replace(/```/g, "").trim();
}

function safeParseJson<T>(content: string): T {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Invalid JSON payload");
  }

  return JSON.parse(content.slice(start, end + 1));
}

function normalizeGeneratedProblem(data: any, difficulty: string): StoredCodingProblem {
  const functionName = data.functionName || "solve";

  return {
    id: randomUUID(),
    title: data.title || "Coding Challenge",
    difficulty,
    description: data.description || data.problem || "Solve the problem using the requested function signature.",
    constraints: Array.isArray(data.constraints) ? data.constraints : [String(data.constraints || "Use an efficient approach.")],
    examples: Array.isArray(data.examples) ? data.examples : [],
    functionName,
    visibleTests: (Array.isArray(data.visibleTests) ? data.visibleTests : []).map((test) => ({
      input: Array.isArray(test?.input) ? test.input : [test?.input],
      expected: test?.expected,
    })).slice(0, 3),
    hiddenTests: (Array.isArray(data.hiddenTests) ? data.hiddenTests : []).map((test) => ({
      input: Array.isArray(test?.input) ? test.input : [test?.input],
      expected: test?.expected,
    })).slice(0, 3),
    starterCode: data.starterCode || {
      javascript: `function ${functionName}(...args) {\n  return null;\n}\n`,
      python: `def ${functionName}(*args):\n    return None\n`,
    },
  };
}

function serialize(value: any) {
  return JSON.stringify(value);
}

async function runJavaScript(code: string, functionName: string, tests: CodingTestCase[]) {
  const wrapped = `${code}

if (typeof ${functionName} !== "function") {
  throw new Error("Expected function ${functionName} to be defined.");
}
module.exports = ${functionName};
`;

  const context = {
    module: { exports: null },
    exports: {},
  };

  const script = new vm.Script(wrapped);
  script.runInNewContext(context, { timeout: 1000 });
  const fn = context.module.exports as (...args: any[]) => any;

  return tests.map((test) => {
    const startedAt = Date.now();
    try {
      const actual = fn(...test.input);
      return {
        passed: serialize(actual) === serialize(test.expected),
        actual,
        expected: test.expected,
        runtimeMs: Date.now() - startedAt,
      };
    } catch (error: any) {
      return {
        passed: false,
        actual: null,
        expected: test.expected,
        runtimeMs: Date.now() - startedAt,
        error: error.message,
      };
    }
  });
}

async function runPython(code: string, functionName: string, tests: CodingTestCase[]) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "prepai-"));
  const solutionPath = path.join(tempDir, "solution.py");
  const runnerPath = path.join(tempDir, "runner.py");

  fs.writeFileSync(solutionPath, code);
  fs.writeFileSync(
    runnerPath,
    `import json\nimport sys\nfrom solution import ${functionName}\n\ntests = json.loads(sys.argv[1])\nresults = []\nfor test in tests:\n    try:\n        actual = ${functionName}(*test["input"])\n        results.append({"passed": actual == test["expected"], "actual": actual, "expected": test["expected"]})\n    except Exception as exc:\n        results.append({"passed": False, "actual": None, "expected": test["expected"], "error": str(exc)})\nprint(json.dumps(results))\n`
  );

  const payload = JSON.stringify(tests);

  const result = await new Promise<any[]>((resolve, reject) => {
    const child = spawn("python", [runnerPath, payload], {
      cwd: tempDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Python execution timed out"));
    }, 2000);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("close", () => {
      clearTimeout(timeout);
      try {
        if (stderr.trim()) {
          reject(new Error(stderr.trim()));
          return;
        }

        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(error);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  return result.map((item) => ({
    ...item,
    runtimeMs: 0,
  }));
}

router.post("/problem", verifyToken, async (req: any, res) => {
  try {
    const difficulty = req.body?.difficulty || "Medium";
    const prompt = `
Generate one fresher-level coding interview problem as JSON.

Return this exact shape:
{
  "title": "",
  "description": "",
  "constraints": ["", ""],
  "functionName": "",
  "examples": [
    { "input": "", "output": "", "explanation": "" }
  ],
  "visibleTests": [
    { "input": [1,2], "expected": 3 }
  ],
  "hiddenTests": [
    { "input": [5,5], "expected": 10 }
  ],
  "starterCode": {
    "javascript": "function solve(...) {\\n  return null;\\n}",
    "python": "def solve(...):\\n    return None"
  }
}

Rules:
- Difficulty: ${difficulty}
- Solvable by a single function.
- visibleTests and hiddenTests must each contain 2-3 deterministic cases.
- Keep inputs JSON-serializable.
- Do not include markdown.
`;

    const raw = await callGroq(prompt);
    const problem = normalizeGeneratedProblem(safeParseJson<any>(raw), difficulty);
    problemStore.set(problem.id, problem);

    res.json({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      description: problem.description,
      constraints: problem.constraints,
      examples: problem.examples,
      functionName: problem.functionName,
      visibleTests: problem.visibleTests,
      starterCode: problem.starterCode,
      supportedLanguages: SUPPORTED_LANGUAGES,
    });
  } catch (err) {
    console.error("CODING PROBLEM ERROR:", err);
    res.status(500).json({ error: "Failed to generate coding problem" });
  }
});

router.post("/submit", verifyToken, async (req: any, res) => {
  try {
    const { problemId, code, language, solveTime } = req.body;

    if (!problemId || typeof code !== "string" || !SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ error: "Invalid coding submission" });
    }

    const problem = problemStore.get(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Coding problem expired. Generate a new one." });
    }

    const visibleResults = language === "javascript"
      ? await runJavaScript(code, problem.functionName, problem.visibleTests)
      : await runPython(code, problem.functionName, problem.visibleTests);

    const hiddenResults = language === "javascript"
      ? await runJavaScript(code, problem.functionName, problem.hiddenTests)
      : await runPython(code, problem.functionName, problem.hiddenTests);

    const passedVisible = visibleResults.filter((result) => result.passed).length;
    const passedHidden = hiddenResults.filter((result) => result.passed).length;

    await saveCodingSubmission({
      user_id: req.user.id,
      problem_title: problem.title,
      difficulty: problem.difficulty,
      language,
      solve_time: typeof solveTime === "number" ? solveTime : 0,
      passed_visible: passedVisible,
      total_visible: visibleResults.length,
      passed_hidden: passedHidden,
      total_hidden: hiddenResults.length,
    });

    res.json({
      summary: {
        passedVisible,
        totalVisible: visibleResults.length,
        passedHidden,
        totalHidden: hiddenResults.length,
        passedAll: passedVisible === visibleResults.length && passedHidden === hiddenResults.length,
      },
      visibleResults,
      feedback:
        passedVisible === visibleResults.length && passedHidden === hiddenResults.length
          ? "Strong submission. Move to the next higher difficulty challenge."
          : "Review the failing visible cases first, then retry with edge cases in mind.",
    });
  } catch (err: any) {
    console.error("CODING SUBMIT ERROR:", err);
    res.status(500).json({ error: err.message || "Failed to evaluate submission" });
  }
});

export default router;
