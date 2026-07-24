/**
 * Marketplace Home — v1 design language × complete inventory
 *
 * Combines marketplace-v1's premium design DNA (glass banner, multi-stop shadows,
 * brand-tinted hairlines, PremiumThumbCard with synthesized brand-letter glyph)
 * with marketplace-home's full content surface (12+ sections, search, categories,
 * sticky collapse-on-scroll header, age filter).
 *
 * Card variants
 *   - PremiumThumbCard       — synth brand-letter cards (Test Prep · Top Courses · Crash · Mock Tests · Apps)
 *   - PremiumPhotoCard       — photo-based cards (Flash Deals · Books · Music · Skill · Lab Kits · Summer Camp · Browse)
 *   - PremiumPhotoGridCard   — 2-col photo grid variant for Browse All
 *   - PartnerAppTile         — square-logo tile for partner apps
 *   - CategoryTile           — round-tile for "Shop by Category"
 */

import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  Search, ShoppingCart, Heart, Star, ChevronRight,
  GraduationCap, BookOpen, ClipboardList, PenLine,
  Lightbulb, FlaskConical, LayoutGrid,
  Trophy, Music2, Users, Video, Mic, Check,
  Sparkles, Backpack, Briefcase, Baby, Target,
  Gamepad2, Brain, Zap, Monitor,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar } from "../shared/premium-ui";
import {
  DUMMY_OTHER_COURSES,
  DUMMY_SUMMER_CAMP_BATCHES,
  DUMMY_SUMMER_CAMP_SHARED,
  DUMMY_CRASH_COURSE_INFO,
  type OtherCourse,
  type SummerCampBatch,
} from "../shared/classroom-catalog";
import { ProductImageFallback, discountPct, formatCount } from "./marketplace-shared";
import { useTheme } from "../app/contexts/theme-context";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgeFilterId = "all" | "primary" | "secondary" | "class_1112" | "college" | "exam_prep";

export interface AgeFilter {
  id: AgeFilterId;
  label: string;
  Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
}

export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  categoryId: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  isDigital: boolean;
  thumbImage: string;
}

export interface MockTest {
  id: string;
  title: string;
  examLabel: string;
  examAbbr: string;
  testCount: number;
  questionCount: number;
  price: number;
  originalPrice: number;
  accentColor: string;
  // Optional Test Series fields — let cards convey pack variation + substance
  minCount?: number;       // smallest plan tier
  maxCount?: number;       // largest plan tier
  packCount?: number;      // number of plan tiers (Starter/Standard/Complete = 3)
  priceFrom?: number;      // entry tier price — used internally for OFF % only, never rendered on card
  pattern?: string;        // exam pattern accuracy signal ("NTA Pattern", "IIT Pattern" etc)
}

export interface Category {
  id: string;
  label: string;
  path: string;
  Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
  accent: string;
}

export interface PartnerApp {
  id: string;
  name: string;
  initials: string;
  logoUrls: string[];
  accentColor: string;
}

// ─── Age filters ──────────────────────────────────────────────────────────────

const AGE_FILTERS: AgeFilter[] = [
  { id: "all",         label: "For You",      Icon: Sparkles },
  { id: "primary",     label: "Class 1–5",    Icon: Baby },
  { id: "secondary",   label: "Class 6–10",   Icon: Backpack },
  { id: "class_1112",  label: "Class 11–12",  Icon: GraduationCap },
  { id: "college",     label: "College",      Icon: Briefcase },
  { id: "exam_prep",   label: "Competitive",  Icon: Target },
];

// ─── Categories (aligned with real route pages) ───────────────────────────────

const CATEGORIES: Category[] = [
  { id: "courses",        label: "Courses",     path: "/marketplace/category/courses",        Icon: GraduationCap, accent: "#4a9eff" },
  { id: "mock-tests",     label: "Mock Tests",  path: "/marketplace/category/mock-tests",     Icon: ClipboardList, accent: "#bf6fff" },
  { id: "books",          label: "Books",       path: "/marketplace/category/books",          Icon: BookOpen,      accent: "#ffa84a" },
  { id: "stationery",     label: "Stationery",  path: "/marketplace/category/stationery",     Icon: PenLine,       accent: "#4ad4ff" },
  { id: "music",          label: "Music",       path: "/marketplace/category/music",          Icon: Music2,        accent: "#f06ac0" },
  { id: "skill-courses",  label: "Skills",      path: "/marketplace/category/skill-courses",  Icon: Lightbulb,     accent: "#ffd94a" },
  { id: "lab-kits",       label: "Lab Kits",    path: "/marketplace/category/lab-kits",       Icon: FlaskConical,  accent: "#ff6b6b" },
  { id: "olympiad",       label: "Olympiad",    path: "/marketplace/category/olympiad",       Icon: Trophy,        accent: "#ffb830" },
  { id: "apps",           label: "Apps",        path: "/marketplace/apps",                    Icon: LayoutGrid,    accent: "#4affdd" },
];

// ─── Partner brand marks ──────────────────────────────────────────────────────
// Used in banner tiles in place of generic Lucide icons. FSM + OLL render as
// styled wordmarks (no logo files yet); Express has a real .webp asset in
// /public so we render it as an image.
// TODO(assets): replace FSM/OLL wordmarks with official logo SVGs once
// partner asset packs arrive.

function FSMMark(_props: { style?: React.CSSProperties }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 900, letterSpacing: 0.6,
      color: "#fff", lineHeight: 1,
      fontFamily: "Georgia, serif",
    }}>
      FSM
    </span>
  );
}

function OLLMark(_props: { style?: React.CSSProperties }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 900, letterSpacing: 0.4,
      color: "#fff", lineHeight: 1,
    }}>
      OLL
    </span>
  );
}

function ExpressMark(_props: { style?: React.CSSProperties }) {
  return (
    <img
      src="/express-logo.webp"
      alt="Express"
      style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 4 }}
    />
  );
}

// ─── Banner data (premium glass treatment, v1-style) ──────────────────────────

interface Banner {
  id: string;
  eyebrow: string;
  category: string;
  title: string;
  subtitle: string;
  accent: string;
  Icon: React.ComponentType<{ style?: React.CSSProperties; width?: number | string; height?: number | string }>;
  appName: string;
  appTagline: string;
  cta: string;
  path?: string;
  scrollTo?: string;
}

// AntD-aligned design tokens used by the banner palette. Each banner picks a
// distinct AntD color family — no two banners share. Hex values mirror the
// CSS vars in theme.css; treat as design-system constants, not raw colors.
// In production these should be read via getComputedStyle(var(--token-name)).
const TOKENS = {
  warning500:  '#faad14', // --warning-500    (gold-6)     · Test Prep
  magenta500:  '#eb2f96', // --magenta-500    (magenta-6)  · Music
  purple500:   '#a855f7', // --purple-500                  · AI Camp / OLL
  success500:  '#52c41a', // --success-500    (green-6)    · Crash Course
  geekblue500: '#597ef7', // --geekblue-500   (geekblue-5) · Vocabulary
  volcano500:  '#fa541c', // --volcano-500    (volcano-6)  · Games
  teal500:     '#13c2c2', // --teal-500 (AntD cyan-6)      · Express
  error500:    '#ff4d4f', // --error-500      (red-5)      · Test Series
  lime500:     '#a0d911', // --lime-500       (lime-6)     · Primebook
} as const;

