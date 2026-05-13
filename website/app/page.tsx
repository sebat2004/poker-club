"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { signIn, signOut, useSession } from "@/app/lib/auth-client";

const features = [
  {
    label: "01",
    title: "Learn",
    description:
      "Attend lessons to learn more about fundemental poker concepts.",
  },
  {
    label: "02",
    title: "Study",
    description:
      "Shared browser rooms give paid members access to GTO Wizard premium.",
  },
  {
    label: "03",
    title: "Play",
    description:
      "Weekly tournaments turn study into reps against other students.",
  },
];

const heroStats = [
  { value: "Weekly", label: "Tournaments" },
  { value: "$10", label: "Weekly Dues" },
];

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <main className="relative min-h-screen text-foreground">
      <PageBackdrop />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 md:px-8 lg:px-12">
        <SiteNav
          isPending={isPending}
          isSignedIn={isSignedIn}
        />

        {/* ----- Hero --------------------------------------------------- */}
        <section className="grid gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16 lg:py-36">
          <div className="flex flex-col justify-center">
            <h1
              className="mt-7 max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-foreground text-balance sm:text-6xl md:text-7xl lg:text-[5.25rem]"
            >
              Learn poker.
              <br />
              <span className="text-foreground/85">Play </span>
              <span className="relative inline-block text-primary">
                weekly
                <span
                  aria-hidden
                  className="absolute -inset-x-2 -inset-y-1 -z-10 rounded-full bg-primary/15 blur-2xl"
                />
              </span>
              <span className="text-foreground/85">.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A student-run club for learning poker strategy, studying with
              shared tools, and playing tournaments against other Oregon State
              students.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <HeroPrimaryAction
                isPending={isPending}
                isSignedIn={isSignedIn}
              />

              <Link
                href="#learn"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                How it works
              </Link>
            </div>

            <dl className="mt-12 grid max-w-sm grid-cols-2 gap-8 border-t border-border pt-6">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            {!isPending && session?.user?.email && (
              <p className="mt-6 max-w-full break-words font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                Signed in as{" "}
                <span className="text-foreground">{session.user.email}</span>
              </p>
            )}
          </div>

          <HeroImageCard />
        </section>

        {/* ----- Features ----------------------------------------------- */}
        <section
          id="learn"
          className="pt-24 md:pt-28 lg:pt-32 pb-8 border-b"
        >
          <div className="mb-12 flex flex-col gap-3 md:mb-16">
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-primary">
              What we offer
            </span>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Study and Play
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              We host lessons, study tools, and tournaments to help you improve your game.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.label} {...feature} />
            ))}
          </div>
        </section>

        {/* ----- Final CTA ---------------------------------------------- */}
        <section className="pt-8">
          <div className="glass-card relative overflow-hidden rounded-2xl border border-border p-8 md:p-12 lg:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
            />

            <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-primary">
                  <Sparkles className="size-3.5" strokeWidth={1.75} />
                  Next session
                </span>
                <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl text-balance">
                  Ready to deal in?
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  $10 weekly member due. Open the GTO rooms to start training for the next tournament.
                </p>
              </div>

              <HeroPrimaryAction
                isPending={isPending}
                isSignedIn={isSignedIn}
              />
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}

function PageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[120px] md:h-[600px] md:w-[600px] md:blur-[150px]" />
      <div className="absolute bottom-0 right-0 h-[300px] w-[300px] translate-x-1/3 translate-y-1/3 rounded-full bg-primary/[0.04] blur-[100px] md:h-[500px] md:w-[500px]" />
    </div>
  );
}

function SiteNav({
  isPending,
  isSignedIn,
}: {
  isPending: boolean;
  isSignedIn: boolean;
}) {
  return (
    <nav className="flex items-center justify-between gap-6 py-6">
      <Link
        href="/"
        className="group flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      >
        <span className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-border bg-card transition group-hover:border-[var(--border-hover)]">
          <Image
            src="/logo.png"
            alt=""
            width={44}
            height={44}
            className="h-full w-full object-cover"
          />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">Poker Club</p>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            Oregon State
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {isPending ? (
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            Checking
          </span>
        ) : isSignedIn ? (
          <>
            <Link
              href="/rooms"
              className="hidden h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground focus-visible:text-[var(--accent)] focus-visible:outline-none sm:inline-flex"
            >
              Rooms
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => signIn.social({ provider: "google" })}
            className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}

function HeroPrimaryAction({
  isPending,
  isSignedIn,
}: {
  isPending: boolean;
  isSignedIn: boolean;
}) {
  const className =
    "group inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,68,5,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-60";

  if (isPending) {
    return (
      <button type="button" disabled className={className}>
        Loading…
      </button>
    );
  }

  if (isSignedIn) {
    return (
      <Link href="/rooms" className={className}>
        Open GTO rooms
        <ArrowUpRight
          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          strokeWidth={2}
        />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn.social({ provider: "google" })}
      className={className}
    >
      Sign in to play
      <ArrowUpRight
        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        strokeWidth={2}
      />
    </button>
  );
}

function HeroImageCard() {
  return (
    <div className="relative">
      <div className="glass-card overflow-hidden rounded-2xl border border-border p-2 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="relative aspect-[5/6] overflow-hidden rounded-xl bg-background-alt">
          <Image
            src="/hero.jpg"
            alt="Poker chips and cards on a felt table"
            fill
            sizes="(min-width: 1024px) 440px, 100vw"
            className="h-full w-full object-cover object-[center_60%]"
            priority
          />

          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/70 to-transparent" />

          <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-primary [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">
                First tournament
              </p>
              <p className="mt-1.5 truncate font-display text-lg font-semibold tracking-tight text-foreground [text-shadow:0_1px_10px_rgba(0,0,0,0.8)]">
                Poker Club kickoff
              </p>
            </div>
            <span className="shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-foreground/70 [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">
              2026
            </span>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-primary/[0.06] blur-3xl"
      />
    </div>
  );
}

function FeatureCard({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <article
      className="group glass-card relative flex flex-col rounded-xl border border-border p-6 transition-all duration-300 hover:scale-[1.02] hover:border-[var(--border-hover)] hover:bg-[rgba(26,26,36,0.8)] md:p-7"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-medium tracking-[0.18em] text-primary">
          {label}
        </span>
        <span
          aria-hidden
          className="h-px w-12 bg-gradient-to-r from-primary/40 to-transparent transition-all duration-300 group-hover:w-16 group-hover:from-primary/70"
        />
      </div>

      <h3 className="mt-8 font-display text-2xl font-semibold tracking-tight text-foreground md:text-[1.6rem]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-8 flex flex-col gap-4 border-t border-border py-10 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        Poker Club · Oregon State University
      </p>
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        © {new Date().getFullYear()} · Student-run
      </p>
    </footer>
  );
}
