/**
 * Marketplace Home — v2
 * PM's structure: 5 main categories, each with its own subcategories.
 *
 * Main → Sub hierarchy:
 *
 *   Courses
 *     · Coding & STEM Live Classes
 *     · Foreign Language (French · German · Spanish)
 *     · JEE / NEET Coaching
 *     · Music Courses
 *     · Robotic Courses
 *
 *   Learning Apps
 *     · English Language Learning
 *     · Vocabulary Building (Classes 6–12, GRE, IELTS)
 *     · JEE / NEET Mock Tests & AI Analytics
 *     · Competitive Exams — Non-JEE/NEET (CA Foundation, CLAT, CUET, NIFT/NID)
 *     · Early Learning (Animated · Game-based)
 *     · Adaptive Academic Practice
 *
 *   Devices & Hardware
 *     · Learning Devices (Tablet, E-reader, Education Phone)
 *     · Early Learning Hardware
 *     · STEM / Robotics Kits (Physical)
 *
 *   Books & Study Material
 *     · Board Exam PYQs & Question Banks
 *     · Reference Books — Digital
 *     · Reference Books — Hardcopies
 *
 *   Stationery & Art Supplies
 *     · Notebooks & School Stationery
 *     · Craft & Project Supplies
 *     · Writing Instruments & Art Supplies
 *
 * Visual hierarchy
 *   - MainCategoryHeader: brand accent gradient bar + eyebrow micro-text + big title
 *   - SubsectionRail: smaller header with accent dot + horizontal scroll of cards
 *   - 5 top-of-page tiles act as anchor jumpers into each main section
 */

import { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Search, ShoppingCart, Heart, ChevronRight, Sparkles,
  GraduationCap, LayoutGrid, Cpu, BookOpen, PenLine,
  Languages, Code2, FlaskConical, Music2, Bot,
  MessageSquare, Type, ClipboardList, Scale, ToyBrick,
  Brain, Tablet, BookMarked, Wrench, Notebook, Scissors,
  PaintBucket,
} from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import { DUMMY_OTHER_COURSES, type OtherCourse } from "../shared/classroom-catalog";
import {
  PremiumBanner,
  PremiumThumbCard,
  PremiumPhotoCard,
  PremiumMockTestCard,
  AgeFilterStrip,
  type AgeFilterId,
  type Product,
  type MockTest,
} from "./marketplace-premium-cards";
import { MorphableCard } from "./marketplace-card-morph";

// ─── Main categories (PM's 5) ─────────────────────────────────────────────────

type MainCategoryId = "courses" | "learning-apps" | "devices" | "books" | "stationery";

interface MainCategory {
  id: MainCategoryId;
  label: string;       // full name (used in MainCategoryHeader)
  tileLabel: string;   // short name (used under top tiles — keeps 1 line)
  subtitle: string;
  Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
  accent: string;
  anchorId: string;
}

const MAIN_CATEGORIES: MainCategory[] = [
  {
    id: "courses",
    label: "Courses",
    tileLabel: "Courses",
    subtitle: "Live & cohort-based learning, taught by experts.",
    Icon: GraduationCap,
    accent: "#4a9eff",
    anchorId: "main-courses",
  },
  {
    id: "learning-apps",
    label: "Learning Apps",
    tileLabel: "Apps",
    subtitle: "Self-paced practice, mocks and AI-powered tutors.",
    Icon: LayoutGrid,
    accent: "#bf6fff",
    anchorId: "main-learning-apps",
  },
  {
    id: "devices",
    label: "Devices & Hardware",
    tileLabel: "Devices",
    subtitle: "Tablets, e-readers, robotics kits and more.",
    Icon: Cpu,
    accent: "#29d6d6",
    anchorId: "main-devices",
  },
  {
    id: "books",
    label: "Books & Study Material",
    tileLabel: "Books",
    subtitle: "PYQs, reference books — digital and print.",
    Icon: BookOpen,
    accent: "#ffa84a",
    anchorId: "main-books",
  },
  {
    id: "stationery",
    label: "Stationery & Art Supplies",
    tileLabel: "Stationery",
    subtitle: "Notebooks, writing tools and craft essentials.",
    Icon: PenLine,
    accent: "#ff6b9d",
    anchorId: "main-stationery",
  },
];

// ─── Subcategory definitions (icons + accents shared with MainCategory) ───────

interface Subcategory {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
  accent: string;
}

const SUBS: Record<MainCategoryId, Subcategory[]> = {
  "courses": [
    { id: "coding-stem",      label: "Coding & STEM Live Classes", Icon: Code2,        accent: "#4a9eff" },
    { id: "foreign-language", label: "Foreign Language",            Icon: Languages,    accent: "#5cdbd3" },
    { id: "jee-neet-coach",   label: "JEE / NEET Coaching",         Icon: FlaskConical, accent: "#ff8c42" },
    { id: "music-courses",    label: "Music",                       Icon: Music2,       accent: "#f06ac0" },
    { id: "robotic-courses",  label: "Robotic Courses",             Icon: Bot,          accent: "#ffd94a" },
  ],
  "learning-apps": [
    { id: "english-app",      label: "English Language Learning",   Icon: MessageSquare, accent: "#29d6d6" },
    { id: "vocab-app",        label: "Vocabulary Building",         Icon: Type,          accent: "#bf6fff" },
    { id: "jee-neet-mocks",   label: "JEE / NEET Mock Tests",       Icon: ClipboardList, accent: "#4a9eff" },
    { id: "competitive-exams",label: "Competitive Exams",           Icon: Scale,         accent: "#ff7a45" },
    { id: "early-learning",   label: "Early Learning Apps",         Icon: ToyBrick,      accent: "#ffd94a" },
    { id: "adaptive-app",     label: "Adaptive Academic Practice",  Icon: Brain,         accent: "#52c41a" },
  ],
  "devices": [
    { id: "learning-devices", label: "Learning Devices",            Icon: Tablet,        accent: "#4a9eff" },
    { id: "early-learning-hw",label: "Early Learning Hardware",     Icon: ToyBrick,      accent: "#ffd94a" },
    { id: "stem-kits",        label: "STEM / Robotics Kits",        Icon: Wrench,        accent: "#ff6b6b" },
  ],
  "books": [
    { id: "pyqs",             label: "Board Exam PYQs",             Icon: ClipboardList, accent: "#bf6fff" },
    { id: "ref-digital",      label: "Reference Books — Digital",   Icon: BookMarked,    accent: "#4a9eff" },
    { id: "ref-hardcopy",     label: "Reference Books — Hardcopy",  Icon: BookOpen,      accent: "#ffa84a" },
  ],
  "stationery": [
    { id: "notebooks",        label: "Notebooks & School Stationery",Icon: Notebook,     accent: "#4ad4ff" },
    { id: "craft",            label: "Craft & Project Supplies",    Icon: Scissors,      accent: "#ff6b9d" },
    { id: "writing-art",      label: "Writing Instruments & Art",   Icon: PaintBucket,   accent: "#ffd94a" },
  ],
};

// ─── Data for each subcategory ────────────────────────────────────────────────
// Reuses synth-card shape for Courses (PremiumThumbCard) and photo-card for
// physical products / books / stationery / devices.