// TODO(api): GET /api/marketplace/banners
// Each banner is a "Today's Pick"-style hero card mapped 1:1 to a marketplace
// rail. Accent color picked from a distinct AntD family per banner.
// Order follows Sagar's spec: TestPrep · Music · AI Camp · Crash · Vocab ·
// Games · Express · Test Series · Learning Device.
const DUMMY_BANNERS: Banner[] = [
  {
    id: "b1",
    eyebrow: "TODAY'S PICK",
    category: "Test Prep",
    title: "Prepare for CAT in 3 months",
    subtitle: "Structured prep · Live classes · Expert educators",
    accent: TOKENS.warning500,                      // AntD gold
    Icon: BookOpen,
    appName: "CAT Complete Prep",
    appTagline: "QA · VARC · DILR",
    cta: "View Plans",
    scrollTo: "section-test-prep",
  },
  {
    id: "b2",
    eyebrow: "NEW",
    category: "Music",
    title: "Music with India's Top School",
    subtitle: "Live group classes · Self-paced lessons · Furtados",
    accent: TOKENS.magenta500,                      // AntD magenta
    Icon: FSMMark,
    appName: "Furtados School of Music",
    appTagline: "Piano · Guitar · Vocals",
    cta: "Browse",
    scrollTo: "section-music",
  },
  {
    id: "b3",
    eyebrow: "TODAY'S PICK",
    category: "Courses",
    title: "AI Summer Camp by OLL",
    subtitle: "Live cohorts · Project-based · Expert mentors",
    accent: TOKENS.purple500,                       // AntD purple
    Icon: OLLMark,
    appName: "Teachmint OLL",
    appTagline: "Summer Camps · Ages 11–17",
    cta: "Explore",
    scrollTo: "section-ai-summer-camp",
  },
  {
    id: "b4",
    eyebrow: "SUMMER PICK",
    category: "Crash Course",
    title: "Summer Crash for Class 6–12",
    subtitle: "Step-by-step · Maths · Science · PCM · PCB · 15 days",
    accent: TOKENS.success500,                      // AntD green
    Icon: Zap,
    appName: "Summer Crash Course",
    appTagline: "Live classes + Recordings",
    cta: "Explore",
    scrollTo: "section-crash-courses",
  },
  {
    id: "b5",
    eyebrow: "NEW PARTNER",
    category: "Vocabulary",
    title: "Master vocabulary fast",
    subtitle: "Keyword + memory link · AI scenes · Spaced repetition",
    accent: TOKENS.geekblue500,                     // AntD geekblue
    Icon: Brain,
    appName: "VocabularyFast",
    appTagline: "School · CAT · GRE · SAT",
    cta: "Try Free",
    scrollTo: "section-vocab",
  },
  {
    id: "b6",
    eyebrow: "PLAY & LEARN",
    category: "Games",
    title: "Learning that feels like play",
    subtitle: "Math · Science · English · Class 1–8 · One round free",
    accent: TOKENS.volcano500,                      // AntD volcano
    Icon: Gamepad2,
    appName: "PrepMaster Games",
    appTagline: "9 games · One pass · ₹199 / 3 months",
    cta: "Try Free",
    scrollTo: "section-games",
  },
  {
    id: "b7",
    eyebrow: "FEATURED",
    category: "Learning Apps",
    title: "Express – AI English Coach",
    subtitle: "200+ topics · Speaking practice · Live feedback",
    accent: TOKENS.teal500,                         // AntD cyan-6 (true cyan, #13c2c2)
    Icon: ExpressMark,
    appName: "Express by Teachmint",
    appTagline: "AI Coach · Practice English",
    cta: "Try Now",
    scrollTo: "section-english-coach",
  },
  {
    id: "b8",
    eyebrow: "BESTSELLER",
    category: "Test Series",
    title: "Mock Test Series 2026",
    subtitle: "Real test UI · PYQs · Mock tests · Analytics",
    accent: TOKENS.error500,                        // AntD red
    Icon: ClipboardList,
    appName: "Test Series",
    appTagline: "JEE Main · JEE Advanced · NEET",
    cta: "Explore",
    scrollTo: "section-test-series-engineering",
  },
  {
    id: "b9",
    eyebrow: "LEARNING DEVICE",
    category: "Primebook",
    title: "Laptops built for students",
    subtitle: "Lowest price online · Android PrimeOS · WiFi + 4G",
    accent: TOKENS.lime500,                         // AntD lime
    Icon: Monitor,
    appName: "Primebook",
    appTagline: "Neo · Pro · Max",
    cta: "Shop",
    scrollTo: "section-primebook",
  },
];

// ─── Music data ───────────────────────────────────────────────────────────────

