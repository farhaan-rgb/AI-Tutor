import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  X, Heart, Share2, Star, CheckCircle2, Users, Clock, BookOpen,
  ShieldCheck, Play, ChevronDown, ChevronUp, ChevronRight, Award, BarChart2,
  Truck, Package, RefreshCw, Zap, FileText, Minus, Plus,
  ShoppingCart, FlaskConical, PenLine, Monitor, TrendingDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar, Card } from "../shared/premium-ui";
import { TestSeriesHeroInner, PremiumTestSeriesCard, type MockTest } from "./marketplace-premium-cards";
import { ShareSheet } from "./share-sheet";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseProduct {
  type: "course";
  id: string;
  categoryId: "courses" | "skill-courses";
  title: string;
  tagline: string;
  examLabel: string;
  examAccent: string;
  examBadgeBg: string;
  examBadgeBorder: string;
  gradientBg: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  students: string;
  contentHours: string;
  pyqYears: string;
  instructor: { name: string; role: string; initials: string };
  durationVariants: { label: string; price: number; originalPrice: number }[];
  whatYoullLearn: string[];
  curriculum: { title: string; topics: number; duration: string; lessons: string[] }[];
  whatsIncluded: string[];
  description: string;
}

interface MockTestVariant {
  label: string;
  count: number;
  price: number;
  originalPrice: number;
  tag?: string;
}

interface MockTestProduct {
  type: "mock-test";
  id: string;
  categoryId: "mock-tests";
  title: string;
  examLabel: string;
  examAccent: string;
  examBadgeBg: string;
  examBadgeBorder: string;
  gradientBg: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  testCount: number;
  fullLengthCount: number;
  chapterwiseCount: number;
  pyqCount: number;
  questionCount: number;
  subjects: string[];
  testVariants: MockTestVariant[];
  whatsIncluded: string[];
  features: string[];
  description: string;
}

interface PhysicalProduct {
  type: "physical";
  id: string;
  categoryId: "books" | "stationery" | "lab-kits" | "devices";
  title: string;
  subtitle: string;
  brand: string;
  images: string[];
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  deliveryDate: string;
  returnDays: number;
  warrantyMonths?: number;
  highlights: string[];
  specs: { label: string; value: string }[];
  description: string;
  sellerName: string;
  sellerRating: number;
  // Live prices at other retailers — drives the "Lowest price online" claim +
  // the price-comparison table. Omit on products where we don't track it.
  priceComparison?: { retailer: string; price: number }[];
}

type AnyProduct = CourseProduct | MockTestProduct | PhysicalProduct;

