"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ChevronDown, Loader2, Eye, EyeOff, Spade } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";

import { Label }  from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";

import { HandDisplay, PokerCard, cardLabel, type Suit } from "@/app/_components/PlayingCard";
import type { MemberProfile, MemberYear } from "@/app/lib/profiles";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

type FormState = {
  displayName: string;
  imageUrl: string;
  bio: string;
  favoriteHand: string | null;
  showFavoriteHand: boolean;
  major: string;
  year: MemberYear | "";
  isPublic: boolean;
};

type Props = {
  isOpen: boolean;
  googleName?: string | null;
  googleImage?: string | null;
  existingProfile?: MemberProfile | null;
  onClose: () => void;
  onSaved: (profile: MemberProfile) => void;
};

/* ---------------------------------------------------------------------------
 * Year options
 * ------------------------------------------------------------------------- */

const YEAR_OPTIONS: { value: MemberYear; label: string }[] = [
  { value: "freshman",  label: "Freshman"  },
  { value: "sophomore", label: "Sophomore" },
  { value: "junior",    label: "Junior"    },
  { value: "senior",    label: "Senior"    },
  { value: "grad",      label: "Graduate"  },
  { value: "alumni",    label: "Alumni"    },
];

const YEAR_LABELS: Record<MemberYear, string> = Object.fromEntries(
  YEAR_OPTIONS.map((o) => [o.value, o.label]),
) as Record<MemberYear, string>;

const CARD_RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const CARD_SUITS: Suit[] = ["s", "h", "d", "c"];

type SelectedCard = {
  rank: string;
  suit: Suit;
};

type PickerPosition = {
  top: number;
  left: number;
};

const CARD_PICKER_WIDTH = 352;
const CARD_PICKER_HEIGHT = 360;

function serializeCards(card1: SelectedCard, card2: SelectedCard) {
  return `${card1.rank}${card1.suit}${card2.rank}${card2.suit}`;
}

function parseExactCards(hand: string | null | undefined): [SelectedCard, SelectedCard] | null {
  const match = hand?.match(/^([AKQJT2-9])([shdc])([AKQJT2-9])([shdc])$/);
  if (!match) return null;

  return [
    { rank: match[1]!, suit: match[2]! as Suit },
    { rank: match[3]!, suit: match[4]! as Suit },
  ];
}

/* ---------------------------------------------------------------------------
 * Form field atoms
 * ------------------------------------------------------------------------- */

function FieldInput({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-lg border border-border bg-white/[0.035] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/35 outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
    />
  );
}

function FieldTextarea({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      className="w-full resize-none rounded-lg border border-border bg-white/[0.035] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/35 outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
    />
  );
}

function FieldSelect<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id?: string;
  value: T | "";
  onChange: (v: T | "") => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T | "")}
        className="w-full appearance-none rounded-lg border border-border bg-white/[0.035] px-3 py-2 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
      >
        <option value="" className="bg-[#1a1a24] text-muted-foreground">
          {placeholder ?? "Select…"}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#1a1a24]">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
      />
    </div>
  );
}

/* Toggle-style checkbox row */
function ToggleRow({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border bg-white/[0.02] p-3 transition-colors",
        checked
          ? "border-primary/30 bg-primary/[0.04]"
          : "border-border hover:border-[var(--border-hover)]",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-primary"
      />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </label>
  );
}