// TODO(api): GET /api/marketplace/music-courses
const DUMMY_MUSIC_COURSES: Product[] = [
  { id: "piano-group",             title: "Piano / Keyboard",  subtitle: "Live Group Class · 4–12 Sessions", categoryId: "music", price: 1499, originalPrice: 2499, rating: 4.8, reviewCount: 312, isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg" },
  { id: "guitar-group",            title: "Guitar Learning",   subtitle: "Live Group Class · 4–12 Sessions", categoryId: "music", price: 1499, originalPrice: 2499, rating: 4.7, reviewCount: 184, isDigital: true, thumbImage: "/guitar-course.webp" },
  { id: "western-vocals-group",    title: "Western Vocals",    subtitle: "Live Group Class · 4–12 Sessions", categoryId: "music", price: 1499, originalPrice: 2499, rating: 4.9, reviewCount: 468, isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg" },
  { id: "hindustani-vocals-group", title: "Hindustani Vocals", subtitle: "Live Group Class · 4–12 Sessions", categoryId: "music", price: 1499, originalPrice: 2499, rating: 4.8, reviewCount: 211, isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg" },
  { id: "piano-self",              title: "Piano / Keyboard",  subtitle: "Self-Paced Video · 10 Songs",       categoryId: "music", price: 999,  originalPrice: 1999, rating: 4.7, reviewCount: 256, isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg" },
  { id: "guitar-self",             title: "Guitar Learning",   subtitle: "Self-Paced Video · 10 Songs",       categoryId: "music", price: 999,  originalPrice: 1999, rating: 4.6, reviewCount: 143, isDigital: true, thumbImage: "/guitar-course.webp" },
  { id: "western-vocals-self",     title: "Western Vocals",    subtitle: "Self-Paced Video · 10 Songs",       categoryId: "music", price: 999,  originalPrice: 1999, rating: 4.8, reviewCount: 389, isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg" },
  { id: "hindustani-vocals-self",  title: "Hindustani Vocals", subtitle: "Self-Paced Video · 10 Songs",       categoryId: "music", price: 999,  originalPrice: 1999, rating: 4.7, reviewCount: 178, isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg" },
];

// ─── Flash deals / best sellers / browse / books / partner apps / mock / skill / lab ──

// TODO(api): GET /api/marketplace/flash-deals
const DUMMY_FLASH_DEALS: Product[] = [
  { id: "fd1", title: "HC Verma Vol. 1",        subtitle: "Concepts of Physics",  categoryId: "books",       price: 280,  originalPrice: 450,   rating: 4.8, reviewCount: 12400, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=320&h=240&fit=crop" },
  { id: "fd2", title: "HC Verma Vol. 2",        subtitle: "Concepts of Physics",  categoryId: "books",       price: 275,  originalPrice: 420,   rating: 4.7, reviewCount: 9800,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=320&h=240&fit=crop" },
  { id: "fd3", title: "NCERT Biology XII",      subtitle: "Class 12 Textbook",    categoryId: "books",       price: 120,  originalPrice: 180,   rating: 4.6, reviewCount: 8200,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=320&h=240&fit=crop" },
  { id: "fd4", title: "JEE Crash Course",       subtitle: "60 hours · All subjects", categoryId: "courses",  price: 999,  originalPrice: 2499,  rating: 4.9, reviewCount: 3200,  isDigital: true,  thumbImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=320&h=240&fit=crop" },
  { id: "fd5", title: "Classmate Notebook Pack",subtitle: "6-in-1 · 172 pages each", categoryId: "stationery", price: 180,  originalPrice: 280, rating: 4.4, reviewCount: 5600, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=320&h=240&fit=crop" },
  { id: "fd6", title: "Staedtler Geometry Box", subtitle: "Full set · Pro grade", categoryId: "stationery",  price: 220,  originalPrice: 380,   rating: 4.5, reviewCount: 3400,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=320&h=240&fit=crop" },
];

// TODO(api): GET /api/marketplace/best-sellers
const DUMMY_BEST_SELLERS: Product[] = [
  { id: "bs1", title: "NCERT Chemistry XII", subtitle: "Class 12 Textbook",          categoryId: "books",      price: 115,  originalPrice: 160,  rating: 4.7, reviewCount: 11000, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=320&h=240&fit=crop" },
  { id: "bs2", title: "NEET Biology Master", subtitle: "1500+ practice questions",   categoryId: "mock-tests", price: 699,  originalPrice: 999,  rating: 4.8, reviewCount: 2800,  isDigital: true,  thumbImage: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=320&h=240&fit=crop" },
  { id: "bs3", title: "Casio FX-991EX",      subtitle: "Scientific calculator",      categoryId: "stationery", price: 1250, originalPrice: 1600, rating: 4.9, reviewCount: 7800,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=320&h=240&fit=crop" },
  { id: "bs4", title: "Wren & Martin",       subtitle: "English Grammar & Composition", categoryId: "books",   price: 340,  originalPrice: 480,  rating: 4.6, reviewCount: 6200,  isDigital: false, thumbImage: "https://covers.openlibrary.org/b/isbn/9789352535453-L.jpg" },
  { id: "bs5", title: "JEE Advanced PYQs",   subtitle: "2010–2024 · Fully solved",   categoryId: "books",      price: 580,  originalPrice: 850,  rating: 4.7, reviewCount: 4400,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=320&h=240&fit=crop" },
  { id: "bs6", title: "Chemistry Lab Kit",   subtitle: "30 experiments · JEE level", categoryId: "lab-kits",   price: 1499, originalPrice: 2200, rating: 4.5, reviewCount: 1800,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=320&h=240&fit=crop" },
];

// TODO(api): GET /api/marketplace/partner-apps
const DUMMY_PARTNER_APPS: PartnerApp[] = [
  { id: "pa1", name: "Physics Wallah", initials: "PW", logoUrls: ["https://logo.clearbit.com/pw.live", "https://logo.clearbit.com/physicswallah.live"], accentColor: "#FF6B35" },
  { id: "pa2", name: "Khan Academy",   initials: "KA", logoUrls: ["https://logo.clearbit.com/khanacademy.org"], accentColor: "#14BF96" },
  { id: "pa3", name: "Duolingo",       initials: "DL", logoUrls: ["https://logo.clearbit.com/duolingo.com"],   accentColor: "#58CC02" },
  { id: "pa4", name: "Unacademy",      initials: "UN", logoUrls: ["https://logo.clearbit.com/unacademy.com"],  accentColor: "#0B76FF" },
];

// TODO(api): GET /api/marketplace/books
const DUMMY_BOOKS: Product[] = [
  { id: "bk1", title: "D.C. Pandey Mechanics",  subtitle: "JEE Physics Vol. 1",          categoryId: "books", price: 390, originalPrice: 550, rating: 4.8, reviewCount: 8200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=320&h=240&fit=crop" },
  { id: "bk2", title: "O.P. Tandon Organic",    subtitle: "IIT JEE Chemistry",           categoryId: "books", price: 420, originalPrice: 600, rating: 4.7, reviewCount: 6100, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=320&h=240&fit=crop" },
  { id: "bk3", title: "SL Arora Physics",       subtitle: "Class 11 & 12 combined",      categoryId: "books", price: 680, originalPrice: 950, rating: 4.6, reviewCount: 5400, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=320&h=240&fit=crop" },
  { id: "bk4", title: "NCERT Exemplar Math",    subtitle: "Class 11 + 12 combo",         categoryId: "books", price: 240, originalPrice: 360, rating: 4.5, reviewCount: 4300, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=320&h=240&fit=crop" },
  { id: "bk5", title: "Arihant General English",subtitle: "Objective · SSC & Bank",      categoryId: "books", price: 310, originalPrice: 450, rating: 4.4, reviewCount: 3800, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=320&h=240&fit=crop" },
];

// TODO(api): GET /api/marketplace/mock-tests
const DUMMY_MOCK_TESTS: MockTest[] = [
  { id: "mt1", title: "JEE Mains Mock Series",  examLabel: "JEE M", examAbbr: "JEE",  testCount: 20, questionCount: 1800, price: 599, originalPrice: 999,  accentColor: "#4096ff" },
  { id: "mt2", title: "NEET Mock Test Pack",    examLabel: "NEET",  examAbbr: "NEET", testCount: 30, questionCount: 5400, price: 699, originalPrice: 1199, accentColor: "#52c41a" },
  { id: "mt3", title: "CAT Mock Series 2026",   examLabel: "CAT",   examAbbr: "CAT",  testCount: 25, questionCount: 2000, price: 799, originalPrice: 1499, accentColor: "#ffc53d" },
  { id: "mt4", title: "UPSC Prelims Test Pack", examLabel: "UPSC",  examAbbr: "UPSC", testCount: 15, questionCount: 1200, price: 499, originalPrice: 899,  accentColor: "#ff7a45" },
];

// TODO(api): GET /api/marketplace/skill-courses
const DUMMY_SKILL_COURSES: Product[] = [
  { id: "sk1", title: "Python Programming",   subtitle: "From scratch · 30 hrs",      categoryId: "skill-courses", price: 699,  originalPrice: 1999, rating: 4.7, reviewCount: 2100, isDigital: true, thumbImage: "" },
  { id: "sk2", title: "Digital Marketing Pro",subtitle: "SEO, Ads & Social Media",    categoryId: "skill-courses", price: 899,  originalPrice: 2499, rating: 4.5, reviewCount: 1600, isDigital: true, thumbImage: "" },
  { id: "sk3", title: "Video Editing Bootcamp",subtitle: "Premiere Pro · 20 hrs",     categoryId: "skill-courses", price: 799,  originalPrice: 1999, rating: 4.6, reviewCount: 1400, isDigital: true, thumbImage: "" },
  { id: "sk4", title: "Public Speaking Mastery", subtitle: "8 weeks · Live sessions", categoryId: "skill-courses", price: 1299, originalPrice: 2999, rating: 4.8, reviewCount: 980,  isDigital: true, thumbImage: "" },
];

// TODO(api): GET /api/marketplace/lab-kits
const DUMMY_LAB_KITS: Product[] = [
  { id: "lk1", title: "Chemistry Lab Kit Pro", subtitle: "30 experiments · JEE level", categoryId: "lab-kits", price: 1499, originalPrice: 2200, rating: 4.5, reviewCount: 1800, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=320&h=240&fit=crop" },
  { id: "lk2", title: "Physics Lab Kit",       subtitle: "JEE level · 20 experiments", categoryId: "lab-kits", price: 1199, originalPrice: 1800, rating: 4.7, reviewCount: 890,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=320&h=240&fit=crop" },
  { id: "lk3", title: "Biology Dissection Kit",subtitle: "NEET prep · 15 tools",       categoryId: "lab-kits", price: 899,  originalPrice: 1400, rating: 4.4, reviewCount: 640,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=320&h=240&fit=crop" },
  { id: "lk4", title: "Electronics Project Kit", subtitle: "50 components · Arduino", categoryId: "lab-kits", price: 1799, originalPrice: 2800, rating: 4.6, reviewCount: 520,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=320&h=240&fit=crop" },
];

// TODO(api): GET /api/marketplace/browse
const DUMMY_BROWSE: Product[] = [
  { id: "br1", title: "UPSC Mains Complete", subtitle: "GS I–IV · Ethics",         categoryId: "courses",       price: 4999, originalPrice: 8999,  rating: 4.8, reviewCount: 920,  isDigital: true,  thumbImage: "https://images.unsplash.com/photo-1555861496-0666c8981751?w=320&h=240&fit=crop" },
  { id: "br2", title: "A4 Grid Notebooks",   subtitle: "Pack of 3 · 200 pages",    categoryId: "stationery",    price: 120,  originalPrice: 180,   rating: 4.3, reviewCount: 3200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=320&h=240&fit=crop" },
  { id: "br3", title: "Python for Data Science", subtitle: "40 hrs · Certificate", categoryId: "skill-courses", price: 799,  originalPrice: 1999,  rating: 4.6, reviewCount: 1500, isDigital: true,  thumbImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=320&h=240&fit=crop" },
  { id: "br4", title: "Physics Lab Kit",     subtitle: "JEE level · 20 experiments",categoryId: "lab-kits",     price: 1199, originalPrice: 1800,  rating: 4.7, reviewCount: 890,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=320&h=240&fit=crop" },
  { id: "br5", title: "CAT Mock Test Series",subtitle: "30 full mocks · Solutions",categoryId: "mock-tests",    price: 899,  originalPrice: 1499,  rating: 4.7, reviewCount: 2100, isDigital: true,  thumbImage: "https://images.unsplash.com/photo-1600469861931-a6b2353e2b3a?w=320&h=240&fit=crop" },
  { id: "br6", title: "Magnetic Whiteboard", subtitle: "A3 · Dry-erase surface",   categoryId: "stationery",    price: 680,  originalPrice: 999,   rating: 4.4, reviewCount: 1700, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=320&h=240&fit=crop" },
];

// Summer camp thumbnails (theme-aware)
const SUMMER_CAMP_THUMBNAILS: Record<string, Record<string, string>> = {
  explorer: { light: "/summer-camp-explorer-light.png", dark: "/summer-camp-explorer-dark.png" },
  creator:  { light: "/summer-camp-creator-light.png",  dark: "/summer-camp-creator-dark.png"  },
};

const BATCH_RATINGS: Record<string, { rating: number; reviewCount: number }> = {
  explorer: { rating: 4.9, reviewCount: 892 },
  creator:  { rating: 4.9, reviewCount: 654 },
};

// Crash course classes for synth-card rail
const CRASH_COURSE_CLASSES = [6, 7, 8, 9, 10] as const;

// Express app card data
const EXPRESS_APP_CARD: OtherCourse = {
  id: "express-app",
  title: "Express — AI English Coach",
  subtitle: "Speaking practice · Live feedback",
  thumbBg: `linear-gradient(135deg, color-mix(in srgb, #29d6d6 22%, var(--card)) 0%, color-mix(in srgb, #29d6d6 32%, var(--card)) 100%)`,
  thumbLogo: "/express-logo.webp",
  thumbBrand: "Express",
  thumbAccent: "#29d6d6",
  thumbMeta: "AI Coach",
  rating: 0,
  reviewCount: 0,
  price: 0,
  originalPrice: 0,
};

// ─── Per-section visibility based on age filter ───────────────────────────────

function getVisibility(age: AgeFilterId) {
  return {
    flashDeals:   ["all", "primary", "secondary", "class_1112"].includes(age),
    bestSellers:  ["all", "secondary", "class_1112", "college", "exam_prep"].includes(age),
    partnerApps:  ["all", "primary", "secondary", "class_1112"].includes(age),
    topCourses:   ["all", "class_1112", "college", "exam_prep"].includes(age),
    summerCamp:   ["all", "primary", "secondary"].includes(age),
    crashCourses: ["all", "primary", "secondary"].includes(age),
    books:        ["all", "primary", "secondary", "class_1112"].includes(age),
    mockTests:    ["all", "secondary", "class_1112", "exam_prep"].includes(age),
    skillCourses: ["all", "class_1112", "college", "exam_prep"].includes(age),
    music:        ["all", "primary", "secondary", "college"].includes(age),
    labKits:      ["all", "primary", "secondary"].includes(age),
    apps:         ["all", "primary", "secondary", "class_1112"].includes(age),
    browseAll:    true,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCrashCourseCards(enrolledClass: number | null): OtherCourse[] {
  return CRASH_COURSE_CLASSES.map((cls) => ({
    id: `crash-course-class-${cls}`,
    title: `Class ${cls} Summer Crash Course`,
    subtitle: "Maths & Science · 15 Days",
    thumbBg: `linear-gradient(135deg, color-mix(in srgb, ${DUMMY_CRASH_COURSE_INFO.accentColor} 22%, var(--card)) 0%, color-mix(in srgb, ${DUMMY_CRASH_COURSE_INFO.accentColor} 32%, var(--card)) 100%)`,
    thumbLabel: String(cls),
    thumbTag: enrolledClass === cls ? "ENROLLED" : undefined,
    thumbAccent: DUMMY_CRASH_COURSE_INFO.accentColor,
    thumbMeta: "15 Days",
    rating: 0,
    reviewCount: 0,
    price: 0,
    originalPrice: 0,
  }));
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({ title, count, onSeeAll }: { title: string; count?: number; onSeeAll?: () => void }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 12 }}
    >
      <div className="flex items-baseline" style={{ gap: 6 }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        {count !== undefined && (
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>
            ({count})
          </span>
        )}
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="flex items-center"
          style={{
            gap: 2, background: "transparent", border: "none",
            cursor: "pointer", padding: 0, fontFamily: "inherit",
            minHeight: 44,
          }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--primary)" }}>
            See all
          </span>
          <ChevronRight size={14} style={{ color: "var(--primary)" }} />
        </button>
      )}
    </div>
  );
}

// ─── FormatBadge — Live Group / Self-Paced pill on music thumbnails ───────────

export function FormatBadge({ subtitle }: { subtitle?: string }) {
  if (!subtitle) return null;
  const isGroup = subtitle.startsWith("Live Group");
  const isSelf  = subtitle.startsWith("Self-Paced");
  if (!isGroup && !isSelf) return null;

  if (isGroup) {
    return (
      <div
        className="flex items-center"
        style={{
          gap: 4, paddingLeft: 6, paddingRight: 8,
          height: 20, borderRadius: 4,
          backgroundColor: "var(--overlay-heavy, rgba(0,0,0,0.6))",
          backdropFilter: "blur(8px)",
          border: "0.5px solid var(--success-alpha-30, rgba(74,222,128,0.36))",
        }}
      >
        <Users size={10} style={{ color: "var(--success-500, #4ade80)" }} />
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--success-500, #4ade80)", whiteSpace: "nowrap" }}>
          Live Group
        </span>
      </div>
    );
  }
  return (
    <div
      className="flex items-center"
      style={{
        gap: 4, paddingLeft: 6, paddingRight: 8,
        height: 20, borderRadius: 4,
        backgroundColor: "var(--overlay-heavy, rgba(0,0,0,0.6))",
        backdropFilter: "blur(8px)",
        border: "0.5px solid var(--primary-alpha-40, rgba(96,165,250,0.4))",
      }}
    >
      <Video size={10} style={{ color: "var(--primary-400, #60a5fa)" }} />
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--primary-400, #60a5fa)", whiteSpace: "nowrap" }}>
        Self-Paced
      </span>
    </div>
  );
}

// ─── Skeleton + Error states ──────────────────────────────────────────────────

function SkeletonRail({ count = 4, cardWidth = 188 }: { count?: number; cardWidth?: number }) {
  return (
    <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "hidden" }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
          style={{ width: cardWidth, height: 220, borderRadius: 14, backgroundColor: "var(--card)", flexShrink: 0 }}
        />
      ))}
    </div>
  );
}

// ─── AgeFilterStrip — chip pills (v1 style) ───────────────────────────────────

export function AgeFilterStrip({ value, onChange }: { value: AgeFilterId; onChange: (id: AgeFilterId) => void }) {
  return (
    <div
      className="flex"
      style={{
        gap: 8, paddingLeft: 16, paddingRight: 16,
        paddingTop: 6, paddingBottom: 10,
        overflowX: "auto", scrollbarWidth: "none",
      }}
    >
      {AGE_FILTERS.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <motion.button
            key={id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(id)}
            className="flex items-center shrink-0"
            style={{
              gap: 6,
              height: 32,
              paddingLeft: 12, paddingRight: 14,
              borderRadius: 9999,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              background: active
                ? "linear-gradient(180deg, color-mix(in srgb, var(--primary) 22%, var(--card)) 0%, color-mix(in srgb, var(--primary) 10%, var(--card)) 100%)"
                : "color-mix(in srgb, var(--foreground) 5%, transparent)",
              boxShadow: active
                ? [
                    "inset 0 0.5px 0 color-mix(in srgb, var(--primary) 55%, rgba(255,255,255,0.4))",
                    "inset 0 0 0 0.5px color-mix(in srgb, var(--primary) 55%, transparent)",
                    "0 4px 14px color-mix(in srgb, var(--primary) 20%, transparent)",
                  ].join(", ")
                : "inset 0 0 0 0.5px color-mix(in srgb, var(--border) 35%, transparent)",
            }}
          >
            <Icon
              size={16}
              strokeWidth={1.75}
              style={{
                color: active ? "var(--primary)" : "var(--muted-foreground)",
                filter: active
                  ? "drop-shadow(0 0 6px color-mix(in srgb, var(--primary) 60%, transparent))"
                  : undefined,
                flexShrink: 0,
              }}
            />
            <span style={{
              fontSize: "var(--text-xs)",
              fontWeight: active ? 700 : 500,
              color: active ? "var(--primary)" : "var(--foreground)",
              whiteSpace: "nowrap",
            }}>
              {label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── PremiumBanner — v1's full glass treatment with 3 banners ─────────────────

export function PremiumBanner() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startAutoPlay() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActive((a) => (a + 1) % DUMMY_BANNERS.length);
    }, 3500);
  }

  function handleUserInteraction() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(startAutoPlay, 5000);
  }

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (resumeRef.current) clearTimeout(resumeRef.current);
    };
  }, []);

  const banner = DUMMY_BANNERS[active];

  const handleCta = () => {
    if (banner.scrollTo) {
      document.getElementById(banner.scrollTo)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div style={{ marginBottom: 24, paddingLeft: 16, paddingRight: 16 }}>
      <div
        onPointerDown={handleUserInteraction}
        onClick={handleCta}
        style={{
          overflow: "hidden",
          position: "relative",
          height: 280,
          borderRadius: 24,
          cursor: "pointer",
          backgroundColor: `color-mix(in srgb, ${banner.accent} 4%, #060406)`,
          border: `1px solid ${banner.accent}66`,
          boxShadow: [
            "inset 0 0.5px 0 rgba(255,255,255,0.4)",
            `inset 0 1.5px 0 ${banner.accent}30`,
            "inset 1px 0 0 rgba(255,255,255,0.04)",
            "inset -1px 0 0 rgba(255,255,255,0.04)",
            "inset 0 -1px 0 rgba(0,0,0,0.55)",
            "0 1px 2px rgba(0,0,0,0.25)",
            "0 10px 24px rgba(0,0,0,0.35)",
            "0 28px 64px rgba(0,0,0,0.5)",
            `0 0 36px ${banner.accent}1f`,
          ].join(", "),
          transition: "border-color 0.4s, background-color 0.4s",
        }}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0 }}
          >
            {/* L1 — full-card ambient brand wash */}
            <div aria-hidden style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(135deg, ${banner.accent}1f 0%, ${banner.accent}0a 45%, transparent 100%)`,
              pointerEvents: "none",
            }} />

            {/* L2 — primary brand glow (top-right) */}
            <div aria-hidden style={{
              position: "absolute",
              top: -150, right: -130, width: 440, height: 440,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${banner.accent} 0%, ${banner.accent}55 30%, transparent 70%)`,
              filter: "blur(30px)",
              pointerEvents: "none",
              opacity: 0.7,
            }} />

            {/* L3 — secondary brand glow (bottom-left) */}
            <div aria-hidden style={{
              position: "absolute",
              bottom: -160, left: -100, width: 380, height: 380,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${banner.accent} 0%, transparent 70%)`,
              filter: "blur(50px)",
              pointerEvents: "none",
              opacity: 0.32,
            }} />

            {/* L3.4 — bottom-edge brand wash */}
            <div aria-hidden style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
              background: `linear-gradient(0deg, ${banner.accent}14 0%, transparent 100%)`,
              pointerEvents: "none",
            }} />

            {/* L3.5 — soft diagonal sheen */}
            <div aria-hidden style={{
              position: "absolute",
              top: -40, left: -40, right: -40, height: 220,
              background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.04) 47%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 53%, transparent 70%)",
              pointerEvents: "none",
              transform: "rotate(-6deg)",
              mixBlendMode: "screen",
              filter: "blur(2px)",
            }} />

            {/* L3.6 — top-edge brand light catch */}
            <div aria-hidden style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 80,
              background: `linear-gradient(180deg, ${banner.accent}1f 0%, transparent 100%)`,
              pointerEvents: "none",
            }} />

            {/* L3.7 — top-center curved highlight */}
            <div aria-hidden style={{
              position: "absolute", top: -60, left: "20%", right: "20%", height: 140,
              background: "radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.07) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {/* L4 — hairline ring decoration */}
            <svg aria-hidden width="240" height="240" viewBox="0 0 240 240" style={{
              position: "absolute", top: -100, right: -100,
              pointerEvents: "none",
              opacity: 0.35,
              filter: "blur(0.4px)",
            }}>
              <defs>
                <linearGradient id={`ring-${banner.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={`${banner.accent}55`} />
                  <stop offset="60%" stopColor={`${banner.accent}1a`} />
                  <stop offset="100%" stopColor={`${banner.accent}00`} />
                </linearGradient>
              </defs>
              <circle cx="120" cy="120" r="115" fill="none" stroke={`url(#ring-${banner.id})`} strokeWidth="1" />
              <circle cx="120" cy="120" r="78" fill="none" stroke={`url(#ring-${banner.id})`} strokeWidth="0.5" />
            </svg>

            {/* L5 — corner edge vignette */}
            <div aria-hidden style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.28) 100%)",
              pointerEvents: "none",
            }} />

            {/* L6 — dot constellation */}
            <div aria-hidden style={{ position: "absolute", top: 56, right: 22, pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: 0,   left: 0,   width: 3, height: 3, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.32)" }} />
              <div style={{ position: "absolute", top: 22,  left: -16, width: 4, height: 4, borderRadius: "50%", backgroundColor: `${banner.accent}99`, boxShadow: `0 0 6px ${banner.accent}66` }} />
              <div style={{ position: "absolute", top: 44,  left: 8,   width: 2, height: 2, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.24)" }} />
            </div>

            {/* L6.5 — interior frost */}
            <div aria-hidden style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.03) 0%, transparent 55%)",
              pointerEvents: "none",
            }} />

            {/* L7 — noise grain */}
            <div aria-hidden style={{
              position: "absolute", inset: 0,
              opacity: 0.11,
              mixBlendMode: "overlay",
              pointerEvents: "none",
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }} />

            {/* L8 — bottom-up legibility scrim */}
            <div aria-hidden style={{
              position: "absolute", left: 0, right: 0, bottom: 0, height: 200,
              background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)",
              pointerEvents: "none",
            }} />

            {/* Top content */}
            <div className="flex flex-col" style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "22px 20px 0" }}>
              <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
                <span style={{
                  fontSize: "var(--text-2xs)", fontWeight: 800,
                  color: banner.accent, letterSpacing: "0.18em",
                  textShadow: `0 0 14px ${banner.accent}aa`,
                }}>
                  {banner.eyebrow}
                </span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.4)" }} />
                <span style={{
                  fontSize: "var(--text-2xs)", fontWeight: 700,
                  color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>
                  {banner.category}
                </span>
              </div>
              <h3 style={{
                fontSize: 28, fontWeight: 700,
                color: "#fff", lineHeight: 1.18,
                letterSpacing: "-0.022em", margin: 0, maxWidth: "82%",
                textShadow: "0 2px 16px rgba(0,0,0,0.5)",
              }}>
                {banner.title}
              </h3>
              <p style={{
                fontSize: "var(--text-sm)", fontWeight: 500,
                color: "rgba(255,255,255,0.92)", lineHeight: 1.4,
                margin: "12px 0 0", maxWidth: "82%",
                textShadow: "0 1px 10px rgba(0,0,0,0.6)",
              }}>
                {banner.subtitle}
              </p>
            </div>

            {/* Bottom app pill */}
            <div className="flex items-center" style={{
              position: "absolute", left: 12, right: 12, bottom: 12,
              gap: 12, padding: 10, borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.025)",
              backdropFilter: "blur(48px) saturate(220%)",
              WebkitBackdropFilter: "blur(48px) saturate(220%)",
              boxShadow: [
                "inset 0 1px 0 rgba(255,255,255,0.16)",
                `inset 0 1.5px 0 ${banner.accent}1c`,
                "inset 0 -1px 0 rgba(0,0,0,0.22)",
                "0 4px 14px rgba(0,0,0,0.3)",
                `0 0 0 0.5px ${banner.accent}10`,
              ].join(", "),
              border: "0.5px solid rgba(255,255,255,0.08)",
            }}>
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 48, height: 48, borderRadius: 13,
                  position: "relative",
                  background: `linear-gradient(160deg, color-mix(in srgb, ${banner.accent} 78%, #fff) 0%, color-mix(in srgb, ${banner.accent} 95%, #fff) 50%, color-mix(in srgb, ${banner.accent} 75%, #000) 100%)`,
                  boxShadow: [
                    `0 2px 4px ${banner.accent}26`,
                    `0 6px 14px ${banner.accent}14`,
                    "inset 0 1px 0 rgba(255,255,255,0.38)",
                    "inset 0 -1px 0 rgba(0,0,0,0.14)",
                  ].join(", "),
                }}
              >
                <banner.Icon style={{ width: 22, height: 22, color: "#fff", strokeWidth: 1.6 }} />
                <div aria-hidden style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "50%",
                  borderTopLeftRadius: 13, borderTopRightRadius: 13,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)",
                  pointerEvents: "none",
                }} />
              </div>

              <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "#fff", letterSpacing: "-0.005em" }}>
                  {banner.appName}
                </span>
                <span className="truncate" style={{ fontSize: "var(--text-2xs)", color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
                  {banner.appTagline}
                </span>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={(e) => { e.stopPropagation(); handleCta(); }}
                className="flex items-center justify-center shrink-0"
                style={{
                  height: 28, paddingLeft: 12, paddingRight: 12,
                  borderRadius: 9999, border: "none", cursor: "pointer",
                  background: "linear-gradient(180deg, #f5f3f0 0%, #e6e3df 100%)",
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.65)",
                    "inset 0 -0.5px 0 rgba(0,0,0,0.05)",
                    "0 1px 1px rgba(0,0,0,0.08)",
                  ].join(", "),
                  fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "#1a1a1a", letterSpacing: "0.005em" }}>
                  {banner.cta}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Pagination capsule */}
        <div className="flex items-center" style={{
          position: "absolute", top: 16, right: 16, gap: 5,
          pointerEvents: "none",
          padding: "5px 9px", borderRadius: 9999,
          backgroundColor: "rgba(0,0,0,0.36)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: "0.5px solid rgba(255,255,255,0.14)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        }}>
          {DUMMY_BANNERS.map((_, i) => (
            <div key={i} style={{
              width: i === active ? 16 : 4, height: 4, borderRadius: 9999,
              backgroundColor: i === active ? "#fff" : "rgba(255,255,255,0.45)",
              transition: "width 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PremiumThumbCard — v1's synth brand-letter card (188px) ──────────────────

export function PremiumThumbCard({ course, onClick }: { course: OtherCourse; onClick?: () => void }) {
  const accent = course.thumbAccent ?? "#888";
  const isAppMode = !!course.thumbLogo;
  const ringId = `pt-ring-${course.id}`;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{ width: 188, flexShrink: 0, cursor: "pointer" }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "3/2",
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: `color-mix(in srgb, ${accent} 10%, #0a0408)`,
          border: `0.5px solid ${accent}45`,
          boxShadow: [
            "inset 0 0.5px 0 rgba(255,255,255,0.45)",
            `inset 0 1.5px 0 ${accent}40`,
            "inset 0 -1px 0 rgba(0,0,0,0.5)",
            "0 1px 2px rgba(0,0,0,0.2)",
            "0 6px 14px rgba(0,0,0,0.25)",
            `0 0 24px ${accent}26`,
          ].join(", "),
        }}
      >
        {/* Ambient brand wash */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(135deg, ${accent}33 0%, ${accent}14 45%, transparent 100%)`,
          pointerEvents: "none",
        }} />
        {/* Top-right brand glow */}
        <div aria-hidden style={{
          position: "absolute", top: -50, right: -50, width: 180, height: 180,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, ${accent}66 30%, transparent 70%)`,
          filter: "blur(18px)", opacity: 0.8, pointerEvents: "none",
        }} />
        {/* Bottom-left brand glow */}
        <div aria-hidden style={{
          position: "absolute", bottom: -50, left: -40, width: 140, height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          filter: "blur(24px)", opacity: 0.32, pointerEvents: "none",
        }} />
        {/* Bottom-edge brand wash */}
        <div aria-hidden style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
          background: `linear-gradient(0deg, ${accent}26 0%, transparent 100%)`,
          pointerEvents: "none",
        }} />
        {/* Top specular streak */}
        <div aria-hidden style={{
          position: "absolute", top: -10, left: -20, right: -20, height: 50,
          background: "linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.06) 48%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 52%, transparent 75%)",
          pointerEvents: "none", transform: "rotate(-2deg)", mixBlendMode: "screen",
        }} />
        {/* Top-edge brand light catch */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 36,
          background: `linear-gradient(180deg, ${accent}1f 0%, transparent 100%)`,
          pointerEvents: "none",
        }} />
        {/* Hairline ring decoration */}
        <svg aria-hidden width="120" height="120" viewBox="0 0 120 120" style={{
          position: "absolute", top: -50, right: -50,
          pointerEvents: "none", opacity: 0.32, filter: "blur(0.4px)",
        }}>
          <defs>
            <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`${accent}55`} />
              <stop offset="100%" stopColor={`${accent}00`} />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="58" fill="none" stroke={`url(#${ringId})`} strokeWidth="0.75" />
          <circle cx="60" cy="60" r="40" fill="none" stroke={`url(#${ringId})`} strokeWidth="0.5" />
        </svg>
        {/* Edge vignette */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.25) 100%)",
          pointerEvents: "none",
        }} />
        {/* Noise grain */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          opacity: 0.09, mixBlendMode: "overlay", pointerEvents: "none",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }} />

        {/* Content branch */}
        {isAppMode ? (
          <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0 }}>
            <div style={{ position: "relative" }}>
              <div aria-hidden style={{
                position: "absolute", inset: -20,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${accent}66 0%, transparent 65%)`,
                filter: "blur(14px)", pointerEvents: "none",
              }} />
              <div className="flex items-center justify-center" style={{
                width: 72, height: 72, borderRadius: 16, position: "relative",
                background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 88%, #fff) 0%, ${accent} 50%, color-mix(in srgb, ${accent} 70%, #000) 100%)`,
                boxShadow: [
                  `0 3px 8px ${accent}55`,
                  `0 10px 24px ${accent}38`,
                  "inset 0 1px 0 rgba(255,255,255,0.5)",
                  "inset 0 -1px 0 rgba(0,0,0,0.2)",
                ].join(", "),
              }}>
                <span style={{
                  fontSize: 38, fontWeight: 900, color: "#fff",
                  letterSpacing: -1, lineHeight: 1,
                  textShadow: "0 1px 2px rgba(0,0,0,0.18)",
                }}>
                  {(course.thumbBrand ?? course.title)[0]}
                </span>
                <div aria-hidden style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "50%",
                  borderTopLeftRadius: 16, borderTopRightRadius: 16,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)",
                  pointerEvents: "none",
                }} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0, paddingLeft: 16, paddingRight: 16, paddingBottom: 18 }}>
              {(() => {
                const len = (course.thumbLabel ?? "").length;
                const size = len <= 3 ? 56 : len === 4 ? 44 : len === 5 ? 36 : len === 6 ? 30 : 24;
                const tracking = len <= 3 ? -2 : -1;
                return (
                  <span style={{
                    fontSize: size, fontWeight: 900, letterSpacing: tracking,
                    lineHeight: 1, color: accent, opacity: 0.85,
                    whiteSpace: "nowrap",
                    textShadow: [
                      `0 0 24px ${accent}88`,
                      `0 2px 8px ${accent}44`,
                    ].join(", "),
                  }}>
                    {course.thumbLabel}
                  </span>
                );
              })()}
            </div>

            <div className="flex items-center justify-between" style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              paddingLeft: 10, paddingRight: 10, paddingBottom: 8, paddingTop: 12,
            }}>
              {course.thumbTag === "ENROLLED" ? (
                <div className="flex items-center" style={{
                  gap: 4, paddingLeft: 6, paddingRight: 8, height: 22, borderRadius: 6,
                  backgroundColor: `${accent}1f`,
                  border: `0.5px solid ${accent}55`,
                  boxShadow: `inset 0 0.5px 0 ${accent}40`,
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}>
                  <Check size={10} style={{ color: accent, strokeWidth: 3 }} />
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: accent, letterSpacing: 0.4 }}>
                    ENROLLED
                  </span>
                </div>
              ) : course.thumbTag ? (
                <div className="flex items-center justify-center" style={{
                  paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 6,
                  backgroundColor: `${accent}1f`,
                  border: `0.5px solid ${accent}55`,
                  boxShadow: `inset 0 0.5px 0 ${accent}40`,
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}>
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: accent, letterSpacing: 0.4 }}>
                    {course.thumbTag}
                  </span>
                </div>
              ) : <span />}
              {course.thumbMeta && (
                <span style={{
                  fontSize: "var(--text-xs)", fontWeight: 600,
                  color: "rgba(255,255,255,0.88)",
                  textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                }}>
                  {course.thumbMeta}
                </span>
              )}
            </div>
          </>
        )}

        {/* Discount pill */}
        {course.originalPrice > course.price && course.originalPrice > 0 && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            paddingLeft: 7, paddingRight: 7, height: 19,
            display: "flex", alignItems: "center", borderRadius: 5,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "0.5px solid color-mix(in srgb, var(--warning-500) 40%, rgba(255,255,255,0.08))",
            boxShadow: [
              "inset 0 0.5px 0 rgba(255,255,255,0.2)",
              "0 1px 2px rgba(0,0,0,0.18)",
            ].join(", "),
          }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--warning-500)", letterSpacing: 0.3 }}>
              {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col" style={{ padding: "10px 8px 8px 0", gap: 4 }}>
        <p style={{
          fontSize: "var(--text-sm)", fontWeight: 700,
          color: "var(--foreground)", lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0,
        }}>
          {course.title}
        </p>
        {course.subtitle && (
          <p style={{
            fontSize: "var(--text-2xs)", fontWeight: 400,
            color: "var(--secondary-foreground)", lineHeight: 1.3,
            overflow: "hidden", whiteSpace: "nowrap",
            textOverflow: "ellipsis", margin: 0,
          }}>
            {course.subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── PremiumPhotoCard — photo-based card with v1 polish (188px) ───────────────

export function PremiumPhotoCard({ product, onPress, enrolled, metaOverride, thumbOverride }: { product: Product; onPress: () => void; enrolled?: boolean; metaOverride?: string; thumbOverride?: ReactNode }) {
  const [imgFailed, setImgFailed] = useState(!product.thumbImage);
  const pct = discountPct(product.price, product.originalPrice);
  const isGroup = product.subtitle?.startsWith("Live Group");
  const isSelf  = product.subtitle?.startsWith("Self-Paced");

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      style={{ width: 188, flexShrink: 0, cursor: "pointer" }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "3/2",
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: "var(--card)",
          border: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
          boxShadow: [
            "inset 0 0.5px 0 rgba(255,255,255,0.06)",
            "inset 0 -1px 0 rgba(0,0,0,0.35)",
            "0 4px 12px rgba(0,0,0,0.3)",
          ].join(", "),
        }}
      >
        {thumbOverride ? (
          thumbOverride
        ) : imgFailed ? (
          <ProductImageFallback categoryId={product.categoryId} />
        ) : (
          <img
            src={product.thumbImage}
            alt={product.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={() => setImgFailed(true)}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.naturalWidth <= 1) setImgFailed(true);
            }}
          />
        )}

        {/* Bottom dark vignette for legibility — skip when thumbOverride owns its own composition */}
        {!thumbOverride && (
          <div aria-hidden style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: 50,
            background: "linear-gradient(0deg, rgba(0,0,0,0.45) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />
        )}

        {/* Top specular sheen */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 36,
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />

        {/* Discount pill (top-left) — brick gradient, matches v1 */}
        {!enrolled && pct >= 30 && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            paddingLeft: 7, paddingRight: 7, height: 20,
            display: "flex", alignItems: "center", borderRadius: 5,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "0.5px solid color-mix(in srgb, var(--warning-500) 40%, rgba(255,255,255,0.08))",
            boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.2)",
          }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--warning-500)", letterSpacing: 0.3 }}>
              {pct}% OFF
            </span>
          </div>
        )}

        {/* Enrolled pill */}
        {enrolled && (
          <div className="flex items-center" style={{
            position: "absolute", top: 8, left: 8,
            gap: 4, paddingLeft: 6, paddingRight: 8, height: 20, borderRadius: 5,
            backgroundColor: "var(--overlay-heavy, rgba(0,0,0,0.6))",
            backdropFilter: "blur(8px)",
            border: "0.5px solid var(--success-alpha-30, rgba(74,222,128,0.36))",
          }}>
            <Check size={10} style={{ color: "var(--success-500, #4ade80)", strokeWidth: 3 }} />
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--success-500, #4ade80)", letterSpacing: 0.4 }}>
              ENROLLED
            </span>
          </div>
        )}

        {/* Format badge (bottom-left) for music */}
        {(isGroup || isSelf) && (
          <div style={{ position: "absolute", bottom: 8, left: 8 }}>
            <FormatBadge subtitle={product.subtitle} />
          </div>
        )}

      </div>

      <div className="flex flex-col" style={{ padding: "10px 8px 8px 0", gap: 4 }}>
        <p style={{
          fontSize: "var(--text-sm)", fontWeight: 700,
          color: "var(--foreground)", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0,
        }}>
          {product.title}
        </p>
        {product.subtitle && (
          <p style={{
            fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
            overflow: "hidden", whiteSpace: "nowrap",
            textOverflow: "ellipsis", margin: 0,
          }}>
            {isGroup ? "4–12 sessions · small batch"
             : isSelf ? "10 songs · watch anytime"
             : product.subtitle}
          </p>
        )}
        {metaOverride ? (
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", marginTop: 2 }}>
            {metaOverride}
          </span>
        ) : product.rating > 0 ? (
          <div className="flex items-center" style={{ gap: 4 }}>
            <Star size={10} fill="var(--warning-500, #f59e0b)" style={{ color: "var(--warning-500, #f59e0b)" }} />
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
              {product.rating} ({formatCount(product.reviewCount)})
            </span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

// ─── PremiumPhotoGridCard — 2-col grid variant ────────────────────────────────

export function PremiumPhotoGridCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const [imgFailed, setImgFailed] = useState(!product.thumbImage);
  const [wishlisted, setWishlisted] = useState(false);
  const pct = discountPct(product.price, product.originalPrice);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      style={{ width: "100%", cursor: "pointer" }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "3/2",
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "var(--card)",
          border: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
          boxShadow: [
            "inset 0 0.5px 0 rgba(255,255,255,0.05)",
            "0 3px 10px rgba(0,0,0,0.25)",
          ].join(", "),
        }}
      >
        {imgFailed ? (
          <ProductImageFallback categoryId={product.categoryId} />
        ) : (
          <img
            src={product.thumbImage}
            alt={product.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={() => setImgFailed(true)}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.naturalWidth <= 1) setImgFailed(true);
            }}
          />
        )}
        {pct >= 30 && (
          <div style={{
            position: "absolute", top: 6, left: 6,
            paddingLeft: 6, paddingRight: 6, height: 18,
            display: "flex", alignItems: "center", borderRadius: 4,
            backgroundColor: "rgba(0,0,0,0.55)",
            border: "0.5px solid color-mix(in srgb, var(--warning-500) 40%, rgba(255,255,255,0.08))",
          }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--warning-500)" }}>
              {pct}% OFF
            </span>
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); setWishlisted((w) => !w); }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute", top: 4, right: 4,
            width: 24, height: 24, borderRadius: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            border: "none", cursor: "pointer",
          }}
        >
          <Heart
            size={13}
            style={{ color: wishlisted ? "var(--error-500, #f44336)" : "#fff" }}
            fill={wishlisted ? "var(--error-500, #f44336)" : "none"}
          />
        </motion.button>
      </div>

      <div className="flex flex-col" style={{ padding: "8px 4px 8px 0", gap: 4 }}>
        <p style={{
          fontSize: "var(--text-sm)", fontWeight: 700,
          color: "var(--foreground)", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0,
        }}>
          {product.title}
        </p>
        {product.subtitle && (
          <p style={{
            fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
            overflow: "hidden", whiteSpace: "nowrap",
            textOverflow: "ellipsis", margin: 0,
          }}>
            {product.subtitle}
          </p>
        )}
        <div className="flex items-center" style={{ gap: 4 }}>
          <Star size={10} fill="var(--warning-500, #f59e0b)" style={{ color: "var(--warning-500, #f59e0b)" }} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
            {product.rating}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── PremiumMockTestCard — synthesized exam-brand card (188px) ────────────────

