import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone VARCHAR(15),
      role VARCHAR(20) DEFAULT 'student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email))`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      category VARCHAR(50),
      topic VARCHAR(100),
      difficulty VARCHAR(20),
      mode VARCHAR(20) DEFAULT 'timed',
      score INTEGER,
      total INTEGER,
      accuracy FLOAT,
      time_taken INTEGER,
      avg_time_per_q FLOAT,
      correct_answers INTEGER,
      wrong_answers INTEGER,
      skipped INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE tests ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'timed'`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS answers (
      id SERIAL PRIMARY KEY,
      test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
      question_index INTEGER,
      topic VARCHAR(100),
      subtopic VARCHAR(100),
      time_spent INTEGER DEFAULT 0,
      question TEXT,
      selected_answer TEXT,
      correct_answer TEXT,
      is_correct BOOLEAN
    )
  `);

  await pool.query(`
    ALTER TABLE answers
    ADD COLUMN IF NOT EXISTS question_index INTEGER,
    ADD COLUMN IF NOT EXISTS topic VARCHAR(100),
    ADD COLUMN IF NOT EXISTS subtopic VARCHAR(100),
    ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coding_submissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      problem_title TEXT,
      difficulty VARCHAR(20),
      language VARCHAR(20),
      solve_time INTEGER DEFAULT 0,
      passed_visible INTEGER DEFAULT 0,
      total_visible INTEGER DEFAULT 0,
      passed_hidden INTEGER DEFAULT 0,
      total_hidden INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS tests_user_created_idx ON tests (user_id, created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS tests_user_category_idx ON tests (user_id, category)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS answers_test_idx ON answers (test_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS answers_topic_idx ON answers (topic, subtopic)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS coding_submissions_user_created_idx ON coding_submissions (user_id, created_at DESC)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mock_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      track_id VARCHAR(50) NOT NULL,
      track_name VARCHAR(100) NOT NULL,
      mode VARCHAR(20) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      readiness_score FLOAT DEFAULT 0,
      passed BOOLEAN DEFAULT FALSE,
      strongest_round VARCHAR(100),
      weakest_round VARCHAR(100),
      next_priority TEXT,
      recommended_follow_up TEXT,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS mock_sessions_user_status_idx ON mock_sessions (user_id, status, started_at DESC)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mock_round_results (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES mock_sessions(id) ON DELETE CASCADE,
      round_key VARCHAR(50) NOT NULL,
      round_label VARCHAR(120) NOT NULL,
      round_type VARCHAR(20) NOT NULL,
      section VARCHAR(50),
      topic VARCHAR(100),
      difficulty VARCHAR(20),
      time_limit INTEGER DEFAULT 0,
      cutoff_score FLOAT DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      score FLOAT DEFAULT 0,
      max_score FLOAT DEFAULT 100,
      accuracy FLOAT DEFAULT 0,
      summary TEXT,
      completed_at TIMESTAMP
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS mock_round_results_session_idx ON mock_round_results (session_id)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS interview_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      interview_type VARCHAR(20) NOT NULL,
      interaction_mode VARCHAR(20) DEFAULT 'text',
      target_role VARCHAR(100) NOT NULL,
      focus_area VARCHAR(120),
      resume_summary TEXT,
      projects TEXT,
      internships TEXT,
      achievements TEXT,
      status VARCHAR(20) DEFAULT 'active',
      active_turn INTEGER DEFAULT 0,
      personas JSONB DEFAULT '[]'::jsonb,
      overall_score FLOAT DEFAULT 0,
      readiness_score FLOAT DEFAULT 0,
      recommendation TEXT,
      final_summary JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE interview_sessions
    ADD COLUMN IF NOT EXISTS interaction_mode VARCHAR(20) DEFAULT 'text'
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS interview_sessions_user_status_idx ON interview_sessions (user_id, status, created_at DESC)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS interview_turns (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES interview_sessions(id) ON DELETE CASCADE,
      turn_index INTEGER NOT NULL,
      interviewer_id VARCHAR(50),
      interviewer_name VARCHAR(100),
      interviewer_style VARCHAR(100),
      question TEXT NOT NULL,
      candidate_answer TEXT,
      followup_reason TEXT,
      relevance FLOAT DEFAULT 0,
      clarity FLOAT DEFAULT 0,
      correctness FLOAT DEFAULT 0,
      structure FLOAT DEFAULT 0,
      confidence FLOAT DEFAULT 0,
      followup_handling FLOAT DEFAULT 0,
      response_time INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS interview_turns_session_turn_idx ON interview_turns (session_id, turn_index)`);
}