function CardPickerPopup({
  selectedHand,
  onPick,
  onClear,
}: {
  selectedHand: string | null;
  onPick: (hand: string) => void;
  onClear: () => void;
}) {
  const selectedCards = parseExactCards(selectedHand);
  const [firstCard, setFirstCard] = useState<SelectedCard | null>(
    selectedCards?.[0] ?? null,
  );

  function pickCard(card: SelectedCard) {
    if (!firstCard) {
      setFirstCard(card);
      return;
    }

    if (firstCard.rank === card.rank && firstCard.suit === card.suit) return;
    onPick(serializeCards(firstCard, card));
  }

  return (
    <div className="w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-border bg-[#0e0e14] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.75)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-foreground">
            {firstCard ? "Pick second card" : "Pick first card"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {firstCard ? `${cardLabel(firstCard.rank, firstCard.suit)} selected` : "Choose any card in the deck."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFirstCard(null);
            onClear();
          }}
          className="shrink-0 rounded-md border border-border px-2 py-1 font-mono text-[0.56rem] uppercase tracking-[0.1em] text-muted-foreground transition hover:border-[var(--border-hover)] hover:text-foreground"
        >
          Clear
        </button>
      </div>

      <div className="grid max-h-[18rem] grid-cols-4 gap-2 overflow-y-auto pr-1">
        {CARD_SUITS.map((suit) => (
          <div key={suit} className="grid gap-1.5">
            {CARD_RANKS.map((rank) => {
              const isFirstCard = firstCard?.rank === rank && firstCard.suit === suit;

              return (
                <button
                  key={`${rank}${suit}`}
                  type="button"
                  onClick={() => pickCard({ rank, suit })}
                  disabled={isFirstCard}
                  aria-label={cardLabel(rank, suit)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isFirstCard
                      ? "cursor-not-allowed border-primary/45 bg-primary/10 opacity-60"
                      : "border-border bg-white/[0.025] hover:border-[var(--border-hover)] hover:bg-white/[0.06]",
                  )}
                >
                  <PokerCard rank={rank} suit={suit} size="sm" />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Clickable avatar upload
 * ------------------------------------------------------------------------- */

function AvatarUpload({
  src,
  displayName,
  onUploaded,
}: {
  src: string;
  displayName: string;
  onUploaded: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(src);
  const [uploading, setUploading] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  useEffect(() => {
    setPreview(src);
    setImgErr(false);
  }, [src]);

  const initials =
    displayName
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const local = URL.createObjectURL(file);
    setPreview(local);
    setImgErr(false);
    setUploading(true);
    setUploadErr("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profiles/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setPreview(data.url);
      onUploaded(data.url);
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : "Upload failed.");
      setPreview(src);
      setImgErr(false);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      URL.revokeObjectURL(local);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="group relative size-[72px] shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
        aria-label="Upload profile photo"
      >
        {preview && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="avatar"
            onError={() => setImgErr(true)}
            className="size-full rounded-full object-cover border border-border"
          />
        ) : (
          <span className="flex size-full items-center justify-center rounded-full bg-primary/20 font-display text-xl font-semibold text-primary border border-primary/20">
            {initials}
          </span>
        )}

        {/* Overlay */}
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full transition-all",
            uploading ? "bg-black/60" : "bg-black/0 group-hover:bg-black/55",
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-white" strokeWidth={1.75} />
          ) : (
            <Camera className="size-4 text-white opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={1.75} />
          )}
        </span>
        {uploading && (
          <span className="absolute inset-0 rounded-full border-2 border-primary animate-pulse" />
        )}
      </button>

      <span className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-muted-foreground/50">
        {uploading ? "Uploading…" : "Click to upload"}
      </span>
      {uploadErr && (
        <p className="text-center text-[0.7rem] text-destructive">{uploadErr}</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleChange}
        aria-hidden
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Live profile-card preview
 * ------------------------------------------------------------------------- */

function ProfileCardPreview({ form }: { form: FormState }) {
  const [imgErr, setImgErr] = useState(false);
  const initials =
    form.displayName
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const majorYear = [form.major, form.year ? YEAR_LABELS[form.year] : ""]
    .filter(Boolean)
    .join(" · ");

  const showHand =
    form.favoriteHand && form.showFavoriteHand;

  // Reset imgErr when imageUrl changes
  useEffect(() => setImgErr(false), [form.imageUrl]);

  return (
    <div className="glass-card flex flex-col rounded-xl border border-border bg-[rgba(26,26,36,0.9)] p-4 w-full">
      {/* Avatar row */}
      <div className="flex items-start gap-3">
        <div className="relative size-[44px] shrink-0">
          {form.imageUrl && !imgErr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.imageUrl}
              alt="preview"
              onError={() => setImgErr(true)}
              className="size-full rounded-full object-cover border border-white/10"
            />
          ) : (
            <span className="flex size-full items-center justify-center rounded-full bg-primary/20 font-display text-sm font-semibold text-primary border border-primary/20">
              {initials}
            </span>
          )}
          {/* Active dot */}
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#0a0a0f] bg-emerald-500" />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate font-display text-sm font-semibold tracking-tight text-foreground">
            {form.displayName || (
              <span className="text-muted-foreground/40 font-normal italic">Your name</span>
            )}
          </p>
          {majorYear && (
            <p className="mt-0.5 truncate font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground">
              {majorYear}
            </p>
          )}
        </div>
      </div>

      {(form.bio || showHand) && (
        <div className="mt-3 flex items-start gap-4">
          {form.bio ? (
            <p className="line-clamp-3 min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
              {form.bio}
            </p>
          ) : null}

          {showHand && (
            <div
              className={cn(
                "shrink-0",
                form.bio && "border-l border-border/50 pl-4",
              )}
            >
              <p className="mb-1.5 font-mono text-[0.52rem] uppercase tracking-[0.12em] text-muted-foreground/45">
                Favorite hand
              </p>
              <HandDisplay hand={form.favoriteHand} size="sm" />
            </div>
          )}
        </div>
      )}

      {!form.bio && !showHand && (
        <p className="mt-3 text-xs italic text-muted-foreground/30">
          Fill in your bio to see it here.
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Main modal
 * ------------------------------------------------------------------------- */

export default function ProfileSetupModal({
  isOpen,
  googleName,
  googleImage,
  existingProfile,
  onClose,
  onSaved,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<PickerPosition | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pickBtnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  function openCardPicker() {
    if (showCardPicker) {
      setShowCardPicker(false);
      return;
    }

    if (!pickBtnRef.current || !contentRef.current) return;

    const buttonRect = pickBtnRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const minTop = -contentRect.top + 12;
    const maxLeft = Math.max(12, contentRect.width - CARD_PICKER_WIDTH - 12);

    setPickerPosition({
      top: Math.max(minTop, buttonRect.top - contentRect.top - CARD_PICKER_HEIGHT - 8),
      left: Math.min(
        Math.max(12, buttonRect.left - contentRect.left),
        maxLeft,
      ),
    });
    setShowCardPicker(true);
  }

  /* Close popup on outside mousedown */
  useEffect(() => {
    if (!showCardPicker) return;
    function onMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (
        popupRef.current   && !popupRef.current.contains(t) &&
        pickBtnRef.current && !pickBtnRef.current.contains(t)
      ) {
        setShowCardPicker(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showCardPicker]);

  const defaultForm = (): FormState => ({
    displayName: existingProfile?.displayName ?? googleName ?? "",
    imageUrl:    existingProfile?.imageUrl    ?? googleImage ?? "",
    bio:         existingProfile?.bio         ?? "",
    favoriteHand:     existingProfile?.favoriteHand     ?? null,
    showFavoriteHand: existingProfile?.showFavoriteHand ?? true,
    major: existingProfile?.major ?? "",
    year:  existingProfile?.year  ?? "",
    isPublic: existingProfile?.isPublic ?? true,
  });

  const [form, setForm] = useState<FormState>(defaultForm);

  /* Reset every time the modal opens */
  useEffect(() => {
    if (isOpen) {
      setForm(defaultForm());
      setSaveError("");
      setShowCardPicker(false);
      setPickerPosition(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.displayName.trim()) {
      setSaveError("Display name is required.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/profiles/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName:     form.displayName.trim(),
          imageUrl:        form.imageUrl.trim() || null,
          bio:             form.bio.trim() || null,
          favoriteHand:    form.favoriteHand,
          showFavoriteHand: form.showFavoriteHand,
          major:           form.major.trim() || null,
          year:            form.year || null,
          isPublic:        form.isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error ?? "Something went wrong."); return; }
      onSaved(data.profile);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const isFirstTime = !existingProfile?.completedAt;

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        {/* Dark backdrop */}
        <DialogOverlay className="bg-black/75 backdrop-blur-sm" />

        {/* Modal panel */}
        <RadixDialog.Content
          ref={contentRef}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-[calc(100%-1.5rem)] sm:max-w-xl",
            "max-h-[92dvh] overflow-visible",
            "glass-card rounded-2xl border border-border",
            "shadow-[0_32px_80px_rgba(0,0,0,0.7)]",
            "outline-none",
            /* Open / close animations */
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
          aria-describedby="profile-modal-desc"
        >
          {/* Sticky header */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-[rgba(14,14,20,0.96)] backdrop-blur-md px-6 py-4 rounded-t-2xl">
            <DialogHeader className="gap-0.5">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-primary">
                {isFirstTime ? "Welcome" : "Edit Profile"}
              </span>
              <DialogTitle className="font-display text-lg font-semibold tracking-tight text-foreground">
                {isFirstTime ? "Set up your member profile" : "Update your profile"}
              </DialogTitle>
              {isFirstTime && (
                <DialogDescription id="profile-modal-desc" className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Appears on the club home page so other members know who you are.
                </DialogDescription>
              )}
            </DialogHeader>

            <RadixDialog.Close asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                {/* X icon inline */}
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </Button>
            </RadixDialog.Close>
          </div>

          <div className="max-h-[calc(92dvh-6.75rem)] overflow-y-auto rounded-b-2xl">
            {/* Form body */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">

            {/* ── Avatar + Name ─────────────────────────────────── */}
            <div className="flex items-center gap-4">
              <AvatarUpload
                src={form.imageUrl}
                displayName={form.displayName}
                onUploaded={(url) => set("imageUrl", url)}
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor="displayName" className="mb-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Display Name *
                </Label>
                <FieldInput
                  id="displayName"
                  value={form.displayName}
                  onChange={(v) => set("displayName", v)}
                  placeholder="Your name"
                  maxLength={60}
                />
              </div>
            </div>

            {/* ── Bio + Favorite Hand (side by side) ────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-0">
              {/* Bio column */}
              <div className="sm:pr-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="bio" className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Bio
                  </Label>
                  <span className="font-mono text-[0.58rem] text-muted-foreground/40">
                    {form.bio.length}/300
                  </span>
                </div>
                <FieldTextarea
                  id="bio"
                  value={form.bio}
                  onChange={(v) => set("bio", v)}
                  placeholder="Why did you join Poker Club? What's your game?"
                  maxLength={300}
                  rows={4}
                />
              </div>

              {/* Favorite Hand column */}
              <div className="relative sm:pl-4 sm:border-l sm:border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Spade className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <Label className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Favorite Hand
                  </Label>
                </div>

                {/* Current selection preview */}
                <div className="mb-3 min-h-[2rem] flex items-center">
                  {form.favoriteHand ? (
                    <HandDisplay hand={form.favoriteHand} size="sm" />
                  ) : (
                    <span className="font-mono text-[0.58rem] text-muted-foreground/35 uppercase tracking-[0.08em]">
                      No hand selected
                    </span>
                  )}
                </div>

                {/* Pick / Change button */}
                <button
                  ref={pickBtnRef}
                  type="button"
                  onClick={openCardPicker}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/[0.03] px-3 h-8 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground hover:border-[var(--border-hover)] hover:text-foreground transition-all"
                >
                  {form.favoriteHand ? "Change" : "Pick hand"}
                </button>

                {/* Show / hide toggle */}
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => set("showFavoriteHand", !form.showFavoriteHand)}
                    disabled={!form.favoriteHand}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2.5 h-7 font-mono text-[0.58rem] uppercase tracking-[0.1em] transition-all",
                      !form.favoriteHand
                        ? "border-border text-muted-foreground/30 cursor-not-allowed"
                        : form.showFavoriteHand
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-border bg-white/[0.03] text-muted-foreground hover:border-[var(--border-hover)]",
                    )}
                  >
                    {form.showFavoriteHand ? (
                      <Eye className="size-3" strokeWidth={1.75} />
                    ) : (
                      <EyeOff className="size-3" strokeWidth={1.75} />
                    )}
                    {form.showFavoriteHand ? "Shown" : "Hidden"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Major + Year ──────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="major" className="mb-1.5 block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Major
                </Label>
                <FieldInput
                  id="major"
                  value={form.major}
                  onChange={(v) => set("major", v)}
                  placeholder="e.g. CS"
                  maxLength={80}
                />
              </div>
              <div>
                <Label htmlFor="year" className="mb-1.5 block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Year
                </Label>
                <FieldSelect
                  id="year"
                  value={form.year}
                  onChange={(v) => set("year", v)}
                  options={YEAR_OPTIONS}
                  placeholder="Select…"
                />
              </div>
            </div>

            {/* ── Visibility ────────────────────────────────────── */}
            <ToggleRow
              checked={form.isPublic}
              onChange={(v) => set("isPublic", v)}
              label="Show me on the member list"
              description="Your profile will appear on the public club home page. Uncheck to stay hidden."
            />

            {/* ── Live card preview ─────────────────────────────── */}
            <div>
              <p className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground/50">
                Preview
              </p>
              <ProfileCardPreview form={form} />
            </div>

            {/* ── Error ─────────────────────────────────────────── */}
            {saveError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {saveError}
              </p>
            )}

            {/* ── Actions ───────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <RadixDialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition hover:border-[var(--border-hover)] hover:bg-white/[0.04] hover:text-foreground focus-visible:outline-none"
                >
                  {isFirstTime ? "Skip for now" : "Cancel"}
                </button>
              </RadixDialog.Close>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,68,5,0.35)] active:scale-[0.98] focus-visible:outline-none disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
                    Saving…
                  </>
                ) : isFirstTime ? (
                  "Save profile"
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
            </form>
          </div>

          {showCardPicker && pickerPosition && (
            <div
              ref={popupRef}
              className="absolute z-[80]"
              style={{
                left: pickerPosition.left,
                top: pickerPosition.top,
              }}
            >
              <CardPickerPopup
                selectedHand={form.favoriteHand}
                onPick={(hand) => {
                  set("favoriteHand", hand);
                  setShowCardPicker(false);
                }}
                onClear={() => set("favoriteHand", null)}
              />
            </div>
          )}
        </RadixDialog.Content>
      </DialogPortal>
    </RadixDialog.Root>
  );
}