export function PremiumMockTestCard({ test, onClick }: { test: MockTest; onClick: () => void }) {
  const accent = test.accentColor;
  const pct = discountPct(test.price, test.originalPrice);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{ width: 188, flexShrink: 0, cursor: "pointer" }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "3/2",
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: `color-mix(in srgb, ${accent} 10%, #0a0408)`,
          boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
        }}
      >
        {/* Visual recipe — IDENTICAL to morph hero (just scaled down by container). Eliminates the swap when the morph overlays the card. */}
        {/* Ambient wash */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(135deg, ${accent}40 0%, ${accent}18 45%, transparent 100%)`,
          pointerEvents: "none",
        }} />
        {/* Brand glow top-right (proportional to morph: 360/375 ≈ 48% of card width = ~90, but scaled relative) */}
        <div aria-hidden style={{
          position: "absolute", top: -50, right: -40, width: 180, height: 180,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, ${accent}55 35%, transparent 70%)`,
          filter: "blur(18px)", opacity: 0.7, pointerEvents: "none",
        }} />
        {/* Bottom-left soft glow */}
        <div aria-hidden style={{
          position: "absolute", bottom: -40, left: -30, width: 140, height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          filter: "blur(22px)", opacity: 0.35, pointerEvents: "none",
        }} />
        {/* Exam abbreviation */}
        <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0, paddingBottom: 26 }}>
          <span style={{
            fontSize: 62, fontWeight: 900, color: accent,
            opacity: 0.88, letterSpacing: -2, lineHeight: 1,
            textShadow: [`0 0 28px ${accent}99`, `0 2px 9px ${accent}55`].join(", "),
          }}>
            {test.examAbbr}
          </span>
        </div>
        {/* Bottom row: badge + test count */}
        <div className="flex items-center justify-between" style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          paddingLeft: 10, paddingRight: 10, paddingBottom: 8, paddingTop: 12,
        }}>
          <div className="flex items-center justify-center" style={{
            paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 6,
            backgroundColor: `${accent}1f`,
            border: `0.5px solid ${accent}55`,
            boxShadow: `inset 0 0.5px 0 ${accent}40`,
            backdropFilter: "blur(8px)",
          }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: accent, letterSpacing: 0.4 }}>
              {test.examLabel}
            </span>
          </div>
          <span style={{
            fontSize: "var(--text-xs)", fontWeight: 600,
            color: "rgba(255,255,255,0.88)",
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
          }}>
            {test.testCount} Tests
          </span>
        </div>
        {/* Discount pill */}
        {pct >= 30 && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            paddingLeft: 7, paddingRight: 7, height: 19,
            display: "flex", alignItems: "center", borderRadius: 5,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(12px)",
            border: "0.5px solid color-mix(in srgb, var(--warning-500) 40%, rgba(255,255,255,0.08))",
          }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--warning-500)", letterSpacing: 0.3 }}>
              {pct}% OFF
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col" style={{ padding: "10px 8px 8px 0", gap: 4 }}>
        <p style={{
          fontSize: "var(--text-sm)", fontWeight: 700,
          color: "var(--foreground)", lineHeight: 1.35,
          overflow: "hidden", whiteSpace: "nowrap",
          textOverflow: "ellipsis", margin: 0,
        }}>
          {test.title}
        </p>
        <div className="flex items-center" style={{ gap: 4 }}>
          <ClipboardList size={11} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
            {test.questionCount.toLocaleString("en-IN")} questions
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── PremiumTestSeriesCard — editorial mock-test card with real metadata ─────
//
// Replaces the screaming-letter PremiumMockTestCard for the Test Series rails.
// Design principles:
//   - Brand color used as accent, not as background fill
//   - Hero metric is the test count (the substance), not a giant letter
//   - Centered using transform: translate, not letter-spacing-tainted flex
//   - Editorial: clean number + label, exam chip, refined glow
//   - Bottom band has title + question count, like a real product card
//
// Same MockTest data shape — drop-in replacement for the rails on marketplace-v1.

