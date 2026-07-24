/**
 * Shared result-screen components used by all playable games.
 *
 * Why this exists:
 *   - Every game's result screen needs the same post-play UX (comparison,
 *     next-session ETA, push to other games, top-right exit).
 *   - LinkedIn's games (Tango / Queens / Pinpoint / Crossclimb) all follow this
 *     pattern — after finishing, you see how you compare + can pivot directly
 *     into another game without bouncing back to a menu.
 *   - Without these, result screens are dead-ends ("Come back tomorrow").
 *
 * Exports:
 *   - TopExitBar — X aligned to the top-right (standard close-modal pattern,
 *     replaces the left-aligned exit bars each game had locally)
 *   - DailyComparisonStrip — "You beat X% of players today" + avg-vs-yours line
 *   - NextSessionEta — hours/mins until next daily drop, or "Try again anytime"
 *   - OtherGamesRail — horizontal scroll of compact GameMiniCards excluding
 *     the just-played game. Tap → navigate to that game's /play route directly.
 *   - GameMiniCard — 124×140 card with GameArt + title + FREE/PASS chip
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  X, TrendingUp, Clock, ChevronRight, HelpCircle, Check, Lightbulb,
  Sprout, Flame, Mountain, type LucideIcon,
} from "lucide-react";
import { GameArt } from "../screens/game-art";
// We import DUMMY_GAMES + Game type from marketplace-v1 to power the rail.
// This pulls in a heavy module — acceptable since result screens are leaves
// (no further imports re-pull marketplace).
import { type Game } from "../screens/marketplace-v1";

// ─── TopExitBar — right-aligned X ───────────────────────────────────────────
// Standard close-modal pattern (LinkedIn, Instagram, iOS, Android all put X on
// the top-right). Replaces the left-aligned TopExitBar each game had locally.
export function TopExitBar({ onExit, label = "Close" }: { onExit: () => void; label?: string }) {
  return (
    <div className="flex items-center justify-end" style={{
      padding: "12px 8px", borderBottom: "0.5px solid var(--border)",
    }}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onExit}
        aria-label={label}
        style={{
          width: 36, height: 36, borderRadius: 8,
          backgroundColor: "transparent", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
      >
        <X size={18} style={{ color: "var(--muted-foreground)" }} />
      </motion.button>
    </div>
  );
}

// ─── DailyComparisonStrip — "You beat X% of players today" ──────────────────
// Mocked percentile that's score-dependent (high score → high percentile) so
// the comparison feels honest without real data. Stays stable per render.
// TODO(api): GET /api/games/{id}/percentile?score=X — server-computed
// percentile from real round results once telemetry ships.

export interface DailyComparisonStripProps {
  yourScore: number;
  total: number;
  /** Defaults to a believable ~65–70% of total (e.g. 7/10 average). */
  avgScore?: number;
  /** "today" / "this week" / etc. Defaults to "today". */
  periodLabel?: string;
}

export function DailyComparisonStrip({
  yourScore, total, avgScore, periodLabel = "today",
}: DailyComparisonStripProps) {
  const percentile = mockPercentile(yourScore, total);
  const avg = avgScore ?? Math.round(total * 0.68);
  return (
    <div className="flex items-center" style={{
      width: "100%", maxWidth: 360, gap: 12,
      padding: "12px 12px", borderRadius: 12,
      backgroundColor: "var(--card)",
      border: "0.5px solid var(--border)",
    }}>
      <div className="flex items-center justify-center" style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        backgroundColor: "color-mix(in srgb, var(--success-500) 18%, transparent)",
      }}>
        <TrendingUp size={16} style={{ color: "var(--success-500)" }} strokeWidth={2.25} />
      </div>
      <div className="flex flex-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3,
        }}>
          You beat {percentile}% of players {periodLabel}
        </span>
        <span style={{
          fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4,
        }}>
          Avg: {avg}/{total} · You: {yourScore}/{total}
        </span>
      </div>
    </div>
  );
}

