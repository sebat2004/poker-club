"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Room = {
  id: string;
  name: string;
  url: string;
  running: boolean;
  paused: boolean;
  isReady: boolean;
  status: string;
  created?: string;
  labels?: Record<string, string>;
  userPassword?: string;
  adminPassword?: string;
};

function formatDate(date?: string) {
  if (!date) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function StatusBadge({ room }: { room: Room }) {
  if (room.isReady) {
    return (
      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
        Ready
      </span>
    );
  }

  if (room.running) {
    return (
      <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-300 ring-1 ring-yellow-500/30">
        Starting
      </span>
    );
  }

  return (
    <span className="rounded-full bg-zinc-500/15 px-3 py-1 text-xs font-semibold text-zinc-300 ring-1 ring-zinc-500/30">
      Offline
    </span>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  async function loadRooms() {
    setIsLoadingRooms(true);
    setError("");

    try {
      const response = await fetch("/api/rooms", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load rooms");
      }

      setRooms(data.rooms ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoadingRooms(false);
    }
  }

  async function createRoom() {
    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        const details =
          typeof data.details === "string"
            ? data.details
            : JSON.stringify(data.details, null, 2);

        throw new Error(`${data.error || "Failed to create room"}: ${details}`);
      }

      await loadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  }

  useEffect(() => {
    loadRooms();

    const interval = setInterval(() => {
      loadRooms();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const readyRooms = rooms.filter((room) => room.isReady);
  const startingRooms = rooms.filter((room) => room.running && !room.isReady);

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex text-sm text-zinc-400 transition hover:text-white"
            >
              ← Back home
            </Link>

            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
              OSU Poker Club
            </p>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              GTO Wizard Rooms
            </h1>

            <p className="mt-3 max-w-2xl text-zinc-400">
              Create a temporary shared room or join one that is already
              open.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadRooms}
              disabled={isLoadingRooms}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingRooms ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={createRoom}
              disabled={isCreating}
              className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Creating..." : "Create Room"}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-400">Open Rooms</p>
            <p className="mt-2 text-3xl font-bold">{rooms.length}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-400">Ready</p>
            <p className="mt-2 text-3xl font-bold">{readyRooms.length}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-zinc-400">Starting</p>
            <p className="mt-2 text-3xl font-bold">{startingRooms.length}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Open rooms</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Rooms refresh every 10 seconds.
              </p>
            </div>
          </div>

          {isLoadingRooms && rooms.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-zinc-400">
              Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
              <h3 className="text-xl font-bold">No rooms open yet</h3>
              <p className="mt-2 text-zinc-400">
                Create a room to start a shared browser session.
              </p>
              <button
                onClick={createRoom}
                disabled={isCreating}
                className="mt-5 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Creating..." : "Create First Room"}
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <article
                  key={room.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold">{room.name}</h3>
                        <StatusBadge room={room} />
                      </div>

                      <p className="text-sm text-zinc-400">
                        Created {formatDate(room.created)}
                      </p>

                      <p className="mt-2 max-w-2xl truncate text-xs text-zinc-500">
                        {room.url}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={room.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
                          room.isReady
                            ? "bg-white text-zinc-950 hover:bg-zinc-200"
                            : "cursor-not-allowed bg-white/10 text-zinc-500"
                        }`}
                        onClick={(event) => {
                          if (!room.isReady) {
                            event.preventDefault();
                          }
                        }}
                      >
                        {room.isReady ? "Open Room" : "Starting..."}
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-2">
                    <div className="rounded-xl bg-black/30 p-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Member Password
                      </p>
                      <p className="mt-1 font-mono text-sm text-zinc-200">
                        {room.userPassword ?? "memberpass"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/30 p-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Status
                      </p>
                      <p className="mt-1 text-sm text-zinc-200">
                        {room.status}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}