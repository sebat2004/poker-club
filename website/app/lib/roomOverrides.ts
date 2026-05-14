import { db } from "@/db";

/* ---------------------------------------------------------------------------
 * Room overrides
 *
 * A room's title, access, and invite list live in Docker labels, which can't
 * be patched after the container is created. To allow editing without
 * losing the running GTO session, we store an override row keyed by Neko
 * room id and merge it on top of the labels in the response from Neko.
 *
 * Ownership is enforced against the IMMUTABLE Neko label
 * `labels.created_by_email`, not the override row — so this table is purely
 * a presentation/visibility layer.
 * ------------------------------------------------------------------------- */

export type RoomOverride = {
  room_id: string;
  title: string | null;
  access: "public" | "private" | null;
  invited_emails: string | null;
  updated_by_email: string;
  updated_at: string;
};

export type RoomLabelLike = Record<string, string> | undefined;

export async function listRoomOverrides(): Promise<RoomOverride[]> {
  return db.query<RoomOverride>("SELECT * FROM room_overrides");
}

export async function getRoomOverride(roomId: string): Promise<RoomOverride | null> {
  return db.queryOne<RoomOverride>(
    "SELECT * FROM room_overrides WHERE room_id = $1",
    [roomId],
  );
}

export async function upsertRoomOverride({
  roomId,
  title,
  access,
  invitedEmails,
  updatedByEmail,
}: {
  roomId: string;
  title: string | null;
  access: "public" | "private" | null;
  invitedEmails: string | null;
  updatedByEmail: string;
}) {
  await db.query(
    `
      INSERT INTO room_overrides
        (room_id, title, access, invited_emails, updated_by_email, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (room_id) DO UPDATE SET
        title            = EXCLUDED.title,
        access           = EXCLUDED.access,
        invited_emails   = EXCLUDED.invited_emails,
        updated_by_email = EXCLUDED.updated_by_email,
        updated_at       = NOW()
    `,
    [roomId, title, access, invitedEmails, updatedByEmail],
  );
}

export async function deleteRoomOverride(roomId: string) {
  await db.query("DELETE FROM room_overrides WHERE room_id = $1", [roomId]);
}

/* Apply an override on top of a Neko room object's labels. Override columns
   that are null leave the underlying label untouched. */
export function applyOverride<
  T extends { labels?: RoomLabelLike },
>(room: T, override: RoomOverride | null | undefined): T {
  if (!override) return room;

  const labels: Record<string, string> = { ...(room.labels ?? {}) };

  if (override.title !== null) labels.title = override.title;
  if (override.access !== null) labels.access = override.access;
  if (override.invited_emails !== null) {
    labels.invited_emails = override.invited_emails;
  }

  return { ...room, labels };
}
