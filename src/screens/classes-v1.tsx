import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Plus, ChevronRight, BookOpen, Clock, Radio, User, SlidersHorizontal, CalendarDays, Users, Bell, X, RefreshCw, Check, Video, CheckCircle2, ExternalLink, Brain, Flame, Gamepad2, ArrowRight, ArrowUp, Sparkles, Mountain, Puzzle, Swords, FlaskConical, Trophy } from "lucide-react";
import {
  DUMMY_OTHER_COURSES,
  DUMMY_CRASH_COURSE_INFO,
  DUMMY_CRASH_COURSES_1112,
  getVocabFastPack,
  VOCABFAST_BRAND,
  AI_TUTOR_SKUS,
  type OtherCourse,
} from "../shared/classroom-catalog";
import { OtherCourseCard } from "../shared/classroom-cards";
import { ArenaHubCard } from "./classes";
import {
  DUMMY_MY_TEST_SERIES,
  packStats,
  type MyTestSeriesPack,
} from "../shared/test-series-progress";
import {
  DeviceSwitchConfirmDialog,
  SessionEndedDialog,
} from "../shared/device-switch-dialogs";
import { useVocabFastPurchases } from "../shared/feedback-storage";
// v1 additions — Games rail in Classes (A/B variant: all 9 games shown FREE here)
import { DUMMY_GAMES, type Game } from "./marketplace-v1";
import { useGamesPass } from "../shared/games-pass-state";

// Daily Drill streak — mirrors CURRENT_STREAK in game-daily-sprint.tsx.
// TODO: lift to shared module when persistence lands.
const CURRENT_DRILL_STREAK = 4;

// The 6 games featured in the Classes Games rail. Picked for engagement-test
// fit: Daily Drill (daily anchor) + Word Wizard (free K-1-4) + Math Mountain
// (broad math) + Memory Match (cognitive) + Pattern Puzzles (olympiad prep)
// + Brain Battle (social MCQ). Dropped: Reading Race (slower mechanic),
// Science Lab (heavier session), Sunday Showdown (lobby-only, not playable yet).
const CLASSES_FEATURED_GAME_IDS = [
  "daily-sprint",
  "word-wars",
  "brain-sprint",
  "memory-match",
  "pattern-puzzles",
  "quiz-duel",
];

// TODO(api): GET /api/user/profile
const DUMMY_USER = {
  name: "Praveen",
  notificationsCount: 1,
};

// Time-of-day greeting — derived per render so it reflects when the user
// actually opens the screen, not a fixed "afternoon".
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12)  return "Good morning";
  if (hour < 17)  return "Good afternoon";
  return "Good evening";
}

// TODO(api): GET /api/live-classes/today — test prep purchased classes going live
const DUMMY_PREP_LIVE = [
  {
    id: "p1",
    topic: "Newton's Second Law",
    subject: "Physics",
    course: "JEE Main 2025",
    exam: "JEE MAIN",
    isLive: true,
    scheduledTime: new Date(),
    durationMinutes: 60,
  },
  {
    id: "p2",
    topic: "Limits & Continuity",
    subject: "Mathematics",
    course: "JEE Main 2025",
    exam: "JEE MAIN",
    isLive: false,
    scheduledTime: new Date(Date.now() + 20 * 60 * 1000),
    durationMinutes: 90,
  },
];

// TODO(api): GET /api/schedule/today — school teacher classes
const DUMMY_SCHEDULE = [
  {
    id: "1",
    subject: "English Literature",
    class: "Class XI",
    time: "5:30 PM",
    isLive: true,
  },
  {
    id: "2",
    subject: "Mathematics",
    class: "Class XI",
    time: "7:00 PM",
    isLive: false,
  },
];

// TODO(api): GET /api/prep-classrooms — purchased test prep course classrooms
const DUMMY_PREP_CLASSROOMS = [
  {
    id: "pc1",
    subject: "Quantitative Aptitude",
    course: "CAT 2025",
    days: ["Mo", "We", "Fr"],
    lessons: 45,
    subjectId: "quant",
    examId: "cat",
  },
  {
    id: "pc2",
    subject: "Verbal Ability & RC",
    course: "CAT 2025",
    days: ["Tu", "Th", "Sa"],
    lessons: 38,
    subjectId: "verbal",
    examId: "cat",
  },
  {
    id: "pc3",
    subject: "Data Interpretation & LR",
    course: "CAT 2025",
    days: ["Mo", "We", "Sa"],
    lessons: 32,
    subjectId: "dilr",
    examId: "cat",
  },
];

// TODO(api): GET /api/classrooms
const DUMMY_CLASSROOMS = [
  {
    id: "1",
    name: "English Literature",
    class: "Class XI - A",
    days: ["Mo", "Tu", "We"],
    students: 50,
    subjects: ["English Literature"],
  },
  {
    id: "2",
    name: "English Literature, Mathematics",
    class: "Class XI - B",
    days: ["Mo", "Tu", "Th"],
    students: 45,
    extra: "+2",
  },
];

// TODO(api): GET /api/courses/other — curated other courses list for classes page
const CAT_GROUP = DUMMY_OTHER_COURSES.find((g) => g.examKey === "cat")!;
const DUMMY_OTHER_COURSES_LIST: OtherCourse[] = [
  {
    id: "cat-3m",
    title: CAT_GROUP.courses[0].title,
    subtitle: `${CAT_GROUP.subjects.length} subjects · ${CAT_GROUP.courses[0].topics} topics`,
    thumbBg: `linear-gradient(135deg, color-mix(in srgb, ${CAT_GROUP.examAccent} 22%, var(--card)) 0%, color-mix(in srgb, ${CAT_GROUP.examAccent} 32%, var(--card)) 100%)`,
    thumbLabel: CAT_GROUP.shortLabel,
    thumbAccent: CAT_GROUP.examAccent,
    thumbMeta: CAT_GROUP.courses[0].plan,
    rating: 4.6,
    reviewCount: 234,
    price: CAT_GROUP.courses[0].price,
    originalPrice: CAT_GROUP.courses[0].originalPrice,
  },
  {
    id: "cat-6m",
    title: CAT_GROUP.courses[1].title,
    subtitle: `${CAT_GROUP.subjects.length} subjects · ${CAT_GROUP.courses[1].topics} topics`,
    thumbBg: `linear-gradient(135deg, color-mix(in srgb, ${CAT_GROUP.examAccent} 22%, var(--card)) 0%, color-mix(in srgb, ${CAT_GROUP.examAccent} 32%, var(--card)) 100%)`,
    thumbLabel: CAT_GROUP.shortLabel,
    thumbAccent: CAT_GROUP.examAccent,
    thumbMeta: CAT_GROUP.courses[1].plan,
    rating: 4.7,
    reviewCount: 412,
    price: CAT_GROUP.courses[1].price,
    originalPrice: CAT_GROUP.courses[1].originalPrice,
  },
  {
    id: "crash-courses",
    title: "Maths & Science Crash Course",
    subtitle: "Class 6–10 · 22 chapters",
    thumbBg: `linear-gradient(135deg, color-mix(in srgb, ${DUMMY_CRASH_COURSE_INFO.accentColor} 22%, var(--card)) 0%, color-mix(in srgb, ${DUMMY_CRASH_COURSE_INFO.accentColor} 32%, var(--card)) 100%)`,
    thumbLabel: "CC",
    thumbTag: "CRASH",
    thumbAccent: DUMMY_CRASH_COURSE_INFO.accentColor,
    thumbMeta: "15 Days",
    rating: 0,
    reviewCount: 0,
    price: 0,
    originalPrice: 0,
  },
];

// TODO(api): GET /api/user/purchased-content
const DUMMY_PURCHASED_CONTENT: Array<{
  id: string;
  type: "music" | "app";
  title: string;
  subtitle: string;
  thumbImage?: string;
  accentColor: string;
  logoLetter?: string;
  openPath: string;
}> = [
  {
    id: "piano-beginner-solo",
    type: "music",
    title: "Piano Beginner Solo",
    subtitle: "Furtados School of Music",
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg",
    accentColor: "#a78bfa",
    openPath: "/marketplace/webview/furtados",
  },
  {
    id: "express-app",
    type: "app",
    title: "Express",
    subtitle: "English Speaking · AI Coach",
    accentColor: "#29d6d6",
    logoLetter: "E",
    openPath: "/marketplace/webview/express",
  },
];

// ─── PurchasedContentCard ────────────────────────────────────────────────────

