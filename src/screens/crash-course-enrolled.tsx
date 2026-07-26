/**
 * Crash Course — Enrolled (Celebration)
 * Shown immediately after the user taps "Enroll Now" on /crash-course-detail.
 * Celebrates the enrollment, sets context, and transitions into the
 * onboarding stepper (/onboarding-crash-course).
 *
 * Supports both the 6–10 (?class=N) and 11–12 (?sku=crash-N-pcm|pcb) flows.
 *
 * Flow position:
 *   /crash-course-detail → [HERE] → /onboarding-crash-course → /crash-course-success → /crash-course-hub
 */

import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Check, Sliders, CalendarDays, Rocket } from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import {
  DUMMY_CRASH_COURSE_INFO,
  getCrash1112Info,
} from "../shared/classroom-catalog";

const C610 = DUMMY_CRASH_COURSE_INFO;

const NEXT_STEPS = [
  { icon: Sliders,      title: "Tell us your schedule",   subtitle: "A couple of quick questions" },
  { icon: CalendarDays, title: "We build your 15-day plan", subtitle: "Tailored chapter-by-chapter roadmap" },
  { icon: Rocket,       title: "Start live classes",      subtitle: "Day-by-day, chapter by chapter" },
];

type ConfettiShape = "circle" | "square" | "ribbon";
const SHAPES: ConfettiShape[] = ["circle", "square", "ribbon"];

function buildConfetti(primary: string) {
  const colors = [primary, "var(--primary)", "var(--success)", "var(--warning)"];
  return Array.from({ length: 32 }, (_, i) => {
    const shape = SHAPES[i % 3];
    const base = [8, 8, 12, 12][i % 4];
    return {
      id: i,
      left: (i * 3.1) % 100,
      delay: (i * 0.06) % 1.5,
      duration: 2.0 + (i % 5) * 0.2,
      color: colors[i % colors.length],
      width: shape === "ribbon" ? base * 2 : base,
      height: shape === "ribbon" ? 4 : base,
      rotate: (i * 47) % 360,
      shape,
    };
  });
}

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const skuParam = searchParams.get("sku");
  const info1112 = getCrash1112Info(skuParam);
  const is1112 = !!info1112;

  const cls = is1112
    ? info1112!.classLevel
    : parseInt(searchParams.get("class") ?? "8", 10);

  const accent = is1112 ? info1112!.accentColor : C610.accentColor;
  const heading = is1112 ? info1112!.title : `Class ${cls} Summer Crash Course`;
  const subtitle = is1112
    ? `${info1112!.subjects.map((s) => s.title).join(" · ")}`
    : "Class ${cls} Summer Crash Course · Maths & Science".replace("${cls}", String(cls));

  const confetti = buildConfetti(accent);
  const persistRef = useRef(false);

  // Persist enrollment so the detail page's CTA reflects "Continue Setup" if
  // the user navigates back without completing the stepper.
  useEffect(() => {
    if (!persistRef.current) {
      persistRef.current = true;
      try {
        if (is1112) {
          // Per-sku flag, not a singleton — a student can be enrolled in more
          // than one 11-12/crash course at once (e.g. both ncert-10-maths and
          // ncert-10-science).
          localStorage.setItem(`cc_enrolled_${info1112!.sku}`, "1");
        } else {
          localStorage.setItem("cc_selected_class", String(cls));
        }
      } catch {
        // Silently fail — non-critical
      }
    }
  }, [cls, is1112, info1112]);

  function continueQuery() {
    return is1112 ? `sku=${info1112!.sku}` : `class=${cls}`;
  }

  return (
    <div
      className="relative flex flex-col"
      style={{ width: "100%", height: "100dvh", backgroundColor: "var(--background)", overflow: "hidden" }}
    >
      {/* Radial accent glow */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 60% 40% at 50% 30%, ${accent}1f 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <StatusBar />

      {/* Confetti */}
      {confetti.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, opacity: 1, rotate: p.rotate }}
          animate={{ y: "105vh", opacity: [1, 1, 0.5, 0], rotate: p.rotate + 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            borderRadius: p.shape === "circle" ? 9999 : p.shape === "square" ? 4 : 0,
            backgroundColor: p.color,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}

      {/* Scrollable centre content */}
      <div
        className="relative flex flex-col items-center flex-1 overflow-y-auto"
        style={{ zIndex: 10, paddingLeft: 24, paddingRight: 24, paddingTop: 32, paddingBottom: 32 }}
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.1 }}
          className="flex items-center justify-center"
          style={{
            width: 96, height: 96, borderRadius: 9999, marginTop: 24, marginBottom: 24,
            backgroundColor: `${accent}1f`,
            border: `2px solid ${accent}`,
            flexShrink: 0,
          }}
        >
          <Check size={44} style={{ color: accent }} strokeWidth={3} />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col items-center"
          style={{ gap: 8, textAlign: "center", marginBottom: 8 }}
        >
          <span style={{ fontSize: 26, fontWeight: 800, color: "var(--foreground)", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            You're enrolled!
          </span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.5, maxWidth: 280 }}>
            {heading}
          </span>
          {is1112 && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.5, maxWidth: 280 }}>
              {subtitle}
            </span>
          )}
        </motion.div>

        {/* Course pill — accent badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 300, damping: 22 }}
          className="flex items-center"
          style={{
            gap: 6,
            paddingLeft: 10, paddingRight: 12, height: 26, borderRadius: 9999,
            backgroundColor: `${accent}1f`,
            border: `0.5px solid ${accent}55`,
            marginBottom: 32,
          }}
        >
          <Check size={12} style={{ color: accent, strokeWidth: 3 }} />
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: accent, letterSpacing: 0.5 }}>
            {is1112
              ? `${info1112!.streamLabel} · ${info1112!.examTarget.toUpperCase()}`
              : (cls === 6 || cls === 7)
              ? "INCLUDED IN GYD MAX"
              : "MATHS & SCIENCE · 15 DAYS"}
          </span>
        </motion.div>

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col w-full"
          style={{ gap: 8, maxWidth: 360 }}
        >
          <span style={{
            fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)",
            color: "var(--muted-foreground)", marginBottom: 4,
          }}>
            What happens next
          </span>

          <div
            className="flex flex-col"
            style={{
              padding: 4, gap: 4,
              backgroundColor: "var(--card-bg-secondary)", borderRadius: 12,
            }}
          >
            {NEXT_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.08 }}
                  className="flex items-center"
                  style={{ gap: 12, padding: 12, borderRadius: 8 }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      backgroundColor: `${accent}14`,
                    }}
                  >
                    <Icon size={18} style={{ color: accent }} />
                  </div>
                  <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                      {step.title}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                      {step.subtitle}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 22, height: 22, borderRadius: 9999,
                      backgroundColor: "var(--card)",
                      border: "0.5px solid var(--border)",
                    }}
                  >
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--muted-foreground)" }}>
                      {i + 1}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Sticky CTA */}
      <div
        className="shrink-0"
        style={{
          paddingLeft: 16, paddingRight: 16, paddingTop: 12,
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))" as unknown as number,
          backgroundColor: "var(--card)",
          borderTop: "0.5px solid var(--border)",
        }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/onboarding-crash-course?${continueQuery()}`, { replace: true })}
          style={{
            width: "100%", height: 48, borderRadius: 12,
            backgroundColor: "var(--primary)", border: "none", cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--primary-foreground)" }}>
            Continue Setup
          </span>
        </motion.button>
      </div>
    </div>
  );
}
