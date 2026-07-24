import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import {
  X, Play, Clock, BookOpen, Video, Zap, ClipboardList, BarChart2,
  Check, CheckCircle2, ChevronDown, ChevronUp, Smartphone, Laptop, Wifi, Phone, Layers, BookMarked,
} from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import { CourseReviewsPreview } from "./course-reviews-preview";

// TODO(api): GET /api/courses/:examId
const EXAM_DATA: Record<string, ExamCourse> = {
  cat: {
    exam: "CAT",
    shortLabel: "CAT",
    plan: "3 Months",
    price: 2999,
    originalPrice: 5999,
    title: "CAT Complete Prep",
    tagline: "All 4 CAT subjects — VARC, DILR, QA & Exam Strategy — with live, expert-led classes.",
    lastUpdated: "Apr 2026",
    totalTopics: 100,
    chapters: 24,
    subjects: 4,
    offerEndsIn: "2 days",
    heroGradient: "linear-gradient(150.94deg, rgb(43,29,17) 0%, rgb(89,56,21) 50%, rgb(124,74,21) 100%)",
    examAccent: "#d87a16",
    examBadgeBg: "#2b1d11",
    examBadgeBorder: "#593815",
    discountBadgeBg: "#2b2111",
    discountBadgeBorder: "#594214",
    discountAccent: "#d89614",
    stickyBorderColor: "#593815",
    iconChipBg: "#442a11",
    whatYoullLearn: [
      "Master Quantitative Aptitude (QA) from basics to advanced",
      "Build speed & accuracy in Verbal Ability & RC (VARC)",
      "Crack Data Interpretation & Logical Reasoning (DILR)",
      "Sharpen exam strategy, orientation & mock management",
    ],
    courseIncludes: [
      { icon: "clock" as const, label: "3 months of unlimited access" },
      { icon: "video" as const, label: "159 hours of live, expert-led classes" },
      { icon: "zap" as const, label: "Live doubt-solving in every class" },
      { icon: "book" as const, label: "Class recordings — watch anytime on mobile & tablet" },
    ],
    whatYouNeed: [
      { icon: "check" as const, label: "Basic 10th standard mathematics required" },
      { icon: "book" as const, label: "Commitment to study 2–3 hours daily" },
      { icon: "smartphone" as const, label: "Smartphone or tablet (iOS or Android)" },
      { icon: "wifi" as const, label: "Stable internet connection" },
    ],
    description: "Master the CAT exam with our comprehensive 3-month program. The course covers every aspect of the exam from fundamentals to advanced techniques. Whether you're starting from scratch or looking to boost your percentile, this course has everything you need to succeed.",
  },
  "jee-mains": {
    exam: "JEE Mains",
    shortLabel: "JEE M",
    plan: "12 Months",
    price: 8999,
    originalPrice: 17999,
    title: "JEE Mains 2025 Full Course",
    tagline: "Complete Physics, Chemistry & Maths preparation with 15,000+ questions and 200+ live classes.",
    lastUpdated: "Mar 2025",
    totalTopics: 320,
    chapters: 30,
    subjects: 3,
    offerEndsIn: "3 days",
    heroGradient: "linear-gradient(150.94deg, rgb(0,10,51) 0%, rgb(0,44,140) 50%, rgb(9,88,217) 100%)",
    examAccent: "#4096ff",
    examBadgeBg: "#001d66",
    examBadgeBorder: "#0050b3",
    discountBadgeBg: "#001d66",
    discountBadgeBorder: "#0050b3",
    discountAccent: "#69b1ff",
    stickyBorderColor: "#0050b3",
    iconChipBg: "#001d66",
    whatYoullLearn: [
      "Build strong fundamentals in Physics, Chemistry & Maths",
      "Solve 15,000+ JEE-pattern questions with solutions",
      "Chapter-wise PYQs from 2010–2024, fully explained",
      "200+ live classes with India's top JEE faculty",
      "Weekly full-length JEE Mains mock tests",
      "Detailed rank analysis and improvement roadmap",
    ],
    courseIncludes: [
      { icon: "clock" as const, label: "12 months of unlimited access" },
      { icon: "video" as const, label: "200+ live classes with instant replays" },
      { icon: "zap" as const, label: "15,000+ topic-wise practice questions" },
      { icon: "book" as const, label: "15 years of JEE Mains PYQs, fully solved" },
      { icon: "list" as const, label: "Personalised performance analytics" },
      { icon: "chart" as const, label: "Verifiable certificate of completion" },
    ],
    whatYouNeed: [
      { icon: "check" as const, label: "10th standard Maths & Science knowledge" },
      { icon: "book" as const, label: "4–5 hours of daily study recommended" },
      { icon: "laptop" as const, label: "Smartphone or laptop" },
      { icon: "wifi" as const, label: "Stable internet connection" },
    ],
    description: "Crack JEE Mains 2025 with our year-long comprehensive program covering Physics, Chemistry, and Mathematics. Developed by IIT alumni and top JEE educators with 10+ years of results-proven teaching experience. This course systematically builds concepts, problem-solving speed, and test-taking strategy to maximise your NTA score.",
  },
  "jee-advanced": {
    exam: "JEE Advanced",
    shortLabel: "JEE Adv",
    plan: "12 Months",
    price: 11999,
    originalPrice: 22999,
    title: "JEE Advanced 2025 Elite Prep",
    tagline: "IIT-level preparation with deep concept mastery, 500+ solved problems, and 1-on-1 mentoring.",
    lastUpdated: "Feb 2025",
    totalTopics: 380,
    chapters: 36,
    subjects: 3,
    offerEndsIn: "5 days",
    heroGradient: "linear-gradient(150.94deg, rgb(18,3,56) 0%, rgb(57,16,133) 50%, rgb(83,29,171) 100%)",
    examAccent: "#9254de",
    examBadgeBg: "#120338",
    examBadgeBorder: "#391085",
    discountBadgeBg: "#120338",
    discountBadgeBorder: "#391085",
    discountAccent: "#b37feb",
    stickyBorderColor: "#391085",
    iconChipBg: "#1d0a45",
    whatYoullLearn: [
      "Deep concept mastery in Physics, Chemistry & Maths",
      "Advanced problem-solving for IIT-level difficulty",
      "Multi-concept integration questions and approach",
      "500+ fully solved JEE Advanced previous year papers",
      "1-on-1 mentoring sessions with IIT graduates",
      "Rank-predictor tests and IIT branch selection guidance",
    ],
    courseIncludes: [
      { icon: "clock" as const, label: "12 months of unlimited access" },
      { icon: "video" as const, label: "300+ advanced concept sessions" },
      { icon: "zap" as const, label: "20,000+ IIT-level practice problems" },
      { icon: "book" as const, label: "20 years of JEE Advanced PYQs, solved" },
      { icon: "list" as const, label: "IIT rank predictor & analytics" },
      { icon: "chart" as const, label: "Verifiable certificate of completion" },
    ],
    whatYouNeed: [
      { icon: "check" as const, label: "Completed JEE Mains preparation" },
      { icon: "book" as const, label: "6+ hours of daily study required" },
      { icon: "laptop" as const, label: "Laptop recommended for full experience" },
      { icon: "wifi" as const, label: "Stable internet connection" },
    ],
    description: "Prepare for JEE Advanced 2025 with India's most rigorous IIT-focused program. Built for students who want to crack the top 1%, this course goes deep into multi-concept problem solving, time management under pressure, and systematic revision. Our faculty are IIT alumni with proven track records of mentoring IIT rank holders.",
  },
};

