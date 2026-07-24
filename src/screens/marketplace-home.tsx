/**
 * Marketplace Home — Personalized student marketplace
 * Redesigned: fixed category navigation, unified card sizes, modern card design, real product images
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Search, ShoppingCart, Heart, Star, ChevronRight,
  GraduationCap, BookOpen, ClipboardList, PenLine,
  Lightbulb, FlaskConical, LayoutGrid, Atom, Library,
  Trophy, Clock, Music2, Users, Video, Package,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar } from "../shared/premium-ui";
import { CourseThumbnail, OtherCourseCard } from "../shared/classroom-cards";
import { DUMMY_OTHER_COURSES, DUMMY_SUMMER_CAMP_BATCHES, DUMMY_SUMMER_CAMP_SHARED, DUMMY_CRASH_COURSE_INFO, type ExamCourse, type SummerCampBatch, type OtherCourse } from "../shared/classroom-catalog";
import { ProductImageFallback, discountPct, formatCount } from "./marketplace-shared";
import { useTheme } from "../app/contexts/theme-context";

// ─── Types ────────────────────────────────────────────────────────────────────
type AgeFilter = "all" | "primary" | "secondary" | "class_1112" | "college" | "exam_prep";

interface Product {
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

interface MockTest {
  id: string;
  title: string;
  examLabel: string;
  examAbbr: string;
  testCount: number;
  questionCount: number;
  price: number;
  originalPrice: number;
  accentColor: string;
  examBadgeBg: string;
  examBadgeBorder: string;
  examAccent: string;
  gradientBg: string;
}

interface Category {
  id: string;
  label: string;
  path: string;
  Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
  gradient: string;
  gradientLight: string;
  accentColor: string;
}

// ─── Categories (aligned with real route pages) ────────────────────────────────
const CATEGORIES: Category[] = [
  {
    id: "courses",
    label: "Courses",
    path: "/marketplace/category/courses",
    Icon: GraduationCap,
    gradient: "135deg, #1a3a5c 0%, #0f2340 100%",
    gradientLight: "135deg, #aaccff 0%, #80aaff 100%",
    accentColor: "#4a9eff",
  },
  {
    id: "mock-tests",
    label: "Mock Tests",
    path: "/marketplace/category/mock-tests",
    Icon: ClipboardList,
    gradient: "135deg, #3a1a4a 0%, #250f30 100%",
    gradientLight: "135deg, #d4aaff 0%, #bc80ff 100%",
    accentColor: "#bf6fff",
  },
  {
    id: "books",
    label: "Books",
    path: "/marketplace/category/books",
    Icon: BookOpen,
    gradient: "135deg, #3a2a1a 0%, #231808 100%",
    gradientLight: "135deg, #ffc880 0%, #ffaa50 100%",
    accentColor: "#ffa84a",
  },
  {
    id: "stationery",
    label: "Stationery",
    path: "/marketplace/category/stationery",
    Icon: PenLine,
    gradient: "135deg, #1a2a3a 0%, #0f1a25 100%",
    gradientLight: "135deg, #88ddff 0%, #55ccff 100%",
    accentColor: "#4ad4ff",
  },
  {
    id: "music",
    label: "Music",
    path: "/marketplace/category/music",
    Icon: Music2,
    gradient: "135deg, #3a1a2e 0%, #230f1c 100%",
    gradientLight: "135deg, #ffaadd 0%, #ff77cc 100%",
    accentColor: "#f06ac0",
  },
  {
    id: "skill-courses",
    label: "Skills",
    path: "/marketplace/category/skill-courses",
    Icon: Lightbulb,
    gradient: "135deg, #3a3a1a 0%, #252508 100%",
    gradientLight: "135deg, #ffe880 0%, #ffd840 100%",
    accentColor: "#ffd94a",
  },
  {
    id: "lab-kits",
    label: "Lab Kits",
    path: "/marketplace/category/lab-kits",
    Icon: FlaskConical,
    gradient: "135deg, #3a1a1a 0%, #250f0f 100%",
    gradientLight: "135deg, #ffaaaa 0%, #ff8080 100%",
    accentColor: "#ff6b6b",
  },
  {
    id: "olympiad",
    label: "Olympiad",
    path: "/marketplace/category/olympiad",
    Icon: Trophy,
    gradient: "135deg, #3a2800 0%, #201500 100%",
    gradientLight: "135deg, #ffcc70 0%, #ffaa30 100%",
    accentColor: "#ffb830",
  },
  {
    id: "apps",
    label: "Apps",
    path: "/marketplace/apps",
    Icon: LayoutGrid,
    gradient: "135deg, #1a3a3a 0%, #0f2323 100%",
    gradientLight: "135deg, #80ffee 0%, #44ffd8 100%",
    accentColor: "#4affdd",
  },
];

// ─── Summer Camp thumbnail map ────────────────────────────────────────────────
const SUMMER_CAMP_THUMBNAILS: Record<string, Record<string, string>> = {
  explorer: { light: "/summer-camp-explorer-light.png", dark: "/summer-camp-explorer-dark.png" },
  creator:  { light: "/summer-camp-creator-light.png",  dark: "/summer-camp-creator-dark.png"  },
};

const BATCH_RATINGS: Record<string, { rating: number; reviewCount: number }> = {
  explorer: { rating: 4.9, reviewCount: 892 },
  creator:  { rating: 4.9, reviewCount: 654 },
};

// TODO(api): GET /api/marketplace/music-courses
const DUMMY_MUSIC_COURSES: Product[] = [
  // ── Group Classes (teacher-led) ──
  {
    id: "piano-group",
    title: "Piano / Keyboard",
    subtitle: "Live Group Class · 4–12 Sessions",
    categoryId: "music",
    price: 1499,
    originalPrice: 2499,
    rating: 4.8,
    reviewCount: 312,
    isDigital: true,
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg",
  },
  {
    id: "guitar-group",
    title: "Guitar Learning",
    subtitle: "Live Group Class · 4–12 Sessions",
    categoryId: "music",
    price: 1499,
    originalPrice: 2499,
    rating: 4.7,
    reviewCount: 184,
    isDigital: true,
    thumbImage: "/guitar-course.webp",
  },
  {
    id: "western-vocals-group",
    title: "Western Vocals",
    subtitle: "Live Group Class · 4–12 Sessions",
    categoryId: "music",
    price: 1499,
    originalPrice: 2499,
    rating: 4.9,
    reviewCount: 468,
    isDigital: true,
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg",
  },
  {
    id: "hindustani-vocals-group",
    title: "Hindustani Vocals",
    subtitle: "Live Group Class · 4–12 Sessions",
    categoryId: "music",
    price: 1499,
    originalPrice: 2499,
    rating: 4.8,
    reviewCount: 211,
    isDigital: true,
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg",
  },
  // ── Self-Paced (video-led) ──
  {
    id: "piano-self",
    title: "Piano / Keyboard",
    subtitle: "Self-Paced Video · 10 Songs",
    categoryId: "music",
    price: 999,
    originalPrice: 1999,
    rating: 4.7,
    reviewCount: 256,
    isDigital: true,
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg",
  },
  {
    id: "guitar-self",
    title: "Guitar Learning",
    subtitle: "Self-Paced Video · 10 Songs",
    categoryId: "music",
    price: 999,
    originalPrice: 1999,
    rating: 4.6,
    reviewCount: 143,
    isDigital: true,
    thumbImage: "/guitar-course.webp",
  },
  {
    id: "western-vocals-self",
    title: "Western Vocals",
    subtitle: "Self-Paced Video · 10 Songs",
    categoryId: "music",
    price: 999,
    originalPrice: 1999,
    rating: 4.8,
    reviewCount: 389,
    isDigital: true,
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg",
  },
  {
    id: "hindustani-vocals-self",
    title: "Hindustani Vocals",
    subtitle: "Self-Paced Video · 10 Songs",
    categoryId: "music",
    price: 999,
    originalPrice: 1999,
    rating: 4.7,
    reviewCount: 178,
    isDigital: true,
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg",
  },
];

// ─── Dummy Data ────────────────────────────────────────────────────────────────
// TODO(api): GET /api/marketplace/banners
const DUMMY_BANNERS = [
  {
    id: "b1",
    title: "JEE 2026 Crash Course",
    subtitle: "Starting at ₹999",
    gradient: "135deg, #1a2f5a 0%, #0a1830 100%",
    gradientLight: "135deg, #dce8ff 0%, #c4d8ff 100%",
    accent: "#4a9eff",
    Icon: Atom,
    cta: "Enroll Now",
    tag: "CRASH COURSE",
  },
  {
    id: "b2",
    title: "NEET Complete Pack",
    subtitle: "All subjects. All topics.",
    gradient: "135deg, #2d1a5a 0%, #190a30 100%",
    gradientLight: "135deg, #eedcff 0%, #dcc8ff 100%",
    accent: "#bf6fff",
    Icon: FlaskConical,
    cta: "Get Pack",
    tag: "MEGA BUNDLE",
  },
  {
    id: "b3",
    title: "Books: Flat 30% Off",
    subtitle: "Today only — limited stock",
    gradient: "135deg, #1a3d2a 0%, #0a2014 100%",
    gradientLight: "135deg, #d4f4e0 0%, #b8eccc 100%",
    accent: "#4adf88",
    Icon: Library,
    cta: "Shop Books",
    tag: "FLASH DEAL",
  },
];

// TODO(api): GET /api/marketplace/flash-deals
const DUMMY_FLASH_DEALS: Product[] = [
  {
    id: "fd1",
    title: "HC Verma Vol. 1",
    subtitle: "Concepts of Physics",
    categoryId: "books",
    price: 280,
    originalPrice: 450,
    rating: 4.8,
    reviewCount: 12400,
    isDigital: false,
    thumbImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=320&h=240&fit=crop",
  },
  {
    id: "fd2",
    title: "HC Verma Vol. 2",
    subtitle: "Concepts of Physics",
    categoryId: "books",
    price: 275,
    originalPrice: 420,
    rating: 4.7,
    reviewCount: 9800,
    isDigital: false,
    thumbImage: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=320&h=240&fit=crop",
  },
  {
    id: "fd3",
    title: "NCERT Biology XII",
    subtitle: "Class 12 Textbook",
    categoryId: "books",
    price: 120,
    originalPrice: 180,
    rating: 4.6,
    reviewCount: 8200,
    isDigital: false,
    thumbImage: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=320&h=240&fit=crop",
  },
  {
    id: "fd4",
    title: "JEE Crash Course",
    subtitle: "60 hours · All subjects",
    categoryId: "courses",
    price: 999,
    originalPrice: 2499,
    rating: 4.9,
    reviewCount: 3200,
    isDigital: true,
    thumbImage:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=320&h=240&fit=crop",
  },
  {
    id: "fd5",
    title: "Classmate Notebook Pack",
    subtitle: "6-in-1 · 172 pages each",
    categoryId: "stationery",
    price: 180,
    originalPrice: 280,
    rating: 4.4,
    reviewCount: 5600,
    isDigital: false,
    thumbImage:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=320&h=240&fit=crop",
  },
  {
    id: "fd6",
    title: "Staedtler Geometry Box",
    subtitle: "Full set · Pro grade",
    categoryId: "stationery",
    price: 220,
    originalPrice: 380,
    rating: 4.5,
    reviewCount: 3400,
    isDigital: false,
    thumbImage:
      "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=320&h=240&fit=crop",
  },
];

// TODO(api): GET /api/marketplace/best-sellers
const DUMMY_BEST_SELLERS: Product[] = [
  {
    id: "bs1",
    title: "NCERT Chemistry XII",
    subtitle: "Class 12 Textbook",
    categoryId: "books",
    price: 115,
    originalPrice: 160,
    rating: 4.7,
    reviewCount: 11000,
    isDigital: false,
    thumbImage: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=320&h=240&fit=crop",
  },
  {
    id: "bs2",
    title: "NEET Biology Master",
    subtitle: "1500+ practice questions",
    categoryId: "mock-tests",
    price: 699,
    originalPrice: 999,
    rating: 4.8,
    reviewCount: 2800,
    isDigital: true,
    thumbImage:
      "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=320&h=240&fit=crop",
  },
  {
    id: "bs3",
    title: "Casio FX-991EX",
    subtitle: "Scientific calculator",
    categoryId: "stationery",
    price: 1250,
    originalPrice: 1600,
    rating: 4.9,
    reviewCount: 7800,
    isDigital: false,
    thumbImage:
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=320&h=240&fit=crop",
  },
  {
    id: "bs4",
    title: "Wren & Martin",
    subtitle: "English Grammar & Composition",
    categoryId: "books",
    price: 340,
    originalPrice: 480,
    rating: 4.6,
    reviewCount: 6200,
    isDigital: false,
    thumbImage: "https://covers.openlibrary.org/b/isbn/9789352535453-L.jpg",
  },
  {
    id: "bs5",
    title: "JEE Advanced PYQs",
    subtitle: "2010–2024 · Fully solved",
    categoryId: "books",
    price: 580,
    originalPrice: 850,
    rating: 4.7,
    reviewCount: 4400,
    isDigital: false,
    thumbImage:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=320&h=240&fit=crop",
  },
  {
    id: "bs6",
    title: "Chemistry Lab Kit",
    subtitle: "30 experiments · JEE level",
    categoryId: "lab-kits",
    price: 1499,
    originalPrice: 2200,
    rating: 4.5,
    reviewCount: 1800,
    isDigital: false,
    thumbImage:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=320&h=240&fit=crop",
  },
];

// TODO(api): GET /api/marketplace/browse
const DUMMY_BROWSE: Product[] = [
  {
    id: "br1",
    title: "UPSC Mains Complete",
    subtitle: "GS I–IV · Ethics",
    categoryId: "courses",
    price: 4999,
    originalPrice: 8999,
    rating: 4.8,
    reviewCount: 920,
    isDigital: true,
    thumbImage:
      "https://images.unsplash.com/photo-1555861496-0666c8981751?w=320&h=240&fit=crop",
  },
  {
    id: "br2",
    title: "A4 Grid Notebooks",
    subtitle: "Pack of 3 · 200 pages",
    categoryId: "stationery",
    price: 120,
    originalPrice: 180,
    rating: 4.3,
    reviewCount: 3200,
    isDigital: false,
    thumbImage:
      "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=320&h=240&fit=crop",
  },
  {
    id: "br3",
    title: "Python for Data Science",
    subtitle: "40 hrs · Certificate",
    categoryId: "skill-courses",
    price: 799,
    originalPrice: 1999,
    rating: 4.6,
    reviewCount: 1500,
    isDigital: true,
    thumbImage:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=320&h=240&fit=crop",
  },
  {
    id: "br4",
    title: "Physics Lab Kit",
    subtitle: "JEE level · 20 experiments",
    categoryId: "lab-kits",
    price: 1199,
    originalPrice: 1800,
    rating: 4.7,
    reviewCount: 890,
    isDigital: false,
    thumbImage:
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=320&h=240&fit=crop",
  },
  {
    id: "br5",
    title: "CAT Mock Test Series",
    subtitle: "30 full mocks · Solutions",
    categoryId: "mock-tests",
    price: 899,
    originalPrice: 1499,
    rating: 4.7,
    reviewCount: 2100,
    isDigital: true,
    thumbImage:
      "https://images.unsplash.com/photo-1600469861931-a6b2353e2b3a?w=320&h=240&fit=crop",
  },
  {
    id: "br6",
    title: "Magnetic Whiteboard",
    subtitle: "A3 · Dry-erase surface",
    categoryId: "stationery",
    price: 680,
    originalPrice: 999,
    rating: 4.4,
    reviewCount: 1700,
    isDigital: false,
    thumbImage:
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=320&h=240&fit=crop",
  },
  {
    id: "br7",
    title: "IIT JEE Live Batch",
    subtitle: "6 months · Weekend classes",
    categoryId: "live-class",
    price: 7999,
    originalPrice: 14999,
    rating: 4.9,
    reviewCount: 680,
    isDigital: true,
    thumbImage:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=320&h=240&fit=crop",
  },
  {
    id: "br8",
    title: "Biology Diagram Book",
    subtitle: "NEET · 500+ diagrams",
    categoryId: "books",
    price: 380,
    originalPrice: 550,
    rating: 4.6,
    reviewCount: 2900,
    isDigital: false,
    thumbImage:
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=320&h=240&fit=crop",
  },
];

// TODO(api): GET /api/marketplace/partner-apps
const DUMMY_PARTNER_APPS = [
  {
    id: "pa1",
    name: "Physics Wallah",
    initials: "PW",
    logoUrls: [
      "https://logo.clearbit.com/pw.live",
      "https://logo.clearbit.com/physicswallah.live",
      "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://pw.live&size=256",
    ],
    accentColor: "#FF6B35",
  },
  {
    id: "pa2",
    name: "Khan Academy",
    initials: "KA",
    logoUrls: [
      "https://logo.clearbit.com/khanacademy.org",
      "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://khanacademy.org&size=256",
    ],
    accentColor: "#14BF96",
  },
  {
    id: "pa3",
    name: "Duolingo",
    initials: "DL",
    logoUrls: [
      "https://logo.clearbit.com/duolingo.com",
      "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://duolingo.com&size=256",
    ],
    accentColor: "#58CC02",
  },
  {
    id: "pa4",
    name: "Unacademy",
    initials: "UN",
    logoUrls: [
      "https://logo.clearbit.com/unacademy.com",
      "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://unacademy.com&size=256",
    ],
    accentColor: "#0B76FF",
  },
];

// TODO(api): GET /api/marketplace/books
const DUMMY_BOOKS: Product[] = [
  { id: "bk1", title: "D.C. Pandey Mechanics", subtitle: "JEE Physics Vol. 1", categoryId: "books", price: 390, originalPrice: 550, rating: 4.8, reviewCount: 8200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=320&h=240&fit=crop" },
  { id: "bk2", title: "O.P. Tandon Organic", subtitle: "IIT JEE Chemistry", categoryId: "books", price: 420, originalPrice: 600, rating: 4.7, reviewCount: 6100, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=320&h=240&fit=crop" },
  { id: "bk3", title: "SL Arora Physics", subtitle: "Class 11 & 12 combined", categoryId: "books", price: 680, originalPrice: 950, rating: 4.6, reviewCount: 5400, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=320&h=240&fit=crop" },
  { id: "bk4", title: "NCERT Exemplar Math", subtitle: "Class 11 + 12 combo", categoryId: "books", price: 240, originalPrice: 360, rating: 4.5, reviewCount: 4300, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=320&h=240&fit=crop" },
  { id: "bk5", title: "Arihant General English", subtitle: "Objective · SSC & Bank", categoryId: "books", price: 310, originalPrice: 450, rating: 4.4, reviewCount: 3800, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=320&h=240&fit=crop" },
];

// TODO(api): GET /api/marketplace/mock-tests
// Each entry's gradient + badge bg + badge border are derived from a single
// accent color via color-mix on var(--background) — auto-flips for light mode.
// Dark bg + 22-60% accent = the dark navy/green/gold/amber we had before.
// Light bg + same mix = light pastel tint of the accent. No hardcoded hex.
function mockTestGradient(accent: string): string {
  return `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, var(--background)) 0%, color-mix(in srgb, ${accent} 32%, var(--background)) 50%, color-mix(in srgb, ${accent} 60%, var(--background)) 100%)`;
}
function mockTestBadgeBg(accent: string): string {
  return `color-mix(in srgb, ${accent} 28%, var(--background))`;
}
function mockTestBadgeBorder(accent: string): string {
  return `color-mix(in srgb, ${accent} 50%, var(--background))`;
}

const DUMMY_MOCK_TESTS: MockTest[] = [
  {
    id: "mt1", title: "JEE Mains Mock Series",
    examLabel: "JEE M", examAbbr: "JEE",
    testCount: 20, questionCount: 1800,
    price: 599, originalPrice: 999,
    accentColor: "#4096ff",
    examBadgeBg: mockTestBadgeBg("#4096ff"), examBadgeBorder: mockTestBadgeBorder("#4096ff"),
    examAccent: "#4096ff", gradientBg: mockTestGradient("#4096ff"),
  },
  {
    id: "mt2", title: "NEET Mock Test Pack",
    examLabel: "NEET", examAbbr: "NEET",
    testCount: 30, questionCount: 5400,
    price: 699, originalPrice: 1199,
    accentColor: "#52c41a",
    examBadgeBg: mockTestBadgeBg("#52c41a"), examBadgeBorder: mockTestBadgeBorder("#52c41a"),
    examAccent: "#52c41a", gradientBg: mockTestGradient("#52c41a"),
  },
  {
    id: "mt3", title: "CAT Mock Series 2026",
    examLabel: "CAT", examAbbr: "CAT",
    testCount: 25, questionCount: 2000,
    price: 799, originalPrice: 1499,
    accentColor: "#ffc53d",
    examBadgeBg: mockTestBadgeBg("#ffc53d"), examBadgeBorder: mockTestBadgeBorder("#ffc53d"),
    examAccent: "#d87a16", gradientBg: mockTestGradient("#ffc53d"),
  },
  {
    id: "mt4", title: "UPSC Prelims Test Pack",
    examLabel: "UPSC", examAbbr: "UPSC",
    testCount: 15, questionCount: 1200,
    price: 499, originalPrice: 899,
    accentColor: "#ff7a45",
    examBadgeBg: mockTestBadgeBg("#ff7a45"), examBadgeBorder: mockTestBadgeBorder("#ff7a45"),
    examAccent: "#ff7a45", gradientBg: mockTestGradient("#ff7a45"),
  },
];

// TODO(api): GET /api/marketplace/skill-courses
const DUMMY_SKILL_COURSES: Product[] = [
  { id: "sk1", title: "Python Programming", subtitle: "From scratch · 30 hrs", categoryId: "skill-courses", price: 699, originalPrice: 1999, rating: 4.7, reviewCount: 2100, isDigital: true, thumbImage: "" },
  { id: "sk2", title: "Digital Marketing Pro", subtitle: "SEO, Ads & Social Media", categoryId: "skill-courses", price: 899, originalPrice: 2499, rating: 4.5, reviewCount: 1600, isDigital: true, thumbImage: "" },
  { id: "sk3", title: "Video Editing Bootcamp", subtitle: "Premiere Pro · 20 hrs", categoryId: "skill-courses", price: 799, originalPrice: 1999, rating: 4.6, reviewCount: 1400, isDigital: true, thumbImage: "" },
  { id: "sk4", title: "Public Speaking Mastery", subtitle: "8 weeks · Live sessions", categoryId: "skill-courses", price: 1299, originalPrice: 2999, rating: 4.8, reviewCount: 980, isDigital: true, thumbImage: "" },
];

// TODO(api): GET /api/marketplace/lab-kits
const DUMMY_LAB_KITS: Product[] = [
  { id: "lk1", title: "Chemistry Lab Kit Pro", subtitle: "30 experiments · JEE level", categoryId: "lab-kits", price: 1499, originalPrice: 2200, rating: 4.5, reviewCount: 1800, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=320&h=240&fit=crop" },
  { id: "lk2", title: "Physics Lab Kit", subtitle: "JEE level · 20 experiments", categoryId: "lab-kits", price: 1199, originalPrice: 1800, rating: 4.7, reviewCount: 890, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=320&h=240&fit=crop" },
  { id: "lk3", title: "Biology Dissection Kit", subtitle: "NEET prep · 15 tools", categoryId: "lab-kits", price: 899, originalPrice: 1400, rating: 4.4, reviewCount: 640, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=320&h=240&fit=crop" },
  { id: "lk4", title: "Electronics Project Kit", subtitle: "50 components · Arduino", categoryId: "lab-kits", price: 1799, originalPrice: 2800, rating: 4.6, reviewCount: 520, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=320&h=240&fit=crop" },
];

// ─── PartnerAppTile ────────────────────────────────────────────────────────────
interface PartnerApp {
  id: string;
  name: string;
  initials: string;
  logoUrls: string[];
  accentColor: string;
}

function PartnerAppTile({ app }: { app: PartnerApp }) {
  const [attempt, setAttempt] = useState(0);
  const showInitials = attempt >= app.logoUrls.length;
  return (
    <button
      aria-label={`Open ${app.name}`}
      style={{
        flexShrink: 0,
        width: 72,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          // var(--card) + border so the logo plate is visible in BOTH themes.
          // Previous "var(--white)" rendered as white-on-white in light mode.
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {!showInitials ? (
          <img
            key={attempt}
            src={app.logoUrls[attempt]}
            alt={app.name}
            style={{ width: 52, height: 52, objectFit: "contain" }}
            onError={() => setAttempt((a) => a + 1)}
          />
        ) : (
          <span style={{ fontSize: 18, fontWeight: 800, color: app.accentColor }}>
            {app.initials}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: "var(--text-2xs)",
          fontWeight: 500,
          color: "var(--foreground)",
          textAlign: "center",
          lineHeight: 1.3,
          maxWidth: 72,
        }}
      >
        {app.name}
      </span>
    </button>
  );
}

// ─── ProductCard — horizontal scroll rail (200px wide) ────────────────────────
interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

function ProductCard({ product, onPress }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [imgFailed, setImgFailed] = useState(!product.thumbImage);
  const pct = discountPct(product.price, product.originalPrice);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      style={{
        width: 188,
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "3/2",
          backgroundColor: "var(--card)",
          overflow: "hidden",
          borderRadius: 8,
        }}
      >
        {imgFailed ? (
          <ProductImageFallback categoryId={product.categoryId} />
        ) : (
          <img
            src={product.thumbImage}
            alt={product.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgFailed(true)}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.naturalWidth <= 1) setImgFailed(true);
            }}
          />
        )}
        {pct >= 40 && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: "var(--error-600, #e53935)",
              color: "var(--white)",
              fontSize: "var(--text-2xs)",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {pct}% OFF
          </div>
        )}
        {/* Format badge — bottom left of image, only for music courses */}
        {/* Format badges sit over the product image — the dark scrim works in both
            themes (image is arbitrary content). Border + text use semantic tokens
            so the colors stay consistent + theme-flippable. */}
        {product.subtitle?.startsWith("Live Group") && (
          <div className="flex items-center" style={{ position: "absolute", bottom: 8, left: 8, gap: 4, paddingLeft: 6, paddingRight: 8, height: 20, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.56)", backdropFilter: "blur(8px)", border: "0.5px solid color-mix(in srgb, var(--success-400) 36%, transparent)" }}>
            <Users size={9} style={{ color: "var(--success-400)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--success-400)", whiteSpace: "nowrap" }}>Live Group</span>
          </div>
        )}
        {product.subtitle?.startsWith("Self-Paced") && (
          <div className="flex items-center" style={{ position: "absolute", bottom: 8, left: 8, gap: 4, paddingLeft: 6, paddingRight: 8, height: 20, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.56)", backdropFilter: "blur(8px)", border: "0.5px solid color-mix(in srgb, var(--primary-400) 36%, transparent)" }}>
            <Video size={9} style={{ color: "var(--primary-400)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--primary-400)", whiteSpace: "nowrap" }}>Self-Paced</span>
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            setWishlisted((w) => !w);
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 24,
            height: 24,
            borderRadius: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(8px)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Heart
            size={16}
            style={{
              color: wishlisted ? "var(--error-500, #f44336)" : "var(--foreground)",
            }}
            fill={wishlisted ? "var(--error-500, #f44336)" : "none"}
          />
        </motion.button>
      </div>

      <div className="flex flex-col gap-1" style={{ padding: "8px 8px 6px 0" }}>
        <p
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            color: "var(--foreground)",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            margin: 0,
          }}
        >
          {product.title}
        </p>
        {product.subtitle?.startsWith("Live Group") ? (
          <p style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", margin: 0 }}>
            4–12 sessions · small batch
          </p>
        ) : product.subtitle?.startsWith("Self-Paced") ? (
          <p style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", margin: 0 }}>
            10 songs · watch anytime
          </p>
        ) : product.subtitle ? (
          <p style={{ fontSize: "var(--text-2xs)", fontWeight: 400, color: "var(--secondary-foreground)", lineHeight: 1.2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", margin: 0 }}>
            {product.subtitle}
          </p>
        ) : null}
        <div className="flex items-center gap-1">
          <Star
            size={10}
            fill="var(--warning-500)"
            style={{ color: "var(--warning-500)" }}
          />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--secondary-foreground)" }}>
            {product.rating} ({formatCount(product.reviewCount)})
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ProductGridCard — 2-col grid, full width ────────────────────────────────
function ProductGridCard({ product, onPress }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [imgFailed, setImgFailed] = useState(!product.thumbImage);
  const pct = discountPct(product.price, product.originalPrice);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      style={{
        width: "100%",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "3/2",
          backgroundColor: "var(--card)",
          overflow: "hidden",
          borderRadius: 8,
        }}
      >
        {imgFailed ? (
          <ProductImageFallback categoryId={product.categoryId} />
        ) : (
          <img
            src={product.thumbImage}
            alt={product.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgFailed(true)}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.naturalWidth <= 1) setImgFailed(true);
            }}
          />
        )}
        {pct >= 40 && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: "var(--error-600, #e53935)",
              color: "var(--white)",
              fontSize: "var(--text-2xs)",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {pct}% OFF
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            setWishlisted((w) => !w);
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 24,
            height: 24,
            borderRadius: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(8px)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Heart
            size={16}
            style={{
              color: wishlisted ? "var(--error-500, #f44336)" : "var(--foreground)",
            }}
            fill={wishlisted ? "var(--error-500, #f44336)" : "none"}
          />
        </motion.button>
      </div>

      <div className="flex flex-col gap-1" style={{ padding: "8px 8px 6px 0" }}>
        <p
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            color: "var(--foreground)",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            margin: 0,
          }}
        >
          {product.title}
        </p>
        {product.subtitle && (
          <p
            style={{
              fontSize: "var(--text-2xs)",
              fontWeight: 400,
              color: "var(--secondary-foreground)",
              lineHeight: 1.2,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              margin: 0,
            }}
          >
            {product.subtitle}
          </p>
        )}
        <div className="flex items-center gap-1">
          <Star
            size={10}
            fill="var(--warning-500)"
            style={{ color: "var(--warning-500)" }}
          />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--secondary-foreground)" }}>
            {product.rating}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── MarketplaceCourseCard — local variant with consistent title style ─────────
