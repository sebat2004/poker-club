"use client";

import { useState } from "react";
import type { PublicMemberProfile, MemberYear } from "@/app/lib/profiles";
import { HandDisplay, parseHand } from "@/app/_components/PlayingCard";

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

const YEAR_LABELS: Record<MemberYear, string> = {
  freshman:  "Freshman",
  sophomore: "Sophomore",
  junior:    "Junior",
  senior:    "Senior",
  grad:      "Graduate",
  alumni:    "Alumni",
};

/* ---------------------------------------------------------------------------
 * Avatar with initials fallback
 * ------------------------------------------------------------------------- */

function MemberAvatar({
  imageUrl,
  displayName,
  size = 48,
}: {
  imageUrl: string | null;
  displayName: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const initials =
    displayName
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  if (imageUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={displayName}
        loading="lazy"
        onError={() => setImgError(true)}
        className="rounded-full object-cover border border-white/10"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-primary/20 font-display font-semibold text-primary border border-primary/20"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * MemberCard — fixed-width card for the carousel
 * ------------------------------------------------------------------------- */

export default function MemberCard({ profile }: { profile: PublicMemberProfile }) {
  const yearLabel = profile.year ? YEAR_LABELS[profile.year] : null;
  const majorYear = [profile.major, yearLabel].filter(Boolean).join(" · ");

  const showHand =
    profile.showFavoriteHand !== false && Boolean(profile.favoriteHand);
  const parsedHand = showHand ? parseHand(profile.favoriteHand) : null;

  return (
    <article
      className="glass-card flex w-[280px] shrink-0 flex-col rounded-xl border border-border p-4 transition-all duration-300 hover:border-[var(--border-hover)] hover:bg-[rgba(26,26,36,0.9)] sm:w-[310px]"
      style={{ scrollSnapAlign: "start" }}
    >
      {/* Avatar + name row */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <MemberAvatar
            imageUrl={profile.imageUrl}
            displayName={profile.displayName}
            size={48}
          />
          {profile.isActive && (
            <span
              className="absolute -bottom-0.5 -right-0.5 size-[11px] rounded-full border-2 border-[#0a0a0f] bg-emerald-500"
              title="Active member"
            />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate font-display text-sm font-semibold tracking-tight text-foreground">
            {profile.displayName}
          </p>
          {majorYear && (
            <p className="mt-0.5 truncate font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">
              {majorYear}
            </p>
          )}
        </div>
      </div>

      {(profile.bio || (showHand && parsedHand)) && (
        <div className="mt-3 flex items-start gap-4">
          {profile.bio && (
            <p className="line-clamp-3 min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
              {profile.bio}
            </p>
          )}

          {showHand && parsedHand && (
            <div
              className={[
                "shrink-0",
                profile.bio ? "border-l border-border/50 pl-4" : "",
              ].join(" ")}
            >
              <p className="mb-1.5 font-mono text-[0.52rem] uppercase tracking-[0.12em] text-muted-foreground/45">
                Favorite hand
              </p>
              <HandDisplay hand={profile.favoriteHand} size="sm" />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