// Courses → Coding & STEM Live Classes
const SYNTH_CODING: OtherCourse[] = [
  { id: "code-py-jr",     title: "Python for Juniors",          subtitle: "Class 6–8 · 12 weeks",  thumbLabel: "PY",  thumbBg: "", thumbAccent: "#4a9eff", thumbMeta: "12 weeks", thumbTag: "LIVE",   rating: 4.8, reviewCount: 1200, price: 1499, originalPrice: 2499 },
  { id: "code-webdev",    title: "Web Dev for Teens",           subtitle: "Class 9–12 · 16 weeks", thumbLabel: "WD",  thumbBg: "", thumbAccent: "#4a9eff", thumbMeta: "16 weeks", thumbTag: "LIVE",   rating: 4.7, reviewCount: 860,  price: 1999, originalPrice: 3499 },
  { id: "code-ai-stem",   title: "AI & Data for Class 11–12",   subtitle: "Cohort · 10 weeks",     thumbLabel: "AI",  thumbBg: "", thumbAccent: "#4a9eff", thumbMeta: "10 weeks", thumbTag: "COHORT", rating: 4.9, reviewCount: 540,  price: 2499, originalPrice: 3999 },
];

// Courses → Foreign Language
const SYNTH_LANG: OtherCourse[] = [
  { id: "lang-french",    title: "French A1 – B1",   subtitle: "Live · 24 sessions", thumbLabel: "FR", thumbBg: "", thumbAccent: "#5cdbd3", thumbMeta: "Live", rating: 4.8, reviewCount: 410, price: 2999, originalPrice: 4999 },
  { id: "lang-german",    title: "German Basics",    subtitle: "Live · 20 sessions", thumbLabel: "DE", thumbBg: "", thumbAccent: "#5cdbd3", thumbMeta: "Live", rating: 4.7, reviewCount: 340, price: 2799, originalPrice: 4599 },
  { id: "lang-spanish",   title: "Spanish A1 Conversational", subtitle: "Live · 18 sessions", thumbLabel: "ES", thumbBg: "", thumbAccent: "#5cdbd3", thumbMeta: "Live", rating: 4.8, reviewCount: 280, price: 2599, originalPrice: 3999 },
];

// Courses → JEE / NEET Coaching (uses real catalog)
const SYNTH_COACHING: OtherCourse[] = DUMMY_OTHER_COURSES.flatMap((g) =>
  g.courses.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: `${g.subjects.length} subjects · ${c.topics} topics`,
    thumbLabel: g.shortLabel,
    thumbBg: "",
    thumbAccent: g.examAccent,
    thumbMeta: c.plan,
    thumbTag: g.shortLabel,
    rating: 4.7,
    reviewCount: 320,
    price: c.price,
    originalPrice: c.originalPrice,
  }))
);