interface ExamCourse {
  exam: string;
  shortLabel: string;
  plan: string;
  price: number;
  originalPrice: number;
  title: string;
  tagline: string;
  lastUpdated: string;
  totalTopics: number;
  chapters: number;
  subjects: number;
  offerEndsIn: string;
  heroGradient: string;
  examAccent: string;
  examBadgeBg: string;
  examBadgeBorder: string;
  discountBadgeBg: string;
  discountBadgeBorder: string;
  discountAccent: string;
  stickyBorderColor: string;
  iconChipBg: string;
  whatYoullLearn: string[];
  courseIncludes: { icon: IncludesIconType; label: string; upcoming?: boolean }[];
  whatYouNeed: { icon: NeedsIconType; label: string }[];
  description: string;
}

type IncludesIconType = "video" | "zap" | "book" | "clock" | "list" | "chart";
type NeedsIconType = "check" | "book" | "laptop" | "wifi" | "smartphone";

interface IncludesIconProps {
  icon: IncludesIconType;
  chipBg: string;
  accent: string;
}

function IncludesIcon({ icon, chipBg, accent }: IncludesIconProps) {
  const iconEl = (() => {
    if (icon === "video") return <Video size={16} style={{ color: accent }} />;
    if (icon === "zap") return <Zap size={16} style={{ color: accent }} />;
    if (icon === "clock") return <Clock size={16} style={{ color: accent }} />;
    if (icon === "list") return <ClipboardList size={16} style={{ color: accent }} />;
    if (icon === "chart") return <BarChart2 size={16} style={{ color: accent }} />;
    return <BookOpen size={16} style={{ color: accent }} />;
  })();

  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: chipBg }}
    >
      {iconEl}
    </div>
  );
}

