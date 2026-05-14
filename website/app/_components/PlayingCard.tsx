"use client";

/* ---------------------------------------------------------------------------
 * Playing card primitives
 *
 * PokerCard   — renders a single playing card (rank + suit) as a styled div.
 * HandDisplay — parses a hand string ("AKs", "AKo", "AA", or "AsKh") and
 *               renders two PokerCards side by side.
 * parseHand   — exported so the range chart and preview can share the logic.
 * ------------------------------------------------------------------------- */

export type Suit = "s" | "h" | "d" | "c";

const SUIT_SYMBOLS: Record<Suit, string> = {
  s: "♠",
  h: "♥",
  d: "♦",
  c: "♣",
};

const SUIT_NAMES: Record<Suit, string> = {
  s: "Spades",
  h: "Hearts",
  d: "Diamonds",
  c: "Clubs",
};

const IS_RED: Record<Suit, boolean> = {
  s: false,
  h: true,
  d: true,
  c: false,
};

const SIZES = {
  sm: { w: 28, h: 38, rankPx: 10, suitPx: 13, radius: 3, padding: "2px 3px" },
  md: { w: 38, h: 52, rankPx: 14, suitPx: 17, radius: 4, padding: "3px 4px" },
  lg: { w: 52, h: 72, rankPx: 19, suitPx: 24, radius: 5, padding: "4px 6px" },
};

export type CardSize = keyof typeof SIZES;

/* ---------------------------------------------------------------------------
 * Single card
 * ------------------------------------------------------------------------- */

export function PokerCard({
  rank,
  suit,
  size = "sm",
}: {
  rank: string;
  suit: Suit;
  size?: CardSize;
}) {
  const { w, h, rankPx, suitPx, radius, padding } = SIZES[size];
  const isRed = IS_RED[suit];

  return (
    <div
      aria-label={`${rank}${SUIT_SYMBOLS[suit]}`}
      style={{
        width: w,
        height: h,
        background: "linear-gradient(135deg, #fffff5 0%, #f5f0e8 100%)",
        border: "1px solid rgba(0,0,0,0.18)",
        borderRadius: radius,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "stretch",
        padding,
        boxShadow:
          "0 2px 6px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,255,255,0.08) inset",
        color: isRed ? "#b91c1c" : "#111111",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontWeight: 800,
        userSelect: "none",
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {/* Rank — top-left */}
      <span style={{ fontSize: rankPx, alignSelf: "flex-start" }}>{rank}</span>
      {/* Suit — centered */}
      <span
        style={{ fontSize: suitPx, alignSelf: "center", marginBottom: 2 }}
      >
        {SUIT_SYMBOLS[suit]}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Hand parsing
 *
 * Input examples: "AA", "AKs", "AKo", "72o"
 * Output: two card descriptors + a human-readable label.
 * ------------------------------------------------------------------------- */

export type ParsedHand = {
  card1: { rank: string; suit: Suit };
  card2: { rank: string; suit: Suit };
  label: string;
};

export function parseHand(hand: string | null | undefined): ParsedHand | null {
  if (!hand || hand.length < 2) return null;

  const exactCardMatch = hand.match(/^([AKQJT2-9])([shdc])([AKQJT2-9])([shdc])$/);
  if (exactCardMatch) {
    const [, r1, s1, r2, s2] = exactCardMatch;

    return {
      card1: { rank: r1!, suit: s1! as Suit },
      card2: { rank: r2!, suit: s2! as Suit },
      label: `${r1}${SUIT_SYMBOLS[s1! as Suit]} ${r2}${SUIT_SYMBOLS[s2! as Suit]}`,
    };
  }

  const r1 = hand[0]!;
  const r2 = hand[1]!;
  const type = hand[2]; // "s" | "o" | undefined

  if (!type) {
    // Pocket pair — show two different suits so the cards look distinct
    return {
      card1: { rank: r1, suit: "s" },
      card2: { rank: r2, suit: "h" },
      label: `Pocket ${r1}s`,
    };
  }

  if (type === "s") {
    return {
      card1: { rank: r1, suit: "s" },
      card2: { rank: r2, suit: "s" },
      label: `${r1}${r2} Suited`,
    };
  }

  return {
    card1: { rank: r1, suit: "s" },
    card2: { rank: r2, suit: "h" },
    label: `${r1}${r2} Offsuit`,
  };
}

/* ---------------------------------------------------------------------------
 * Two-card hand display
 * ------------------------------------------------------------------------- */

export function HandDisplay({
  hand,
  size = "sm",
}: {
  hand: string | null | undefined;
  size?: CardSize;
}) {
  const parsed = parseHand(hand);
  if (!parsed) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        gap: size === "sm" ? 3 : 5,
        alignItems: "flex-end",
      }}
    >
      <PokerCard rank={parsed.card1.rank} suit={parsed.card1.suit} size={size} />
      <PokerCard rank={parsed.card2.rank} suit={parsed.card2.suit} size={size} />
    </div>
  );
}

export function cardLabel(rank: string, suit: Suit) {
  return `${rank} of ${SUIT_NAMES[suit]}`;
}
