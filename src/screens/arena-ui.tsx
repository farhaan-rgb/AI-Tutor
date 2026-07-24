/**
 * Arena shared UI — small building blocks reused across the arena-* screens so
 * the League surfaces stay visually consistent and each screen stays lean.
 * Layout via Tailwind, all visuals via CSS-var tokens (4px grid). Reuses the
 * olympiad shared kit (Avatar, tags, countdowns) where it already fits.
 */

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Shield, Crown, Flame, Zap, type LucideIcon } from "lucide-react";
import type { NavigateFunction } from "react-router";
import { getTier, type TierId } from "../shared/arena";

/**
 * Back handler for Arena screens. POPS the history stack when there's an in-app
 * page to return to (so children don't push a fresh /arena entry and trap the
 * user bouncing Arena↔child), and falls back to `fallback` when the screen was
 * opened cold (deep link / preview toolbar, where history has no prior entry).
 */
export function arenaBack(navigate: NavigateFunction, fallback = "/arena") {
  const idx = (typeof window !== "undefined" && (window.history.state as { idx?: number } | null)?.idx) ?? 0;
  if (idx > 0) navigate(-1);
  else navigate(fallback);
}

/** League-tier pill — tier-coloured, shield (or crown for Champion). */
export function TierBadge({ tierId, compact = false }: { tierId: TierId; compact?: boolean }) {
  const t = getTier(tierId);
  const Icon = tierId === "champion" ? Crown : Shield;
  return (
    <span
      className="inline-flex items-center"
      style={{
        height: 24, padding: compact ? "0 8px" : "0 10px", borderRadius: 8, gap: 6, flexShrink: 0,
        backgroundColor: `color-mix(in srgb, ${t.color} 16%, transparent)`,
        border: `1px solid color-mix(in srgb, ${t.color} 36%, transparent)`,
        fontSize: "var(--text-xs)", fontWeight: 700, color: t.color,
        lineHeight: 1, whiteSpace: "nowrap",
      }}
    >
      <Icon size={12} style={{ color: t.color }} />
      {t.label}
    </span>
  );
}

