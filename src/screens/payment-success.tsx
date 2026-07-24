/**
 * Payment Success
 * Celebration screen shown after a successful course purchase.
 * Writes purchased exam key to localStorage on mount. CTA → /build-study-plan.
 */

import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Sliders, CalendarDays, Rocket } from "lucide-react";
import { StatusBar } from "../shared/premium-ui";

// TODO(api): POST /api/purchases — returns orderId and paidAt after payment
const DUMMY_ORDER = { orderId: "PM-2025-84721", paidAt: "Today, 2:34 PM" };

const PURCHASED_KEY = "prepmaster_purchased_exams";

// ── Per-exam config ───────────────────────────────────────────────────────────
const EXAM_CONFIG: Record<string, {
  courseTitle: string;
  shortLabel: string;
  plan: string;
  price: number;
  examAccent: string;
  examBadgeBg: string;
  examBadgeBorder: string;
}> = {
  cat: {
    courseTitle: "CAT 2025 Complete Prep",
    shortLabel: "CAT",
    plan: "3 Months",
    price: 2999,
    examAccent: "#d87a16",
    examBadgeBg: "#2b1d11",
    examBadgeBorder: "#593815",
  },
  "jee-mains": {
    courseTitle: "JEE Mains 2025 Full Course",
    shortLabel: "JEE M",
    plan: "12 Months",
    price: 8999,
    examAccent: "#4096ff",
    examBadgeBg: "#001d66",
    examBadgeBorder: "#0050b3",
  },
  "jee-advanced": {
    courseTitle: "JEE Advanced 2025 Elite Prep",
    shortLabel: "JEE ADV",
    plan: "12 Months",
    price: 11999,
    examAccent: "#9254de",
    examBadgeBg: "#120338",
    examBadgeBorder: "#391085",
  },
};

// ── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["var(--primary)", "var(--success)", "var(--warning)", "var(--purple-500)"];
type ConfettiShape = "circle" | "square" | "ribbon";
const SHAPES: ConfettiShape[] = ["circle", "square", "ribbon"];
const CONFETTI = Array.from({ length: 48 }, (_, i) => {
  const shape = SHAPES[i % 3];
  const base = [8, 8, 12, 16][i % 4];
  return {
    id: i,
    left: (i * 2.1) % 100,
    delay: (i * 0.05) % 1.6,
    duration: 2.0 + (i % 6) * 0.2,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    width: shape === "ribbon" ? base * 2 : base,
    height: shape === "ribbon" ? 4 : base,
    rotate: (i * 53) % 360,
    shape,
  };
});

function playSuccessSound(): void {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch {
    // Silently fail
  }
}

