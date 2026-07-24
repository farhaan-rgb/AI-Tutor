/**
 * Music Course Detail — FSM Buddy Integration
 * Route: /marketplace/music/:courseId
 */

import { useState } from "react";
import type React from "react";
import { useNavigate, useParams } from "react-router";
import {
  Star, Users, Clock, Video, Check, Heart, Music2,
  Monitor, GraduationCap, UserCheck, CalendarDays, Plus, Minus,
  X, Sun, Sunset, User, Phone, Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar } from "../shared/premium-ui";
import { useTheme } from "../app/contexts/theme-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionPackage {
  id: string;
  sessions: number;
  price: number;
  originalPrice: number;
  perSession: number;
  badge?: string;
  badgeColor?: string;
  sessionsLabel?: string;
  perUnitLabel?: string;
}

interface MusicCourse {
  id: string;
  title: string;
  instrument: string;
  thumbnail: string;
  enrolled: number;
  rating: number;
  reviewCount: number;
  ageRange: string;
  sessionDuration: string;
  format: string;
  packages: SessionPackage[];
  whatYouLearn: string[];
  requirements: string[];
  about: string;
}

interface FAQ {
  question: string;
  answer: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FSM_ACCENT = "#f06ac0";
const FSM_GRADIENT_DARK = "135deg, #3a1a2e 0%, #230f1c 100%";
const FSM_GRADIENT_LIGHT = "135deg, #ffc8ec 0%, #ff99d8 100%";

const withGST = (price: number) => Math.round(price * 1.18);

// ─── Global Course Content (same across all courses) ──────────────────────────

const COURSE_BENEFITS: string[] = [
  "Daily synopsis and session notes after every class",
  "Access to practice videos for home sessions",
  "Performance opportunity at FSM events with co-learners",
  "FSM Exams & Certification on completion",
  "Access to FSM Workshops & Masterclasses",
  "Preparation for Trinity London / ABRSM Examinations",
];

const REQ_ICONS = [Monitor, Music2] as const;

const WHY_FSM: { icon: React.ElementType; text: string }[] = [
  { icon: GraduationCap, text: "Expert certified teachers" },
  { icon: UserCheck,     text: "Personalised 1-on-1 sessions" },
  { icon: CalendarDays,  text: "Flexible online learning" },
  { icon: Users,         text: "Ages 5–75 — all welcome" },
];

// TODO(api): GET /api/faqs?category=music-course
const COURSE_FAQS: FAQ[] = [
  {
    question: "What is the FSM Buddy onboarding journey?",
    answer: "It's a quick process that helps us match you with the perfect music class based on your preferences, goals, and availability.",
  },
  {
    question: "Is the onboarding journey free?",
    answer: "Yes, the onboarding journey is completely free and takes just a few minutes.",
  },
  {
    question: "How do I choose the best music class for me?",
    answer: "The onboarding journey helps you find the most suitable course by understanding your musical goals, instrument interest, and schedule.",
  },
  {
    question: "Do you offer online music lessons?",
    answer: "Yes, FSM Buddy offers both online and offline lessons for flexibility.",
  },
  {
    question: "Can I choose private or group classes?",
    answer: "Yes, depending on your learning style, you can opt for private 1-on-1 classes or group sessions.",
  },
  {
    question: "Do you offer beginner classes?",
    answer: "Absolutely. Our beginner classes are perfect for first-time learners of any age.",
  },
];

// ─── Course Data ───────────────────────────────────────────────────────────────
// TODO(api): GET /api/music-courses/:courseId

const STD_PACKAGES: SessionPackage[] = [
  { id: "4",  sessions: 4,  price: 1999,  originalPrice: 2999,  perSession: 500 },
  { id: "8",  sessions: 8,  price: 3599,  originalPrice: 5999,  perSession: 450,  badge: "Most Popular", badgeColor: "var(--primary-400)" },
  { id: "12", sessions: 12, price: 4800,  originalPrice: 7199,  perSession: 400 },
];

const VIOLIN_PACKAGES: SessionPackage[] = [
  { id: "4",  sessions: 4,  price: 3199,  originalPrice: 4799,  perSession: 800 },
  { id: "8",  sessions: 8,  price: 5999,  originalPrice: 9599,  perSession: 750,  badge: "Most Popular", badgeColor: "var(--primary-400)" },
  { id: "12", sessions: 12, price: 4800,  originalPrice: 7199,  perSession: 400 },
];

const GROUP_PACKAGES: SessionPackage[] = [
  { id: "4",  sessions: 4,  price: 1499,  originalPrice: 2499,  perSession: 375 },
  { id: "8",  sessions: 8,  price: 2799,  originalPrice: 4499,  perSession: 350,  badge: "Most Popular", badgeColor: "var(--primary-400)" },
  { id: "12", sessions: 12, price: 3599,  originalPrice: 5999,  perSession: 300 },
];

const SELF_PACED_PACKAGE: SessionPackage[] = [
  { id: "full", sessions: 10, price: 999, originalPrice: 1999, perSession: 100, sessionsLabel: "10 Songs", perUnitLabel: "₹100/song" },
];

const MUSIC_COURSES: Record<string, MusicCourse> = {
  "piano-beginner-solo": {
    id: "piano-beginner-solo",
    title: "Piano Beginner Solo",
    instrument: "Piano",
    thumbnail: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg",
    enrolled: 1336,
    rating: 4.8,
    reviewCount: 312,
    ageRange: "5–75 yrs",
    sessionDuration: "45 min",
    format: "1-on-1 Online",
    packages: STD_PACKAGES,
    whatYouLearn: [
      "Correct posture, hand position, and finger technique",
      "Piano keyboard layout and note identification",
      "Reading sheet music — treble and bass clef basics",
      "Major scales and simple chord progressions",
      "Playing beginner songs with both hands independently",
    ],
    requirements: [
      "Access to a computer with internet connection",
      "Students need to have a Keyboard or Piano",
    ],
    about: "Learn piano from scratch with personalised 1-on-1 sessions from a certified FSM teacher. Lessons are tailored to your pace and musical goals — whether you are a child or a complete adult beginner.",
  },
  "violin-beginner-solo": {
    id: "violin-beginner-solo",
    title: "Violin Beginner Solo",
    instrument: "Violin",
    thumbnail: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634217931147_475x285.jpg",
    enrolled: 468,
    rating: 4.7,
    reviewCount: 98,
    ageRange: "10–75 yrs",
    sessionDuration: "45 min",
    format: "1-on-1 Online",
    packages: VIOLIN_PACKAGES,
    whatYouLearn: [
      "Correct posture, bow hold, and left-hand string placement",
      "Open string bowing — tone production and bow control",
      "First-position finger placement and intonation fundamentals",
      "Playing simple melodies and folk tunes",
      "Rhythm reading and basic western music notation",
    ],
    requirements: [
      "Access to a computer with internet connection",
      "Violin, good internet connection, headphones, and a tuning app",
    ],
    about: "Violin is challenging but deeply rewarding. Our certified FSM teachers guide you through correct technique from day one, building a solid foundation while you play real music you enjoy.",
  },
  "indian-vocal-beginner-solo": {
    id: "indian-vocal-beginner-solo",
    title: "Indian Vocal Beginner",
    instrument: "Indian Vocal",
    thumbnail: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg",
    enrolled: 886,
    rating: 4.8,
    reviewCount: 187,
    ageRange: "8–75 yrs",
    sessionDuration: "45 min",
    format: "1-on-1 Online",
    packages: STD_PACKAGES,
    whatYouLearn: [
      "Sargam — the 7 swaras (Sa Re Ga Ma Pa Dha Ni)",
      "Alankaar exercises for voice agility and pitch control",
      "Introduction to fundamental ragas — Yaman and Bhairavi",
      "Taal basics — Teen Taal and Dadra rhythm cycles",
      "Rendering simple light-classical and semi-classical compositions",
    ],
    requirements: [
      "Access to a computer with internet connection",
      "A quiet space for practice. No instrument required.",
    ],
    about: "Explore the richness of Indian classical and semi-classical music. Your FSM teacher customises every session around your voice type and musical background, whether you are an absolute beginner or returning to music.",
  },
  "western-vocal-beginner-solo": {
    id: "western-vocal-beginner-solo",
    title: "Western Vocal Beginner",
    instrument: "Western Vocal",
    thumbnail: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg",
    enrolled: 2070,
    rating: 4.9,
    reviewCount: 468,
    ageRange: "5–75 yrs",
    sessionDuration: "45 min",
    format: "1-on-1 Online",
    packages: STD_PACKAGES,
    whatYouLearn: [
      "Breath support, posture, and vocal warm-up routines",
      "Pitch accuracy and ear-training exercises",
      "Major and minor scales, intervals, and arpeggios",
      "Pop, musical theatre, and classical vocal techniques",
      "Performance confidence and microphone technique",
    ],
    requirements: [
      "Access to a computer with internet connection",
      "A quiet practice space. A keyboard or melodic instrument is helpful but not required.",
    ],
    about: "Find your voice with personalised Western vocal training. From beginner breath control to singing full songs with style, your FSM teacher helps you discover your sound and build real stage-ready skills.",
  },

  // ── Group Classes ─────────────────────────────────────────────────────────────
  "piano-group": {
    id: "piano-group",
    title: "Piano / Keyboard",
    instrument: "Piano",
    thumbnail: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg",
    enrolled: 840,
    rating: 4.8,
    reviewCount: 312,
    ageRange: "5–75 yrs",
    sessionDuration: "45 min",
    format: "Live Group Class",
    packages: GROUP_PACKAGES,
    whatYouLearn: [
      "Correct posture, hand position, and finger technique",
      "Piano keyboard layout and note identification",
      "Reading sheet music — treble and bass clef basics",
      "Major scales and simple chord progressions",
      "Playing beginner songs with both hands independently",
    ],
    requirements: [
      "Access to a computer with internet connection",
      "Students need to have a Keyboard or Piano",
    ],
    about: "Learn piano in a live group setting with a certified FSM teacher and fellow beginners. Group classes build accountability and community while you develop essential keyboard skills at a structured pace.",
  },
  "guitar-group": {
    id: "guitar-group",
    title: "Guitar Learning",
    instrument: "Guitar",
    thumbnail: "/guitar-course.webp",
    enrolled: 620,
    rating: 4.7,
    reviewCount: 184,
    ageRange: "8–75 yrs",
    sessionDuration: "45 min",
    format: "Live Group Class",
    packages: GROUP_PACKAGES,
    whatYouLearn: [
      "Guitar anatomy, tuning, and correct holding posture",
      "Essential open chords — C, G, D, Am, Em",
      "Strumming patterns and pick technique",
      "Smooth chord transitions and finger independence",
      "Playing complete beginner songs from start to finish",
    ],
    requirements: [
      "Access to a computer with internet connection",
      "Any acoustic or electric guitar (6-string)",
    ],
    about: "Start your guitar journey with structured group lessons led by an FSM-certified teacher. Learn alongside fellow beginners, get real-time feedback, and build the confidence to play your first full songs.",
  },
  "western-vocals-group": {
    id: "western-vocals-group",
    title: "Western Vocals",
    instrument: "Western Vocal",
    thumbnail: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg",
    enrolled: 1140,
    rating: 4.9,
    reviewCount: 468,
    ageRange: "5–75 yrs",
    sessionDuration: "45 min",
    format: "Live Group Class",
    packages: GROUP_PACKAGES,
    whatYouLearn: [
      "Breath support, posture, and vocal warm-up routines",
      "Pitch accuracy and ear-training exercises",
      "Major and minor scales, intervals, and arpeggios",
      "Pop and contemporary vocal styles and performance",
      "Microphone technique and stage presence basics",
    ],
    requirements: [
      "Access to a computer with internet connection",
      "A quiet practice space. No instrument required.",
    ],
    about: "Develop your singing voice in an energetic group environment. FSM's Western Vocals group classes blend technique with real song practice, helping you build confidence alongside fellow singers.",
  },
  "hindustani-vocals-group": {
    id: "hindustani-vocals-group",
    title: "Hindustani Vocals",
    instrument: "Hindustani Vocal",
    thumbnail: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg",
    enrolled: 710,
    rating: 4.8,
    reviewCount: 211,
    ageRange: "8–75 yrs",
    sessionDuration: "45 min",
    format: "Live Group Class",
    packages: GROUP_PACKAGES,
    whatYouLearn: [
      "Sargam — the 7 swaras (Sa Re Ga Ma Pa Dha Ni)",
      "Alankaar exercises for voice agility and pitch control",
      "Introduction to fundamental ragas — Yaman and Bhairavi",
      "Taal basics — Teen Taal and Dadra rhythm cycles",
      "Rendering simple semi-classical compositions",
    ],
    requirements: [
      "Access to a computer with internet connection",
      "A quiet space for practice. No instrument required.",
    ],
    about: "Explore Hindustani classical music with guided group instruction. Classes are structured for beginners, building discipline in riyaaz, swara accuracy, and classical foundations under teacher mentorship.",
  },

  // ── Self-Paced (Video-led) ─────────────────────────────────────────────────────
  "piano-self": {
    id: "piano-self",
    title: "Piano / Keyboard",
    instrument: "Piano",
    thumbnail: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg",
    enrolled: 1560,
    rating: 4.7,
    reviewCount: 256,
    ageRange: "5–75 yrs",
    sessionDuration: "Self-paced",
    format: "Self-Paced Video",
    packages: SELF_PACED_PACKAGE,
    whatYouLearn: [
      "Correct posture, hand position, and finger placement",
      "Reading basic sheet music and understanding rhythm",
      "Major scales, chords, and simple chord progressions",
      "Playing 10 popular beginner songs from scratch",
      "Building independence between left and right hands",
    ],
    requirements: [
      "Access to a computer or phone with internet connection",
      "A keyboard or piano to practice along with lessons",
    ],
    about: "Learn piano entirely at your own pace through structured video lessons. Progress step by step through 10 carefully chosen beginner songs, building real keyboard skills you can actually play and enjoy.",
  },
  "guitar-self": {
    id: "guitar-self",
    title: "Guitar Learning",
    instrument: "Guitar",
    thumbnail: "/guitar-course.webp",
    enrolled: 980,
    rating: 4.6,
    reviewCount: 143,
    ageRange: "8–75 yrs",
    sessionDuration: "Self-paced",
    format: "Self-Paced Video",
    packages: SELF_PACED_PACKAGE,
    whatYouLearn: [
      "Guitar setup, tuning, and correct playing posture",
      "Essential open chords — C, G, D, Am, Em, F",
      "Strumming patterns and fingerpicking basics",
      "Smooth chord transitions and rhythm accuracy",
      "Playing 10 complete songs across different styles",
    ],
    requirements: [
      "Access to a computer or phone with internet connection",
      "Any acoustic or electric guitar (6-string)",
    ],
    about: "Learn guitar on your own schedule with a step-by-step video curriculum. Each lesson builds on the last, taking you from zero to confidently playing 10 real songs across multiple genres.",
  },
  "western-vocals-self": {
    id: "western-vocals-self",
    title: "Western Vocals",
    instrument: "Western Vocal",
    thumbnail: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg",
    enrolled: 2240,
    rating: 4.8,
    reviewCount: 389,
    ageRange: "5–75 yrs",
    sessionDuration: "Self-paced",
    format: "Self-Paced Video",
    packages: SELF_PACED_PACKAGE,
    whatYouLearn: [
      "Breathing techniques and proper singing posture",
      "Pitch accuracy, scales, and ear-training basics",
      "Vocal warm-ups and tone-building exercises",
      "Contemporary singing styles — pop and light classical",
      "Performing 10 songs with controlled technique and expression",
    ],
    requirements: [
      "Access to a computer or phone with internet connection",
      "A quiet practice space. No instrument required.",
    ],
    about: "Build your singing voice at your own pace with structured video lessons designed for beginners. Progress through 10 songs while developing the breath control, pitch, and style to sing with confidence.",
  },
  "hindustani-vocals-self": {
    id: "hindustani-vocals-self",
    title: "Hindustani Vocals",
    instrument: "Hindustani Vocal",
    thumbnail: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg",
    enrolled: 890,
    rating: 4.7,
    reviewCount: 178,
    ageRange: "8–75 yrs",
    sessionDuration: "Self-paced",
    format: "Self-Paced Video",
    packages: SELF_PACED_PACKAGE,
    whatYouLearn: [
      "Sargam fundamentals — the 7 swaras at your own pace",
      "Alankaar and voice-training exercises through video",
      "Introduction to Yaman and Bhairavi ragas",
      "Taal basics — Teen Taal rhythm structure",
      "Performing 10 classical and semi-classical compositions",
    ],
    requirements: [
      "Access to a computer or phone with internet connection",
      "A quiet space for practice. No instrument required.",
    ],
    about: "Explore Hindustani classical vocal music through structured video lessons you can revisit anytime. Build swara accuracy, riyaaz discipline, and musical expression at a pace that suits your lifestyle.",
  },
};

// ─── Not Found State ──────────────────────────────────────────────────────────
function CourseNotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center" style={{ height: "100vh", gap: 16, padding: 24, fontFamily: "var(--font-family-inter)", backgroundColor: "var(--background)" }}>
      <Music2 size={48} style={{ color: "var(--muted-foreground)" }} />
      <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
        Course not found
      </span>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate(-1)}
        style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 12, backgroundColor: "var(--primary)", border: "none", cursor: "pointer", color: "var(--primary-foreground)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", fontFamily: "var(--font-family-inter)" }}
      >
        Go back
      </motion.button>
    </div>
  );
}

