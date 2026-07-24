/**
 * Olympiad shared UI — small, reusable building blocks used across every
 * olympiad-* screen so the feature stays visually consistent and each screen
 * stays lean. Layout via Tailwind, all visuals via CSS-var tokens (4px grid).
 */

import { useEffect, useState } from "react";
import type { NavigateFunction } from "react-router";
import { motion } from "motion/react";
import {
  Sigma, FlaskConical, Brain, GraduationCap, Users, Trophy, Medal, Award, Crown,
  type LucideIcon,
} from "lucide-react";
import {
  msToCountdown,
  formatCount,
  type Olympiad,
  type OlympiadIconKey,
  type OlympiadPhase,
  type OlympiadPrize,
  type LeaderboardEntry,
} from "../shared/olympiads";

/**
 * History-aware back. Pops the real previous screen when one exists (so we never
 * push a duplicate entry and trap the user in a back-and-forth loop), and only
 * navigates to `fallback` on a cold/deep entry (idx 0) where there's nothing to
 * pop. Mirrors arenaBack — every olympiad-* back button should route through it.
 */
export function olympiadBack(navigate: NavigateFunction, fallback: string) {
  const idx = (typeof window !== "undefined" && (window.history.state as { idx?: number } | null)?.idx) ?? 0;
  if (idx > 0) navigate(-1);
  else navigate(fallback);
}

// ─── Icon mapping ────────────────────────────────────────────────────────────

const ICONS: Record<OlympiadIconKey, LucideIcon> = {
  math: Sigma,
  science: FlaskConical,
  aptitude: Brain,
  general: GraduationCap,
};

export function OlympiadIcon({ iconKey, size = 24, color = "var(--white)" }: {
  iconKey: OlympiadIconKey; size?: number; color?: string;
}) {
  const Icon = ICONS[iconKey];
  return <Icon size={size} style={{ color }} />;
}

/** Gradient tile holding the olympiad icon. */
export function OlympiadSeal({ o, size = 56, entryBadge = false }: {
  o: Olympiad; size?: number; entryBadge?: boolean;
}) {
  const free = o.entryType === "free";
  const ribbonH = Math.max(16, Math.round(size * 0.28));
  return (
    <div
      className="relative shrink-0 flex flex-col overflow-hidden"
      style={{
        width: size, height: size, borderRadius: Math.round(size / 4),
        background: `linear-gradient(155deg, ${o.accent} 0%, color-mix(in srgb, ${o.accent} 60%, var(--black)) 100%)`,
        boxShadow: `0 0 24px color-mix(in srgb, ${o.accent} 30%, transparent)`,
      }}
    >
      <div className="flex items-center justify-center" style={{ flex: 1, minHeight: 0 }}>
        <OlympiadIcon iconKey={o.iconKey} size={Math.round(size / (entryBadge ? 2.4 : 2))} />
      </div>
      {entryBadge && (
        <div
          className="flex items-center justify-center w-full"
          style={{
            height: ribbonH, fontSize: "var(--text-2xs)", fontWeight: 800,
            letterSpacing: 0.4, textTransform: "uppercase", color: "var(--white)",
            backgroundColor: free
              ? "var(--success-600)"
              : "color-mix(in srgb, var(--purple-500) 88%, var(--black))",
          }}
        >
          {free ? "Free" : "GYD Max"}
        </div>
      )}
    </div>
  );
}

// ─── AntD-style Tag ──────────────────────────────────────────────────────────
// Matches the project's AntD `<Tag color="success|warning|error" />` styling
// (see ScoreTag in my-test-series-pack.tsx): solid d2 bg + d4 border + 500 text,
// height 24, weight 600, never wraps. `neutral` is AntD's default gray. Radius
// softened to 8 (from 4) so chips harmonize with the radius-16 olympiad cards.

type TagVariant = "success" | "warning" | "error" | "neutral" | "max";

