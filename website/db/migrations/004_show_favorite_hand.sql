-- 004_show_favorite_hand.sql
--
-- Lets users keep their favorite hand stored privately while hiding it
-- from their public profile card. Defaults to true so existing rows
-- continue to display the hand (no visible change on deploy).

ALTER TABLE member_profiles
  ADD COLUMN IF NOT EXISTS show_favorite_hand BOOLEAN NOT NULL DEFAULT true;
