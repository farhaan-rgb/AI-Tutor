/**
 * Study Plan Creating
 * AI processing screen shown after onboarding questionnaire completes.
 * Sequentially ticks through 3 steps, then auto-navigates to /study-plan-ready.
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Brain, Zap, BookOpen, Target, Sparkles, Check } from "lucide-react";
import { StatusBar } from "../shared/premium-ui";

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Analyzing syllabus",  color: "var(--primary)", doneAt: 1600 },
  { label: "Setting milestones",  color: "var(--success)",  doneAt: 3200 },
  { label: "Optimizing schedule", color: "var(--warning)",  doneAt: 4800 },
];

const NAVIGATE_AT = 5600;
const TOTAL       = 5600;

type IconComp = React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;

// ── Orbit icons (static, positioned around the ring) ─────────────────────────
const ORBIT: { Icon: IconComp; angle: number; key: string }[] = [
  { Icon: Brain,    angle: -90, key: "brain"  },
  { Icon: Zap,      angle: 180, key: "zap"    },
  { Icon: BookOpen, angle: 0,   key: "book"   },
  { Icon: Target,   angle: 90,  key: "target" },
];

const ORBIT_R = 84;

// ── Component ─────────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examKey = searchParams.get("exam") ?? "cat";

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const t = Date.now() - start;
      setElapsed(t);
      if (t >= NAVIGATE_AT) {
        clearInterval(interval);
        navigate(`/study-plan-ready?exam=${examKey}`, { replace: true });
      }
    }, 80);
    return () => clearInterval(interval);
  }, [navigate, examKey]);

  const progress = Math.min(elapsed / TOTAL, 1);

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ width: "100%", height: "100dvh", backgroundColor: "var(--background)" }}
    >
      {/* Subtle top glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 36% at 50% 0%, var(--primary-alpha-8) 0%, transparent 70%)",
      }} />

      <StatusBar />

      {/* ── Centered content ── */}
      <div
        className="relative flex flex-col items-center justify-center flex-1"
        style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 80, gap: 28 }}
      >

        {/* ── Ring + orbit icons + central circle ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative flex items-center justify-center"
          style={{ width: 208, height: 208 }}
        >
          {/* Multi-color arc ring */}
          <svg
            width={208} height={208}
            style={{ position: "absolute", top: 0, left: 0 }}
            viewBox="0 0 208 208"
          >
            {[
              { color: "#52c41a", dashOffset: 0 },
              { color: "#faad14", dashOffset: -133 },
              { color: "#f5222d", dashOffset: -266 },
              { color: "#4096ff", dashOffset: -399 },
            ].map(({ color, dashOffset }, i) => (
              <circle
                key={i}
                cx={104} cy={104} r={96}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeDasharray="104 499"
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 104 104)"
                opacity={0.85}
              />
            ))}
          </svg>

          {/* Orbit icons */}
          {ORBIT.map(({ Icon, angle, key }, idx) => {
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * ORBIT_R;
            const y = Math.sin(rad) * ORBIT_R;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
                className="flex items-center justify-center"
                style={{
                  position: "absolute",
                  width: 36,
                  height: 36,
                  borderRadius: 9999,
                  backgroundColor: "var(--card-bg-secondary)",
                  border: "1px solid var(--border)",
                  transform: `translate(${x}px, ${y}px)`,
                  zIndex: 2,
                }}
              >
                <Icon size={16} style={{ color: "var(--muted-foreground)" }} />
              </motion.div>
            );
          })}

          {/* Central pulsing circle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ zIndex: 3 }}
          >
            <motion.div
              animate={{ boxShadow: [
                "0 0 0 4px var(--primary-alpha-20), 0 8px 40px var(--primary-alpha-30)",
                "0 0 0 8px var(--primary-alpha-10), 0 8px 48px var(--primary-alpha-50)",
                "0 0 0 4px var(--primary-alpha-20), 0 8px 40px var(--primary-alpha-30)",
              ]}}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center justify-center"
              style={{
                width: 96,
                height: 96,
                borderRadius: 9999,
                background: "linear-gradient(145deg, var(--primary) 0%, var(--primary-700) 100%)",
              }}
            >
              <Sparkles size={40} style={{ color: "var(--white)" }} />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="flex flex-col items-center"
          style={{ textAlign: "center", gap: 6 }}
        >
          <span style={{
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            color: "var(--foreground)",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}>
            Creating Your Study Plan
          </span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
            AI is personalizing everything for you...
          </span>
        </motion.div>

        {/* ── Steps ── */}
        <div className="flex flex-col w-full" style={{ gap: 8, maxWidth: 340 }}>
          {STEPS.map((step, idx) => {
            const isDone    = elapsed >= step.doneAt;
            const isActive  = elapsed >= (STEPS[idx - 1]?.doneAt ?? 0) && !isDone;
            const isPending = !isDone && !isActive;
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: isPending ? 0.45 : 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + idx * 0.1 }}
                className="flex items-center"
                style={{
                  height: 56,
                  paddingLeft: 16,
                  paddingRight: 16,
                  borderRadius: 12,
                  backgroundColor: "var(--card-bg-secondary)",
                  border: "1px solid var(--border)",
                  gap: 12,
                }}
              >
                {/* Check circle */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9999,
                    backgroundColor: isDone ? step.color : "transparent",
                    border: isDone ? "none" : `1.5px solid ${isPending ? "var(--border)" : step.color}`,
                    transition: "all 0.3s ease",
                  }}
                >
                  {isDone && <Check size={13} style={{ color: "var(--white)" }} strokeWidth={2.5} />}
                </div>

                {/* Label */}
                <span style={{
                  flex: 1,
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: isDone || isActive ? "var(--foreground)" : "var(--muted-foreground)",
                  transition: "color 0.3s ease",
                }}>
                  {step.label}
                </span>

                {/* Animated dots */}
                <div className="flex items-center" style={{ gap: 4 }}>
                  {[0, 1, 2].map((d) => (
                    <motion.div
                      key={d}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 9999,
                        backgroundColor: step.color,
                        opacity: isPending ? 0.2 : isDone ? 1 : 0.5,
                      }}
                      animate={isActive ? { opacity: [0.25, 1, 0.25], scale: [0.8, 1.1, 0.8] } : {}}
                      transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.25, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: "calc(28px + env(safe-area-inset-bottom))",
          left: 24,
          right: 24,
          height: 4,
          borderRadius: 9999,
          backgroundColor: "var(--white-alpha-8)",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0, ease: "linear" }}
          style={{
            height: "100%",
            borderRadius: 9999,
            background: "linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)",
          }}
        />
      </div>
    </div>
  );
}