interface SharedReview {
  id: string;
  name: string;
  initials: string;
  date: string;
  rating: number;
  text: string;
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

// TODO(api): GET /api/marketplace/product/:id/reviews
const DUMMY_REVIEWS: SharedReview[] = [
  {
    id: "r1", name: "Arjun Mehta", initials: "AM", date: "12 Mar 2026", rating: 5,
    text: "Absolutely worth every rupee. The concept clarity and PYQ solutions are on another level. Went from 65 to 97 percentile in two months.",
  },
  {
    id: "r2", name: "Sneha Kapoor", initials: "SK", date: "28 Feb 2026", rating: 5,
    text: "Best purchase of my JEE prep journey. The analytics told me exactly where I was losing marks and the doubt sessions are lightning fast.",
  },
  {
    id: "r3", name: "Rahul Verma", initials: "RV", date: "15 Jan 2026", rating: 4,
    text: "Great quality content. Could use more chapter-wise tests but overall very comprehensive and well structured.",
  },
];

// TODO(api): GET /api/marketplace/product/:id/rating-breakdown
const DUMMY_RATING_BREAKDOWN = [
  { stars: 5, pct: 74 },
  { stars: 4, pct: 18 },
  { stars: 3, pct: 5 },
  { stars: 2, pct: 2 },
  { stars: 1, pct: 1 },
];

// TODO(api): GET /api/marketplace/product/fd4
const DUMMY_COURSE_PRODUCT: CourseProduct = {
  type: "course",
  id: "fd4",
  categoryId: "courses",
  title: "JEE Main 2026 Complete Course",
  tagline: "Master Physics, Chemistry & Maths with 200+ live classes and 15,000+ practice questions.",
  examLabel: "JEE MAIN",
  examAccent: "#4096ff",
  examBadgeBg: "#001d66",
  examBadgeBorder: "#0050b3",
  gradientBg: "linear-gradient(145deg, #001d66 0%, #003494 50%, #0958d9 100%)",
  price: 3499,
  originalPrice: 6999,
  rating: 4.8,
  reviewCount: 2340,
  students: "12,400+",
  contentHours: "180h",
  pyqYears: "10 Yrs",
  instructor: { name: "Priya Sharma", role: "IIT Delhi · 8 yrs teaching", initials: "PS" },
  durationVariants: [
    { label: "6 Months", price: 1999, originalPrice: 3999 },
    { label: "12 Months", price: 3499, originalPrice: 6999 },
    { label: "2 Years", price: 4999, originalPrice: 9999 },
  ],
  whatYoullLearn: [
    "Complete JEE Main syllabus across Physics, Chemistry & Maths",
    "Solve NTA-pattern MCQs with confidence under exam conditions",
    "Analyse weak areas with real-time performance dashboards",
    "Access 10 years of PYQs with step-by-step video solutions",
    "Attend live doubt-clearing sessions 5 days a week",
    "Earn a verifiable certificate to showcase your preparation",
  ],
  curriculum: [
    { title: "Mechanics & Kinematics", topics: 8, duration: "4h 30m", lessons: ["Equations of motion", "Newton's laws", "Work, energy & power", "Circular motion"] },
    { title: "Thermodynamics", topics: 6, duration: "3h 45m", lessons: ["Laws of thermodynamics", "Kinetic theory of gases", "Heat transfer", "Carnot engine"] },
    { title: "Waves & Optics", topics: 7, duration: "4h 15m", lessons: ["Wave nature of light", "Interference & diffraction", "Refraction & lenses", "Sound waves"] },
    { title: "Electrostatics & Magnetism", topics: 9, duration: "5h 00m", lessons: ["Coulomb's law", "Electric field & potential", "Capacitors", "Gauss's law"] },
  ],
  whatsIncluded: [
    "120 live classes with instant replays",
    "10,000+ topic-wise practice questions",
    "10 years of JEE PYQs, fully solved",
    "Personalised performance analytics",
    "Doubt sessions 5 days a week",
    "Verifiable certificate of completion",
  ],
  description: "The most comprehensive JEE Main preparation course, taught by IIT alumni and top educators. Covers all three subjects — Physics, Chemistry, and Mathematics — with topic-wise depth, live doubt sessions, and adaptive mock tests that mirror the actual NTA exam pattern. Our analytics engine identifies your weak spots and recommends targeted practice so you can improve fast.",
};

// TODO(api): GET /api/marketplace/product/mt1
const DUMMY_MOCK_TEST_PRODUCT: MockTestProduct = {
  type: "mock-test",
  id: "mt1",
  categoryId: "mock-tests",
  title: "JEE Mains Mock Series",
  examLabel: "JEE MAIN",
  examAccent: "#4096ff",
  examBadgeBg: "#001d66",
  examBadgeBorder: "#0050b3",
  gradientBg: "linear-gradient(145deg, #001d66 0%, #003494 50%, #0958d9 100%)",
  price: 599,
  originalPrice: 999,
  rating: 4.7,
  reviewCount: 3100,
  testCount: 20,
  fullLengthCount: 8,
  chapterwiseCount: 8,
  pyqCount: 4,
  questionCount: 1800,
  subjects: ["Physics", "Chemistry", "Mathematics"],
  testVariants: [
    { label: "Starter",  count: 10, price: 199,  originalPrice: 349  },
    { label: "Standard", count: 25, price: 599,  originalPrice: 999,  tag: "POPULAR" },
    { label: "Complete", count: 50, price: 999,  originalPrice: 1799, tag: "BEST VALUE" },
  ],
  whatsIncluded: [
    "10 Full-length NTA-pattern mock tests",
    "10 Chapter-wise subject tests",
    "5 Previous Year Question papers (2019–2024)",
    "Detailed solutions for every question",
    "All-India Rank after every test",
    "Percentile and score analytics dashboard",
  ],
  features: [
    "NTA-identical exam interface",
    "Auto-submit on time expiry",
    "Downloadable PDF report card",
    "Works on any device or browser",
  ],
  description: "India's most accurate JEE Mains mock series, designed to replicate the NTA exam interface exactly. Real-time AIR prediction, percentile vs. national topper comparison, and subject-wise gap analysis. Used by 2 lakh+ students every year for final-stretch preparation.",
};

// TODO(api): GET /api/marketplace/product/fd1
const DUMMY_PHYSICAL_PRODUCT: PhysicalProduct = {
  type: "physical",
  id: "fd1",
  categoryId: "books",
  title: "H.C. Verma — Concepts of Physics",
  subtitle: "Volume 1 & 2 Set",
  brand: "Bharati Bhawan",
  images: [
    "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=640&h=480&fit=crop",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=640&h=480&fit=crop",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=640&h=480&fit=crop",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=640&h=480&fit=crop",
  ],
  price: 550,
  originalPrice: 900,
  rating: 4.9,
  reviewCount: 14200,
  deliveryDate: "2–4 business days",
  returnDays: 7,
  highlights: [
    "Complete JEE & NEET Physics syllabus (both volumes)",
    "1000+ solved examples and exercises with answers",
    "Conceptual approach builds deep intuition — not rote",
    "Used by IIT toppers and NEET rankers for decades",
    "Clear diagrams with step-by-step solutions",
  ],
  specs: [
    { label: "Author", value: "H.C. Verma" },
    { label: "Publisher", value: "Bharati Bhawan" },
    { label: "Edition", value: "Revised (Latest)" },
    { label: "Language", value: "English" },
    { label: "Pages", value: "Vol. 1: 468 · Vol. 2: 474" },
    { label: "Subject", value: "Physics" },
    { label: "Suitable for", value: "JEE, NEET, Class 11–12" },
    { label: "Binding", value: "Paperback" },
  ],
  description: "H.C. Verma's Concepts of Physics is the gold standard for JEE and NEET physics preparation. This two-volume set builds physical intuition through carefully crafted examples and exercises, ranging from foundational to IIT-level. The questions are pedagogically ordered from first principles to advanced application.",
  sellerName: "PrepMaster Books",
  sellerRating: 4.8,
};

// ─── Primebook Laptops (Devices) ─────────────────────────────────────────────

// TODO(api): GET /api/marketplace/devices/primebook
const PRIMEBOOK_PRODUCTS: Record<string, PhysicalProduct> = {
  "pb-neo": {
    type: "physical",
    id: "pb-neo",
    categoryId: "devices",
    title: "Primebook 2 Neo",
    subtitle: "11.6\" · 4GB RAM · 64GB · Android 15",
    brand: "Primebook",
    images: [
      "/primebook-neo.png",
      "https://shop.primebook.in/cdn/shop/files/performanceneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/Display_Buildneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/batteryneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/aineo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/cloudpcneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/weightneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/portsneo.png?width=800",
    ],
    price: 15990,
    originalPrice: 22990,
    rating: 4.4,
    reviewCount: 1280,
    deliveryDate: "3–5 business days",
    returnDays: 7,
    warrantyMonths: 12,
    highlights: [
      "Lightest in the lineup — 1.05 kg",
      "PrimeOS 3.0 on Android 15 with Gemini AI built-in",
      "50,000+ Android apps + Cloud-PC for Windows software",
      "8-hour battery for a full school day",
      "Perfect for Classes 2–10 and online classes",
    ],
    specs: [
      { label: "Display",    value: "11.6\" HD (1366×768)" },
      { label: "Processor",  value: "Quad-core ARM" },
      { label: "RAM",        value: "4 GB LPDDR4" },
      { label: "Storage",    value: "64 GB eMMC" },
      { label: "OS",         value: "PrimeOS 3.0 (Android 15)" },
      { label: "Weight",     value: "1.05 kg" },
      { label: "Battery",    value: "Up to 8 hours" },
      { label: "Ports",      value: "USB-C, USB-A, HDMI, 3.5mm" },
    ],
    description: "Primebook 2 Neo is built for students stepping into computing. PrimeOS runs on Android so the entire Google Play library is one tap away, and Gemini AI sits inside the OS for instant help with homework, coding, and writing. At ~1 kg with all-day battery, it slips into any school bag.",
    sellerName: "Primebook India",
    sellerRating: 4.6,
    // TODO(api): GET /api/marketplace/product/:id/price-comparison — demo figures
    priceComparison: [
      { retailer: "Flipkart", price: 16499 },
      { retailer: "Amazon", price: 16990 },
      { retailer: "Primebook.in", price: 17990 },
    ],
  },
  "pb-pro": {
    type: "physical",
    id: "pb-pro",
    categoryId: "devices",
    title: "Primebook 2 Pro",
    subtitle: "14\" · 6GB RAM · 128GB · Android 15",
    brand: "Primebook",
    images: [
      "/primebook-pro.png",
      "https://shop.primebook.in/cdn/shop/files/performanceneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/Display_Buildneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/batteryneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/aineo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/cloudpcneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/portsneo.png?width=800",
    ],
    price: 19990,
    originalPrice: 29990,
    rating: 4.6,
    reviewCount: 2140,
    deliveryDate: "3–5 business days",
    returnDays: 7,
    warrantyMonths: 12,
    highlights: [
      "Bigger 14\" display for split-screen and coding",
      "Stronger battery — up to 10 hours of mixed use",
      "PrimeOS 3.0 with Gemini AI for research and writing",
      "Cloud-PC unlocks AutoCAD, Excel, Photoshop on-demand",
      "Best balance of price, RAM and storage",
    ],
    specs: [
      { label: "Display",    value: "14\" Full HD (1920×1080)" },
      { label: "Processor",  value: "Octa-core ARM" },
      { label: "RAM",        value: "6 GB LPDDR4" },
      { label: "Storage",    value: "128 GB eMMC" },
      { label: "OS",         value: "PrimeOS 3.0 (Android 15)" },
      { label: "Weight",     value: "1.3 kg" },
      { label: "Battery",    value: "Up to 10 hours" },
      { label: "Ports",      value: "USB-C, 2× USB-A, HDMI, microSD, 3.5mm" },
    ],
    description: "Primebook 2 Pro is the sweet spot. A Full-HD 14-inch display with 6 GB RAM handles multitasking, browser tabs, and side-by-side study workflows without a stutter. Same Gemini-powered PrimeOS, same Cloud-PC for Windows software, with a 10-hour battery that lasts a school day plus evening practice.",
    sellerName: "Primebook India",
    sellerRating: 4.6,
    // TODO(api): GET /api/marketplace/product/:id/price-comparison — demo figures
    priceComparison: [
      { retailer: "Flipkart", price: 20990 },
      { retailer: "Amazon", price: 21990 },
      { retailer: "Primebook.in", price: 22990 },
    ],
  },
  "pb-max": {
    type: "physical",
    id: "pb-max",
    categoryId: "devices",
    title: "Primebook 2 Max",
    subtitle: "14\" · 8GB RAM · 256GB · Android 15",
    brand: "Primebook",
    images: [
      "/primebook-max.png",
      "https://shop.primebook.in/cdn/shop/files/Display_Buildmax.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/performanceneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/batteryneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/aineo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/cloudpcneo.png?width=800",
      "https://shop.primebook.in/cdn/shop/files/portsneo.png?width=800",
    ],
    price: 22990,
    originalPrice: 34990,
    rating: 4.7,
    reviewCount: 940,
    deliveryDate: "3–5 business days",
    returnDays: 7,
    warrantyMonths: 12,
    highlights: [
      "Top-of-the-line — 8 GB RAM, 256 GB storage",
      "Best for exam preppers, JEE/NEET marathon sessions",
      "Full-HD 14\" display, thin bezels",
      "PrimeOS 3.0 + Gemini AI + Cloud-PC included",
      "Up to 12 hours of battery",
    ],
    specs: [
      { label: "Display",    value: "14\" Full HD (1920×1080)" },
      { label: "Processor",  value: "Octa-core ARM" },
      { label: "RAM",        value: "8 GB LPDDR4" },
      { label: "Storage",    value: "256 GB eMMC" },
      { label: "OS",         value: "PrimeOS 3.0 (Android 15)" },
      { label: "Weight",     value: "1.35 kg" },
      { label: "Battery",    value: "Up to 12 hours" },
      { label: "Ports",      value: "USB-C, 2× USB-A, HDMI, microSD, 3.5mm" },
    ],
    description: "Primebook 2 Max is built for the long haul — coding marathons, exam-prep grinds, creative work. 8 GB RAM and 256 GB storage mean you can keep your entire course library, notes and downloaded videos on-device. Gemini AI handles research and Cloud-PC lets you run heavy desktop apps without a beast of a machine.",
    sellerName: "Primebook India",
    sellerRating: 4.6,
    // TODO(api): GET /api/marketplace/product/:id/price-comparison — demo figures
    priceComparison: [
      { retailer: "Flipkart", price: 23990 },
      { retailer: "Amazon", price: 24990 },
      { retailer: "Primebook.in", price: 25990 },
    ],
  },
};

// ─── Test Series (Mock Test) per-exam overrides ──────────────────────────────

// TODO(api): GET /api/marketplace/mock-tests/:examId
const TEST_SERIES_PRODUCTS: Record<string, MockTestProduct> = {
  "mt-jee-main": {
    type: "mock-test",
    id: "mt-jee-main",
    categoryId: "mock-tests",
    title: "JEE Main Mock Series 2026",
    examLabel: "JEE MAIN",
    examAccent: "#4096ff",
    examBadgeBg: "#001d66",
    examBadgeBorder: "#0050b3",
    gradientBg: "linear-gradient(145deg, #001d66 0%, #003494 50%, #0958d9 100%)",
    price: 599,
    originalPrice: 999,
    rating: 4.8,
    reviewCount: 14200,
    testCount: 30,
    fullLengthCount: 15,
    chapterwiseCount: 12,
    pyqCount: 3,
    questionCount: 2700,
    subjects: ["Physics", "Chemistry", "Mathematics"],
    testVariants: [
      { label: "Starter",  count: 10, price: 199, originalPrice: 349 },
      { label: "Standard", count: 30, price: 599, originalPrice: 999, tag: "POPULAR" },
      { label: "Complete", count: 60, price: 999, originalPrice: 1799, tag: "BEST VALUE" },
    ],
    whatsIncluded: [
      "15 Full-length NTA-pattern mock tests",
      "12 Chapter-wise subject tests",
      "3 Previous Year Question papers (2022–2024)",
      "Detailed video solutions for every question",
      "All-India Rank after every test",
      "Percentile and score analytics dashboard",
    ],
    features: [
      "NTA-identical exam interface",
      "Auto-submit on time expiry",
      "Downloadable PDF report card",
      "Works on any device or browser",
    ],
    description: "India's most accurate JEE Main mock series, designed to replicate the NTA exam interface exactly. Real-time AIR prediction, percentile vs. national topper comparison, and subject-wise gap analysis. Used by 2 lakh+ students every year for final-stretch preparation.",
  },
  "mt-jee-adv": {
    type: "mock-test",
    id: "mt-jee-adv",
    categoryId: "mock-tests",
    title: "JEE Advanced Mock Series",
    examLabel: "JEE ADV",
    examAccent: "#9254de",
    examBadgeBg: "#120338",
    examBadgeBorder: "#391085",
    gradientBg: "linear-gradient(145deg, #120338 0%, #22075e 50%, #531dab 100%)",
    price: 899,
    originalPrice: 1599,
    rating: 4.7,
    reviewCount: 5600,
    testCount: 18,
    fullLengthCount: 12,
    chapterwiseCount: 4,
    pyqCount: 2,
    questionCount: 1080,
    subjects: ["Physics", "Chemistry", "Mathematics"],
    testVariants: [
      { label: "Starter",  count: 6,  price: 399, originalPrice: 699 },
      { label: "Standard", count: 18, price: 899, originalPrice: 1599, tag: "POPULAR" },
      { label: "Complete", count: 30, price: 1399, originalPrice: 2499, tag: "BEST VALUE" },
    ],
    whatsIncluded: [
      "12 Full-length IIT-pattern mock tests (Paper 1 + Paper 2)",
      "4 Subject-wise advanced concept tests",
      "2 PYQs with IIT-style explanations",
      "Numerical-type + multi-correct + match-the-column",
      "All-India Rank with IIT topper comparison",
      "Subject-wise weakness heatmap",
    ],
    features: [
      "Two-paper structure matching JEE Advanced",
      "Negative marking enabled by default",
      "Calculator + scratchpad in interface",
      "Bilingual question support (Hindi/English)",
    ],
    description: "Built for the highest-difficulty entrance test in India. Every mock is curated by IIT alumni to match the unpredictability and depth of the real JEE Advanced paper. Includes complete Paper 1 + Paper 2 structure with negative marking and partial credit scoring.",
  },
  "mt-gate-cse": {
    type: "mock-test",
    id: "mt-gate-cse",
    categoryId: "mock-tests",
    title: "GATE CSE 2026 Mock Pack",
    examLabel: "GATE CSE",
    examAccent: "#13c2c2",
    examBadgeBg: "#002329",
    examBadgeBorder: "#006d75",
    gradientBg: "linear-gradient(145deg, #002329 0%, #00474f 50%, #08979c 100%)",
    price: 899,
    originalPrice: 1799,
    rating: 4.6,
    reviewCount: 4200,
    testCount: 22,
    fullLengthCount: 10,
    chapterwiseCount: 10,
    pyqCount: 2,
    questionCount: 1320,
    subjects: ["Algorithms", "OS", "DBMS", "Networks", "Maths"],
    testVariants: [
      { label: "Starter",  count: 6,  price: 349, originalPrice: 599 },
      { label: "Standard", count: 22, price: 899, originalPrice: 1799, tag: "POPULAR" },
      { label: "Complete", count: 40, price: 1499, originalPrice: 2999, tag: "BEST VALUE" },
    ],
    whatsIncluded: [
      "10 Full-length GATE CSE mocks (IISc pattern)",
      "10 Subject-wise tests across all CS topics",
      "2 Latest PYQs with detailed solutions",
      "Numerical Answer Type (NAT) + MCQ + MSQ",
      "Branch-wise All India Rank predictor",
      "GATE CS handbook + formula sheet",
    ],
    features: [
      "IISc-aligned virtual calculator inside test UI",
      "Section-wise (Tech / Aptitude / Maths) breakdown",
      "Negative marking 1/3 for MCQs",
      "Auto-bookmarking for revision",
    ],
    description: "GATE CSE mock pack built around the IISc Bengaluru exam interface. Tests cover the official GATE 2026 syllabus across Algorithms, OS, DBMS, Networks, Discrete Maths and Compiler Design. Used by 80,000+ candidates per cycle.",
  },
  "mt-neet-ug": {
    type: "mock-test",
    id: "mt-neet-ug",
    categoryId: "mock-tests",
    title: "NEET UG Mock Test Pack",
    examLabel: "NEET UG",
    examAccent: "#52c41a",
    examBadgeBg: "#092b00",
    examBadgeBorder: "#237804",
    gradientBg: "linear-gradient(145deg, #092b00 0%, #135200 50%, #389e0d 100%)",
    price: 699,
    originalPrice: 1299,
    rating: 4.8,
    reviewCount: 18900,
    testCount: 32,
    fullLengthCount: 20,
    chapterwiseCount: 10,
    pyqCount: 2,
    questionCount: 5760,
    subjects: ["Physics", "Chemistry", "Botany", "Zoology"],
    testVariants: [
      { label: "Starter",  count: 10, price: 249, originalPrice: 449 },
      { label: "Standard", count: 32, price: 699, originalPrice: 1299, tag: "POPULAR" },
      { label: "Complete", count: 60, price: 1199, originalPrice: 2199, tag: "BEST VALUE" },
    ],
    whatsIncluded: [
      "20 Full-length NTA NEET mock tests (180 Q · 3 hrs)",
      "10 Chapter-wise tests across PCB",
      "2 Most-recent PYQs (2023–2024)",
      "NCERT line-by-line answer mapping",
      "AIQ rank predictor (state + central seat split)",
      "Subject-wise time-allocation report",
    ],
    features: [
      "180 questions per full-length, 3-hour timer",
      "Negative marking enabled per NTA norms",
      "OMR-style review screen",
      "Bilingual (Hindi/English) toggle on every question",
    ],
    description: "NEET UG mock series built to NTA blueprint. Each full-length mock contains 45 Physics + 45 Chemistry + 45 Botany + 45 Zoology questions with the exact section structure from the latest paper. NCERT references included in every solution.",
  },
  "mt-neet-pg": {
    type: "mock-test",
    id: "mt-neet-pg",
    categoryId: "mock-tests",
    title: "NEET PG Mock Series",
    examLabel: "NEET PG",
    examAccent: "#389e0d",
    examBadgeBg: "#092b00",
    examBadgeBorder: "#237804",
    gradientBg: "linear-gradient(145deg, #02160a 0%, #052e1c 50%, #237804 100%)",
    price: 1499,
    originalPrice: 2999,
    rating: 4.7,
    reviewCount: 3400,
    testCount: 15,
    fullLengthCount: 10,
    chapterwiseCount: 4,
    pyqCount: 1,
    questionCount: 3000,
    subjects: ["Medicine", "Surgery", "Obs-Gyn", "Pharm", "Pathology", "Anatomy"],
    testVariants: [
      { label: "Starter",  count: 5,  price: 699,  originalPrice: 1299 },
      { label: "Standard", count: 15, price: 1499, originalPrice: 2999, tag: "POPULAR" },
      { label: "Complete", count: 30, price: 2499, originalPrice: 4999, tag: "BEST VALUE" },
    ],
    whatsIncluded: [
      "10 Full-length NEET PG mocks (200 Q · 3.5 hrs)",
      "4 Subject-wise tests (high-yield clinical topics)",
      "1 PYQ with image-based solutions",
      "Image-rich + clinical-scenario question format",
      "All-India Rank with seat predictor (state + central)",
      "Subject-wise performance vs. AIR-1000 comparison",
    ],
    features: [
      "Clinical case scenario + image questions",
      "200 questions, 3.5-hour timer",
      "Negative marking 0.25",
      "Detailed reference linking to standard PG textbooks",
    ],
    description: "Built for MBBS graduates preparing for NEET PG / INI CET. Covers all 19 subjects with emphasis on the high-yield clinical topics that drive the latest paper. Includes image-based questions and clinical case scenarios.",
  },
  "mt-cat": {
    type: "mock-test",
    id: "mt-cat",
    categoryId: "mock-tests",
    title: "CAT 2026 Mock Series",
    examLabel: "CAT",
    examAccent: "#ffc53d",
    examBadgeBg: "#2b1d11",
    examBadgeBorder: "#593815",
    gradientBg: "linear-gradient(145deg, #2b1600 0%, #614700 50%, #874d00 100%)",
    price: 999,
    originalPrice: 1999,
    rating: 4.8,
    reviewCount: 9800,
    testCount: 25,
    fullLengthCount: 18,
    chapterwiseCount: 6,
    pyqCount: 1,
    questionCount: 1650,
    subjects: ["QA", "VARC", "DILR"],
    testVariants: [
      { label: "Starter",  count: 8,  price: 399,  originalPrice: 799 },
      { label: "Standard", count: 25, price: 999,  originalPrice: 1999, tag: "POPULAR" },
      { label: "Complete", count: 40, price: 1599, originalPrice: 2999, tag: "BEST VALUE" },
    ],
    whatsIncluded: [
      "18 Full-length CAT mocks (IIM pattern, 66 Q · 2 hrs)",
      "6 Section-wise tests (VARC, DILR, QA)",
      "1 Latest PYQ (2024)",
      "TITA + MCQ mixed question types",
      "IIM-cutoff-aware percentile prediction",
      "Sectional time-allocation strategy report",
    ],
    features: [
      "Section-wise lockdown (CAT-style)",
      "On-screen calculator",
      "Negative marking 1/3 for MCQs",
      "Slot-based difficulty normalization",
    ],
    description: "CAT mock series built to mirror the latest IIM exam pattern: 66 questions across VARC, DILR and QA in a strict 2-hour window with section-wise lockdown. Percentile prediction is calibrated against IIM A/B/C historical cutoffs.",
  },
  "mt-clat": {
    type: "mock-test",
    id: "mt-clat",
    categoryId: "mock-tests",
    title: "CLAT 2026 Mock Pack",
    examLabel: "CLAT",
    examAccent: "#fa541c",
    examBadgeBg: "#2b1500",
    examBadgeBorder: "#612500",
    gradientBg: "linear-gradient(145deg, #2b1500 0%, #612500 50%, #ad4e00 100%)",
    price: 799,
    originalPrice: 1499,
    rating: 4.6,
    reviewCount: 4100,
    testCount: 20,
    fullLengthCount: 12,
    chapterwiseCount: 7,
    pyqCount: 1,
    questionCount: 2400,
    subjects: ["Legal", "English", "Logical", "GK", "Quant"],
    testVariants: [
      { label: "Starter",  count: 6,  price: 349, originalPrice: 599 },
      { label: "Standard", count: 20, price: 799, originalPrice: 1499, tag: "POPULAR" },
      { label: "Complete", count: 35, price: 1299, originalPrice: 2499, tag: "BEST VALUE" },
    ],
    whatsIncluded: [
      "12 Full-length CLAT mocks (120 Q · 2 hrs)",
      "7 Section-wise tests (Legal, English, Logical, GK, Quant)",
      "1 Latest PYQ with reasoning explanations",
      "Passage-based question format (CLAT 2020+ pattern)",
      "NLSIU-cutoff rank predictor",
      "Sectional accuracy + speed benchmarks",
    ],
    features: [
      "Passage-style legal reasoning (current pattern)",
      "120 questions in 2 hours",
      "Negative marking 0.25",
      "Current-affairs auto-refresh (last 12 months)",
    ],
    description: "CLAT mock series designed around the 2020+ consortium pattern with passage-based legal reasoning. Includes a rolling GK section that auto-refreshes to the most recent 12 months of current affairs.",
  },
  "mt-upsc": {
    type: "mock-test",
    id: "mt-upsc",
    categoryId: "mock-tests",
    title: "UPSC Prelims Test Series",
    examLabel: "UPSC",
    examAccent: "#ff7a45",
    examBadgeBg: "#2b1500",
    examBadgeBorder: "#871400",
    gradientBg: "linear-gradient(145deg, #2b1500 0%, #5a1d00 50%, #ad2102 100%)",
    price: 1499,
    originalPrice: 2999,
    rating: 4.7,
    reviewCount: 7800,
    testCount: 28,
    fullLengthCount: 18,
    chapterwiseCount: 8,
    pyqCount: 2,
    questionCount: 2800,
    subjects: ["Polity", "Economy", "History", "Geo", "Sci-Tech", "Env", "CSAT"],
    testVariants: [
      { label: "Starter",  count: 8,  price: 599,  originalPrice: 1199 },
      { label: "Standard", count: 28, price: 1499, originalPrice: 2999, tag: "POPULAR" },
      { label: "Complete", count: 50, price: 2499, originalPrice: 4999, tag: "BEST VALUE" },
    ],
    whatsIncluded: [
      "18 Full-length Prelims GS Paper-1 mocks (100 Q · 2 hrs)",
      "8 Subject-wise tests (Polity / History / Economy / Geo / Env / Sci-Tech)",
      "2 PYQs with explanation videos",
      "Current affairs updated monthly",
      "Cutoff-based safe-zone prediction",
      "CSAT (Paper 2) sectional practice tests",
    ],
    features: [
      "UPSC-identical CSAT-aligned UI",
      "100 questions, 2-hour timer",
      "Negative marking 1/3 (0.66 marks per wrong)",
      "Trend-mapped current affairs (last 18 months)",
    ],
    description: "Prelims-focused series for UPSC Civil Services aspirants. Every mock pulls 60% from static syllabus and 40% from rolling current affairs in line with the latest 5-year trend. Includes Paper 2 (CSAT) sectional practice.",
  },
  "mt-ssc": {
    type: "mock-test",
    id: "mt-ssc",
    categoryId: "mock-tests",
    title: "SSC CGL Tier 1 Test Series",
    examLabel: "SSC CGL",
    examAccent: "#08979c",
    examBadgeBg: "#002329",
    examBadgeBorder: "#006d75",
    gradientBg: "linear-gradient(145deg, #002329 0%, #00474f 50%, #08979c 100%)",
    price: 399,
    originalPrice: 799,
    rating: 4.5,
    reviewCount: 12400,
    testCount: 40,
    fullLengthCount: 25,
    chapterwiseCount: 12,
    pyqCount: 3,
    questionCount: 4000,
    subjects: ["Quant", "Reasoning", "English", "GK"],
    testVariants: [
      { label: "Starter",  count: 12, price: 149, originalPrice: 299 },
      { label: "Standard", count: 40, price: 399, originalPrice: 799, tag: "POPULAR" },
      { label: "Complete", count: 80, price: 699, originalPrice: 1399, tag: "BEST VALUE" },
    ],
    whatsIncluded: [
      "25 Full-length Tier 1 mocks (100 Q · 60 min)",
      "12 Section-wise tests across Quant/Reasoning/English/GK",
      "3 Latest PYQs (2022–2024)",
      "Tier 2 starter practice for top scorers",
      "All-India rank + sectional cutoff prediction",
      "Question-bank by topic + difficulty",
    ],
    features: [
      "SSC-identical exam interface",
      "60-minute timer · 100 questions",
      "Negative marking 0.5",
      "Hindi + English bilingual",
    ],
    description: "SSC CGL Tier 1 mock series with the exact 100-question, 60-minute structure used by the official SSC exam. Covers Quant, Reasoning, English, and GK in equal sections with rolling current affairs.",
  },
  "mt-bank": {
    type: "mock-test",
    id: "mt-bank",
    categoryId: "mock-tests",
    title: "Bank PO (IBPS/SBI) Mock Pack",
    examLabel: "BANK PO",
    examAccent: "#c41d7f",
    examBadgeBg: "#291321",
    examBadgeBorder: "#551c3b",
    gradientBg: "linear-gradient(145deg, #291321 0%, #551c3b 50%, #9e1068 100%)",
    price: 499,
    originalPrice: 999,
    rating: 4.6,
    reviewCount: 9600,
    testCount: 35,
    fullLengthCount: 20,
    chapterwiseCount: 12,
    pyqCount: 3,
    questionCount: 2800,
    subjects: ["Reasoning", "Quant", "English", "GA", "Computer"],
    testVariants: [
      { label: "Starter",  count: 10, price: 199, originalPrice: 399 },
      { label: "Standard", count: 35, price: 499, originalPrice: 999, tag: "POPULAR" },
      { label: "Complete", count: 70, price: 899, originalPrice: 1799, tag: "BEST VALUE" },
    ],
    whatsIncluded: [
      "20 Full-length Prelims + Mains mocks (IBPS + SBI patterns)",
      "12 Section-wise tests (Reasoning / Quant / English / GA)",
      "3 PYQs across IBPS PO, SBI PO, RBI Grade B",
      "Banking awareness updated weekly",
      "Sectional cutoff + overall cutoff predictions",
      "Speed + accuracy report after every mock",
    ],
    features: [
      "Both IBPS PO and SBI PO patterns supported",
      "Sectional timing matching real exam",
      "Negative marking 0.25",
      "Computer Aptitude module included",
    ],
    description: "Combined IBPS PO + SBI PO mock pack covering Prelims and Mains structures across all 5 subject areas. Banking awareness questions are refreshed weekly to track the latest RBI policy, monetary changes, and government schemes.",
  },
};

// ─── Routing Map ─────────────────────────────────────────────────────────────

// Home-page IDs (legacy format: no hyphen-number pattern)
const PHYSICAL_IDS = new Set([
  "fd1","fd2","fd3","fd5","fd6",
  "bs1","bs3","bs4","bs5","bs6",
  "br2","br4","br6","br8",
  "bk1","bk2","bk3","bk4","bk5",
  "lk1","lk2","lk3","lk4","fd-3",
]);
const MOCK_TEST_IDS = new Set([
  "mt1","mt2","mt3","mt4","bs2","br5","tr-1",
]);

// Category-page ID prefixes (format: "prefix-number", e.g. "bk-1", "mt-2")
const PHYSICAL_PREFIXES = new Set(["bk","st","lk","ck","ol","mr","fu","nu","pz","pb"]);
const MOCK_TEST_PREFIXES = new Set(["mt"]);

function getProduct(id: string): AnyProduct {
  // Specific product lookup wins over generic dispatch.
  if (PRIMEBOOK_PRODUCTS[id]) return PRIMEBOOK_PRODUCTS[id];
  if (TEST_SERIES_PRODUCTS[id]) return TEST_SERIES_PRODUCTS[id];
  // Detect prefix-suffix ID format (e.g. "bk-1", "mt-2", "mt-jee", "c-3").
  // Suffix may be numeric or alphabetic — the prefix decides the product type.
  const categoryMatch = id.match(/^([a-z]+)-([a-z\d]+)$/);
  if (categoryMatch) {
    const prefix = categoryMatch[1];
    if (MOCK_TEST_PREFIXES.has(prefix)) return { ...DUMMY_MOCK_TEST_PRODUCT, id };
    if (PHYSICAL_PREFIXES.has(prefix)) return { ...DUMMY_PHYSICAL_PRODUCT, id };
    return { ...DUMMY_COURSE_PRODUCT, id };
  }
  // Legacy home-page IDs
  if (MOCK_TEST_IDS.has(id)) return { ...DUMMY_MOCK_TEST_PRODUCT, id };
  if (PHYSICAL_IDS.has(id)) return { ...DUMMY_PHYSICAL_PRODUCT, id };
  return { ...DUMMY_COURSE_PRODUCT, id };
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{
            width: size, height: size,
            fill: i <= Math.round(rating) ? "var(--warning-500)" : "transparent",
            color: "var(--warning-500)",
            strokeWidth: 1.5,
          }}
        />
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--gray-500)" }}>
      {children}
    </span>
  );
}

