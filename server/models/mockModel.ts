import { pool } from "../db";

type MockRoundTemplate = {
  key: string;
  label: string;
  roundType: "aptitude" | "coding";
  section: string | null;
  topic: string | null;
  difficulty: "Easy" | "Medium" | "Hard";
  timeLimit: number;
  cutoffScore: number;
};

type MockTrack = {
  id: string;
  name: string;
  description: string;
  target: string;
  modes: Array<"aptitude" | "coding" | "full">;
  rounds: MockRoundTemplate[];
};

export const mockTracks: MockTrack[] = [
  {
    id: "service-based",
    name: "Service-Based",
    description: "Balanced fresher track with timed aptitude and one medium coding round.",
    target: "Wipro, Infosys, TCS style hiring",
    modes: ["aptitude", "coding", "full"],
    rounds: [
      { key: "quant", label: "Quantitative Round", roundType: "aptitude", section: "numerical", topic: "Arithmetic", difficulty: "Medium", timeLimit: 18, cutoffScore: 62 },
      { key: "logical", label: "Logical Round", roundType: "aptitude", section: "logical", topic: "Logical Deduction", difficulty: "Medium", timeLimit: 15, cutoffScore: 60 },
      { key: "verbal", label: "Verbal Round", roundType: "aptitude", section: "verbal", topic: "Reading Comprehension", difficulty: "Medium", timeLimit: 12, cutoffScore: 58 },
      { key: "coding", label: "Coding Round", roundType: "coding", section: "coding", topic: "Array and String problems", difficulty: "Medium", timeLimit: 35, cutoffScore: 55 },
    ],
  },
  {
    id: "product-based",
    name: "Product-Based",
    description: "Sharper difficulty with fewer rounds and stronger coding expectations.",
    target: "Product startups and software product firms",
    modes: ["aptitude", "coding", "full"],
    rounds: [
      { key: "quant", label: "Advanced Quant Round", roundType: "aptitude", section: "numerical", topic: "Data Interpretation", difficulty: "Hard", timeLimit: 20, cutoffScore: 68 },
      { key: "logical", label: "Logic Round", roundType: "aptitude", section: "logical", topic: "Seating Arrangement", difficulty: "Hard", timeLimit: 18, cutoffScore: 65 },
      { key: "coding", label: "Coding Round", roundType: "coding", section: "coding", topic: "DSA implementation", difficulty: "Hard", timeLimit: 45, cutoffScore: 68 },
    ],
  },
  {
    id: "aptitude-heavy",
    name: "Aptitude-Heavy",
    description: "High-volume aptitude track that emphasizes quant, logic, and verbal readiness.",
    target: "Mass campus drives with strong aptitude screening",
    modes: ["aptitude", "full"],
    rounds: [
      { key: "quant", label: "Quantitative Round", roundType: "aptitude", section: "numerical", topic: "Percentage", difficulty: "Medium", timeLimit: 20, cutoffScore: 64 },
      { key: "logical", label: "Logical Round", roundType: "aptitude", section: "logical", topic: "Data Arrangement", difficulty: "Medium", timeLimit: 18, cutoffScore: 62 },
      { key: "verbal", label: "Verbal Round", roundType: "aptitude", section: "verbal", topic: "Para Jumbles", difficulty: "Medium", timeLimit: 15, cutoffScore: 60 },
    ],
  },
];

export function getMockTrack(trackId: string) {
  return mockTracks.find((track) => track.id === trackId);
}

