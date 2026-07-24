import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft, Share2, CalendarDays, Clock, Users,
  MessageCircle, Music, Video, FileText, Layers, BookOpen,
  Laptop, Wifi, CheckCircle2, Palette, Play, Briefcase, Heart, Phone,
} from "lucide-react";

// TODO(api): GET /api/courses/ai-summer-camp
const DUMMY_CAMP = {
  title: "AI Foundations Summer Camp",
  dateRange: "19 – 23 May 2026",
  totalHours: 10,
  seatsAccent: "#d89614",
  seatsBg: "#2b2111",
  seatsBorder: "#594214",
  pricing: {
    original: 5999,
    sale: 2999,
    discount: "50% off",
    ctaLabel: "Enroll Now",
  },
};

const TRACK_COLORS = {
  explorer: {
    heroGradient: "linear-gradient(150.94deg, rgb(19,22,41) 0%, rgb(20,72,72) 50%, rgb(20,98,98) 100%)",
    accentColor: "#13a8a8",
    heroAiColor: "#13a8a8",
    badgeBg: "#112123",
    badgeBorder: "#144848",
    iconBg: "#113536",
  },
  creator: {
    heroGradient: "linear-gradient(150.94deg, rgb(41,19,33) 0%, rgb(85,28,59) 50%, rgb(117,32,79) 100%)",
    accentColor: "#cb2b83",
    heroAiColor: "#cb2b83",
    badgeBg: "#291321",
    badgeBorder: "#551c3b",
    iconBg: "#40162f",
  },
};

// TODO(api): GET /api/courses/ai-summer-camp/tools
// `domain` drives the favicon source; `accent` powers the fallback initials tile
// when the favicon fails to load (works offline, in iframe sandboxes, etc).
const DUMMY_TOOLS: { name: string; domain: string; accent: string }[] = [
  { name: "ChatGPT",     domain: "chatgpt.com",       accent: "#10A37F" },
  { name: "Nano banana", domain: "gemini.google.com", accent: "#FBBC04" },
  { name: "HeyGen",      domain: "heygen.com",        accent: "#7B61FF" },
  { name: "Suno",        domain: "suno.com",          accent: "#FF5C8E" },
  { name: "Canva",       domain: "canva.com",         accent: "#00C4CC" },
];

interface TrackOutput {
  Icon: LucideIcon;
  label: string;
}

interface CampTrack {
  id: "explorer" | "creator";
  name: string;
  grade: string;
  ageRange: string;
  totalSeats: number;
  seatsLeft: number;
  outputs: TrackOutput[];
  takeHome: string[];
}

// TODO(api): GET /api/courses/ai-summer-camp/tracks
const DUMMY_CAMP_TRACKS: CampTrack[] = [
  {
    id: "explorer",
    name: "Explorer",
    grade: "Grade 6–8",
    ageRange: "Age 11–14",
    totalSeats: 25,
    seatsLeft: 15,
    outputs: [
      { Icon: MessageCircle, label: "AI Conversation Portfolio" },
      { Icon: Palette, label: "AI Art of Your Dream World" },
      { Icon: Music, label: "Original AI Song" },
      { Icon: Video, label: "AI Avatar Video" },
      { Icon: BookOpen, label: "AI School Quiz + Poster" },
    ],
    takeHome: [
      "OLL AI Foundations Certificate",
      "Google Drive portfolio — 8 to 10 AI creations",
      "Portfolio QR code card",
      "OLL Level 1 brochure + early-bird code",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    grade: "Grade 9–12",
    ageRange: "Age 14–18",
    totalSeats: 20,
    seatsLeft: 8,
    outputs: [
      { Icon: FileText, label: "Prompt Toolkit + Career Map" },
      { Icon: Layers, label: "Professional Midjourney Images" },
      { Icon: Music, label: "Music + Voiceover Track" },
      { Icon: Video, label: "30-sec Brand Video Ad" },
      { Icon: Briefcase, label: "Full AI Brand Campaign" },
    ],
    takeHome: [
      "Certificate Track B",
      "Portfolio Gamma deck — 10 slides, 7 projects",
      "LinkedIn-ready portfolio",
      "5-prompt library",
      "Priority invite — OLL Level 1/2A",
    ],
  },
];

// TODO(api): GET /api/courses/ai-summer-camp/interest
const DUMMY_INTEREST_COUNTS: Record<string, number> = {
  explorer: 142,
  creator: 89,
};

// Tool logo — Google favicon with branded-initials fallback. Used by the
// "Tools You'll Use" rail. Initials tile renders if the favicon errors or
// loads as a 1px transparent (which the favicon service returns for unknown
// domains).
function ToolLogo({ domain, accent, name }: { domain: string; accent: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (failed) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          width: 32, height: 32, borderRadius: 8,
          backgroundColor: `color-mix(in srgb, ${accent} 20%, transparent)`,
          border: `0.5px solid color-mix(in srgb, ${accent} 35%, transparent)`,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: -0.3 }}>
          {initials}
        </span>
      </div>
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={name}
      width={32}
      height={32}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth <= 1) setFailed(true);
      }}
      style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6 }}
    />
  );
}

