"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "@/app/lib/auth-client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Room = {
  id: string;
  name: string;
  url: string;
  public_url?: string;
  join_url?: string;
  running: boolean;
  paused: boolean;
  is_ready: boolean;
  ready?: boolean;
  display_status?: string;
  status: string;
  created?: string;
  labels?: Record<string, string>;
};

type RoomsApiResponse = {
  rooms?: Room[];
  ec2_state?: string;
  server?: {
    state?: string;
    online?: boolean;
    message?: string;
  };
  auth?: {
    isSignedIn?: boolean;
    isPaidMember?: boolean;
    email?: string;
  };
  error?: string;
  details?: unknown;
};

type CreateRoomOptions = {
  mode: "balanced" | "good-720p";
  access: "public" | "private";
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

function getJoinUrl(room: Room) {
  return room.join_url || room.public_url || room.url;
}

function StatusBadge({ room }: { room: Room }) {
  if (isRoomReady(room)) {
    return (
      <span className="shrink-0 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-300 sm:px-3">
        Ready
      </span>
    );
  }

  if (room.running) {
    return (
      <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 sm:px-3">
        Starting
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-full border border-zinc-600 bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300 sm:px-3">
      Offline
    </span>
  );
}

function AuthPanel({
  authError,
  onRefresh,
}: {
  authError: { status: 401 | 403; message: string } | null;
  onRefresh: () => void;
}) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="rounded-2xl border border-orange-500/20 bg-[#120c08] p-4 text-sm text-orange-100/60">
        Checking your login...
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-orange-500/20 bg-[#120c08] p-5">
        <h2 className="text-xl font-bold text-[#f5eee6]">
          Sign in required
        </h2>
        <p className="mt-2 text-sm leading-6 text-orange-100/55">
          Sign in with Google to access Poker Club GTO Wizard rooms.
        </p>

        <button
          type="button"
          onClick={() => signIn.social({ provider: "google" })}
          className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-orange-400"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  if (authError?.status === 403) {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-[#120c08] p-5">
        <h2 className="text-xl font-bold text-[#f5eee6]">
          Membership not active
        </h2>
        <p className="mt-2 text-sm leading-6 text-orange-100/55">
          You are signed in as{" "}
          <span className="font-semibold text-orange-300">
            {session.user.email}
          </span>
          , but this account is not marked as paid for this week.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-xl border border-orange-500/30 px-4 py-2 text-sm font-bold text-orange-100 transition hover:bg-orange-500/10"
          >
            Sign out
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-orange-400"
          >
            Check again
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function CreateRoomModal({
  isOpen,
  isCreating,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreate: (options: CreateRoomOptions) => void;
}) {
  const [mode, setMode] = useState<CreateRoomOptions["mode"]>("good-720p");
  const [access, setAccess] = useState<CreateRoomOptions["access"]>("public");

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isCreating && !open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-hidden border border-orange-500/25 bg-[#120c08] p-0 font-sans text-[#f5eee6] shadow-2xl shadow-black/70 sm:max-w-xl">
        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 pb-6 pt-6 sm:px-7 sm:pt-7">
          <DialogHeader className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-400">
              New room
            </p>

            <DialogTitle className="text-2xl font-bold tracking-tight text-[#f5eee6] sm:text-3xl">
              Create GTO Wizard room
            </DialogTitle>

            <DialogDescription className="text-sm leading-6 text-orange-100/60">
              Choose the room quality and access type. Max active rooms is
              currently 2.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-7 space-y-7">
            <div>
              <Label className="text-sm font-bold text-[#f5eee6]">
                Resolution
              </Label>

              <RadioGroup
                value={mode}
                onValueChange={(value) =>
                  setMode(value as CreateRoomOptions["mode"])
                }
                className="mt-3 grid gap-3"
              >
                <Label
                  htmlFor="balanced"
                  className="cursor-pointer rounded-2xl border border-orange-500/20 bg-[#090604] p-4 transition hover:border-orange-400/50"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      id="balanced"
                      value="balanced"
                      className="mt-1 border-orange-400 text-orange-500"
                    />
                    <div>
                      <p className="font-bold text-orange-200">Balanced</p>
                      <p className="mt-1 text-sm leading-6 text-orange-100/55">
                        1152x648 @ 24 FPS. Smoother default with less server
                        load.
                      </p>
                    </div>
                  </div>
                </Label>

                <Label
                  htmlFor="good-720p"
                  className="cursor-pointer rounded-2xl border border-orange-500/20 bg-[#090604] p-4 transition hover:border-orange-400/50"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      id="good-720p"
                      value="good-720p"
                      className="mt-1 border-orange-400 text-orange-500"
                    />
                    <div>
                      <p className="font-bold text-orange-200">Good 720p</p>
                      <p className="mt-1 text-sm leading-6 text-orange-100/55">
                        1280x720 @ 30 FPS, 4 CPU, 3 GB RAM. Best quality for
                        two-room capacity.
                      </p>
                    </div>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-bold text-[#f5eee6]">
                Room access
              </Label>

              <RadioGroup
                value={access}
                onValueChange={(value) =>
                  setAccess(value as CreateRoomOptions["access"])
                }
                className="mt-3 grid gap-3 sm:grid-cols-2"
              >
                <Label
                  htmlFor="public-room"
                  className="cursor-pointer rounded-2xl border border-orange-500/20 bg-[#090604] p-4 transition hover:border-orange-400/50"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      id="public-room"
                      value="public"
                      className="mt-1 border-orange-400 text-orange-500"
                    />
                    <div>
                      <p className="font-bold text-orange-200">
                        Public club room
                      </p>
                      <p className="mt-1 text-sm leading-6 text-orange-100/55">
                        Any paid member can see and join this room from the
                        rooms page.
                      </p>
                    </div>
                  </div>
                </Label>

                <Label
                  htmlFor="private-room"
                  className="cursor-pointer rounded-2xl border border-orange-500/20 bg-[#090604] p-4 transition hover:border-orange-400/50"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      id="private-room"
                      value="private"
                      className="mt-1 border-orange-400 text-orange-500"
                    />
                    <div>
                      <p className="font-bold text-orange-200">Private room</p>
                      <p className="mt-1 text-sm leading-6 text-orange-100/55">
                        Marked private in the API. Invite-only filtering can be
                        added later.
                      </p>
                    </div>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-orange-500/15 bg-[#120c08] px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isCreating}
            className="border-orange-500/25 bg-transparent text-orange-100 hover:bg-orange-500/10 hover:text-orange-100"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isCreating}
            onClick={() => onCreate({ mode, access })}
            className="bg-orange-500 font-bold text-black hover:bg-orange-400"
          >
            {isCreating ? "Creating..." : "Create room"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RoomsPage() {
  const { data: session } = useSession();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState<{
    status: 401 | 403;
    message: string;
  } | null>(null);
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

      if (response.status === 401 || response.status === 403) {
        setRooms([]);
        setAuthError({
          status: response.status,
          message: data.error || "You do not have access to rooms.",
        });
        setStatusMessage("");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to load rooms");
      }

      setAuthError(null);
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

  async function createRoom(options: CreateRoomOptions) {
    setIsCreating(true);
    setError("");
    setStatusMessage("Starting server. This can take about 1-2 minutes...");

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      const data = (await readJsonResponse(response)) as RoomsApiResponse;

      if (response.status === 401 || response.status === 403) {
        setRooms([]);
        setAuthError({
          status: response.status,
          message: data.error || "You do not have access to rooms.",
        });
        setStatusMessage("");
        return;
      }

      if (!response.ok) {
        const details =
          typeof data.details === "string"
            ? data.details
            : data.details
              ? JSON.stringify(data.details, null, 2)
              : "";

        throw new Error(
          `${data.error || "Failed to create room"}${
            details ? `: ${details}` : ""
          }`,
        );
      }

      setAuthError(null);
      setIsCreateModalOpen(false);
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

  const canUseRooms = !authError;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090604] text-[#f5eee6]">
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        isCreating={isCreating}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createRoom}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-col gap-4 border-b border-orange-500/20 pb-5 sm:mb-8 sm:gap-5 sm:pb-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <Link
              href="/"
              className="mb-3 inline-flex text-sm text-orange-100/50 transition hover:text-orange-300 sm:mb-4"
            >
              ← Back home
            </Link>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400 sm:text-sm sm:tracking-[0.25em]">
              OSU Poker Club
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#f5eee6] sm:text-4xl md:text-5xl">
              GTO Wizard Rooms
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-orange-100/55 sm:mt-3 sm:text-base">
              Create a temporary shared room or join one that is already open.
            </p>

            {session?.user?.email && (
              <p className="mt-3 text-xs text-orange-100/45 sm:text-sm">
                Signed in as{" "}
                <span className="font-semibold text-orange-300">
                  {session.user.email}
                </span>
              </p>
            )}

            {statusMessage && (
              <p className="mt-3 hidden max-w-full rounded-full border border-orange-500/20 bg-[#140d08] px-3 py-2 text-xs leading-5 text-orange-100/70 sm:px-4 sm:text-sm md:inline-flex">
                {statusMessage}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            {session?.user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-xl border border-orange-500/25 bg-[#140d08] px-4 py-2.5 text-sm font-semibold text-orange-100 transition hover:border-orange-400/50 sm:rounded-2xl sm:px-5 sm:py-3"
              >
                Sign out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signIn.social({ provider: "google" })}
                className="rounded-xl border border-orange-500/25 bg-[#140d08] px-4 py-2.5 text-sm font-semibold text-orange-100 transition hover:border-orange-400/50 sm:rounded-2xl sm:px-5 sm:py-3"
              >
                Sign in
              </button>
            )}

            <button
              onClick={loadRooms}
              disabled={isLoadingRooms}
              className="rounded-xl border border-orange-500/25 bg-[#140d08] px-4 py-2.5 text-sm font-semibold text-orange-100 transition hover:border-orange-400/50 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-5 sm:py-3"
            >
              {isLoadingRooms ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={isCreating || !canUseRooms}
              className="col-span-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:rounded-2xl sm:px-5 sm:py-3"
            >
              {isCreating ? "Creating..." : "Create Room"}
            </button>
          </div>
        </header>

        {authError && (
          <div className="mb-5 sm:mb-6">
            <AuthPanel authError={authError} onRefresh={loadRooms} />
          </div>
        )}

        {error && (
          <div className="mb-5 max-w-full whitespace-pre-wrap break-words rounded-2xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200 sm:mb-6 sm:p-4">
            {error}
          </div>
        )}

        {!authError && (
          <>
            <section className="mb-5 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
              <div className="rounded-2xl border border-orange-500/15 p-3 sm:rounded-3xl sm:p-5">
                <p className="text-xs text-orange-100/45 sm:text-sm">Open</p>
                <p className="mt-1 text-2xl font-bold text-[#f5eee6] sm:mt-2 sm:text-3xl">
                  {rooms.length}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-500/15 p-3 sm:rounded-3xl sm:p-5">
                <p className="text-xs text-orange-100/45 sm:text-sm">Ready</p>
                <p className="mt-1 text-2xl font-bold text-[#f5eee6] sm:mt-2 sm:text-3xl">
                  {readyRooms.length}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-500/15 p-3 sm:rounded-3xl sm:p-5">
                <p className="text-xs text-orange-100/45 sm:text-sm">
                  Starting
                </p>
                <p className="mt-1 text-2xl font-bold text-[#f5eee6] sm:mt-2 sm:text-3xl">
                  {startingRooms.length}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-orange-500/20 p-3 sm:rounded-3xl sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:items-center">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-[#f5eee6] sm:text-2xl">
                    Open rooms
                  </h2>
                  <p className="mt-1 text-xs text-orange-100/45 sm:text-sm">
                    Rooms refresh every 10 seconds. Max active rooms: 2.
                  </p>
                </div>
              </div>

              {isLoadingRooms && rooms.length === 0 ? (
                <div className="rounded-2xl border border-orange-500/15 bg-[#120c08] p-6 text-center text-sm text-orange-100/50 sm:p-8">
                  Loading rooms...
                </div>
              ) : rooms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-orange-500/25 bg-[#120c08] p-6 text-center sm:p-10">
                  <h3 className="text-lg font-bold text-[#f5eee6] sm:text-xl">
                    No rooms open yet
                  </h3>
                  <p className="mt-2 text-sm text-orange-100/50 sm:text-base">
                    Create a room to start a shared browser session.
                  </p>

                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={isCreating}
                    className="mt-5 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:py-3"
                  >
                    {isCreating ? "Creating..." : "Create First Room"}
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {rooms.map((room) => {
                    const ready = isRoomReady(room);
                    const roomUrl = getRoomUrl(room);
                    const joinUrl = getJoinUrl(room);
                    const access = room.labels?.access;
                    const mode = room.labels?.mode;

                    return (
                      <article
                        key={room.id}
                        className="min-w-0 rounded-2xl border border-orange-500/15 bg-[#120c08] p-3 transition hover:border-orange-400/40 sm:p-5"
                      >
                        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                              <h3 className="min-w-0 max-w-full break-words text-base font-bold text-[#f5eee6] sm:text-xl">
                                {room.name}
                              </h3>
                              <StatusBadge room={room} />

                              {access && (
                                <span className="rounded-full border border-orange-500/20 bg-[#090604] px-2.5 py-1 text-xs font-semibold capitalize text-orange-100/60">
                                  {access}
                                </span>
                              )}

                              {mode && (
                                <span className="rounded-full border border-orange-500/20 bg-[#090604] px-2.5 py-1 text-xs font-semibold text-orange-100/60">
                                  {mode}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-orange-100/45 sm:text-sm">
                              Created {formatDate(room.created)}
                            </p>

                            <p className="mt-2 max-w-full break-all text-xs leading-5 text-orange-100/35">
                              {roomUrl}
                            </p>
                          </div>

                          <div className="flex w-full shrink-0 sm:w-auto">
                            <a
                              href={joinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`w-full rounded-xl px-4 py-2.5 text-center text-sm font-bold transition sm:w-auto sm:rounded-2xl sm:px-5 sm:py-3 ${
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
          </>
        )}
      </div>
    </main>
  );
}