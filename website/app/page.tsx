import Link from "next/link";

const suits = ["♠", "♥", "♣", "♦"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#090604] text-[#f5eee6]">
      <div className="mx-auto max-w-6xl px-6">
        <nav className="flex items-center justify-between border-b border-orange-500/20 py-5">
          <Link href="/" className="flex items-center gap-3">
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

          <Link
            href="/rooms"
            className="rounded-xl border border-orange-500/30 px-4 py-2 text-sm font-semibold text-orange-100 transition hover:bg-orange-500/10 hover:text-orange-300"
          >
            GTO Wizard Rooms
          </Link>
        </nav>

        <section className="relative grid min-h-[76vh] items-center gap-12 lg:grid-cols-[0.9fr_540px]">
          <div className="absolute right-4 top-16 hidden select-none gap-5 text-4xl text-orange-500/[0.08] md:flex">
            {suits.map((suit) => (
              <span key={suit}>{suit}</span>
            ))}
          </div>

          <div>
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-[#f5eee6] md:text-7xl">
              Learn poker.
              <br />
              <span className="text-orange-500">Play better.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-orange-100/60">
              A student-run club for learning poker strategy and playing
              tournaments with other Oregon State University students.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/rooms"
                className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-black border transition hover:bg-orange-400"
              >
                Open GTO Wizard Rooms
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-orange-500/20 bg-orange-500/[0.04] p-2 shadow-2xl shadow-orange-950/30">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.65rem] bg-zinc-950">
              <img
                src="/hero.jpg"
                alt="Poker table with cards and chips"
                className="h-full w-full object-cover object-[center_70%] opacity-85"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#090604] via-[#090604]/10 to-transparent" />

              <div className="absolute left-5 top-5">
                <img
                  src="/logo.png"
                  alt="Poker Club at OSU logo"
                  className="h-20 w-20 rounded-full object-cover shadow-xl ring-2 ring-orange-500/50"
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

          <div className="rounded-3xl border border-orange-500/10 bg-orange-500/[0.03] p-5">
            <p className="mb-2 text-2xl text-orange-500">♣</p>
            <h3 className="text-xl font-bold text-[#f5eee6]">Review hands</h3>
            <p className="mt-3 leading-7 text-orange-100/55">
              Talk through real spots and learn why certain decisions make
              sense.
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
        </section>

        <footer className="border-t border-orange-500/20 py-8 text-sm text-orange-100/40">
          Poker Club at Oregon State University
        </footer>
      </div>
    </main>
  );
}