CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone VARCHAR(15),
  role VARCHAR(20) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),

  category VARCHAR(50),
  topic VARCHAR(100),
  difficulty VARCHAR(20),
  mode VARCHAR(20) DEFAULT 'timed',

  score INTEGER,
  total INTEGER,

  -- 🔥 NEW ANALYTICS FIELDS
  accuracy FLOAT,
  time_taken INTEGER,
  avg_time_per_q FLOAT,

  correct_answers INTEGER,
  wrong_answers INTEGER,
  skipped INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id),
  question_index INTEGER,
  topic VARCHAR(100),
  subtopic VARCHAR(100),
  time_spent INTEGER DEFAULT 0,
  question TEXT,
  selected_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN
);

CREATE TABLE coding_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  problem_title TEXT,
  difficulty VARCHAR(20),
  language VARCHAR(20),
  solve_time INTEGER DEFAULT 0,
  passed_visible INTEGER DEFAULT 0,
  total_visible INTEGER DEFAULT 0,
  passed_hidden INTEGER DEFAULT 0,
  total_hidden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mock_sessions (
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
);

CREATE TABLE mock_round_results (
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
);

CREATE TABLE interview_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  interview_type VARCHAR(20) NOT NULL,
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
);

CREATE TABLE interview_turns (
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
);