const HEART_COLOR = "var(--error-500)";

// TODO(api): GET /api/courses/ai-summer-camp/schedule
const DUMMY_CAMP_SCHEDULE = [
  { day: 1, date: "May 19", topics: ["What IS AI + Prompt Engineering", "AI Makes Pictures"] },
  { day: 2, date: "May 20", topics: ["AI Makes Music & Sound", "AI Makes Videos & Avatars"] },
  { day: 3, date: "May 21", topics: ["AI for School & Study", "AI for Design & Creativity"] },
  { day: 4, date: "May 22", topics: ["Vibe Coding", "AI Doing Good & AI Gone Wrong"] },
  { day: 5, date: "May 23", topics: ["Capstone Project Build", "Showcase & Celebration"] },
];

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTrack = (searchParams.get("track") ?? "explorer") as "explorer" | "creator";

  const C = { ...DUMMY_CAMP, ...TRACK_COLORS[activeTrack] };
  const track = DUMMY_CAMP_TRACKS.find((t) => t.id === activeTrack) ?? DUMMY_CAMP_TRACKS[0];

  const [isInterested, setIsInterested] = useState(false);
  const interestedCount = DUMMY_INTEREST_COUNTS[activeTrack] + (isInterested ? 1 : 0);

  const toggleInterested = () => {
    const next = !isInterested;
    setIsInterested(next);
    const key = `prepmaster_camp_interested_${activeTrack}`;
    if (next) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  };

  useEffect(() => {
    setIsInterested(localStorage.getItem(`prepmaster_camp_interested_${activeTrack}`) === "1");
  }, [activeTrack]);
  return (
    <div style={{ height: "100dvh", position: "relative", backgroundColor: "var(--background)", overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* ── Fixed back + share buttons ─────────────────────────── */}
      <div
        className="flex items-center justify-between"
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "48px 16px 0",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: "var(--black-alpha-40)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer", pointerEvents: "all" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--white)" }} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigator.share?.({ title: C.title, url: window.location.href })}
          aria-label="Share course"
          className="flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: "var(--black-alpha-40)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer", pointerEvents: "all" }}
        >
          <Share2 size={20} style={{ color: "var(--white)" }} />
        </motion.button>
      </div>

      {/* ── Scrollable area ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* ── Video Demo Hero ─────────────────────────────────────── */}
        <motion.div
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate("/recording-v2")}
          style={{ position: "relative", width: "100%", height: 200, overflow: "hidden", background: C.heroGradient, flexShrink: 0, cursor: "pointer" }}
        >
          {/* Dot pattern */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `radial-gradient(circle, ${C.accentColor}26 1px, transparent 1px)`,
            backgroundSize: "12px 12px",
          }} />
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -40, right: -60, width: 140, height: 140, borderRadius: 9999, backgroundColor: `${C.accentColor}12` }} />
          <div style={{ position: "absolute", bottom: -32, left: -24, width: 96, height: 96, borderRadius: 9999, backgroundColor: `${C.accentColor}0D` }} />

          {/* AI logo lockup */}
          <div className="flex flex-col items-center justify-center" style={{ position: "absolute", inset: 0, gap: 4 }}>
            <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: -2, lineHeight: 1, color: C.accentColor, opacity: 0.9 }}>AI</span>
            <div style={{ width: 36, height: 1, backgroundColor: C.accentColor, opacity: 0.3 }} />
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", letterSpacing: 3, color: C.accentColor, opacity: 0.6, textTransform: "uppercase" }}>
              Summer Camp
            </span>
          </div>

          {/* Scrim + play button */}
          <div style={{ position: "absolute", inset: 0, backgroundColor: "var(--black-alpha-30)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              className="flex items-center justify-center"
              style={{ width: 56, height: 56, borderRadius: 9999, backgroundColor: "var(--black-alpha-50)", backdropFilter: "blur(6px)", border: "1.5px solid var(--white-alpha-25)" }}
            >
              <Play size={22} style={{ color: "var(--white)", marginLeft: 3 }} />
            </div>
          </div>

          {/* DEMO label */}
          <div className="flex items-center justify-center" style={{
            position: "absolute", bottom: 12, left: 12,
            paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 4,
            backgroundColor: "var(--black-alpha-50)", border: "1px solid var(--white-alpha-15)",
          }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", color: "var(--white-alpha-85)", letterSpacing: 1 }}>FREE DEMO</span>
          </div>
        </motion.div>

        {/* ── Content ─────────────────────────────────────────────── */}
        <div className="flex flex-col" style={{ padding: "24px 16px 16px", gap: 32 }}>

          {/* ── Title block ─────────────────────────────────────── */}
          <div className="flex flex-col" style={{ gap: 20 }}>
            {/* Track badge + label */}
            <div className="flex items-center" style={{ height: 20, gap: 8 }}>
              <div
                className="flex items-center justify-center"
                style={{ paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 4, backgroundColor: C.badgeBg, border: `1px solid ${C.badgeBorder}` }}
              >
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: C.accentColor }}>
                  {track.name.toUpperCase()}
                </span>
              </div>
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>
                Summer Camp
              </span>
            </div>

            {/* Title + subtitle */}
            <div className="flex flex-col" style={{ gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", lineHeight: "28px" }}>
                {C.title}
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: "20px" }}>
                10 AI projects in 5 days · No coding required
              </span>
            </div>

            {/* Meta row */}
            <div className="flex items-center" style={{ gap: 12, flexWrap: "wrap" }}>
              <div className="flex items-center" style={{ gap: 4 }}>
                <CalendarDays size={16} style={{ color: "var(--gray-500)" }} />
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--gray-500)", whiteSpace: "nowrap" }}>
                  {C.dateRange}
                </span>
              </div>
              <div className="flex items-center" style={{ gap: 4 }}>
                <Clock size={16} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                  {C.totalHours} Hours
                </span>
              </div>
              <div className="flex items-center" style={{ gap: 4 }}>
                <Users size={16} style={{ color: "var(--gray-500)" }} />
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--gray-500)", whiteSpace: "nowrap" }}>
                  {track.grade}
                </span>
              </div>
              <div className="flex items-center" style={{ gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: "var(--success)", flexShrink: 0 }} />
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: "var(--success)", whiteSpace: "nowrap" }}>Live Classes</span>
              </div>
            </div>

            {/* ── What You'll Build ────────────────────────────── */}
            <div className="flex flex-col" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
                What You'll Build
              </span>
              <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
                {track.outputs.map(({ Icon, label }, i) => (
                  <div key={label}>
                    <div className="flex items-center" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, height: 52 }}>
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: C.iconBg }}
                      >
                        <Icon size={16} style={{ color: C.accentColor }} />
                      </div>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)" }}>
                        {label}
                      </span>
                    </div>
                    {i < track.outputs.length - 1 && (
                      <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 52 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="flex flex-col" style={{ gap: 4 }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                  ₹{C.pricing.sale.toLocaleString("en-IN")}
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
                  ₹{C.pricing.original.toLocaleString("en-IN")}
                </span>
              </div>
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: C.seatsAccent }}>
                Only {track.seatsLeft} Seats left!
              </span>
            </div>

            {/* Call our Expert */}
            <div className="flex items-center" style={{
              gap: 12, borderRadius: 12, padding: 16,
              backgroundColor: `${C.accentColor}0A`,
              border: `1px solid ${C.accentColor}30`,
            }}>
              <div className="flex items-center justify-center shrink-0" style={{
                width: 40, height: 40, borderRadius: 9999,
                backgroundColor: `${C.accentColor}16`,
                border: `1px solid ${C.accentColor}30`,
              }}>
                <Phone size={18} style={{ color: C.accentColor }} />
              </div>
              <div className="flex flex-col" style={{ gap: 2, flex: 1 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>Have questions?</span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Talk to a course expert</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center shrink-0"
                style={{
                  height: 36, paddingLeft: 16, paddingRight: 16, borderRadius: 8,
                  border: `1.5px solid ${C.accentColor}50`,
                  backgroundColor: `${C.accentColor}14`,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: C.accentColor, whiteSpace: "nowrap" }}>Call now</span>
              </motion.button>
            </div>

            {/* Divider */}
            <div style={{ height: 0.5, backgroundColor: "var(--border)" }} />

            {/* ── Interested row ─────────────────────────────────── */}
            <div className="flex items-center" style={{ gap: 12 }}>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={toggleInterested}
                  aria-label={isInterested ? "Remove interest" : "Mark as interested"}
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: isInterested ? `${HEART_COLOR}14` : `${HEART_COLOR}0d`,
                    border: `1.5px solid ${isInterested ? `${HEART_COLOR}50` : `${HEART_COLOR}30`}`,
                    cursor: "pointer",
                  }}
                >
                  <motion.div
                    key={String(isInterested)}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  >
                    <Heart
                      size={20}
                      style={{
                        color: HEART_COLOR,
                        fill: isInterested ? HEART_COLOR : "none",
                        opacity: isInterested ? 1 : 0.5,
                      }}
                    />
                  </motion.div>
                </motion.button>
                <div className="flex flex-col" style={{ gap: 2 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                    {interestedCount} students interested
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                    {isInterested ? "You're following this camp" : "Tap to follow this camp"}
                  </span>
                </div>
              </div>
          </div>

          {/* ── Tools You'll Use ─────────────────────────────────── */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              Tools You'll Use
            </span>
            <div
              className="flex"
              style={{
                gap: 10,
                marginLeft: -16,
                marginRight: -16,
                paddingLeft: 16,
                paddingRight: 16,
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              {DUMMY_TOOLS.map(({ domain, accent, name }) => (
                <div
                  key={name}
                  className="flex flex-col items-center shrink-0"
                  style={{
                    width: 88,
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingLeft: 8,
                    paddingRight: 8,
                    borderRadius: 12,
                    backgroundColor: "var(--card-bg-secondary)",
                    gap: 6,
                  }}
                >
                  <ToolLogo domain={domain} accent={accent} name={name} />
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--gray-500)", textAlign: "center", lineHeight: "16px", whiteSpace: "nowrap", maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Description (5-day schedule) ─────────────────────── */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              Description
            </span>
            <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", padding: 16 }}>
              <div className="flex flex-col">
                {DUMMY_CAMP_SCHEDULE.map((day, i) => (
                  <div key={day.day} className="flex" style={{ gap: 12 }}>
                    {/* Left column: circle + dotted connector */}
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: C.badgeBg, border: `1px solid ${C.badgeBorder}` }}
                      >
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: C.accentColor }}>
                          D{day.day}
                        </span>
                      </div>
                      {i < DUMMY_CAMP_SCHEDULE.length - 1 && (
                        <div style={{ flex: 1, width: 0, borderLeft: `1.5px dashed ${C.badgeBorder}`, minHeight: 16, marginTop: 4 }} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex flex-col" style={{ gap: 4, paddingTop: 8, paddingBottom: i < DUMMY_CAMP_SCHEDULE.length - 1 ? 16 : 0 }}>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-700)" }}>
                        {day.date}
                      </span>
                      {day.topics.map((topic) => (
                        <span key={topic} style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: "20px" }}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── What You Take Home ────────────────────────────────── */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              What You Take Home
            </span>
            <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", padding: 16 }}>
              <div className="flex flex-col" style={{ gap: 16 }}>
                {track.takeHome.map((item) => (
                  <div key={item} className="flex items-center" style={{ gap: 12 }}>
                    <CheckCircle2 size={20} style={{ color: C.accentColor, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: "20px" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── What You Need (requirements) ──────────────────────── */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              What You Need
            </span>
            <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
              {([
                { Icon: Laptop, label: "Laptop or tablet — any OS" },
                { Icon: Wifi, label: "Stable internet connection" },
                { Icon: CheckCircle2, label: "No coding experience required" },
              ] as { Icon: LucideIcon; label: string }[]).map(({ Icon, label }, i) => (
                <div key={label}>
                  <div className="flex items-center" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, height: 52 }}>
                    <Icon size={20} style={{ color: "var(--foreground)", flexShrink: 0 }} />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)" }}>
                      {label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 52 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom padding for sticky bar */}
        <div style={{ height: 80 }} />
      </div>

      {/* ── Sticky bottom bar ──────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 16,
          paddingBottom: "calc(16px + env(safe-area-inset-bottom))" as unknown as number,
          gap: 12,
          borderTop: "0.5px solid var(--border)",
          backgroundColor: "var(--card)",
          borderRadius: "12px 12px 0 0",
        }}
      >
        {/* Price block */}
        <div className="flex flex-col" style={{ gap: 2 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
              ₹{C.pricing.sale.toLocaleString("en-IN")}
            </span>
            <div
              className="flex items-center justify-center"
              style={{ paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 4, backgroundColor: C.seatsBg, border: `1px solid ${C.seatsBorder}` }}
            >
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: C.seatsAccent }}>
                {C.pricing.discount}
              </span>
            </div>
          </div>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
            ₹{C.pricing.original.toLocaleString("en-IN")}
          </span>
        </div>

        {/* CTAs */}
        <div className="flex items-center" style={{ gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center"
            style={{
              flex: 1, height: 44, borderRadius: 8, cursor: "pointer", border: "none",
              backgroundColor: `${C.accentColor}20`,
              outline: `1.5px solid ${C.accentColor}60`,
              color: C.accentColor,
              fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)",
              gap: 8,
            }}
          >
            <Phone size={16} aria-hidden={true} style={{ color: C.accentColor }} />
            Call our Expert
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/summer-camp-purchased?track=${activeTrack}`)}
            className="flex items-center justify-center"
            style={{
              flex: 1, height: 44, borderRadius: 8, border: "none",
              backgroundColor: "var(--primary)",
              color: "var(--white)",
              fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)",
              cursor: "pointer",
            }}
          >
            {C.pricing.ctaLabel}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
