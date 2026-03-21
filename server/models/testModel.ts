import { pool } from "../db";

export const saveTest = async (data: any) => {
  const {
  user_id,
  category,
  topic,
  difficulty,
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
        score,
        total,
        accuracy,
        time_taken,
        avg_time_per_q,
        correct_answers,
        wrong_answers,
        skipped
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id`,
      [
        user_id,
        category,
        topic,
        difficulty,
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

    for (const ans of answers) {
      await client.query(
        `INSERT INTO answers (test_id, question, selected_answer, correct_answer, is_correct)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          testId,
          ans.question,
          ans.selected,
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