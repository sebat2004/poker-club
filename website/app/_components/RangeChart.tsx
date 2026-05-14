"use client";

import { useState } from "react";
import { HandDisplay } from "@/app/_components/PlayingCard";

/* ---------------------------------------------------------------------------
 * Poker range chart — 13 × 13 grid of all starting hands.
 *
 * Ranks run from high to low (A … 2) along both axes.
 * Upper-right triangle  → suited hands  (e.g. AKs)
 * Main diagonal         → pocket pairs  (e.g. AA)
 * Lower-left triangle   → offsuit hands (e.g. AKo)
 * ------------------------------------------------------------------------- */

const RANKS = [
  "A", "K", "Q", "J", "T",
  "9", "8", "7", "6", "5", "4", "3", "2",
] as const;

type Rank = (typeof RANKS)[number];

function handAt(row: number, col: number): string {
  const r1 = RANKS[row]!;
  const r2 = RANKS[col]!;
  if (row === col) return r1 + r2;           // pocket pair
  if (row < col)  return r1 + r2 + "s";     // suited   (upper-right)
  return RANKS[col]! + RANKS[row]! + "o";   // offsuit  (lower-left)
}

type CellKind = "pair" | "suited" | "offsuit";

function kindAt(row: number, col: number): CellKind {
  if (row === col) return "pair";
  return row < col ? "suited" : "offsuit";
}

/* Cell background (idle state) */
const KIND_BG: Record<CellKind, string> = {
  pair:    "rgba(220,68,5,0.18)",
  suited:  "rgba(255,255,255,0.055)",
  offsuit: "rgba(255,255,255,0.02)",
};
const KIND_BORDER: Record<CellKind, string> = {
  pair:    "rgba(220,68,5,0.35)",
  suited:  "rgba(255,255,255,0.09)",
  offsuit: "rgba(255,255,255,0.04)",
};

/* ---------------------------------------------------------------------------
 * Props
 * ------------------------------------------------------------------------- */

export type RangeChartProps = {
  selected: string | null;
  onChange: (hand: string | null) => void;
};

/* ---------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */

export function RangeChart({ selected, onChange }: RangeChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  function handleClick(hand: string) {
    // Clicking the selected hand deselects it
    onChange(selected === hand ? null : hand);
  }

  return (
    <div className="w-full">
      {/* Scrollable wrapper so the chart never breaks small viewports */}
      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: 316 }}>

          {/* Column header row */}
          <div style={{ display: "flex", paddingLeft: 20, marginBottom: 2 }}>
            {RANKS.map((r) => (
              <div
                key={r}
                style={{
                  flex: 1,
                  minWidth: 22,
                  textAlign: "center",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.52rem",
                  color: "rgba(161,161,170,0.5)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {r}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {RANKS.map((rowRank, row) => (
            <div key={rowRank} style={{ display: "flex", alignItems: "center", height: 22 }}>
              {/* Row label */}
              <div
                style={{
                  width: 18,
                  flexShrink: 0,
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.52rem",
                  color: "rgba(161,161,170,0.5)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  textAlign: "right",
                  paddingRight: 3,
                }}
              >
                {rowRank}
              </div>

              {/* Cells */}
              {RANKS.map((_, col) => {
                const hand    = handAt(row, col);
                const kind    = kindAt(row, col);
                const isSel   = selected === hand;
                const isHov   = hovered  === hand;

                const bg     = isSel ? "rgba(220,68,5,1)"   : isHov ? "rgba(220,68,5,0.35)" : KIND_BG[kind];
                const border = isSel ? "rgba(220,68,5,1)"   : isHov ? "rgba(220,68,5,0.6)"  : KIND_BORDER[kind];
                const txtClr = isSel ? "#fff" : "rgba(161,161,170,0.55)";
                const scale  = isSel ? "scale(1.1)" : isHov ? "scale(1.05)" : "scale(1)";

                return (
                  <button
                    key={col}
                    type="button"
                    title={hand}
                    onClick={() => handleClick(hand)}
                    onMouseEnter={() => setHovered(hand)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      flex: 1,
                      minWidth: 22,
                      height: 21,
                      margin: "0 0.5px",
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "all 80ms ease",
                      transform: scale,
                      position: isSel ? "relative" : undefined,
                      zIndex: isSel ? 10 : undefined,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      outline: "none",
                      boxShadow: isSel ? "0 0 8px rgba(220,68,5,0.5)" : undefined,
                    }}
                    aria-pressed={isSel}
                    aria-label={hand}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: "0.48rem",
                        fontWeight: 600,
                        color: txtClr,
                        letterSpacing: "-0.01em",
                        lineHeight: 1,
                        pointerEvents: "none",
                      }}
                    >
                      {/* Show rank pair only, suffix on hover/select */}
                      {hand.slice(0, 2)}
                      {hand.length === 3 && (
                        <span style={{ opacity: isSel || isHov ? 1 : 0.5, fontSize: "0.42rem" }}>
                          {hand[2]}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

        </div>
      </div>

      {/* Legend + selected hand preview */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-2.5">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: 2, background: KIND_BG.pair, border: `1px solid ${KIND_BORDER.pair}` }} />
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground/50">Pairs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: 2, background: KIND_BG.suited, border: `1px solid ${KIND_BORDER.suited}` }} />
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground/50">Suited</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: 2, background: KIND_BG.offsuit, border: `1px solid ${KIND_BORDER.offsuit}` }} />
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground/50">Offsuit</span>
        </div>

        {/* Selected hand cards preview */}
        {selected && (
          <div className="ml-auto flex items-center gap-2">
            <HandDisplay hand={selected} size="sm" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground/50 hover:text-destructive transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
