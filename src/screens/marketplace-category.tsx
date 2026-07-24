/**
 * Marketplace Category — Product listing for a category or section
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, ArrowUpDown, SlidersHorizontal, Star, Heart, Search, ShoppingCart, Check, ChevronDown, X,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar, GlassHeader, typo } from "../shared/premium-ui";
import { ProductImageFallback, discountPct, formatCount } from "./marketplace-shared";

// ─── Filter Types ──────────────────────────────────────────────────────────────
type PriceFilter = "all" | "under_500" | "range_500_2k" | "above_2k";
type TypeFilter = "all" | "digital" | "physical";

const PRICE_FILTER_OPTIONS: { key: PriceFilter; label: string }[] = [
  { key: "all",          label: "All Prices" },
  { key: "under_500",    label: "Under ₹500" },
  { key: "range_500_2k", label: "₹500–₹2K" },
  { key: "above_2k",     label: "₹2K+" },
];

const PRICE_FILTER_LABELS: Record<PriceFilter, string> = {
  all:          "All Prices",
  under_500:    "Under ₹500",
  range_500_2k: "₹500–₹2K",
  above_2k:     "₹2K+",
};

const TYPE_OPTIONS: { key: TypeFilter; label: string }[] = [
  { key: "all",      label: "All Types" },
  { key: "digital",  label: "Digital" },
  { key: "physical", label: "Physical" },
];

// ─── Product ───────────────────────────────────────────────────────────────────
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

// ─── Category Meta (header display) ───────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string }> = {
  courses:         { label: "Courses" },
  "live-class":    { label: "Live Classes" },
  "mock-tests":    { label: "Mock Tests" },
  books:           { label: "Books" },
  stationery:      { label: "Stationery" },
  "skill-courses": { label: "Skills" },
  language:        { label: "Languages" },
  tutoring:        { label: "Tutoring" },
  "lab-kits":      { label: "Lab Kits" },
  "coding-kits":   { label: "Coding Kits" },
  olympiad:        { label: "Olympiad" },
  bundles:         { label: "Bundles" },
  merch:           { label: "Merch" },
  furniture:       { label: "Furniture" },
  nutrition:       { label: "Nutrition" },
  puzzles:         { label: "Puzzles" },
  "wall-charts":   { label: "Wall Charts" },
  "exam-packs":    { label: "Exam Packs" },
  music:           { label: "Music Lessons" },
  all:             { label: "All Products" },
  deals:           { label: "Flash Deals" },
  recommended:     { label: "For You" },
  trending:        { label: "Trending" },
};

const SORT_OPTIONS = [
  { id: "popular",    label: "Most Popular" },
  { id: "price_asc",  label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "rating",     label: "Top Rated" },
  { id: "newest",     label: "Newest First" },
];

const META_CATEGORIES = new Set(["all", "deals", "recommended", "trending"]);

// ─── Dummy Products ────────────────────────────────────────────────────────────
// TODO(api): GET /api/marketplace/products?category=:categoryId&sort=:sort
const DUMMY_PRODUCTS: Product[] = [
  // Digital — thumbImage: "" so ProductImageFallback renders category gradient
  { id: "c-1",  title: "JEE Main 2027 Complete",      subtitle: "12-Month Access · 300+ Videos",        categoryId: "courses",       price: 3499, originalPrice: 6999,  rating: 4.8, reviewCount: 2340, isDigital: true,  thumbImage: "" },
  { id: "c-2",  title: "NEET Biology Masterclass",    subtitle: "6-Month Course · NCERT + PYQs",        categoryId: "courses",       price: 2999, originalPrice: 5999,  rating: 4.8, reviewCount: 1960, isDigital: true,  thumbImage: "" },
  { id: "c-3",  title: "CAT 2025 Complete Prep",      subtitle: "6-Month Access · 1000+ Questions",     categoryId: "courses",       price: 2999, originalPrice: 5999,  rating: 4.8, reviewCount: 1560, isDigital: true,  thumbImage: "" },
  { id: "c-4",  title: "UPSC Foundation",             subtitle: "12-Month Course + Tests",              categoryId: "courses",       price: 4499, originalPrice: 8999,  rating: 4.7, reviewCount: 980,  isDigital: true,  thumbImage: "" },
  { id: "c-5",  title: "Class 10 Science Complete",   subtitle: "CBSE · Full Syllabus · 8 Months",      categoryId: "courses",       price: 1499, originalPrice: 2999,  rating: 4.6, reviewCount: 3400, isDigital: true,  thumbImage: "" },
  { id: "c-6",  title: "Class 12 Maths Crash Course", subtitle: "CBSE · 60 Hours · Exam Focus",         categoryId: "courses",       price: 999,  originalPrice: 1999,  rating: 4.7, reviewCount: 2100, isDigital: true,  thumbImage: "" },
  { id: "lc-1", title: "JEE Physics Live",            subtitle: "Alakh Pandey · Mon/Wed/Fri 7PM",       categoryId: "live-class",    price: 1299, originalPrice: 2499,  rating: 4.9, reviewCount: 3240, isDigital: true,  thumbImage: "" },
  { id: "lc-2", title: "NEET Biology Live",           subtitle: "Dr. Bharat Panchal · Tue/Thu 6PM",     categoryId: "live-class",    price: 1199, originalPrice: 2199,  rating: 4.8, reviewCount: 2180, isDigital: true,  thumbImage: "" },
  { id: "lc-3", title: "Class 10 Maths Live",         subtitle: "Rajesh Kumar · Daily 5PM",             categoryId: "live-class",    price: 699,  originalPrice: 1299,  rating: 4.7, reviewCount: 1560, isDigital: true,  thumbImage: "" },
  { id: "lc-4", title: "CAT Quant Live",              subtitle: "Arun Sharma · Weekends 10AM",          categoryId: "live-class",    price: 1499, originalPrice: 2999,  rating: 4.8, reviewCount: 890,  isDigital: true,  thumbImage: "" },
  { id: "lc-5", title: "English Speaking Live",       subtitle: "Sarah Johnson · Daily 8PM",            categoryId: "live-class",    price: 499,  originalPrice: 999,   rating: 4.6, reviewCount: 4200, isDigital: true,  thumbImage: "" },
  { id: "lc-6", title: "Coding for Kids Live",        subtitle: "Ages 8–14 · Sat/Sun 11AM",             categoryId: "live-class",    price: 399,  originalPrice: 799,   rating: 4.7, reviewCount: 620,  isDigital: true,  thumbImage: "" },
  { id: "mt-1", title: "NEET Mock Series",            subtitle: "20 Full-Length Papers",                categoryId: "mock-tests",    price: 699,  originalPrice: 1299,  rating: 4.7, reviewCount: 1820, isDigital: true,  thumbImage: "" },
  { id: "mt-2", title: "JEE Mock Series",             subtitle: "25 Full-Length Papers",                categoryId: "mock-tests",    price: 799,  originalPrice: 1499,  rating: 4.7, reviewCount: 3100, isDigital: true,  thumbImage: "" },
  { id: "mt-3", title: "GATE CSE 2025 Mock Pack",     subtitle: "30 Full-Length Papers",                categoryId: "mock-tests",    price: 899,  originalPrice: 1799,  rating: 4.6, reviewCount: 1400, isDigital: true,  thumbImage: "" },
  { id: "mt-4", title: "CAT Mock Series 2025",        subtitle: "15 Full-Length Mocks",                 categoryId: "mock-tests",    price: 599,  originalPrice: 999,   rating: 4.8, reviewCount: 2200, isDigital: true,  thumbImage: "" },
  { id: "sk-1", title: "Python for Beginners",        subtitle: "3-Month Course · 50+ Projects",        categoryId: "skill-courses", price: 799,  originalPrice: 1599,  rating: 4.7, reviewCount: 2200, isDigital: true,  thumbImage: "" },
  { id: "lg-1", title: "French Language Course",      subtitle: "A1 to B2 · 1 Year Access",             categoryId: "language",      price: 999,  originalPrice: 1999,  rating: 4.5, reviewCount: 3400, isDigital: true,  thumbImage: "" },
  { id: "lg-2", title: "Spanish Language Course",     subtitle: "A1 to B2 · 1 Year Access",             categoryId: "language",      price: 999,  originalPrice: 1999,  rating: 4.6, reviewCount: 2100, isDigital: true,  thumbImage: "" },
  { id: "lg-3", title: "German Language Course",      subtitle: "A1 to B1 · 8 Months Access",           categoryId: "language",      price: 1199, originalPrice: 2399,  rating: 4.5, reviewCount: 1340, isDigital: true,  thumbImage: "" },
  { id: "lg-4", title: "Japanese Language Course",    subtitle: "Hiragana to N4 · 10 Months",           categoryId: "language",      price: 1299, originalPrice: 2599,  rating: 4.7, reviewCount: 1780, isDigital: true,  thumbImage: "" },
  { id: "lg-5", title: "Mandarin Chinese Basics",     subtitle: "HSK 1–3 · 1 Year Access",              categoryId: "language",      price: 1499, originalPrice: 2999,  rating: 4.4, reviewCount: 920,  isDigital: true,  thumbImage: "" },
  { id: "tu-1", title: "Doubt Solving Pack",          subtitle: "5 × 1-on-1 Sessions",                  categoryId: "tutoring",      price: 999,  originalPrice: 1999,  rating: 4.6, reviewCount: 740,  isDigital: true,  thumbImage: "" },
  { id: "tu-2", title: "JEE Maths Tutoring Pack",     subtitle: "5 × 1-on-1 Sessions · Expert Tutor",   categoryId: "tutoring",      price: 1499, originalPrice: 2999,  rating: 4.8, reviewCount: 560,  isDigital: true,  thumbImage: "" },
  { id: "tu-3", title: "NEET Chemistry Sessions",     subtitle: "3 × 1-on-1 Organic Chemistry",         categoryId: "tutoring",      price: 899,  originalPrice: 1799,  rating: 4.7, reviewCount: 390,  isDigital: true,  thumbImage: "" },
  { id: "tu-4", title: "Class 10 Science Help",       subtitle: "10 × 30-min Sessions",                 categoryId: "tutoring",      price: 699,  originalPrice: 1399,  rating: 4.6, reviewCount: 720,  isDigital: true,  thumbImage: "" },
  { id: "bn-1", title: "JEE + NEET Bundle",           subtitle: "Courses + Mock Tests",                  categoryId: "bundles",       price: 5999, originalPrice: 12999, rating: 4.9, reviewCount: 2100, isDigital: true,  thumbImage: "" },
  { id: "bn-2", title: "CBSE Class 12 Complete",      subtitle: "All Subjects · Courses + Books",        categoryId: "bundles",       price: 3999, originalPrice: 8999,  rating: 4.8, reviewCount: 1640, isDigital: true,  thumbImage: "" },
  { id: "bn-3", title: "Class 10 Board Bundle",       subtitle: "Courses + Mock Tests + Books",          categoryId: "bundles",       price: 2999, originalPrice: 6499,  rating: 4.7, reviewCount: 2300, isDigital: true,  thumbImage: "" },
  { id: "bn-4", title: "Skill + Language Bundle",     subtitle: "Python + French + English",             categoryId: "bundles",       price: 1999, originalPrice: 4499,  rating: 4.6, reviewCount: 870,  isDigital: true,  thumbImage: "" },
  // Physical — real product photos
  { id: "bk-1", title: "HC Verma Physics",            subtitle: "Vol. 1 & 2 Set",                       categoryId: "books",         price: 499,  originalPrice: 850,   rating: 4.9, reviewCount: 8760, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=240&fit=crop&q=80" },
  { id: "bk-2", title: "NCERT Class 12 Set",          subtitle: "All Subjects · PCM",                   categoryId: "books",         price: 1199, originalPrice: 1800,  rating: 4.8, reviewCount: 5600, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=240&fit=crop&q=80" },
  { id: "bk-3", title: "NCERT Class 10 Set",          subtitle: "Science + Maths + SST",                categoryId: "books",         price: 899,  originalPrice: 1400,  rating: 4.8, reviewCount: 4200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=240&fit=crop&q=80" },
  { id: "bk-4", title: "Story Books Set",             subtitle: "Ages 6–10 · 10 Books",                 categoryId: "books",         price: 449,  originalPrice: 899,   rating: 4.8, reviewCount: 1200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=240&fit=crop&q=80" },
  { id: "st-1", title: "PrepMaster Study Kit",        subtitle: "5 Notebooks + Pens + Ruler",           categoryId: "stationery",    price: 399,  originalPrice: 799,   rating: 4.5, reviewCount: 3200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=240&fit=crop&q=80" },
  { id: "st-2", title: "Classmate Notebook Set",      subtitle: "6 Notebooks · 200 Pages Each",         categoryId: "stationery",    price: 249,  originalPrice: 499,   rating: 4.6, reviewCount: 5600, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?w=400&h=240&fit=crop&q=80" },
  { id: "st-3", title: "Casio FX-991ES Plus",         subtitle: "Scientific Calculator · CBSE Approved", categoryId: "stationery",   price: 799,  originalPrice: 1299,  rating: 4.8, reviewCount: 8900, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=240&fit=crop&q=80" },
  { id: "st-4", title: "Highlighter Combo Pack",      subtitle: "6 Colors · Pastel + Neon Tips",        categoryId: "stationery",    price: 179,  originalPrice: 349,   rating: 4.5, reviewCount: 3400, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=240&fit=crop&q=80" },
  { id: "st-5", title: "Geometry Box Premium",        subtitle: "Compass + Scale + Protractor Set",     categoryId: "stationery",    price: 149,  originalPrice: 299,   rating: 4.4, reviewCount: 2100, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=240&fit=crop&q=80" },
  { id: "st-6", title: "Revision Flashcard Set",      subtitle: "250 Blank Index Cards + Ring",         categoryId: "stationery",    price: 129,  originalPrice: 249,   rating: 4.3, reviewCount: 1800, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400&h=240&fit=crop&q=80" },
  { id: "st-7", title: "Sticky Notes Mega Pack",      subtitle: "400 Notes · 4 Sizes · 8 Colors",       categoryId: "stationery",    price: 199,  originalPrice: 399,   rating: 4.5, reviewCount: 2800, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1416339684178-3a239570f315?w=400&h=240&fit=crop&q=80" },
  { id: "st-8", title: "Ball Pen Set Premium",        subtitle: "Reynolds Trimax · 10 Pens",            categoryId: "stationery",    price: 99,   originalPrice: 199,   rating: 4.6, reviewCount: 6200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=240&fit=crop&q=80" },
  { id: "sk-2", title: "Math Puzzle Kit",             subtitle: "Ages 5–10 · 50+ Puzzles",              categoryId: "skill-courses", price: 299,  originalPrice: 599,   rating: 4.6, reviewCount: 930,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=400&h=240&fit=crop&q=80" },
  { id: "lk-1", title: "Science Lab Kit",             subtitle: "Class 6–10 · NCERT Based",             categoryId: "lab-kits",      price: 349,  originalPrice: 699,   rating: 4.6, reviewCount: 1100, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=240&fit=crop&q=80" },
  { id: "lk-2", title: "Chemistry Lab Kit",           subtitle: "Class 11–12 · 15 Experiments",         categoryId: "lab-kits",      price: 499,  originalPrice: 999,   rating: 4.7, reviewCount: 840,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=240&fit=crop&q=80" },
  { id: "lk-3", title: "Biology Dissection Kit",      subtitle: "Class 11 CBSE/NEET · Tools Set",       categoryId: "lab-kits",      price: 379,  originalPrice: 749,   rating: 4.5, reviewCount: 560,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=240&fit=crop&q=80" },
  { id: "lk-4", title: "Electronics Starter Kit",     subtitle: "Breadboard + Components + Guide",      categoryId: "lab-kits",      price: 449,  originalPrice: 899,   rating: 4.8, reviewCount: 1200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=240&fit=crop&q=80" },
  { id: "ck-1", title: "Scratch Coding Kit",          subtitle: "Ages 7–12 · 30 Projects",              categoryId: "coding-kits",   price: 599,  originalPrice: 1199,  rating: 4.7, reviewCount: 870,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=240&fit=crop&q=80" },
  { id: "ck-2", title: "Arduino Starter Kit",         subtitle: "30 Components + 12 Projects",          categoryId: "coding-kits",   price: 999,  originalPrice: 1999,  rating: 4.8, reviewCount: 1560, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400&h=240&fit=crop&q=80" },
  { id: "ck-3", title: "Raspberry Pi Zero Kit",       subtitle: "Pi Zero W + Case + Projects Guide",    categoryId: "coding-kits",   price: 1499, originalPrice: 2999,  rating: 4.7, reviewCount: 740,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=240&fit=crop&q=80" },
  { id: "ck-4", title: "Micro:bit Coding Kit",        subtitle: "Ages 10+ · Sensors + Wearables",       categoryId: "coding-kits",   price: 799,  originalPrice: 1599,  rating: 4.6, reviewCount: 490,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=240&fit=crop&q=80" },
  { id: "ol-1", title: "Olympiad Math Prep",          subtitle: "Class 5–10 · 200 Problems",            categoryId: "olympiad",      price: 299,  originalPrice: 599,   rating: 4.6, reviewCount: 930,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=400&h=240&fit=crop&q=80" },
  { id: "ol-2", title: "Science Olympiad NSO",        subtitle: "Class 3–12 · 250 Problems + Tests",    categoryId: "olympiad",      price: 349,  originalPrice: 699,   rating: 4.7, reviewCount: 1120, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1532094349884-543559c4ddc8?w=400&h=240&fit=crop&q=80" },
  { id: "ol-3", title: "Computer Olympiad NCO",       subtitle: "Class 5–12 · Digital + Printed",       categoryId: "olympiad",      price: 249,  originalPrice: 499,   rating: 4.5, reviewCount: 680,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=240&fit=crop&q=80" },
  { id: "ol-4", title: "English Olympiad IEO",        subtitle: "Class 2–12 · 150 Practice Sets",       categoryId: "olympiad",      price: 199,  originalPrice: 399,   rating: 4.4, reviewCount: 540,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=240&fit=crop&q=80" },
  { id: "ol-5", title: "Logical Reasoning Master",    subtitle: "Ages 8–16 · 300 Brain Teasers",        categoryId: "olympiad",      price: 279,  originalPrice: 549,   rating: 4.6, reviewCount: 890,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1606326608690-4e0281b1e588?w=400&h=240&fit=crop&q=80" },
  { id: "mr-1", title: "PrepMaster Hoodie",           subtitle: "Unisex · S/M/L/XL · 3 Colors",        categoryId: "merch",         price: 799,  originalPrice: 1599,  rating: 4.6, reviewCount: 340,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&h=240&fit=crop&q=80" },
  { id: "mr-2", title: "PrepMaster T-Shirt",          subtitle: "Cotton · 5 Designs · Unisex",          categoryId: "merch",         price: 399,  originalPrice: 799,   rating: 4.5, reviewCount: 580,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=240&fit=crop&q=80" },
  { id: "mr-3", title: "Insulated Study Bottle",      subtitle: "700ml · Leakproof · BPA Free",         categoryId: "merch",         price: 349,  originalPrice: 699,   rating: 4.7, reviewCount: 920,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=240&fit=crop&q=80" },
  { id: "mr-4", title: "PrepMaster Backpack",         subtitle: "20L · Laptop Sleeve · USB Port",       categoryId: "merch",         price: 1299, originalPrice: 2599,  rating: 4.8, reviewCount: 760,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=240&fit=crop&q=80" },
  { id: "fu-1", title: "Ergonomic Study Chair",       subtitle: "Lumbar Support · Adjustable Height",   categoryId: "furniture",     price: 4999, originalPrice: 9999,  rating: 4.7, reviewCount: 1240, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=240&fit=crop&q=80" },
  { id: "fu-2", title: "Foldable Study Desk",         subtitle: "Wall-Mount · 80cm × 40cm",             categoryId: "furniture",     price: 2499, originalPrice: 4999,  rating: 4.5, reviewCount: 680,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=240&fit=crop&q=80" },
  { id: "fu-3", title: "3-Tier Bookshelf",            subtitle: "Steel Frame · 90cm · White/Black",     categoryId: "furniture",     price: 1999, originalPrice: 3999,  rating: 4.6, reviewCount: 890,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=240&fit=crop&q=80" },
  { id: "fu-4", title: "Floor Cushion Seat",          subtitle: "Memory Foam · 60cm · Study Pillow",    categoryId: "furniture",     price: 699,  originalPrice: 1399,  rating: 4.4, reviewCount: 430,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=240&fit=crop&q=80" },
  { id: "nu-1", title: "Brain Booster Supplement",    subtitle: "Omega-3 + Vitamin D · 60 Capsules",    categoryId: "nutrition",     price: 599,  originalPrice: 1199,  rating: 4.5, reviewCount: 1340, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1611070020460-53b06e0eca53?w=400&h=240&fit=crop&q=80" },
  { id: "nu-2", title: "Focus Trail Mix Pack",        subtitle: "Nuts + Seeds · 5 × 50g Pouches",       categoryId: "nutrition",     price: 349,  originalPrice: 699,   rating: 4.6, reviewCount: 870,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=240&fit=crop&q=80" },
  { id: "nu-3", title: "Healthy Study Snack Box",     subtitle: "12 Varieties · Zero Junk",             categoryId: "nutrition",     price: 499,  originalPrice: 999,   rating: 4.7, reviewCount: 650,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=240&fit=crop&q=80" },
  { id: "nu-4", title: "Green Tea Energy Pack",       subtitle: "Matcha + EGCG · 30 Sachets",           categoryId: "nutrition",     price: 299,  originalPrice: 599,   rating: 4.4, reviewCount: 480,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=240&fit=crop&q=80" },
  { id: "pz-1", title: "Rubik's Cube 3×3",            subtitle: "Speed Cube · Smooth Turning",          categoryId: "puzzles",       price: 299,  originalPrice: 599,   rating: 4.7, reviewCount: 3200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1591991731833-b4f6f59ef84b?w=400&h=240&fit=crop&q=80" },
  { id: "pz-2", title: "Math Brain Teasers Set",      subtitle: "50 Wooden Puzzles · Ages 8+",          categoryId: "puzzles",       price: 499,  originalPrice: 999,   rating: 4.6, reviewCount: 760,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=400&h=240&fit=crop&q=80" },
  { id: "pz-3", title: "India Map Jigsaw 1000pc",     subtitle: "Educational · 50×70cm",                categoryId: "puzzles",       price: 399,  originalPrice: 799,   rating: 4.5, reviewCount: 540,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1606326608690-4e0281b1e588?w=400&h=240&fit=crop&q=80" },
  { id: "pz-4", title: "Logic Grid Puzzle Book",      subtitle: "200 Puzzles · Beginner to Expert",     categoryId: "puzzles",       price: 199,  originalPrice: 399,   rating: 4.8, reviewCount: 1100, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=240&fit=crop&q=80" },
  { id: "wc-1", title: "Periodic Table Poster",       subtitle: "A1 Size · Laminated · Full Color",     categoryId: "wall-charts",   price: 149,  originalPrice: 299,   rating: 4.8, reviewCount: 4600, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1532094349884-543559c4ddc8?w=400&h=240&fit=crop&q=80" },
  { id: "wc-2", title: "Human Body Systems Chart",    subtitle: "A2 · All Systems Labelled",            categoryId: "wall-charts",   price: 199,  originalPrice: 399,   rating: 4.7, reviewCount: 2100, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=240&fit=crop&q=80" },
  { id: "wc-3", title: "World Map Laminated",         subtitle: "A1 Political + Physical · English",    categoryId: "wall-charts",   price: 179,  originalPrice: 349,   rating: 4.6, reviewCount: 1800, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=240&fit=crop&q=80" },
  { id: "wc-4", title: "Maths Formula Charts Set",    subtitle: "A3 · 6 Posters · Class 6–12",         categoryId: "wall-charts",   price: 249,  originalPrice: 499,   rating: 4.9, reviewCount: 3400, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=240&fit=crop&q=80" },
  { id: "ep-1", title: "JEE Exam Day Kit",            subtitle: "Pens + Calculator + Admit Folder",     categoryId: "exam-packs",    price: 299,  originalPrice: 599,   rating: 4.7, reviewCount: 1560, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=240&fit=crop&q=80" },
  { id: "ep-2", title: "NEET Exam Essential Pack",    subtitle: "Pencils + Eraser + Board + Case",      categoryId: "exam-packs",    price: 249,  originalPrice: 499,   rating: 4.6, reviewCount: 1120, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=240&fit=crop&q=80" },
  { id: "ep-3", title: "CBSE Board Prep Pack",        subtitle: "5 Pens + Geometry Box + Ruler",        categoryId: "exam-packs",    price: 199,  originalPrice: 399,   rating: 4.5, reviewCount: 2340, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=240&fit=crop&q=80" },
  { id: "ep-4", title: "CAT Exam Essentials",         subtitle: "Scratch Paper + Pens + Pouch",         categoryId: "exam-packs",    price: 179,  originalPrice: 349,   rating: 4.4, reviewCount: 680,  isDigital: false, thumbImage: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=240&fit=crop&q=80" },
  // Music — FSM Buddy 1-on-1 online lessons
  { id: "piano-beginner-solo",         title: "Piano Beginner Solo",         subtitle: "1-on-1 Online · 45 min/session", categoryId: "music", price: 3599,  originalPrice: 5999,  rating: 4.8, reviewCount: 312,  isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg" },
  { id: "violin-beginner-solo",        title: "Violin Beginner Solo",        subtitle: "1-on-1 Online · 45 min/session", categoryId: "music", price: 5999,  originalPrice: 9599,  rating: 4.7, reviewCount: 98,   isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634217931147_475x285.jpg" },
  { id: "indian-vocal-beginner-solo",  title: "Indian Vocal Beginner",       subtitle: "1-on-1 Online · 45 min/session", categoryId: "music", price: 3599,  originalPrice: 5999,  rating: 4.8, reviewCount: 187,  isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg" },
  { id: "western-vocal-beginner-solo", title: "Western Vocal Beginner",      subtitle: "1-on-1 Online · 45 min/session", categoryId: "music", price: 3599,  originalPrice: 5999,  rating: 4.9, reviewCount: 468,  isDigital: true, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg" },
];

// ─── Product Grid Card ─────────────────────────────────────────────────────────
function ProductGridCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [imgFailed, setImgFailed] = useState(!product.thumbImage);
  const pct = discountPct(product.price, product.originalPrice);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      style={{ width: "100%", cursor: "pointer" }}
    >
      <div style={{ position: "relative", aspectRatio: "3/2", backgroundColor: "var(--surface-2)", overflow: "hidden", borderRadius: 8 }}>
        {imgFailed ? (
          <ProductImageFallback categoryId={product.categoryId} />
        ) : (
          <img
            src={product.thumbImage}
            alt={product.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgFailed(true)}
            onLoad={(e) => { const img = e.target as HTMLImageElement; if (img.naturalWidth <= 1) setImgFailed(true); }}
          />
        )}
        {pct >= 40 && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            backgroundColor: "var(--error-600)", color: "var(--white)",
            fontSize: "var(--text-2xs)", fontWeight: 700, padding: "2px 6px", borderRadius: 4,
          }}>
            {pct}% OFF
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); setWishlisted((w) => !w); }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute", top: 4, right: 4,
            width: 32, height: 32, borderRadius: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.52)", border: "none", cursor: "pointer",
          }}
        >
          <Heart size={16} style={{ color: wishlisted ? "var(--error-500)" : "var(--white)" }} fill={wishlisted ? "var(--error-500)" : "none"} />
        </motion.button>
      </div>

      <div className="flex flex-col gap-1" style={{ padding: "8px 0" }}>
        <p style={{
          fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)",
          lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0,
        }}>
          {product.title}
        </p>
        {product.subtitle && (
          <p style={{
            fontSize: "var(--text-2xs)", fontWeight: 400, color: "var(--secondary-foreground)",
            lineHeight: 1.2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", margin: 0,
          }}>
            {product.subtitle}
          </p>
        )}
        <div className="flex items-center gap-1">
          <Star size={10} fill="var(--warning-500)" style={{ color: "var(--warning-500)" }} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--secondary-foreground)" }}>{product.rating}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const { id: categoryId = "all" } = useParams<{ id: string }>();

  const [sortId, setSortId] = useState("popular");
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Applied filters
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [topRated, setTopRated] = useState(false);

  // Draft filters (inside filter sheet before Apply)
  const [draftPrice, setDraftPrice] = useState<PriceFilter>("all");
  const [draftType, setDraftType] = useState<TypeFilter>("all");
  const [draftTopRated, setDraftTopRated] = useState(false);

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  const meta = CATEGORY_META[categoryId] ?? CATEGORY_META.all;
  const pageTitle = meta.label;
  const currentSortLabel = SORT_OPTIONS.find((s) => s.id === sortId)?.label ?? "Sort";
  const activeFilterCount = (priceFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0) + (topRated ? 1 : 0);

  const filteredProducts = useMemo(() => {
    let list = META_CATEGORIES.has(categoryId)
      ? DUMMY_PRODUCTS
      : DUMMY_PRODUCTS.filter((p) => p.categoryId === categoryId);

    if (priceFilter === "under_500")    list = list.filter((p) => p.price < 500);
    else if (priceFilter === "range_500_2k") list = list.filter((p) => p.price >= 500 && p.price <= 2000);
    else if (priceFilter === "above_2k") list = list.filter((p) => p.price > 2000);

    if (typeFilter === "digital")  list = list.filter((p) => p.isDigital);
    else if (typeFilter === "physical") list = list.filter((p) => !p.isDigital);

    if (topRated) list = list.filter((p) => p.rating >= 4);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q));
    }

    if (sortId === "price_asc")  list = [...list].sort((a, b) => a.price - b.price);
    else if (sortId === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sortId === "rating") list = [...list].sort((a, b) => b.rating - a.rating);

    return list;
  }, [categoryId, sortId, priceFilter, typeFilter, topRated, searchQuery]);

  function openFilterSheet() {
    setDraftPrice(priceFilter);
    setDraftType(typeFilter);
    setDraftTopRated(topRated);
    setShowFilters(true);
  }

  function applyFilters() {
    setPriceFilter(draftPrice);
    setTypeFilter(draftType);
    setTopRated(draftTopRated);
    setShowFilters(false);
  }

  function resetDrafts() {
    setDraftPrice("all");
    setDraftType("all");
    setDraftTopRated(false);
  }

  function clearAllFilters() {
    setPriceFilter("all");
    setTypeFilter("all");
    setTopRated(false);
  }

  return (
    <div className="flex flex-col" style={{ fontFamily: "var(--font-family-inter)", backgroundColor: "var(--background)", height: "100vh", overflow: "hidden" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, paddingLeft: 8, paddingRight: 12, gap: 4 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { if (showSearch) { setShowSearch(false); setSearchQuery(""); } else navigate(-1); }}
            aria-label="Go back"
            style={{ width: 44, height: 44, borderRadius: 9999, border: "none", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: "var(--foreground)", strokeWidth: 2 }} />
          </motion.button>

          <AnimatePresence mode="wait" initial={false}>
            {showSearch ? (
              <motion.div
                key="search-input"
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center"
                style={{ flex: 1, gap: 8, height: 36, borderRadius: 8, backgroundColor: "var(--card)", border: "1px solid var(--border)", paddingLeft: 10, paddingRight: 10 }}
              >
                <Search style={{ width: 14, height: 14, color: "var(--muted-foreground)", strokeWidth: 1.5, flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${pageTitle}...`}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--foreground)" }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="title"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col"
                style={{ flex: 1, overflow: "hidden" }}
              >
                <span style={{ ...typo.pageTitleStyle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pageTitle}
                </span>
                <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.3 }}>
                  {filteredProducts.length} items
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {!showSearch && (
            <div className="flex items-center" style={{ gap: 8, flexShrink: 0 }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSearch(true)}
                aria-label="Search in category"
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--border-secondary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Search style={{ width: 16, height: 16, color: "var(--foreground)", strokeWidth: 1.5 }} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/marketplace/cart")}
                aria-label="View cart"
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--border-secondary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
              >
                <ShoppingCart style={{ width: 16, height: 16, color: "var(--foreground)", strokeWidth: 1.5 }} />
                <span style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: 9999, backgroundColor: "var(--primary-600)", color: "var(--white)", fontSize: "var(--text-2xs)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/marketplace/wishlist")}
                aria-label="Open wishlist"
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--border-secondary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Heart style={{ width: 16, height: 16, color: "var(--foreground)", strokeWidth: 1.5 }} />
              </motion.button>
            </div>
          )}
        </div>
      </GlassHeader>

      {/* Sort / Filter toolbar */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowSort(true)}
          className="flex items-center justify-center"
          style={{
            flex: 1, height: 44, gap: 6,
            background: "none", border: "none",
            borderRight: "1px solid var(--border)",
            cursor: "pointer",
          }}
        >
          <ArrowUpDown style={{ width: 14, height: 14, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--foreground)", fontWeight: sortId !== "popular" ? "var(--font-weight-semibold)" : "var(--font-weight-regular)" }}>
            {sortId === "popular" ? "Sort" : currentSortLabel}
          </span>
          <ChevronDown style={{ width: 12, height: 12, color: "var(--muted-foreground)", strokeWidth: 2 }} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openFilterSheet}
          className="flex items-center justify-center"
          style={{
            flex: 1, height: 44, gap: 6,
            background: activeFilterCount > 0 ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "none",
            border: "none", cursor: "pointer",
          }}
        >
          <SlidersHorizontal style={{ width: 14, height: 14, color: activeFilterCount > 0 ? "var(--primary-400)" : "var(--muted-foreground)", strokeWidth: 1.5 }} />
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: activeFilterCount > 0 ? "var(--primary-400)" : "var(--foreground)", fontWeight: activeFilterCount > 0 ? "var(--font-weight-semibold)" : "var(--font-weight-regular)" }}>
            Filters
          </span>
          {activeFilterCount > 0 && (
            <span style={{
              width: 16, height: 16, borderRadius: 9999,
              backgroundColor: "var(--primary-600)", color: "var(--white)",
              fontSize: "var(--text-2xs)", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {activeFilterCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* Active filter pills */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex items-center" style={{ gap: 8, padding: "8px 16px", overflowX: "auto", scrollbarWidth: "none", borderBottom: "1px solid var(--border)" }}>
              {priceFilter !== "all" && (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setPriceFilter("all")}
                  className="flex items-center"
                  style={{ height: 24, paddingLeft: 8, paddingRight: 8, gap: 4, borderRadius: 9999, border: "1.5px solid var(--primary)", backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", color: "var(--primary-400)", fontWeight: "var(--font-weight-semibold)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {PRICE_FILTER_LABELS[priceFilter]}
                  <X style={{ width: 10, height: 10, strokeWidth: 2.5 }} />
                </motion.button>
              )}
              {typeFilter !== "all" && (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setTypeFilter("all")}
                  className="flex items-center"
                  style={{ height: 24, paddingLeft: 8, paddingRight: 8, gap: 4, borderRadius: 9999, border: "1.5px solid var(--primary)", backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", color: "var(--primary-400)", fontWeight: "var(--font-weight-semibold)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {typeFilter === "digital" ? "Digital" : "Physical"}
                  <X style={{ width: 10, height: 10, strokeWidth: 2.5 }} />
                </motion.button>
              )}
              {topRated && (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setTopRated(false)}
                  className="flex items-center"
                  style={{ height: 24, paddingLeft: 8, paddingRight: 8, gap: 4, borderRadius: 9999, border: "1.5px solid var(--primary)", backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", color: "var(--primary-400)", fontWeight: "var(--font-weight-semibold)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  4+ Stars
                  <X style={{ width: 10, height: 10, strokeWidth: 2.5 }} />
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={clearAllFilters}
                style={{ height: 24, paddingLeft: 8, paddingRight: 8, borderRadius: 9999, border: "1px solid var(--border)", background: "none", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                Clear all
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ padding: "52px 24px 40px", gap: 20 }}>
            {/* Icon */}
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", inset: -20,
                borderRadius: 9999,
                background: "radial-gradient(circle, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <div style={{
                width: 80, height: 80, borderRadius: 20,
                backgroundColor: "var(--surface-2)",
                border: "0.5px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                <Package style={{ width: 32, height: 32, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col items-center" style={{ gap: 8 }}>
              <span style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--foreground)",
                textAlign: "center",
              }}>
                No products found
              </span>
              <span style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-sm)",
                color: "var(--muted-foreground)",
                textAlign: "center",
                lineHeight: "1.5",
                maxWidth: 220,
              }}>
                Try adjusting your filters or browsing a different category
              </span>
            </div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearAllFilters}
              style={{
                height: 44, paddingLeft: 28, paddingRight: 28, borderRadius: 9999,
                backgroundColor: "var(--primary)", border: "none", cursor: "pointer",
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--white)",
              }}
            >
              Clear Filters
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-2" style={{ gap: 12, padding: 16, paddingBottom: 32 }}>
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.18 }}
              >
                <ProductGridCard
                  product={product}
                  onPress={() => navigate(
                    product.categoryId === "music"
                      ? `/marketplace/music/${product.id}`
                      : `/marketplace/product/${product.id}`
                  )}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Sort bottom sheet */}
      <AnimatePresence>
        {showSort && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSort(false)}
              style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 40 }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, backgroundColor: "var(--card)", borderRadius: "20px 20px 0 0", padding: "20px 16px 40px" }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 9999, backgroundColor: "var(--border)", margin: "0 auto 20px" }} />
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", display: "block", marginBottom: 12 }}>
                Sort by
              </span>
              {SORT_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSortId(opt.id); setShowSort(false); }}
                  className="w-full flex items-center justify-between"
                  style={{ height: 48, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: sortId === opt.id ? "var(--primary-300)" : "var(--foreground)", fontWeight: sortId === opt.id ? "var(--font-weight-semibold)" : "var(--font-weight-medium)" }}>
                    {opt.label}
                  </span>
                  {sortId === opt.id && (
                    <div style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "var(--primary)" }} />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Filter bottom sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 40 }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, backgroundColor: "var(--card)", borderRadius: "20px 20px 0 0", padding: "20px 16px 40px" }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 9999, backgroundColor: "var(--border)", margin: "0 auto 20px" }} />

              <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
                <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                  Filters
                </span>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={resetDrafts}
                  style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--primary-400)", fontWeight: "var(--font-weight-medium)", padding: 0 }}
                >
                  Reset
                </motion.button>
              </div>

              {/* Price Range */}
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 12 }}>
                Price Range
              </span>
              <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                {PRICE_FILTER_OPTIONS.map(({ key, label }) => {
                  const active = draftPrice === key;
                  return (
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setDraftPrice(key)}
                      className="flex items-center"
                      style={{
                        height: 32, paddingLeft: active ? 8 : 12, paddingRight: 12, gap: 4, borderRadius: 9999,
                        border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                        backgroundColor: active ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "transparent",
                        fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)",
                        color: active ? "var(--primary-400)" : "var(--muted-foreground)",
                        fontWeight: active ? "var(--font-weight-semibold)" : "var(--font-weight-regular)",
                        cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      {active && <Check style={{ width: 12, height: 12, strokeWidth: 2.5, flexShrink: 0 }} />}
                      {label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Product Type */}
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 12 }}>
                Product Type
              </span>
              <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                {TYPE_OPTIONS.map(({ key, label }) => {
                  const active = draftType === key;
                  return (
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setDraftType(key)}
                      className="flex items-center"
                      style={{
                        height: 32, paddingLeft: active ? 8 : 12, paddingRight: 12, gap: 4, borderRadius: 9999,
                        border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                        backgroundColor: active ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "transparent",
                        fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)",
                        color: active ? "var(--primary-400)" : "var(--muted-foreground)",
                        fontWeight: active ? "var(--font-weight-semibold)" : "var(--font-weight-regular)",
                        cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      {active && <Check style={{ width: 12, height: 12, strokeWidth: 2.5, flexShrink: 0 }} />}
                      {label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Rating */}
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 12 }}>
                Rating
              </span>
              <div style={{ marginBottom: 28 }}>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setDraftTopRated((v) => !v)}
                  className="flex items-center"
                  style={{
                    height: 32, paddingLeft: draftTopRated ? 8 : 12, paddingRight: 12, gap: 4, borderRadius: 9999,
                    border: draftTopRated ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                    backgroundColor: draftTopRated ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "transparent",
                    fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)",
                    color: draftTopRated ? "var(--primary-400)" : "var(--muted-foreground)",
                    fontWeight: draftTopRated ? "var(--font-weight-semibold)" : "var(--font-weight-regular)",
                    cursor: "pointer",
                  }}
                >
                  {draftTopRated && <Check style={{ width: 12, height: 12, strokeWidth: 2.5, flexShrink: 0 }} />}
                  4+ Stars
                </motion.button>
              </div>

              {/* Apply */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={applyFilters}
                className="w-full flex items-center justify-center"
                style={{
                  height: 48, borderRadius: 12, backgroundColor: "var(--primary)",
                  border: "none", cursor: "pointer",
                  fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)", color: "var(--white)",
                }}
              >
                Apply Filters
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