// Deterministic mapping from score → percentile. Same input always returns
// same value so the result screen doesn't change on re-render.
function mockPercentile(score: number, total: number): number {
  if (total <= 0) return 50;
  const ratio = score / total;
  if (ratio >= 1)     return 92;
  if (ratio >= 0.9)   return 84;
  if (ratio >= 0.8)   return 73;
  if (ratio >= 0.7)   return 61;
  if (ratio >= 0.5)   return 44;
  if (ratio >= 0.3)   return 25;
  return 12;
}

// ─── NextSessionEta — hours-until-midnight (daily) or generic "anytime" ──────
export interface NextSessionEtaProps {
  /** True for games that reset daily (e.g. Daily Drill). */
  daily?: boolean;
  /** Label for the daily countdown (e.g. "Next drill"). Ignored when !daily. */
  label?: string;
}

export function NextSessionEta({ daily, label = "Next session" }: NextSessionEtaProps) {
  const [eta, setEta] = useState(() => hoursUntilTomorrow());

  useEffect(() => {
    if (!daily) return;
    const id = setInterval(() => setEta(hoursUntilTomorrow()), 60_000);  // tick every minute
    return () => clearInterval(id);
  }, [daily]);

  if (!daily) {
    return (
      <div className="flex items-center justify-center" style={{
        gap: 8,
        fontSize: "var(--text-xs)", color: "var(--muted-foreground)",
      }}>
        <Clock size={12} style={{ color: "var(--muted-foreground)" }} />
        <span>Play again anytime</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" style={{
      gap: 8,
      fontSize: "var(--text-xs)", color: "var(--muted-foreground)",
    }}>
      <Clock size={12} style={{ color: "var(--muted-foreground)" }} />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {label} in {eta.hours}h {eta.mins}m
      </span>
    </div>
  );
}

function hoursUntilTomorrow(): { hours: number; mins: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diffMs = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs / (1000 * 60)) % 60);
  return { hours, mins };
}

// ─── OtherGamesRail — push to other games after finishing one ───────────────
// LinkedIn's pattern. After Tango → Queens / Pinpoint / Crossclimb thumbnails.
// We surface all games except the one just played. Tap → /play directly so the
// kid doesn't bounce back to the marketplace menu.

export interface OtherGamesRailProps {
  /** id of the just-played game — excluded from the rail. */
  currentGameId: string;
  /** Must be passed in (we can't import DUMMY_GAMES here without circular risk). */
  games: Game[];
}

