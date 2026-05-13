"use client";

import { signIn, signOut, useSession } from "@/app/lib/auth-client";

export default function AuthButton() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <span className="text-sm uppercase tracking-[0.1em] text-muted-foreground">
        Checking login...
      </span>
    );
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn.social({ provider: "google" })}
        className="border border-primary/45 bg-primary/[0.03] px-4 py-2 text-sm font-bold uppercase tracking-[0.1em] text-primary transition hover:bg-primary hover:text-primary-foreground"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {session.user.email}
      </span>

      <button
        type="button"
        onClick={() => signOut()}
        className="border border-border px-4 py-2 text-sm font-bold uppercase tracking-[0.1em] text-foreground transition hover:bg-foreground hover:text-background"
      >
        Sign out
      </button>
    </div>
  );
}
