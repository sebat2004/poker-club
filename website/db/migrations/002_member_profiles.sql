-- 002_member_profiles.sql
--
-- Public club member profiles. A profile is considered "complete" once
-- completed_at is set (after the user submits the setup form at least
-- once). Only completed, public profiles appear in the member list.
--
-- Active-vs-history is determined at read time from ALLOWED_MEMBER_EMAILS
-- so it tracks the live membership state without needing an extra column.

CREATE TABLE IF NOT EXISTS member_profiles (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT        NOT NULL UNIQUE,
  display_name     TEXT        NOT NULL DEFAULT '',
  image_url        TEXT,
  bio              TEXT,
  experience_level TEXT        CHECK (experience_level IN ('learning', 'beginner', 'intermediate', 'advanced', 'expert')),
  favorite_format  TEXT        CHECK (favorite_format  IN ('learning', 'cash', 'tournament', 'mixed')),
  major            TEXT,
  year             TEXT        CHECK (year IN ('freshman', 'sophomore', 'junior', 'senior', 'grad', 'alumni')),
  is_public        BOOLEAN     NOT NULL DEFAULT true,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS member_profiles_email_idx ON member_profiles (email);