// ── What Happens Next steps ───────────────────────────────────────────────────
const NEXT_STEPS = [
  { icon: Sliders, title: "Personalise your plan", subtitle: "Answer a few quick questions" },
  { icon: CalendarDays, title: "Book your first class", subtitle: "We'll schedule your first live session" },
  { icon: Rocket, title: "Start learning", subtitle: "Live classes, practice & more" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const soundPlayedRef = useRef(false);

  const examKey = searchParams.get("exam") ?? "cat";
  const C = EXAM_CONFIG[examKey] ?? EXAM_CONFIG.cat;

  // Persist purchase in localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(PURCHASED_KEY) ?? "[]") as string[];
      if (!stored.includes(examKey)) {
        localStorage.setItem(PURCHASED_KEY, JSON.stringify([...stored, examKey]));
      }
    } catch {
      // Silently fail
    }
  }, [examKey]);

  useEffect(() => {
    if (!soundPlayedRef.current) {
      soundPlayedRef.current = true;
      const t = setTimeout(playSuccessSound, 200);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ width: "100%", height: "100dvh", backgroundColor: "var(--background)" }}
    >
      {/* Radial success glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 60% 40% at 50% 36%, var(--success-alpha-8) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <StatusBar />

      {/* Confetti */}
      {CONFETTI.map((p) => (
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

      {/* Scrollable content */}
      <div
        className="relative flex flex-col items-center flex-1 overflow-y-auto"
        style={{ zIndex: 10, paddingLeft: 24, paddingRight: 24, paddingBottom: 100 }}
      >

        {/* Success icon */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
          className="relative flex items-center justify-center"
          style={{ marginTop: 48, marginBottom: 16, width: 100, height: 100 }}
        >
          {/* Burst rings — one-shot on mount */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.6, opacity: 0.7 }}
              animate={{ scale: 3.2 - i * 0.4, opacity: 0 }}
              transition={{ duration: 0.7 + i * 0.12, delay: 0.55 + i * 0.1, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: 48,
                height: 48,
                borderRadius: 9999,
                border: `${2 - i * 0.5}px solid var(--success)`,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Ray sparks — 8 dots shooting outward */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i * 360) / 8;
            const rad = (angle * Math.PI) / 180;
            const tx = Math.cos(rad) * 48;
            const ty = Math.sin(rad) * 48;
            return (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
                transition={{ duration: 0.55, delay: 0.65, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  width: i % 2 === 0 ? 8 : 6,
                  height: i % 2 === 0 ? 8 : 6,
                  borderRadius: 9999,
                  backgroundColor: "var(--success)",
                  pointerEvents: "none",
                }}
              />
            );
          })}

          {/* Steady glow ring */}
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.04, 0.18] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            style={{
              position: "absolute",
              width: 80,
              height: 80,
              borderRadius: 9999,
              background: "radial-gradient(circle, var(--success-alpha-20) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          {/* Idle border pulse */}
          <motion.div
            animate={{ scale: [1, 1.22, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
            style={{
              position: "absolute",
              width: 64,
              height: 64,
              borderRadius: 9999,
              border: "1.5px solid var(--success)",
              pointerEvents: "none",
            }}
          />

          {/* Animated SVG checkmark */}
          <svg width={60} height={60} viewBox="0 0 72 72" fill="none">
            <motion.circle
              cx="36" cy="36" r="32"
              fill="var(--success-alpha-12)"
              stroke="var(--success)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.18, ease: "easeInOut" }}
              style={{ rotate: -90, transformOrigin: "center" }}
            />
            <motion.path
              d="M 19 36 L 30 47 L 53 23"
              stroke="var(--success)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.58, ease: "easeOut" }}
            />
          </svg>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="flex flex-col items-center"
          style={{ textAlign: "center", marginBottom: 24, gap: 8 }}
        >
          <span style={{
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            color: "var(--foreground)",
            lineHeight: 1.2,
          }}>
            Payment Successful!
          </span>
          <span style={{
            fontSize: "var(--text-sm)",
            color: "var(--muted-foreground)",
            lineHeight: 1.5,
          }}>
            You're all set. Let's get your study plan ready.
          </span>
        </motion.div>

        {/* Order card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
          className="flex flex-col w-full"
          style={{
            gap: 12,
            padding: 16,
            backgroundColor: "var(--card-bg-secondary)",
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          {/* Course name row */}
          <div className="flex items-start">
            <span style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--foreground)",
              lineHeight: 1.4,
              flex: 1,
            }}>
              {C.courseTitle}
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: 0.5, backgroundColor: "var(--border)" }} />

          {/* Order details */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                Amount Paid
              </span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                &#x20B9;{C.price.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>Order ID</span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                {DUMMY_ORDER.orderId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>Paid on</span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                {DUMMY_ORDER.paidAt}
              </span>
            </div>
          </div>
        </motion.div>

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          className="flex flex-col w-full"
          style={{ gap: 12 }}
        >
          <span style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--muted-foreground)",
          }}>
            What happens next
          </span>

          <div
            className="flex flex-col"
            style={{
              backgroundColor: "var(--card-bg-secondary)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            {NEXT_STEPS.map(({ icon: Icon, title, subtitle }, i) => (
              <div key={i} className="flex" style={{ gap: 12 }}>
                {/* Left: icon circle + connector */}
                <div className="flex flex-col items-center shrink-0" style={{ width: 32 }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9999,
                      backgroundColor: `${C.examAccent}20`,
                      border: `1px solid ${C.examAccent}40`,
                    }}
                  >
                    <Icon size={14} style={{ color: C.examAccent }} />
                  </div>
                  {i < NEXT_STEPS.length - 1 && (
                    <div style={{
                      width: 1,
                      flex: 1,
                      marginTop: 4,
                      marginBottom: 4,
                      borderLeft: "1.5px dashed var(--border)",
                    }} />
                  )}
                </div>
                {/* Right: title + subtitle */}
                <div
                  className="flex flex-col"
                  style={{ flex: 1, paddingBottom: i < NEXT_STEPS.length - 1 ? 16 : 0, gap: 2 }}
                >
                  <span style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    lineHeight: 1.4,
                  }}>
                    {title}
                  </span>
                  <span style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--muted-foreground)",
                    lineHeight: 1.4,
                  }}>
                    {subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA — pinned bottom */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.65 }}
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
          onClick={() => navigate(`/build-study-plan?exam=${examKey}`)}
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
          Build My Study Plan
        </motion.button>
      </motion.div>
    </div>
  );
}