interface NeedsIconProps {
  icon: NeedsIconType;
}

function NeedsIcon({ icon }: NeedsIconProps) {
  if (icon === "smartphone") return <Smartphone size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />;
  if (icon === "laptop") return <Laptop size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />;
  if (icon === "wifi") return <Wifi size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />;
  if (icon === "book") return <BookOpen size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />;
  return <Check size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />;
}

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [descExpanded, setDescExpanded] = useState(false);

  const examKey = searchParams.get("exam") ?? "cat";
  const C = EXAM_DATA[examKey] ?? EXAM_DATA.cat;

  const discountPct = Math.round((1 - C.price / C.originalPrice) * 100);

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

      {/* ── Scrollable Content ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Hero — same recipe as the morph (dark accent + brand glow + big letter)
            so the card unfurls into this hero with no visual swap. */}
        <div
          style={{
            width: "100%",
            height: 260,
            backgroundColor: `color-mix(in srgb, ${C.examAccent} 10%, #0a0408)`,
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div aria-hidden style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${C.examAccent}40 0%, ${C.examAccent}18 45%, transparent 100%)` }} />
          <div aria-hidden style={{ position: "absolute", top: -100, right: -80, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${C.examAccent} 0%, ${C.examAccent}55 35%, transparent 70%)`, filter: "blur(36px)", opacity: 0.7 }} />
          <div aria-hidden style={{ position: "absolute", bottom: -80, left: -60, width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${C.examAccent} 0%, transparent 70%)`, filter: "blur(44px)", opacity: 0.35 }} />

          {/* Status bar legibility gradient */}
          <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 88, background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, pointerEvents: "none" }}>
            <StatusBar />
          </div>

          <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0 }}>
            <span style={{ fontSize: 124, fontWeight: 900, color: C.examAccent, opacity: 0.88, letterSpacing: -4, lineHeight: 1, textShadow: [`0 0 56px ${C.examAccent}99`, `0 4px 18px ${C.examAccent}55`].join(", ") }}>
              {C.exam.split(" ")[0]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col" style={{ padding: 16, gap: 20 }}>

          {/* Title block */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <div
                className="flex items-center justify-center"
                style={{ paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 4, backgroundColor: C.examAccent + "20", border: `1px solid ${C.examAccent}40` }}
              >
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", color: C.examAccent, letterSpacing: 1 }}>
                  {C.shortLabel}
                </span>
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Updated {C.lastUpdated}</span>
            </div>

            <span style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", lineHeight: 1.3 }}>
              {C.title}
            </span>

            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
              {C.tagline}
            </span>

            {/* Stats row */}
            <div className="flex items-center" style={{ gap: 12, flexWrap: "wrap" }}>
              <div className="flex items-center" style={{ gap: 4 }}>
                <Clock size={12} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{C.plan}</span>
              </div>
              <div className="flex items-center" style={{ gap: 4 }}>
                <BookMarked size={12} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{C.subjects} subjects</span>
              </div>
              <div className="flex items-center" style={{ gap: 4 }}>
                <Layers size={12} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{C.totalTopics} topics</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-col" style={{ gap: 6 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                &#x20B9;{C.price.toLocaleString("en-IN")}
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
                &#x20B9;{C.originalPrice.toLocaleString("en-IN")}
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
            <span style={{ fontSize: "var(--text-xs)", color: C.examAccent }}>
              Offer ends in {C.offerEndsIn}
            </span>
          </div>

          {/* CTA buttons — side-by-side secondaries */}
          <div className="flex" style={{ gap: 12 }}>
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

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/course-curriculum")}
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
              {C.whatYoullLearn.map((item, i) => (
                <div key={i} className="flex items-start" style={{ gap: 12 }}>
                  <CheckCircle2 size={20} style={{ color: C.examAccent, flexShrink: 0, marginTop: 2 }} />
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
              {C.courseIncludes.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center" style={{ gap: 12, paddingTop: i === 0 ? 0 : 12, paddingBottom: i === C.courseIncludes.length - 1 ? 0 : 12 }}>
                    <IncludesIcon icon={item.icon} chipBg={C.examAccent + "20"} accent={C.examAccent} />
                    <span style={{ fontSize: "var(--text-sm)", color: item.upcoming ? "var(--muted-foreground)" : "var(--foreground)", flex: 1 }}>{item.label}</span>
                    {item.upcoming && (
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          paddingLeft: 8,
                          paddingRight: 8,
                          height: 20,
                          borderRadius: 4,
                          backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--foreground) 16%, transparent)",
                        }}
                      >
                        <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)", letterSpacing: 0.5 }}>
                          SOON
                        </span>
                      </div>
                    )}
                  </div>
                  {i < C.courseIncludes.length - 1 && (
                    <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 44 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* What You Need */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)" }}>
              What You Need
            </span>
            <div className="flex flex-col" style={{ padding: 16, backgroundColor: "var(--card-bg-secondary)", borderRadius: 12 }}>
              {C.whatYouNeed.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center" style={{ gap: 12, minHeight: 52, paddingTop: 8, paddingBottom: 8 }}>
                    <NeedsIcon icon={item.icon} />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.5 }}>{item.label}</span>
                  </div>
                  {i < C.whatYouNeed.length - 1 && (
                    <div style={{ height: 0.5, backgroundColor: "var(--border)" }} />
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
                fontSize: "var(--text-sm)",
                color: "var(--muted-foreground)",
                lineHeight: 1.6,
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: descExpanded ? undefined : 6,
                WebkitBoxOrient: "vertical",
                overflow: descExpanded ? "visible" : "hidden",
              }}>
                {C.description}
              </p>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="flex items-center"
                style={{
                  gap: 4, marginTop: 4, background: "none", border: "none", cursor: "pointer",
                  paddingTop: 8, paddingBottom: 8, paddingLeft: 0, paddingRight: 0,
                  fontFamily: "inherit", minHeight: 44,
                }}
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

          {/* Reviews preview — buy-decision aid for prospective students.
              The "Rate this course" banner lives on /learning-path (the
              post-purchase "using it" surface), not here. */}
          <CourseReviewsPreview courseId={examKey} />

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

      {/* ── Sticky Bottom Bar ─────────────────────────────────── */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 12,
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))" as unknown as number,
          backgroundColor: "var(--card)",
          borderTop: "0.5px solid var(--border)",
        }}
      >
        <div className="flex flex-col" style={{ gap: 2 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
              &#x20B9;{C.price.toLocaleString("en-IN")}
            </span>
            <div
              className="flex items-center justify-center"
              style={{
                paddingLeft: 6, paddingRight: 6, height: 20, borderRadius: 4,
                backgroundColor: C.examAccent + "15",
                border: `1px solid ${C.examAccent}30`,
              }}
            >
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: C.examAccent, lineHeight: 1 }}>
                {discountPct}% off
              </span>
            </div>
          </div>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
            &#x20B9;{C.originalPrice.toLocaleString("en-IN")}
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/payment-success?exam=${examKey}`)}
          className="flex items-center justify-center"
          style={{
            height: 40,
            width: 140,
            borderRadius: 12,
            backgroundColor: "var(--primary)",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--primary-foreground)" }}>
            Enroll Now
          </span>
        </motion.button>
      </div>
    </div>
  );
}
