"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/app/lib/auth-client";
import ProfileSetupModal from "@/app/_components/ProfileSetupModal";
import type { MemberProfile } from "@/app/lib/profiles";

/* ---------------------------------------------------------------------------
 * ProfileGate
 *
 * Invisible component that lives on the home page. When a paid member is
 * signed in and hasn't completed their profile, it automatically opens the
 * setup modal. It also renders the "Edit profile" trigger button so paid
 * members can update their profile at any time.
 * ------------------------------------------------------------------------- */

type ProfileMeResponse = {
  profile: MemberProfile | null;
  isPaidMember: boolean;
  needsOnboarding: boolean;
  googleName: string | null;
  googleImage: string | null;
  error?: string;
};

export default function ProfileGate() {
  const { data: session } = useSession();
  const isSignedIn = Boolean(session?.user);

  const [profileData, setProfileData] = useState<ProfileMeResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profiles/me");
      if (!res.ok) return; // 401 = not signed in — silent
      const data: ProfileMeResponse = await res.json();
      setProfileData(data);
      if (data.needsOnboarding) setModalOpen(true);
    } catch {
      /* Non-critical — fail silently */
    } finally {
      setHasFetched(true);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && !hasFetched) {
      fetchProfile();
    }
  }, [isSignedIn, hasFetched, fetchProfile]);

  function handleSaved(profile: MemberProfile) {
    setProfileData((prev) =>
      prev ? { ...prev, profile, needsOnboarding: false } : null,
    );
    setModalOpen(false);
  }

  /* Only render for signed-in users who are paid members */
  if (!isSignedIn || !profileData?.isPaidMember) return null;

  return (
    <>
      {/* Edit profile button — shows once profile is fetched */}
      {hasFetched && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground transition hover:border-[var(--border-hover)] hover:bg-white/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {profileData.profile?.completedAt ? "Edit profile" : "Set up profile"}
        </button>
      )}

      <ProfileSetupModal
        isOpen={modalOpen}
        googleName={profileData.googleName}
        googleImage={profileData.googleImage}
        existingProfile={profileData.profile}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