/** Compact icon + value stat (streak, energy, rank) for the status strip. */
export function StatChip({ icon: Icon, value, label, color = "var(--foreground)" }: {
  icon: LucideIcon; value: string; label: string; color?: string;
}) {
  return (
    <div className="flex items-center" style={{ gap: 8, flex: 1, minWidth: 0 }}>
      <Icon size={18} style={{ color, flexShrink: 0 }} />
      <div className="flex flex-col" style={{ minWidth: 0 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{value}</span>
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", lineHeight: 1.2 }}>{label}</span>
      </div>
    </div>
  );
}

/**
 * Cover-thumbnail card — the SHARED arena/olympiad card language: a brand hero
 * (icon + label, optional entry pill, optional status) over a content panel
 * (title · meta · optional schedule · optional footer). Used by both the Arena
 * home (browse/join) and My Events (history/registered) so the SAME event reads
 * the same everywhere — only the data on it changes.
 */
export function ArenaCoverCard({
  accent, heroIcon, heroLabel, motif, pill, statusRight, liveAccent, title, meta, schedule, footerLeft, footerRight, onClick, disabled,
}: {
  accent: string; heroIcon: ReactNode; heroLabel: string; motif?: ReactNode;
  pill?: ReactNode; statusRight?: ReactNode; liveAccent?: boolean;
  title: string; meta: string; schedule?: ReactNode; footerLeft?: ReactNode; footerRight?: ReactNode;
  onClick: () => void; disabled?: boolean;
}) {
  return (
    <motion.button
      type="button" whileTap={disabled ? undefined : { scale: 0.99 }} onClick={disabled ? undefined : onClick}
      className="flex flex-col w-full text-left overflow-hidden"
      style={{
        borderRadius: 12, cursor: disabled ? "default" : "pointer", backgroundColor: "var(--card)", flexShrink: 0,
        border: liveAccent ? "0.5px solid color-mix(in srgb, var(--error-500) 32%, var(--border))" : "0.5px solid var(--border)",
        opacity: disabled ? 0.6 : 1, fontFamily: "var(--font-family-inter)",
      }}
    >
      {/* Hero — ONE flat, uniform accent wash (no radial glows → no top-to-bottom falloff,
          so nothing fades into the text region). Just a subtle diagonal sheen for life.
          Placeholder for a real thumbnail image. */}
      <div className="relative w-full" style={{ aspectRatio: "16 / 5", background: `color-mix(in srgb, ${accent} 26%, var(--card))` }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 44%, color-mix(in srgb, var(--white) 10%, transparent) 50%, transparent 56%)" }} />
        {motif}
        <div className="absolute flex flex-col items-center" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", gap: 6 }}>
          <div className="flex items-center justify-center" style={{
            width: 56, height: 56, borderRadius: 12,
            background: `linear-gradient(155deg, color-mix(in srgb, ${accent} 42%, var(--card)) 0%, color-mix(in srgb, ${accent} 14%, var(--card)) 100%)`,
            border: `1px solid color-mix(in srgb, ${accent} 55%, transparent)`,
            boxShadow: `0 8px 24px color-mix(in srgb, ${accent} 38%, transparent), inset 0 1px 0 color-mix(in srgb, var(--white) 18%, transparent)`,
          }}>{heroIcon}</div>
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.8, textTransform: "uppercase", color: accent }}>{heroLabel}</span>
        </div>
        {pill && <span className="absolute" style={{ top: 8, left: 8 }}>{pill}</span>}
        {statusRight && <span className="absolute" style={{ top: 8, right: 8 }}>{statusRight}</span>}
      </div>
      {/* Content */}
      <div className="flex flex-col w-full" style={{ padding: "12px 16px", gap: 4 }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</span>
        <span className="truncate" style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{meta}</span>
        {schedule && <span className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-xs)", color: "var(--foreground)", fontWeight: 500, marginTop: 2 }}>{schedule}</span>}
        {(footerLeft || footerRight) && (
          <div className="flex items-center w-full" style={{ gap: 8, marginTop: 6 }}>
            <div className="flex items-center" style={{ flex: 1, minWidth: 0 }}>{footerLeft}</div>
            {footerRight}
          </div>
        )}
      </div>
    </motion.button>
  );
}

/**
 * Decorative format motif for a cover hero — a low-opacity graphic that gives each
 * card a distinct texture beyond its accent + icon. Ladder = ascending bars (the
 * climb), exam = paper lines, sprint = speed lines. Purely ornamental (aria-hidden).
 */
export function HeroMotif({ format, accent }: { format: "ladder" | "exam" | "sprint"; accent: string }) {
  const c = `color-mix(in srgb, ${accent} 26%, transparent)`;
  if (format === "ladder") {
    return (
      <div aria-hidden className="absolute flex items-end" style={{ left: 16, bottom: 12, gap: 4, opacity: 0.55 }}>
        {[12, 20, 28, 36].map((h, i) => <div key={i} style={{ width: 8, height: h, borderRadius: 4, backgroundColor: c }} />)}
      </div>
    );
  }
  if (format === "exam") {
    return (
      <div aria-hidden className="absolute flex flex-col items-end" style={{ right: 16, bottom: 14, gap: 4, opacity: 0.55 }}>
        {[40, 28, 36, 20].map((w, i) => <div key={i} style={{ width: w, height: 4, borderRadius: 4, backgroundColor: c }} />)}
      </div>
    );
  }
  return (
    <div aria-hidden className="absolute flex" style={{ right: 16, bottom: 14, gap: 4, opacity: 0.55 }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ width: 4, height: 28, borderRadius: 4, backgroundColor: c, transform: "skewX(-18deg)" }} />)}
    </div>
  );
}

/** Absolute schedule for a card — "Sat, 9 Jun · 3:14 PM". */
export function fmtArenaSchedule(ms: number): string {
  const d = new Date(ms);
  return `${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase()}`;
}

export { Flame, Zap };