// Courses → Music (photo cards reused)
const PHOTO_MUSIC: Product[] = [
  { id: "piano-group",          title: "Piano / Keyboard",  subtitle: "Live Group Class · 4–12 Sessions", categoryId: "music", price: 1499, originalPrice: 2499, rating: 4.8, reviewCount: 312, isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg" },
  { id: "guitar-group",         title: "Guitar Learning",   subtitle: "Live Group Class · 4–12 Sessions", categoryId: "music", price: 1499, originalPrice: 2499, rating: 4.7, reviewCount: 184, isDigital: true, thumbImage: "/guitar-course.webp" },
  { id: "western-vocals-group", title: "Western Vocals",    subtitle: "Live Group Class · 4–12 Sessions", categoryId: "music", price: 1499, originalPrice: 2499, rating: 4.9, reviewCount: 468, isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg" },
  { id: "piano-self",           title: "Piano / Keyboard",  subtitle: "Self-Paced Video · 10 Songs",      categoryId: "music", price: 999,  originalPrice: 1999, rating: 4.7, reviewCount: 256, isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg" },
];

// Courses → Robotic Courses
const SYNTH_ROBOTICS: OtherCourse[] = [
  { id: "robo-junior",   title: "Robotics Junior · LEGO Mindstorms", subtitle: "Class 5–8 · 12 weeks",  thumbLabel: "RJ",  thumbBg: "", thumbAccent: "#ffd94a", thumbMeta: "Live cohort", thumbTag: "LIVE", rating: 4.8, reviewCount: 290, price: 3499, originalPrice: 5499 },
  { id: "robo-arduino",  title: "Robotics with Arduino",             subtitle: "Class 9–12 · 16 weeks", thumbLabel: "AR",  thumbBg: "", thumbAccent: "#ffd94a", thumbMeta: "Live cohort", thumbTag: "LIVE", rating: 4.7, reviewCount: 210, price: 3999, originalPrice: 6499 },
  { id: "robo-ai-stem",  title: "AI + Robotics Bootcamp",            subtitle: "Class 11–12 · 8 weeks", thumbLabel: "AI",  thumbBg: "", thumbAccent: "#ffd94a", thumbMeta: "Live cohort", thumbTag: "LIVE", rating: 4.9, reviewCount: 150, price: 4499, originalPrice: 6999 },
];

// Helper: brand-wash thumb background matching v1's recipe
const appThumbBg = (accent: string) =>
  `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, var(--card)) 0%, color-mix(in srgb, ${accent} 32%, var(--card)) 100%)`;

// Learning Apps → English Language Learning (v1 feature-card style)
const APP_ENGLISH: OtherCourse[] = [
  { id: "express-app",  title: "Express — AI English Coach",  subtitle: "Speaking practice · Live feedback",   thumbBg: appThumbBg("#29d6d6"), thumbLogo: "synth", thumbBrand: "Express",    thumbAccent: "#29d6d6", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
  { id: "elsa-speak",   title: "ELSA — Pronunciation Coach",  subtitle: "Speech recognition · Daily drills",   thumbBg: appThumbBg("#7a5cff"), thumbLogo: "synth", thumbBrand: "ELSA",       thumbAccent: "#7a5cff", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
  { id: "duolingo-app", title: "Duolingo — Bite-size English", subtitle: "Streak-based lessons · Gamified",    thumbBg: appThumbBg("#58cc02"), thumbLogo: "synth", thumbBrand: "Duolingo",   thumbAccent: "#58cc02", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
  { id: "speakx",       title: "SpeakX — Conversation Practice", subtitle: "Live partners · Roleplay drills", thumbBg: appThumbBg("#ff6b9d"), thumbLogo: "synth", thumbBrand: "SpeakX",     thumbAccent: "#ff6b9d", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
];

// Learning Apps → Vocabulary Building
const APP_VOCAB: OtherCourse[] = [
  { id: "magoosh-vocab", title: "Magoosh Vocab Builder",   subtitle: "Test prep word lists · Quizzes",   thumbBg: appThumbBg("#1e88e5"), thumbLogo: "synth", thumbBrand: "Magoosh", thumbAccent: "#1e88e5", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
  { id: "quizlet",       title: "Quizlet — Flashcards",    subtitle: "Smart cards · Memory games",       thumbBg: appThumbBg("#4257b2"), thumbLogo: "synth", thumbBrand: "Quizlet", thumbAccent: "#4257b2", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
  { id: "anki",          title: "Anki — Spaced Repetition", subtitle: "Long-term memory · Custom decks", thumbBg: appThumbBg("#0066cc"), thumbLogo: "synth", thumbBrand: "Anki",    thumbAccent: "#0066cc", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
];

// Learning Apps → JEE / NEET Mock Tests (synth mock cards)
const MOCKS_JEE_NEET: MockTest[] = [
  { id: "mt-jee", title: "JEE Mains Mock Series", examLabel: "JEE M", examAbbr: "JEE",  testCount: 20, questionCount: 1800, price: 599, originalPrice: 999,  accentColor: "#4096ff" },
  { id: "mt-neet",title: "NEET Mock Test Pack",   examLabel: "NEET",  examAbbr: "NEET", testCount: 30, questionCount: 5400, price: 699, originalPrice: 1199, accentColor: "#52c41a" },
];

// Learning Apps → Competitive Exams (Non-JEE/NEET)
const MOCKS_COMPETITIVE: MockTest[] = [
  { id: "mt-ca",   title: "CA Foundation Prep",  examLabel: "CA F", examAbbr: "CA",   testCount: 18, questionCount: 1400, price: 799, originalPrice: 1499, accentColor: "#ff7a45" },
  { id: "mt-clat", title: "CLAT Mock Series",    examLabel: "CLAT", examAbbr: "CLAT", testCount: 15, questionCount: 1200, price: 599, originalPrice: 1099, accentColor: "#9254de" },
  { id: "mt-cuet", title: "CUET Practice Pack",  examLabel: "CUET", examAbbr: "CUET", testCount: 22, questionCount: 1600, price: 499, originalPrice: 999,  accentColor: "#13c2c2" },
  { id: "mt-nift", title: "NIFT / NID Aptitude", examLabel: "NIFT", examAbbr: "NIFT", testCount: 12, questionCount: 800,  price: 699, originalPrice: 1399, accentColor: "#eb2f96" },
];

// Learning Apps → Early Learning
const APP_EARLY: OtherCourse[] = [
  { id: "khan-kids",    title: "Khan Academy Kids",    subtitle: "Reading · Math · Logic",       thumbBg: appThumbBg("#14bf96"), thumbLogo: "synth", thumbBrand: "Khan",        thumbAccent: "#14bf96", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
  { id: "byjus-kids",   title: "BYJU'S Early Learn",    subtitle: "Class 1–5 · Animated lessons", thumbBg: appThumbBg("#9013fe"), thumbLogo: "synth", thumbBrand: "BYJU'S",      thumbAccent: "#9013fe", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
  { id: "splash-learn", title: "SplashLearn — K–5",     subtitle: "Gamified Math & Reading",      thumbBg: appThumbBg("#ff6b6b"), thumbLogo: "synth", thumbBrand: "SplashLearn", thumbAccent: "#ff6b6b", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
];

// Learning Apps → Adaptive Practice
const APP_ADAPTIVE: OtherCourse[] = [
  { id: "embibe",   title: "Embibe — AI Test Prep",   subtitle: "Personalized for JEE/NEET",   thumbBg: appThumbBg("#ff5722"), thumbLogo: "synth", thumbBrand: "Embibe",   thumbAccent: "#ff5722", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
  { id: "doubtnut", title: "Doubtnut — Snap & Solve", subtitle: "Click a question · Get steps", thumbBg: appThumbBg("#1976d2"), thumbLogo: "synth", thumbBrand: "Doubtnut", thumbAccent: "#1976d2", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
  { id: "toppr",    title: "Toppr — Adaptive Practice", subtitle: "Daily MCQs · Mock series",   thumbBg: appThumbBg("#5e35b1"), thumbLogo: "synth", thumbBrand: "Toppr",    thumbAccent: "#5e35b1", rating: 0, reviewCount: 0, price: 0, originalPrice: 0 },
];

// Devices → Learning Devices
const DEV_LEARNING: Product[] = [
  { id: "dev-tab",    title: "iPad 10th Gen",       subtitle: "Wi-Fi · 64GB · Education pricing", categoryId: "stationery", price: 29900, originalPrice: 33900, rating: 4.8, reviewCount: 4200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=320&h=240&fit=crop" },
  { id: "dev-kindle", title: "Kindle Paperwhite",   subtitle: "16GB · Adjustable warm light",     categoryId: "stationery", price: 14999, originalPrice: 17999, rating: 4.7, reviewCount: 3100, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=320&h=240&fit=crop" },
  { id: "dev-phone",  title: "Education Phone",     subtitle: "Locked OS · Pre-installed apps",   categoryId: "stationery", price: 9999,  originalPrice: 12999, rating: 4.5, reviewCount: 680,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=320&h=240&fit=crop" },
];

// Devices → Early Learning Hardware
const DEV_EARLY: Product[] = [
  { id: "early-osmo",   title: "Osmo Genius Kit",   subtitle: "iPad-based · Ages 6–10",   categoryId: "stationery", price: 8499, originalPrice: 11999, rating: 4.7, reviewCount: 1200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1567168539593-59673ababaae?w=320&h=240&fit=crop" },
  { id: "early-leap",   title: "LeapFrog LeapPad",  subtitle: "Ages 4–7 · Pre-loaded",     categoryId: "stationery", price: 6499, originalPrice: 8999,  rating: 4.5, reviewCount: 850,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1503602642458-232111445657?w=320&h=240&fit=crop" },
  { id: "early-magna",  title: "Magna-Tiles 100pc", subtitle: "STEM toy · Ages 3+",        categoryId: "stationery", price: 4999, originalPrice: 6999,  rating: 4.9, reviewCount: 2300, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1558877385-8c1eef1c1f0a?w=320&h=240&fit=crop" },
];

// Devices → STEM / Robotics Kits
const DEV_STEM: Product[] = [
  { id: "kit-chem",  title: "Chemistry Lab Kit Pro",   subtitle: "30 experiments · JEE level", categoryId: "lab-kits", price: 1499, originalPrice: 2200, rating: 4.5, reviewCount: 1800, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=320&h=240&fit=crop" },
  { id: "kit-phys",  title: "Physics Lab Kit",         subtitle: "JEE level · 20 experiments", categoryId: "lab-kits", price: 1199, originalPrice: 1800, rating: 4.7, reviewCount: 890,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=320&h=240&fit=crop" },
  { id: "kit-bio",   title: "Biology Dissection Kit",  subtitle: "NEET prep · 15 tools",       categoryId: "lab-kits", price: 899,  originalPrice: 1400, rating: 4.4, reviewCount: 640,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=320&h=240&fit=crop" },
  { id: "kit-arduino",title: "Arduino Starter Kit",    subtitle: "50 components · Project guide", categoryId: "lab-kits", price: 1799, originalPrice: 2800, rating: 4.6, reviewCount: 520, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=320&h=240&fit=crop" },
];

// Books → Board Exam PYQs
const BOOKS_PYQS: Product[] = [
  { id: "pyq-cbse-10",  title: "CBSE Class 10 PYQs", subtitle: "Last 10 years · All subjects", categoryId: "books", price: 450, originalPrice: 650, rating: 4.7, reviewCount: 4400, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=320&h=240&fit=crop" },
  { id: "pyq-cbse-12",  title: "CBSE Class 12 PYQs", subtitle: "Last 10 years · All streams",  categoryId: "books", price: 480, originalPrice: 680, rating: 4.7, reviewCount: 3800, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=320&h=240&fit=crop" },
  { id: "pyq-jee-adv",  title: "JEE Advanced PYQs",  subtitle: "2010–2024 · Fully solved",     categoryId: "books", price: 580, originalPrice: 850, rating: 4.7, reviewCount: 4400, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=320&h=240&fit=crop" },
];

// Books → Reference Digital
const BOOKS_DIGITAL: Product[] = [
  { id: "dig-hc-1",   title: "HC Verma — Digital Ed.",  subtitle: "Concepts of Physics Vol. 1", categoryId: "books", price: 199, originalPrice: 399, rating: 4.8, reviewCount: 6200, isDigital: true, thumbImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=320&h=240&fit=crop" },
  { id: "dig-ncert",  title: "NCERT Biology XII (PDF)", subtitle: "Class 12 · Searchable",       categoryId: "books", price: 99,  originalPrice: 199, rating: 4.6, reviewCount: 8200, isDigital: true, thumbImage: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=320&h=240&fit=crop" },
  { id: "dig-arihant",title: "Arihant Math (e-Book)",   subtitle: "Class 11–12 combined",         categoryId: "books", price: 249, originalPrice: 499, rating: 4.5, reviewCount: 2400, isDigital: true, thumbImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=320&h=240&fit=crop" },
];

// Books → Reference Hardcopy
const BOOKS_HARDCOPY: Product[] = [
  { id: "hc-1",  title: "HC Verma Vol. 1",   subtitle: "Concepts of Physics", categoryId: "books", price: 280, originalPrice: 450, rating: 4.8, reviewCount: 12400, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=320&h=240&fit=crop" },
  { id: "hc-2",  title: "DC Pandey Mechanics",subtitle: "JEE Physics Vol. 1", categoryId: "books", price: 390, originalPrice: 550, rating: 4.8, reviewCount: 8200,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=320&h=240&fit=crop" },
  { id: "hc-3",  title: "OP Tandon Organic", subtitle: "IIT JEE Chemistry",   categoryId: "books", price: 420, originalPrice: 600, rating: 4.7, reviewCount: 6100,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=320&h=240&fit=crop" },
  { id: "hc-4",  title: "Wren & Martin",     subtitle: "English Grammar",     categoryId: "books", price: 340, originalPrice: 480, rating: 4.6, reviewCount: 6200,  isDigital: false, thumbImage: "https://covers.openlibrary.org/b/isbn/9789352535453-L.jpg" },
];

// Stationery → Notebooks
const STAT_NOTEBOOKS: Product[] = [
  { id: "nb-classmate",title: "Classmate Notebook Pack",subtitle: "6-in-1 · 172 pages each", categoryId: "stationery", price: 180, originalPrice: 280, rating: 4.4, reviewCount: 5600, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=320&h=240&fit=crop" },
  { id: "nb-a4-grid",  title: "A4 Grid Notebooks",      subtitle: "Pack of 3 · 200 pages",   categoryId: "stationery", price: 120, originalPrice: 180, rating: 4.3, reviewCount: 3200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=320&h=240&fit=crop" },
  { id: "nb-leuchtt",  title: "Leuchtturm1917 Hardcover",subtitle: "A5 · Dotted · 251 pages", categoryId: "stationery", price: 1499,originalPrice: 1899,rating: 4.9, reviewCount: 1200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=320&h=240&fit=crop" },
];

// Stationery → Craft & Project Supplies
const STAT_CRAFT: Product[] = [
  { id: "craft-card",  title: "Color Card Stock Pack", subtitle: "50 sheets · A4 · 12 colors", categoryId: "stationery", price: 240, originalPrice: 360, rating: 4.5, reviewCount: 1600, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=320&h=240&fit=crop" },
  { id: "craft-glue",  title: "Glue Gun + 20 Sticks",  subtitle: "Low-temp · For school projects", categoryId: "stationery", price: 320, originalPrice: 480, rating: 4.4, reviewCount: 920,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=320&h=240&fit=crop" },
  { id: "craft-scissors",title:"Safety Scissors Pack", subtitle: "3 sizes · Rounded tip",       categoryId: "stationery", price: 180, originalPrice: 260, rating: 4.3, reviewCount: 740,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=320&h=240&fit=crop" },
];

// Stationery → Writing Instruments & Art
const STAT_WRITING: Product[] = [
  { id: "wr-staedtler", title: "Staedtler Geometry Box", subtitle: "Full set · Pro grade",        categoryId: "stationery", price: 220, originalPrice: 380, rating: 4.5, reviewCount: 3400, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=320&h=240&fit=crop" },
  { id: "wr-casio",     title: "Casio FX-991EX",         subtitle: "Scientific calculator",       categoryId: "stationery", price: 1250,originalPrice: 1600,rating: 4.9, reviewCount: 7800, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=320&h=240&fit=crop" },
  { id: "wr-pencils",   title: "Faber-Castell 24 Pencils",subtitle: "Color pencils · Watercolor", categoryId: "stationery", price: 380, originalPrice: 580, rating: 4.7, reviewCount: 2900, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=320&h=240&fit=crop" },
  { id: "wr-acrylic",   title: "Acrylic Paint Set 12",   subtitle: "Beginner-friendly · 12 tubes",categoryId: "stationery", price: 420, originalPrice: 640, rating: 4.6, reviewCount: 1400, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=320&h=240&fit=crop" },
];

// ─── Per-age visibility ───────────────────────────────────────────────────────

function visibleForAge(age: AgeFilterId, subId: string): boolean {
  // Defaults to true (most subs apply to most ages); only narrow when there's
  // a clear mismatch.
  const map: Record<string, AgeFilterId[]> = {
    "coding-stem":       ["all", "secondary", "class_1112"],
    "foreign-language":  ["all", "secondary", "class_1112", "college"],
    "jee-neet-coach":    ["all", "class_1112", "exam_prep"],
    "music-courses":     ["all", "primary", "secondary", "college"],
    "robotic-courses":   ["all", "primary", "secondary"],
    "english-app":       ["all", "primary", "secondary", "class_1112", "college"],
    "vocab-app":         ["all", "secondary", "class_1112", "college", "exam_prep"],
    "jee-neet-mocks":    ["all", "class_1112", "exam_prep"],
    "competitive-exams": ["all", "class_1112", "college", "exam_prep"],
    "early-learning":    ["all", "primary"],
    "adaptive-app":      ["all", "primary", "secondary", "class_1112"],
    "learning-devices":  ["all", "primary", "secondary", "class_1112"],
    "early-learning-hw": ["all", "primary"],
    "stem-kits":         ["all", "primary", "secondary", "class_1112"],
    "pyqs":              ["all", "secondary", "class_1112"],
    "ref-digital":       ["all", "secondary", "class_1112", "college", "exam_prep"],
    "ref-hardcopy":      ["all", "secondary", "class_1112", "college", "exam_prep"],
    "notebooks":         ["all", "primary", "secondary", "class_1112", "college"],
    "craft":             ["all", "primary", "secondary"],
    "writing-art":       ["all", "primary", "secondary", "class_1112"],
  };
  return (map[subId] ?? ["all"]).includes(age);
}

// ─── Goal-based picks (Pattern 1, edtech-style) ──────────────────────────────
// What "Pattern 1" means: every serious edtech app (Unacademy, BYJU's, Vedantu,
// PW, Embibe) asks "what are you preparing for?" and curates the homepage to
// that goal. We capture the goal inline (localStorage) since onboarding data
// isn't wired through to this screen.

type GoalId = "jee" | "neet" | "cat" | "upsc" | "gate" | "boards" | "skills" | "early";

interface GoalOption {
  id: GoalId;
  label: string;       // chip label
  shortLabel: string;  // for the "Picks for your X prep" copy
  accent: string;
}

const GOALS: GoalOption[] = [
  { id: "jee",    label: "JEE",            shortLabel: "JEE",            accent: "#4a9eff" },
  { id: "neet",   label: "NEET",           shortLabel: "NEET",           accent: "#52c41a" },
  { id: "cat",    label: "CAT",            shortLabel: "CAT",            accent: "#ff8c42" },
  { id: "upsc",   label: "UPSC",           shortLabel: "UPSC",           accent: "#ffa84a" },
  { id: "gate",   label: "GATE",           shortLabel: "GATE",           accent: "#13c2c2" },
  { id: "boards", label: "Boards",         shortLabel: "Board exams",    accent: "#bf6fff" },
  { id: "skills", label: "Skills",         shortLabel: "Skills",         accent: "#5cdbd3" },
  { id: "early",  label: "Early Learning", shortLabel: "Early Learning", accent: "#ff6b6b" },
];

// Hand-curated card IDs per goal — picks individual cards across categories
// (not subcategories). This is the real personalization payoff: a Class 11 NEET
// student doesn't get Python for Juniors just because the sub matches.
const GOAL_PICKS: Record<GoalId, string[]> = {
  jee:    ["mt-jee", "pyq-jee-adv", "dig-hc-1", "hc-2", "embibe", "doubtnut", "code-ai-stem"],
  neet:   ["mt-neet", "dig-ncert", "kit-bio", "embibe", "doubtnut", "pyq-cbse-12", "dig-hc-1"],
  cat:    ["magoosh-vocab", "express-app", "speakx", "quizlet", "anki", "elsa-speak"],
  upsc:   ["dig-ncert", "magoosh-vocab", "hc-3", "anki", "doubtnut"],
  gate:   ["dig-hc-1", "hc-2", "dig-arihant", "embibe", "doubtnut", "code-ai-stem"],
  boards: ["pyq-cbse-10", "pyq-cbse-12", "dig-ncert", "dig-hc-1", "embibe", "doubtnut", "toppr"],
  skills: ["code-py-jr", "code-webdev", "code-ai-stem", "lang-french", "lang-spanish", "robo-arduino", "express-app"],
  early:  ["khan-kids", "byjus-kids", "splash-learn", "early-osmo", "early-leap", "robo-junior"],
};

const GOAL_STORAGE_KEY = "marketplace-v2-goal";

// ─── BrowseDivider — separator between picks and the structured catalog ─────

function BrowseDivider() {
  return (
    <div
      className="flex items-center"
      style={{ paddingLeft: 16, paddingRight: 16, marginTop: 16, gap: 12 }}
    >
      <div style={{ flex: 1, height: 0.5, backgroundColor: "var(--border)" }} />
      <span style={{
        fontSize: "var(--text-2xs)",
        fontWeight: 700,
        color: "var(--muted-foreground)",
        letterSpacing: 0.8,
        textTransform: "uppercase",
      }}>
        Browse by category
      </span>
      <div style={{ flex: 1, height: 0.5, backgroundColor: "var(--border)" }} />
    </div>
  );
}

// ─── GoalPicker — inline goal capture; shown only when no goal is set ────────
// Sits in place of the curated picks rail until the user picks their goal,
// then collapses away. Persists to localStorage so it doesn't re-prompt.

function GoalPicker({ onPick }: { onPick: (id: GoalId) => void }) {
  return (
    <div style={{ paddingLeft: 16, paddingRight: 16, marginTop: 24, marginBottom: 12 }}>
      <div
        style={{
          position: "relative",
          borderRadius: 16,
          padding: "20px 16px 16px",
          background: "linear-gradient(160deg, color-mix(in srgb, var(--primary) 12%, var(--card)) 0%, var(--card) 65%)",
          border: "0.5px solid color-mix(in srgb, var(--primary) 25%, transparent)",
          boxShadow: [
            "inset 0 0.5px 0 rgba(255,255,255,0.08)",
            "0 1px 2px rgba(0,0,0,0.16)",
            "0 8px 18px color-mix(in srgb, var(--primary) 12%, transparent)",
          ].join(", "),
          overflow: "hidden",
        }}
      >
        <div aria-hidden style={{
          position: "absolute", top: -40, right: -40, width: 160, height: 160,
          borderRadius: "50%",
          background: "radial-gradient(circle, color-mix(in srgb, var(--primary) 40%, transparent) 0%, transparent 70%)",
          filter: "blur(20px)", opacity: 0.6, pointerEvents: "none",
        }} />

        <div className="flex items-center" style={{ gap: 6, marginBottom: 4, position: "relative" }}>
          <Sparkles size={12} style={{ color: "var(--primary)" }} />
          <span style={{
            fontSize: "var(--text-2xs)", fontWeight: 700,
            color: "var(--primary)", letterSpacing: 0.6, textTransform: "uppercase",
          }}>
            Make it personal
          </span>
        </div>
        <h2 style={{
          fontSize: 18, fontWeight: 800, color: "var(--foreground)",
          margin: 0, letterSpacing: "-0.01em", lineHeight: 1.2, position: "relative",
        }}>
          What are you preparing for?
        </h2>
        <p style={{
          fontSize: "var(--text-xs)", color: "var(--muted-foreground)",
          margin: "4px 0 14px 0", lineHeight: 1.4, position: "relative",
        }}>
          We'll surface what actually moves the needle for your goal.
        </p>

        <div
          className="flex"
          style={{ gap: 8, overflowX: "auto", scrollbarWidth: "none", marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}
        >
          {GOALS.map((g) => (
            <motion.button
              key={g.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPick(g.id)}
              style={{
                flexShrink: 0,
                paddingLeft: 14, paddingRight: 14, height: 34,
                borderRadius: 9999,
                backgroundColor: `color-mix(in srgb, ${g.accent} 14%, var(--card))`,
                border: `0.5px solid ${g.accent}55`,
                boxShadow: [
                  "inset 0 0.5px 0 rgba(255,255,255,0.08)",
                  `0 2px 6px ${g.accent}1c`,
                ].join(", "),
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                color: g.accent,
                letterSpacing: 0.2,
              }}
            >
              {g.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── GoalHeader — header for the curated picks rail once goal is set ─────────

function GoalHeader({ goal }: { goal: GoalOption }) {
  return (
    <div
      style={{
        position: "relative",
        marginTop: 24,
        marginBottom: 12,
        paddingLeft: 16, paddingRight: 16, paddingTop: 16,
      }}
    >
      <div aria-hidden style={{
        position: "absolute",
        top: 0, left: -20, width: 200, height: 70,
        background: `radial-gradient(ellipse at left, ${goal.accent}26 0%, transparent 70%)`,
        filter: "blur(20px)", pointerEvents: "none",
      }} />

      <div className="flex items-center" style={{ gap: 12, position: "relative", minWidth: 0 }}>
        <div
          aria-hidden
          style={{
            width: 4, height: 28, borderRadius: 4, flexShrink: 0,
            background: `linear-gradient(180deg, ${goal.accent} 0%, color-mix(in srgb, ${goal.accent} 60%, transparent) 100%)`,
            boxShadow: `0 0 12px ${goal.accent}66`,
          }}
        />
        <h2 style={{
          fontSize: 20, fontWeight: 800, color: "var(--foreground)",
          margin: 0, letterSpacing: "-0.02em", lineHeight: 1.15,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          Picks for you
        </h2>
      </div>
    </div>
  );
}

// ─── MainCategoryHeader — clean section break with accent bar ─────────────────

function MainCategoryHeader({ category }: { category: MainCategory }) {
  return (
    <div
      id={category.anchorId}
      style={{
        position: "relative",
        marginTop: 20,
        marginBottom: 8,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 12,
        borderTop: "0.5px solid color-mix(in srgb, var(--border) 40%, transparent)",
      }}
    >
      {/* Subtle brand-tinted halo behind */}
      <div aria-hidden style={{
        position: "absolute",
        top: -16, left: -20, width: 180, height: 80,
        background: `radial-gradient(ellipse at left, ${category.accent}1a 0%, transparent 70%)`,
        filter: "blur(18px)",
        pointerEvents: "none",
      }} />

      <div className="flex items-center" style={{ gap: 12, position: "relative" }}>
        {/* Brand accent gradient bar */}
        <div
          aria-hidden
          style={{
            width: 4, height: 28,
            borderRadius: 4,
            background: `linear-gradient(180deg, ${category.accent} 0%, color-mix(in srgb, ${category.accent} 40%, transparent) 100%)`,
            boxShadow: `0 0 10px ${category.accent}88`,
            flexShrink: 0,
          }}
        />
        <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 800,
            color: "var(--foreground)",
            margin: 0,
            letterSpacing: "-0.015em",
            lineHeight: 1.2,
          }}>
            {category.label}
          </h2>
          <p style={{
            fontSize: "var(--text-xs)",
            color: "var(--muted-foreground)",
            margin: 0,
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {category.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── SubsectionRailHeader — clean text rail header (no icon tile) ─────────────

function SubsectionRailHeader({ sub, count, onSeeAll, showSeeAll = true }: { sub: Subcategory; count?: number; onSeeAll?: () => void; showSeeAll?: boolean }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 10, marginTop: 20 }}
    >
      <div className="flex items-baseline" style={{ gap: 6, minWidth: 0 }}>
        <h3 style={{
          fontSize: "var(--text-base)",
          fontWeight: 700,
          color: "var(--foreground)",
          margin: 0,
          letterSpacing: "-0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {sub.label}
        </h3>
        {count !== undefined && (
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)", flexShrink: 0 }}>
            ({count})
          </span>
        )}
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          disabled={!showSeeAll}
          aria-hidden={!showSeeAll}
          tabIndex={showSeeAll ? 0 : -1}
          className="flex items-center shrink-0"
          style={{
            gap: 2, background: "transparent", border: "none",
            cursor: showSeeAll ? "pointer" : "default", padding: 0, fontFamily: "inherit",
            opacity: showSeeAll ? 1 : 0,
            transform: showSeeAll ? "translateX(0)" : "translateX(4px)",
            pointerEvents: showSeeAll ? "auto" : "none",
            transition: "opacity 0.22s ease, transform 0.22s ease",
          }}
        >
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--primary)" }}>
            See all
          </span>
          <ChevronRight size={12} style={{ color: "var(--primary)" }} />
        </button>
      )}
    </div>
  );
}

// ─── RailSection — header + scrollable rail; reveals See all once scrolled ───

function RailSection({
  sub,
  count,
  onSeeAll,
  children,
}: {
  sub: Subcategory;
  count?: number;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollLeft > 24);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <SubsectionRailHeader sub={sub} count={count} onSeeAll={onSeeAll} showSeeAll={scrolled} />
      <div
        ref={ref}
        className="flex"
        style={{
          gap: 12, paddingLeft: 16, paddingRight: 16,
          overflowX: "auto", scrollbarWidth: "none",
          scrollPaddingLeft: 16, scrollPaddingRight: 16,
        }}
      >
        {children}
      </div>
    </>
  );
}

// ─── MainCategoryTile — 5 anchor jumpers at top of page ───────────────────────

function MainCategoryTile({ category, onPress }: { category: MainCategory; onPress: () => void }) {
  const { Icon, accent } = category;
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onPress}
      className="flex flex-col items-center shrink-0"
      style={{
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        width: 64,
        scrollSnapAlign: "start",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 60, height: 60, borderRadius: 16,
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 14%, #0a0408) 0%, color-mix(in srgb, ${accent} 28%, #0a0408) 50%, color-mix(in srgb, ${accent} 36%, #0a0408) 100%)`,
          border: `0.5px solid ${accent}50`,
          boxShadow: [
            "inset 0 0.5px 0 rgba(255,255,255,0.32)",
            `inset 0 1.5px 0 ${accent}38`,
            "inset 0 -0.5px 0 rgba(0,0,0,0.5)",
            `0 4px 12px ${accent}28`,
            `0 0 18px ${accent}1c`,
          ].join(", "),
        }}
      >
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(135deg, ${accent}26 0%, transparent 100%)`,
          pointerEvents: "none",
        }} />
        <div aria-hidden style={{
          position: "absolute", top: -18, right: -18, width: 56, height: 56,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          filter: "blur(8px)", opacity: 0.52, pointerEvents: "none",
        }} />
        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
        <Icon
          size={26}
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
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 64,
      }}>
        {category.tileLabel}
      </span>
    </motion.button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Component() {
  const navigate = useNavigate();
  const [age, setAge] = useState<AgeFilterId>("all");
  // Default to JEE so the curated rail shows directly without the picker prompt.
  // User can still hit "Change" on the rail header to swap goals.
  const [goalId, setGoalId] = useState<GoalId | null>("jee");
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(false);

  // Hydrate goal from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(GOAL_STORAGE_KEY);
    if (saved && GOALS.some((g) => g.id === saved)) {
      setGoalId(saved as GoalId);
    }
  }, []);

  const pickGoal = (id: GoalId) => {
    setGoalId(id);
    localStorage.setItem(GOAL_STORAGE_KEY, id);
  };

  // Title-row collapse on scroll
  useEffect(() => {
    let scrollEl: HTMLElement | Window = window;
    let node = rootRef.current?.parentElement ?? null;
    while (node) {
      const ov = window.getComputedStyle(node).overflowY;
      if (ov === "auto" || ov === "scroll") { scrollEl = node; break; }
      node = node.parentElement;
    }
    const getY = () => scrollEl instanceof Window ? scrollEl.scrollY : (scrollEl as HTMLElement).scrollTop;
    const lock = () => { lockedRef.current = true; setTimeout(() => { lockedRef.current = false; }, 400); };
    const onScroll = () => {
      if (lockedRef.current) return;
      const y = getY();
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;
      if (y < 10) setHeaderVisible(true);
      else if (delta > 8) { setHeaderVisible(false); lock(); }
      else if (delta < -48) { setHeaderVisible(true); lock(); }
    };
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToMain = (anchorId: string) => {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Dispatch a subcategory ID to its <RailSection> render. Lives inside the
  // Component so both the For You stripe and the structured Browse-by-Category
  // section can call it with no duplication.
  const renderSub = (subId: string): React.ReactNode => {
    switch (subId) {
      case "coding-stem":
        return (
          <RailSection sub={SUBS["courses"][0]} count={SYNTH_CODING.length} onSeeAll={() => navigate("/marketplace/category/courses")}>
            {SYNTH_CODING.map((c) => (
              <MorphableCard key={c.id} data={{ type: "thumb", data: c, onView: () => navigate(`/marketplace/product/${c.id}`) }}><PremiumThumbCard course={c} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "foreign-language":
        return (
          <RailSection sub={SUBS["courses"][1]} count={SYNTH_LANG.length} onSeeAll={() => navigate("/marketplace/category/courses")}>
            {SYNTH_LANG.map((c) => (
              <MorphableCard key={c.id} data={{ type: "thumb", data: c, onView: () => navigate(`/marketplace/product/${c.id}`) }}><PremiumThumbCard course={c} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "jee-neet-coach":
        return (
          <RailSection sub={SUBS["courses"][2]} count={SYNTH_COACHING.length} onSeeAll={() => navigate("/marketplace/category/courses")}>
            {SYNTH_COACHING.map((c) => (
              <MorphableCard key={c.id} data={{ type: "thumb", data: c, onView: () => navigate(`/marketplace/product/${c.id}`) }}><PremiumThumbCard course={c} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "music-courses":
        return (
          <RailSection sub={SUBS["courses"][3]} count={PHOTO_MUSIC.length} onSeeAll={() => navigate("/marketplace/category/music")}>
            {PHOTO_MUSIC.map((p) => (
              <MorphableCard key={p.id} data={{ type: "photo", data: p, onView: () => navigate(`/marketplace/music/${p.id}`) }}><PremiumPhotoCard product={p} onPress={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "robotic-courses":
        return (
          <RailSection sub={SUBS["courses"][4]} count={SYNTH_ROBOTICS.length} onSeeAll={() => navigate("/marketplace/category/courses")}>
            {SYNTH_ROBOTICS.map((c) => (
              <MorphableCard key={c.id} data={{ type: "thumb", data: c, onView: () => navigate(`/marketplace/product/${c.id}`) }}><PremiumThumbCard course={c} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "english-app":
        return (
          <RailSection sub={SUBS["learning-apps"][0]} count={APP_ENGLISH.length} onSeeAll={() => navigate("/marketplace/apps")}>
            {APP_ENGLISH.map((app) => (
              <MorphableCard key={app.id} data={{ type: "thumb", data: app, onView: () => navigate("/marketplace/apps") }}><PremiumThumbCard course={app} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "vocab-app":
        return (
          <RailSection sub={SUBS["learning-apps"][1]} count={APP_VOCAB.length} onSeeAll={() => navigate("/marketplace/apps")}>
            {APP_VOCAB.map((app) => (
              <MorphableCard key={app.id} data={{ type: "thumb", data: app, onView: () => navigate("/marketplace/apps") }}><PremiumThumbCard course={app} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "jee-neet-mocks":
        return (
          <RailSection sub={SUBS["learning-apps"][2]} count={MOCKS_JEE_NEET.length} onSeeAll={() => navigate("/marketplace/category/mock-tests")}>
            {MOCKS_JEE_NEET.map((t) => (
              <MorphableCard key={t.id} data={{ type: "mock", data: t, onView: () => navigate(`/marketplace/product/${t.id}`) }}><PremiumMockTestCard test={t} onClick={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "competitive-exams":
        return (
          <RailSection sub={SUBS["learning-apps"][3]} count={MOCKS_COMPETITIVE.length} onSeeAll={() => navigate("/marketplace/category/mock-tests")}>
            {MOCKS_COMPETITIVE.map((t) => (
              <MorphableCard key={t.id} data={{ type: "mock", data: t, onView: () => navigate(`/marketplace/product/${t.id}`) }}><PremiumMockTestCard test={t} onClick={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "early-learning":
        return (
          <RailSection sub={SUBS["learning-apps"][4]} count={APP_EARLY.length} onSeeAll={() => navigate("/marketplace/apps")}>
            {APP_EARLY.map((app) => (
              <MorphableCard key={app.id} data={{ type: "thumb", data: app, onView: () => navigate("/marketplace/apps") }}><PremiumThumbCard course={app} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "adaptive-app":
        return (
          <RailSection sub={SUBS["learning-apps"][5]} count={APP_ADAPTIVE.length} onSeeAll={() => navigate("/marketplace/apps")}>
            {APP_ADAPTIVE.map((app) => (
              <MorphableCard key={app.id} data={{ type: "thumb", data: app, onView: () => navigate("/marketplace/apps") }}><PremiumThumbCard course={app} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "learning-devices":
        return (
          <RailSection sub={SUBS["devices"][0]} count={DEV_LEARNING.length} onSeeAll={() => navigate("/marketplace/category/devices")}>
            {DEV_LEARNING.map((p) => (
              <MorphableCard key={p.id} data={{ type: "photo", data: p, onView: () => navigate(`/marketplace/product/${p.id}`) }}><PremiumPhotoCard product={p} onPress={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "early-learning-hw":
        return (
          <RailSection sub={SUBS["devices"][1]} count={DEV_EARLY.length} onSeeAll={() => navigate("/marketplace/category/devices")}>
            {DEV_EARLY.map((p) => (
              <MorphableCard key={p.id} data={{ type: "photo", data: p, onView: () => navigate(`/marketplace/product/${p.id}`) }}><PremiumPhotoCard product={p} onPress={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "stem-kits":
        return (
          <RailSection sub={SUBS["devices"][2]} count={DEV_STEM.length} onSeeAll={() => navigate("/marketplace/category/lab-kits")}>
            {DEV_STEM.map((p) => (
              <MorphableCard key={p.id} data={{ type: "photo", data: p, onView: () => navigate(`/marketplace/product/${p.id}`) }}><PremiumPhotoCard product={p} onPress={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "pyqs":
        return (
          <RailSection sub={SUBS["books"][0]} count={BOOKS_PYQS.length} onSeeAll={() => navigate("/marketplace/category/books")}>
            {BOOKS_PYQS.map((p) => (
              <MorphableCard key={p.id} data={{ type: "photo", data: p, onView: () => navigate(`/marketplace/product/${p.id}`) }}><PremiumPhotoCard product={p} onPress={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "ref-digital":
        return (
          <RailSection sub={SUBS["books"][1]} count={BOOKS_DIGITAL.length} onSeeAll={() => navigate("/marketplace/category/books")}>
            {BOOKS_DIGITAL.map((p) => (
              <MorphableCard key={p.id} data={{ type: "photo", data: p, onView: () => navigate(`/marketplace/product/${p.id}`) }}><PremiumPhotoCard product={p} onPress={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "ref-hardcopy":
        return (
          <RailSection sub={SUBS["books"][2]} count={BOOKS_HARDCOPY.length} onSeeAll={() => navigate("/marketplace/category/books")}>
            {BOOKS_HARDCOPY.map((p) => (
              <MorphableCard key={p.id} data={{ type: "photo", data: p, onView: () => navigate(`/marketplace/product/${p.id}`) }}><PremiumPhotoCard product={p} onPress={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "notebooks":
        return (
          <RailSection sub={SUBS["stationery"][0]} count={STAT_NOTEBOOKS.length} onSeeAll={() => navigate("/marketplace/category/stationery")}>
            {STAT_NOTEBOOKS.map((p) => (
              <MorphableCard key={p.id} data={{ type: "photo", data: p, onView: () => navigate(`/marketplace/product/${p.id}`) }}><PremiumPhotoCard product={p} onPress={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "craft":
        return (
          <RailSection sub={SUBS["stationery"][1]} count={STAT_CRAFT.length} onSeeAll={() => navigate("/marketplace/category/stationery")}>
            {STAT_CRAFT.map((p) => (
              <MorphableCard key={p.id} data={{ type: "photo", data: p, onView: () => navigate(`/marketplace/product/${p.id}`) }}><PremiumPhotoCard product={p} onPress={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      case "writing-art":
        return (
          <RailSection sub={SUBS["stationery"][2]} count={STAT_WRITING.length} onSeeAll={() => navigate("/marketplace/category/stationery")}>
            {STAT_WRITING.map((p) => (
              <MorphableCard key={p.id} data={{ type: "photo", data: p, onView: () => navigate(`/marketplace/product/${p.id}`) }}><PremiumPhotoCard product={p} onPress={() => { /* handled by MorphableCard */ }} /></MorphableCard>
            ))}
          </RailSection>
        );
      default:
        return null;
    }
  };

  // Card-level dispatch for the goal-driven curated rail. Given an ID, finds
  // the card in whichever data array owns it and renders the right component.
  const renderCardById = (id: string): React.ReactNode => {
    const synthCourse =
      SYNTH_CODING.find((c) => c.id === id) ??
      SYNTH_LANG.find((c) => c.id === id) ??
      SYNTH_COACHING.find((c) => c.id === id) ??
      SYNTH_ROBOTICS.find((c) => c.id === id) ??
      APP_ENGLISH.find((c) => c.id === id) ??
      APP_VOCAB.find((c) => c.id === id) ??
      APP_EARLY.find((c) => c.id === id) ??
      APP_ADAPTIVE.find((c) => c.id === id);
    if (synthCourse) {
      return (
        <MorphableCard key={id} data={{ type: "thumb", data: synthCourse, onView: () => navigate(`/marketplace/product/${id}`) }}>
          <PremiumThumbCard course={synthCourse} />
        </MorphableCard>
      );
    }
    const mock =
      MOCKS_JEE_NEET.find((m) => m.id === id) ??
      MOCKS_COMPETITIVE.find((m) => m.id === id);
    if (mock) {
      return (
        <MorphableCard key={id} data={{ type: "mock", data: mock, onView: () => navigate(`/marketplace/product/${id}`) }}>
          <PremiumMockTestCard test={mock} onClick={() => { /* handled by MorphableCard */ }} />
        </MorphableCard>
      );
    }
    const product =
      PHOTO_MUSIC.find((p) => p.id === id) ??
      DEV_LEARNING.find((p) => p.id === id) ??
      DEV_EARLY.find((p) => p.id === id) ??
      DEV_STEM.find((p) => p.id === id) ??
      BOOKS_PYQS.find((p) => p.id === id) ??
      BOOKS_DIGITAL.find((p) => p.id === id) ??
      BOOKS_HARDCOPY.find((p) => p.id === id) ??
      STAT_NOTEBOOKS.find((p) => p.id === id) ??
      STAT_CRAFT.find((p) => p.id === id) ??
      STAT_WRITING.find((p) => p.id === id);
    if (product) {
      return (
        <MorphableCard key={id} data={{ type: "photo", data: product, onView: () => navigate(`/marketplace/product/${id}`) }}>
          <PremiumPhotoCard product={product} onPress={() => { /* handled by MorphableCard */ }} />
        </MorphableCard>
      );
    }
    return null;
  };

  return (
    <div
      ref={rootRef}
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        minHeight: "100vh",
      }}
    >
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 shrink-0"
        style={{
          backgroundColor: "var(--background)",
          borderBottom: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
        }}
      >
        <StatusBar />

        {/* Title row */}
        <motion.div
          initial={false}
          style={{ overflow: "hidden" }}
          animate={{ height: headerVisible ? 56 : 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center justify-between" style={{ padding: "12px 16px", height: 56 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
              Discover
            </span>
            <div className="flex items-center" style={{ gap: 8 }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/marketplace/wishlist")}
                aria-label="View wishlist"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: "color-mix(in srgb, var(--foreground) 6%, transparent)",
                  border: "0.5px solid color-mix(in srgb, var(--border) 40%, transparent)",
                  cursor: "pointer",
                }}
              >
                <Heart size={16} style={{ color: "var(--foreground)" }} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/marketplace/cart")}
                aria-label="View cart"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: "color-mix(in srgb, var(--foreground) 6%, transparent)",
                  border: "0.5px solid color-mix(in srgb, var(--border) 40%, transparent)",
                  cursor: "pointer", position: "relative",
                }}
              >
                <ShoppingCart size={16} style={{ color: "var(--foreground)" }} />
                <span style={{
                  position: "absolute", top: 2, right: 2,
                  width: 14, height: 14, borderRadius: 9999,
                  backgroundColor: "var(--primary-600)", color: "var(--white)",
                  fontSize: "var(--text-2xs)", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>3</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Search bar */}
        <div style={{ padding: "4px 16px 4px" }}>
          <motion.button
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate("/marketplace/search")}
            aria-label="Search marketplace"
            className="flex items-center"
            style={{
              width: "100%", height: 40,
              borderRadius: 10, gap: 8, padding: "0 12px",
              background: "linear-gradient(180deg, color-mix(in srgb, var(--foreground) 7%, transparent) 0%, color-mix(in srgb, var(--foreground) 4%, transparent) 100%)",
              border: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
              boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.06)",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Search size={15} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "left", flex: 1 }}>
              Search courses, books, devices…
            </span>
          </motion.button>
        </div>

        {/* Age filter strip (reused) */}
        <AgeFilterStrip value={age} onChange={setAge} />
      </div>

      {/* Scrollable content */}
      <div style={{ paddingTop: 16, paddingBottom: 96 }}>

        {/* Banner (reused premium glass) */}
        <PremiumBanner />

        {/* 5 main-category tiles — scrollable with peek of last tile */}
        <div style={{ marginBottom: 8 }}>
          <div
            className="flex items-start"
            style={{
              gap: 12,
              paddingLeft: 16, paddingRight: 16, paddingBottom: 4,
              overflowX: "auto",
              scrollbarWidth: "none",
              scrollSnapType: "x mandatory",
              scrollPaddingLeft: 16,
            }}
          >
            {MAIN_CATEGORIES.map((cat) => (
              <MainCategoryTile
                key={cat.id}
                category={cat}
                onPress={() => scrollToMain(cat.anchorId)}
              />
            ))}
          </div>
        </div>

        {/* ─────── GOAL-DRIVEN PICKS — card-level cross-category curation ─────── */}
        {(() => {
          const goal = goalId ? GOALS.find((g) => g.id === goalId) : null;
          if (!goal) {
            return <GoalPicker onPick={pickGoal} />;
          }
          const cards = (GOAL_PICKS[goal.id] ?? [])
            .map((id) => renderCardById(id))
            .filter((node): node is React.ReactNode => node !== null);
          if (cards.length === 0) return null;
          return (
            <>
              <section>
                <GoalHeader goal={goal} />
                <div
                  className="flex"
                  style={{
                    gap: 12, paddingLeft: 16, paddingRight: 16,
                    overflowX: "auto", scrollbarWidth: "none",
                    scrollPaddingLeft: 16, scrollPaddingRight: 16,
                  }}
                >
                  {cards.map((node, i) => (
                    <Fragment key={`gp-${i}`}>{node}</Fragment>
                  ))}
                </div>
              </section>
              <BrowseDivider />
            </>
          );
        })()}

        {/* ─────── BROWSE BY CATEGORY — structured 5-category catalog ─────── */}
        {MAIN_CATEGORIES.map((main) => {
          const visibleSubs = SUBS[main.id].filter((s) => visibleForAge(age, s.id));
          if (visibleSubs.length === 0) return null;
          return (
            <section key={main.id}>
              <MainCategoryHeader category={main} />
              {visibleSubs.map((s) => (
                <Fragment key={s.id}>{renderSub(s.id)}</Fragment>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
