-- 003_profile_schema_update.sql
--
-- Replace experience_level and favorite_format with a free-text
-- favorite_hand field ("Pocket Aces", "A-K suited", "7-2 offsuit", etc.).
-- Also widens image_url to 1000 chars to accommodate Vercel Blob URLs.

ALTER TABLE member_profiles
  DROP COLUMN IF EXISTS experience_level,
  DROP COLUMN IF EXISTS favorite_format,
  ADD COLUMN IF NOT EXISTS favorite_hand TEXT,
  ALTER COLUMN image_url TYPE TEXT; -- already TEXT, but makes intent clear