const TAG_STYLE: Record<TagVariant, { bg: string; border: string; text: string }> = {
  success: { bg: "var(--success-d2)", border: "var(--success-d4)", text: "var(--success-500)" },
  warning: { bg: "var(--warning-d2)", border: "var(--warning-d4)", text: "var(--warning-500)" },
  error:   { bg: "var(--error-d2)",   border: "var(--error-d4)",   text: "var(--error-500)" },
  max:     {
    // AntD purple (#722ed1 = --mark-review-500) as a dark AntD tag: dark-purple
    // chip + AntD-purple border + light AntD-purple text, legible over any backdrop.
    bg: "color-mix(in srgb, var(--mark-review-500) 22%, var(--black))",
    border: "color-mix(in srgb, var(--mark-review-500) 55%, transparent)",
    text: "color-mix(in srgb, var(--mark-review-500) 80%, var(--white))",
  },
  neutral: {
    bg: "color-mix(in srgb, var(--foreground) 8%, transparent)",
    border: "color-mix(in srgb, var(--foreground) 18%, transparent)",
    text: "var(--muted-foreground)",
  },
};

export function OlympiadTag({ label, variant, dot, icon: Icon }: {
  label: string; variant: TagVariant; dot?: boolean; icon?: LucideIcon;
}) {
  const s = TAG_STYLE[variant];
  return (
    <span
      className="inline-flex items-center"
      style={{
        height: 24, padding: "0 10px", borderRadius: 8, gap: 6, flexShrink: 0,
        backgroundColor: s.bg, border: `1px solid ${s.border}`,
        fontSize: "var(--text-xs)", fontWeight: 600, color: s.text,
        lineHeight: 1, whiteSpace: "nowrap",
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: s.text }} />}
      {Icon && <Icon size={12} style={{ color: s.text }} />}
      {label}
    </span>
  );
}

const PHASE_TAG: Record<OlympiadPhase, { label: string; variant: TagVariant; dot?: boolean }> = {
  "upcoming": { label: "Upcoming", variant: "neutral" },
  "registration-open": { label: "Open", variant: "success" },
  "registration-closing": { label: "Closing soon", variant: "warning" },
  "live": { label: "Live now", variant: "error", dot: true },
  "grading": { label: "Grading", variant: "warning" },
  "results-out": { label: "Results out", variant: "neutral" },
};

export function StatusPill({ phase }: { phase: OlympiadPhase }) {
  const m = PHASE_TAG[phase];
  return <OlympiadTag label={m.label} variant={m.variant} dot={m.dot} />;
}

export function EntryBadge({ o }: { o: Olympiad }) {
  return o.entryType === "free"
    ? <OlympiadTag label="Free" variant="success" />
    : <OlympiadTag label="GYD Max" variant="max" icon={Crown} />;
}

// Tier colour for prize ranks: gold · silver · bronze · neutral.
function prizeTierColor(i: number): string {
  return i === 0 ? "var(--warning-500)"
    : i === 1 ? "color-mix(in srgb, var(--foreground) 62%, transparent)"
    : i === 2 ? "color-mix(in srgb, var(--warning-500) 58%, var(--error-500) 42%)"
    : "var(--muted-foreground)";
}

/** Shared prize-tier list — medallion + tier-coloured rank label + reward.
 *  Two-line rows so long bundled rewards never collide with the rank. Use this
 *  everywhere prizes are shown (detail, results, etc.) so they stay consistent. */