function roundTemplatesForMode(track: MockTrack, mode: "aptitude" | "coding" | "full") {
  if (mode === "full") return track.rounds;
  return track.rounds.filter((round) => round.roundType === mode);
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function normalizeRound(row: any) {
  return {
    id: row.id,
    roundKey: row.round_key,
    roundLabel: row.round_label,
    roundType: row.round_type,
    section: row.section,
    topic: row.topic,
    difficulty: row.difficulty,
    timeLimit: toNumber(row.time_limit),
    cutoffScore: toNumber(row.cutoff_score),
    status: row.status,
    score: toNumber(row.score),
    maxScore: toNumber(row.max_score),
    accuracy: toNumber(row.accuracy),
    summary: row.summary,
    completedAt: row.completed_at,
  };
}

export async function startMockSession(userId: number, trackId: string, mode: "aptitude" | "coding" | "full") {
  const track = getMockTrack(trackId);
  if (!track) {
    throw new Error("Unknown mock track");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE mock_sessions SET status = 'archived' WHERE user_id = $1 AND status = 'active'`, [userId]);

    const sessionResult = await client.query(
      `
        INSERT INTO mock_sessions (user_id, track_id, track_name, mode)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [userId, track.id, track.name, mode]
    );

    const session = sessionResult.rows[0];
    const rounds = roundTemplatesForMode(track, mode);

    for (const round of rounds) {
      await client.query(
        `
          INSERT INTO mock_round_results (
            session_id, round_key, round_label, round_type, section, topic, difficulty, time_limit, cutoff_score
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `,
        [
          session.id,
          round.key,
          round.label,
          round.roundType,
          round.section,
          round.topic,
          round.difficulty,
          round.timeLimit,
          round.cutoffScore,
        ]
      );
    }

    await client.query("COMMIT");
    return getMockSessionById(session.id, userId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function loadRounds(sessionId: number) {
  const { rows } = await pool.query(
    `SELECT * FROM mock_round_results WHERE session_id = $1 ORDER BY id ASC`,
    [sessionId]
  );
  return rows.map(normalizeRound);
}

export async function getMockSessionById(sessionId: number, userId: number) {
  const { rows } = await pool.query(
    `SELECT * FROM mock_sessions WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [sessionId, userId]
  );

  if (!rows[0]) return null;

  const rounds = await loadRounds(sessionId);
  return {
    id: rows[0].id,
    trackId: rows[0].track_id,
    trackName: rows[0].track_name,
    mode: rows[0].mode,
    status: rows[0].status,
    readinessScore: toNumber(rows[0].readiness_score),
    passed: Boolean(rows[0].passed),
    strongestRound: rows[0].strongest_round,
    weakestRound: rows[0].weakest_round,
    nextPriority: rows[0].next_priority,
    recommendedFollowUp: rows[0].recommended_follow_up,
    startedAt: rows[0].started_at,
    completedAt: rows[0].completed_at,
    rounds,
  };
}

export async function getActiveMockSession(userId: number) {
  const { rows } = await pool.query(
    `SELECT id FROM mock_sessions WHERE user_id = $1 AND status = 'active' ORDER BY started_at DESC LIMIT 1`,
    [userId]
  );
  if (!rows[0]) return null;
  return getMockSessionById(rows[0].id, userId);
}

export async function getMockSessionHistory(userId: number) {
  const { rows } = await pool.query(
    `SELECT id FROM mock_sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 6`,
    [userId]
  );
  return Promise.all(rows.map((row) => getMockSessionById(row.id, userId)));
}

function deriveMockSummary(rounds: ReturnType<typeof normalizeRound>[]) {
  const completedRounds = rounds.filter((round) => round.status === "completed");
  const averageScore = completedRounds.length
    ? completedRounds.reduce((sum, round) => sum + round.score, 0) / completedRounds.length
    : 0;

  const sorted = [...completedRounds].sort((a, b) => b.score - a.score);
  const strongest = sorted[0]?.roundLabel ?? null;
  const weakest = sorted[sorted.length - 1]?.roundLabel ?? null;

  const failedRound = completedRounds.find((round) => round.score < round.cutoffScore);
  const allDone = rounds.every((round) => round.status === "completed");
  const passed = allDone && !failedRound && averageScore >= 60;

  let nextPriority = "Complete the remaining rounds to unlock a readiness decision.";
  let recommendedFollowUp = "Keep your mock cadence steady and review one weak area after each round.";

  if (allDone) {
    if (failedRound) {
      nextPriority = `${failedRound.roundLabel} is below cutoff. Repair that round before retaking the full mock.`;
      recommendedFollowUp = failedRound.roundType === "coding"
        ? "Take one coding round and one technical interview retry before the next full mock."
        : `Do a timed ${failedRound.section} drill, then reattempt this mock track.`;
    } else if (averageScore >= 75) {
      nextPriority = "You are stable enough to move to a harder mock track or tougher interview simulation.";
      recommendedFollowUp = "Shift one session each week to a harder track so progress does not plateau.";
    } else {
      nextPriority = "Your cutoff performance is acceptable, but one more mock can raise consistency.";
      recommendedFollowUp = "Review mistakes, then repeat this track within 3 days to improve reliability.";
    }
  }

  return {
    readinessScore: Number(averageScore.toFixed(1)),
    strongestRound: strongest,
    weakestRound: weakest,
    passed,
    nextPriority,
    recommendedFollowUp,
    allDone,
  };
}

export async function completeMockRound(
  userId: number,
  sessionId: number,
  roundKey: string,
  payload: { score: number; maxScore?: number; accuracy?: number; summary?: string }
) {
  const session = await getMockSessionById(sessionId, userId);
  if (!session) {
    throw new Error("Mock session not found");
  }

  const maxScore = toNumber(payload.maxScore || 100) || 100;
  const scorePercent = maxScore ? (toNumber(payload.score) / maxScore) * 100 : toNumber(payload.score);
  const accuracy = payload.accuracy !== undefined ? toNumber(payload.accuracy) : scorePercent / 100;

  await pool.query(
    `
      UPDATE mock_round_results
      SET status = 'completed',
          score = $1,
          max_score = $2,
          accuracy = $3,
          summary = $4,
          completed_at = CURRENT_TIMESTAMP
      WHERE session_id = $5 AND round_key = $6
    `,
    [scorePercent, maxScore, accuracy, payload.summary ?? null, sessionId, roundKey]
  );

  const refreshed = await getMockSessionById(sessionId, userId);
  if (!refreshed) {
    throw new Error("Failed to refresh mock session");
  }
  const summary = deriveMockSummary(refreshed.rounds);

  await pool.query(
    `
      UPDATE mock_sessions
      SET readiness_score = $1,
          strongest_round = $2,
          weakest_round = $3,
          passed = $4,
          next_priority = $5,
          recommended_follow_up = $6,
          status = CASE WHEN $7 THEN 'completed' ELSE status END,
          completed_at = CASE WHEN $7 THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = $8 AND user_id = $9
    `,
    [
      summary.readinessScore,
      summary.strongestRound,
      summary.weakestRound,
      summary.passed,
      summary.nextPriority,
      summary.recommendedFollowUp,
      summary.allDone,
      sessionId,
      userId,
    ]
  );

  return getMockSessionById(sessionId, userId);
}

export async function getMockStatsByUser(userId: number) {
  const { rows } = await pool.query(
    `
      SELECT
        COUNT(*) AS total_mocks,
        AVG(readiness_score) AS avg_readiness,
        SUM(CASE WHEN passed THEN 1 ELSE 0 END) AS passed_mocks,
        MAX(completed_at) AS latest_completion
      FROM mock_sessions
      WHERE user_id = $1 AND status = 'completed'
    `,
    [userId]
  );
  return rows[0] ?? null;
}

export async function getRecentCompletedMocks(userId: number) {
  const { rows } = await pool.query(
    `
      SELECT track_name, mode, readiness_score, passed, strongest_round, weakest_round, completed_at
      FROM mock_sessions
      WHERE user_id = $1 AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 5
    `,
    [userId]
  );
  return rows;
}