function PurchasedContentCard({ item, onClick }: { item: typeof DUMMY_PURCHASED_CONTENT[number]; onClick: () => void }) {
  const [imgFailed, setImgFailed] = useState(!item.thumbImage);
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center shrink-0"
      style={{
        width: 288, height: 80, borderRadius: 12, cursor: "pointer", overflow: "hidden",
        backgroundColor: "var(--card-bg-secondary)",
        border: `1px solid ${item.accentColor}22`,
      }}
    >
      {/* Flush-left thumbnail */}
      <div style={{
        width: 80, height: "100%", flexShrink: 0, overflow: "hidden",
        backgroundColor: item.type === "app" ? "var(--card-bg-secondary)" : "var(--card)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {item.type === "app" && (
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(circle at 30% 30%, ${item.accentColor}22 0%, transparent 70%)`,
          }} />
        )}
        {item.type === "music" && !imgFailed ? (
          <img src={item.thumbImage} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgFailed(true)} />
        ) : item.type === "app" && item.logoLetter ? (
          <span style={{ fontSize: 28, fontWeight: 900, color: item.accentColor, lineHeight: 1, letterSpacing: 0, position: "relative" }}>{item.logoLetter}</span>
        ) : (
          <ExternalLink size={20} style={{ color: item.accentColor, opacity: 0.7 }} />
        )}
      </div>

      {/* Info */}
      <div className="flex items-center" style={{ flex: 1, minWidth: 0, paddingLeft: 12, paddingRight: 8, gap: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", display: "block", marginBottom: 2 }}>
            {item.title}
          </span>
          <span className="truncate" style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", display: "block" }}>
            {item.subtitle}
          </span>
        </div>
        <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
      </div>
    </motion.div>
  );
}

// Sheet helpers
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break;
      const hour12 = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      slots.push(`${hour12}:${m === 0 ? '00' : '30'} ${ampm}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

// TODO(api): GET /api/classes/schedule/booked-slots?date=:date
const DUMMY_BOOKED_SLOTS: Record<number, { time: string; label: string }[]> = {
  0: [{ time: '9:00 AM', label: 'Physics' }, { time: '11:00 AM', label: 'Chemistry' }, { time: '3:30 PM', label: 'Biology' }, { time: '6:00 PM', label: 'English' }],
  1: [{ time: '8:30 AM', label: 'Chemistry' }, { time: '2:00 PM', label: 'Physics' }, { time: '7:00 PM', label: 'Biology' }],
  2: [{ time: '10:00 AM', label: 'English' }, { time: '1:00 PM', label: 'Physics' }, { time: '4:30 PM', label: 'Chemistry' }],
  3: [{ time: '9:30 AM', label: 'Biology' }, { time: '3:00 PM', label: 'Maths' }, { time: '5:30 PM', label: 'Physics' }],
  4: [{ time: '8:00 AM', label: 'Chemistry' }, { time: '11:30 AM', label: 'English' }, { time: '2:30 PM', label: 'Biology' }, { time: '6:30 PM', label: 'Physics' }],
  5: [{ time: '10:30 AM', label: 'Maths' }, { time: '1:30 PM', label: 'Chemistry' }],
  6: [{ time: '9:00 AM', label: 'Physics' }, { time: '4:00 PM', label: 'Biology' }, { time: '7:30 PM', label: 'English' }],
};

function generateRescheduleSlots() {
  const days = [];
  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      dayLabel: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateLabel: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    });
  }
  return days;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
}