export function OtherGamesRail({ currentGameId, games }: OtherGamesRailProps) {
  const navigate = useNavigate();
  const others = games.filter((g) => g.id !== currentGameId);
  if (others.length === 0) return null;

  return (
    <div className="flex flex-col" style={{ width: "100%", gap: 12 }}>
      <SectionTitle>Try other games</SectionTitle>
      <div className="flex" style={{
        gap: 8, overflowX: "auto", scrollbarWidth: "none",
        paddingLeft: 0, paddingRight: 0,
      }}>
        {others.map((g) => (
          <GameMiniCard
            key={g.id}
            game={g}
            onTap={() => navigate(`/marketplace/game/${g.id}/play`)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── GameMiniCard ────────────────────────────────────────────────────────────
export interface GameMiniCardProps {
  game: Game;
  onTap: () => void;
}

export function GameMiniCard({ game, onTap }: GameMiniCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onTap}
      style={{
        width: 124, height: 140, flexShrink: 0,
        padding: 0, borderRadius: 12,
        backgroundColor: "var(--card)",
        border: "0.5px solid var(--border)",
        cursor: "pointer", overflow: "hidden",
        display: "flex", flexDirection: "column",
        textAlign: "left",
      }}
      aria-label={`Play ${game.title}`}
    >
      {/* Top — GameArt fills 80px, accent-tinted */}
      <div style={{
        position: "relative", width: "100%", height: 80,
        backgroundColor: `color-mix(in srgb, ${game.accent} 12%, var(--card))`,
        overflow: "hidden",
      }}>
        <div aria-hidden style={{ position: "absolute", inset: 0 }}>
          <GameArt archetype={game.archetype} accent={game.accent} />
        </div>
      </div>

      {/* Bottom — name + price/free chip */}
      <div className="flex flex-col" style={{
        padding: "8px 10px", gap: 4, flex: 1, justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--foreground)",
          lineHeight: 1.25,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {game.title}
        </span>
        <span style={{
          fontSize: "var(--text-2xs)", fontWeight: 700,
          color: game.pricing.isFree ? "var(--success-500)" : "var(--muted-foreground)",
          letterSpacing: 0.3,
        }}>
          {game.pricing.isFree ? "FREE" : "PASS"}
        </span>
      </div>
    </motion.button>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "var(--text-2xs)", fontWeight: 600,
      color: "var(--muted-foreground)", letterSpacing: 0.8,
      textTransform: "uppercase",
      margin: 0,
    }}>
      {children}
    </p>
  );
}

// ─── Hint for completion CTAs ────────────────────────────────────────────────
// Used by Daily Drill (which previously had a "Come back tomorrow" lone CTA).
// Pairs with NextSessionEta — the kid sees the countdown above, this is the
// dismiss button. Other games (Word Wizard, Math Mountain, etc.) keep their
// existing "Play again" + "Back to game" pair.
export function DismissCTA({ onClick, label = "Done" }: { onClick: () => void; label?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center justify-center"
      style={{
        width: "100%", maxWidth: 360, height: 44, borderRadius: 12,
        border: "0.5px solid var(--border)",
        backgroundColor: "transparent", cursor: "pointer",
        fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)",
      }}
    >
      {label}
      <ChevronRight size={16} style={{ color: "var(--muted-foreground)", marginLeft: 4 }} />
    </motion.button>
  );
}

// ─── Difficulty system ──────────────────────────────────────────────────────
// 3-tier difficulty supports the broad K-12 audience. Each game uses the
// selected level to filter/generate easier or harder content. Some surface
// shifts in copy tone (more encouraging at "easy", more terse at "hard").
export type Difficulty = "easy" | "medium" | "hard";

// Level metadata — icon + label only. Color comes from the game's accent so
// each game stays single-themed (green Math Mountain stays green throughout,
// purple Brain Battle stays purple, etc.). Level identity is communicated
// through icon (Sprout/Flame/Mountain) and selected-state weight, not color.
const DIFFICULTY_META: Record<Difficulty, {
  label: string;
  ageHint: string;
  Icon: LucideIcon;
}> = {
  easy:   { label: "Easy",   ageHint: "Class 1–4",  Icon: Sprout },
  medium: { label: "Medium", ageHint: "Class 5–8",  Icon: Flame },
  hard:   { label: "Hard",   ageHint: "Class 9–12", Icon: Mountain },
};

// Difficulty picker — 3 level-select tiles. Single-theme: all tiles use the
// game's accent color. Selected tile fills with accent + lifts + glows.
// Unselected tiles fade to muted outline.
export function DifficultyPicker({
  value, onChange, accent,
}: {
  value: Difficulty;
  onChange: (next: Difficulty) => void;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 10, width: "100%", maxWidth: 360 }}>
      <span style={{
        fontSize: "var(--text-2xs)", fontWeight: 700,
        color: "var(--muted-foreground)", letterSpacing: 1,
        textTransform: "uppercase",
      }}>
        Choose your level
      </span>
      <div className="flex" style={{ gap: 8, width: "100%" }}>
        {(["easy", "medium", "hard"] as const).map((d) => {
          const meta = DIFFICULTY_META[d];
          const Icon = meta.Icon;
          const active = value === d;
          return (
            <motion.button
              key={d}
              onClick={() => onChange(d)}
              whileTap={{ scale: 0.96 }}
              animate={{
                scale: active ? 1.04 : 1,
                y: active ? -2 : 0,
              }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="flex flex-col items-center justify-center"
              style={{
                flex: 1, height: 96, paddingTop: 10, paddingBottom: 10,
                gap: 6, borderRadius: 16,
                backgroundColor: active
                  ? `color-mix(in srgb, ${accent} 16%, var(--card))`
                  : "var(--card)",
                border: active
                  ? `1.5px solid ${accent}`
                  : "0.5px solid var(--border)",
                cursor: "pointer",
                boxShadow: active
                  ? `0 0 0 3px color-mix(in srgb, ${accent} 18%, transparent), 0 8px 20px color-mix(in srgb, ${accent} 26%, transparent)`
                  : "none",
                opacity: active ? 1 : 0.7,
                transition: "background-color 0.18s, border-color 0.18s, opacity 0.18s, box-shadow 0.2s",
              }}
              aria-pressed={active}
              aria-label={`${meta.label} difficulty — ${meta.ageHint}`}
            >
              {/* Icon badge */}
              <div className="flex items-center justify-center" style={{
                width: 32, height: 32, borderRadius: 9999,
                backgroundColor: active
                  ? accent
                  : `color-mix(in srgb, ${accent} 12%, transparent)`,
                border: active
                  ? "none"
                  : `0.5px solid color-mix(in srgb, ${accent} 28%, transparent)`,
                transition: "background-color 0.18s",
              }}>
                <Icon
                  size={16}
                  strokeWidth={2.4}
                  style={{ color: active ? "var(--white)" : `color-mix(in srgb, ${accent} 80%, var(--muted-foreground))` }}
                />
              </div>

              <span style={{
                fontSize: "var(--text-sm)", fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: -0.2, lineHeight: 1,
              }}>
                {meta.label}
              </span>
              <span style={{
                fontSize: "var(--text-2xs)", fontWeight: 600,
                color: active ? accent : "var(--muted-foreground)",
                letterSpacing: 0.2, lineHeight: 1,
              }}>
                {meta.ageHint}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── How-to-play system ─────────────────────────────────────────────────────
// Small "?" button shown in the intro phase. Tap → bottom sheet with numbered
// steps explaining the mechanic. Added because some games (Memory Match
// flagged specifically) had mechanic-confusion on first play.

export interface HowToStep {
  title: string;
  body: string;
}

export function HowToButton({ onTap, accent }: { onTap: () => void; accent: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
      className="flex items-center"
      style={{
        gap: 4, height: 28, paddingLeft: 10, paddingRight: 12,
        borderRadius: 9999,
        backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
        border: `0.5px solid color-mix(in srgb, ${accent} 40%, transparent)`,
        cursor: "pointer",
      }}
      aria-label="How to play"
    >
      <HelpCircle size={12} style={{ color: accent }} />
      <span style={{
        fontSize: "var(--text-2xs)", fontWeight: 700, color: accent,
        letterSpacing: 0.4, textTransform: "uppercase",
      }}>
        How to play
      </span>
    </motion.button>
  );
}

export function HowToSheet({
  open, gameTitle, steps, accent, onClose, isDesktop,
}: {
  open: boolean;
  gameTitle: string;
  steps: HowToStep[];
  accent: string;
  onClose: () => void;
  isDesktop?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              backgroundColor: "color-mix(in srgb, var(--background) 70%, transparent)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 101,
              backgroundColor: "var(--card)",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "12px 16px 0",
              maxWidth: isDesktop ? 720 : undefined,
              marginLeft: isDesktop ? "auto" : undefined,
              marginRight: isDesktop ? "auto" : undefined,
              display: "flex", flexDirection: "column", gap: 16,
            }}
          >
            <div aria-hidden style={{
              width: 36, height: 4, borderRadius: 4,
              backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)",
              alignSelf: "center",
            }} />

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span style={{
                  fontSize: "var(--text-2xs)", fontWeight: 700,
                  color: "var(--muted-foreground)", letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}>
                  How to play
                </span>
                <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)" }}>
                  {gameTitle}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close how to play"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: "transparent", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                <X size={16} style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            <div className="flex flex-col" style={{ gap: 16, paddingBottom: 8 }}>
              {steps.map((step, i) => (
                <div key={i} className="flex items-start" style={{ gap: 12 }}>
                  <div className="flex items-center justify-center" style={{
                    width: 28, height: 28, borderRadius: 9999, flexShrink: 0,
                    backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`,
                    border: `0.5px solid color-mix(in srgb, ${accent} 40%, transparent)`,
                  }}>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: accent }}>
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex flex-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3 }}>
                      {step.title}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.45 }}>
                      {step.body}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex items-center justify-center"
              style={{
                width: "100%", height: 44, borderRadius: 12, gap: 8, border: "none",
                backgroundColor: accent, cursor: "pointer",
                marginBottom: "max(16px, env(safe-area-inset-bottom))",
              }}
            >
              <Check size={16} style={{ color: "var(--white)" }} strokeWidth={3} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)" }}>
                Got it
              </span>
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Hint system ─────────────────────────────────────────────────────────────
// Every kid gets MAX_HINTS hints per session. The icon button lives top-right
// of the playing phase, shows remaining count, and opens a small bottom sheet
// with the hint for the current question. After the kid taps "Use this hint",
// the count decrements and the hint reveals inline (the sheet stays open until
// they dismiss). No hints left → button is disabled-styled but still tappable
// to surface "0 hints left — finish strong!".

export const MAX_HINTS = 3;

export function HintButton({
  remaining, onTap, accent,
}: {
  remaining: number;
  onTap: () => void;
  accent: string;
}) {
  const empty = remaining <= 0;
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onTap}
      className="flex items-center"
      style={{
        gap: 6, height: 32, paddingLeft: 10, paddingRight: 12,
        borderRadius: 9999,
        backgroundColor: empty
          ? "color-mix(in srgb, var(--muted-foreground) 12%, transparent)"
          : `color-mix(in srgb, ${accent} 16%, transparent)`,
        border: empty
          ? "0.5px solid color-mix(in srgb, var(--muted-foreground) 24%, transparent)"
          : `0.5px solid color-mix(in srgb, ${accent} 42%, transparent)`,
        cursor: "pointer",
      }}
      aria-label={empty ? "No hints left" : `Use a hint (${remaining} left)`}
    >
      <Lightbulb
        size={14}
        style={{ color: empty ? "var(--muted-foreground)" : accent }}
        strokeWidth={2.2}
      />
      <span style={{
        fontSize: "var(--text-2xs)", fontWeight: 800,
        color: empty ? "var(--muted-foreground)" : accent,
        letterSpacing: 0.4, fontVariantNumeric: "tabular-nums",
      }}>
        {remaining}/{MAX_HINTS}
      </span>
    </motion.button>
  );
}

export function HintSheet({
  open, hint, remaining, accent, onUse, onClose, isDesktop,
}: {
  open: boolean;
  hint: string | null;       // hint text for the current question
  remaining: number;
  accent: string;
  onUse: () => void;         // called when the kid taps "Reveal hint"
  onClose: () => void;
  isDesktop?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  // Reset reveal state every time the sheet opens for a new question.
  useEffect(() => {
    if (open) setRevealed(false);
  }, [open, hint]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const noHint = hint == null;
  const noneLeft = remaining <= 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              backgroundColor: "color-mix(in srgb, var(--background) 70%, transparent)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 101,
              backgroundColor: "var(--card)",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "12px 16px 0",
              maxWidth: isDesktop ? 720 : undefined,
              marginLeft: isDesktop ? "auto" : undefined,
              marginRight: isDesktop ? "auto" : undefined,
              display: "flex", flexDirection: "column", gap: 16,
            }}
          >
            <div aria-hidden style={{
              width: 36, height: 4, borderRadius: 4,
              backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)",
              alignSelf: "center",
            }} />

            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: 10 }}>
                <div className="flex items-center justify-center" style={{
                  width: 32, height: 32, borderRadius: 9999,
                  backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`,
                  border: `0.5px solid color-mix(in srgb, ${accent} 40%, transparent)`,
                }}>
                  <Lightbulb size={16} style={{ color: accent }} strokeWidth={2.2} />
                </div>
                <div className="flex flex-col">
                  <span style={{
                    fontSize: "var(--text-2xs)", fontWeight: 700,
                    color: "var(--muted-foreground)", letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}>
                    Hint
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                    {remaining} of {MAX_HINTS} left
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close hint"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: "transparent", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                <X size={16} style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* Body */}
            {noHint ? (
              <div className="flex flex-col items-center" style={{
                gap: 8, padding: "20px 16px", borderRadius: 12,
                backgroundColor: "var(--card-bg-secondary)",
                textAlign: "center",
              }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                  No hint for this one
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", maxWidth: 260 }}>
                  This question doesn't have a hint — trust your gut and pick the best answer.
                </span>
              </div>
            ) : noneLeft && !revealed ? (
              <div className="flex flex-col items-center" style={{
                gap: 8, padding: "20px 16px", borderRadius: 12,
                backgroundColor: "var(--card-bg-secondary)",
                textAlign: "center",
              }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                  Out of hints
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", maxWidth: 260 }}>
                  You've used all 3 hints. Finish strong — you've got this.
                </span>
              </div>
            ) : revealed ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  padding: "16px", borderRadius: 12,
                  backgroundColor: `color-mix(in srgb, ${accent} 10%, var(--card-bg-secondary))`,
                  border: `0.5px solid color-mix(in srgb, ${accent} 30%, transparent)`,
                }}
              >
                <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.5 }}>
                  {hint}
                </span>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center" style={{
                gap: 8, padding: "20px 16px", borderRadius: 12,
                backgroundColor: "var(--card-bg-secondary)",
                textAlign: "center",
              }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                  Use a hint?
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", maxWidth: 260 }}>
                  Hints use one of your {MAX_HINTS} per game. Save them for tough ones.
                </span>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (revealed || noHint || noneLeft) { onClose(); return; }
                onUse();
                setRevealed(true);
              }}
              className="flex items-center justify-center"
              style={{
                width: "100%", height: 44, borderRadius: 12, gap: 8, border: "none",
                backgroundColor: (revealed || noHint || noneLeft)
                  ? "var(--card-bg-secondary)"
                  : accent,
                cursor: "pointer",
                marginBottom: "max(16px, env(safe-area-inset-bottom))",
              }}
            >
              {revealed || noHint || noneLeft ? (
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
                  Close
                </span>
              ) : (
                <>
                  <Lightbulb size={16} style={{ color: "var(--white)" }} strokeWidth={2.4} />
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)" }}>
                    Reveal hint
                  </span>
                </>
              )}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Difficulty vibe helper ──────────────────────────────────────────────────
// Per-difficulty UI shifts so the same screen reads differently to a Class 2
// kid vs a Class 11 student. Kept tiny on purpose — title size + microcopy +
// CTA wording. Larger shifts (full layout, illustration density) would need a
// separate UI per difficulty, which is out of scope.

export interface DifficultyVibe {
  titleSize: number;          // px — bigger for kids, tighter for older
  subtitleSize: string;       // CSS var
  ctaCopy: string;            // verb for the start CTA
  microcopy: string;          // one-liner under title
  letterSpacing: number;      // px — playful (positive) vs tight (negative)
}

export function getVibe(d: Difficulty): DifficultyVibe {
  if (d === "easy") {
    return {
      titleSize: 32,
      subtitleSize: "var(--text-base)",
      ctaCopy: "Let's play!",
      microcopy: "Tap when you're ready",
      letterSpacing: 0,
    };
  }
  if (d === "hard") {
    return {
      titleSize: 24,
      subtitleSize: "var(--text-xs)",
      ctaCopy: "Begin",
      microcopy: "Ready when you are.",
      letterSpacing: -0.6,
    };
  }
  // medium — neutral default
  return {
    titleSize: 28,
    subtitleSize: "var(--text-sm)",
    ctaCopy: "Start",
    microcopy: "Take your time.",
    letterSpacing: -0.5,
  };
}
