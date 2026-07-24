/**
 * Study Plan Bridge Page — merged from build-study-plan + study-plan-ready
 * Shown after payment-success, before onboarding questionnaire.
 * mascot-v4 owl · per-exam theming · CTA → /onboarding-cat
 */

import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { StatusBar } from "../shared/premium-ui";
import { V4Mascot } from "./onboarding-default";

// ── Per-exam config ───────────────────────────────────────────────────────────
// Only the brand accent is hardcoded per exam; all surfaces (badge bg/border,
// background glow, mascot glow) are derived from it via color-mix so they tint
// correctly over either light or dark backgrounds.
const EXAM_CONFIG: Record<string, {
  exam: string;
  shortLabel: string;
  examAccent: string;
}> = {
  cat:            { exam: "CAT",          shortLabel: "CAT",     examAccent: "#d87a16" },
  "jee-mains":    { exam: "JEE Mains",    shortLabel: "JEE M",   examAccent: "#4096ff" },
  "jee-advanced": { exam: "JEE Advanced", shortLabel: "JEE ADV", examAccent: "#9254de" },
};

// ── Component ─────────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examKey = searchParams.get("exam") ?? "cat";
  const C = EXAM_CONFIG[examKey] ?? EXAM_CONFIG.cat;

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ width: "100%", height: "100dvh", backgroundColor: "var(--background)" }}
    >
      {/* Exam-coloured background glow — derived from examAccent so it tints
          correctly over both light and dark backgrounds */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse 70% 50% at 50% 30%, color-mix(in srgb, ${C.examAccent} 18%, transparent) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <StatusBar />

      {/* Skip row */}
      <div className="relative flex justify-end shrink-0" style={{ zIndex: 10, paddingRight: 16, paddingTop: 8 }}>
        <button
          onClick={() => navigate("/classes")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
            padding: "8px 4px", fontFamily: "inherit",
          }}
        >
          Maybe later
        </button>
      </div>

      {/* Centered content */}
      <div
        className="relative flex flex-col items-center justify-center flex-1"
        style={{ zIndex: 10, paddingLeft: 24, paddingRight: 24, paddingBottom: 80 }}
      >
        {/* ── Owl mascot with micro-interactions ── */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative flex items-center justify-center"
          style={{ marginBottom: 20 }}
        >
          {/* Ambient glow ring */}
          <motion.div
            animate={{ scale: [1, 1.14, 1], opacity: [0.1, 0.22, 0.1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              width: 200,
              height: 200,
              borderRadius: 9999,
              background: `radial-gradient(circle, color-mix(in srgb, ${C.examAccent} 22%, transparent) 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
          <V4Mascot message={`Hey! Let's get started.`} size="large" />
        </motion.div>

        {/* ── Exam badge ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex items-center"
          style={{
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 4,
            paddingBottom: 4,
            borderRadius: 9999,
            backgroundColor: `color-mix(in srgb, ${C.examAccent} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${C.examAccent} 32%, transparent)`,
            marginBottom: 16,
          }}
        >
          <span style={{
            fontSize: "var(--text-2xs)",
            fontWeight: 700,
            color: C.examAccent,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            {C.shortLabel} PREP UNLOCKED
          </span>
        </motion.div>

        {/* ── Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.28 }}
          className="flex flex-col items-center"
          style={{ textAlign: "center", gap: 8 }}
        >
          <span style={{
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            color: "var(--foreground)",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}>
            Let's build your{" "}
            <span style={{
              background: `linear-gradient(135deg, ${C.examAccent} 0%, ${C.examAccent}cc 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {C.exam}
            </span>{" "}
            study plan
          </span>
          <span style={{
            fontSize: "var(--text-sm)",
            color: "var(--muted-foreground)",
            lineHeight: 1.6,
            maxWidth: 280,
          }}>
            Answer a few quick questions so we can personalise your path perfectly.
          </span>
        </motion.div>
      </div>

      {/* ── CTA — pinned bottom ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.72 }}
        className="relative flex flex-col items-center w-full shrink-0"
        style={{
          zIndex: 10,
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 12,
          paddingBottom: "calc(28px + env(safe-area-inset-bottom))" as unknown as number,
          background: "linear-gradient(180deg, transparent 0%, var(--background) 50%)",
        }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/onboarding-cat?exam=${examKey}`)}
          className="flex items-center justify-center cursor-pointer w-full"
          style={{
            maxWidth: 360,
            height: 44,
            backgroundColor: "var(--primary)",
            color: "var(--white)",
            border: "none",
            borderRadius: 12,
            fontSize: "var(--text-base)",
            fontWeight: 700,
            letterSpacing: "0.01em",
            fontFamily: "inherit",
          }}
        >
          Let's Go
        </motion.button>
      </motion.div>
    </div>
  );
}
