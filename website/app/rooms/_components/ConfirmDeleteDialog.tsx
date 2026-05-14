"use client";

import { AlertTriangle } from "lucide-react";
import type { Room } from "@/app/rooms/_lib/types";
import { getRoomDisplayName } from "@/app/rooms/_lib/room-utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------------------------------------------------------------------------
 * ConfirmDeleteDialog
 *
 * Plain confirm dialog. No name-confirmation field — the action is
 * destructive but reversible (creator can spin up a fresh room in seconds),
 * and forcing a name retype would be friction without security value.
 * Server still verifies ownership before honoring the DELETE.
 * ------------------------------------------------------------------------- */
export default function ConfirmDeleteDialog({
  room,
  isOpen,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: {
  room: Room | null;
  isOpen: boolean;
  isDeleting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const displayName = room ? getRoomDisplayName(room) : "";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isDeleting && !open) onCancel();
      }}
    >
      <DialogContent className="glass-card max-h-[92vh] overflow-hidden rounded-2xl border border-border p-0 font-sans text-foreground shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:max-w-md">
        <div className="p-7 sm:p-8">
          <div className="flex size-11 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" strokeWidth={1.75} />
          </div>

          <DialogHeader className="mt-5 space-y-2">
            <DialogTitle className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Delete this room?
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                {displayName || "This room"}
              </span>{" "}
              will be removed and its GTO Wizard session will end. The
              profile becomes available for a new room.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border bg-background-alt/40 px-7 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-destructive px-5 text-sm font-medium text-background transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(248,113,113,0.35)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Delete room"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