function Divider() {
  return <div style={{ height: 1, backgroundColor: "var(--border)", marginLeft: -16, marginRight: -16 }} />;
}

function RatingOverview({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex" style={{ gap: 16 }}>
      <div className="flex flex-col items-center justify-center" style={{ gap: 4, minWidth: 56 }}>
        <span style={{ fontSize: 32, fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", lineHeight: 1 }}>
          {rating.toFixed(1)}
        </span>
        <StarRow rating={rating} size={11} />
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
          {reviewCount.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="flex flex-col justify-center" style={{ flex: 1, gap: 4 }}>
        {DUMMY_RATING_BREAKDOWN.map(({ stars, pct }) => (
          <div key={stars} className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", width: 8, textAlign: "right" }}>{stars}</span>
            <div style={{ flex: 1, height: 4, borderRadius: 9999, backgroundColor: "var(--border)" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 9999, backgroundColor: "var(--warning-500)" }} />
            </div>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", width: 24 }}>{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: SharedReview }) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <div className="flex items-center" style={{ gap: 8 }}>
        <div className="flex items-center justify-center" style={{
          width: 40, height: 40, borderRadius: 9999,
          backgroundColor: "var(--primary)", flexShrink: 0,
        }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
            {review.initials}
          </span>
        </div>
        <div className="flex flex-col" style={{ gap: 2 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
            {review.name}
          </span>
          <div className="flex items-center" style={{ gap: 8 }}>
            <StarRow rating={review.rating} size={11} />
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{review.date}</span>
          </div>
        </div>
      </div>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
        {review.text}
      </span>
    </div>
  );
}

function ReviewsSection({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? DUMMY_REVIEWS : DUMMY_REVIEWS.slice(0, 2);
  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      <SectionTitle>Ratings & Reviews</SectionTitle>
      <RatingOverview rating={rating} reviewCount={reviewCount} />
      <div className="flex flex-col" style={{ gap: 16 }}>
        {visible.map((r) => <ReviewCard key={r.id} review={r} />)}
      </div>
      {DUMMY_REVIEWS.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center"
          style={{ gap: 4, height: 40, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "transparent", cursor: "pointer" }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
            {expanded ? "Show less" : `See all ${reviewCount.toLocaleString("en-IN")} reviews`}
          </span>
          {expanded ? <ChevronUp size={14} style={{ color: "var(--foreground)" }} /> : <ChevronDown size={14} style={{ color: "var(--foreground)" }} />}
        </button>
      )}
    </div>
  );
}

interface SmallRelatedCardProps {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  gradientBg?: string;
  thumbLabel?: string;
  thumbImage?: string;
  badge?: string;
  badgeColor?: string;
  badgeBorder?: string;
  onClick: () => void;
}

function SmallRelatedCard({ title, subtitle, price, originalPrice, gradientBg, thumbLabel, thumbImage, badge, badgeColor, badgeBorder, onClick }: SmallRelatedCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col shrink-0"
      style={{ width: 188, borderRadius: 8, overflow: "hidden", backgroundColor: "var(--background)", cursor: "pointer" }}
    >
      {/* Thumbnail */}
      <div style={{ width: "100%", height: 128, background: thumbImage ? "var(--card)" : (gradientBg ?? "var(--card)"), position: "relative", overflow: "hidden", flexShrink: 0, borderRadius: 8 }}>
        {thumbImage ? (
          <img src={thumbImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <>
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, var(--white-alpha-4) 0px, var(--white-alpha-4) 1px, transparent 1px, transparent 10px)" }} />
            <div aria-hidden style={{ position: "absolute", top: -24, right: -24, width: 96, height: 96, borderRadius: 9999, backgroundColor: "var(--white-alpha-6)" }} />
            <div aria-hidden style={{ position: "absolute", bottom: -16, left: -16, width: 56, height: 56, borderRadius: 9999, backgroundColor: "var(--white-alpha-4)" }} />
            <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0, paddingBottom: 20 }}>
              <span style={{ fontSize: 64, fontWeight: 800, color: "var(--white-alpha-30)", letterSpacing: -2, lineHeight: 1 }}>
                {(thumbLabel ?? title).split(" ")[0]}
              </span>
            </div>
          </>
        )}
        {/* Bottom gradient + badge row — matches CourseThumbnail exactly */}
        <div className="flex items-center justify-between" style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          paddingLeft: 10, paddingRight: 10, paddingBottom: 8, paddingTop: 20,
          background: "linear-gradient(0deg, var(--black-alpha-50) 0%, transparent 100%)",
        }}>
          {badge ? (
            <div className="flex items-center justify-center" style={{ paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 4, backgroundColor: badgeColor ? `${badgeColor}25` : "var(--black-alpha-50)", border: `1.5px solid ${badgeBorder ?? badgeColor ?? "var(--white-alpha-30)"}` }}>
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", color: badgeColor ?? "var(--white)", letterSpacing: 1 }}>
                {badge}
              </span>
            </div>
          ) : <div />}
          {subtitle.includes(" · ") && (
            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--white-alpha-85)" }}>
              {subtitle.split(" · ")[0]}
            </span>
          )}
        </div>
      </div>

      {/* Info — title+subtitle as tight pair, price separated */}
      <div className="flex flex-col" style={{ padding: 12, gap: 8 }}>
        <div className="flex flex-col" style={{ gap: 2 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {title}
          </span>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subtitle}
          </span>
        </div>
        <div className="flex items-baseline" style={{ gap: 6 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
            &#x20B9;{price.toLocaleString("en-IN")}
          </span>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
            &#x20B9;{originalPrice.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// TODO(api): GET /api/marketplace/products/related?type=course
const DUMMY_RELATED_COURSES = [
  { id: "c-2",  title: "NEET Biology Masterclass",    subtitle: "6-Month · NCERT + PYQs",     price: 2999, originalPrice: 5999,  gradientBg: "linear-gradient(135deg, #003320 0%, #006d2c 100%)", thumbLabel: "NEET", badge: "NEET", badgeColor: "#52c41a", badgeBorder: "#52c41a60" },
  { id: "mt-2", title: "JEE Mock Series",             subtitle: "25 Full-Length Tests",        price: 799,  originalPrice: 1499,  gradientBg: "linear-gradient(135deg, #001d66 0%, #0958d9 100%)", thumbLabel: "JEE",  badge: "MOCK", badgeColor: "#4096ff", badgeBorder: "#4096ff60" },
  { id: "lc-1", title: "JEE Physics Live",            subtitle: "Mon/Wed/Fri · 7PM",           price: 1299, originalPrice: 2499,  gradientBg: "linear-gradient(135deg, #1a0050 0%, #531dab 100%)", thumbLabel: "LIVE", badge: "LIVE", badgeColor: "#ff4d4f", badgeBorder: "#ff4d4f60" },
  { id: "c-4",  title: "UPSC Foundation",             subtitle: "12-Month · Complete Prep",    price: 4499, originalPrice: 8999,  gradientBg: "linear-gradient(135deg, #3b1a00 0%, #8c4300 100%)", thumbLabel: "UPSC", badge: "UPSC", badgeColor: "#fa8c16", badgeBorder: "#fa8c1660" },
  { id: "sk-1", title: "Python for Beginners",        subtitle: "3-Month · 50+ Projects",      price: 799,  originalPrice: 1599,  gradientBg: "linear-gradient(135deg, #003135 0%, #00838a 100%)", thumbLabel: "Python" },
];

// TODO(api): GET /api/marketplace/products/related?type=mock-test
// Builds MockTest[] from TEST_SERIES_PRODUCTS so the "you might also like" cards
// look identical to the marketplace-v1 rails (same recipe, same thumbnails).
function relatedTestSeriesFor(currentId: string): MockTest[] {
  return Object.values(TEST_SERIES_PRODUCTS)
    .filter((p) => p.id !== currentId)
    .slice(0, 6)
    .map((p): MockTest => {
      const minCount = Math.min(...p.testVariants.map((v) => v.count));
      const maxCount = Math.max(...p.testVariants.map((v) => v.count));
      const priceFrom = Math.min(...p.testVariants.map((v) => v.price));
      return {
        id: p.id,
        title: p.title,
        examLabel: p.examLabel,
        examAbbr: p.examLabel.split(" ")[0],
        testCount: p.testCount,
        questionCount: p.questionCount,
        price: p.price,
        originalPrice: p.originalPrice,
        accentColor: p.examAccent,
        minCount,
        maxCount,
        packCount: p.testVariants.length,
        priceFrom,
        pattern: PATTERN_BY_EXAM[p.id],
      };
    });
}

// TODO(api): GET /api/marketplace/products/related?type=physical
const DUMMY_RELATED_PHYSICAL = [
  { id: "bk-1", title: "HC Verma Physics",       subtitle: "Vol. 1 & 2 Set",           price: 499,  originalPrice: 850,  thumbImage: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=240&fit=crop&q=80" },
  { id: "bk-2", title: "NCERT Class 12 Set",     subtitle: "All Subjects · PCM",        price: 1199, originalPrice: 1800, thumbImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=240&fit=crop&q=80" },
  { id: "st-1", title: "PrepMaster Study Kit",   subtitle: "5 Notebooks + Pens",        price: 399,  originalPrice: 799,  thumbImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=240&fit=crop&q=80" },
  { id: "lk-1", title: "Science Lab Kit",        subtitle: "Class 6–10 · NCERT Based",  price: 349,  originalPrice: 699,  thumbImage: "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=240&fit=crop&q=80" },
  { id: "st-3", title: "Casio FX-991ES Plus",    subtitle: "Scientific Calculator",     price: 799,  originalPrice: 1299, thumbImage: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=240&fit=crop&q=80" },
];

// ─── Course Detail View ───────────────────────────────────────────────────────

function CourseDetailView({ product, navigate, isEnrolled = false }: { product: CourseProduct; navigate: (path: string, opts?: { state?: unknown }) => void; isEnrolled?: boolean }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(1);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const variant = product.durationVariants[selectedVariant];
  const discount = Math.round((1 - variant.price / variant.originalPrice) * 100);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", position: "relative" }}>
      {/* Floating close — sits over the hero, always visible top-right */}
      <button
        aria-label="Close"
        onClick={() => navigate(-1 as never)}
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
      </button>
      <div ref={scrollRef} className="flex-1 min-h-0" style={{ overflowY: "auto", paddingBottom: 88 }}>

      {/* Hero — full bleed from top of viewport; status bar + close X overlay on it (matches the expanded-card feel) */}
      <div style={{ position: "relative", width: "100%", height: 260, backgroundColor: `color-mix(in srgb, ${product.examAccent} 10%, #0a0408)`, overflow: "hidden", flexShrink: 0 }}>
        {/* Ambient wash */}
        <div aria-hidden style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${product.examAccent}40 0%, ${product.examAccent}18 45%, transparent 100%)` }} />
        {/* Brand glow top-right */}
        <div aria-hidden style={{ position: "absolute", top: -100, right: -80, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${product.examAccent} 0%, ${product.examAccent}55 35%, transparent 70%)`, filter: "blur(36px)", opacity: 0.7 }} />
        {/* Bottom-left soft glow */}
        <div aria-hidden style={{ position: "absolute", bottom: -80, left: -60, width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${product.examAccent} 0%, transparent 70%)`, filter: "blur(44px)", opacity: 0.35 }} />

        {/* Status bar legibility gradient */}
        <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 88, background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)", pointerEvents: "none" }} />

        {/* Status bar overlay */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, pointerEvents: "none" }}>
          <StatusBar />
        </div>

        {/* Big brand letters (matches the card center mark) */}
        <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0 }}>
          <span style={{ fontSize: 124, fontWeight: 900, color: product.examAccent, opacity: 0.88, letterSpacing: -4, lineHeight: 1, textShadow: [`0 0 56px ${product.examAccent}99`, `0 4px 18px ${product.examAccent}55`].join(", ") }}>
            {product.examLabel.split(" ")[0]}
          </span>
        </div>

        {/* Discount pill — hidden in enrolled view (no pricing pitch). */}
        {!isEnrolled && (
        <div style={{ position: "absolute", top: 56, left: 16, zIndex: 4 }}>
          <div className="flex items-center justify-center" style={{
            paddingLeft: 8, paddingRight: 8, height: 24, borderRadius: 6,
            background: "linear-gradient(180deg, rgba(184,80,72,0.72) 0%, rgba(160,68,62,0.72) 100%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "0.5px solid rgba(255,255,255,0.14)",
          }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "#fff", letterSpacing: 0.3 }}>
              {discount}% OFF
            </span>
          </div>
        </div>
        )}

        {/* Exam badge — bottom-left, matches card */}
        <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 4 }}>
          <div className="flex items-center justify-center" style={{
            paddingLeft: 10, paddingRight: 10, height: 24, borderRadius: 6,
            backgroundColor: `${product.examAccent}1f`,
            border: `0.5px solid ${product.examAccent}55`,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: product.examAccent, letterSpacing: 0.4 }}>
              {product.examLabel}
            </span>
          </div>
        </div>

        {/* Share — bottom-right (left of wishlist when not enrolled,
            anchored fully right when enrolled since wishlist is gone). */}
        <button
          aria-label="Share this course"
          onClick={() => setShareOpen(true)}
          className="flex items-center justify-center"
          style={{ position: "absolute", bottom: 12, right: isEnrolled ? 12 : 56, zIndex: 4, width: 36, height: 36, borderRadius: 9999, backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "none", cursor: "pointer" }}
        >
          <Share2 size={18} style={{ color: "#fff" }} />
        </button>

        {/* Wishlist — hidden in enrolled view (already owned). */}
        {!isEnrolled && (
        <button
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => setWishlisted(!wishlisted)}
          className="flex items-center justify-center"
          style={{ position: "absolute", bottom: 12, right: 12, zIndex: 4, width: 36, height: 36, borderRadius: 9999, backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "none", cursor: "pointer" }}
        >
          <Heart
            size={18}
            style={{
              color: wishlisted ? "var(--error-500)" : "#fff",
              fill: wishlisted ? "var(--error-500)" : "transparent",
            }}
          />
        </button>
        )}
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        trigger="manual"
        productKind="test-prep"
        productName={product.title}
      />

      {/* Title block — sits right below the hero so the morph text lands here */}
      <div className="flex flex-col" style={{ padding: "16px 16px 12px", gap: 4, backgroundColor: "var(--background)" }}>
        <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", lineHeight: 1.3 }}>
          {product.title}
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
          {product.tagline}
        </span>
      </div>

      {/* Stats strip */}
      <div className="flex" style={{ backgroundColor: "var(--white-alpha-4)", borderBottom: "1px solid var(--border)" }}>
        {[
          { Icon: Users, value: product.students, label: "Students" },
          { Icon: Clock, value: product.contentHours, label: "Content" },
          { Icon: BookOpen, value: product.pyqYears, label: "PYQs" },
        ].map(({ Icon, value, label }, i) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center"
            style={{
              flex: 1, paddingTop: 12, paddingBottom: 12, gap: 2,
              borderRight: i < 2 ? "1px solid var(--border)" : "none",
            }}
          >
            <Icon size={14} style={{ color: "var(--muted-foreground)" }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>{value}</span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col" style={{ padding: "20px 16px", gap: 20 }}>

        {/* Rating row */}
        <div className="flex items-center" style={{ gap: 8 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--warning-500)" }}>
            {product.rating}
          </span>
          <StarRow rating={product.rating} />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
            ({product.reviewCount.toLocaleString("en-IN")})
          </span>
        </div>

        {/* Instructor + Choose Plan — both hidden in enrolled view. */}
        {!isEnrolled && (
          <>
            <Divider />

            {/* Instructor */}
            <div className="flex flex-col" style={{ gap: 12 }}>
              <SectionTitle>Your Instructor</SectionTitle>
              <div className="flex items-center" style={{ gap: 12 }}>
                <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 9999, backgroundColor: "var(--primary)", flexShrink: 0 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                    {product.instructor.initials}
                  </span>
                </div>
                <div className="flex flex-col" style={{ gap: 2 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                    {product.instructor.name}
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                    {product.instructor.role}
                  </span>
                  <div className="flex items-center" style={{ gap: 4, marginTop: 2 }}>
                    <Award size={12} style={{ color: "var(--warning-500)" }} />
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                      Top-rated educator · 4.9 avg rating
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            {/* Duration selector */}
            <div className="flex flex-col" style={{ gap: 12 }}>
              <SectionTitle>Choose Plan</SectionTitle>
              <div className="flex" style={{ gap: 8 }}>
                {product.durationVariants.map((v, i) => (
                  <motion.button
                    key={v.label}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedVariant(i)}
                    className="flex flex-col items-center"
                    style={{
                      flex: 1, paddingTop: 12, paddingBottom: 12, borderRadius: 12,
                      border: `1.5px solid ${selectedVariant === i ? product.examAccent : "var(--border)"}`,
                      backgroundColor: selectedVariant === i ? `${product.examAccent}15` : "var(--card)",
                      cursor: "pointer", gap: 2,
                    }}
                  >
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-bold)", color: selectedVariant === i ? product.examAccent : "var(--foreground)" }}>
                      {v.label}
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                      &#x20B9;{v.price.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
                      &#x20B9;{v.originalPrice.toLocaleString("en-IN")}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </>
        )}

        <Divider />

        {/* What you'll learn */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>What you will learn</SectionTitle>
          <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", padding: 16 }}>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {product.whatYoullLearn.map((item, i) => (
                <div key={i} className="flex" style={{ gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: "var(--success)", marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        {/* Curriculum */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <div className="flex items-center justify-between">
            <SectionTitle>Course Content</SectionTitle>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
              {product.curriculum.reduce((s, c) => s + c.topics, 0)} topics
            </span>
          </div>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {product.curriculum.map((chapter, i) => (
              <div key={i} style={{ borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
                <button
                  onClick={() => setExpandedChapter(expandedChapter === i ? null : i)}
                  className="flex items-center justify-between"
                  style={{ width: "100%", padding: "12px 16px", backgroundColor: "var(--card)", border: "none", cursor: "pointer" }}
                >
                  <div className="flex flex-col items-start" style={{ gap: 2 }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", textAlign: "left" }}>
                      {chapter.title}
                    </span>
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                      {chapter.topics} topics · {chapter.duration}
                    </span>
                  </div>
                  {expandedChapter === i
                    ? <ChevronUp size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                    : <ChevronDown size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                  }
                </button>
                <AnimatePresence>
                  {expandedChapter === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="flex flex-col" style={{ padding: "4px 16px 12px", gap: 8, borderTop: "1px solid var(--border)" }}>
                        {chapter.lessons.map((lesson, j) => (
                          <div key={j} className="flex items-center" style={{ gap: 8 }}>
                            <Play size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>{lesson}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* What's included */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>What is included</SectionTitle>
          <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", padding: 16 }}>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {product.whatsIncluded.map((item, i) => (
                <div key={i} className="flex items-center" style={{ gap: 8 }}>
                  <Zap size={14} style={{ color: "var(--warning-500)", flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        {/* Description */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>About this course</SectionTitle>
          <div style={{ position: "relative" }}>
            <span
              style={{
                fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.7,
                display: "-webkit-box",
                WebkitLineClamp: showFullDesc ? undefined : 4,
                WebkitBoxOrient: "vertical" as const,
                overflow: showFullDesc ? "visible" : "hidden",
              }}
            >
              {product.description}
            </span>
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              style={{ background: "none", border: "none", cursor: "pointer", marginTop: 4 }}
            >
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary)" }}>
                {showFullDesc ? "Show less" : "Read more"}
              </span>
            </button>
          </div>
        </div>

        {/* Trust strip + Reviews + Related — all hidden in enrolled view. */}
        {!isEnrolled && (
          <>
            <Divider />

            {/* Trust strip */}
            <div className="flex items-center justify-around" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {[
                { Icon: ShieldCheck, label: "Secure payment" },
                { Icon: RefreshCw, label: "7-day refund" },
                { Icon: Monitor, label: "Any device" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center" style={{ gap: 4 }}>
                  <Icon size={18} style={{ color: "var(--muted-foreground)" }} />
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{label}</span>
                </div>
              ))}
            </div>

            <Divider />
            <ReviewsSection rating={product.rating} reviewCount={product.reviewCount} />
            <Divider />

            {/* Related */}
            <div className="flex flex-col" style={{ gap: 12 }}>
              <SectionTitle>You might also like</SectionTitle>
              <div className="flex" style={{ gap: 8, overflowX: "auto", marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, paddingBottom: 4 }}>
                {DUMMY_RELATED_COURSES.map((p) => (
                  <SmallRelatedCard
                    key={p.id}
                    {...p}
                    onClick={() => navigate(`/marketplace/product/${p.id}`)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      </div>

      {/* Sticky CTA — suppressed when the student arrived via "About this
          course" from inside their already-enrolled course. */}
      {!isEnrolled && (
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: "var(--background)", borderTop: "1px solid var(--border)",
        padding: "12px 16px", paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div className="flex flex-col" style={{ gap: 2 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                &#x20B9;{variant.price.toLocaleString("en-IN")}
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
                &#x20B9;{variant.originalPrice.toLocaleString("en-IN")}
              </span>
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", color: "var(--error-500)" }}>
                {discount}% OFF
              </span>
            </div>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{variant.label} access</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/marketplace/checkout", { state: {
              courseId: product.id,
              productTitle: product.title,
              planLabel: variant.label,
              price: variant.price,
              originalPrice: variant.originalPrice,
            } })}
            className="flex items-center justify-center"
            style={{
              flex: 1, height: 44, borderRadius: 10,
              backgroundColor: "var(--primary)", border: "none", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
              Enroll Now
            </span>
          </motion.button>
        </div>
      </div>
      )}
    </div>
  );
}

// ─── Mock Test Detail View ────────────────────────────────────────────────────

// ─── MockTestHero — shared recipe across card/morph/detail for smooth transition
function MockTestHero({
  product,
  selectedCount,
  selectedPrice,
  selectedOriginalPrice,
}: {
  product: MockTestProduct;
  selectedCount?: number;
  selectedPrice?: number;
  selectedOriginalPrice?: number;
}) {
  // Adapt MockTestProduct → MockTest shape for the shared inner-hero helper
  const minCount = Math.min(...product.testVariants.map((v) => v.count));
  const maxCount = Math.max(...product.testVariants.map((v) => v.count));
  const priceFrom = Math.min(...product.testVariants.map((v) => v.price));
  const originalFrom = Math.min(...product.testVariants.map((v) => v.originalPrice));
  // Hero % OFF reflects the selected pack (was hardcoded to cheapest priceFrom)
  const effectivePrice = selectedPrice ?? priceFrom;
  const effectiveOriginal = selectedOriginalPrice ?? originalFrom;
  const pct = Math.round((1 - effectivePrice / effectiveOriginal) * 100);
  // Big hero number reflects the selected pack so it stays in sync with the breakdown below.
  const displayCount = selectedCount ?? product.testCount;
  const heroTest: MockTest = {
    id: product.id,
    title: product.title,
    examLabel: product.examLabel,
    examAbbr: product.examLabel.split(" ")[0],
    testCount: displayCount,
    questionCount: product.questionCount,
    price: product.price,
    originalPrice: product.originalPrice,
    accentColor: product.examAccent,
    minCount, maxCount,
    packCount: product.testVariants.length,
    priceFrom,
    pattern: PATTERN_BY_EXAM[product.id],
  };
  const metaRight = `${product.testVariants.length} plans`;

  // On the detail page, show the pack-count range (e.g., "10–60") so the
  // thumbnail clearly communicates that multiple options exist. Listing cards
  // still use TestSeriesHeroInner with a single number for quick recognition.
  const heroLabel = minCount !== maxCount ? `${minCount} - ${maxCount}` : undefined;
  return (
    <div style={{ position: "relative", width: "100%", height: 260, backgroundColor: "var(--card)", overflow: "hidden", flexShrink: 0 }}>
      <TestSeriesHeroInner test={heroTest} scale={2.4} heroLabel={heroLabel} />

      {/* Status bar legibility gradient */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 88, background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)", pointerEvents: "none", zIndex: 2 }} />

      {/* Status bar overlay */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, pointerEvents: "none" }}>
        <StatusBar />
      </div>

    </div>
  );
}

// Pattern by mt-* id, used by detail hero. Mirrors the rail data.
const PATTERN_BY_EXAM: Record<string, string> = {
  "mt-jee-main": "NTA Pattern",
  "mt-jee-adv":  "IIT Pattern",
  "mt-gate-cse": "IISc Pattern",
  "mt-neet-ug":  "NTA Pattern",
  "mt-neet-pg":  "INI CET Pattern",
  "mt-cat":      "IIM Pattern",
  "mt-clat":     "Consortium Pattern",
  "mt-upsc":     "UPSC Pattern",
  "mt-ssc":      "SSC Pattern",
  "mt-bank":     "IBPS Pattern",
};

function MockTestDetailView({ product, navigate, isEnrolled = false }: { product: MockTestProduct; navigate: (path: string, opts?: { state?: unknown }) => void; isEnrolled?: boolean }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(1);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const testVariant = product.testVariants[selectedVariantIndex];
  const discount = Math.round((1 - testVariant.price / testVariant.originalPrice) * 100);

  // Per-pack breakdown is now computed inside each Choose Pack card —
  // no shared scaled state above the selector.

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", position: "relative" }}>
      {/* Floating close — over the hero, always visible top-right */}
      <button
        aria-label="Close"
        onClick={() => navigate(-1 as never)}
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
      </button>
      <div ref={scrollRef} className="flex-1 min-h-0" style={{ overflowY: "auto", paddingBottom: 88 }}>

      {/* Hero — stays static (product identity), pack selection only affects body data */}
      <MockTestHero product={product} />

      {/* Title block — fully static, minimal */}
      <div className="flex flex-col" style={{ padding: "16px 16px 16px", gap: 4, backgroundColor: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", lineHeight: 1.3 }}>
          {product.title}
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
          {product.testVariants.length} plans available
        </span>
      </div>

      <div className="flex flex-col" style={{ padding: "20px 16px", gap: 20 }}>

        {/* Demo CTA — single full-width outlined button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/practice/pyq")}
          className="flex items-center justify-center w-full"
          style={{
            height: 40, borderRadius: 12, gap: 6,
            backgroundColor: "transparent",
            border: "1px solid var(--primary)",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <Play size={14} fill="var(--primary)" style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary)" }}>
            Take a demo mock test
          </span>
        </motion.button>

        {/* Choose Pack — each card carries its own breakdown */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>Choose Pack</SectionTitle>
          <div className="flex flex-col" style={{ gap: 10 }}>
            {product.testVariants.map((v, i) => {
              const isSelected = selectedVariantIndex === i;
              const ratio = product.testCount > 0 ? v.count / product.testCount : 1;
              const cardPyq = Math.max(0, Math.round(product.pyqCount * ratio));
              const cardFullLength = Math.max(0, v.count - cardPyq);
              return (
                <motion.button
                  key={v.label}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedVariantIndex(i)}
                  className="w-full flex items-center"
                  style={{
                    minHeight: 64,
                    paddingLeft: 16, paddingRight: 16,
                    paddingTop: 12, paddingBottom: 12,
                    gap: 12,
                    borderRadius: 12,
                    border: isSelected ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                    backgroundColor: isSelected ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "var(--card)",
                    cursor: "pointer",
                    textAlign: "left",
                    flexShrink: 0,
                  }}
                >
                  {/* Radio dot */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 9999,
                    border: isSelected ? "6px solid var(--primary)" : "1.5px solid var(--border)",
                    flexShrink: 0,
                    boxSizing: "border-box",
                  }} />

                  {/* Left: count + breakdown */}
                  <div className="flex flex-col flex-1" style={{ gap: 4 }}>
                    <div className="flex items-center" style={{ gap: 8, flexWrap: "nowrap" }}>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {v.count} tests
                      </span>
                      {v.tag === "POPULAR" && (
                        <div style={{
                          paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 4,
                          backgroundColor: "color-mix(in srgb, var(--primary) 16%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--primary) 36%, transparent)",
                          display: "flex", alignItems: "center", flexShrink: 0,
                        }}>
                          <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", color: "var(--primary)", whiteSpace: "nowrap" }}>
                            Most Popular
                          </span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                      {cardFullLength} Full Length{cardPyq > 0 ? ` + ${cardPyq} PYQ` : ""}
                    </span>
                  </div>

                  {/* Right: total price + struck + % off (green) */}
                  <div className="flex flex-col items-end" style={{ gap: 2, flexShrink: 0 }}>
                    <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: isSelected ? "var(--primary-300)" : "var(--foreground)" }}>
                      ₹{v.price.toLocaleString("en-IN")}
                    </span>
                    <div className="flex items-center" style={{ gap: 4 }}>
                      <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
                        ₹{v.originalPrice.toLocaleString("en-IN")}
                      </span>
                      <span style={{ fontSize: "var(--text-2xs)", color: "var(--success-500)", fontWeight: "var(--font-weight-semibold)" }}>
                        {Math.round((1 - v.price / v.originalPrice) * 100)}% off
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* Subjects covered */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <SectionTitle>Subjects Covered</SectionTitle>
          <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
            {product.subjects.map((subj) => (
              <div
                key={subj}
                style={{
                  paddingLeft: 12, paddingRight: 12, height: 32, borderRadius: 9999,
                  backgroundColor: "var(--card)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center",
                }}
              >
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                  {subj}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* Analytics preview card */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>Performance Analytics</SectionTitle>
          <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", padding: 16 }}>
            <div className="flex flex-col" style={{ gap: 16 }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${product.examAccent}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BarChart2 size={16} style={{ color: product.examAccent }} />
                </div>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                  After every test you get
                </span>
              </div>
              <div className="flex flex-col" style={{ gap: 12 }}>
                {[
                  { icon: Award,     label: "All-India Rank & percentile" },
                  { icon: BarChart2, label: "Subject-wise score breakdown" },
                  { icon: Clock,     label: "Time spent per question" },
                  { icon: Users,     label: "Comparison with top 1% scorers" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center" style={{ gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${product.examAccent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={14} style={{ color: product.examAccent }} />
                    </div>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Divider />

        {/* What's included */}
        <div id="whats-included" className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>What is included</SectionTitle>
          <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", padding: 16 }}>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {product.whatsIncluded.map((item, i) => (
                <div key={i} className="flex items-center" style={{ gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: product.examAccent, flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        {/* Features */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>Test Features</SectionTitle>
          <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", padding: 16 }}>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {product.features.map((feat, i) => (
                <div key={i} className="flex items-center" style={{ gap: 8 }}>
                  <ShieldCheck size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        {/* Description */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <SectionTitle>About this test series</SectionTitle>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.7 }}>
            {product.description}
          </span>
        </div>

        <Divider />

        {/* Related */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>You might also like</SectionTitle>
          <div className="flex" style={{ gap: 12, overflowX: "auto", marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, paddingBottom: 4 }}>
            {relatedTestSeriesFor(product.id).map((t) => (
              <PremiumTestSeriesCard
                key={t.id}
                test={t}
                onClick={() => navigate(`/marketplace/product/${t.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Sticky CTA — suppressed for already-enrolled view. */}
      {!isEnrolled && (
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: "var(--background)", borderTop: "1px solid var(--border)",
        padding: "12px 16px", paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                &#x20B9;{testVariant.price.toLocaleString("en-IN")}
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
                  {discount}% off
                </span>
              </div>
            </div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
              &#x20B9;{testVariant.originalPrice.toLocaleString("en-IN")}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/marketplace/order-confirm", { state: {
              testSeriesPackId: product.id,
              planLabel: testVariant.label,
              packCount: testVariant.count,
              productTitle: product.title,
              price: testVariant.price,
              originalPrice: testVariant.originalPrice,
            } })}
            className="flex items-center justify-center"
            style={{ width: 156, flexShrink: 0, height: 44, borderRadius: 10, backgroundColor: "var(--primary)", border: "none", cursor: "pointer" }}
          >
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
              Buy Now
            </span>
          </motion.button>
        </div>
      </div>
      )}
    </div>
  );
}

// ─── Physical Product Detail View ─────────────────────────────────────────────

function ImageGallery({ images, lowestPrice }: { images: string[]; lowestPrice?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Sync activeIndex from the scroll-snap position via IntersectionObserver.
  // Fires as each slide crosses 60% visibility — feels closer to "settled"
  // than checking on scroll-end which can lag.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { root, threshold: [0.6] },
    );
    slideRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [images.length]);

  // Auto-scroll the thumbnail strip to keep the active thumb visible.
  useEffect(() => {
    const thumb = thumbRefs.current[activeIndex];
    if (!thumb) return;
    thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

  function scrollToIndex(i: number) {
    const slide = slideRefs.current[i];
    const scroller = scrollerRef.current;
    if (!slide || !scroller) return;
    scroller.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col">
      {/* Main image — native horizontal scroll-snap. Finger drag follows directly,
          momentum + snap come for free from the browser. */}
      <div style={{ position: "relative" }}>
        <div
          ref={scrollerRef}
          className="flex"
          style={{
            width: "100%",
            aspectRatio: "3 / 2",
            overflowX: "auto",
            overflowY: "hidden",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            backgroundColor: "var(--card)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              data-idx={i}
              ref={(el) => { slideRefs.current[i] = el; }}
              style={{
                width: "100%",
                height: "100%",
                flexShrink: 0,
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
              }}
            >
              <img
                src={src}
                alt={`Product view ${i + 1}`}
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Top scrim — gives status bar + close button readable contrast on any slide */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 112,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 50%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* "Lowest price online" pill — frosted, top-left, clears the status bar.
            Quiet entry badge; the proof lives in the price-comparison table below. */}
        {lowestPrice && (
          <div
            className="flex items-center"
            style={{
              position: "absolute", top: 52, left: 12, zIndex: 2, gap: 6,
              padding: "6px 10px", borderRadius: 9999,
              backgroundColor: "rgba(0, 0, 0, 0.32)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              border: "0.5px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.24)",
            }}
          >
            <TrendingDown size={14} style={{ color: "var(--white)" }} />
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", color: "var(--white)", letterSpacing: 0.4 }}>
              Lowest price online
            </span>
          </div>
        )}

        {/* Bottom scrim — softens the pagination capsule edge */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: 80,
            background:
              "linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Carousel indicator — frosted-glass capsule */}
        <div
          className="flex items-center justify-center"
          style={{ position: "absolute", bottom: 16, left: 0, right: 0, pointerEvents: "none" }}
        >
          <div
            className="flex items-center"
            style={{
              gap: 8,
              padding: "8px 12px",
              borderRadius: 9999,
              backgroundColor: "rgba(0, 0, 0, 0.32)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              border: "0.5px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.24)",
              pointerEvents: "auto",
            }}
          >
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`View image ${i + 1}`}
                onClick={() => scrollToIndex(i)}
                style={{
                  padding: 0,
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  display: "flex",
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: i === activeIndex ? 20 : 4,
                    height: 4,
                    borderRadius: 9999,
                    backgroundColor:
                      i === activeIndex ? "var(--white)" : "rgba(255, 255, 255, 0.4)",
                    transition:
                      "width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div
        ref={thumbStripRef}
        className="flex"
        style={{ gap: 8, padding: "12px 16px", overflowX: "auto", scrollbarWidth: "none" }}
      >
        {images.map((src, i) => (
          <button
            key={i}
            ref={(el) => { thumbRefs.current[i] = el; }}
            aria-label={`Select image ${i + 1}`}
            onClick={() => scrollToIndex(i)}
            style={{
              width: 64, height: 64, borderRadius: 8, overflow: "hidden", flexShrink: 0,
              border: `2px solid ${i === activeIndex ? "var(--foreground)" : "var(--border)"}`,
              padding: 0, backgroundColor: "var(--card)", cursor: "pointer",
              transition: "border-color 0.15s ease",
            }}
          >
            <img src={src} alt={`Thumbnail ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function PhysicalDetailView({ product, navigate, isEnrolled = false }: { product: PhysicalProduct; navigate: (path: string, opts?: { state?: unknown }) => void; isEnrolled?: boolean }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  // "Lowest price online" — true only when we genuinely beat every tracked retailer.
  const comparison = product.priceComparison ?? [];
  const isLowestOnline = comparison.length > 0 && comparison.every((c) => product.price < c.price);
  const cheapestRival = comparison.length > 0 ? Math.min(...comparison.map((c) => c.price)) : 0;

  const CategoryIcon = product.categoryId === "lab-kits" ? FlaskConical : product.categoryId === "stationery" ? PenLine : product.categoryId === "devices" ? Monitor : BookOpen;
  const visibleSpecs = showAllSpecs ? product.specs : product.specs.slice(0, 4);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", position: "relative" }}>
      {/* Status bar legibility gradient — fixed overlay above gallery so chrome reads on light images */}
      <div
        aria-hidden
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 96, zIndex: 49,
          background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.22) 55%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Status bar — fixed at viewport top, doesn't scroll with the gallery */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 50, pointerEvents: "none" }}>
        <StatusBar />
      </div>
      {/* Floating close — over the gallery, always visible top-right */}
      <button
        aria-label="Close"
        onClick={() => navigate(-1 as never)}
        className="flex items-center justify-center"
        style={{
          position: "absolute", top: 52, right: 12, zIndex: 51,
          width: 36, height: 36, borderRadius: 9999,
          backgroundColor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "none", cursor: "pointer",
        }}
      >
        <X size={20} style={{ color: "#fff" }} />
      </button>
      <div ref={scrollRef} className="flex-1 min-h-0" style={{ overflowY: "auto", paddingBottom: 88 }}>

      {/* Image gallery */}
      <ImageGallery images={product.images} lowestPrice={isLowestOnline} />

      <div className="flex flex-col" style={{ padding: "20px 16px", gap: 20 }}>

        {/* Product identity */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <div className="flex items-center" style={{ gap: 6 }}>
            <CategoryIcon size={12} style={{ color: "var(--muted-foreground)" }} />
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: "var(--font-weight-semibold)", letterSpacing: 1, textTransform: "uppercase" }}>
              {product.brand}
            </span>
          </div>
          <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", lineHeight: 1.4 }}>
            {product.title}
          </span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
            {product.subtitle}
          </span>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--warning-500)" }}>{product.rating}</span>
            <StarRow rating={product.rating} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
              ({product.reviewCount.toLocaleString("en-IN")} reviews)
            </span>
          </div>
        </div>

        <Divider />

        {/* Price + quantity — purchase section */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
              &#x20B9;{product.price.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
              &#x20B9;{product.originalPrice.toLocaleString("en-IN")}
            </span>
            <div
              className="flex items-center justify-center"
              style={{
                paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 4,
                backgroundColor: "color-mix(in srgb, var(--warning-500) 14%, transparent)",
                border: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
              }}
            >
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--warning-500)" }}>{discount}% off</span>
            </div>
          </div>
          {isLowestOnline && (
            <div className="flex items-center" style={{ gap: 6 }}>
              <TrendingDown size={14} style={{ color: "var(--success)", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--success)" }}>
                Lowest price online — save &#x20B9;{(cheapestRival - product.price).toLocaleString("en-IN")}+ vs other stores
              </span>
            </div>
          )}
          <div className="flex items-center" style={{ gap: 16 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>Qty</span>
            <div className="flex items-center" style={{ gap: 0, borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden" }}>
              <button
                aria-label="Decrease quantity"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex items-center justify-center"
                style={{ width: 44, height: 44, backgroundColor: "var(--card)", border: "none", cursor: "pointer", borderRight: "1px solid var(--border)" }}
              >
                <Minus size={16} style={{ color: quantity <= 1 ? "var(--border)" : "var(--foreground)" }} />
              </button>
              <span className="flex items-center justify-center" style={{ width: 44, height: 44, fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                {quantity}
              </span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="flex items-center justify-center"
                style={{ width: 44, height: 44, backgroundColor: "var(--card)", border: "none", cursor: "pointer", borderLeft: "1px solid var(--border)" }}
              >
                <Plus size={16} style={{ color: "var(--foreground)" }} />
              </button>
            </div>
          </div>
        </div>

        {/* Price comparison — proves the "Lowest price online" claim. Our row first,
            then each tracked retailer with the price gap vs us. */}
        {comparison.length > 0 && (
          <>
            <Divider />
            <div className="flex flex-col" style={{ gap: 12 }}>
              <SectionTitle>Price comparison</SectionTitle>
              <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
                {[{ retailer: "Teachmint", price: product.price, ours: true },
                  ...[...comparison].sort((a, b) => a.price - b.price).map((c) => ({ ...c, ours: false }))]
                  .map((row, i, arr) => (
                    <div
                      key={row.retailer}
                      className="flex items-center justify-between"
                      style={{
                        padding: "12px",
                        borderBottom: i < arr.length - 1 ? "0.5px solid var(--border)" : "none",
                      }}
                    >
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: row.ours ? "var(--font-weight-bold)" : "var(--font-weight-semibold)", color: row.ours ? "var(--foreground)" : "var(--muted-foreground)" }}>
                        {row.retailer}
                      </span>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: row.ours ? "var(--success)" : "var(--foreground)" }}>
                        &#x20B9;{row.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                Prices shown are indicative and updated periodically.
              </span>
            </div>
          </>
        )}

        <Divider />

        {/* Highlights — naked checklist, no container. Sells the product fast. */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>Highlights</SectionTitle>
          <div className="flex flex-col" style={{ gap: 10 }}>
            {product.highlights.map((item, i) => (
              <div key={i} className="flex" style={{ gap: 10 }}>
                <CheckCircle2 size={16} style={{ color: "var(--success)", marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* Specs table — filled container (matches course/crash/camp/music detail language) */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>Specifications</SectionTitle>
          <div style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
            {visibleSpecs.map(({ label, value }, i) => (
              <div
                key={label}
                className="flex"
                style={{
                  borderBottom: i < visibleSpecs.length - 1 ? "0.5px solid var(--border)" : "none",
                }}
              >
                <span style={{ width: "40%", padding: "12px", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: "var(--font-weight-semibold)" }}>
                  {label}
                </span>
                <span style={{ padding: "12px", fontSize: "var(--text-xs)", color: "var(--foreground)", flex: 1 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
          {product.specs.length > 4 && (
            <button
              onClick={() => setShowAllSpecs(!showAllSpecs)}
              className="flex items-center justify-center"
              style={{ gap: 4, height: 40, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "transparent", cursor: "pointer" }}
            >
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                {showAllSpecs ? "Show fewer specs" : `See all ${product.specs.length} specs`}
              </span>
              {showAllSpecs ? <ChevronUp size={14} style={{ color: "var(--foreground)" }} /> : <ChevronDown size={14} style={{ color: "var(--foreground)" }} />}
            </button>
          )}
        </div>

        <Divider />

        {/* Description — naked prose */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>Product Description</SectionTitle>
          <div>
            <span
              style={{
                fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.7,
                display: "-webkit-box",
                WebkitLineClamp: showFullDesc ? undefined : 4,
                WebkitBoxOrient: "vertical" as const,
                overflow: showFullDesc ? "visible" : "hidden",
              }}
            >
              {product.description}
            </span>
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              style={{ background: "none", border: "none", cursor: "pointer", marginTop: 4, display: "block" }}
            >
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary)" }}>
                {showFullDesc ? "Show less" : "Read more"}
              </span>
            </button>
          </div>
        </div>

        <Divider />

        {/* Delivery + warranty trust band — filled container, sits right above the
            sticky CTA so the buyer sees fulfillment / guarantees just before tapping Buy. */}
        <div className="flex flex-col" style={{ gap: 0, borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
          <div className="flex items-center" style={{ gap: 12, padding: 16, borderBottom: "0.5px solid var(--border)" }}>
            <Truck size={18} style={{ color: "var(--success)", flexShrink: 0 }} />
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                Free Delivery
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                Estimated {product.deliveryDate}
              </span>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: 12, padding: 16, borderBottom: "0.5px solid var(--border)" }}>
            <RefreshCw size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                {product.returnDays}-day replacement
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                {product.categoryId === "devices"
                  ? "Defects or damage on arrival — report within 24 hrs"
                  : "Easy returns if not satisfied"}
              </span>
            </div>
          </div>
          {product.warrantyMonths ? (
            <div className="flex items-center" style={{ gap: 12, padding: 16, borderBottom: "0.5px solid var(--border)" }}>
              <ShieldCheck size={18} style={{ color: "var(--success)", flexShrink: 0 }} />
              <div className="flex flex-col" style={{ gap: 2 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                  {product.warrantyMonths}-month manufacturer warranty
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  Doorstep service by {product.brand}
                </span>
              </div>
            </div>
          ) : null}
          <div className="flex items-center" style={{ gap: 12, padding: 16 }}>
            <Package size={18} style={{ color: "var(--warning-500)", flexShrink: 0 }} />
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                Secure packaging
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                {product.categoryId === "devices" ? "Sealed factory box, tamper-evident seal" : "Bubble-wrapped for safe delivery"}
              </span>
            </div>
          </div>
        </div>

        <Divider />

        {/* Seller — naked single-row block */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>Seller</SectionTitle>
          <div className="flex items-center" style={{ gap: 12 }}>
            <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: "var(--border)", flexShrink: 0 }}>
              <FileText size={18} style={{ color: "var(--muted-foreground)" }} />
            </div>
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                {product.sellerName}
              </span>
              <div className="flex items-center" style={{ gap: 4 }}>
                <Star size={11} style={{ color: "var(--warning-500)", fill: "var(--warning-500)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  {product.sellerRating} · Verified seller
                </span>
              </div>
            </div>
          </div>
        </div>

        <Divider />
        <ReviewsSection rating={product.rating} reviewCount={product.reviewCount} />
        <Divider />

        {/* Related */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <SectionTitle>You might also like</SectionTitle>
          <div className="flex" style={{ gap: 8, overflowX: "auto", marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16, paddingBottom: 4 }}>
            {DUMMY_RELATED_PHYSICAL.map((p) => (
              <SmallRelatedCard key={p.id} {...p} onClick={() => navigate(`/marketplace/product/${p.id}`)} />
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Sticky CTA — suppressed for already-enrolled view. */}
      {!isEnrolled && (
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: "var(--background)", borderTop: "1px solid var(--border)",
        padding: "12px 16px", paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/marketplace/cart")}
            className="flex items-center justify-center"
            style={{ flex: 1, height: 44, borderRadius: 10, border: "1.5px solid var(--border)", backgroundColor: "transparent", cursor: "pointer", gap: 8 }}
          >
            <ShoppingCart size={16} style={{ color: "var(--foreground)" }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
              Add to Cart
            </span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/marketplace/checkout", { state: {
              physicalId: product.id,
              productTitle: product.title,
              price: product.price,
              originalPrice: product.originalPrice,
              qty: quantity,
            } })}
            className="flex items-center justify-center"
            style={{ flex: 1, height: 44, borderRadius: 10, backgroundColor: "var(--primary)", border: "none", cursor: "pointer" }}
          >
            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
              Buy Now
            </span>
          </motion.button>
        </div>
      </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Component() {
  const navigate = useNavigate();
  const { id = "fd4" } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  // When the student arrives via "About this course" from inside their
  // enrolled course (learning-path 3-dot menu), suppress the purchase CTAs.
  // Same detail-page layout, no re-purchase loop.
  const isEnrolled = searchParams.get("enrolled") === "1";
  const product = getProduct(id);

  if (product.type === "mock-test") {
    return <MockTestDetailView product={product} navigate={navigate} isEnrolled={isEnrolled} />;
  }
  if (product.type === "physical") {
    return <PhysicalDetailView product={product} navigate={navigate} isEnrolled={isEnrolled} />;
  }
  return <CourseDetailView product={product} navigate={navigate} isEnrolled={isEnrolled} />;
}
