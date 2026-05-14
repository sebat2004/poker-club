"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Pencil } from "lucide-react";
import { signIn, signOut, useSession } from "@/app/lib/auth-client";
import ProfileSetupModal from "@/app/_components/ProfileSetupModal";
import type { MemberProfile } from "@/app/lib/profiles";

/* ---------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

type ProfileData = {
  profile: MemberProfile | null;
  isPaidMember: boolean;
  needsOnboarding: boolean;
  googleName: string | null;
  googleImage: string | null;
};

/* ---------------------------------------------------------------------------
 * UserNav — avatar button + dropdown; absorbs ProfileGate logic
 * ------------------------------------------------------------------------- */

export default function UserNav() {
  const { data: session, isPending } = useSession();
  const isSignedIn = Boolean(session?.user);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Fetch profile whenever the user signs in */
  useEffect(() => {
    if (!isSignedIn) {
      setProfileData(null);
      return;
    }
    fetch("/api/profiles/me")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfileData(data);
        if (data.needsOnboarding) setIsModalOpen(true);
      })
      .catch(() => {/* silent – modal can be opened manually */});
  }, [isSignedIn]);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Pending / loading ── */
  if (isPending) {
    return (
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        Checking
      </span>
    );
  }

  /* ── Signed out ── */
  if (!isSignedIn) {
    return (
      <button
        type="button"
        onClick={() => signIn.social({ provider: "google" })}
        className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      >
        Sign in
      </button>
    );
  }

  /* ── Signed in ── */
  const profile = profileData?.profile;
  const isPaidMember = profileData?.isPaidMember ?? false;
  const avatarUrl = profile?.imageUrl ?? session?.user?.image ?? null;
  const displayName = profile?.displayName ?? session?.user?.name ?? "";
  const initials =
    displayName
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <>
      <div className="relative">
        {/* Avatar button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsDropdownOpen((p) => !p)}
          aria-label="Open profile menu"
          aria-expanded={isDropdownOpen}
          className="group relative size-9 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="size-full rounded-full object-cover border border-border transition group-hover:border-primary/40"
            />
          ) : (
            <span className="flex size-full items-center justify-center rounded-full bg-primary/20 font-display text-sm font-semibold text-primary border border-primary/20 transition group-hover:border-primary/50">
              {initials}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-[#0e0e14] shadow-[0_16px_48px_rgba(0,0,0,0.65)] backdrop-blur-sm overflow-hidden"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-border">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName || "Member"}
              </p>
              <p className="mt-0.5 truncate font-mono text-[0.6rem] text-muted-foreground/60">
                {session?.user?.email}
              </p>
            </div>

            {/* Actions */}
            <div className="py-1.5">
              {isPaidMember && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-white/[0.04] transition-colors"
                >
                  <Pencil className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                  {profile?.completedAt ? "Edit profile" : "Set up profile"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
              >
                <LogOut className="size-3.5" strokeWidth={1.75} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile modal — conditionally rendered so it resets state on open */}
      {isModalOpen && (
        <ProfileSetupModal
          isOpen={isModalOpen}
          googleName={profileData?.googleName ?? null}
          googleImage={profileData?.googleImage ?? null}
          existingProfile={profileData?.profile ?? null}
          onClose={() => setIsModalOpen(false)}
          onSaved={(savedProfile) => {
            setProfileData((prev) =>
              prev ? { ...prev, profile: savedProfile, needsOnboarding: false } : prev,
            );
            setIsModalOpen(false);
          }}
        />
      )}
    </>
  );
}
