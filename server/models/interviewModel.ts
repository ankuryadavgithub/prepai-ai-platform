import { pool } from "../db";

export type InterviewType = "HR" | "Technical" | "Panel";

type CandidateContext = {
  targetRole: string;
  focusArea?: string;
  resumeSummary?: string;
  projects?: string;
  internships?: string;
  achievements?: string;
};

type Persona = {
  id: string;
  name: string;
  style: string;
  specialty: string;
};

type Evaluation = {
  relevance: number;
  clarity: number;
  correctness: number;
  structure: number;
  confidence: number;
  followupHandling: number;
  feedback: string;
  followupReason: string;
};

const personaSets: Record<InterviewType, Persona[]> = {
  HR: [{ id: "hr_lead", name: "Ms. Aditi Rao", style: "calm but probing", specialty: "motivation and communication" }],
  Technical: [{ id: "tech_lead", name: "Mr. Raghav Menon", style: "detail-oriented", specialty: "project ownership and fundamentals" }],
  Panel: [
    { id: "panel_hr", name: "Ms. Aditi Rao", style: "supportive", specialty: "communication and intent" },
    { id: "panel_arch", name: "Mr. Kabir Shah", style: "detail-oriented", specialty: "architecture and tradeoffs" },
    { id: "panel_skeptic", name: "Ms. Neha Iyer", style: "skeptical", specialty: "ownership and depth checks" },
  ],
};

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function parseProjectHint(text?: string) {
  if (!text) return null;
  const first = text.split(/[.\n,]/).map((item) => item.trim()).find(Boolean);
  return first || null;
}

function initialQuestion(type: InterviewType, context: CandidateContext) {
  const projectHint = parseProjectHint(context.projects);
  if (type === "HR") {
    return `Give me a concise self-introduction for a ${context.targetRole} role, and explain why you are pursuing this role now.`;
  }
  if (type === "Technical") {
    return projectHint
      ? `You mentioned ${projectHint}. Explain the problem it solved, your exact contribution, and one tradeoff you handled.`
      : `For a ${context.targetRole} role, explain one project or academic build where you made a technical decision and defended it.`;
  }
  return `Start with a sharp summary of your fit for a ${context.targetRole} role, then mention one project or experience that best proves that fit.`;
}

function detectClaims(answer: string) {
  const lower = answer.toLowerCase();
  return {
    hasNumbers: /\d/.test(answer),
    hasStructure: /\b(first|second|finally|because|therefore|result)\b/.test(lower),
    hasOwnership: /\b(i built|i designed|i implemented|i led|my contribution|i optimized)\b/.test(lower),
    hasSTAR: /\b(situation|task|action|result)\b/.test(lower),
    mentionsProject: /\b(project|internship|api|database|react|node|sql|system)\b/.test(lower),
  };
}

function evaluateAnswer(type: InterviewType, answer: string): Evaluation {
  const trimmed = answer.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const claims = detectClaims(trimmed);

  const relevance = words > 18 ? 7.5 : words > 10 ? 6 : words > 4 ? 4.5 : 2.5;
  const clarity = claims.hasStructure ? 8 : words > 20 ? 6.5 : 5;
  const correctness = type === "HR" ? 7.2 : claims.mentionsProject ? 7 : words > 15 ? 6 : 4.5;
  const structure = claims.hasSTAR || claims.hasStructure ? 8 : words > 18 ? 6.5 : 4.5;
  const confidence = claims.hasNumbers || claims.hasOwnership ? 8 : words > 15 ? 6.5 : 4.5;
  const followupHandling = claims.hasOwnership && claims.hasStructure ? 7.5 : words > 15 ? 6 : 4;

  const average = (relevance + clarity + correctness + structure + confidence + followupHandling) / 6;

  let followupReason = "Increase depth";
  let feedback = "The answer needs more structure and proof points.";

  if (average >= 7.5) {
    followupReason = "Probe ownership";
    feedback = "Strong baseline. The next question should verify depth and ownership, not repeat basics.";
  } else if (average >= 6) {
    followupReason = "Clarify specifics";
    feedback = "Reasonable answer, but it still needs sharper evidence, clearer structure, or stronger outcomes.";
  } else if (!trimmed) {
    followupReason = "Recover from empty answer";
    feedback = "The candidate gave no usable answer. Simplify the next question, then rebuild confidence.";
  }

  return {
    relevance: Number(relevance.toFixed(1)),
    clarity: Number(clarity.toFixed(1)),
    correctness: Number(correctness.toFixed(1)),
    structure: Number(structure.toFixed(1)),
    confidence: Number(confidence.toFixed(1)),
    followupHandling: Number(followupHandling.toFixed(1)),
    feedback,
    followupReason,
  };
}

