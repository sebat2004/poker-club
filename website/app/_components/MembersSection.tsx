"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Users, History } from "lucide-react";
import type { PublicMemberProfile } from "@/app/lib/profiles";
import MemberCard from "@/app/_components/MemberCard";

/* ---------------------------------------------------------------------------
 * API helpers
 * ------------------------------------------------------------------------- */

type ProfilesResponse = {
  activeMembers: PublicMemberProfile[];
  memberHistory: PublicMemberProfile[];
  error?: string;
};

async function fetchProfiles(): Promise<ProfilesResponse> {
  const res = await fetch("/api/profiles", { cache: "no-store" });
  return res.json();
}

/* ---------------------------------------------------------------------------
 * Carousel row
 * ------------------------------------------------------------------------- */

function ProfileCarousel({
  profiles,
  emptyMessage,
}: {
  profiles: PublicMemberProfile[];
  emptyMessage: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (profiles.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto pb-2"
      style={{
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        /* Hide scrollbar on most browsers while keeping it functional */
        scrollbarWidth: "none",
      }}
    >
      {/* Hide WebKit scrollbar */}
      <style>{`.member-carousel::-webkit-scrollbar{display:none}`}</style>
      {profiles.map((profile) => (
        <MemberCard key={profile.id} profile={profile} />
      ))}
      {/* Right-side fade hint — fades out when we reach the end, handled
          via pure CSS so no JS scroll listener is needed. */}
      <div className="shrink-0 w-4" aria-hidden />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Section header
 * ------------------------------------------------------------------------- */

function SectionHeader({
  icon: Icon,
  label,
  title,
  count,
}: {
  icon: React.ElementType;
  label: string;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-primary">
          <Icon className="size-3" strokeWidth={2} />
          {label}
        </span>
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
      </div>
      {count > 0 && (
        <span className="shrink-0 inline-flex items-center rounded-full border border-border bg-white/[0.02] px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
          {count} {count === 1 ? "member" : "members"}
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Main section
 * ------------------------------------------------------------------------- */

export default function MembersSection() {
  const [data, setData] = useState<ProfilesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  async function load() {
    setIsLoading(true);
    setIsError(false);
    try {
      const result = await fetchProfiles();
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const activeMembers = data?.activeMembers ?? [];
  const memberHistory = data?.memberHistory ?? [];

  /* Hide the section entirely if there's nothing to show and we're not loading */
  const hasAnything = activeMembers.length > 0 || memberHistory.length > 0;
  if (!isLoading && !isError && !hasAnything) return null;

  return (
    <section className="border-b border-border py-24 md:py-28 lg:py-32">
      {/* Section intro */}
      <div className="mb-10 flex flex-col gap-3 md:mb-12">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-primary">
          The Club
        </span>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Meet the members
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Students learning, studying, and playing together every week.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="size-4 animate-spin text-primary" strokeWidth={1.75} />
          Loading members…
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Could not load member profiles.</p>
          <button
            type="button"
            onClick={load}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition hover:bg-white/[0.04] focus-visible:outline-none"
          >
            <RefreshCw className="size-3" strokeWidth={1.75} />
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-12">
          {/* Active members */}
          {activeMembers.length > 0 && (
            <div>
              <SectionHeader
                icon={Users}
                label="Active Members"
                title="Current roster"
                count={activeMembers.length}
              />
              <ProfileCarousel
                profiles={activeMembers}
                emptyMessage="No active members yet."
              />
            </div>
          )}

          {/* Member history */}
          {memberHistory.length > 0 && (
            <div>
              <SectionHeader
                icon={History}
                label="Alumni"
                title="Member history"
                count={memberHistory.length}
              />
              <div
                className="flex gap-3 overflow-x-auto pb-2"
                style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
              >
                {memberHistory.map((profile) => (
                  <div
                    key={profile.id}
                    className="opacity-70 transition-opacity hover:opacity-100"
                  >
                    <MemberCard profile={profile} />
                  </div>
                ))}
                <div className="shrink-0 w-4" aria-hidden />
              </div>
              <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground/50">
                Past members who opted into the public member list
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
