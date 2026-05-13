"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
} from "lucide-react";
import { signIn, signOut, useSession } from "@/app/lib/auth-client";

import AuthPanel from "@/app/rooms/_components/AuthPanel";
import CreateRoomModal, {
  getCreationStepCount,
} from "@/app/rooms/_components/CreateRoomModal";
import RoomCard from "@/app/rooms/_components/RoomCard";

import type { CreateRoomOptions, Room } from "@/app/rooms/_lib/types";
import {
  getRoomsAuthError,
  getRoomsErrorMessage,
  useCreateRoomMutation,
  useRoomsQuery,
} from "@/app/rooms/_hooks/useRooms";

const MAX_ROOM_SLOTS = 3;

export default function RoomsPage() {
  const { data: session } = useSession();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationStep, setCreationStep] = useState(0);
  /* `isFinishing` keeps the progress view rendered after the mutation
     resolves so we can hold the 100% / "Room ready" state long enough to
     read — without it, react-query flips `isPending` to false the instant
     the request returns and the modal would flash back to the form view
     during the close dwell. */
  const [isFinishing, setIsFinishing] = useState(false);
  const creationTimerRef = useRef<number | null>(null);

  const roomsQuery = useRoomsQuery();
  const createRoomMutation = useCreateRoomMutation();

  const roomsData = roomsQuery.data;
  const rooms = roomsData?.rooms ?? [];
  const authError = getRoomsAuthError(roomsQuery.error);

  const pageError =
    roomsQuery.isError && !authError
      ? getRoomsErrorMessage(roomsQuery.error)
      : "";

  const createError = createRoomMutation.isError
    ? getRoomsErrorMessage(createRoomMutation.error)
    : "";
  const maxRoomSlots = roomsData?.max_active_rooms ?? MAX_ROOM_SLOTS;
  const visibleRooms = rooms.slice(0, maxRoomSlots) as Room[];
  const canCreateAnotherRoom = visibleRooms.length < maxRoomSlots;

  function clearCreationTimer() {
    if (creationTimerRef.current !== null) {
      window.clearInterval(creationTimerRef.current);
      creationTimerRef.current = null;
    }
  }

  function openCreateModal() {
    createRoomMutation.reset();
    setIsCreateModalOpen(true);
  }

  function startCreationProgress() {
    clearCreationTimer();
    setCreationStep(0);

    creationTimerRef.current = window.setInterval(() => {
      setCreationStep((currentStep) =>
        Math.min(currentStep + 1, getCreationStepCount() - 2),
      );
    }, 4500);
  }

  async function createRoom(options: CreateRoomOptions) {
    startCreationProgress();

    try {
      await createRoomMutation.mutateAsync(options);

      clearCreationTimer();
      /* Hold the progress view ourselves while we animate to 100% — the
         mutation just resolved, so isPending is false, but we don't want
         the modal to flicker back to the form during the close dwell. */
      setIsFinishing(true);
      setCreationStep(getCreationStepCount() - 1);

      /* 1200ms is enough for the bar's 700ms width transition to fully
         fill, then linger at 100% for ~500ms so the success state is
         actually readable. Previously this was 750ms — shorter than the
         bar's own animation, which is why the fill looked incomplete. */
      window.setTimeout(() => {
        setIsCreateModalOpen(false);
        setIsFinishing(false);
        setCreationStep(0);
      }, 1200);
    } catch {
      setCreationStep(0);
      setIsFinishing(false);
    } finally {
      clearCreationTimer();
    }
  }

  useEffect(() => {
    return () => {
      clearCreationTimer();
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden text-foreground">
      <PageBackdrop />

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        /* `isCreating` covers both "request in flight" and "holding the
           success state". Treating them the same in the modal keeps the
           progress view stable across the entire create flow. */
        isCreating={createRoomMutation.isPending || isFinishing}
        creationStep={creationStep}
        error={createError}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createRoom}
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-6 md:px-8 md:py-8">
        <RoomsNav
          isFetching={roomsQuery.isFetching}
          isSignedIn={Boolean(session?.user)}
          onRefresh={() => roomsQuery.refetch()}
        />

        <header className="mt-6 flex flex-col gap-3 border-b border-border pb-6 md:mt-8 md:flex-row md:items-end md:justify-between md:pb-7">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]">
              GTO Wizard rooms
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Shared browser rooms for club study sessions. Refreshes every
              10 seconds.
            </p>
          </div>

          {session?.user?.email && (
            <p className="min-w-0 truncate font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground md:text-right">
              <span className="text-muted-foreground/70">Signed in · </span>
              <span className="text-foreground">{session.user.email}</span>
            </p>
          )}
        </header>

        {/* ----- Auth gate --------------------------------------------- */}
        {authError && (
          <div className="mt-6">
            <AuthPanel
              authError={authError}
              onRefresh={() => roomsQuery.refetch()}
            />
          </div>
        )}

        {/* ----- Top-level error --------------------------------------- */}
        {pageError && (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm leading-relaxed text-destructive">
            <p className="break-words whitespace-pre-wrap">{pageError}</p>
          </div>
        )}

        {/* ----- Rooms section (the actual job of this page) ----------- */}
        {!authError && (
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">
                Rooms
              </span>
              <CapacityPill used={visibleRooms.length} max={maxRoomSlots} />
            </div>

            {roomsQuery.isLoading && rooms.length === 0 ? (
              <div className="glass-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                <RefreshCw
                  className="mx-auto mb-2.5 size-4 animate-spin text-primary"
                  strokeWidth={1.75}
                />
                Loading rooms…
              </div>
            ) : (
              <div className="grid gap-3">
                {visibleRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}

                {canCreateAnotherRoom && (
                  <CreateRoomSlot
                    onCreate={openCreateModal}
                    isCreating={createRoomMutation.isPending}
                  />
                )}

                {!canCreateAnotherRoom && (
                  <div className="rounded-xl border border-border bg-white/[0.02] px-5 py-3.5 text-sm text-muted-foreground">
                    All room slots are currently in use.
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function PageBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute -top-48 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[120px] md:h-[500px] md:w-[500px]" />
    </div>
  );
}

function RoomsNav({
  isFetching,
  isSignedIn,
  onRefresh,
}: {
  isFetching: boolean;
  isSignedIn: boolean;
  onRefresh: () => void;
}) {
  return (
    <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:text-[var(--accent)] focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Back home
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
            strokeWidth={1.75}
          />
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>

        {isSignedIn ? (
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            <LogOut className="size-3.5" strokeWidth={1.75} />
            Sign out
          </button>
        ) : (
          <button
            type="button"
            onClick={() => signIn.social({ provider: "google" })}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            <LogIn className="size-3.5" strokeWidth={1.75} />
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}

function CapacityPill({ used, max }: { used: number; max: number }) {
  const full = used >= max;
  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.7rem]",
        full
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-white/[0.02] text-muted-foreground",
      ].join(" ")}
    >
      <span
        className={full ? "font-semibold text-primary" : "font-semibold text-foreground"}
      >
        {used}/{max}
      </span>
      <span className="uppercase tracking-[0.18em]">slots</span>
    </div>
  );
}

function CreateRoomSlot({
  onCreate,
  isCreating = false,
}: {
  onCreate?: () => void;
  isCreating?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={isCreating}
      className="group rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] px-5 py-3.5 text-left transition-all duration-200 hover:border-primary/70 hover:bg-primary/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary transition-transform duration-200 group-hover:rotate-90">
            <Plus className="size-3.5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">Create room</p>
            <p className="truncate text-xs text-muted-foreground">
              Spin up another shared browser room.
            </p>
          </div>
        </div>

        <span className="shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-primary/80">
          {isCreating ? "Creating…" : "New"}
        </span>
      </div>
    </button>
  );
}