// ─── Session Package Card ─────────────────────────────────────────────────────
interface PackageCardProps {
  pkg: SessionPackage;
  selected: boolean;
  onSelect: () => void;
}

function PackageCard({ pkg, selected, onSelect }: PackageCardProps) {
  const pct = Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100);
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="w-full flex items-center"
      style={{
        minHeight: 64,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 12,
        paddingBottom: 12,
        gap: 12,
        borderRadius: 12,
        border: selected ? "1.5px solid var(--primary)" : "1px solid var(--border)",
        backgroundColor: selected ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "var(--card)",
        cursor: "pointer",
        textAlign: "left",
        flexShrink: 0,
      }}
    >
      {/* Radio dot */}
      <div style={{
        width: 20,
        height: 20,
        borderRadius: 9999,
        border: selected ? "6px solid var(--primary)" : "1.5px solid var(--border)",
        flexShrink: 0,
        boxSizing: "border-box",
      }} />

      {/* Left: sessions + per-session price */}
      <div className="flex flex-col flex-1" style={{ gap: 4 }}>
        <div className="flex items-center" style={{ gap: 8, flexWrap: "nowrap" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", whiteSpace: "nowrap", flexShrink: 0 }}>
            {pkg.sessionsLabel ?? `${pkg.sessions} Sessions`}
          </span>
          {pkg.badge && (
            <div style={{
              paddingLeft: 8,
              paddingRight: 8,
              height: 20,
              borderRadius: 4,
              backgroundColor: `color-mix(in srgb, ${pkg.badgeColor} 16%, transparent)`,
              border: `1px solid color-mix(in srgb, ${pkg.badgeColor} 36%, transparent)`,
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", color: pkg.badgeColor, whiteSpace: "nowrap" }}>
                {pkg.badge}
              </span>
            </div>
          )}
        </div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
          {pkg.perUnitLabel ?? `₹${pkg.perSession.toLocaleString("en-IN")}/session`}
        </span>
      </div>

      {/* Right: total price */}
      <div className="flex flex-col items-end" style={{ gap: 2, flexShrink: 0 }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: selected ? "var(--primary-300)" : "var(--foreground)" }}>
          ₹{withGST(pkg.price).toLocaleString("en-IN")}
        </span>
        <div className="flex items-center" style={{ gap: 4 }}>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
            ₹{withGST(pkg.originalPrice).toLocaleString("en-IN")}
          </span>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--success-500)", fontWeight: "var(--font-weight-semibold)" }}>
            {pct}% off
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Stat Cell ────────────────────────────────────────────────────────────────
interface StatCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
  isLast?: boolean;
}

function StatCell({ icon, label, value, accentColor, isLast }: StatCellProps) {
  return (
    <div
      className="flex flex-col items-center flex-1"
      style={{
        padding: "16px 8px",
        gap: 4,
        borderRight: isLast ? "none" : "1px solid color-mix(in srgb, var(--border) 50%, transparent)",
      }}
    >
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 9999,
        backgroundColor: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", textAlign: "center", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
interface FAQItemProps { item: FAQ; isLast: boolean; }

function FAQItem({ item, isLast }: FAQItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex flex-col"
        style={{
          paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16,
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", flex: 1, textAlign: "left" }}>
            {item.question}
          </span>
          <div style={{ flexShrink: 0 }}>
            {open
              ? <Minus size={16} style={{ color: "var(--muted-foreground)" }} />
              : <Plus size={16} style={{ color: "var(--muted-foreground)" }} />
            }
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <span style={{ display: "block", marginTop: 8, fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.55, textAlign: "left" }}>
                {item.answer}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      {!isLast && <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 16 }} />}
    </div>
  );
}

// ─── Batch Slot Picker (Live Group only) ─────────────────────────────────────

interface BatchSlot {
  id: string;
  day: "Mon" | "Wed" | "Fri";
  time: string;
  period: "am" | "pm";
  seatsLeft: number;
}

// TODO(api): GET /api/music-courses/:courseId/batches
const BATCH_SLOTS: BatchSlot[] = [
  { id: "mon-am", day: "Mon", time: "10–11 am", period: "am", seatsLeft: 8 },
  { id: "mon-pm", day: "Mon", time: "5–6 pm",  period: "pm", seatsLeft: 4 },
  { id: "wed-am", day: "Wed", time: "10–11 am", period: "am", seatsLeft: 6 },
  { id: "wed-pm", day: "Wed", time: "5–6 pm",  period: "pm", seatsLeft: 2 },
  { id: "fri-am", day: "Fri", time: "10–11 am", period: "am", seatsLeft: 10 },
  { id: "fri-pm", day: "Fri", time: "5–6 pm",  period: "pm", seatsLeft: 1 },
];

// ─── Contact details (collected before checkout) ──────────────────────────────

interface ContactDetails {
  name: string;
  mobile: string;
  email: string;
}

// TODO(api): GET /api/me — prefill from logged-in user profile
const DUMMY_USER_PROFILE = {
  name: "Aarav Sharma",
  mobile: "9876543210",
  email: "",
};

const isValidMobile = (v: string) => /^\d{10}$/.test(v.trim());
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface BookingSheetProps {
  open: boolean;
  onClose: () => void;
  requiresSlot: boolean;
  onConfirm: (data: { slot: BatchSlot | null; contact: ContactDetails }) => void;
}

function BookingSheet({ open, onClose, requiresSlot, onConfirm }: BookingSheetProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactDetails>({
    name: DUMMY_USER_PROFILE.name,
    mobile: DUMMY_USER_PROFILE.mobile,
    email: DUMMY_USER_PROFILE.email,
  });
  const [touched, setTouched] = useState<{ slot?: boolean; name?: boolean; mobile?: boolean; email?: boolean }>({});

  const selected = BATCH_SLOTS.find((s) => s.id === selectedId) ?? null;

  const slotError = requiresSlot && !selected ? "Please pick a weekly slot" : "";
  const nameError = !contact.name.trim() ? "Please enter your name" : "";
  const mobileError = !isValidMobile(contact.mobile) ? "Enter a 10-digit mobile number" : "";
  const emailError = !isValidEmail(contact.email) ? "Enter a valid email address" : "";
  const formValid = !slotError && !nameError && !mobileError && !emailError;

  const handleClose = () => {
    onClose();
    setTimeout(() => setTouched({}), 200);
  };

  const handleSubmit = () => {
    setTouched({ slot: true, name: true, mobile: true, email: true });
    if (!formValid) return;
    onConfirm({ slot: selected, contact });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="booking-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0"
            style={{ backgroundColor: "var(--overlay-heavy)", zIndex: 300 }}
          />
          <motion.div
            key="booking-sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed bottom-0 left-0 right-0"
            style={{
              backgroundColor: "var(--card)",
              borderRadius: "20px 20px 0 0",
              zIndex: 301,
              boxShadow: "0 -8px 40px color-mix(in srgb, var(--foreground) 24%, transparent)",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ gap: 12, padding: "20px 20px 12px" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", margin: 0, flex: 1 }}>
                {requiresSlot ? "Book your class" : "Confirm your details"}
              </h3>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleClose}
                aria-label="Close"
                className="flex items-center justify-center shrink-0"
                style={{ width: 32, height: 32, border: "none", cursor: "pointer", background: "transparent" }}
              >
                <X size={20} style={{ color: "var(--muted-foreground)" }} />
              </motion.button>
            </div>

            {/* Body */}
            <div style={{ padding: "4px 20px 20px", overflowY: "auto", flex: 1 }}>
              {/* Slot section — hidden for Solo / Self-Paced */}
              {requiresSlot && (
                <div className="flex flex-col" style={{ gap: 8, marginBottom: 20 }}>
                  <div className="flex items-baseline justify-between">
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)" }}>
                      Class slot
                    </span>
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                      Repeats weekly
                    </span>
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                    {BATCH_SLOTS.map((slot) => {
                      const active = selectedId === slot.id;
                      const PeriodIcon = slot.period === "am" ? Sun : Sunset;
                      return (
                        <motion.button
                          key={slot.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setSelectedId(slot.id);
                            setTouched((t) => ({ ...t, slot: true }));
                          }}
                          className="flex items-center justify-between"
                          style={{
                            padding: "0 12px",
                            height: 52,
                            borderRadius: 12,
                            border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                            backgroundColor: active
                              ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                              : "var(--secondary)",
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily: "inherit",
                          }}
                        >
                          <div className="flex flex-col" style={{ gap: 2 }}>
                            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: active ? "var(--primary)" : "var(--foreground)", letterSpacing: 0.4 }}>
                              {slot.day}
                            </span>
                            <span style={{ fontSize: "var(--text-xs)", color: active ? "var(--primary)" : "var(--muted-foreground)" }}>
                              {slot.time}
                            </span>
                          </div>
                          <PeriodIcon size={14} style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }} />
                        </motion.button>
                      );
                    })}
                  </div>
                  {touched.slot && slotError && (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--destructive)" }}>{slotError}</span>
                  )}
                </div>
              )}

              {/* Contact section */}
              <div className="flex flex-col" style={{ gap: 12 }}>
                {requiresSlot && (
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)" }}>
                    Contact details
                  </span>
                )}
                <BookingField
                  icon={<User size={16} style={{ color: "var(--muted-foreground)" }} />}
                  label="Full name"
                  value={contact.name}
                  onChange={(v) => setContact((c) => ({ ...c, name: v }))}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  error={touched.name ? nameError : ""}
                  placeholder="Aarav Sharma"
                  autoComplete="name"
                />
                <BookingField
                  icon={<Phone size={16} style={{ color: "var(--muted-foreground)" }} />}
                  label="Mobile number"
                  value={contact.mobile}
                  onChange={(v) => setContact((c) => ({ ...c, mobile: v.replace(/\D/g, "").slice(0, 10) }))}
                  onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
                  error={touched.mobile ? mobileError : ""}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  autoComplete="tel"
                />
                <BookingField
                  icon={<Mail size={16} style={{ color: "var(--muted-foreground)" }} />}
                  label="Email"
                  value={contact.email}
                  onChange={(v) => setContact((c) => ({ ...c, email: v }))}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  error={touched.email ? emailError : ""}
                  placeholder="you@example.com"
                  inputMode="email"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Sticky CTA */}
            <div style={{ padding: "12px 20px 24px", borderTop: "1px solid var(--border)" }}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                style={{
                  width: "100%", height: 48, borderRadius: 12, border: "none",
                  cursor: "pointer",
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                  fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", fontFamily: "inherit",
                }}
              >
                Continue to Payment
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface BookingFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "email";
  autoComplete?: string;
}

