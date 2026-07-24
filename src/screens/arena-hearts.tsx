/**
 * Hearts Store — the app's currency store (mirrors the existing Hearts Store).
 * Hearts are spent on power-ups (XP boosts, level retries) and earned via streaks
 * and weekly practice. The Hearts balance shown across the Arena links here.
 *
 * Route: /arena/hearts
 *   TODO(api): GET /api/hearts/store — boosts, prices, weekly tasks + progress.
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Zap, Flame, Target, Ticket, Check } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { HeartIcon } from "../shared/heart-icon";
import { useArenaState } from "../shared/arena";
import { arenaBack } from "./arena-ui";

interface Boost { id: string; title: string; sub: string; cost: number; kind: "boost" | "ticket" }
const BOOSTS: Boost[] = [
  { id: "boost1", title: "1 Boost", sub: "2x XP for 10 min", cost: 50, kind: "boost" },
  { id: "boost2", title: "2 Boosts", sub: "2x XP for 20 min", cost: 100, kind: "boost" },
  { id: "retry", title: "Retry ticket", sub: "Re-attempt a level", cost: 80, kind: "ticket" },
];

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function Component() {
  const navigate = useNavigate();
  const { state, spendHearts, addTickets } = useArenaState();
  const [toast, setToast] = useState<string | null>(null);

  function buy(b: Boost) {
    if (!spendHearts(b.cost)) { flash("Not enough Hearts"); return; }
    if (b.kind === "ticket") addTickets(1);
    flash(b.kind === "ticket" ? "Retry ticket added" : "Boost activated · 2x XP");
  }
  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 1800); }

  // Streak progress mirrors the live streak; weekly practice is a placeholder count.
  const streakDays = Math.min(state.streakDays, 7);
  const practiceDone = 0; // TODO(api): weekly practiced-question count

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 48, padding: "0 8px 0 4px", gap: 4 }}>
          <button onClick={() => arenaBack(navigate)} aria-label="Back" className="flex items-center justify-center shrink-0"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={22} style={{ color: "var(--foreground)" }} />
          </button>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)" }}>Hearts Store</span>
          <div style={{ flex: 1 }} />
          <span className="inline-flex items-center" style={{ gap: 5, height: 32, padding: "0 10px", borderRadius: 9999, backgroundColor: "var(--card-bg-secondary)" }}>
            <HeartIcon size={14} />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--foreground)" }}>{state.hearts}</span>
          </span>
          <span className="inline-flex items-center" style={{ gap: 4, height: 32, padding: "0 10px", borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--teal-500) 14%, transparent)" }}>
            <Zap size={13} style={{ color: "var(--teal-500)" }} fill="var(--teal-500)" />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--teal-500)" }}>{state.xp.toLocaleString("en-IN")}</span>
          </span>
        </div>
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "12px 16px 32px" }}>
        <div className="flex flex-col" style={{ gap: 20, flexShrink: 0 }}>
          {/* Balance hero */}
          <div className="relative overflow-hidden flex items-center" style={{ borderRadius: 12, padding: "20px 18px", gap: 12, background: "linear-gradient(135deg, color-mix(in srgb, var(--purple-500) 30%, var(--card)) 0%, color-mix(in srgb, var(--purple-500) 12%, var(--card)) 100%)", border: "1px solid color-mix(in srgb, var(--purple-500) 36%, transparent)" }}>
            <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <span style={{ fontSize: "var(--text-3xl, 30px)", fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>
                {state.hearts} <span style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Hearts available</span>
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontWeight: 500 }}>Use them to unlock rewards and level up faster!</span>
            </div>
            <HeartIcon size={56} />
          </div>

          {/* Use Hearts */}
          <SectionRule>Use Hearts</SectionRule>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", padding: "0 4px" }}>Energy &amp; Power-Ups</span>
          <div className="flex" style={{ gap: 12, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
            {BOOSTS.map((b) => <BoostCard key={b.id} b={b} affordable={state.hearts >= b.cost} onBuy={() => buy(b)} />)}
          </div>

          {/* Earn Hearts */}
          <SectionRule>Earn Hearts</SectionRule>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", padding: "0 4px" }}>Weekly Tasks</span>

          <TaskCard icon={Flame} accent="var(--warning-500)" title="Earn 5 Hearts by completing a 3-day streak">
            <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="flex flex-col items-center" style={{ gap: 6 }}>
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: i < streakDays ? "var(--foreground)" : "var(--muted-foreground)" }}>{d}</span>
                  <Flame size={20} style={{ color: i < streakDays ? "var(--warning-500)" : "var(--muted-foreground)", opacity: i < streakDays ? 1 : 0.4 }} fill={i < streakDays ? "var(--warning-500)" : "transparent"} />
                </div>
              ))}
            </div>
          </TaskCard>

          <TaskCard icon={Target} accent="var(--error-500)" title="Earn 5 Hearts by practicing 50 questions weekly">
            <div className="flex items-center" style={{ gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 9999, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(practiceDone / 50) * 100}%`, backgroundColor: "var(--error-500)", borderRadius: 9999 }} />
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 700 }}>{practiceDone}/50 completed</span>
            </div>
          </TaskCard>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed left-0 right-0 flex justify-center" style={{ bottom: 24, zIndex: 50 }}>
            <span className="inline-flex items-center" style={{ gap: 6, padding: "10px 16px", borderRadius: 9999, backgroundColor: "var(--card)", border: "0.5px solid var(--border)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", boxShadow: "0 8px 24px color-mix(in srgb, var(--black) 40%, transparent)" }}>
              <Check size={14} style={{ color: "var(--success-500)" }} /> {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center" style={{ gap: 12, marginTop: 4 }}>
      <div style={{ flex: 1, height: 0.5, backgroundColor: "color-mix(in srgb, var(--purple-500) 40%, transparent)" }} />
      <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, letterSpacing: 0.4, color: "var(--purple-300)" }}>{children}</span>
      <div style={{ flex: 1, height: 0.5, backgroundColor: "color-mix(in srgb, var(--purple-500) 40%, transparent)" }} />
    </div>
  );
}

function BoostCard({ b, affordable, onBuy }: { b: Boost; affordable: boolean; onBuy: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onBuy} className="flex flex-col text-left shrink-0" style={{
      width: 150, padding: 14, borderRadius: 12, cursor: "pointer", position: "relative",
      backgroundColor: "var(--card)", border: "0.5px solid var(--border)", opacity: affordable ? 1 : 0.7,
    }}>
      <span className="absolute inline-flex items-center" style={{ top: 12, right: 12, gap: 3, height: 22, padding: "0 8px", borderRadius: 8, backgroundColor: "color-mix(in srgb, var(--purple-500) 18%, transparent)" }}>
        <HeartIcon size={12} /><span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--foreground)" }}>{b.cost}</span>
      </span>
      <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "color-mix(in srgb, var(--warning-500) 16%, transparent)" }}>
        {b.kind === "ticket" ? <Ticket size={20} style={{ color: "var(--warning-500)" }} /> : <Zap size={20} style={{ color: "var(--warning-500)" }} fill="var(--warning-500)" />}
      </div>
      <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)", marginTop: 12 }}>{b.title}</span>
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 500, marginTop: 2 }}>{b.sub}</span>
    </motion.button>
  );
}

function TaskCard({ icon: Icon, accent, title, children }: { icon: typeof Flame; accent: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ padding: 16, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      <div className="flex items-start" style={{ gap: 12 }}>
        <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)` }}>
          <Icon size={20} style={{ color: accent }} />
        </div>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.35 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
