"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { EditRoomOptions, Room } from "@/app/rooms/_lib/types";
import {
  getRoomDisplayName,
  parseEmailList,
} from "@/app/rooms/_lib/room-utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* ---------------------------------------------------------------------------
 * EditRoomModal
 *
 * Same form chrome as CreateRoomModal but always pre-filled from the room
 * being edited. There's no multi-step progress view — the PATCH is fast
 * (DB-only, no Neko round-trip on success). Visibility filtering uses
 * the new access/invites the moment the modal closes because /api/rooms
 * GET merges overrides server-side.
 *
 * State is split across two components on purpose: the outer modal owns
 * Dialog open/close + ARIA, while <EditRoomFormBody /> is keyed by room.id
 * so React remounts it (and the form state initializes from props) any
 * time a different room is selected — no useEffect-based prop syncing.
 * ------------------------------------------------------------------------- */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditRoomModal({
  room,
  isOpen,
  isSaving,
  error,
  onClose,
  onSave,
}: {
  room: Room | null;
  isOpen: boolean;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSave: (options: EditRoomOptions) => void;
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isSaving && !open) onClose();
      }}
    >
      <DialogContent className="glass-card max-h-[92vh] overflow-hidden rounded-2xl border border-border p-0 font-sans text-foreground shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:max-w-2xl">
        {room && (
          <EditRoomFormBody
            key={room.id}
            room={room}
            isSaving={isSaving}
            error={error}
            onCancel={onClose}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditRoomFormBody({
  room,
  isSaving,
  error,
  onCancel,
  onSave,
}: {
  room: Room;
  isSaving: boolean;
  error: string;
  onCancel: () => void;
  onSave: (options: EditRoomOptions) => void;
}) {
  const [title, setTitle] = useState(() => getRoomDisplayName(room) || "");
  const [access, setAccess] = useState<EditRoomOptions["access"]>(() =>
    room.labels?.access === "private" ? "private" : "public",
  );
  const [pendingEmail, setPendingEmail] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>(() =>
    parseEmailList(room.labels?.invited_emails || ""),
  );
  const [emailError, setEmailError] = useState("");

  function addEmail() {
    const trimmed = pendingEmail.trim().toLowerCase();
    if (!trimmed) return;

    if (!EMAIL_RX.test(trimmed)) {
      setEmailError("That doesn't look like a valid email.");
      return;
    }
    if (invitedEmails.includes(trimmed)) {
      setEmailError("That email is already invited.");
      return;
    }

    setInvitedEmails([...invitedEmails, trimmed]);
    setPendingEmail("");
    setEmailError("");
  }

  function removeEmail(email: string) {
    setInvitedEmails(invitedEmails.filter((entry) => entry !== email));
  }

  function handleEmailKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addEmail();
      return;
    }
    if (event.key === "Backspace" && !pendingEmail && invitedEmails.length) {
      event.preventDefault();
      setInvitedEmails(invitedEmails.slice(0, -1));
    }
  }

  function submit() {
    onSave({
      title: title.trim() || "GTO Study Room",
      access,
      invitedEmails: access === "private" ? invitedEmails : [],
    });
  }

  return (
    <>
      <div className="max-h-[calc(92vh-92px)] overflow-y-auto px-7 pb-7 pt-7 sm:px-9 sm:pt-9">
          <DialogHeader className="space-y-3">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-primary">
              Edit room
            </p>

            <DialogTitle className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Update room settings
            </DialogTitle>

            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Change the title, access setting, or invite list. Your GTO
              Wizard session keeps running — only the room metadata is
              updated.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-7 space-y-7">
            {/* Access selector */}
            <div>
              <Label className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.18em] text-foreground">
                Room access
              </Label>

              <RadioGroup
                value={access}
                onValueChange={(value) =>
                  setAccess(value as EditRoomOptions["access"])
                }
                className="mt-3 grid gap-3 sm:grid-cols-2"
              >
                <AccessOption
                  id="edit-public-room"
                  value="public"
                  title="Public club room"
                  description="Any paid member can see and join this room from the rooms page."
                  selected={access === "public"}
                />
                <AccessOption
                  id="edit-private-room"
                  value="private"
                  title="Private room"
                  description="Only you and invited paid members can see this room."
                  selected={access === "private"}
                />
              </RadioGroup>
            </div>

            {/* Title field */}
            <div>
              <Label
                htmlFor="edit-room-title"
                className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.18em] text-foreground"
              >
                Room title
              </Label>
              <input
                id="edit-room-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={60}
                placeholder="GTO Study Room"
                className="mt-3 h-11 w-full rounded-lg border border-border bg-input px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-[0_0_20px_rgba(220,68,5,0.1)] focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Invited emails (tag input) */}
            {access === "private" && (
              <div>
                <Label
                  htmlFor="edit-invited-emails"
                  className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.18em] text-foreground"
                >
                  Invited emails
                </Label>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    id="edit-invited-emails"
                    type="email"
                    autoComplete="off"
                    value={pendingEmail}
                    onChange={(event) => {
                      setPendingEmail(event.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onKeyDown={handleEmailKeyDown}
                    placeholder="friend@oregonstate.edu"
                    aria-invalid={Boolean(emailError)}
                    className={[
                      "h-11 min-w-0 flex-1 rounded-lg border bg-input px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:shadow-[0_0_20px_rgba(220,68,5,0.1)] focus:ring-2",
                      emailError
                        ? "border-destructive/50 focus:border-destructive/60 focus:ring-destructive/20"
                        : "border-border focus:border-primary/50 focus:ring-primary/20",
                    ].join(" ")}
                  />
                  <button
                    type="button"
                    onClick={addEmail}
                    disabled={!pendingEmail.trim()}
                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="size-4" strokeWidth={2} />
                    Add
                  </button>
                </div>

                {emailError ? (
                  <p className="mt-2 text-xs text-destructive">{emailError}</p>
                ) : (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Press Enter or click Add to invite an address.
                  </p>
                )}

                {invitedEmails.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {invitedEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-white/[0.03] py-1 pl-3 pr-1 font-mono text-[0.7rem] text-foreground/85"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          aria-label={`Remove ${email}`}
                          className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)]"
                        >
                          <X className="size-3" strokeWidth={2.25} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border bg-background-alt/40 px-7 py-5 sm:flex-row sm:justify-end sm:px-9">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,68,5,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </>
  );
}

function AccessOption({
  id,
  value,
  title,
  description,
  selected,
}: {
  id: string;
  value: string;
  title: string;
  description: string;
  selected: boolean;
}) {
  return (
    <Label
      htmlFor={id}
      className={[
        "cursor-pointer rounded-xl border p-4 transition-all duration-200",
        selected
          ? "border-primary/40 bg-primary/[0.06] shadow-[0_0_24px_rgba(220,68,5,0.12)]"
          : "border-border bg-white/[0.02] hover:border-[var(--border-hover)] hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <RadioGroupItem
          id={id}
          value={value}
          className="mt-1 border-primary text-primary"
        />
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </Label>
  );
}