function BookingField({ icon, label, value, onChange, onBlur, error, placeholder, inputMode, autoComplete }: BookingFieldProps) {
  const hasError = !!error;
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <label
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--muted-foreground)",
        }}
      >
        {label}
      </label>
      <div
        className="flex items-center"
        style={{
          gap: 8,
          height: 48,
          padding: "0 12px",
          borderRadius: 12,
          border: hasError ? "1.5px solid var(--destructive)" : "1px solid var(--border)",
          backgroundColor: "var(--secondary)",
        }}
      >
        {icon}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          style={{
            flex: 1,
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--foreground)",
            fontSize: "var(--text-sm)",
            fontFamily: "inherit",
          }}
        />
      </div>
      {hasError && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--destructive)" }}>{error}</span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const { courseId = "" } = useParams<{ courseId: string }>();
  const course = MUSIC_COURSES[courseId];

  const { theme } = useTheme();
  const [selectedPkgId, setSelectedPkgId] = useState("8");
  const [wishlisted, setWishlisted] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  if (!course) return <CourseNotFound />;

  const selectedPkg = course.packages.find((p) => p.id === selectedPkgId) ?? course.packages[0];
  const discountPct = Math.round(((selectedPkg.originalPrice - selectedPkg.price) / selectedPkg.originalPrice) * 100);
  const isLiveGroup = course.format === "Live Group Class";

  const handleBookNow = () => {
    setBookingOpen(true);
  };

  const handleBookingConfirm = ({ slot, contact }: { slot: BatchSlot | null; contact: ContactDetails }) => {
    setBookingOpen(false);
    navigate("/marketplace/order-confirm", {
      state: {
        courseId: course.id,
        packageId: selectedPkg.id,
        ...(slot ? { slotId: slot.id, slotLabel: `${slot.day}, ${slot.time}` } : {}),
        contact,
      },
    });
  };

  return (
    <div
      className="flex flex-col"
      style={{ fontFamily: "var(--font-family-inter)", backgroundColor: "var(--background)", height: "100vh", overflow: "hidden", position: "relative" }}
    >
      {/* Floating close — overlay on the hero image, top-right */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate(-1)}
        aria-label="Close"
        style={{
          position: "absolute", top: 52, right: 12, zIndex: 50,
          width: 36, height: 36, borderRadius: 9999, border: "none",
          backgroundColor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
      >
        <X style={{ width: 20, height: 20, color: "#fff", strokeWidth: 2 }} />
      </motion.button>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {/* Hero image — full-bleed from the top of the viewport.
            Aspect ratio 3:2 matches the card so the morph grows the same image
            uniformly with no re-crop or stretch. */}
        <div style={{ width: "100%", aspectRatio: "3 / 2", position: "relative", overflow: "hidden", backgroundColor: "var(--surface-2)", flexShrink: 0 }}>
          {!imgFailed ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex items-center justify-center" style={{ width: "100%", height: "100%", background: `linear-gradient(${theme === "dark" ? FSM_GRADIENT_DARK : FSM_GRADIENT_LIGHT})` }}>
              <Music2 size={56} style={{ color: FSM_ACCENT, opacity: 0.8 }} />
            </div>
          )}
          {/* Status bar legibility gradient */}
          <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 96, background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 60%, transparent 100%)", pointerEvents: "none" }} />
          {/* Status bar overlay */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, pointerEvents: "none" }}>
            <StatusBar />
          </div>
          {/* Bottom legibility gradient for the school badge */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(0deg, rgba(0,0,0,0.72) 0%, transparent 100%)" }} />
          {/* School badge */}
          <div
            className="flex items-center"
            style={{
              position: "absolute", bottom: 12, left: 12,
              paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 4,
              backgroundColor: "rgba(0,0,0,0.72)", border: "1.5px solid rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", color: "rgba(255,255,255,0.9)", letterSpacing: 0.4 }}>
              Furtados School of Music
            </span>
          </div>
          {/* Wishlist — bottom-right */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setWishlisted((w) => !w)}
            aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            style={{
              position: "absolute", bottom: 12, right: 12, zIndex: 4,
              width: 36, height: 36, borderRadius: 9999, border: "none",
              backgroundColor: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <Heart size={18} style={{ color: wishlisted ? "var(--error-500)" : "#fff" }} fill={wishlisted ? "var(--error-500)" : "none"} />
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex flex-col" style={{ padding: 16, gap: 16 }}>

          {/* Title + rating row */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", lineHeight: 1.4 }}>
              {course.title}
            </h1>

            {/* Format badge */}
            {course.format === "Live Group Class" ? (
              <div className="flex items-center" style={{ gap: 6, alignSelf: "flex-start", paddingLeft: 8, paddingRight: 10, height: 24, borderRadius: 6, backgroundColor: "color-mix(in srgb, var(--success-500) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--success-500) 28%, transparent)" }}>
                <Users size={12} style={{ color: "var(--success-500)", flexShrink: 0 }} />
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--success-500)", whiteSpace: "nowrap" }}>Live Group Class</span>
              </div>
            ) : course.format === "Self-Paced Video" ? (
              <div className="flex items-center" style={{ gap: 6, alignSelf: "flex-start", paddingLeft: 8, paddingRight: 10, height: 24, borderRadius: 6, backgroundColor: "color-mix(in srgb, var(--primary-400) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--primary-400) 28%, transparent)" }}>
                <Video size={12} style={{ color: "var(--primary-400)", flexShrink: 0 }} />
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary-400)", whiteSpace: "nowrap" }}>Self-Paced Video</span>
              </div>
            ) : null}

            <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
              <div className="flex items-center" style={{ gap: 4 }}>
                <Star size={13} fill="var(--warning-500)" style={{ color: "var(--warning-500)" }} />
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>{course.rating}</span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>({course.reviewCount.toLocaleString("en-IN")} reviews)</span>
              </div>
              <div style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: "var(--border)" }} />
              <div className="flex items-center" style={{ gap: 4 }}>
                <Users size={12} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{course.enrolled.toLocaleString("en-IN")} enrolled</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center" style={{ borderRadius: 12, backgroundColor: "var(--card)", overflow: "hidden" }}>
            <StatCell icon={<Users size={16} style={{ color: "var(--primary-400)" }} />} label="Ages" value={course.ageRange} accentColor="var(--primary-400)" />
            <StatCell icon={<Clock size={16} style={{ color: "var(--warning-500)" }} />} label="Duration" value={course.sessionDuration} accentColor="var(--warning-500)" />
            <StatCell icon={<Video size={16} style={{ color: "var(--success-500)" }} />} label="Format" value={course.format} accentColor="var(--success-500)" isLast />
          </div>

          {/* Session package selector — only shown when there are multiple packages to choose */}
          {course.packages.length > 1 && (
            <>
              <div style={{ height: 1, backgroundColor: "var(--border)" }} />
              <div className="flex flex-col" style={{ gap: 12 }}>
                <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
                  Choose your package
                </span>
                <div className="flex flex-col" style={{ gap: 12 }}>
                  {course.packages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      selected={selectedPkgId === pkg.id}
                      onSelect={() => setSelectedPkgId(pkg.id)}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                  All prices include 18% GST. Sessions valid for 6 months from purchase.
                </span>
              </div>
              <div style={{ height: 1, backgroundColor: "var(--border)" }} />
            </>
          )}

          {/* What you'll learn */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              What you'll learn
            </span>
            <div style={{ borderRadius: 12, backgroundColor: "var(--card)", padding: 16 }}>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {course.whatYouLearn.map((point, idx) => (
                  <div key={idx} className="flex items-start" style={{ gap: 8 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 9999, flexShrink: 0,
                      backgroundColor: "color-mix(in srgb, var(--success-500) 16%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--success-500) 32%, transparent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Check size={10} style={{ color: "var(--success-500)", strokeWidth: 3 }} />
                    </div>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--secondary-foreground)", lineHeight: 1.55, flex: 1 }}>
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--border)" }} />

          {/* Requirements */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              Requirements
            </span>
            <div style={{ borderRadius: 12, backgroundColor: "var(--card)", overflow: "hidden" }}>
              {course.requirements.map((req, idx) => {
                const ReqIcon = REQ_ICONS[idx] ?? Monitor;
                return (
                  <div key={idx}>
                    <div className="flex items-start" style={{ gap: 16, paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16 }}>
                      <ReqIcon size={20} style={{ color: "var(--muted-foreground)", flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.5 }}>{req}</span>
                    </div>
                    {idx < course.requirements.length - 1 && (
                      <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 52 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--border)" }} />

          {/* Benefits */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              Benefits
            </span>
            <div style={{ borderRadius: 12, backgroundColor: "var(--card)", padding: 16 }}>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {COURSE_BENEFITS.map((benefit, idx) => (
                  <div key={idx} className="flex items-start" style={{ gap: 8 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 9999, flexShrink: 0,
                      backgroundColor: "color-mix(in srgb, var(--warning-500) 16%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--warning-500) 32%, transparent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Check size={10} style={{ color: "var(--warning-500)", strokeWidth: 3 }} />
                    </div>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--secondary-foreground)", lineHeight: 1.55, flex: 1 }}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--border)" }} />

          {/* About this course */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              About this course
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--secondary-foreground)", lineHeight: 1.6 }}>
              {course.about}
            </span>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--border)" }} />

          {/* About FSM */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              About Furtados School of Music
            </span>
            <div className="flex items-center" style={{ gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 9999, overflow: "hidden", flexShrink: 0, backgroundColor: "var(--surface-2)" }}>
                <img
                  src="https://dpxj62pj1f2st.cloudfront.net/production/teacher/images/1601557463300.jpg"
                  alt="FSM Teacher"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div className="flex flex-col" style={{ gap: 2 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                  Furtados School of Music
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  FSM Certified Teacher
                </span>
              </div>
            </div>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--secondary-foreground)", lineHeight: 1.6 }}>
              Furtados School of Music (FSM) is a name synonymous with music education in India. Since 2011, FSM has grown to 180+ school and non-school centres, imparting music education to over 75,000 students. FSM teachers are certified through rigorous exams and their classes are continuously monitored by a Q&A team and panel of coaches to ensure quality.
            </span>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--border)" }} />

          {/* Why FSM Buddy */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              Why FSM Buddy?
            </span>
            <div style={{ borderRadius: 12, backgroundColor: "var(--card)", overflow: "hidden" }}>
              {WHY_FSM.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx}>
                    <div className="flex items-start" style={{ gap: 16, paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={16} style={{ color: "var(--muted-foreground)" }} />
                      </div>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.5, flex: 1, marginTop: 8 }}>
                        {item.text}
                      </span>
                    </div>
                    {idx < WHY_FSM.length - 1 && (
                      <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 64 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--border)" }} />

          {/* FAQ */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
              Frequently Asked Questions
            </span>
            <div style={{ borderRadius: 12, backgroundColor: "var(--card)", overflow: "hidden" }}>
              {COURSE_FAQS.map((faq, idx) => (
                <FAQItem key={idx} item={faq} isLast={idx === COURSE_FAQS.length - 1} />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Sticky bottom bar */}
      <div
        className="flex items-center"
        style={{
          height: 80,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 12,
          paddingBottom: 16,
          backgroundColor: "var(--card)",
          borderTop: "1px solid var(--border)",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div className="flex flex-col flex-1" style={{ gap: 4 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
              ₹{withGST(selectedPkg.price).toLocaleString("en-IN")}
            </span>
            <div
              className="flex items-center justify-center"
              style={{
                paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 4,
                backgroundColor: "color-mix(in srgb, var(--warning-500) 14%, transparent)",
                border: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--warning-500)", whiteSpace: "nowrap" }}>
                {discountPct}% off
              </span>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: 4 }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
              ₹{withGST(selectedPkg.originalPrice).toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
              · {selectedPkg.sessionsLabel ?? `${selectedPkg.sessions} sessions`}
            </span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleBookNow}
          className="flex items-center justify-center"
          style={{
            height: 48,
            paddingLeft: 32,
            paddingRight: 32,
            borderRadius: 12,
            backgroundColor: "var(--primary)",
            border: "none",
            cursor: "pointer",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--primary-foreground)",
            fontFamily: "var(--font-family-inter)",
            flexShrink: 0,
          }}
        >
          Book Now
        </motion.button>
      </div>

      <BookingSheet
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        requiresSlot={isLiveGroup}
        onConfirm={handleBookingConfirm}
      />
    </div>
  );
}