// Shared hero-art recipe used by card, morph, and detail page.
// Renders ONLY the visual layers (wash + glow + dot texture + center number).
// Pills/chips are added by each caller so they can size them appropriately for
// their canvas (card 188px vs detail 375px).
export function TestSeriesHeroInner({ test, scale = 1, heroLabel }: { test: MockTest; scale?: number; heroLabel?: string }) {
  const accent = test.accentColor;
  // Hero metric: the headline test count (the Standard pack — most popular).
  // Variation is conveyed in bottom-row meta, not jammed into the hero.
  // If heroLabel is passed (e.g., "10–60" range for detail page), it overrides
  // the single number so the thumbnail communicates "multiple options exist."
  const heroNumber: string | number = heroLabel ?? test.testCount;

  return (
    <>
      {/* Brand wash — now that the card surface is borderless and uses a
          color-mix base, the wash needs more presence so the thumbnail
          reads as branded content rather than a flat tile. */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(135deg, ${accent}26 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      {/* Corner glow — back up to 0.28 to give the borderless thumbnail
          enough visual lift without a hard outline. */}
      <div aria-hidden style={{
        position: "absolute", bottom: -28 * scale, right: -28 * scale,
        width: 120 * scale, height: 120 * scale,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
        filter: `blur(${18 * scale}px)`, opacity: 0.28, pointerEvents: "none",
      }} />
      {/* Neutral edge vignette — was a second accent layer; switched to black
          so it adds depth without compounding the color. */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.28) 100%)",
        pointerEvents: "none",
      }} />

      {/* Centered metric — true 50% so the stack sits in the optical middle of
          the thumbnail (was 44%, which pushed everything noticeably above center). */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        <span
          style={{
            // Range strings (e.g., "10–60") get a tighter scale so they don't bust the hero
            fontSize: (heroLabel && heroLabel.length > 3 ? 32 : 36) * scale,
            fontWeight: 800,
            color: accent,
            lineHeight: 1,
            textShadow: `0 1px ${8 * scale}px ${accent}30`,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: heroLabel && heroLabel.length > 3 ? -0.5 : -0.5,
            whiteSpace: "nowrap",
          }}
        >
          {heroNumber}
        </span>
        <span
          style={{
            fontSize: 9 * scale,
            fontWeight: 600,
            color: accent,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            marginTop: 4 * scale,
            opacity: 0.85,
          }}
        >
          Mock Tests
        </span>
        {test.pattern && (
          <span
            style={{
              fontSize: 8.5 * scale,
              fontWeight: 600,
              color: "var(--muted-foreground)",
              marginTop: 3 * scale,
              letterSpacing: 0.3,
            }}
          >
            {test.pattern}
          </span>
        )}
      </div>
    </>
  );
}