function nextQuestion(type: InterviewType, context: CandidateContext, evaluation: Evaluation, answer: string, turnIndex: number) {
  const projectHint = parseProjectHint(context.projects) || "your strongest project";
  const lower = answer.toLowerCase();

  if (type === "HR") {
    if (evaluation.followupReason === "Recover from empty answer") {
      return "Take a simpler version: tell me one strength, one example that proves it, and one area you are actively improving.";
    }
    if (turnIndex === 1) {
      return "Describe one failure or setback, what you changed afterward, and how that change would matter in a professional team.";
    }
    if (lower.includes("team") || lower.includes("leader")) {
      return "Give me a conflict situation from a team setting. What exactly did you do, and what did you learn about your working style?";
    }
    return "Why should a company trust you with a fresher opportunity instead of another candidate with a similar academic profile?";
  }

  if (type === "Technical") {
    if (evaluation.followupReason === "Recover from empty answer") {
      return `Let's simplify it. Pick ${projectHint} and explain the tech stack, the input/output flow, and one bug you fixed yourself.`;
    }
    if (evaluation.followupReason === "Probe ownership") {
      return `In ${projectHint}, what was your exact contribution? Walk through one architectural or design decision and why you rejected at least one alternative.`;
    }
    if (lower.includes("database") || lower.includes("sql")) {
      return "You mentioned database work. Explain one query or schema decision you made, the tradeoff involved, and how you would optimize it now.";
    }
    return `If I open ${projectHint} right now, where do you expect it to fail first under real user load, and what would you change first?`;
  }

  if (turnIndex === 1) {
    return "Panel follow-up: one of us is convinced by your answer, one is not. Defend your strongest claim with evidence, not adjectives.";
  }
  if (evaluation.followupReason === "Recover from empty answer") {
    return "Panel reset: tell us one project decision you made yourself, why you made it, and what result it created.";
  }
  if (turnIndex % 3 === 0) {
    return "From a teamwork perspective, how do you handle disagreement when your approach is rejected in review or discussion?";
  }
  return `Assume we give you a ${context.targetRole} task on day one. What part would you handle confidently, and where would you need mentoring?`;
}

function normalizeTurn(row: any) {
  return {
    id: row.id,
    turnIndex: row.turn_index,
    interviewerId: row.interviewer_id,
    interviewerName: row.interviewer_name,
    interviewerStyle: row.interviewer_style,
    question: row.question,
    candidateAnswer: row.candidate_answer,
    followupReason: row.followup_reason,
    evaluation: {
      relevance: toNumber(row.relevance),
      clarity: toNumber(row.clarity),
      correctness: toNumber(row.correctness),
      structure: toNumber(row.structure),
      confidence: toNumber(row.confidence),
      followupHandling: toNumber(row.followup_handling),
    },
    responseTime: toNumber(row.response_time),
    createdAt: row.created_at,
  };
}

async function loadTurns(sessionId: number) {
  const { rows } = await pool.query(
    `SELECT * FROM interview_turns WHERE session_id = $1 ORDER BY turn_index ASC`,
    [sessionId]
  );
  return rows.map(normalizeTurn);
}

