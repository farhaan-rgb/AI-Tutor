import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTheme } from "../app/contexts/theme-context";
import { motion } from "motion/react";
import {
  X, Play, BookOpen, CheckCircle2, Clock, Video,
  ChevronDown, ChevronUp, Smartphone, Wifi, Pencil, Phone,
  Lock, Crown,
} from "lucide-react";
import {
  DUMMY_CRASH_COURSE_INFO,
  getCrash1112Info,
  isCrash1112Sku,
  type CrashCourse1112Info,
} from "../shared/classroom-catalog";
import { StatusBar } from "../shared/premium-ui";
import { CourseReviewsPreview } from "./course-reviews-preview";

const C610 = DUMMY_CRASH_COURSE_INFO;

// Default class when URL has no ?class= and no ?sku= param (preview/dev path)
const DEFAULT_CLASS = 8;

// Flat pricing shared across all crash SKUs (6–10 and 11–12).
// TODO(api): GET /api/crash-courses/pricing?sku=N
const CRASH_PRICE = 999;
const CRASH_ORIGINAL_PRICE = 1999;
const CRASH_OFFER_ENDS_IN = "3 days";
const CRASH_LAST_UPDATED = "May 2026";

// ─── 6–10 copy helpers (legacy path) ──────────────────────────────────────────

function makeWhatYoullLearn610(cls: number) {
  return [
    `Live classes for Class ${cls} Maths and Science`,
    "Strong fundamentals, taught chapter by chapter",
    "Class recordings — watch anytime on mobile or tablet",
    "Aligned with the full NCERT syllabus",
  ];
}

function makeCourseIncludes610(cls: number): { icon: IncludesIconType; label: string }[] {
  return [
    { icon: "video", label: `Live classes for every Class ${cls} chapter` },
    { icon: "book", label: "Class recordings — watch anytime" },
    { icon: "clock", label: "15 days · summer break-friendly schedule" },
    { icon: "check", label: "One-time payment · lifetime access" },
  ];
}

function makeDescription610(cls: number) {
  return `Class ${cls} Summer Crash Course covers Maths and Science chapter by chapter. Each chapter has a live session, plus full recordings to watch anytime. 15 days, 2 subjects — one-time payment, lifetime access.`;
}

// ─── 11–12 copy helpers ───────────────────────────────────────────────────────

function makeWhatYoullLearn1112(info: CrashCourse1112Info) {
  const subjList = info.subjects.map((s) => s.title).join(", ");
  return [
    `Live classes for ${subjList}`,
    "Latest NCERT syllabus, chapter by chapter",
    "Class recordings — watch anytime on mobile or tablet",
    `Built for ${info.examTarget}`,
  ];
}

function makeCourseIncludes1112(info: CrashCourse1112Info): { icon: IncludesIconType; label: string }[] {
  return [
    { icon: "video", label: `Live classes for every Class ${info.classLevel} ${info.streamLabel} chapter` },
    { icon: "book", label: "Class recordings — watch anytime" },
    { icon: "clock", label: "15 days · last-mile focused schedule" },
    { icon: "check", label: "One-time payment · lifetime access" },
  ];
}

const WHAT_YOU_NEED: { icon: NeedsIconType; label: string }[] = [
  { icon: "smartphone", label: "Smartphone or tablet (iOS or Android)" },
  { icon: "wifi", label: "Stable internet connection" },
  { icon: "pencil", label: "A notebook for practice" },
  { icon: "clock", label: "1–2 hours a day for live classes" },
];

// ─── IncludesIcon ─────────────────────────────────────────────────────────────

type IncludesIconType = "video" | "book" | "clock" | "check";