export function PremiumTestSeriesCard({ test, onClick }: { test: MockTest; onClick: () => void }) {
  const accent = test.accentColor;
  const priceFrom = test.priceFrom ?? test.price;
  const pct = discountPct(priceFrom, test.originalPrice);
  const packCount = test.packCount ?? 1;
  // Bottom-right meta — pack flexibility only. Price lives on the detail page,
  // not on the browse card (the card is a "what's inside" scan, not a price tag).
  const metaRight = packCount > 1 ? `${packCount} plans` : `Single plan`;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{ width: 188, flexShrink: 0, cursor: "pointer" }}
    >
      {/* Hero — 3:2 with refined brand tint. Borderless full-bleed treatment
          matching photo cards (music / summer camp) elsewhere on the page —
          card surface is an accent-tinted blend (not flat grey) so the
          thumbnail reads as branded content, not an empty box. */}
      <div
        style={{
          position: "relative",
          aspectRatio: "3/2",
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: `color-mix(in srgb, ${accent} 10%, var(--card))`,
          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
        }}
      >
        <TestSeriesHeroInner
          test={test}
          heroLabel={test.minCount && test.maxCount && test.minCount !== test.maxCount ? `${test.minCount} - ${test.maxCount}` : undefined}
        />

        {/* OFF pill — softened glass, lower contrast */}
        {pct >= 30 && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            paddingLeft: 7, paddingRight: 7, height: 18,
            display: "flex", alignItems: "center", borderRadius: 4,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
            border: "0.5px solid color-mix(in srgb, var(--warning-500) 40%, rgba(255,255,255,0.08))",
          }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--warning-500)", letterSpacing: 0.3 }}>
              {pct}% OFF
            </span>
          </div>
        )}

        {/* Bottom row — exam chip LEFT + meta RIGHT (Test Prep convention) */}
        <div className="flex items-center justify-between" style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          paddingLeft: 10, paddingRight: 10, paddingBottom: 8, paddingTop: 12,
        }}>
          <div className="flex items-center justify-center" style={{
            paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 6,
            backgroundColor: `${accent}1f`,
            border: `0.5px solid ${accent}55`,
            boxShadow: `inset 0 0.5px 0 ${accent}40`,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: accent, letterSpacing: 0.4 }}>
              {test.examLabel}
            </span>
          </div>
          <span style={{
            fontSize: "var(--text-2xs)", fontWeight: 600,
            color: "rgba(255,255,255,0.88)",
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
          }}>
            {metaRight}
          </span>
        </div>
      </div>

      {/* Bottom panel — title + question total */}
      <div className="flex flex-col" style={{ padding: "10px 8px 8px 0", gap: 2 }}>
        <p
          style={{
            fontSize: "var(--text-sm)", fontWeight: 700,
            color: "var(--foreground)", lineHeight: 1.35,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            margin: 0,
          }}
        >
          {test.title}
        </p>
        <div className="flex items-center" style={{ gap: 4 }}>
          <ClipboardList size={11} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
            {test.questionCount.toLocaleString("en-IN")} questions
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── CategoryTile — premium glass squircle with brand glow ────────────────────