export async function createInterviewSession(userId: number, interviewType: InterviewType, context: CandidateContext) {
  const personas = personaSets[interviewType];
  const firstQuestion = initialQuestion(interviewType, context);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sessionResult = await client.query(
      `
        INSERT INTO interview_sessions (
          user_id, interview_type, target_role, focus_area, resume_summary, projects, internships, achievements, personas, active_turn
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1)
        RETURNING *
      `,
      [
        userId,
        interviewType,
        context.targetRole,
        context.focusArea ?? null,
        context.resumeSummary ?? null,
        context.projects ?? null,
        context.internships ?? null,
        context.achievements ?? null,
        JSON.stringify(personas),
      ]
    );

    await client.query(
      `
        INSERT INTO interview_turns (
          session_id, turn_index, interviewer_id, interviewer_name, interviewer_style, question
        )
        VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [sessionResult.rows[0].id, 1, personas[0].id, personas[0].name, personas[0].style, firstQuestion]
    );

    await client.query("COMMIT");
    return getInterviewSessionById(sessionResult.rows[0].id, userId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getInterviewSessionById(sessionId: number, userId: number) {
  const { rows } = await pool.query(
    `SELECT * FROM interview_sessions WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [sessionId, userId]
  );
  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    interviewType: row.interview_type,
    targetRole: row.target_role,
    focusArea: row.focus_area,
    resumeSummary: row.resume_summary,
    projects: row.projects,
    internships: row.internships,
    achievements: row.achievements,
    status: row.status,
    activeTurn: toNumber(row.active_turn),
    personas: row.personas ?? [],
    overallScore: toNumber(row.overall_score),
    readinessScore: toNumber(row.readiness_score),
    recommendation: row.recommendation,
    finalSummary: row.final_summary ?? {},
    createdAt: row.created_at,
    completedAt: row.completed_at,
    transcript: await loadTurns(sessionId),
  };
}

