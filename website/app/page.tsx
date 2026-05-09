import Link from "next/link";

const suits = ["♠", "♥", "♣", "♦"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#060b08] text-white">
      <div className="mx-auto max-w-6xl px-6">
        <nav className="flex items-center justify-between border-b border-white/10 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-2xl text-emerald-400">♠</div>
            <div>
              <p className="font-bold leading-none">Poker Club</p>
              <p className="text-xs text-zinc-500">Oregon State University</p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#about" className="transition hover:text-white">
              About
            </a>
            <a href="#learn" className="transition hover:text-white">
              Learn
            </a>
            <a href="#tools" className="transition hover:text-white">
              Tools
            </a>
          </div>

          <Link
            href="/rooms"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
          >
            GTO Wizard Rooms
          </Link>
        </nav>

        <section className="relative grid min-h-[76vh] items-center gap-12 py-16 lg:grid-cols-[1fr_380px]">
          <div className="absolute right-4 top-16 hidden select-none gap-5 text-4xl text-white/[0.05] md:flex">
            {suits.map((suit) => (
              <span key={suit}>{suit}</span>
            ))}
          </div>

          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Student Poker at OSU
            </p>

            <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">
              Learn poker.
              <br />
              Play better.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              A student-run club for learning poker strategy, reviewing hands,
              and playing with other Oregon State students.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/rooms"
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400"
              >
                Open GTO Wizard Rooms
              </Link>

              <a
                href="#about"
                className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                About the Club
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.65rem] bg-zinc-900">
              <img
                src="/hero.jpg"
                alt="Poker table with cards and chips"
                className="h-full w-full object-cover opacity-90"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#060b08] via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                      Poker Club
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                      Learn the game with other students.
                  </h2>
              </div>
            </div>
          </div>
        </section>

        <section
          id="learn"
          className="grid gap-4 border-t border-white/10 py-10 md:grid-cols-3"
        >
          <div>
            <p className="mb-2 text-2xl text-emerald-400">♠</p>
            <h3 className="text-xl font-bold">Learn fundamentals</h3>
            <p className="mt-3 leading-7 text-zinc-400">
              Pot odds, position, hand ranges, tournament basics, and common
              mistakes.
            </p>
          </div>

          <div>
            <p className="mb-2 text-2xl text-emerald-400">♣</p>
            <h3 className="text-xl font-bold">Review hands</h3>
            <p className="mt-3 leading-7 text-zinc-400">
              Talk through real spots and learn why certain decisions make
              sense.
            </p>
          </div>

          <div id="tools">
            <p className="mb-2 text-2xl text-emerald-400">♦</p>
            <h3 className="text-xl font-bold">Use club tools</h3>
            <p className="mt-3 leading-7 text-zinc-400">
              Access shared browser rooms for approved poker resources and study
              sessions.
            </p>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 text-sm text-zinc-500">
          Poker Club at Oregon State University
        </footer>
      </div>
    </main>
  );
}