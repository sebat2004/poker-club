"use client";

import { signIn, signOut, useSession } from "@/app/lib/auth-client";
import { PAYMENT_FORM_URL } from "@/app/_components/MembershipPaymentAlert";
import type { AuthErrorState } from "@/app/rooms/_lib/types";
import { ArrowUpRight, RefreshCw } from "lucide-react";

/* ---------------------------------------------------------------------------
 * Auth panel — shown when the user can't see rooms because they're not
 * signed in (or signed in but not paid). All three states share the same
 * glass-card chrome so the page layout stays calm.
 * ------------------------------------------------------------------------- */
export default function AuthPanel({
  authError,
  onRefresh,
}: {
  authError: AuthErrorState;
  onRefresh: () => void;
}) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="glass-card rounded-xl border border-border p-5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <RefreshCw className="size-3.5 animate-spin" strokeWidth={1.5} />
          Checking your login…
        </span>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="glass-card rounded-2xl border border-border p-7 md:p-9">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-primary">
          Sign in required
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Sign in to access rooms
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Use your Google account to access shared GTO Wizard browser rooms.
          Only paid members can create rooms; sign in to check your access.
        </p>

        <button
          type="button"
          onClick={() => signIn.social({ provider: "google" })}
          className="group mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,68,5,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          Sign in with Google
          <ArrowUpRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={2}
          />
        </button>
      </div>
    );
  }

  if (authError?.status === 403) {
    return (
      <div className="glass-card rounded-2xl border border-border p-7 md:p-9">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-primary">
          Membership not active
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Your membership isn&rsquo;t active
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          You&rsquo;re signed in as{" "}
          <span className="font-medium text-foreground">
            {session.user.email}
          </span>
          , but our records show that this account isn&rsquo;t marked as paid for this week.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={PAYMENT_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,68,5,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            Pay dues
            <ArrowUpRight className="size-4" strokeWidth={1.75} />
          </a>

          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            Sign out
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            <RefreshCw className="size-4" strokeWidth={1.75} />
            Check again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
