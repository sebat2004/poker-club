import type { Room } from "@/app/rooms/_lib/types";
import {
  formatDate,
  getJoinUrl,
  getRoomDisplayName,
  isRoomReady,
  parseEmailList,
} from "@/app/rooms/_lib/room-utils";
import StatusBadge from "@/app/rooms/_components/StatusBadge";
import { ArrowUpRight, Clock, Globe2, Lock } from "lucide-react";

export default function RoomCard({ room }: { room: Room }) {
  const ready = isRoomReady(room);
  const joinUrl = getJoinUrl(room);
  const access = room.labels?.access;
  const displayName = getRoomDisplayName(room);
  const invitedEmails = parseEmailList(room.labels?.invited_emails || "");

  return (
    <article className="glass-card group min-w-0 rounded-xl border border-border px-5 py-4 transition-all duration-300 hover:border-[var(--border-hover)] hover:bg-[rgba(26,26,36,0.8)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h3 className="min-w-0 max-w-full break-words font-display text-lg font-semibold tracking-tight text-foreground">
              {displayName}
            </h3>
            <StatusBadge room={room} />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <p className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" strokeWidth={1.5} />
              Created {formatDate(room.created)}
            </p>

            <p className="inline-flex items-center gap-1.5 capitalize">
              {access === "private" ? (
                <Lock className="size-3.5" strokeWidth={1.5} />
              ) : (
                <Globe2 className="size-3.5" strokeWidth={1.5} />
              )}
              {access === "private" ? "Private room" : "Public club room"}
            </p>
          </div>

          {access === "private" && (
            <p className="mt-1.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
              {invitedEmails.length > 0
                ? `${invitedEmails.length} invited email${
                    invitedEmails.length === 1 ? "" : "s"
                  }`
                : "Only visible to the creator"}
            </p>
          )}
        </div>

        {ready ? (
          <a
            href={joinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,68,5,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] lg:w-auto"
          >
            Open room
            <ArrowUpRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={2}
            />
          </a>
        ) : (
          <span className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-white/[0.02] px-5 text-sm font-medium text-muted-foreground lg:w-auto">
            Starting…
          </span>
        )}
      </div>
    </article>
  );
}
