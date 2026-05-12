"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "@/app/lib/auth-client";

const suits = ["♠", "♥", "♣", "♦"];

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function SignInButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn.social({ provider: "google" })}
      className={`inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-orange-100 md:text-sm ${className}`}
    >
      <GoogleIcon />
      Sign in With Google
    </button>
  );
}

function HeroRoomsButton({ isSignedIn }: { isSignedIn: boolean }) {
  if (isSignedIn) {
    return (
      <Link
        href="/rooms"
        className="rounded-2xl border bg-orange-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
      >
        Open GTO Wizard Rooms
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn.social({ provider: "google" })}
      className="rounded-2xl border bg-orange-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
    >
      Open GTO Wizard Rooms
    </button>
  );
}

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <main className="min-h-screen bg-[#090604] text-[#f5eee6]">
      <div className="mx-auto max-w-6xl px-6">
        <nav className="flex items-center justify-between gap-6 border-b border-orange-500/20 py-5">
          <Link href="/" className="flex w-1/2 items-center gap-3">
            <img
              src="/logo.png"
              alt="Poker Club at OSU logo"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-orange-500/40"
            />

            <div>
              <p className="font-bold leading-none text-[#f5eee6]">
                Poker Club
              </p>
              <p className="text-xs text-orange-200/60">
                at Oregon State University
              </p>
            </div>
          </Link>

          <div className="flex items-center justify-end gap-3">
            {isPending ? (
              <span className="text-xs font-semibold text-orange-100/50 md:text-sm">
                Checking login...
              </span>
            ) : isSignedIn ? (
              <>
                <Link
                  href="/rooms"
                  className="rounded-xl border border-orange-500/30 px-4 py-2 text-center text-xs font-semibold text-orange-100 transition hover:bg-orange-500/10 hover:text-orange-300 md:text-sm"
                >
                  GTO Wizard Rooms
                </Link>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="hidden rounded-xl border border-orange-500/30 px-4 py-2 text-xs font-semibold text-orange-100 transition hover:bg-orange-500/10 hover:text-orange-300 sm:inline-flex md:text-sm"
                >
                  Sign out
                </button>
              </>
            ) : (
              <SignInButton />
            )}
          </div>
        </nav>

        <section className="relative grid min-h-[76vh] items-center gap-12 lg:grid-cols-[0.9fr_540px]">
          <div className="absolute right-4 top-16 hidden select-none gap-5 text-4xl text-orange-500/[0.08]">
            {suits.map((suit) => (
              <span key={suit}>{suit}</span>
            ))}
          </div>

          <div className="flex w-full flex-col items-center md:items-start">
            <h1 className="max-w-3xl pt-5 text-center text-5xl font-bold tracking-tight text-[#f5eee6] sm:text-7xl md:text-start">
              Learn poker.
              <br />
              <span className="text-orange-500">Play better.</span>
            </h1>

            <p className="mt-6 max-w-xl text-center text-md leading-8 text-orange-100/60 sm:text-lg md:text-start">
              A student-run club for learning poker strategy and playing
              tournaments with other Oregon State University students.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <HeroRoomsButton isSignedIn={isSignedIn} />
            </div>

            {!isPending && !isSignedIn && (
              <p className="mt-3 text-center text-xs text-orange-100/45 md:text-start">
                Sign in first to access member GTO Wizard rooms.
              </p>
            )}

            {!isPending && session?.user?.email && (
              <p className="mt-3 text-center text-xs text-orange-100/45 md:text-start">
                Signed in as{" "}
                <span className="font-semibold text-orange-300">
                  {session.user.email}
                </span>
              </p>
            )}
          </div>

          <div className="mb-4 overflow-hidden rounded-[2rem] border border-orange-500/20 bg-orange-500/[0.04] p-2 shadow-2xl shadow-orange-950/30">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.65rem] bg-zinc-950">
              <img
                src="/hero.jpg"
                alt="Poker table with cards and chips"
                className="h-full w-full object-cover object-[center_70%] opacity-85"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#090604] via-[#090604]/10 to-transparent" />

              <div className="absolute right-5 top-5">
                <img
                  src="/logo.png"
                  alt="Poker Club at OSU logo"
                  className="h-14 w-14 rounded-full object-cover shadow-xl ring-2 ring-orange-500/50 md:h-20 md:w-20"
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">
                  Poker Club - 1st Tournament
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="learn"
          className="grid gap-4 border-t border-orange-500/20 py-10 md:grid-cols-3"
        >
          <div className="rounded-3xl border border-orange-500/10 bg-orange-500/[0.03] p-5">
            <p className="mb-2 text-2xl text-orange-500">♠</p>
            <h3 className="text-xl font-bold text-[#f5eee6]">
              Learn fundamentals
            </h3>
            <p className="mt-3 leading-7 text-orange-100/55">
              Pot odds, position, hand ranges, tournament basics, and common
              mistakes.
            </p>
          </div>

          <div
            id="tools"
            className="rounded-3xl border border-orange-500/10 bg-orange-500/[0.03] p-5"
          >
            <p className="mb-2 text-2xl text-orange-500">♦</p>
            <h3 className="text-xl font-bold text-[#f5eee6]">Use club tools</h3>
            <p className="mt-3 leading-7 text-orange-100/55">
              Access shared browser rooms for approved poker resources and study
              sessions.
            </p>
          </div>

          <div className="rounded-3xl border border-orange-500/10 bg-orange-500/[0.03] p-5">
            <p className="mb-2 text-2xl text-orange-500">♣</p>
            <h3 className="text-xl font-bold text-[#f5eee6]">
              Play tournaments
            </h3>
            <p className="mt-3 leading-7 text-orange-100/55">
              Play in real weekly tournaments to practice and improve your game.
            </p>
          </div>
        </section>

        <footer className="border-t border-orange-500/20 py-8 text-sm text-orange-100/40">
          Poker Club at Oregon State University
        </footer>
      </div>
    </main>
  );
}