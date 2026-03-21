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
  question TEXT,
  selected_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN
);