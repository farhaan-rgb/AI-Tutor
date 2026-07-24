/**
 * Arena Daily Spin — the luck factor. One free spin a day on a prize wheel:
 * Hearts (the currency), XP (helps you level up), and the occasional retry ticket
 * (helps you clear a tough level). Weighted so big rewards stay rare.
 *
 * Route: /arena/spin
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Ticket, Sparkles } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { useArenaState, canSpinNow } from "../shared/arena";
import { HeartIcon, XpIcon } from "../shared/heart-icon";
import { CountdownInline } from "./olympiad-ui";
import { arenaBack } from "./arena-ui";

type Kind = "hearts" | "xp" | "ticket";
interface Segment { kind: Kind; label: string; amount?: number; color: string; weight: number }

// 8 segments — Hearts + XP wins, a rare jackpot, one retry ticket.
const SEGMENTS: Segment[] = [
  { kind: "hearts", label: "10", amount: 10, color: "var(--primary-500)", weight: 22 },
  { kind: "xp", label: "50 XP", amount: 50, color: "var(--teal-500)", weight: 20 },
  { kind: "ticket", label: "Ticket", color: "var(--warning-500)", weight: 8 },
  { kind: "hearts", label: "50", amount: 50, color: "var(--success-500)", weight: 12 },
  { kind: "xp", label: "200 XP", amount: 200, color: "var(--purple-500)", weight: 6 },
  { kind: "hearts", label: "5", amount: 5, color: "var(--primary-400)", weight: 22 },
  { kind: "xp", label: "100 XP", amount: 100, color: "var(--error-500)", weight: 14 },
  { kind: "hearts", label: "100", amount: 100, color: "var(--warning-600)", weight: 3 },
];
const SEG = 360 / SEGMENTS.length;

function weightedPick(): number {
  const total = SEGMENTS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SEGMENTS.length; i++) { r -= SEGMENTS[i].weight; if (r <= 0) return i; }
  return SEGMENTS.length - 1;
}

function SegIcon({ kind, size = 14 }: { kind: Kind; size?: number }) {
  if (kind === "hearts") return <HeartIcon size={size} />;
  if (kind === "ticket") return <Ticket size={size} style={{ color: "var(--white)" }} />;
  return <XpIcon size={Math.round(size * 0.8)} color="var(--white)" />;
}

export function Component() {
  const navigate = useNavigate();
  const { state, spin } = useArenaState();
  const ready = canSpinNow(state);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<Segment | null>(null);

  const conic = `conic-gradient(${SEGMENTS.map((s, i) => `${s.color} ${i * SEG}deg ${(i + 1) * SEG}deg`).join(", ")})`;
  const nextAt = (state.lastSpinAt ?? 0) + 20 * 60 * 60 * 1000;

  function doSpin() {
    if (spinning || !ready || won) return;
    setSpinning(true);
    const idx = weightedPick();
    const base = Math.ceil(rotation / 360) * 360;
    const target = base + 360 * 4 + (360 - (idx * SEG + SEG / 2));
    setRotation(target);
    setTimeout(() => {
      const seg = SEGMENTS[idx];
      spin(seg.kind === "ticket" ? { tickets: 1 } : seg.kind === "xp" ? { xp: seg.amount } : { hearts: seg.amount });
      setWon(seg);
      setSpinning(false);
    }, 3400);
  }

  const wonTitle = !won ? "" : won.kind === "ticket" ? "1 Retry Ticket!" : won.kind === "xp" ? `+${won.amount} XP!` : `+${won.amount} Hearts!`;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 48, padding: "0 8px 0 4px", gap: 4 }}>
          <button onClick={() => arenaBack(navigate)} aria-label="Back" className="flex items-center justify-center shrink-0"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={22} style={{ color: "var(--foreground)" }} />
          </button>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)" }}>Daily Spin</span>
          <div style={{ flex: 1 }} />
          {/* Hearts + XP wallet */}
          <button onClick={() => navigate("/arena/hearts")} className="inline-flex items-center" style={{ gap: 5, height: 32, padding: "0 10px", borderRadius: 9999, border: "none", cursor: "pointer", backgroundColor: "var(--card-bg-secondary)" }}>
            <HeartIcon size={14} />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--foreground)" }}>{state.hearts.toLocaleString("en-IN")}</span>
          </button>
          <span className="inline-flex items-center" style={{ gap: 5, height: 32, padding: "0 10px", borderRadius: 9999, backgroundColor: "var(--card-bg-secondary)" }}>
            <XpIcon size={11} />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--foreground)" }}>{state.xp.toLocaleString("en-IN")}</span>
          </span>
        </div>
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col items-center flex-1 min-h-0" style={{ padding: "24px 16px", gap: 24 }}>
        <span className="text-center" style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontWeight: 500, maxWidth: 300 }}>
          One free spin every day. Win Hearts, XP to level up, or a retry ticket for the tough levels.
        </span>

        {/* Wheel */}
        <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
          <div aria-hidden style={{ position: "absolute", top: -6, zIndex: 3, width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: "20px solid var(--foreground)" }} />
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 3.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: 280, height: 280, borderRadius: "50%", background: conic, border: "4px solid var(--card)", boxShadow: "0 12px 40px color-mix(in srgb, var(--black) 50%, transparent)", position: "relative" }}>
            {SEGMENTS.map((s, i) => {
              const angle = i * SEG + SEG / 2;
              return (
                // Group sits on the spoke (rotated to the segment), placed at an inner
                // radius; the inner label counter-rotates so it stays upright + inside.
                <div key={i} style={{ position: "absolute", left: "50%", top: "50%", transformOrigin: "0 0", transform: `rotate(${angle}deg) translateY(-84px)` }}>
                  <div className="flex flex-col items-center" style={{ transform: `translate(-50%, -50%) rotate(${-angle}deg)`, gap: 2 }}>
                    <SegIcon kind={s.kind} size={15} />
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--white)", whiteSpace: "nowrap", textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
          <div className="absolute flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "var(--card)", border: "2px solid var(--border)", zIndex: 2 }}>
            <Sparkles size={22} style={{ color: "var(--warning-500)" }} />
          </div>
        </div>

        {ready ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={doSpin} disabled={spinning || !!won} style={{
            height: 44, padding: "0 32px", borderRadius: 12, border: "none",
            backgroundColor: spinning || won ? "var(--card-bg-secondary)" : "var(--primary-500)",
            color: spinning || won ? "var(--muted-foreground)" : "var(--white)",
            fontSize: "var(--text-sm)", fontWeight: 600, cursor: spinning || won ? "default" : "pointer",
            boxShadow: spinning || won ? "none" : "0 6px 20px color-mix(in srgb, var(--primary-500) 36%, transparent)",
          }}>{spinning ? "Spinning…" : won ? "See you tomorrow" : "Spin now"}</motion.button>
        ) : (
          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Next free spin in</span>
            <CountdownInline to={nextAt} color="var(--warning-500)" size="var(--text-base)" />
          </div>
        )}
      </div>

      {/* Win overlay */}
      <AnimatePresence>
        {won && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center"
            style={{ backgroundColor: "var(--overlay-strong)", zIndex: 50, padding: 24 }} onClick={() => navigate("/arena")}>
            <motion.div initial={{ scale: 0.8, y: 12 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex flex-col items-center text-center" style={{ width: "100%", maxWidth: 320, padding: 24, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)", gap: 12 }}>
              <div className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--warning-500) 20%, transparent)" }}>
                <SegIcon kind={won.kind} size={30} />
              </div>
              <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--foreground)" }}>{wonTitle}</span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>Added to your wallet. Come back tomorrow for another spin.</span>
              <button onClick={() => navigate("/arena")} className="w-full" style={{ height: 44, borderRadius: 12, border: "none", backgroundColor: "var(--primary-500)", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", marginTop: 4 }}>Collect</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
