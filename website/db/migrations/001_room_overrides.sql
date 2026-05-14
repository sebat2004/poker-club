-- 001_room_overrides.sql
--
-- Room owners can edit a room's title, access setting, and invite list
-- without recreating the Neko container (Docker labels are immutable after
-- container creation). The /api/rooms GET endpoint merges these overrides
-- on top of the labels returned by Neko before responding to the client,
-- so visibility filtering, room display, and invite checks all see the
-- edited values.
--
-- Ownership is still enforced against Neko's immutable labels.created_by_email.
-- The `updated_by_email` column is audit-only.

CREATE TABLE IF NOT EXISTS room_overrides (
  room_id          TEXT PRIMARY KEY,
  title            TEXT,
  access           TEXT CHECK (access IN ('public', 'private')),
  invited_emails   TEXT,            -- comma-separated, mirroring Neko label shape
  updated_by_email TEXT NOT NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