function IncludesIcon({ icon, accentColor }: { icon: IncludesIconType; accentColor: string }) {
  const el = (() => {
    if (icon === "video") return <Video size={16} style={{ color: accentColor }} />;
    if (icon === "clock") return <Clock size={16} style={{ color: accentColor }} />;
    if (icon === "check") return <CheckCircle2 size={16} style={{ color: accentColor }} />;
    return <BookOpen size={16} style={{ color: accentColor }} />;
  })();
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${accentColor}14` }}
    >
      {el}
    </div>
  );
}

// ─── NeedsIcon ────────────────────────────────────────────────────────────────

type NeedsIconType = "smartphone" | "wifi" | "pencil" | "clock";

function NeedsIcon({ icon }: { icon: NeedsIconType }) {
  const props = { size: 20, style: { color: "var(--muted-foreground)", flexShrink: 0, marginTop: 1 } };
  if (icon === "smartphone") return <Smartphone {...props} />;
  if (icon === "wifi") return <Wifi {...props} />;
  if (icon === "pencil") return <Pencil {...props} />;
  return <Clock {...props} />;
}

// ─── Code-rendered hero for 11-12 SKUs (no per-SKU banner image yet) ─────────

function Hero1112({ info, theme }: { info: CrashCourse1112Info; theme: "light" | "dark" }) {
  const gradient = theme === "light" ? info.gradientBgLight : info.gradientBg;
  const accent = theme === "light" ? info.accentColorLight : info.accentColor;
  const totalChapters = info.subjects.reduce((s, sub) => s + sub.chapters, 0);

  return (
    <div
      aria-label={info.title}
      style={{
        width: "100%",
        aspectRatio: "1312 / 740",
        position: "relative",
        overflow: "hidden",
        background: gradient,
        flexShrink: 0,
      }}
    >
      {/* Diagonal speed lines for depth */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        background:
          "repeating-linear-gradient(112deg, transparent 0 24px, rgba(255,255,255,0.04) 24px 25px, transparent 25px 48px, rgba(0,0,0,0.18) 48px 49px)",
        mixBlendMode: "overlay",
      }} />

      {/* Radial accent glow top-right */}
      <div aria-hidden style={{
        position: "absolute", top: "-12%", right: "-8%", width: "60%", height: "70%", borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}40 0%, ${accent}10 50%, transparent 75%)`,
        filter: "blur(2px)",
      }} />

      {/* Hero numeral — class number, bottom-right */}
      <span style={{
        position: "absolute", right: "4%", bottom: "-6%",
        fontSize: "min(56vw, 320px)", fontWeight: 900, lineHeight: 1, letterSpacing: -8,
        background: `linear-gradient(180deg, ${theme === "light" ? "#fff" : "#fff"} 0%, ${accent} 80%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text", color: "transparent",
        filter: `drop-shadow(0 0 20px ${accent}66) drop-shadow(0 8px 12px rgba(0,0,0,0.5))`,
        opacity: 0.32,
        pointerEvents: "none",
      }}>
        {info.classLevel}
      </span>

      {/* Stream chip — top-right */}
      <div style={{
        position: "absolute", top: "8%", right: "5%",
        paddingLeft: 12, paddingRight: 12, height: 28, borderRadius: 6,
        display: "flex", alignItems: "center",
        background: `linear-gradient(180deg, ${accent}f2 0%, ${accent}cc 100%)`,
        boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.35), 0 2px 8px rgba(0,0,0,0.35)",
      }}>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 900, color: theme === "light" ? "#fff" : "#0a0a0a", letterSpacing: 1.2 }}>
          {info.streamLabel}
        </span>
      </div>

      {/* Title block — bottom-left */}
      <div style={{
        position: "absolute", left: "5%", bottom: "10%",
        display: "flex", flexDirection: "column", gap: 4,
        maxWidth: "70%",
      }}>
        <span style={{
          fontSize: "var(--text-xs)", fontWeight: 700, color: `${accent}`,
          letterSpacing: 1.6, textTransform: "uppercase",
        }}>
          {info.subjects.map((s) => s.shortLabel).join(" · ")}
        </span>
        <span style={{
          fontSize: 26, fontWeight: 900, color: "#fff",
          lineHeight: 1.05, letterSpacing: -0.4,
          textShadow: "0 2px 12px rgba(0,0,0,0.55)",
        }}>
          CRASH COURSE
        </span>
        <span style={{
          fontSize: "var(--text-xs)", fontWeight: 600, color: "rgba(255,255,255,0.78)",
          letterSpacing: 0.4, marginTop: 2,
        }}>
          Class {info.classLevel} · {totalChapters} chapters
        </span>
      </div>

      {/* Status bar legibility gradient */}
      <div aria-hidden style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "30%",
        background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [descExpanded, setDescExpanded] = useState(false);

  const { theme } = useTheme();

  // Branch on URL params: `?sku=` (11–12) takes precedence over `?class=` (6–10 legacy).
  const skuParam = searchParams.get("sku");
  const info1112 = getCrash1112Info(skuParam);
  const is1112 = !!info1112;

  const cls = is1112
    ? info1112!.classLevel
    : parseInt(searchParams.get("class") || String(DEFAULT_CLASS), 10);

  // Per-mode derived values.
  const accent = is1112
    ? (theme === "light" ? info1112!.accentColorLight : info1112!.accentColor)
    : (theme === "light" ? C610.accentColorLight : C610.accentColor);

  const title = is1112 ? info1112!.title : `Class ${cls} Summer Crash Course`;
  const subtitleShort610 = "Maths and Science, taught chapter by chapter. Built to make summer break count.";
  const description = is1112 ? info1112!.description : makeDescription610(cls);
  const whatYoullLearn = is1112 ? makeWhatYoullLearn1112(info1112!) : makeWhatYoullLearn610(cls);
  const courseIncludes = is1112 ? makeCourseIncludes1112(info1112!) : makeCourseIncludes610(cls);
  const subjectChips = is1112
    ? info1112!.subjects.map((s) => s.shortLabel)
    : ["MATHS", "SCIENCE"];
  const totalChapters = is1112
    ? info1112!.subjects.reduce((s, sub) => s + sub.chapters, 0)
    : C610.subjects.reduce((s, sub) => s + sub.chapters, 0);

  const discountPct = Math.round((1 - CRASH_PRICE / CRASH_ORIGINAL_PRICE) * 100);

  // Class 6 and Class 7 are bundled with the GYD Max plan. In production, the
  // user's GYD Max status is read from their entitlement record (single source
  // of truth). For this demo we hardcode two states — Class 6 shows the
  // "student already has GYD Max" path, Class 7 shows the "needs to purchase"
  // path — so stakeholders can walk both UIs by switching classes.
  // TODO(api): GET /api/user/entitlements/gyd-max
  const requiresGydMax = !is1112 && (cls === 6 || cls === 7);
  const gydMaxActive = requiresGydMax && cls === 6;
  const isLockedByGyd = requiresGydMax && !gydMaxActive;

  // Enrollment + progress state (read from localStorage).
  // 6–10 keyspace: cc_selected_class, cc_setup_complete_<N>, cc_progress_<N>
  // 11–12 keyspace: cc_selected_sku, cc_setup_complete_<sku>, cc_progress_<sku>
  const enrollmentKey = is1112 ? info1112!.sku : String(cls);
  const savedRaw = typeof window !== "undefined"
    ? (is1112 ? localStorage.getItem("cc_selected_sku") : localStorage.getItem("cc_selected_class"))
    : null;
  const isEnrolledThis = is1112 ? savedRaw === info1112!.sku : savedRaw === String(cls);
  const setupComplete = typeof window !== "undefined"
    && localStorage.getItem(`cc_setup_complete_${enrollmentKey}`) === "1";
  const hasStarted = typeof window !== "undefined"
    && localStorage.getItem(`cc_progress_${enrollmentKey}`) === "1";

  function buildQuery() {
    return is1112 ? `sku=${info1112!.sku}` : `class=${cls}`;
  }

  function handleCTA() {
    if (isLockedByGyd) {
      navigate("/paywall-v2");
      return;
    }
    const q = buildQuery();
    if (!isEnrolledThis) {
      navigate(`/crash-course-enrolled?${q}`);
      return;
    }
    if (!setupComplete) {
      navigate(`/onboarding-crash-course?${q}`, { replace: true });
      return;
    }
    navigate(
      is1112 && info1112!.sku === "ncert-10-maths" ? "/ai-tutor/chapter-home" : `/crash-course-hub?${q}`,
      { replace: true }
    );
  }

  const ctaLabel = isLockedByGyd
    ? "Get GYD Max"
    : !isEnrolledThis
    ? "Enroll Now"
    : !setupComplete
    ? "Continue Setup"
    : !hasStarted
    ? "Start Learning"
    : "Continue Learning";

  const courseIdForReviews = is1112 ? info1112!.sku : `crash-${cls}`;

  return (
    <div
      style={{
        height: "100dvh",
        position: "relative",
        backgroundColor: "var(--background)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Floating close — overlay on the hero, top-right */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate(-1)}
        aria-label="Close"
        className="flex items-center justify-center"
        style={{
          position: "absolute", top: 52, right: 12, zIndex: 50,
          width: 36, height: 36, borderRadius: 9999,
          backgroundColor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "none", cursor: "pointer",
        }}
      >
        <X size={20} style={{ color: "#fff" }} />
      </motion.button>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Hero — 11-12 uses code-rendered gradient; 6-10 uses banner image */}
        {is1112 ? (
          <div style={{ position: "relative" }}>
            <Hero1112 info={info1112!} theme={theme === "light" ? "light" : "dark"} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, pointerEvents: "none" }}>
              <StatusBar />
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", aspectRatio: "1312 / 740", position: "relative", overflow: "hidden", backgroundColor: "var(--card)", flexShrink: 0 }}>
            <img
              src={`/crash-banner-${cls}-${theme === "light" ? "light" : "dark"}.png`}
              alt={`Class ${cls} Summer Crash Course`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 60%, transparent 100%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, pointerEvents: "none" }}>
              <StatusBar />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col" style={{ padding: 16, gap: 20 }}>

          {/* Title block */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <div
                className="flex items-center justify-center"
                style={{ paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 4, backgroundColor: `${accent}20`, border: `1px solid ${accent}40` }}
              >
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", color: accent, letterSpacing: 1 }}>
                  CRASH COURSE
                </span>
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                Updated {CRASH_LAST_UPDATED}
              </span>
            </div>

            <span style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", lineHeight: 1.3 }}>
              {title}
            </span>

            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
              {is1112
                ? `${info1112!.subjects.map((s) => s.title).join(", ")} — taught chapter by chapter. Built for ${info1112!.examTarget}.`
                : subtitleShort610}
            </span>

            {/* Subject chips — only for 11-12 (6-10 shows the same in stats row) */}
            {is1112 && (
              <div className="flex items-center" style={{ gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {subjectChips.map((chip) => (
                  <div
                    key={chip}
                    className="flex items-center justify-center"
                    style={{
                      paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 4,
                      backgroundColor: `${accent}14`,
                      border: `0.5px solid ${accent}33`,
                    }}
                  >
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: accent, letterSpacing: 0.6 }}>
                      {chip}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Stats row */}
            <div className="flex items-center" style={{ gap: 12, flexWrap: "wrap", marginTop: 4 }}>
              <div className="flex items-center" style={{ gap: 4 }}>
                <Clock size={12} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>15 Days</span>
              </div>
              <div className="flex items-center" style={{ gap: 4 }}>
                <BookOpen size={12} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  {is1112 ? info1112!.subjects.map((s) => s.title).join(" · ") : "Maths & Science"}
                </span>
              </div>
              <div className="flex items-center" style={{ gap: 4 }}>
                <Video size={12} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{totalChapters} chapters</span>
              </div>
            </div>
          </div>

          {/* Inline price block — Class 6/7 swap in a GYD Max card.
              GYD Max brand: purple + Crown icon (per Sagar). Kept distinct
              from crash-course green so the two concepts read separately. */}
          {requiresGydMax ? (
            <div
              className="flex items-center"
              style={{
                gap: 12, padding: 12, borderRadius: 12,
                backgroundColor: "var(--purple-alpha-12)",
                border: "1px solid var(--purple-alpha-25)",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: "var(--purple-alpha-25)",
                }}
              >
                {gydMaxActive
                  ? <Crown size={18} style={{ color: "var(--purple-500)" }} />
                  : <Lock size={18} style={{ color: "var(--purple-500)" }} />}
              </div>
              <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                  {gydMaxActive ? "Included in your GYD Max plan" : "Included in GYD Max"}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                  {gydMaxActive
                    ? "Enroll free — no extra payment needed"
                    : "Get GYD Max to unlock this crash course"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                &#x20B9;{CRASH_PRICE.toLocaleString("en-IN")}
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
                &#x20B9;{CRASH_ORIGINAL_PRICE.toLocaleString("en-IN")}
              </span>
              <div
                className="flex items-center justify-center"
                style={{
                  paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 4,
                  backgroundColor: "color-mix(in srgb, var(--warning-500) 14%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
                }}
              >
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--warning-500)" }}>
                  {discountPct}% off
                </span>
              </div>
            </div>
          )}

          {/* CTA buttons — Free Demo + Curriculum. ncert-10-maths has no
              separate recorded demo — Chapter 1 itself is the free preview —
              so only the Curriculum button shows for it. */}
          <div className="flex" style={{ gap: 12 }}>
            {!(is1112 && info1112!.sku === "ncert-10-maths") && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/recording-v2")}
                className="flex items-center justify-center"
                style={{
                  flex: 1, height: 40, borderRadius: 12, gap: 6,
                  backgroundColor: "transparent",
                  border: "1px solid var(--primary)",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <Play size={14} fill="var(--primary)" style={{ color: "var(--primary)" }} />
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary)" }}>
                  Free Demo
                </span>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(
                is1112 && info1112!.sku === "ncert-10-maths"
                  ? isEnrolledThis
                    ? "/ai-tutor/chapter-home"
                    : "/ai-tutor/curriculum-preview?demo=ai-tutor"
                  : is1112
                    ? `/course-curriculum?course=crash&sku=${info1112!.sku}`
                    : `/course-curriculum?course=crash&class=${cls}`
              )}
              className="flex items-center justify-center"
              style={{
                flex: 1, height: 40, borderRadius: 12, gap: 6,
                backgroundColor: "transparent",
                border: "1px solid var(--primary)",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <BookOpen size={14} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary)" }}>
                Curriculum
              </span>
            </motion.button>
          </div>

          {/* What you'll learn */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)" }}>
              What you'll learn
            </span>
            <div className="flex flex-col" style={{ gap: 12, padding: 16, backgroundColor: "var(--card-bg-secondary)", borderRadius: 12 }}>
              {whatYoullLearn.map((item, i) => (
                <div key={i} className="flex items-start" style={{ gap: 12 }}>
                  <CheckCircle2 size={20} style={{ color: accent, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* This course includes */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)" }}>
              This course includes
            </span>
            <div className="flex flex-col" style={{ padding: 16, backgroundColor: "var(--card-bg-secondary)", borderRadius: 12 }}>
              {courseIncludes.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center" style={{ gap: 12, paddingTop: i === 0 ? 0 : 12, paddingBottom: i === courseIncludes.length - 1 ? 0 : 12 }}>
                    <IncludesIcon icon={item.icon} accentColor={accent} />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)" }}>{item.label}</span>
                  </div>
                  {i < courseIncludes.length - 1 && (
                    <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 44 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* What You Need */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              What You Need
            </span>
            <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
              {WHAT_YOU_NEED.map((item, i) => (
                <div key={i}>
                  <div className="flex items-start" style={{ gap: 16, paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16 }}>
                    <NeedsIcon icon={item.icon} />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.5 }}>{item.label}</span>
                  </div>
                  {i < WHAT_YOU_NEED.length - 1 && (
                    <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 52 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)" }}>
              Description
            </span>
            <div style={{ padding: 16, backgroundColor: "var(--card-bg-secondary)", borderRadius: 12 }}>
              <p style={{
                fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.6, margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: descExpanded ? undefined : 6,
                WebkitBoxOrient: "vertical",
                overflow: descExpanded ? "visible" : "hidden",
              }}>
                {description}
              </p>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="flex items-center"
                style={{ gap: 4, marginTop: 4, background: "none", border: "none", cursor: "pointer", paddingTop: 8, paddingBottom: 8, paddingLeft: 0, paddingRight: 0, fontFamily: "inherit", minHeight: 44 }}
              >
                <span style={{ fontSize: "var(--text-sm)", color: "var(--primary)", fontWeight: "var(--font-weight-medium)" }}>
                  {descExpanded ? "Show less" : "Show more"}
                </span>
                {descExpanded
                  ? <ChevronUp size={14} style={{ color: "var(--primary)" }} />
                  : <ChevronDown size={14} style={{ color: "var(--primary)" }} />
                }
              </button>
            </div>
          </div>

          {/* Reviews preview */}
          <CourseReviewsPreview courseId={courseIdForReviews} />

          {/* Have questions? — Call support card */}
          <div
            className="flex items-center"
            style={{
              gap: 12,
              padding: 12,
              backgroundColor: "var(--card-bg-secondary)",
              borderRadius: 12,
              marginBottom: 80,
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 40, height: 40, borderRadius: 8,
                backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
              }}
            >
              <Phone size={20} style={{ color: "var(--foreground)" }} />
            </div>
            <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                Have questions?
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Talk to a course expert
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { window.location.href = "tel:+919876543210"; }}
              className="flex items-center justify-center shrink-0"
              style={{
                height: 36, paddingLeft: 14, paddingRight: 14, borderRadius: 8,
                backgroundColor: "transparent",
                border: "1px solid var(--primary)",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary)" }}>
                Call Now
              </span>
            </motion.button>
          </div>

        </div>
      </div>

      {/* ── Sticky bottom bar ── */}
      <div
        className="flex flex-col shrink-0"
        style={{
          paddingLeft: 16, paddingRight: 16, paddingTop: 12,
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))" as unknown as number,
          backgroundColor: "var(--card)",
          backdropFilter: "blur(12px)",
          borderTop: `0.5px solid ${accent}44`,
        }}
      >
        <div className="flex items-center justify-between">
          {requiresGydMax ? (
            <div className="flex items-center" style={{ gap: 8 }}>
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  backgroundColor: "var(--purple-alpha-25)",
                }}
              >
                {gydMaxActive
                  ? <Crown size={14} style={{ color: "var(--purple-500)" }} />
                  : <Lock size={14} style={{ color: "var(--purple-500)" }} />}
              </div>
              <div className="flex flex-col" style={{ gap: 2 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", lineHeight: 1.2 }}>
                  GYD Max
                </span>
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--purple-500)", fontWeight: "var(--font-weight-semibold)" }}>
                  {gydMaxActive ? "Active · enroll free" : "Required to enroll"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 2 }}>
              <div className="flex items-center" style={{ gap: 6 }}>
                <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                  &#x20B9;{CRASH_PRICE.toLocaleString("en-IN")}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
                  &#x20B9;{CRASH_ORIGINAL_PRICE.toLocaleString("en-IN")}
                </span>
                <div
                  className="flex items-center justify-center"
                  style={{
                    paddingLeft: 6, paddingRight: 6, height: 18, borderRadius: 4,
                    backgroundColor: "color-mix(in srgb, var(--warning-500) 15%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
                  }}
                >
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--warning-500)" }}>
                    {discountPct}% off
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--warning-500)" }}>
                Offer ends in {CRASH_OFFER_ENDS_IN}
              </span>
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCTA}
            className="flex items-center justify-center"
            style={{
              height: 40, paddingLeft: 16, paddingRight: 16, minWidth: 140,
              borderRadius: 12, backgroundColor: "var(--primary)", border: "none",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--primary-foreground)", whiteSpace: "nowrap" }}>
              {ctaLabel}
            </span>
          </motion.button>
        </div>

      </div>
    </div>
  );
}