export function PrizeList({ prizes }: { prizes: OlympiadPrize[] }) {
  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      {prizes.map((p, i) => {
        const color = prizeTierColor(i);
        return (
          <div key={i} className="flex items-center" style={{ gap: 12 }}>
            <div className="flex items-center justify-center shrink-0" style={{
              width: 36, height: 36, borderRadius: 8,
              backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
              border: `0.5px solid color-mix(in srgb, ${color} 30%, transparent)`,
            }}>
              <Medal size={18} style={{ color }} />
            </div>
            <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color }}>
                {p.rank}
              </span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--foreground)", lineHeight: 1.35 }}>
                {p.reward}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ParticipantStat({ count, label = "registered", color = "var(--muted-foreground)" }: {
  count: number; label?: string; color?: string;
}) {
  return (
    <span className="inline-flex items-center" style={{ gap: 4, fontSize: "var(--text-xs)", color }}>
      <Users size={13} style={{ color }} />
      {formatCount(count)} {label}
    </span>
  );
}

// ─── Countdown ─────────────────────────────────────────────────────────────────

/** Live countdown hook — re-renders each second until `to` is reached. */
export function useCountdown(to: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return msToCountdown(to - now);
}

/** Inline countdown. Full: "2d 04h 12m 08s". Compact (cards): drops the least
 *  significant unit so it stays narrow — "2d 04h", "04h 12m", "12m 08s". */
export function CountdownInline({ to, color = "var(--foreground)", compact = false, size = "var(--text-sm)" }: {
  to: number; color?: string; compact?: boolean; size?: string;
}) {
  const c = useCountdown(to);
  const pad = (n: number) => String(n).padStart(2, "0");
  let text: string;
  if (compact) {
    if (c.days > 0) text = `${c.days}d ${pad(c.hours)}h`;
    else if (c.hours > 0) text = `${pad(c.hours)}h ${pad(c.minutes)}m`;
    else text = `${pad(c.minutes)}m ${pad(c.seconds)}s`;
  } else {
    text = `${c.days > 0 ? `${c.days}d ` : ""}${pad(c.hours)}h ${pad(c.minutes)}m ${pad(c.seconds)}s`;
  }
  return (
    <span style={{ fontSize: size, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

/** Block-style countdown (Days / Hours / Mins / Secs). Fluid — fits the 360px
 *  baseline inside padded cards (blocks flex to share width, no fixed minWidth). */
export function CountdownBlocks({ to, accent = "var(--foreground)" }: { to: number; accent?: string }) {
  const c = useCountdown(to);
  const blocks: { value: number; label: string }[] = [
    { value: c.days, label: "Days" },
    { value: c.hours, label: "Hours" },
    { value: c.minutes, label: "Mins" },
    { value: c.seconds, label: "Secs" },
  ];
  const aria = `${c.days}d ${c.hours}h ${c.minutes}m ${c.seconds}s remaining`;
  return (
    <div role="timer" aria-label={aria} className="flex items-start justify-center w-full" style={{ gap: 4 }}>
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-start" style={{ gap: 4, flex: 1, minWidth: 0, justifyContent: "center" }}>
          <div className="flex flex-col items-center" style={{ gap: 4, minWidth: 0 }}>
            <span style={{
              fontSize: 28, fontWeight: 800, color: "var(--foreground)",
              fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: -1,
            }}>
              {String(b.value).padStart(2, "0")}
            </span>
            <span style={{
              fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)",
              letterSpacing: 0.4, textTransform: "uppercase",
            }}>
              {b.label}
            </span>
          </div>
          {i < blocks.length - 1 && (
            <span style={{ fontSize: 24, fontWeight: 700, color: accent, lineHeight: 1, opacity: 0.4 }}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

function rankColor(rank: number): string {
  if (rank === 1) return "var(--warning-500)";
  if (rank === 2) return "var(--muted-foreground)";
  if (rank === 3) return "color-mix(in srgb, var(--warning-500) 60%, var(--muted-foreground))";
  return "var(--muted-foreground)";
}

const AVATAR_COLORS = [
  "var(--primary-500)", "var(--success-500)", "var(--warning-500)",
  "var(--purple-500)", "var(--error-500)", "var(--teal-500)",
];

/** Deterministic initial-avatar (no assets) — colour keyed on the name. */
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const c = AVATAR_COLORS[h % AVATAR_COLORS.length];
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex items-center justify-center shrink-0" style={{
      width: size, height: size, borderRadius: 9999,
      background: `linear-gradient(155deg, ${c} 0%, color-mix(in srgb, ${c} 60%, var(--black)) 100%)`,
      color: "var(--white)", fontSize: "var(--text-xs)", fontWeight: 700,
    }}>
      {initial}
    </div>
  );
}

export function LeaderboardRow({ entry, maxScore, isLast }: {
  entry: LeaderboardEntry; maxScore: number; isLast: boolean;
}) {
  const podium = entry.rank <= 3;
  const color = rankColor(entry.rank);
  return (
    <div
      className="flex items-center"
      style={{
        gap: 12, padding: "12px",
        borderBottom: isLast ? "none" : "0.5px solid color-mix(in srgb, var(--foreground) 8%, transparent)",
        backgroundColor: entry.isMe ? "color-mix(in srgb, var(--primary-500) 12%, transparent)" : "transparent",
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 28, height: 28, borderRadius: 9999,
          fontSize: "var(--text-xs)", fontWeight: 700,
          color: podium ? "var(--white)" : "var(--foreground)",
          backgroundColor: podium ? color : "var(--card-bg-secondary)",
        }}
      >
        {entry.rank}
      </div>
      <Avatar name={entry.name} size={32} />
      <span className="truncate" style={{
        flex: 1, minWidth: 0,
        fontSize: "var(--text-sm)", fontWeight: entry.isMe ? 700 : 500,
        color: entry.isMe ? "var(--primary-300)" : "var(--foreground)",
      }}>
        {entry.name}
      </span>
      <span style={{
        fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {entry.score}<span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>/{maxScore}</span>
      </span>
    </div>
  );
}

/** Podium for the top 3 — center-tallest layout. */
export function Podium({ top3, maxScore }: { top3: LeaderboardEntry[]; maxScore: number }) {
  const order = [top3[1], top3[0], top3[2]].filter(Boolean); // 2 · 1 · 3
  const heights = [64, 84, 52];
  const icons = [Medal, Trophy, Award];
  return (
    <div className="flex items-end justify-center" style={{ gap: 12 }}>
      {order.map((e, i) => {
        const isFirst = e.rank === 1;
        const Icon = icons[i];
        const color = rankColor(e.rank);
        return (
          <motion.div
            key={e.rank}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, type: "spring", stiffness: 240, damping: 22 }}
            className="flex flex-col items-center"
            style={{ gap: 8, width: 88 }}
          >
            {/* Student avatar with a tier-colored ring + a corner medal badge */}
            <div className="relative shrink-0" style={{
              padding: 2, borderRadius: 9999,
              border: `2px solid ${color}`,
              boxShadow: isFirst ? `0 0 16px color-mix(in srgb, ${color} 45%, transparent)` : "none",
            }}>
              <Avatar name={e.name} size={isFirst ? 52 : 44} />
              <span className="absolute flex items-center justify-center" style={{
                right: -4, bottom: -4, width: 22, height: 22, borderRadius: 9999,
                backgroundColor: "var(--card)", border: `1.5px solid ${color}`,
              }}>
                <Icon size={12} style={{ color }} />
              </span>
            </div>
            <span className="truncate w-full text-center" style={{
              fontSize: "var(--text-xs)", fontWeight: 700,
              color: e.isMe ? "var(--primary-300)" : "var(--foreground)",
            }}>
              {e.name}
            </span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
              {e.score}/{maxScore}
            </span>
            <div
              className="flex items-start justify-center w-full"
              style={{
                height: heights[i], borderRadius: "8px 8px 0 0", paddingTop: 8,
                background: `linear-gradient(180deg, color-mix(in srgb, ${color} 30%, transparent) 0%, color-mix(in srgb, ${color} 8%, transparent) 100%)`,
                border: `0.5px solid color-mix(in srgb, ${color} 30%, transparent)`,
                borderBottom: "none",
              }}
            >
              <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color }}>{e.rank}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Generic metric tile ───────────────────────────────────────────────────────

export function MetricTile({ label, value, sub, color = "var(--foreground)" }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        gap: 2, padding: 12, borderRadius: 12, flex: 1, minWidth: 0,
        backgroundColor: "var(--card-bg-secondary)", border: "0.5px solid var(--border)",
      }}
    >
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.3 }}>
        {label}
      </span>
      <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{sub}</span>}
    </div>
  );
}

/** Back-arrow glass header used by the detail/sub screens. */
export function OlympiadHeader({ title, onBack, right }: {
  title: string; onBack: () => void; right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center" style={{ height: 52, padding: "0 8px", gap: 4 }}>
      <button onClick={onBack} aria-label="Back" className="flex items-center justify-center shrink-0"
        style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: 0 }}>Back</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <span className="truncate" style={{ flex: 1, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>
        {title}
      </span>
      {right}
    </div>
  );
}