export async function submitInterviewAnswer(
  userId: number,
  sessionId: number,
  answer: string,
  responseTime: number
) {
  const session = await getInterviewSessionById(sessionId, userId);
  if (!session || session.status !== "active") {
    throw new Error("Interview session not found");
  }

  const lastTurn = session.transcript[session.transcript.length - 1];
  const evaluation = evaluateAnswer(session.interviewType, answer);

  await pool.query(
    `
      UPDATE interview_turns
      SET candidate_answer = $1,
          followup_reason = $2,
          relevance = $3,
          clarity = $4,
          correctness = $5,
          structure = $6,
          confidence = $7,
          followup_handling = $8,
          response_time = $9
      WHERE id = $10
    `,
    [
      answer,
      evaluation.followupReason,
      evaluation.relevance,
      evaluation.clarity,
      evaluation.correctness,
      evaluation.structure,
      evaluation.confidence,
      evaluation.followupHandling,
      responseTime,
      lastTurn.id,
    ]
  );

  const currentTurnIndex = session.transcript.length + 1;
  const shouldFinish = currentTurnIndex > (session.interviewType === "Panel" ? 6 : 5);

  if (!shouldFinish) {
    const personaPool = session.personas as Persona[];
    const persona = personaPool[(currentTurnIndex - 1) % personaPool.length];
    const next = nextQuestion(
      session.interviewType,
      {
        targetRole: session.targetRole,
        focusArea: session.focusArea,
        resumeSummary: session.resumeSummary,
        projects: session.projects,
        internships: session.internships,
        achievements: session.achievements,
      },
      evaluation,
      answer,
      currentTurnIndex - 1
    );

    await pool.query(
      `
        INSERT INTO interview_turns (
          session_id, turn_index, interviewer_id, interviewer_name, interviewer_style, question
        )
        VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [sessionId, currentTurnIndex, persona.id, persona.name, persona.style, next]
    );

    await pool.query(`UPDATE interview_sessions SET active_turn = $1 WHERE id = $2`, [currentTurnIndex, sessionId]);
  }

  return {
    session: await getInterviewSessionById(sessionId, userId),
    completed: shouldFinish,
    answerFeedback: evaluation.feedback,
  };
}

export async function finishInterviewSession(userId: number, sessionId: number) {
  const session = await getInterviewSessionById(sessionId, userId);
  if (!session) {
    throw new Error("Interview session not found");
  }

  const answeredTurns = session.transcript.filter((turn) => turn.candidateAnswer);
  const dimensionTotals = answeredTurns.reduce(
    (acc, turn) => {
      acc.relevance += turn.evaluation.relevance;
      acc.clarity += turn.evaluation.clarity;
      acc.correctness += turn.evaluation.correctness;
      acc.structure += turn.evaluation.structure;
      acc.confidence += turn.evaluation.confidence;
      acc.followupHandling += turn.evaluation.followupHandling;
      return acc;
    },
    { relevance: 0, clarity: 0, correctness: 0, structure: 0, confidence: 0, followupHandling: 0 }
  );

  const count = answeredTurns.length || 1;
  const averages = {
    relevance: Number((dimensionTotals.relevance / count).toFixed(1)),
    clarity: Number((dimensionTotals.clarity / count).toFixed(1)),
    correctness: Number((dimensionTotals.correctness / count).toFixed(1)),
    structure: Number((dimensionTotals.structure / count).toFixed(1)),
    confidence: Number((dimensionTotals.confidence / count).toFixed(1)),
    followupHandling: Number((dimensionTotals.followupHandling / count).toFixed(1)),
  };

  const overallScore = Number((
    (averages.relevance + averages.clarity + averages.correctness + averages.structure + averages.confidence + averages.followupHandling) /
    6 *
    10
  ).toFixed(1));

  const sorted = Object.entries(averages).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 2).map(([key]) => key);
  const weakSignals = sorted.slice(-2).map(([key]) => key);
  const recommendation = weakSignals.includes("confidence")
    ? "Retry an HR round and answer with sharper evidence and fewer generic claims."
    : weakSignals.includes("correctness")
      ? "Pair one coding session with one technical interview retry focused on project depth."
      : "Run another interview in the same track and keep the structure tighter on follow-ups.";

  const summary = {
    strengths,
    weakSignals,
    expectedBetterAnswer: weakSignals.includes("structure")
      ? "Open with context, explain your action, then close with a measurable result."
      : "State your exact contribution, tradeoff, and measurable outcome more directly.",
    answerRewrite: answeredTurns[0]?.candidateAnswer
      ? `Better version: ${answeredTurns[0].candidateAnswer.trim().slice(0, 180)}${answeredTurns[0].candidateAnswer.length > 180 ? "..." : ""}`
      : "Better version: use a concise, evidence-led answer with a clear result.",
    hiringSummary: overallScore >= 72
      ? "Borderline-to-positive fresher signal. The candidate shows usable potential but still needs sharper depth on follow-ups."
      : "Current interview signal is below hiring confidence. Improve structure, ownership clarity, and evidence in answers.",
  };

  await pool.query(
    `
      UPDATE interview_sessions
      SET status = 'completed',
          overall_score = $1,
          readiness_score = $2,
          recommendation = $3,
          final_summary = $4,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND user_id = $6
    `,
    [overallScore, overallScore, recommendation, JSON.stringify({ averages, ...summary }), sessionId, userId]
  );

  return getInterviewSessionById(sessionId, userId);
}

export async function getActiveInterviewSession(userId: number) {
  const { rows } = await pool.query(
    `SELECT id FROM interview_sessions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (!rows[0]) return null;
  return getInterviewSessionById(rows[0].id, userId);
}

export async function getInterviewHistory(userId: number) {
  const { rows } = await pool.query(
    `SELECT id FROM interview_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 6`,
    [userId]
  );
  return Promise.all(rows.map((row) => getInterviewSessionById(row.id, userId)));
}

export async function getInterviewStatsByUser(userId: number) {
  const { rows } = await pool.query(
    `
      SELECT
        COUNT(*) AS completed_interviews,
        AVG(overall_score) AS avg_score,
        MAX(completed_at) AS latest_completion
      FROM interview_sessions
      WHERE user_id = $1 AND status = 'completed'
    `,
    [userId]
  );
  return rows[0] ?? null;
}