function badgeCountdown(scheduledTime: Date): string {
  const diff = scheduledTime.getTime() - Date.now();
  if (diff <= 0) return 'Live';
  const totalSecs = Math.floor(diff / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${mm}:${ss}`;
}

// Green palette — live exam class cards
const GREEN = {
  cardBg: "var(--card-live-bg)",
  stripBg: "var(--card-live-strip)",
  title: "var(--card-live-title)",
  secondary: "var(--card-live-secondary)",
  accent: "var(--card-live-accent)",
  joinBg: "var(--card-live-join-bg)",
  liveBadgeBg: "var(--card-live-badge-bg)",
  liveBadgeBorder: "var(--card-live-badge-border)",
  daysText: "var(--card-live-accent)",
};

// Orange palette — upcoming/school class cards
const ORANGE = {
  cardBg: "var(--card-upcoming-bg)",
  stripBg: "var(--card-upcoming-strip)",
  title: "var(--card-upcoming-title)",
  secondary: "var(--card-upcoming-secondary)",
  accent: "var(--card-upcoming-accent)",
};

// Exam strip colors — thin left banner on prep classroom cards
const EXAM_STRIP: Record<string, { bg: string; label: string }> = {
  cat:              { bg: "var(--strip-cat)", label: "CAT" },
  "jee-mains":      { bg: "var(--strip-jee)", label: "JEE M" },
  "jee-advanced":   { bg: "var(--strip-jee-adv)", label: "JEE Adv" },
  neet:             { bg: "var(--strip-neet)", label: "NEET" },
  upsc:             { bg: "var(--strip-upsc)", label: "UPSC" },
  "crash-courses":  { bg: `color-mix(in srgb, ${DUMMY_CRASH_COURSE_INFO.accentColor} 22%, var(--card))`, label: "CRASH" },
};

interface ScheduleCardProps {
  item: typeof DUMMY_SCHEDULE[number];
}

/* School teacher class card — always orange gradient, no left strip */
function ScheduleCard({ item }: ScheduleCardProps) {
  return (
    <div
      className="flex items-stretch shrink-0 overflow-hidden"
      style={{ width: 288, borderRadius: 12, background: ORANGE.cardBg }}
    >
      <div className="flex flex-col flex-1" style={{ padding: 16, gap: 12 }}>
        <div className="flex flex-col" style={{ gap: 2 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
            {item.subject}
          </span>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>{item.class}</span>
            <div style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: "var(--border)", flexShrink: 0 }} />
            <div className="flex items-center" style={{ gap: 4 }}>
              <Clock size={12} style={{ color: ORANGE.accent, flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: ORANGE.accent }}>{item.time}</span>
            </div>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          style={{
            height: 32, width: "100%", borderRadius: 8,
            backgroundColor: "transparent",
            border: `1px solid ${ORANGE.accent}`,
            color: ORANGE.accent,
            fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)",
            cursor: "pointer",
          }}
        >
          View Details
        </motion.button>
      </div>
    </div>
  );
}

interface PrepLiveCardProps {
  item: typeof DUMMY_PREP_LIVE[number];
}

function useCountdown(target: Date) {
  const [secsLeft, setSecsLeft] = useState(() => Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000)));
  useEffect(() => {
    const id = setInterval(() => {
      setSecsLeft(Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);
  return secsLeft;
}

function formatCountdown(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* Test prep exam class card — left strip sidebar, green when live, orange when upcoming */
function PrepLiveCard({ item }: PrepLiveCardProps) {
  const navigate = useNavigate();
  const isLive = item.isLive;
  const secsLeft = useCountdown(item.scheduledTime);
  const isStartingSoon = !isLive && secsLeft <= 30 * 60;

  const [showSheet, setShowSheet] = useState(false);
  const [sheetView, setSheetView] = useState<'detail' | 'reschedule' | 'confirmed'>('detail');
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const closeSheet = () => {
    setShowSheet(false);
    setTimeout(() => { setSheetView('detail'); setSelectedDay(0); setSelectedSlot(null); }, 350);
  };

  const rescheduleDays = generateRescheduleSlots();
  const stateLabel = isLive ? 'Live' : badgeCountdown(item.scheduledTime);
  const stateColor = isLive ? GREEN.accent : isStartingSoon ? ORANGE.accent : 'var(--muted-foreground)';

  return (
    <>
      <div
        className="flex items-stretch shrink-0 overflow-hidden"
        style={{ width: 288, borderRadius: 12, background: isLive ? GREEN.cardBg : ORANGE.cardBg }}
      >
        {/* Left strip with vertical exam label */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 20, backgroundColor: isLive ? GREEN.stripBg : ORANGE.stripBg }}
        >
          <span
            style={{
              fontSize: 8,
              fontWeight: "var(--font-weight-semibold)",
              color: isLive ? GREEN.accent : ORANGE.accent,
              transform: "rotate(-90deg)",
              whiteSpace: "nowrap",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {item.exam}
          </span>
        </div>
        {/* Content */}
        <div className="flex flex-col flex-1" style={{ padding: 16, gap: 12 }}>
          <div className="flex flex-col" style={{ gap: 4 }}>
            {/* Title + badge */}
            <div className="flex items-center" style={{ gap: 8 }}>
              <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: isLive ? GREEN.title : ORANGE.title, flex: 1, minWidth: 0 }}>
                {item.topic}
              </span>
              {isLive ? (
                <div
                  className="flex items-center shrink-0"
                  style={{ paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 9999, backgroundColor: GREEN.liveBadgeBg, border: `1px solid ${GREEN.liveBadgeBorder}`, gap: 4 }}
                >
                  <div style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: "var(--success-400)", flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: GREEN.accent, letterSpacing: 0.5 }}>LIVE</span>
                </div>
              ) : (
                <div
                  className="flex items-center shrink-0"
                  style={{ paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 9999, backgroundColor: "var(--card-upcoming-badge-bg)", border: `1px solid var(--card-upcoming-badge-border)`, gap: 4 }}
                >
                  <div style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: "var(--orange-300)", flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: ORANGE.accent, fontVariantNumeric: "tabular-nums", letterSpacing: 0.3 }}>
                    {formatCountdown(secsLeft)}
                  </span>
                </div>
              )}
            </div>
            {/* Subject · time */}
            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: isLive ? GREEN.secondary : ORANGE.secondary }}>{item.subject}</span>
              <div style={{ width: 3, height: 3, borderRadius: 9999, backgroundColor: isLive ? GREEN.secondary : ORANGE.secondary, flexShrink: 0 }} />
              {isLive ? (
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: GREEN.secondary }}>Just started</span>
              ) : (
                <div className="flex items-center" style={{ gap: 4 }}>
                  <Clock size={12} style={{ color: ORANGE.accent, flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: ORANGE.accent }}>{formatTime(item.scheduledTime)}</span>
                </div>
              )}
            </div>
          </div>
          {isLive ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/live-class?join=live')}
              className="flex items-center justify-center"
              style={{
                height: 32, width: "100%", borderRadius: 8, border: "none",
                backgroundColor: GREEN.joinBg, color: "var(--white)",
                fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)",
                cursor: "pointer", gap: 8,
              }}
            >
              <Radio size={14} style={{ color: "var(--white)" }} />
              Join Live
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowSheet(true)}
              style={{
                height: 32, width: "100%", borderRadius: 8,
                backgroundColor: "transparent",
                border: `1px solid ${ORANGE.accent}`,
                color: ORANGE.accent,
                fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)",
                cursor: "pointer",
              }}
            >
              View Details
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="fixed inset-0"
              style={{ backgroundColor: 'var(--overlay-heavy)', zIndex: 200 }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed bottom-0 left-0 right-0 overflow-hidden"
              style={{ backgroundColor: 'var(--card)', borderRadius: '20px 20px 0 0', zIndex: 201, boxShadow: '0 -8px 40px var(--shadow-overlay)' }}
            >
              <AnimatePresence mode="wait">
                {sheetView === 'detail' && (
                  <motion.div
                    key="detail"
                    initial={{ x: 0 }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                    style={{ padding: '20px 20px 36px' }}
                  >
                    <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--border)', margin: '0 auto 20px' }} />

                    <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-1" style={{
                          backgroundColor: isLive ? GREEN.liveBadgeBg : isStartingSoon ? 'var(--warning-alpha-15)' : 'var(--muted)',
                          border: `1px solid ${isLive ? GREEN.liveBadgeBorder : isStartingSoon ? 'var(--warning-alpha-30)' : 'var(--border)'}`,
                          borderRadius: 999, padding: '4px 8px', marginBottom: 8,
                        }}>
                          {(isLive || isStartingSoon) ? (
                            <motion.div
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: isLive ? 1.4 : 1.0, repeat: Infinity, ease: 'easeInOut' }}
                              style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: stateColor }}
                            />
                          ) : (
                            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: stateColor }} />
                          )}
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', color: stateColor, textTransform: isLive ? 'uppercase' : 'none', letterSpacing: '0.4px', fontVariantNumeric: 'tabular-nums' }}>
                            {isStartingSoon ? `Starts in ${stateLabel}` : stateLabel}
                          </span>
                        </div>
                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: 0 }}>
                          {item.topic}
                        </h2>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={closeSheet}
                        className="flex items-center justify-center cursor-pointer shrink-0"
                        style={{ background: 'var(--secondary)', border: 'none', borderRadius: 999, width: 32, height: 32, marginLeft: 12 }}
                      >
                        <X style={{ width: 16, height: 16, color: 'var(--muted-foreground)', strokeWidth: 2.5 }} />
                      </motion.button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div style={{ padding: 12, backgroundColor: 'var(--secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', marginBottom: 4 }}>DATE</div>
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>{fmtDate(item.scheduledTime)}</div>
                      </div>
                      <div style={{ padding: 12, backgroundColor: 'var(--secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', marginBottom: 4 }}>TIME</div>
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>{fmtTime(item.scheduledTime)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3" style={{ padding: 12, backgroundColor: 'var(--secondary)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
                      <Clock style={{ width: 16, height: 16, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', marginBottom: 2 }}>DURATION</div>
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>{item.durationMinutes ?? 60} minutes</div>
                      </div>
                    </div>

                    {(isLive || isStartingSoon) && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { closeSheet(); navigate(`/live-class?join=${isLive ? 'live' : 'early'}`); }}
                        className="w-full flex items-center justify-center gap-2 cursor-pointer"
                        style={{
                          padding: '14px 16px', backgroundColor: isLive ? GREEN.joinBg : ORANGE.accent,
                          color: 'var(--white)', border: 'none', borderRadius: 12,
                          fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)',
                          marginBottom: 10,
                        }}
                      >
                        <Video style={{ width: 20, height: 20, strokeWidth: 2 }} />
                        {isLive ? 'Join Live Class' : 'Join Early'}
                        {isStartingSoon && (
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>
                            · {stateLabel}
                          </span>
                        )}
                      </motion.button>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSheetView('reschedule')}
                      className="w-full flex items-center justify-center gap-2 cursor-pointer"
                      style={{
                        padding: '12px 16px', backgroundColor: 'transparent',
                        color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 12,
                        fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)',
                      }}
                    >
                      <RefreshCw style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                      Reschedule Class
                    </motion.button>
                  </motion.div>
                )}

                {sheetView === 'reschedule' && (
                  <motion.div
                    key="reschedule"
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                    style={{ padding: '20px 20px 36px' }}
                  >
                    <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--border)', margin: '0 auto 20px' }} />
                    <div className="flex items-center" style={{ marginBottom: 20 }}>
                      <div className="flex-1">
                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: 0 }}>Reschedule Class</h2>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', margin: 0 }}>{item.topic}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={closeSheet}
                        className="flex items-center justify-center cursor-pointer"
                        style={{ background: 'none', border: 'none', padding: 4, marginRight: -4 }}
                      >
                        <X style={{ width: 20, height: 20, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
                      </motion.button>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Select Day</p>
                      <div className="flex gap-2 overflow-x-auto" style={{ paddingBottom: 4, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
                        {rescheduleDays.map((day, idx) => {
                          const isSel = selectedDay === idx;
                          return (
                            <motion.button
                              key={idx}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => { setSelectedDay(idx); setSelectedSlot(null); }}
                              className="shrink-0 cursor-pointer"
                              style={{ padding: '8px 12px', borderRadius: 8, background: isSel ? 'var(--primary)' : 'var(--secondary)', border: isSel ? 'none' : '1px solid var(--border)', textAlign: 'center', minWidth: 56 }}
                            >
                              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: isSel ? 'var(--primary-foreground)' : 'var(--muted-foreground)', marginBottom: 2, textTransform: 'uppercase' }}>{day.dayLabel}</div>
                              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: isSel ? 'var(--primary-foreground)' : 'var(--foreground)' }}>{day.dateLabel}</div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Select Time</p>
                      <div style={{ position: 'relative' }}>
                        <div className="slot-scroll" style={{ maxHeight: 196, borderRadius: 12, border: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
                          {TIME_SLOTS.map((slot, i) => {
                            const bookedEntry = (DUMMY_BOOKED_SLOTS[selectedDay] ?? []).find(b => b.time === slot);
                            const isBooked = !!bookedEntry;
                            const isSel = selectedSlot === slot;
                            const isLast = i === TIME_SLOTS.length - 1;
                            return (
                              <motion.button
                                key={slot}
                                whileTap={!isBooked ? { scale: 0.98 } : {}}
                                onClick={() => { if (!isBooked) setSelectedSlot(slot); }}
                                disabled={isBooked}
                                className="w-full flex items-center justify-between"
                                style={{
                                  padding: '0 16px', height: 44,
                                  cursor: isBooked ? 'not-allowed' : 'pointer',
                                  background: isSel ? 'var(--primary-alpha-15)' : 'transparent',
                                  border: 'none',
                                  borderBottom: isLast ? 'none' : '1px solid color-mix(in srgb, var(--border) 40%, transparent)',
                                  opacity: isBooked ? 0.45 : 1,
                                }}
                              >
                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: isSel ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)', color: isSel ? 'var(--primary)' : 'var(--foreground)' }}>
                                  {slot}
                                </span>
                                {isBooked && (
                                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
                                    Scheduled
                                  </span>
                                )}
                                {isSel && (
                                  <Check size={14} style={{ color: 'var(--primary)', strokeWidth: 2.5, flexShrink: 0 }} />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                        <div style={{ position: 'absolute', bottom: 1, left: 1, right: 1, height: 48, borderRadius: '0 0 12px 12px', background: 'linear-gradient(to bottom, transparent, var(--secondary))', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { if (selectedSlot) setSheetView('confirmed'); }}
                      className="w-full flex items-center justify-center gap-2"
                      style={{ padding: '14px 16px', backgroundColor: selectedSlot ? 'var(--primary)' : 'var(--secondary)', color: selectedSlot ? 'var(--primary-foreground)' : 'var(--muted-foreground)', border: 'none', borderRadius: 12, cursor: selectedSlot ? 'pointer' : 'default', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)', opacity: selectedSlot ? 1 : 0.6, transition: 'all 0.2s ease' }}
                    >
                      <CalendarDays style={{ width: 16, height: 16, strokeWidth: 2 }} />
                      Confirm Reschedule
                    </motion.button>
                  </motion.div>
                )}

                {sheetView === 'confirmed' && (
                  <motion.div
                    key="confirmed"
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="flex flex-col items-center"
                    style={{ padding: '40px 20px 48px', textAlign: 'center' }}
                  >
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                      className="flex items-center justify-center"
                      style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success)', marginBottom: 16, boxShadow: '0 0 24px color-mix(in srgb, var(--success) 35%, transparent)' }}
                    >
                      <Check style={{ width: 32, height: 32, color: 'var(--success-foreground)', strokeWidth: 3 }} />
                    </motion.div>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: '0 0 8px' }}>Class Rescheduled!</h2>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: '0 0 6px' }}>{item.topic}</p>
                    <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: '0 0 32px' }}>
                      {rescheduleDays[selectedDay]?.dateLabel} · {selectedSlot}
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={closeSheet}
                      style={{ padding: '13px 40px', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)' }}
                    >
                      Done
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

interface SummerCampClassroomCardProps {
  track: "explorer" | "creator";
}

function SummerCampClassroomCard({ track }: SummerCampClassroomCardProps) {
  const navigate = useNavigate();
  const [showSheet, setShowSheet] = useState(false);
  const hasStarted = new Date() >= CAMP_START_DATE;
  const { stripBg, accentColor, trackLabel, grade } = CAMP_STRIP[track];
  const daysLeft = Math.max(0, Math.ceil((CAMP_START_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleTap = () => {
    if (hasStarted) {
      navigate("/live-class");
    } else {
      setShowSheet(true);
    }
  };

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleTap}
        className="flex items-stretch shrink-0 overflow-hidden"
        style={{ width: 288, borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", cursor: "pointer" }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 20, backgroundColor: stripBg }}
        >
          <span
            style={{
              fontSize: "var(--text-2xs)",
              fontWeight: "var(--font-weight-semibold)",
              color: accentColor,
              writingMode: "vertical-rl",
              letterSpacing: 1,
            }}
          >
            AI CAMP
          </span>
        </div>
        <div className="flex flex-col" style={{ flex: 1, padding: "16px 12px 12px", gap: 8, minWidth: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col" style={{ gap: 4, flex: 1, minWidth: 0 }}>
              <span
                className="truncate"
                style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}
              >
                AI Foundations Summer Camp
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)" }}>
                {trackLabel} · {grade}
              </span>
            </div>
            <ChevronRight size={16} style={{ color: "var(--gray-500)", flexShrink: 0 }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: 4 }}>
              <CalendarDays size={12} style={{ color: accentColor, flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: accentColor }}>
                19 – 25 May
              </span>
            </div>
            <div
              className="flex items-center"
              style={{ gap: 4, paddingLeft: 8, paddingRight: 8, height: 24, borderRadius: 8, backgroundColor: "var(--secondary)" }}
            >
              <Clock size={12} style={{ color: "var(--secondary-foreground)" }} />
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--secondary-foreground)" }}>10 hrs</span>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSheet(false)}
              className="fixed inset-0"
              style={{ backgroundColor: "var(--overlay-heavy)", zIndex: 200 }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed bottom-0 left-0 right-0 overflow-hidden"
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "20px 20px 0 0",
                zIndex: 201,
                boxShadow: "0 -8px 40px var(--shadow-overlay)",
              }}
            >
              <div style={{ padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Drag handle */}
                <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "var(--border)", margin: "0 auto" }} />

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col" style={{ gap: 8 }}>
                    <div
                      className="flex items-center justify-center"
                      style={{
                        alignSelf: "flex-start",
                        paddingLeft: 10,
                        paddingRight: 10,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: stripBg,
                        border: `1.5px solid ${accentColor}50`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "var(--text-2xs)",
                          fontWeight: "var(--font-weight-semibold)",
                          color: accentColor,
                          letterSpacing: 1,
                        }}
                      >
                        {trackLabel.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                      AI Foundations Summer Camp
                    </span>
                  </div>
                  <button
                    onClick={() => setShowSheet(false)}
                    aria-label="Close sheet"
                    style={{
                      width: 32,
                      height: 32,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <X size={18} style={{ color: "var(--muted-foreground)" }} />
                  </button>
                </div>

                {/* Countdown highlight card */}
                <div
                  className="flex flex-col items-center"
                  style={{
                    borderRadius: 12,
                    backgroundColor: `${accentColor}12`,
                    border: `1.5px solid ${accentColor}40`,
                    padding: "20px 16px",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-2xs)",
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--muted-foreground)",
                      letterSpacing: 2,
                    }}
                  >
                    CLASS STARTS IN
                  </span>
                  <div className="flex items-baseline" style={{ gap: 8 }}>
                    <span
                      style={{
                        fontSize: 48,
                        fontWeight: "var(--font-weight-bold)",
                        color: accentColor,
                        lineHeight: 1,
                      }}
                    >
                      {daysLeft}
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
                      {daysLeft === 1 ? "day" : "days"}
                    </span>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                    19 May – 25 May 2026
                  </span>
                </div>

                {/* 2-col info grid */}
                <div className="flex" style={{ gap: 12 }}>
                  <div
                    className="flex flex-col flex-1"
                    style={{ padding: "12px 16px", borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", gap: 4 }}
                  >
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", letterSpacing: 1 }}>DURATION</span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                      5 Days
                    </span>
                  </div>
                  <div
                    className="flex flex-col flex-1"
                    style={{ padding: "12px 16px", borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", gap: 4 }}
                  >
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", letterSpacing: 1 }}>GRADE</span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                      {grade}
                    </span>
                  </div>
                </div>

                {/* View More Details */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowSheet(false);
                    navigate(`/ai-summer-camp?track=${track}`);
                  }}
                  className="flex items-center justify-center w-full"
                  style={{
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "transparent",
                    border: "1.5px solid var(--primary-600)",
                    color: "var(--primary-600)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-semibold)",
                    cursor: "pointer",
                  }}
                >
                  View More Details
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

interface PrepClassroomCardProps {
  item: typeof DUMMY_PREP_CLASSROOMS[number];
  onClick?: () => void;
}

/* Test prep course classroom card */
function PrepClassroomCard({ item, onClick }: PrepClassroomCardProps) {
  const strip = EXAM_STRIP[item.examId] ?? { bg: "var(--muted)", label: item.examId.toUpperCase() };
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-stretch shrink-0 overflow-hidden"
      style={{
        width: 288,
        borderRadius: 12,
        backgroundColor: "var(--card-bg-secondary)",
        cursor: "pointer",
      }}
    >
      {/* Thin exam identity strip */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 20, backgroundColor: strip.bg }}
      >
        <span
          style={{
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
            writingMode: "vertical-rl",
            letterSpacing: 1,
          }}
        >
          {strip.label}
        </span>
      </div>

      {/* Card content — unchanged */}
      <div className="flex flex-col" style={{ flex: 1, padding: "16px 12px 12px", gap: 8, minWidth: 0 }}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col" style={{ gap: 4, flex: 1, minWidth: 0 }}>
            <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
              {item.subject}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)" }}>
              {item.course}
            </span>
          </div>
          <ChevronRight size={16} style={{ color: "var(--gray-500)", flexShrink: 0 }} />
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: GREEN.daysText, letterSpacing: 2 }}>
            {item.days.join("  ")}
          </span>
          <div className="flex items-center" style={{ gap: 4, paddingLeft: 8, paddingRight: 8, height: 24, borderRadius: 8, backgroundColor: "var(--secondary)" }}>
            <BookOpen size={12} style={{ color: "var(--secondary-foreground)" }} />
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--secondary-foreground)" }}>
              {item.lessons}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface SchoolClassroomCardProps {
  item: typeof DUMMY_CLASSROOMS[number];
  onClick?: () => void;
}

/* School classroom card — flat dark bg with green day labels and student count */
function SchoolClassroomCard({ item, onClick }: SchoolClassroomCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col shrink-0"
      style={{
        width: 288,
        borderRadius: 12,
        padding: "16px 12px 12px",
        backgroundColor: "var(--card-bg-secondary)",
        gap: 8,
        cursor: "pointer",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col" style={{ gap: 4, flex: 1, minWidth: 0 }}>
          <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
            {item.name}
          </span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)" }}>
            {item.class}
          </span>
        </div>
        <ChevronRight size={16} style={{ color: "var(--gray-500)", flexShrink: 0 }} />
      </div>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: GREEN.daysText, letterSpacing: 2 }}>
          {item.days.join("  ")}
        </span>
        <div className="flex items-center" style={{ gap: 4, paddingLeft: 8, paddingRight: 8, height: 24, borderRadius: 8, backgroundColor: "var(--secondary)" }}>
          <User size={12} style={{ color: "var(--secondary-foreground)" }} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--secondary-foreground)" }}>
            {item.students}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Maps examKey → the course ID that gets purchased via the enrollment flow
const PURCHASED_COURSE_FOR_EXAM: Record<string, string> = {
  cat: "cat-3m",
  "jee-mains": "jee-main-12m",
  "jee-advanced": "jee-adv-12m",
};

const PURCHASED_KEY = "prepmaster_purchased_exams";
const ONBOARDING_COMPLETE_KEY = "prepmaster_onboarding_complete";
const FTUE_SHOWN_KEY = "prepmaster_ftue_shown";

// TODO(api): hardcoded — class runs May 19–25, 2026
const CAMP_START_DATE = new Date("2026-05-19T00:00:00");

const CAMP_STRIP: Record<string, { stripBg: string; accentColor: string; trackLabel: string; grade: string }> = {
  explorer: { stripBg: "#003636", accentColor: "#13a8a8", trackLabel: "Explorer", grade: "Grade 6–8" },
  creator:  { stripBg: "#520024", accentColor: "#cb2b83", trackLabel: "Creator",  grade: "Grade 9–12" },
};

const EXAM_NUDGE_CONFIG: Record<string, { label: string; acronym: string; accent: string; gradientBg: string; badgeBg: string; badgeBorder: string }> = {
  cat:           { label: "CAT",          acronym: "CAT", accent: "#d87a16", gradientBg: "linear-gradient(150deg, #2b1600 0%, #614700 50%, #874d00 100%)", badgeBg: "#2b1d11", badgeBorder: "#593815" },
  "jee-mains":   { label: "JEE Mains",    acronym: "JEE", accent: "#4096ff", gradientBg: "linear-gradient(150deg, #001d66 0%, #002c8c 50%, #0958d9 100%)", badgeBg: "#001d66", badgeBorder: "#0050b3" },
  "jee-advanced":{ label: "JEE Advanced", acronym: "JEE", accent: "#9254de", gradientBg: "linear-gradient(150deg, #120338 0%, #22075e 50%, #531dab 100%)", badgeBg: "#120338", badgeBorder: "#391085" },
};

interface SetupNudgeCardProps {
  examKey: string;
  onSetup: () => void;
}

function SetupNudgeCard({ examKey, onSetup }: SetupNudgeCardProps) {
  const cfg = EXAM_NUDGE_CONFIG[examKey] ?? EXAM_NUDGE_CONFIG.cat;

  useEffect(() => {
    try {
      const completed = JSON.parse(localStorage.getItem(ONBOARDING_COMPLETE_KEY) ?? "[]") as string[];
      if (!completed.includes(examKey)) {
        localStorage.setItem(ONBOARDING_COMPLETE_KEY, JSON.stringify([...completed, examKey]));
      }
    } catch {}
  }, [examKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12 }}
    >
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onSetup}
        className="flex items-stretch w-full overflow-hidden"
        style={{
          borderRadius: 12,
          backgroundColor: "var(--card-bg-secondary)",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          padding: 0,
          gap: 0,
        }}
      >
        {/* ── Thumbnail ── */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            width: 76,
            background: cfg.gradientBg,
          }}
        >
          {/* Diagonal texture */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "repeating-linear-gradient(45deg, var(--white-alpha-4) 0px, var(--white-alpha-4) 1px, transparent 1px, transparent 10px)",
            pointerEvents: "none",
          }} />
          {/* Top-right decorative circle */}
          <div style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 64,
            height: 64,
            borderRadius: 9999,
            backgroundColor: "var(--white-alpha-8)",
            pointerEvents: "none",
          }} />
          {/* Bottom-left decorative circle */}
          <div style={{
            position: "absolute",
            bottom: -16,
            left: -16,
            width: 48,
            height: 48,
            borderRadius: 9999,
            backgroundColor: "var(--white-alpha-6)",
            pointerEvents: "none",
          }} />
          {/* Large semi-transparent acronym */}
          <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0 }}>
            <span style={{
              fontSize: 40,
              fontWeight: 800,
              color: cfg.accent,
              opacity: 0.35,
              letterSpacing: -2,
              lineHeight: 1,
            }}>
              {cfg.acronym}
            </span>
          </div>
        </div>

        {/* ── Text content ── */}
        <div className="flex flex-col justify-center flex-1" style={{ padding: "12px 0 12px 14px", gap: 4, minWidth: 0 }}>
          {/* Exam label — small accent tag, no border box */}
          <span style={{
            fontSize: "var(--text-2xs)",
            fontWeight: 700,
            color: cfg.accent,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
          }}>
            {cfg.label}
          </span>
          {/* Copy */}
          <span style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--foreground)",
            lineHeight: 1.3,
          }}>
            Personalise your study schedule
          </span>
        </div>

        {/* CTA */}
        <div className="flex items-center" style={{ paddingLeft: 8, paddingRight: 12, flexShrink: 0 }}>
          <div style={{
            paddingLeft: 12,
            paddingRight: 12,
            height: 32,
            borderRadius: 8,
            backgroundColor: "var(--primary-600)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              color: "var(--white)",
              letterSpacing: "0.02em",
            }}>
              Set up
            </span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

/* ── FTUE Welcome Sheet ───────────────────────────────────────── */

interface FTUEWelcomeSheetProps {
  onStartClass: () => void;
  onDismiss: () => void;
}

function FTUEWelcomeSheet({ onStartClass, onDismiss }: FTUEWelcomeSheetProps) {
  const catAccent = EXAM_NUDGE_CONFIG["cat"].accent;
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="ftue-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onDismiss}
        style={{ position: "fixed", inset: 0, backgroundColor: "var(--overlay-heavy)", zIndex: 200 }}
      />

      {/* Sheet */}
      <motion.div
        key="ftue-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 201,
          backgroundColor: "var(--background)",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
        }}
      >
        {/* Accent glow at top edge */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: `radial-gradient(ellipse 70% 100% at 50% 0%, ${catAccent}18 0%, transparent 100%)`,
          pointerEvents: "none",
        }} />

        <div style={{ padding: "20px 20px 36px", display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>
          {/* Handle bar */}
          <div className="flex justify-center">
            <div style={{ width: 36, height: 4, borderRadius: 9999, backgroundColor: "var(--border)" }} />
          </div>

          {/* Header */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            {/* Exam badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              alignSelf: "flex-start",
              paddingLeft: 10,
              paddingRight: 10,
              height: 24,
              borderRadius: 8,
              backgroundColor: `${catAccent}26`,
              border: `1px solid ${catAccent}40`,
            }}>
              <span style={{
                fontSize: "var(--text-2xs)",
                fontWeight: 700,
                color: catAccent,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
              }}>
                CAT 2025
              </span>
            </div>

            <div className="flex flex-col" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                Your classrooms are ready
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                3 subjects built from your study plan. Begin with Quant today.
              </span>
            </div>
          </div>

          {/* Classroom list */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            {DUMMY_PREP_CLASSROOMS.map((room, index) => {
              const isFirst = index === 0;
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.06 }}
                  className="flex items-center"
                  style={{
                    padding: "12px 12px",
                    borderRadius: 12,
                    backgroundColor: isFirst ? `${catAccent}12` : "var(--card-bg-secondary)",
                    border: `1px solid ${isFirst ? `${catAccent}30` : "transparent"}`,
                    gap: 12,
                  }}
                >
                  {/* Number badge */}
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: isFirst ? `${catAccent}26` : "var(--gray-900)",
                    }}
                  >
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: isFirst ? catAccent : "var(--gray-400)" }}>
                      {index + 1}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
                    <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
                      {room.subject}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-500)", letterSpacing: "0.04em" }}>
                      {room.days.join("  ")}  ·  {room.lessons} lessons
                    </span>
                  </div>

                  {/* START badge on first row */}
                  {isFirst && (
                    <div
                      className="flex items-center shrink-0"
                      style={{ gap: 4, paddingLeft: 8, paddingRight: 8, height: 24, borderRadius: 8, backgroundColor: `${catAccent}26` }}
                    >
                      <Video size={10} style={{ color: catAccent }} />
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: catAccent, letterSpacing: "0.04em" }}>START</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onStartClass}
            className="flex items-center justify-center w-full cursor-pointer"
            style={{
              height: 52,
              borderRadius: 12,
              border: "none",
              backgroundColor: catAccent,
              color: "var(--white)",
              fontSize: "var(--text-base)",
              fontWeight: 700,
              letterSpacing: "0.01em",
              gap: 8,
              boxShadow: `0 4px 24px ${catAccent}50`,
            }}
          >
            <Video size={18} style={{ color: "var(--white)" }} />
            Start your first class
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Test Series rail card (post-purchase, with progress) ───────────────────
// Compact test-series card — matches PurchasedContentCard's 288×80 shape so packs
// and courses can live in one unified "My Learning" rail. Single-item rails were
// inflating visual weight (the dedicated "My Test Series" section was a giant
// rail for what's usually 1–2 packs). Keeping cards equal-weight respects the
// student's mental model: "things I'm learning", not the product taxonomy.
// Per-exam thumbnail accent — mirrors the marketplace listing palette so the
// rail thumbnails read identifiably as JEE/NEET/CAT/UPSC/etc. The pack detail
// page intentionally stays primary-blue (uniform progress chrome), so this map
// is scoped to the thumbnail only — not propagated to pack.examAccent.
const THUMB_ACCENT_BY_PACK: Record<string, string> = {
  "mt-jee-main": "#4096ff", // AntD blue-5
  "mt-jee-adv":  "#9254de", // AntD purple-5
  "mt-gate-cse": "#13c2c2", // AntD cyan-5
  "mt-neet-ug":  "#52c41a", // AntD green-5
  "mt-neet-pg":  "#389e0d", // AntD green-6
  "mt-cat":      "#ffc53d", // AntD gold-4
  "mt-clat":     "#fa541c", // AntD volcano-6
  "mt-upsc":     "#ff7a45", // AntD volcano-5
  "mt-ssc-cgl":  "#08979c", // AntD cyan-7
  "mt-ibps-po":  "#c41d7f", // AntD magenta-7
};

function MyTestSeriesCompactCard({ pack, onClick }: { pack: MyTestSeriesPack; onClick: () => void }) {
  const accent = THUMB_ACCENT_BY_PACK[pack.packId] ?? "var(--primary-500)";
  const { completed, progressPct } = packStats(pack);
  const isFresh = completed === 0;
  const subtitle = isFresh
    ? `${pack.planLabel} · ${pack.totalMocks} mocks · Ready to start`
    : `${pack.planLabel} · ${completed} of ${pack.totalMocks} mocks done`;
  // First word of examLabel keeps the brand mark compact on the 80×80 thumb
  // (e.g. "JEE Main" → "JEE", "NEET UG" → "NEET").
  const examMark = pack.examLabel.split(/\s+/)[0].toUpperCase();

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center shrink-0 text-left"
      style={{
        width: 288, height: 80, borderRadius: 12, cursor: "pointer", overflow: "hidden",
        background: "var(--card-bg-secondary)",
        border: `1px solid ${accent}22`,
        padding: 0,
      }}
    >
      {/* Thumb — album-art treatment: full-bleed brand block with exam mark stamped.
          Matches the visual weight of a photo thumb so test-series and course cards
          read as one design language in the rail. */}
      <div
        className="flex flex-col items-center justify-center"
        style={{
          width: 80, height: "100%", flexShrink: 0, position: "relative",
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 32%, #000) 0%, color-mix(in srgb, ${accent} 14%, #000) 100%)`,
          overflow: "hidden",
        }}
      >
        <div aria-hidden style={{
          position: "absolute", top: -20, left: -20, width: 80, height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          filter: "blur(16px)", opacity: 0.5,
        }} />
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, color-mix(in srgb, ${accent} 50%, transparent) 0.5px, transparent 0)`,
          backgroundSize: "10px 10px",
          opacity: 0.18,
        }} />
        <span style={{
          position: "relative",
          fontSize: examMark.length <= 3 ? 22 : 16,
          fontWeight: 900,
          color: "color-mix(in srgb, var(--white) 92%, transparent)",
          letterSpacing: examMark.length <= 3 ? -1 : -0.3,
          lineHeight: 1,
        }}>
          {examMark}
        </span>
        <span style={{
          position: "relative",
          marginTop: 4,
          fontSize: 9,
          fontWeight: 800,
          color: `color-mix(in srgb, ${accent} 85%, white)`,
          letterSpacing: 1.2,
        }}>
          MOCKS
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0, paddingLeft: 12, paddingRight: 8, gap: 4 }}>
        <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", display: "block" }}>
          {pack.title}
        </span>
        <span className="truncate" style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", display: "block" }}>
          {subtitle}
        </span>
        {!isFresh && (
          <div style={{ height: 3, borderRadius: 9999, backgroundColor: "var(--border)", overflow: "hidden", marginTop: 2 }}>
            <div style={{ height: "100%", width: `${progressPct}%`, backgroundColor: "var(--primary-500)" }} />
          </div>
        )}
      </div>
      <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0, marginRight: 8 }} />
    </motion.button>
  );
}

// ─── VocabFastClassroomCard — post-purchase card for /classes ────────────────
// Wide compact card showing: pack name + partner attribution + progress bar +
// streak + words mastered. Tap → launches webview shell.
// TODO(api): GET /api/vocabfast/progress?packs=<id>&userId=<id>

interface VocabFastCardProps {
  packId: string;
  wordsMastered: number;
  totalWords: number;
  streakDays: number;
  onClick: () => void;
}

function VocabFastClassroomCard({ packId, wordsMastered, totalWords, streakDays, onClick }: VocabFastCardProps) {
  const pack = getVocabFastPack(packId);
  if (!pack) return null;

  const pct = totalWords > 0 ? Math.min(1, wordsMastered / totalWords) : 0;
  const accent = VOCABFAST_BRAND.accentColor;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 268,
        borderRadius: 14,
        backgroundColor: "var(--card)",
        border: "0.5px solid var(--border)",
        cursor: "pointer",
      }}
    >
      {/* Top color band — partner brand strip */}
      <div
        className="flex items-center"
        style={{
          gap: 8, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
          background: "linear-gradient(135deg, #05122e 0%, #15326b 100%)",
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 20, height: 20, borderRadius: 4,
            background: "linear-gradient(135deg, #1c4922 0%, #2e7032 100%)",
          }}
        >
          <Brain size={11} style={{ color: "#b7eb8f" }} />
        </div>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "#fff", letterSpacing: 0.4 }}>
          {VOCABFAST_BRAND.name}
        </span>
        <ExternalLink size={11} style={{ color: accent, marginLeft: "auto" }} />
      </div>

      {/* Body */}
      <div className="flex flex-col" style={{ padding: 12, gap: 10 }}>
        <div className="flex items-start justify-between" style={{ gap: 8 }}>
          <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <span style={{
              fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)",
              lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {pack.title}
            </span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
              Vocabulary · {pack.audience}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex flex-col" style={{ gap: 4 }}>
          <div style={{
            height: 4, borderRadius: 9999,
            backgroundColor: `${accent}1f`, overflow: "hidden",
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: 9999, backgroundColor: accent }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: accent }}>
              {wordsMastered.toLocaleString("en-IN")} / {totalWords.toLocaleString("en-IN")} mastered
            </span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
              {Math.round(pct * 100)}%
            </span>
          </div>
        </div>

        {/* Bottom row — streak + CTA */}
        <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
          {streakDays > 0 ? (
            <div className="flex items-center" style={{ gap: 4 }}>
              <Flame size={12} style={{ color: "var(--warning-500)" }} />
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--warning-500)" }}>
                {streakDays} day streak
              </span>
            </div>
          ) : (
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
              Start your streak today
            </span>
          )}
          <div className="flex items-center" style={{ gap: 2 }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: accent }}>
              Continue
            </span>
            <ChevronRight size={12} style={{ color: accent }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── v1 sub-components ─────────────────────────────────────────────────────
// All scoped to classes-v1 — would extract to shared/ if a third surface needs them.

// Rotating placeholder examples shown in the GYD AI search bar. Cycles every
// ~3.5s to teach users what the AI can actually do. Mixed across audiences:
// JEE/NEET concept questions, math solver, biology, K-7 curiosity.
const GYD_AI_PLACEHOLDERS = [
  "Ask GYD AI…",
  "Explain Newton's Laws",
  "Quiz me on Photosynthesis",
  "Solve: 2x + 5 = 13",
  "What are mitochondria?",
  "How do plants make food?",
];

// GYD AI search bar — v1 ELEVATES the assistant from production's hard-to-see
// bottom-floater to a prominent inline bar at the top of the scrollable
// content. Rotating placeholder teaches users what to ask.
// NOT CLICKABLE in v1: production's GYD AI sheet is a full chat surface we
// don't replicate here. Per Sagar's call: either ship the production sheet
// exactly, or don't open anything. v1 ships the inline placement only —
// production wires the tap to the real component.
function GYDAISearchBar() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % GYD_AI_PLACEHOLDERS.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex items-center"
      style={{
        width: "100%",
        height: 48, borderRadius: 12, gap: 8,
        paddingLeft: 16, paddingRight: 6,
        backgroundColor: "var(--card)",
        // Production reference is solid green stroke. Matching it directly.
        border: "1px solid var(--success-500)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, textAlign: "left", overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            style={{
              display: "block",
              fontSize: "var(--text-sm)", fontWeight: 500,
              color: "var(--muted-foreground)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {GYD_AI_PLACEHOLDERS[idx]}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center" style={{
        width: 32, height: 32, borderRadius: 9999, flexShrink: 0,
        backgroundColor: "var(--background)",
      }}>
        <ArrowUp size={14} style={{ color: "var(--white)" }} strokeWidth={2.5} />
      </div>
    </div>
  );
}

// Today's Drill CTA card — appended to the Today rail. Same visual weight as
// PrepLiveCard / ScheduleCard so it looks like part of the day's flow, not a
// separate marketing block. Tap → Daily Drill /play.
function TodaysDrillCard({
  streak, playedThisSession, onTap,
}: {
  streak: number;
  playedThisSession: boolean;
  onTap: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className="flex flex-col shrink-0"
      style={{
        width: 240, padding: 16, borderRadius: 12,
        backgroundColor: `color-mix(in srgb, var(--success-500) 12%, var(--card))`,
        border: "0.5px solid color-mix(in srgb, var(--success-500) 30%, var(--border))",
        cursor: "pointer", gap: 12,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center" style={{
          width: 32, height: 32, borderRadius: 8,
          backgroundColor: "color-mix(in srgb, var(--success-500) 22%, transparent)",
          justifyContent: "center",
        }}>
          <Flame size={16} style={{ color: "var(--success-500)" }} />
        </div>
        {streak > 0 && (
          <span style={{
            fontSize: "var(--text-2xs)", fontWeight: 700,
            color: "var(--warning-500)", letterSpacing: 0.4, textTransform: "uppercase",
          }}>
            Day {streak} streak
          </span>
        )}
      </div>
      <div className="flex flex-col" style={{ gap: 4 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
          Today's Drill
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
          {playedThisSession
            ? "Played today · come back tomorrow"
            : "10 quick questions · 12 sec each"}
        </span>
      </div>
    </motion.div>
  );
}

// Per-game icon map — each game gets its own identity, not all-Gamepad2.
// Lucide icons chosen to match each game's character:
//   Daily Drill (streak)         → Flame
//   Word Wizard (spelling magic) → Sparkles
//   Math Mountain (climb)        → Mountain
//   Memory Match (concentration) → Brain
//   Pattern Puzzles (logic)      → Puzzle
//   Reading Race (passages)      → BookOpen
//   Brain Battle (1v1)           → Swords
//   Science Lab (experiments)    → FlaskConical
//   Sunday Showdown (live event) → Trophy
function getGameIcon(gameId: string): typeof Flame {
  switch (gameId) {
    case "daily-sprint":    return Flame;
    case "word-wars":       return Sparkles;
    case "brain-sprint":    return Mountain;
    case "memory-match":    return Brain;
    case "pattern-puzzles": return Puzzle;
    case "reading-race":    return BookOpen;
    case "quiz-duel":       return Swords;
    case "concept-labs":    return FlaskConical;
    case "live-quiz-arena": return Trophy;
    default:                return Gamepad2;
  }
}

// Game card for the Classes Games rail — LinkedIn-style horizontal card.
// 224×64, horizontal scroll, ~2 cards visible per mobile viewport.
// Whole card tappable, no PLAY pill (was redundant), small chevron on the
// right hints at navigation. Thumbnail dropped from 56→44 for better card
// proportions.
function ClassesGameTile({ game, state, onTap }: {
  game: Game;
  state: string;
  onTap: () => void;
}) {
  const Icon = getGameIcon(game.id);
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className="flex items-center shrink-0"
      style={{
        width: 224, height: 64, padding: 8, borderRadius: 12, gap: 12,
        backgroundColor: "var(--card)",
        border: "0.5px solid var(--border)",
        cursor: "pointer", textAlign: "left",
      }}
      aria-label={`Play ${game.title}`}
    >
      <div className="flex items-center justify-center" style={{
        width: 44, height: 44, borderRadius: 8, flexShrink: 0,
        backgroundColor: `color-mix(in srgb, ${game.accent} 18%, var(--card))`,
        border: `0.5px solid color-mix(in srgb, ${game.accent} 40%, transparent)`,
      }}>
        <Icon size={22} style={{ color: game.accent }} strokeWidth={2} />
      </div>
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <span className="truncate" style={{
          fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)",
          lineHeight: 1.25,
        }}>
          {game.title}
        </span>
        <span className="truncate" style={{
          fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
          letterSpacing: 0.2, lineHeight: 1.3,
        }}>
          {state}
        </span>
      </div>
      <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
    </motion.button>
  );
}

// Generic state-string for any game tile in the Classes Games rail. v1 uses
// session-level proxy (playsFor > 0 → "Played today") because we don't yet
// have date-aware per-day tracking. Daily Drill + Sunday Showdown get special
// copy.
function gameStateLabel(game: Game, plays: number, streak: number): string {
  if (game.id === "daily-sprint") {
    if (streak > 0) return `Day ${streak} streak`;
    return plays > 0 ? "Played today" : "Play 10 questions";
  }
  if (game.id === "live-quiz-arena") return "Live · Sundays 7 PM";
  return plays > 0 ? "Played today · play again" : "Not played yet";
}

// Labeled sub-rail used inside My Classrooms to group cards by source
// (AI Summer Camp / CAT / JEE / Crash / School). Prevents flat-rail scale
// explosion when student has 15-20 subject classrooms.
function ClassroomSubRail({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      {label && (
        <div className="flex items-center" style={{ paddingLeft: 16, paddingRight: 16 }}>
          <span style={{
            fontSize: "var(--text-2xs)", fontWeight: 700,
            color: "var(--muted-foreground)",
            letterSpacing: 0.8, textTransform: "uppercase",
          }}>
            {label}
          </span>
        </div>
      )}
      <div className="flex" style={{
        gap: 12, paddingLeft: 16, paddingRight: 16,
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {children}
      </div>
    </div>
  );
}

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>([]);
  const [pendingSetupExams, setPendingSetupExams] = useState<string[]>([]);
  const [showFTUESheet, setShowFTUESheet] = useState(false);
  const [deviceDialog, setDeviceDialog] = useState<null | "confirm" | "ended">(null);
  const [savedCrashClass, setSavedCrashClass] = useState<number | null>(() => {
    const v = localStorage.getItem("cc_selected_class");
    return v ? parseInt(v, 10) : null;
  });
  // 11-12 keyspace (see crash-course-detail.tsx) — AI-tutor demo courses
  // enroll through this path, not the legacy cc_selected_class. Each sku gets
  // its own flag (cc_enrolled_<sku>), not a singleton — a student can be
  // enrolled in more than one at once (e.g. both Maths and Science).
  const [enrolledAiTutorSkus, setEnrolledAiTutorSkus] = useState<string[]>(() =>
    AI_TUTOR_SKUS.filter((sku) => localStorage.getItem(`cc_enrolled_${sku}`) === "1")
  );
  const vocabPurchases = useVocabFastPurchases();
  const gamesPass = useGamesPass();
  const [purchasedCampTrack] = useState<"explorer" | "creator" | null>(() => {
    const t = new URLSearchParams(window.location.search).get("camp_purchased");
    return t === "explorer" || t === "creator" ? t : null;
  });
  // v1: session-level "played today" proxy for Daily Drill (we don't have
  // real per-day tracking yet — playsByGame is module-level session state).
  const dailyDrillPlaysThisSession = gamesPass.playsFor("daily-sprint");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("camp_purchased")) {
      window.history.replaceState({}, "", "/classes");
    }
  }, []);

  useEffect(() => {
    try {
      const purchased = JSON.parse(localStorage.getItem(PURCHASED_KEY) ?? "[]") as string[];
      const completed = JSON.parse(localStorage.getItem(ONBOARDING_COMPLETE_KEY) ?? "[]") as string[];
      setPurchasedCourseIds(purchased.map((e) => PURCHASED_COURSE_FOR_EXAM[e]).filter(Boolean));
      setPendingSetupExams(purchased.filter((e) => !completed.includes(e)));
    } catch {
      setPurchasedCourseIds([]);
      setPendingSetupExams([]);
    }

    const v = localStorage.getItem("cc_selected_class");
    setSavedCrashClass(v ? parseInt(v, 10) : null);
    setEnrolledAiTutorSkus(AI_TUTOR_SKUS.filter((sku) => localStorage.getItem(`cc_enrolled_${sku}`) === "1"));

    if (searchParams.get("ftue") === "1" && !localStorage.getItem(FTUE_SHOWN_KEY)) {
      const timer = setTimeout(() => setShowFTUESheet(true), 600);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const dismissFTUE = () => {
    localStorage.setItem(FTUE_SHOWN_KEY, "1");
    setShowFTUESheet(false);
  };

  const startFirstClass = () => {
    localStorage.setItem(FTUE_SHOWN_KEY, "1");
    setShowFTUESheet(false);
    navigate("/live-class?tour=1");
  };

  // AI-tutor vision-memo demo: ?demo=ai-tutor strips the page down to just the
  // classroom state — "no classes yet" until the real enroll+schedule flow for
  // ncert-10-maths and/or ncert-10-science has run, then one Crash-tagged
  // classroom card per enrolled course. Every other rail (Today, Play &
  // Compete, My Learning, Discover) is hidden so the demo stays a two-state
  // story instead of the full production page.
  const isAiTutorDemo = searchParams.get("demo") === "ai-tutor";
  const isEnrolledInDemoCourse = enrolledAiTutorSkus.length > 0;

  return (
    <div className="flex flex-col" style={{ height: "100%", backgroundColor: "var(--background)", overflow: "hidden" }}>

      {showFTUESheet && (
        <FTUEWelcomeSheet onStartClass={startFirstClass} onDismiss={dismissFTUE} />
      )}

      {/* Device-switch dialog preview (one-account-one-device feature) */}
      <DeviceSwitchConfirmDialog
        open={deviceDialog === "confirm"}
        device={{
          label: "Android phone",
          model: "Vivo V21 · V2153",
        }}
        onCancel={() => setDeviceDialog(null)}
        onConfirm={() => setDeviceDialog("ended")}
      />
      <SessionEndedDialog
        open={deviceDialog === "ended"}
        onSignIn={() => setDeviceDialog(null)}
      />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0"
        style={{
          background: "var(--header-hero-bg)",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          zIndex: 10,
        }}
      >
        {/* iOS Status bar */}
        <div className="flex items-center justify-between" style={{ height: 44, paddingLeft: 20, paddingRight: 16, paddingTop: 12, color: "var(--foreground)" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", letterSpacing: -0.3 }}>9:41</span>
          <div className="flex items-center" style={{ gap: 8 }}>
            {/* Signal bars */}
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0" y="9" width="3" height="3" rx="0.5" fill="currentColor"/>
              <rect x="4.5" y="6" width="3" height="6" rx="0.5" fill="currentColor"/>
              <rect x="9" y="3" width="3" height="9" rx="0.5" fill="currentColor"/>
              <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="currentColor"/>
            </svg>
            {/* WiFi */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="currentColor"/>
              <path d="M4.2 6.8A5.3 5.3 0 0111.8 6.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M1.5 4.2A8.5 8.5 0 0114.5 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {/* Battery */}
            <div className="flex items-center" style={{ gap: 1 }}>
              <div style={{ width: 25, height: 12, borderRadius: 3, border: "1px solid color-mix(in srgb, var(--foreground) 65%, transparent)", padding: 2 }}>
                <div style={{ width: "80%", height: "100%", borderRadius: 1.5, backgroundColor: "var(--foreground)" }} />
              </div>
              <div style={{ width: 2, height: 5, borderRadius: 1, backgroundColor: "color-mix(in srgb, var(--foreground) 50%, transparent)" }} />
            </div>
          </div>
        </div>

        {/* Greeting row */}
        <div
          className="flex items-center justify-between"
          style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 16 }}
        >
          <div className="flex flex-col" style={{ gap: 0 }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: "var(--font-weight-normal)" }}>
              {getGreeting()}
            </span>
            <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
              {DUMMY_USER.name}
            </span>
          </div>

          {/* Notification bell */}
          <div style={{ position: "relative" }}>
            <button
              className="flex items-center justify-center"
              aria-label="Notifications"
              style={{
                width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                backgroundColor: "var(--card-bg-secondary)",
                boxShadow: "var(--elevation-sm)",
              }}
            >
              <Bell size={20} style={{ color: "var(--foreground)" }} />
            </button>
            {DUMMY_USER.notificationsCount > 0 && (
              <div className="flex items-center justify-center" style={{
                position: "absolute", top: -4, right: -4,
                width: 16, height: 16, borderRadius: 9999,
                backgroundColor: "var(--primary-600)",
              }}>
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)", lineHeight: 1 }}>
                  {DUMMY_USER.notificationsCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable Content ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 8 }}>

        {isAiTutorDemo ? (
          !isEnrolledInDemoCourse ? (
            <div className="flex flex-col" style={{ padding: "24px 16px", gap: 24 }}>
              <div className="flex flex-col items-center" style={{ padding: "40px 24px 8px", gap: 14, textAlign: "center" }}>
                <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)" }}>
                  <BookOpen style={{ width: 26, height: 26, color: "var(--muted-foreground)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", marginBottom: 4 }}>
                    No classes yet
                  </p>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.5, maxWidth: 260 }}>
                    Enroll in a course to set your study schedule.
                  </p>
                </div>
              </div>

              {/* Banner pointing at the one live marketplace listing this demo
                  cares about — more specific than a generic "browse" CTA, and
                  the direct path into the same single-listing Discover screen
                  (marketplace-v1.tsx's isAiTutorDemo branch). */}
              <button
                onClick={() => navigate("/marketplace-v1?demo=ai-tutor")}
                className="flex items-center w-full text-left"
                style={{ gap: 12, padding: 12, borderRadius: "var(--radius-card)", border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer" }}
              >
                <img
                  src="/ncert-10-maths-listing.jpg"
                  alt="Class 10 NCERT Maths"
                  style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", marginBottom: 2 }}>
                    Class 10 NCERT Maths
                  </p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                    A dedicated teacher for every concept and problem in your textbook
                  </p>
                </div>
                <ChevronRight style={{ width: 18, height: 18, color: "var(--muted-foreground)", flexShrink: 0 }} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 16, paddingTop: 20, paddingBottom: 20 }}>
              <div className="flex items-center" style={{ paddingLeft: 16, paddingRight: 16, gap: 8 }}>
                <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                  Classrooms
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>
                  ({enrolledAiTutorSkus.length})
                </span>
              </div>
              <ClassroomSubRail label="Other">
                {enrolledAiTutorSkus.map((sku) => {
                  const info = DUMMY_CRASH_COURSES_1112[sku];
                  return (
                    <PrepClassroomCard
                      key={sku}
                      item={{
                        id: `cc-${sku}`,
                        subject: info.subjects[0].title,
                        course: `Crash Course · Class ${info.classLevel}`,
                        days: ["Mo", "Tu", "We", "Th", "Fr"],
                        lessons: info.subjects[0].chapters,
                        subjectId: info.subjects[0].id,
                        examId: "crash-courses",
                      }}
                      onClick={() => navigate(`/ai-tutor/chapter-home?sku=${sku}`)}
                    />
                  );
                })}
              </ClassroomSubRail>
            </div>
          )
        ) : (
          <>
        {/* GYD AI — v1 ELEVATES the assistant from production's hard-to-see
            bottom-floater to a prominent inline bar at the very top of the
            scrollable content. Rotating placeholder teaches users what they
            can ask. Tap → opens the GYD AI sheet (minimal demo here; real
            chat surface is the production component). */}
        <div style={{ padding: "16px 16px 0" }}>
          <GYDAISearchBar />
        </div>

        {/* Today section — v1 renamed from "Today's Schedule". Same data,
            plus Today's Drill CTA appended to the rail so the daily-return
            hook lives where the user looks first. */}
        <div className="flex flex-col" style={{ gap: 8, paddingTop: 20, paddingBottom: 20 }}>
          <div className="flex items-center" style={{ paddingLeft: 16, paddingRight: 16, gap: 8 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
              Today
            </span>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>
              ({DUMMY_PREP_LIVE.length + DUMMY_SCHEDULE.length + 1})
            </span>
          </div>

          <div
            className="flex"
            style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}
          >
            {DUMMY_PREP_LIVE.map((item) => (
              <PrepLiveCard key={item.id} item={item} />
            ))}
            {DUMMY_SCHEDULE.map((item) => (
              <ScheduleCard key={item.id} item={item} />
            ))}
            <TodaysDrillCard
              streak={CURRENT_DRILL_STREAK}
              playedThisSession={dailyDrillPlaysThisSession > 0}
              onTap={() => navigate("/marketplace/game/daily-sprint/play")}
            />
          </div>
        </div>

        {/* Play & Compete — v1 compete zone. Olympiads (scheduled, ranked,
            certificated contests) lead as a full-width entry; the curated 6
            casual games follow as a tile rail below. Olympiad was previously
            mis-filed after "My Learning" (it isn't owned content — it's a live
            event you enter). Game picks documented at CLASSES_FEATURED_GAME_IDS. */}
        {(() => {
          const featuredGames = CLASSES_FEATURED_GAME_IDS
            .map((id) => DUMMY_GAMES.find((g) => g.id === id))
            .filter((g): g is Game => !!g);
          return (
            <div className="flex flex-col" style={{ gap: 8, paddingBottom: 20 }}>
              <div className="flex items-center justify-between" style={{ paddingLeft: 16, paddingRight: 16 }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                    Play & Compete
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>
                    ({featuredGames.length + 1})
                  </span>
                </div>
              </div>

              {/* Lead: Arena — the competitive hub (daily Leagues + Championships).
                  Live tier/rank/streak + season jeopardy so the daily habit pulls
                  from here; routes into the Arena hub. */}
              <ArenaHubCard onClick={() => navigate("/arena")} />

              {/* Casual game tiles */}
              <div className="flex" style={{
                gap: 12, paddingLeft: 16, paddingRight: 16,
                overflowX: "auto", scrollbarWidth: "none",
              }}>
                {featuredGames.map((game) => {
                  const plays = gamesPass.playsFor(game.id);
                  const stateLabel = gameStateLabel(game, plays, CURRENT_DRILL_STREAK);
                  return (
                    <ClassesGameTile
                      key={game.id}
                      game={game}
                      state={stateLabel}
                      onTap={() => navigate(`/marketplace/game/${game.id}/play`)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })()}


        {/* Classrooms — ONE section, two subsections (sub-rails):
              • Institute — formal classes assigned by the student's school /
                coaching institute (teacher + roster).
              • Other — self-acquired marketplace content: exam-prep courses,
                crash courses, AI Summer Camp. Cards carry their own exam strip
                (CAT / CRASH / AI CAMP) so source stays legible in one rail —
                no need for per-course sub-labels here.
            Section auto-hides when there are zero classrooms. */}
        {(() => {
          const instituteCount = DUMMY_CLASSROOMS.length;
          const otherCount = (purchasedCampTrack ? 1 : 0)
            + (savedCrashClass ? DUMMY_CRASH_COURSE_INFO.subjects.length : 0)
            + DUMMY_PREP_CLASSROOMS.length;
          const totalCount = instituteCount + otherCount;

          if (totalCount === 0) return null;

          return (
            <div className="flex flex-col" style={{ gap: 16, paddingBottom: 20 }}>
              <div className="flex items-center" style={{ paddingLeft: 16, paddingRight: 16, gap: 8 }}>
                <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                  Classrooms
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>
                  ({totalCount})
                </span>
              </div>

              {/* Institute subsection */}
              {instituteCount > 0 && (
                <ClassroomSubRail label="Institute">
                  {DUMMY_CLASSROOMS.map((room) => (
                    <SchoolClassroomCard key={room.id} item={room} />
                  ))}
                </ClassroomSubRail>
              )}

              {/* Other subsection — camp + exam prep + crash, strip-coded cards */}
              {otherCount > 0 && (
                <ClassroomSubRail label="Other">
                  {purchasedCampTrack && (
                    <SummerCampClassroomCard track={purchasedCampTrack} />
                  )}
                  {DUMMY_PREP_CLASSROOMS.map((room) => (
                    <PrepClassroomCard
                      key={room.id}
                      item={room}
                      onClick={() => navigate(`/learning-path?subject=${room.subjectId}&exam=${room.examId}`)}
                    />
                  ))}
                  {savedCrashClass && DUMMY_CRASH_COURSE_INFO.subjects.map((sub) => (
                    <PrepClassroomCard
                      key={`cc-${sub.id}`}
                      item={{
                        id: `cc-${sub.id}`,
                        subject: sub.title,
                        course: `Crash Course · Class ${savedCrashClass}`,
                        days: ["Mo", "Tu", "We", "Th", "Fr"],
                        lessons: sub.chapters,
                        subjectId: sub.id,
                        examId: "crash-courses",
                      }}
                      onClick={() => navigate("/learning-path")}
                    />
                  ))}
                </ClassroomSubRail>
              )}
            </div>
          );
        })()}

        {/* My Learning — unified rail of purchased test packs + courses/apps
            + VocabularyFast partner vocabulary packs.
            Games are intentionally NOT here — they surface via order history
            + the marketplace Games rail + the game detail page (per product
            decision: games are a play surface, not a learning track). */}
        {(DUMMY_MY_TEST_SERIES.length + DUMMY_PURCHASED_CONTENT.length + vocabPurchases.purchasedIds.length) > 0 && (() => {
          const inProgressPacks = DUMMY_MY_TEST_SERIES.filter((p) => packStats(p).completed > 0);
          const freshPacks = DUMMY_MY_TEST_SERIES.filter((p) => packStats(p).completed === 0);
          const total = DUMMY_MY_TEST_SERIES.length + DUMMY_PURCHASED_CONTENT.length + vocabPurchases.purchasedIds.length;
          return (
            <div className="flex flex-col" style={{ gap: 8, paddingTop: 4, paddingBottom: 8 }}>
              <div className="flex items-center" style={{ paddingLeft: 16, paddingRight: 16, gap: 8 }}>
                <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                  My Learning
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>
                  ({total})
                </span>
              </div>
              <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
                {/* Vocabulary packs first — newest partner integration; also
                    most recently purchased typically. */}
                {vocabPurchases.purchasedIds.map((id) => {
                  const progress = vocabPurchases.progress(id);
                  const pack = getVocabFastPack(id);
                  if (!pack) return null;
                  return (
                    <VocabFastClassroomCard
                      key={id}
                      packId={id}
                      wordsMastered={progress?.wordsMastered ?? 0}
                      totalWords={progress?.totalWords ?? pack.wordsCount}
                      streakDays={progress?.streakDays ?? 0}
                      onClick={() => navigate(`/marketplace/webview/vf-${id.replace("vf-", "")}`)}
                    />
                  );
                })}
                {inProgressPacks.map((pack) => (
                  <MyTestSeriesCompactCard
                    key={pack.packId}
                    pack={pack}
                    onClick={() => navigate(`/my-test-series/${pack.packId}`)}
                  />
                ))}
                {freshPacks.map((pack) => (
                  <MyTestSeriesCompactCard
                    key={pack.packId}
                    pack={pack}
                    onClick={() => navigate(`/my-test-series/${pack.packId}`)}
                  />
                ))}
                {DUMMY_PURCHASED_CONTENT.map((item) => (
                  <PurchasedContentCard
                    key={item.id}
                    item={item}
                    onClick={() => navigate(item.openPath)}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Setup nudge — shown when a purchased exam hasn't completed onboarding */}
        {pendingSetupExams.length > 0 && (
          <SetupNudgeCard
            examKey={pendingSetupExams[0]}
            onSetup={() => navigate(`/build-study-plan?exam=${pendingSetupExams[0]}`)}
          />
        )}

        {/* Divider — separates owned content (above) from discover (below).
            Visual cue that anything past this line is "browse," not "yours." */}
        <div style={{ height: 1, backgroundColor: "var(--border)", marginLeft: 16, marginRight: 16, marginBottom: 20, marginTop: 20 }} />

        {/* Discover — v1 renamed from "Other Courses". Title on the left,
            "Browse all →" link on the right of the header (standard see-all
            pattern). Saves a row of vertical real estate vs the prior full-
            width CTA below the cards. */}
        <div className="flex flex-col" style={{ gap: 8, paddingBottom: 20 }}>
          <div className="flex items-center justify-between" style={{ paddingLeft: 16, paddingRight: 16 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                Discover
              </span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>
                ({DUMMY_OTHER_COURSES_LIST.length})
              </span>
            </div>
            <button
              onClick={() => navigate("/marketplace-v1")}
              className="flex items-center"
              style={{
                gap: 4, height: 28, paddingLeft: 8, paddingRight: 8,
                backgroundColor: "transparent", border: "none",
                cursor: "pointer",
              }}
              aria-label="Browse marketplace"
            >
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--primary-500)" }}>
                Browse all
              </span>
              <ArrowRight size={14} style={{ color: "var(--primary-500)" }} />
            </button>
          </div>

          <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
            {DUMMY_OTHER_COURSES_LIST.map((course) => (
              <OtherCourseCard
                key={course.id}
                course={course}
                hideWishlist
                onClick={() => {
                  if (course.id === "crash-courses") {
                    navigate("/crash-course-detail");
                  } else if (course.id.startsWith("cat-")) {
                    navigate(`/course-detail?exam=cat&plan=${course.id}`);
                  } else {
                    navigate(`/marketplace/music/${course.id}`);
                  }
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ height: 8 }} />
          </>
        )}
      </div>

    </div>
  );
}
