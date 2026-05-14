import { requireRoomAccess } from "@/app/lib/roomAuth";
import {
  applyOverride,
  deleteRoomOverride,
  getRoomOverride,
  upsertRoomOverride,
} from "@/app/lib/roomOverrides";

export const runtime = "nodejs";

/* ---------------------------------------------------------------------------
 * /api/rooms/[id]
 *
 * PATCH — edit a room's title / access / invited emails. Persisted in the
 *         room_overrides table; Neko Docker labels are immutable.
 * DELETE — remove the Neko room (and its override row if any). Frees the
 *         profile_id implicitly because the container goes away.
 *
 * Ownership is enforced against Neko's immutable `created_by_email` label,
 * so an attacker can't escalate by writing to our overrides table.
 * ------------------------------------------------------------------------- */

const NEKO_ROOMS_PUBLIC_URL = process.env.NEKO_ROOMS_PUBLIC_URL;
const NEKO_ROOMS_API_URL =
  process.env.NEKO_ROOMS_API_URL || process.env.NEKO_ROOMS_PUBLIC_URL;

function getApiBaseUrl() {
  if (!NEKO_ROOMS_API_URL) {
    throw new Error("NEKO_ROOMS_API_URL is not set");
  }

  return NEKO_ROOMS_API_URL.replace(/\/$/, "");
}

function getNekoRequestHeaders(extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  const username = process.env.NEKO_PROXY_BASIC_AUTH_USER;
  const password = process.env.NEKO_PROXY_BASIC_AUTH_PASS;

  if (username && password) {
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    headers.set("Authorization", `Basic ${token}`);
  }

  return headers;
}

type NekoRoom = {
  id?: string;
  name?: string;
  labels?: Record<string, string>;
  [key: string]: unknown;
};

async function fetchNekoRoom(id: string): Promise<NekoRoom | null> {
  /* Neko's /api/rooms/:id returns 200 with the room or 404 if missing.
     We tolerate either by returning null on non-2xx so callers can decide
     how to surface the failure. */
  const response = await fetch(`${getApiBaseUrl()}/api/rooms/${id}`, {
    cache: "no-store",
    headers: getNekoRequestHeaders(),
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Neko returned ${response.status} for room ${id}`);
  }

  return (await response.json()) as NekoRoom;
}

async function deleteNekoRoom(id: string) {
	const response = await fetch(`${getApiBaseUrl()}/api/rooms/${id}`, {
		method: "DELETE",
		headers: getNekoRequestHeaders(),
	});

  if (!response.ok && response.status !== 404) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Neko refused to delete room ${id}: ${response.status} ${body}`,
    );
  }
}

/* Email comparison is case-insensitive on both sides. Always compare on
   lowercased values — Neko stores whatever string was sent. */
function ownsRoom(room: NekoRoom, email: string) {
  const owner = String(room.labels?.created_by_email ?? "").toLowerCase();
  return owner !== "" && owner === email.toLowerCase();
}

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function parseEmailList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((email) => String(email).trim().toLowerCase())
    .filter(Boolean)
    .filter((email, index, list) => list.indexOf(email) === index);
}

function sanitizeTitle(value: unknown) {
  return String(value ?? "")
    .replace(/[^\w\s@.,:+-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

async function authError(
  access: Awaited<ReturnType<typeof requireRoomAccess>>,
) {
  if (access.ok) {
    throw new Error("authError called with successful access");
  }
  return Response.json(
    {
      error: access.error,
      auth: {
        isSignedIn: access.isSignedIn,
        isPaidMember: access.isPaidMember,
        email: access.email,
      },
    },
    { status: access.status },
  );
}

/* ---- PATCH -------------------------------------------------------------- */

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireRoomAccess();
  if (!access.ok) return authError(access);

  const { id } = await ctx.params;
  if (!id) return badRequest("Missing room id.");

  let room: NekoRoom | null;
  try {
    room = await fetchNekoRoom(id);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }

  if (!room) {
    return Response.json({ error: "Room not found." }, { status: 404 });
  }

  if (!ownsRoom(room, access.email)) {
    return Response.json(
      { error: "You can only edit rooms you created." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const rawTitle = body?.title;
  const rawAccess = body?.access;
  const rawEmails = body?.invitedEmails;

  const title = rawTitle == null ? null : sanitizeTitle(rawTitle) || null;
  const access2: "public" | "private" | null =
    rawAccess === "public" || rawAccess === "private" ? rawAccess : null;
  const invitedEmails =
    access2 === "private" ? parseEmailList(rawEmails).join(",") : access2 === "public" ? "" : null;

  if (title === null && access2 === null && invitedEmails === null) {
    return badRequest("Nothing to update.");
  }

  try {
    await upsertRoomOverride({
      roomId: id,
      title,
      access: access2,
      invitedEmails,
      updatedByEmail: access.email,
    });
  } catch (error) {
    return Response.json(
      {
        error: "Could not save changes.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }

  /* Return the merged room so the client can optimistically update without
     a follow-up GET (React Query will still revalidate). */
  const override = await getRoomOverride(id);
  return Response.json({ ok: true, room: applyOverride(room, override) });
}

/* ---- DELETE ------------------------------------------------------------- */

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireRoomAccess();
  if (!access.ok) return authError(access);

  const { id } = await ctx.params;
  if (!id) return badRequest("Missing room id.");

  let room: NekoRoom | null;
  try {
    room = await fetchNekoRoom(id);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }

  if (!room) {
    /* If Neko already lost the room (e.g. cron cleanup beat us to it),
       still clean up any orphan override row so the table stays tidy. */
    await deleteRoomOverride(id).catch(() => {});
    return Response.json({ ok: true, alreadyGone: true });
  }

  if (!ownsRoom(room, access.email)) {
    return Response.json(
      { error: "You can only delete rooms you created." },
      { status: 403 },
    );
  }

  try {
    await deleteNekoRoom(id);
  } catch (error) {
    return Response.json(
      {
        error: "Could not delete room.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  /* Deleting the Neko container also frees the profile_id, since
     pickUnusedProfileId() reads from the live room list. */
  await deleteRoomOverride(id).catch(() => {});

  return Response.json({ ok: true });
}
