-- Schéma de base de données BigBlue
-- À exécuter avec : psql -h localhost -p 5432 -U <user> -d <db> -f schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  display_name  VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id            SERIAL PRIMARY KEY,
  room_code     VARCHAR(50) UNIQUE NOT NULL,
  name          VARCHAR(150) NOT NULL,
  created_by    INTEGER REFERENCES users(id),
  is_locked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_sessions (
  id            SERIAL PRIMARY KEY,
  room_id       INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  started_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_participants (
  id             SERIAL PRIMARY KEY,
  session_id     INTEGER REFERENCES room_sessions(id) ON DELETE CASCADE,
  user_id        INTEGER REFERENCES users(id),
  role           VARCHAR(20) NOT NULL DEFAULT 'participant', -- moderator | presenter | participant
  joined_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  left_at        TIMESTAMP
);

CREATE TABLE IF NOT EXISTS polls (
  id            SERIAL PRIMARY KEY,
  session_id    INTEGER REFERENCES room_sessions(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  created_by    INTEGER REFERENCES users(id),
  is_closed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id            SERIAL PRIMARY KEY,
  poll_id       INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  label         VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id            SERIAL PRIMARY KEY,
  poll_option_id INTEGER REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id       INTEGER REFERENCES users(id),
  voted_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(poll_option_id, user_id)
);

CREATE TABLE IF NOT EXISTS recordings (
  id            SERIAL PRIMARY KEY,
  session_id    INTEGER REFERENCES room_sessions(id) ON DELETE CASCADE,
  storage_key   VARCHAR(500) NOT NULL, -- chemin/objet dans Minio
  duration_sec  INTEGER,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_logs (
  id            SERIAL PRIMARY KEY,
  session_id    INTEGER REFERENCES room_sessions(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id),
  target_user_id INTEGER REFERENCES users(id),
  action        VARCHAR(50) NOT NULL, -- mute | kick | promote | revoke | lock-room
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
