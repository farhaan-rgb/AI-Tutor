/**
 * Arena · Teaser (E0-1/2/3) — the pre-launch M0 experience: a teaser hero +
 * one-tap interest poll ("I'm in / Not for me") that captures a waitlist, with no
 * mechanics revealed. Demoed as a standalone screen so the team can see the
 * staged-reveal step without gating the live Arena.
 *
 * Route: /arena/teaser
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Check, Bell, Sparkles } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { OlympiadHeader } from "./olympiad-ui";
import { arenaBack } from "./arena-ui";

export function Component() {
  const navigate = useNavigate();
  // null = undecided, true = opted in (waitlisted), false = not interested
  const [choice, setChoice] = useState<null | boolean>(null);
  const accent = "var(--purple-500)";

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="" onBack={() => arenaBack(navigate)} />
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto items-center text-center" style={{ padding: "16px 24px 32px", gap: 20 }}>
        {/* Teaser hero — Arena brand icon (crossed swords over the arena ring) */}
        <img
          src="/arena-icon.gif"
          alt="Arena"
          width={96}
          height={96}
          style={{
            width: 96, height: 96, borderRadius: 20, marginTop: 24,
            boxShadow: `0 8px 40px color-mix(in srgb, ${accent} 45%, transparent)`,
          }}
        />

        <span className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: accent }}>
          <Sparkles size={13} style={{ color: accent }} /> Coming soon
        </span>
        <span style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.15 }}>
          Something epic is<br />coming to your prep
        </span>
        <span style={{ fontSize: "var(--text-base)", color: "var(--muted-foreground)", lineHeight: 1.5, maxWidth: 320 }}>
          Tournaments for your brain — compete, climb, and win real rewards. Be first in line when it drops.
        </span>

        <AnimatePresence mode="wait">
          {choice === null && (
            <motion.div key="poll" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col w-full" style={{ gap: 8, marginTop: 12, maxWidth: 360 }}>
              <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={() => setChoice(true)}
                className="flex items-center justify-center w-full" style={{ height: 44, borderRadius: 12, border: "none", cursor: "pointer", backgroundColor: "var(--primary-500)", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
                I'm in
              </motion.button>
              <button type="button" onClick={() => setChoice(false)}
                className="flex items-center justify-center w-full" style={{ height: 44, borderRadius: 12, cursor: "pointer", backgroundColor: "transparent", border: "1px solid var(--white-alpha-25)", color: "var(--foreground)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
                Not for me
              </button>
            </motion.div>
          )}

          {choice === true && (
            <motion.div key="in" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center w-full" style={{ gap: 12, marginTop: 12, maxWidth: 360 }}>
              <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--success-500) 16%, transparent)", border: "2px solid var(--success-500)" }}>
                <Check size={28} style={{ color: "var(--success-500)" }} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)" }}>You're on the list</span>
              <span className="inline-flex items-center" style={{ gap: 8, fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
                <Bell size={14} style={{ color: "var(--muted-foreground)" }} /> We'll notify you the moment it opens
              </span>
            </motion.div>
          )}

          {choice === false && (
            <motion.div key="out" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center w-full" style={{ gap: 8, marginTop: 12, maxWidth: 360 }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--foreground)" }}>No worries — we'll keep it quiet.</span>
              <button type="button" onClick={() => setChoice(true)} style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: accent, background: "none", border: "none", cursor: "pointer" }}>
                Actually, count me in
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
