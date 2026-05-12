"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Room = {
  id: string;
  name: string;
  url: string;
  public_url?: string;
  running: boolean;
  paused: boolean;
  is_ready: boolean;
  ready?: boolean;
  display_status?: string;
  status: string;
  created?: string;
  labels?: Record<string, string>;
  userPassword?: string;
  adminPassword?: string;
};

type RoomsApiResponse = {
  rooms?: Room[];
  ec2_state?: string;
  server?: {
    state?: string;
    online?: boolean;
    message?: string;
  };
  error?: string;
  details?: unknown;
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

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || "Server returned invalid JSON");
  }
}

function isRoomReady(room: Room) {
  return room.is_ready === true;
}

function getRoomUrl(room: Room) {
  return room.public_url || room.url;
}

function StatusBadge({ room }: { room: Room }) {
  if (isRoomReady(room)) {
    return (
      <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
        Ready
      </span>
    );
  }

  if (room.running) {
    return (
      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
        Starting
      </span>
    );
  }

  return (
    <span className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
      Offline
    </span>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  function updateStatusMessage(data: RoomsApiResponse) {
    const state = data.server?.state || data.ec2_state;

    if (state === "stopped") {
      setStatusMessage("Server is asleep. Create a room to wake it up.");
    } else if (state === "stopping") {
      setStatusMessage("Server is shutting down.");
    } else if (state === "pending") {
      setStatusMessage("Server is starting...");
    } else if (state === "running" || data.server?.online) {
      setStatusMessage("Server is online.");
    } else {
      setStatusMessage(data.server?.message ?? "Server is offline.");
    }
  }

  async function loadRooms() {
    setIsLoadingRooms(true);
    setError("");

    try {
      const response = await fetch("/api/rooms", {
        cache: "no-store",
      });

      const data = (await readJsonResponse(response)) as RoomsApiResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to load rooms");
      }

      setRooms(data.rooms ?? []);
      updateStatusMessage(data);
    } catch (err) {
      setRooms([]);
      setStatusMessage("Server is offline.");
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoadingRooms(false);
    }
  }

  async function createRoom() {
    setIsCreating(true);
    setError("");
    setStatusMessage("Starting server. This can take about 1-2 minutes...");

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        const details =
          typeof data.details === "string"
            ? data.details
            : data.details
              ? JSON.stringify(data.details, null, 2)
              : "";

        throw new Error(
          `${data.error || "Failed to create room"}${details ? `: ${details}` : ""}`,
        );
      }

      setStatusMessage("Room created. Refreshing rooms...");
      await loadRooms();
    } catch (err) {
      setStatusMessage("Could not create room.");
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

  const readyRooms = rooms.filter(isRoomReady);
  const startingRooms = rooms.filter(
    (room) => room.running && !isRoomReady(room),
  );

  return (
    <main className="min-h-screen bg-[#090604] text-[#f5eee6]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-orange-500/20 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex text-sm text-orange-100/50 transition hover:text-orange-300"
            >
              ← Back home
            </Link>

            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">
              OSU Poker Club
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-[#f5eee6] md:text-5xl">
              GTO Wizard Rooms
            </h1>

            <p className="mt-3 max-w-2xl text-orange-100/55">
              Create a temporary shared room or join one that is already open.
            </p>

            {statusMessage && (
              <p className="mt-3 inline-flex rounded-full border border-orange-500/20 bg-[#140d08] px-4 py-2 text-sm text-orange-100/70">
                {statusMessage}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadRooms}
              disabled={isLoadingRooms}
              className="rounded-2xl border border-orange-500/25 bg-[#140d08] px-5 py-3 text-sm font-semibold text-orange-100 transition hover:border-orange-400/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingRooms ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={createRoom}
              disabled={isCreating}
              className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Creating..." : "Create Room"}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 whitespace-pre-wrap rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-orange-500/15 p-5">
            <p className="text-sm text-orange-100/45">Open Rooms</p>
            <p className="mt-2 text-3xl font-bold text-[#f5eee6]">
              {rooms.length}
            </p>
          </div>

          <div className="rounded-3xl border border-orange-500/15 p-5">
            <p className="text-sm text-orange-100/45">Ready</p>
            <p className="mt-2 text-3xl font-bold text-[#f5eee6]">
              {readyRooms.length}
            </p>
          </div>

          <div className="rounded-3xl border border-orange-500/15 p-5">
            <p className="text-sm text-orange-100/45">Starting</p>
            <p className="mt-2 text-3xl font-bold text-[#f5eee6]">
              {startingRooms.length}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-orange-500/20 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#f5eee6]">
                Open rooms
              </h2>
              <p className="mt-1 text-sm text-orange-100/45">
                Rooms refresh every 10 seconds.
              </p>
            </div>
          </div>

          {isLoadingRooms && rooms.length === 0 ? (
            <div className="rounded-2xl border border-orange-500/15 bg-[#120c08] p-8 text-center text-orange-100/50">
              Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-orange-500/25 bg-[#120c08] p-10 text-center">
              <h3 className="text-xl font-bold text-[#f5eee6]">
                No rooms open yet
              </h3>
              <p className="mt-2 text-orange-100/50">
                Create a room to start a shared browser session.
              </p>

              <button
                onClick={createRoom}
                disabled={isCreating}
                className="mt-5 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Creating..." : "Create First Room"}
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {rooms.map((room) => {
                const ready = isRoomReady(room);
                const roomUrl = getRoomUrl(room);

                return (
                  <article
                    key={room.id}
                    className="rounded-2xl border border-orange-500/15 bg-[#120c08] p-5 transition hover:border-orange-400/40"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold text-[#f5eee6]">
                            {room.name}
                          </h3>
                          <StatusBadge room={room} />
                        </div>

                        <p className="text-sm text-orange-100/45">
                          Created {formatDate(room.created)}
                        </p>

                        <p className="mt-2 max-w-2xl truncate text-xs text-orange-100/35">
                          {roomUrl}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <a
                          href={roomUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
                            ready
                              ? "bg-orange-500 text-black hover:bg-orange-400"
                              : "cursor-not-allowed bg-[#1a110b] text-orange-100/35"
                          }`}
                          onClick={(event) => {
                            if (!ready) {
                              event.preventDefault();
                            }
                          }}
                        >
                          {ready ? "Open Room" : "Starting..."}
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}