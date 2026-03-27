import { pool } from "../db";

export const saveTest = async (data: any) => {
  const {
    user_id,
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
  } = data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const testRes = await client.query(
      `INSERT INTO tests (
        user_id,
        category,
        topic,
        difficulty,
        mode,
        score,
        total,
        accuracy,
        time_taken,
        avg_time_per_q,
        correct_answers,
        wrong_answers,
        skipped
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id`,
      [
        user_id,
        category,
        topic,
        difficulty,
        mode,
        score,
        total,
        accuracy,
        time_taken,
        avg_time_per_q,
        correct_answers,
        wrong_answers,
        skipped
      ]
    );

    const testId = testRes.rows[0].id;

    for (const ans of answers.filter((item: any) => item && typeof item.question === "string")) {
      await client.query(
        `INSERT INTO answers (
          test_id,
          question_index,
          topic,
          subtopic,
          time_spent,
          question,
          selected_answer,
          correct_answer,
          is_correct
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          testId,
          ans.question_index ?? null,
          ans.topic ?? topic ?? null,
          ans.subtopic ?? null,
          ans.time_spent ?? 0,
          ans.question,
          ans.selected ?? null,
          ans.correct,
          ans.selected === ans.correct,
        ]
      );
    }

    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getTestsByUser = async (user_id: number) => {
  const { rows } = await pool.query(
    `SELECT * FROM tests WHERE user_id = $1 ORDER BY created_at DESC`,
    [user_id]
  );

  return rows;
};

export const getAllUsersPerformance = async () => {
  const { rows } = await pool.query(`
    SELECT user_id,
    SUM(score)::float / NULLIF(SUM(total), 0) AS accuracy
    FROM tests
    GROUP BY user_id
    ORDER BY accuracy DESC
  `);

  return rows;
};

export const getTopicPerformanceByUser = async (user_id: number) => {
  const { rows } = await pool.query(
    `
      SELECT
        COALESCE(a.subtopic, a.topic, t.topic) AS topic,
        COUNT(*) AS total_attempts,
        SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) AS accuracy,
        AVG(COALESCE(a.time_spent, 0)) AS avg_time
      FROM answers a
      JOIN tests t ON t.id = a.test_id
      WHERE t.user_id = $1
      GROUP BY COALESCE(a.subtopic, a.topic, t.topic)
      ORDER BY total_attempts DESC, topic ASC
    `,
    [user_id]
  );

  return rows;
};

export const getDifficultyPerformanceByUser = async (user_id: number) => {
  const { rows } = await pool.query(
    `
      SELECT
        difficulty,
        COUNT(*) AS tests,
        SUM(score)::float / NULLIF(SUM(total), 0) AS accuracy,
        AVG(avg_time_per_q) AS avg_time
      FROM tests
      WHERE user_id = $1
      GROUP BY difficulty
      ORDER BY difficulty ASC
    `,
    [user_id]
  );

  return rows;
};

export const getCodingStatsByUser = async (user_id: number) => {
  const { rows } = await pool.query(
    `
      SELECT
        COUNT(*) AS submissions,
        AVG(
          (COALESCE(passed_visible, 0) + COALESCE(passed_hidden, 0))::float /
          NULLIF(COALESCE(total_visible, 0) + COALESCE(total_hidden, 0), 0)
        ) AS avg_pass_rate,
        AVG(solve_time) AS avg_solve_time,
        MAX(created_at) AS latest_submission
      FROM coding_submissions
      WHERE user_id = $1
    `,
    [user_id]
  );

  return rows[0] ?? null;
};

export const getRecentCodingSubmissionsByUser = async (user_id: number) => {
  const { rows } = await pool.query(
    `
      SELECT problem_title, difficulty, language, solve_time, passed_visible, total_visible, passed_hidden, total_hidden, created_at
      FROM coding_submissions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `,
    [user_id]
  );

  return rows;
};

export const saveCodingSubmission = async (data: any) => {
  const {
    user_id,
    problem_title,
    difficulty,
    language,
    solve_time,
    passed_visible,
    total_visible,
    passed_hidden,
    total_hidden
  } = data;

  await pool.query(
    `
      INSERT INTO coding_submissions (
        user_id,
        problem_title,
        difficulty,
        language,
        solve_time,
        passed_visible,
        total_visible,
        passed_hidden,
        total_hidden
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `,
    [
      user_id,
      problem_title,
      difficulty,
      language,
      solve_time,
      passed_visible,
      total_visible,
      passed_hidden,
      total_hidden
    ]
  );
};
