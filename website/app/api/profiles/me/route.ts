import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { isAllowedMember } from "@/app/lib/membership";
import {
  getProfileByEmail,
  upsertProfile,
  type UpsertProfileInput,
  type MemberYear,
} from "@/app/lib/profiles";

export const runtime = "nodejs";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/* ---------------------------------------------------------------------------
 * GET /api/profiles/me
 *
 * Returns the signed-in user's profile (or null), their membership status,
 * and whether they should be prompted to complete their profile. Also
 * forwards their Google name/image so the client can pre-fill the modal.
 * ------------------------------------------------------------------------- */
export async function GET() {
  const session = await getSession();
  const email = session?.user?.email;

  if (!email) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const isPaidMember = isAllowedMember(email);
    const profile = await getProfileByEmail(email);
    const needsOnboarding = isPaidMember && (!profile || !profile.completedAt);

    return Response.json({
      profile,
      isPaidMember,
      needsOnboarding,
      googleName: session.user.name ?? null,
      googleImage: session.user.image ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/* ---------------------------------------------------------------------------
 * POST /api/profiles/me
 *
 * Creates or updates the signed-in user's own profile. Any signed-in user
 * can have a profile, but only paid members appear in the active list.
 * ------------------------------------------------------------------------- */

const ALLOWED_YEAR: MemberYear[] = [
  "freshman",
  "sophomore",
  "junior",
  "senior",
  "grad",
  "alumni",
];

function parseBody(
  body: unknown,
): UpsertProfileInput | { _error: string } {
  if (!body || typeof body !== "object") {
    return { _error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;

  const displayName = String(b.displayName ?? "")
    .trim()
    .slice(0, 60);
  if (!displayName) {
    return { _error: "Display name is required." };
  }

  const year = ALLOWED_YEAR.includes(b.year as MemberYear)
    ? (b.year as MemberYear)
    : null;

  return {
    displayName,
    imageUrl:
      typeof b.imageUrl === "string"
        ? b.imageUrl.trim().slice(0, 1000) || null
        : null,
    bio:
      typeof b.bio === "string"
        ? b.bio.trim().slice(0, 300) || null
        : null,
    favoriteHand:
      typeof b.favoriteHand === "string"
        ? b.favoriteHand.trim().slice(0, 60) || null
        : null,
    showFavoriteHand: b.showFavoriteHand !== false,
    major:
      typeof b.major === "string"
        ? b.major.trim().slice(0, 80) || null
        : null,
    year,
    isPublic: b.isPublic !== false,
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  const email = session?.user?.email;

  if (!email) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const input = parseBody(body);

    if ("_error" in input) {
      return Response.json({ error: input._error }, { status: 400 });
    }

    const profile = await upsertProfile(email, input);
    return Response.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
