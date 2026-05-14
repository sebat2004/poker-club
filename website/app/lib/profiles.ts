import { db } from "@/db";
import { isAllowedMember } from "@/app/lib/membership";

/* ---------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

export type MemberYear =
  | "freshman"
  | "sophomore"
  | "junior"
  | "senior"
  | "grad"
  | "alumni";

export type MemberProfile = {
  id: string;
  email: string;
  displayName: string;
  imageUrl: string | null;
  bio: string | null;
  favoriteHand: string | null;
  showFavoriteHand: boolean;
  major: string | null;
  year: MemberYear | null;
  isPublic: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicMemberProfile = MemberProfile & { isActive: boolean };

export type UpsertProfileInput = {
  displayName: string;
  imageUrl?: string | null;
  bio?: string | null;
  favoriteHand?: string | null;
  showFavoriteHand?: boolean;
  major?: string | null;
  year?: MemberYear | null;
  isPublic?: boolean;
};

/* ---------------------------------------------------------------------------
 * Internal helpers
 * ------------------------------------------------------------------------- */

function rowToProfile(row: Record<string, unknown>): MemberProfile {
  const toIso = (v: unknown) =>
    v instanceof Date ? v.toISOString() : (v as string | null);

  return {
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string,
    imageUrl: row.image_url as string | null,
    bio: row.bio as string | null,
    favoriteHand: row.favorite_hand as string | null,
    showFavoriteHand: (row.show_favorite_hand as boolean) ?? true,
    major: row.major as string | null,
    year: (row.year as MemberYear) ?? null,
    isPublic: row.is_public as boolean,
    completedAt: toIso(row.completed_at),
    createdAt: toIso(row.created_at) as string,
    updatedAt: toIso(row.updated_at) as string,
  };
}

/* ---------------------------------------------------------------------------
 * Queries
 * ------------------------------------------------------------------------- */

export async function getProfileByEmail(
  email: string,
): Promise<MemberProfile | null> {
  const row = await db.queryOne(
    "SELECT * FROM member_profiles WHERE email = $1",
    [email.toLowerCase()],
  );
  return row ? rowToProfile(row) : null;
}

export async function upsertProfile(
  email: string,
  input: UpsertProfileInput,
): Promise<MemberProfile> {
  const row = await db.queryOne(
    `INSERT INTO member_profiles
       (email, display_name, image_url, bio,
        favorite_hand, show_favorite_hand, major, year,
        is_public, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
     ON CONFLICT (email) DO UPDATE SET
       display_name       = EXCLUDED.display_name,
       image_url          = EXCLUDED.image_url,
       bio                = EXCLUDED.bio,
       favorite_hand      = EXCLUDED.favorite_hand,
       show_favorite_hand = EXCLUDED.show_favorite_hand,
       major              = EXCLUDED.major,
       year               = EXCLUDED.year,
       is_public          = EXCLUDED.is_public,
       completed_at       = COALESCE(member_profiles.completed_at, now()),
       updated_at         = now()
     RETURNING *`,
    [
      email.toLowerCase(),
      input.displayName.trim(),
      input.imageUrl?.trim() || null,
      input.bio?.trim() || null,
      input.favoriteHand?.trim() || null,
      input.showFavoriteHand ?? true,
      input.major?.trim() || null,
      input.year ?? null,
      input.isPublic ?? true,
    ],
  );
  return rowToProfile(row!);
}

export async function getPublicProfiles(): Promise<{
  activeMembers: PublicMemberProfile[];
  memberHistory: PublicMemberProfile[];
}> {
  const rows = await db.query(
    `SELECT * FROM member_profiles
     WHERE is_public = true AND completed_at IS NOT NULL
     ORDER BY completed_at DESC`,
  );

  const profiles = rows.map(rowToProfile);
  const activeMembers = profiles
    .filter((p) => isAllowedMember(p.email))
    .map((p) => ({ ...p, isActive: true as const }));
  const memberHistory = profiles
    .filter((p) => !isAllowedMember(p.email))
    .map((p) => ({ ...p, isActive: false as const }));

  return { activeMembers, memberHistory };
}
