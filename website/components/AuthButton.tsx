"use client";

import { signIn, signOut, useSession } from "@/app/lib/auth-client";

export default function AuthButton() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <span className="text-sm text-orange-100/60">Checking login...</span>;
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn.social({ provider: "google" })}
        className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-black hover:bg-orange-400"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-orange-100/70 sm:inline">
        {session.user.email}
      </span>

      <button
        type="button"
        onClick={() => signOut()}
        className="rounded-full border border-orange-500/40 px-4 py-2 text-sm font-bold text-orange-100 hover:bg-orange-500/10"
      >
        Sign out
      </button>
    </div>
  );
}