import type { Room } from "@/app/rooms/_lib/types";
import { isRoomReady } from "@/app/rooms/_lib/room-utils";

export default function StatusBadge({ room }: { room: Room }) {
  if (isRoomReady(room)) {
    return (
      <span className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.18em] text-primary shadow-[0_0_16px_rgba(220,68,5,0.18)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        Ready
      </span>
    );
  }

  if (room.running) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white/[0.04] px-3 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.18em] text-foreground/85">
        <span className="size-1.5 animate-pulse rounded-full bg-foreground/70" />
        Starting
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white/[0.02] px-3 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground/60" />
      Offline
    </span>
  );
}
