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