export function CategoryTile({ category, onPress }: { category: Category; onPress: () => void }) {
  const { Icon, accent } = category;
  const ringId = `cat-ring-${category.id}`;
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onPress}
      className="flex flex-col items-center shrink-0"
      style={{
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        minWidth: 64,
        padding: "4px 0",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 60, height: 60, borderRadius: 18,
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 14%, #0a0408) 0%, color-mix(in srgb, ${accent} 24%, #0a0408) 50%, color-mix(in srgb, ${accent} 32%, #0a0408) 100%)`,
          border: `0.5px solid ${accent}50`,
          boxShadow: [
            "inset 0 0.5px 0 rgba(255,255,255,0.32)",
            `inset 0 1.5px 0 ${accent}33`,
            "inset 0 -0.5px 0 rgba(0,0,0,0.5)",
            `0 4px 12px ${accent}28`,
            `0 0 18px ${accent}1a`,
          ].join(", "),
        }}
      >
        {/* Ambient diagonal wash */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(135deg, ${accent}26 0%, ${accent}0a 50%, transparent 100%)`,
          pointerEvents: "none",
        }} />
        {/* Top-right brand glow */}
        <div aria-hidden style={{
          position: "absolute", top: -20, right: -20, width: 60, height: 60,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          filter: "blur(8px)", opacity: 0.5, pointerEvents: "none",
        }} />
        {/* Top specular sweep */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
        {/* Hairline ring decoration */}
        <svg aria-hidden width="40" height="40" viewBox="0 0 40 40" style={{
          position: "absolute", top: -16, right: -16,
          pointerEvents: "none", opacity: 0.4, filter: "blur(0.4px)",
        }}>
          <defs>
            <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`${accent}66`} />
              <stop offset="100%" stopColor={`${accent}00`} />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="none" stroke={`url(#${ringId})`} strokeWidth="0.75" />
        </svg>
        {/* Icon with brand glow */}
        <Icon
          size={24}
          style={{
            color: accent,
            filter: `drop-shadow(0 0 10px ${accent}99) drop-shadow(0 2px 4px ${accent}55)`,
            position: "relative",
            zIndex: 1,
          }}
        />
      </div>
      <span style={{
        fontSize: "var(--text-2xs)",
        color: "var(--foreground)",
        fontWeight: 600,
        textAlign: "center",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}>
        {category.label}
      </span>
    </motion.button>
  );
}

// ─── PartnerAppTile — iOS-quality app icon with brand glow + sheen ────────────

export function PartnerAppTile({ app, onPress }: { app: PartnerApp; onPress: () => void }) {
  const [attempt, setAttempt] = useState(0);
  const showInitials = attempt >= app.logoUrls.length;
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onPress}
      aria-label={`Open ${app.name}`}
      className="flex flex-col items-center shrink-0"
      style={{
        width: 72, gap: 8,
        background: "none", border: "none",
        cursor: "pointer", padding: 0,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 60, height: 60, borderRadius: 16,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "var(--white)",
          flexShrink: 0,
          boxShadow: [
            "inset 0 1px 0 rgba(255,255,255,0.85)",
            "inset 0 -1px 0 rgba(0,0,0,0.06)",
            `inset 0 0 0 0.5px ${app.accentColor}44`,
            "0 2px 4px rgba(0,0,0,0.18)",
            "0 6px 16px rgba(0,0,0,0.22)",
            `0 0 18px ${app.accentColor}22`,
          ].join(", "),
        }}
      >
        {!showInitials ? (
          <img
            key={attempt}
            src={app.logoUrls[attempt]}
            alt={app.name}
            style={{ width: 44, height: 44, objectFit: "contain", position: "relative", zIndex: 1 }}
            onError={() => setAttempt((a) => a + 1)}
          />
        ) : (
          <span style={{ fontSize: 18, fontWeight: 800, color: app.accentColor, position: "relative", zIndex: 1 }}>
            {app.initials}
          </span>
        )}
        {/* Top-half specular highlight (iOS app icon sheen) */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "50%",
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
        {/* Brand-tinted bottom edge glow */}
        <div aria-hidden style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 16,
          background: `linear-gradient(0deg, ${app.accentColor}18 0%, transparent 100%)`,
          pointerEvents: "none",
        }} />
      </div>
      <span style={{
        fontSize: "var(--text-2xs)",
        fontWeight: 600,
        color: "var(--foreground)",
        textAlign: "center",
        lineHeight: 1.3,
        maxWidth: 72,
      }}>
        {app.name}
      </span>
    </motion.button>
  );
}

