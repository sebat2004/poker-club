"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { CreateRoomOptions } from "@/app/rooms/_lib/types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* Simple email shape check — not RFC-perfect, but enough to catch
   accidental typos before the room request is even sent. */
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CREATION_STEPS = [
  {
    title: "Checking access",
    description: "Confirming your membership and validating room settings.",
    progress: 12,
  },
  {
    title: "Starting server",
    description: "Waking up the EC2 instance if it is currently asleep.",
    progress: 28,
  },
  {
    title: "Waiting for Neko",
    description: "Waiting for Docker and the Neko Rooms API to become ready.",
    progress: 48,
  },
  {
    title: "Creating browser room",
    description: "Assigning a Firefox profile and creating your GTO room.",
    progress: 72,
  },
  {
    title: "Finalizing room",
    description: "Waiting for the browser stream to report ready.",
    progress: 88,
  },
  {
    title: "Room ready",
    description: "Refreshing the room list now.",
    progress: 100,
  },
];

export function getCreationStepCount() {
  return CREATION_STEPS.length;
}

export default function CreateRoomModal({
  isOpen,
  isCreating,
  creationStep,
  error,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  isCreating: boolean;
  creationStep: number;
  error: string;
  onClose: () => void;
  onCreate: (options: CreateRoomOptions) => void;
}) {
  const [title, setTitle] = useState("GTO Study Room");
  const [access, setAccess] = useState<CreateRoomOptions["access"]>("public");

  const [pendingEmail, setPendingEmail] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState("");

  const activeStep = CREATION_STEPS[creationStep] ?? CREATION_STEPS[0];

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

  function submitRoom() {
    onCreate({
      title: title.trim() || "GTO Study Room",
      access,
      invitedEmails: access === "private" ? invitedEmails : [],
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isCreating && !open) onClose();
      }}
    >
      <DialogContent className="glass-card max-h-[92vh] overflow-hidden rounded-2xl border border-border p-0 font-sans text-foreground shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:max-w-2xl">
        {isCreating ? (
          /* ----- Creating-progress view --------------------------------- */
          <div className="p-7 sm:p-9">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 shadow-[0_0_24px_rgba(220,68,5,0.25)]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>

            <div className="mt-7 text-center">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-primary">
                Creating room
              </p>
              <DialogTitle className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {activeStep.title}
              </DialogTitle>
              <DialogDescription className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {activeStep.description}
              </DialogDescription>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                <span>Progress</span>
                <span className="text-foreground">{activeStep.progress}%</span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-primary shadow-[0_0_12px_rgba(220,68,5,0.5)] transition-all duration-700"
                  style={{ width: `${activeStep.progress}%` }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-foreground">
                {title.trim() || "GTO Study Room"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {access === "public"
                  ? "Public club room"
                  : `Private room${
                      invitedEmails.length
                        ? ` · ${invitedEmails.length} invited email${
                            invitedEmails.length === 1 ? "" : "s"
                          }`
                        : ""
                    }`}
              </p>
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
              Keep this tab open while the server wakes up and the browser
              stream becomes ready.
            </p>
          </div>
        ) : (
          /* ----- Configuration form ------------------------------------- */
          <>
            <div className="max-h-[calc(92vh-92px)] overflow-y-auto px-7 pb-7 pt-7 sm:px-9 sm:pt-9">
              <DialogHeader className="space-y-3">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-primary">
                  New room
                </p>

                <DialogTitle className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Create GTO Wizard room
                </DialogTitle>

                <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                  Choose who can see this room and add a clear title. Rooms use
                  the best quality preset automatically.
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
                      setAccess(value as CreateRoomOptions["access"])
                    }
                    className="mt-3 grid gap-3 sm:grid-cols-2"
                  >
                    <AccessOption
                      id="public-room"
                      value="public"
                      title="Public club room"
                      description="Any paid member can see and join this room from the rooms page."
                      selected={access === "public"}
                    />
                    <AccessOption
                      id="private-room"
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
                    htmlFor="room-title"
                    className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.18em] text-foreground"
                  >
                    Room title
                  </Label>
                  <input
                    id="room-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={60}
                    placeholder="GTO Study Room"
                    className="mt-3 h-11 w-full rounded-lg border border-border bg-input px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-[0_0_20px_rgba(220,68,5,0.1)] focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Shown on the rooms page. The internal Neko room name is
                    still generated automatically.
                  </p>
                </div>

                {/* Invited emails — tag-input pattern. Each email is added
                   deliberately (Enter, comma, or Add button) and each pill
                   carries its own remove affordance, so the field stays
                   compact regardless of how many addresses are queued. */}
                {access === "private" && (
                  <div>
                    <Label
                      htmlFor="invited-emails"
                      className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.18em] text-foreground"
                    >
                      Invited emails
                    </Label>

                    <div className="mt-3 flex items-center gap-2">
                      <input
                        id="invited-emails"
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
                      <p className="mt-2 text-xs text-destructive">
                        {emailError}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        Press Enter or click Add to invite an address.
                        Invited users still need to be signed in and marked
                        as paid before they can access rooms.
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

                <div className="rounded-lg border border-border bg-white/[0.02] p-4">
                  <p className="text-sm font-medium text-foreground">
                    Quality preset
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Best available: 1280×720 @ 30 FPS, 4 CPU, 3 GB RAM per
                    room.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 bg-background-alt/40 px-7 py-5 sm:flex-row sm:justify-end sm:px-9">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitRoom}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,68,5,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Create room
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
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