interface MarketplaceCourseCardProps {
  course: ExamCourse;
  exam: string;
  shortLabel: string;
  accentColor: string;
  examBadgeBg: string;
  examBadgeBorder: string;
  examAccent: string;
  gradientBg: string;
  onClick?: () => void;
}

function MarketplaceCourseCard({ course, exam, shortLabel, accentColor, examBadgeBg, examBadgeBorder, examAccent, gradientBg, onClick }: MarketplaceCourseCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col shrink-0"
      style={{ width: 188, borderRadius: 8, overflow: "hidden", cursor: "pointer" }}
    >
      <div style={{ borderRadius: 8, overflow: "hidden", position: "relative" }}>
        <CourseThumbnail
          exam={exam}
          shortLabel={shortLabel}
          plan={course.plan}
          accentColor={accentColor}
          examBadgeBg={examBadgeBg}
          examBadgeBorder={examBadgeBorder}
          examAccent={examAccent}
          gradientBg={gradientBg}
        />
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); setWishlisted((w) => !w); }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute", top: 4, right: 4,
            width: 24, height: 24, borderRadius: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer",
          }}
        >
          <Heart size={16} style={{ color: wishlisted ? "var(--error-500, #f44336)" : "var(--foreground)" }} fill={wishlisted ? "var(--error-500, #f44336)" : "none"} />
        </motion.button>
      </div>
      <div className="flex flex-col" style={{ padding: "8px 0", gap: 8 }}>
        <p style={{
          fontSize: "var(--text-sm)",
          fontWeight: 700,
          color: "var(--foreground)",
          lineHeight: 1.4,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          margin: 0,
        }}>
          {course.title}
        </p>
        <div className="flex flex-col" style={{ gap: 4 }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <Clock size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{course.plan}</span>
          </div>
          <div className="flex items-center" style={{ gap: 4 }}>
            <BookOpen size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{course.topics} topics</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── MockTestCard ─────────────────────────────────────────────────────────────
interface MockTestCardProps {
  test: MockTest;
  onClick?: () => void;
}

// ─── SummerCampProductCard — photo thumbnail, no card bg, with rating ─────────
function SummerCampProductCard({ batch, onClick }: { batch: SummerCampBatch; onClick: () => void }) {
  const [wishlisted, setWishlisted] = useState(false);
  const { theme } = useTheme();
  const pct = discountPct(DUMMY_SUMMER_CAMP_SHARED.price, DUMMY_SUMMER_CAMP_SHARED.originalPrice);
  const thumbSrc = SUMMER_CAMP_THUMBNAILS[batch.track]?.[theme] ?? SUMMER_CAMP_THUMBNAILS.explorer.dark;
  const ratingData = BATCH_RATINGS[batch.track] ?? { rating: 4.9, reviewCount: 500 };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{ width: 188, flexShrink: 0, cursor: "pointer" }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", aspectRatio: "3/2", borderRadius: 8, overflow: "hidden", backgroundColor: "var(--card)" }}>
        <img src={thumbSrc} alt={batch.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {pct >= 40 && (
          <div style={{ position: "absolute", top: 8, left: 8, backgroundColor: "var(--error-600, #e53935)", color: "var(--white)", fontSize: "var(--text-2xs)", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
            {pct}% OFF
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); setWishlisted((w) => !w); }}
          aria-label="Add to wishlist"
          style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer" }}
        >
          <Heart size={16} style={{ color: wishlisted ? "var(--error-500)" : "var(--foreground)" }} fill={wishlisted ? "var(--error-500)" : "none"} />
        </motion.button>
      </div>

      {/* Text area */}
      <div className="flex flex-col gap-1" style={{ paddingTop: 8, gap: 4 }}>
        <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
          {batch.title}
        </p>
        <p style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", margin: 0 }}>
          {batch.grade} · {DUMMY_SUMMER_CAMP_SHARED.daysLabel.split(" · ")[0]}
        </p>
        <div className="flex items-center" style={{ gap: 4 }}>
          <Star size={10} fill="var(--warning-500)" style={{ color: "var(--warning-500)" }} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
            {ratingData.rating} ({ratingData.reviewCount.toLocaleString("en-IN")})
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function MockTestCard({ test, onClick }: MockTestCardProps) {
  const pct = discountPct(test.price, test.originalPrice);
  const [wishlisted, setWishlisted] = useState(false);
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col shrink-0"
      style={{ width: 188, borderRadius: 8, overflow: "hidden", cursor: "pointer" }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: "100%",
          height: 128,
          background: `linear-gradient(135deg, color-mix(in srgb, ${test.examAccent} 22%, var(--card)) 0%, color-mix(in srgb, ${test.examAccent} 32%, var(--card)) 50%, color-mix(in srgb, ${test.examAccent} 42%, var(--card)) 100%)`,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          borderRadius: 8,
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(45deg, color-mix(in srgb, var(--foreground) 4%, transparent) 0px, color-mix(in srgb, var(--foreground) 4%, transparent) 1px, transparent 1px, transparent 10px)",
        }} />
        <div style={{ position: "absolute", top: -32, right: -32, width: 108, height: 108, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 64, height: 64, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 6%, transparent)" }} />
        <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0, paddingBottom: 24 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: test.examAccent, opacity: 0.55, letterSpacing: -2, lineHeight: 1 }}>
            {test.examAbbr}
          </span>
        </div>
        <div className="flex items-center justify-between" style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          paddingLeft: 12, paddingRight: 12, paddingBottom: 10, paddingTop: 20,
        }}>
          <div
            className="flex items-center justify-center"
            style={{
              paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 6,
              backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)",
              border: `1px solid ${test.examAccent}`,
            }}
          >
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: test.examAccent }}>{test.examLabel}</span>
          </div>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--foreground)" }}>{test.testCount} Tests</span>
        </div>
        {pct >= 40 && (
          <div style={{ position: "absolute", top: 8, left: 8, backgroundColor: "var(--error-600, #e53935)", color: "var(--white)", fontSize: "var(--text-2xs)", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
            {pct}% OFF
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
            backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer",
          }}
        >
          <Heart size={16} style={{ color: wishlisted ? "var(--error-500, #f44336)" : "var(--foreground)" }} fill={wishlisted ? "var(--error-500, #f44336)" : "none"} />
        </motion.button>
      </div>

      {/* Info */}
      <div className="flex flex-col" style={{ padding: "8px 0", gap: 8 }}>
        <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.4, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", margin: 0 }}>
          {test.title}
        </p>
        <div className="flex flex-col" style={{ gap: 4 }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <ClipboardList size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{test.testCount} full tests</span>
          </div>
          <div className="flex items-center" style={{ gap: 4 }}>
            <BookOpen size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{test.questionCount.toLocaleString("en-IN")} questions</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── CategoryTile ─────────────────────────────────────────────────────────────
interface CategoryTileProps {
  category: Category;
  onPress: () => void;
}

function CategoryTile({ category, onPress }: CategoryTileProps) {
  const { Icon } = category;
  const { theme } = useTheme();
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onPress}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        minWidth: 64,
        padding: "4px 0",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: `linear-gradient(${theme === "dark" ? category.gradient : category.gradientLight})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `0.5px solid ${category.accentColor}44`,
        }}
      >
        {/* accentColor is a mid-saturation hex per category — readable on both
            the dark navy gradient (dark mode) AND the light pastel gradient
            (light mode). Previous "var(--white)" in light mode put white on
            light pastel = invisible. */}
        <Icon size={24} style={{ color: category.accentColor }} />
      </div>
      <span
        style={{
          fontSize: "var(--text-2xs)",
          color: "var(--muted-foreground)",
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        {category.label}
      </span>
    </motion.button>
  );
}

// ─── Crash course data ────────────────────────────────────────────────────────

const CRASH_COURSE_CARD: OtherCourse = {
  id: "crash-courses",
  title: "Maths & Science Crash Course",
  subtitle: "Class 6–10 · 22 chapters",
  thumbBg: `linear-gradient(135deg, color-mix(in srgb, ${DUMMY_CRASH_COURSE_INFO.accentColor} 22%, var(--card)) 0%, color-mix(in srgb, ${DUMMY_CRASH_COURSE_INFO.accentColor} 32%, var(--card)) 100%)`,
  thumbBgLight: "linear-gradient(135deg, #d9f7be 0%, #95de64 100%)",
  thumbLabel: "CC",
  thumbTag: "CRASH",
  thumbAccent: DUMMY_CRASH_COURSE_INFO.accentColor,
  thumbAccentLight: DUMMY_CRASH_COURSE_INFO.accentColorLight,
  thumbMeta: "15 Days",
  rating: 0,
  reviewCount: 0,
  price: 0,
  originalPrice: 0,
};

// ─── SectionHeader ─────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 8 }}
    >
      <h2
        style={{
          fontSize: "var(--text-base)",
          fontWeight: 700,
          color: "var(--foreground)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--primary-400)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            minHeight: 44,
            padding: "0 4px",
          }}
        >
          See all <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Section rail loading / error states ─────────────────────────────────────
function SkeletonCard({ width = 144, height = 200 }: { width?: number; height?: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width,
        height,
        borderRadius: 8,
        backgroundColor: "var(--card)",
        flexShrink: 0,
      }}
    />
  );
}

function RailSkeleton({ count = 4, cardWidth = 144, cardHeight = 200 }: { count?: number; cardWidth?: number; cardHeight?: number }) {
  return (
    <div className="flex gap-3" style={{ overflowX: "hidden", padding: "0 16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} width={cardWidth} height={cardHeight} />
      ))}
    </div>
  );
}

function RailError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ padding: "24px 16px", gap: 8 }}
    >
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-sm)",
          color: "var(--muted-foreground)",
        }}
      >
        Failed to load
      </span>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        style={{
          height: 32,
          paddingLeft: 16,
          paddingRight: 16,
          borderRadius: 8,
          border: "1px solid var(--border)",
          backgroundColor: "transparent",
          cursor: "pointer",
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--font-weight-medium)",
          color: "var(--foreground)",
        }}
      >
        Retry
      </motion.button>
    </div>
  );
}

// ─── BannerCarousel ───────────────────────────────────────────────────────────
function BannerCarousel() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { theme } = useTheme();

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

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        onPointerDown={handleUserInteraction}
        style={{
          overflow: "hidden",
          position: "relative",
          height: 168,
        }}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={active}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(${theme === "dark" ? DUMMY_BANNERS[active].gradient : DUMMY_BANNERS[active].gradientLight})`,
            }}
          >
            {/* right glow */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: 0, right: 0, bottom: 0, left: "40%",
                background: `radial-gradient(ellipse at right, ${DUMMY_BANNERS[active].accent}22 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />
            {/* ghost product icon */}
            {(() => {
              const SlideIcon = DUMMY_BANNERS[active].Icon;
              return (
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    right: -12,
                    bottom: -16,
                    opacity: 0.12,
                    pointerEvents: "none",
                  }}
                >
                  <SlideIcon style={{ width: 108, height: 108, color: "var(--foreground)", strokeWidth: 0.6 }} />
                </div>
              );
            })()}
            {/* content */}
            <div
              className="flex flex-col"
              style={{
                position: "absolute",
                inset: 0,
                padding: "20px",
                justifyContent: "space-between",
              }}
            >
              {/* top: tag */}
              <div
                style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  alignItems: "center",
                  height: 20,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 4,
                  backgroundColor: `${DUMMY_BANNERS[active].accent}22`,
                  border: `0.5px solid ${DUMMY_BANNERS[active].accent}55`,
                }}
              >
                <span
                  style={{
                    fontSize: "var(--text-2xs)",
                    fontWeight: 700,
                    color: DUMMY_BANNERS[active].accent,
                    letterSpacing: "0.06em",
                  }}
                >
                  {DUMMY_BANNERS[active].tag}
                </span>
              </div>
              {/* bottom: title + subtitle + CTA */}
              <div>
                <h3
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: 800,
                    // --foreground auto-flips: white on dark gradient (dark mode)
                    // → near-black on light pastel gradient (light mode). The
                    // explicit `theme === "dark"` ternary was reinventing what
                    // the token already does.
                    color: "var(--foreground)",
                    lineHeight: 1.2,
                    margin: "0 0 4px",
                  }}
                >
                  {DUMMY_BANNERS[active].title}
                </h3>
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--muted-foreground)",
                    margin: "0 0 8px",
                  }}
                >
                  {DUMMY_BANNERS[active].subtitle}
                </p>
                <button
                  style={{
                    height: 28,
                    paddingLeft: 14,
                    paddingRight: 14,
                    borderRadius: 9999,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: `${DUMMY_BANNERS[active].accent}`,
                    color: "var(--white)",
                    fontSize: "var(--text-2xs)",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {DUMMY_BANNERS[active].cta}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        {/* dots — inside card, bottom-right */}
        <div
          className="flex items-center"
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            gap: 4,
            pointerEvents: "none",
          }}
        >
          {DUMMY_BANNERS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === active ? 16 : 4,
                height: 4,
                borderRadius: 9999,
                backgroundColor: i === active
                  ? "var(--foreground)"
                  : "color-mix(in srgb, var(--foreground) 30%, transparent)",
                transition: "width 0.2s ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const [ageFilter, setAgeFilter] = useState<AgeFilter>("all");
  const [headerVisible, setHeaderVisible] = useState(true);
  const [railState, setRailState] = useState<"loading" | "error" | "loaded">("loaded");
  const lastScrollY = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(false);

  useEffect(() => {
    // AppLayout wraps <Outlet> in overflow-y-auto — window.scrollY is always 0.
    // Walk up from the root div to find the actual scroll container.
    let scrollEl: HTMLElement | Window = window;
    let node = rootRef.current?.parentElement ?? null;
    while (node) {
      const ov = window.getComputedStyle(node).overflowY;
      if (ov === "auto" || ov === "scroll") { scrollEl = node; break; }
      node = node.parentElement;
    }

    const getY = () =>
      scrollEl instanceof Window ? scrollEl.scrollY : (scrollEl as HTMLElement).scrollTop;

    // Lock prevents re-entrancy: when header collapses the DOM reflows,
    // changing scrollTop and firing a spurious "scroll up" event that
    // would immediately re-show the header.
    const lock = () => {
      lockedRef.current = true;
      setTimeout(() => { lockedRef.current = false; }, 400);
    };

    const onScroll = () => {
      if (lockedRef.current) return;
      const y = getY();
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;

      if (y < 10) {
        setHeaderVisible(true);
      } else if (delta > 8) {
        setHeaderVisible(false);
        lock();
      } else if (delta < -48) {
        setHeaderVisible(true);
        lock();
      }
    };
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, []);

  const AGE_FILTERS: { id: AgeFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "primary", label: "Grade 1–5" },
    { id: "secondary", label: "Grade 6–10" },
    { id: "class_1112", label: "Grade 11–12" },
    { id: "college", label: "College" },
    { id: "exam_prep", label: "Competitive" },
  ];

  const show = {
    flashDeals: ["all", "primary", "secondary", "class_1112"].includes(ageFilter),
    bestSellers: ["all", "secondary", "class_1112", "college", "exam_prep"].includes(ageFilter),
    partnerApps: ["all", "primary", "secondary", "class_1112"].includes(ageFilter),
    topCourses: ["all", "class_1112", "college", "exam_prep"].includes(ageFilter),
    summerCamp: ["all", "primary", "secondary"].includes(ageFilter),
    crashCourses: ["all", "primary", "secondary"].includes(ageFilter),
    books: ["all", "primary", "secondary", "class_1112"].includes(ageFilter),
    mockTests: ["all", "secondary", "class_1112", "exam_prep"].includes(ageFilter),
    skillCourses: ["all", "class_1112", "college", "exam_prep"].includes(ageFilter),
    music: ["all", "primary", "secondary", "college"].includes(ageFilter),
    labKits: ["all", "primary", "secondary"].includes(ageFilter),
    browseAll: true,
  };

  return (
    <div ref={rootRef} style={{ backgroundColor: "var(--background)", minHeight: "100vh" }}>

      {/* Sticky header — entire header stack pinned at top */}
      <div
        className="sticky top-0 z-20 shrink-0"
        style={{ backgroundColor: "var(--background)" }}
      >
        {/* StatusBar — always visible, never scrolls away */}
        <StatusBar />

        {/* Title row — collapses to 0 on scroll down, no mount animation */}
        <motion.div
          initial={false}
          style={{ overflow: "hidden" }}
          animate={{ height: headerVisible ? 64 : 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: "16px 16px", height: 64 }}
          >
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)" }}>
              Discover
            </span>
            <div className="flex items-center" style={{ gap: 8 }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/marketplace/wishlist")}
                aria-label="View wishlist"
                style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--border-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}
              >
                <Heart size={16} style={{ color: "var(--foreground)" }} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/marketplace/orders")}
                aria-label="View my orders"
                style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--border-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}
              >
                <Package size={16} style={{ color: "var(--foreground)" }} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/marketplace/cart")}
                aria-label="View cart"
                style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--border-secondary)", border: "1px solid var(--border)", cursor: "pointer", position: "relative" }}
              >
                <ShoppingCart size={16} style={{ color: "var(--foreground)" }} />
                <span style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: 9999, backgroundColor: "var(--primary-600)", color: "var(--white)", fontSize: "var(--text-2xs)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Search + tabs — always visible */}
        <div>
          {/* Search bar */}
          <div style={{ padding: "4px 16px 4px" }}>
            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate("/marketplace/search")}
              aria-label="Search marketplace"
              style={{
                width: "100%",
                height: 44,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 16px",
                backgroundColor: "var(--muted)",
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <Search size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
                Search courses, books, stationery...
              </span>
            </motion.button>
          </div>
          {/* Age filter tabs */}
          <div
            className="flex"
            style={{
              overflowX: "auto",
              padding: "0 16px",
              scrollbarWidth: "none",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {AGE_FILTERS.map((f) => (
              <motion.button
                key={f.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setAgeFilter(f.id)}
                style={{
                  flexShrink: 0,
                  padding: "12px 12px",
                  background: "none",
                  border: "none",
                  borderBottom: ageFilter === f.id ? "2px solid var(--primary-500)" : "2px solid transparent",
                  marginBottom: -1,
                  color: ageFilter === f.id ? "var(--primary-400)" : "var(--muted-foreground)",
                  fontSize: "var(--text-sm)",
                  fontWeight: ageFilter === f.id ? 600 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div>

        {/* Banner */}
        <BannerCarousel />

        {/* Shop by Category */}
        <div style={{ marginBottom: 24 }}>
          <SectionHeader title="Shop by Category" />
          <div
            className="flex gap-4"
            style={{ overflowX: "auto", padding: "0 16px 4px", scrollbarWidth: "none" }}
          >
            {CATEGORIES.map((cat) => (
              <CategoryTile
                key={cat.id}
                category={cat}
                onPress={() => navigate(cat.path)}
              />
            ))}
          </div>
        </div>

        {/* Flash Deals */}
        {show.flashDeals && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader
              title="Flash Deals"
              onSeeAll={() => navigate("/marketplace/category/flash-deals")}
            />
            <div
              className="flex gap-3"
              style={{ overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}
            >
              {DUMMY_FLASH_DEALS.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => navigate(`/marketplace/product/${product.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Best Sellers */}
        {show.bestSellers && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader
              title="Best Sellers"
              onSeeAll={() => navigate("/marketplace/category/best-sellers")}
            />
            <div
              className="flex gap-3"
              style={{ overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}
            >
              {DUMMY_BEST_SELLERS.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => navigate(`/marketplace/product/${product.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Partner Apps */}
        {show.partnerApps && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Partner Apps" onSeeAll={() => navigate("/marketplace/apps")} />
            <div
              className="flex gap-4"
              style={{ overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}
            >
              {DUMMY_PARTNER_APPS.map((app) => (
                <PartnerAppTile key={app.id} app={app} />
              ))}
            </div>
          </div>
        )}

        {/* Top Courses */}
        {show.topCourses && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Top Courses" onSeeAll={() => navigate("/marketplace/category/courses")} />
            {railState === "loading" ? (
              <RailSkeleton count={4} cardWidth={180} cardHeight={220} />
            ) : railState === "error" ? (
              <RailError onRetry={() => setRailState("loaded")} />
            ) : (
              <div
                className="flex gap-3"
                style={{ overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}
              >
                {DUMMY_OTHER_COURSES.flatMap((group) =>
                  group.courses.map((course) => {
                    const otherCourse: OtherCourse = {
                      id: course.id,
                      title: course.title,
                      subtitle: `${group.subjects.length} subjects · ${course.topics} topics`,
                      thumbBg: `linear-gradient(135deg, color-mix(in srgb, ${group.examAccent} 22%, var(--card)) 0%, color-mix(in srgb, ${group.examAccent} 32%, var(--card)) 100%)`,
                      thumbLabel: group.shortLabel,
                      thumbAccent: group.examAccent,
                      thumbMeta: course.plan,
                      rating: 4.7,
                      reviewCount: 300,
                      price: course.price,
                      originalPrice: course.originalPrice,
                    };
                    return (
                      <OtherCourseCard
                        key={course.id}
                        course={otherCourse}
                        onClick={() => navigate(`/marketplace/product/${course.id}`)}
                      />
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Summer Camp */}
        {show.summerCamp && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="AI Summer Camp" onSeeAll={() => navigate("/classes")} />
            <div
              className="flex gap-3"
              style={{ overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}
            >
              {DUMMY_SUMMER_CAMP_BATCHES.map((batch) => (
                <SummerCampProductCard
                  key={batch.track}
                  batch={batch}
                  onClick={() => navigate("/classes")}
                />
              ))}
            </div>
          </div>
        )}

        {/* Crash Courses */}
        {show.crashCourses && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Crash Courses" onSeeAll={() => navigate("/crash-course-detail")} />
            <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
              <OtherCourseCard course={CRASH_COURSE_CARD} onClick={() => navigate("/crash-course-detail")} />
            </div>
          </div>
        )}

        {/* Books */}
        {show.books && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Books" onSeeAll={() => navigate("/marketplace/category/books")} />
            {railState === "loading" ? (
              <RailSkeleton count={4} />
            ) : railState === "error" ? (
              <RailError onRetry={() => setRailState("loaded")} />
            ) : (
              <div
                className="flex gap-3"
                style={{ overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}
              >
                {DUMMY_BOOKS.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPress={() => navigate(`/marketplace/product/${product.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mock Tests */}
        {show.mockTests && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Mock Tests" onSeeAll={() => navigate("/marketplace/category/mock-tests")} />
            {railState === "loading" ? (
              <RailSkeleton count={4} cardWidth={200} />
            ) : railState === "error" ? (
              <RailError onRetry={() => setRailState("loaded")} />
            ) : (
              <div
                className="flex gap-3"
                style={{ overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}
              >
                {DUMMY_MOCK_TESTS.map((test) => (
                  <MockTestCard
                    key={test.id}
                    test={test}
                    onClick={() => navigate(`/marketplace/product/${test.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Music */}
        {show.music && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Music" onSeeAll={() => navigate("/marketplace/category/music")} />
            <div
              className="flex gap-3"
              style={{ overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}
            >
              {DUMMY_MUSIC_COURSES.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => navigate(`/marketplace/music/${product.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Skill Courses */}
        {show.skillCourses && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Skill Courses" onSeeAll={() => navigate("/marketplace/category/skill-courses")} />
            {railState === "loading" ? (
              <RailSkeleton count={4} />
            ) : railState === "error" ? (
              <RailError onRetry={() => setRailState("loaded")} />
            ) : (
              <div
                className="flex gap-3"
                style={{ overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}
              >
                {DUMMY_SKILL_COURSES.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPress={() => navigate(`/marketplace/product/${product.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lab Kits */}
        {show.labKits && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Lab Kits" onSeeAll={() => navigate("/marketplace/category/lab-kits")} />
            {railState === "loading" ? (
              <RailSkeleton count={4} />
            ) : railState === "error" ? (
              <RailError onRetry={() => setRailState("loaded")} />
            ) : (
              <div
                className="flex gap-3"
                style={{ overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}
              >
                {DUMMY_LAB_KITS.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPress={() => navigate(`/marketplace/product/${product.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Browse All — 2-col grid */}
        <div style={{ marginBottom: 24 }}>
          <SectionHeader title="Browse All" />
          <div
            className="grid grid-cols-2 gap-3"
            style={{ padding: "0 16px" }}
          >
            {DUMMY_BROWSE.map((product) => (
              <ProductGridCard
                key={product.id}
                product={product}
                onPress={() => navigate(`/marketplace/product/${product.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