// ─── SummerCampPhotoCard — uses summer-camp PNG with v1 polish ────────────────

export function SummerCampPhotoCard({ batch, onClick }: { batch: SummerCampBatch; onClick?: () => void }) {
  const { theme } = useTheme();
  const pct = discountPct(DUMMY_SUMMER_CAMP_SHARED.price, DUMMY_SUMMER_CAMP_SHARED.originalPrice);
  const thumbSrc = SUMMER_CAMP_THUMBNAILS[batch.track]?.[theme] ?? SUMMER_CAMP_THUMBNAILS.explorer.dark;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{ width: 188, flexShrink: 0, cursor: "pointer" }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "3/2",
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: "var(--card)",
          border: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
          boxShadow: [
            "inset 0 0.5px 0 rgba(255,255,255,0.06)",
            "0 4px 12px rgba(0,0,0,0.3)",
          ].join(", "),
        }}
      >
        <img src={thumbSrc} alt={batch.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {pct >= 30 && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            paddingLeft: 7, paddingRight: 7, height: 20,
            display: "flex", alignItems: "center", borderRadius: 5,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(8px)",
            border: "0.5px solid color-mix(in srgb, var(--warning-500) 40%, rgba(255,255,255,0.08))",
          }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--warning-500)", letterSpacing: 0.3 }}>
              {pct}% OFF
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col" style={{ padding: "10px 8px 8px 0", gap: 4 }}>
        <p style={{
          fontSize: "var(--text-sm)", fontWeight: 700,
          color: "var(--foreground)", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0,
        }}>
          {batch.title}
        </p>
        <p style={{
          fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
          overflow: "hidden", whiteSpace: "nowrap",
          textOverflow: "ellipsis", margin: 0,
        }}>
          {batch.grade} · {DUMMY_SUMMER_CAMP_SHARED.daysLabel.split(" · ")[0]}
        </p>
      </div>
    </motion.div>
  );
}

