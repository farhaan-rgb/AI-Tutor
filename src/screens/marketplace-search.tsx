/**
 * Marketplace Search — Full-text product search
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "../app/contexts/theme-context";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Search, X, Star, Clock, TrendingUp,
  ShoppingCart, Check, Heart,
  GraduationCap, ClipboardList, LayoutGrid, Cpu,
  ChevronUp, Delete,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar } from "../shared/premium-ui";
import { WishlistSheet } from "./wishlist-sheet";
import {
  CATEGORY_FALLBACK, DIGITAL_ABBR, ProductImageFallback,
  discountPct, formatCount,
} from "./marketplace-shared";

// ─── Constants ────────────────────────────────────────────────────────────────
const KEYBOARD_HEIGHT = 268;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  title: string;
  subtitle?: string;
  categoryId: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  badgeColor?: string;
  isDigital: boolean;
  thumbImage?: string;
}

interface CategoryLink {
  id: string;
  label: string;
  path: string;
  Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
  gradient: string;
  accentColor: string;
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────
// TODO(api): GET /api/marketplace/products/search?q=:query
const DUMMY_ALL_PRODUCTS: Product[] = [
  { id: "fd-1", title: "JEE Main 2027 Complete Course", subtitle: "12-Month Access", categoryId: "courses", price: 3499, originalPrice: 6999, rating: 4.8, reviewCount: 2340, badge: "50% OFF", badgeColor: "var(--error-500)", isDigital: true, thumbImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=320&h=240&fit=crop" },
  { id: "fd-2", title: "NEET Mock Test Series", subtitle: "20 Full-Length Papers", categoryId: "mock-tests", price: 699, originalPrice: 1299, rating: 4.7, reviewCount: 1820, badge: "46% OFF", badgeColor: "var(--error-500)", isDigital: true, thumbImage: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=320&h=240&fit=crop" },
  { id: "fd-3", title: "HC Verma Physics", subtitle: "Vol. 1 & 2 Set", categoryId: "books", price: 499, originalPrice: 850, rating: 4.9, reviewCount: 8760, badge: "41% OFF", badgeColor: "var(--error-500)", isDigital: false, thumbImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=320&h=240&fit=crop" },
  { id: "fd-4", title: "PrepMaster Study Kit", subtitle: "5 Notebooks + Pens", categoryId: "stationery", price: 399, originalPrice: 799, rating: 4.5, reviewCount: 3200, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=320&h=240&fit=crop" },
  { id: "fy-1", title: "CAT 2025 Complete Prep", subtitle: "6-Month Access", categoryId: "courses", price: 2999, originalPrice: 5999, rating: 4.8, reviewCount: 1560, badge: "BESTSELLER", badgeColor: "var(--warning-500)", isDigital: true, thumbImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=320&h=240&fit=crop" },
  { id: "fy-3", title: "JEE + NEET Bundle", subtitle: "Courses + Mock Tests + Books", categoryId: "courses", price: 5999, originalPrice: 12999, rating: 4.9, reviewCount: 2100, badge: "54% OFF", badgeColor: "var(--error-500)", isDigital: true, thumbImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=320&h=240&fit=crop" },
  { id: "fy-5", title: "Python for Beginners", subtitle: "3-Month Course", categoryId: "skill-courses", price: 799, originalPrice: 1599, rating: 4.7, reviewCount: 2200, badge: "TOP RATED", badgeColor: "var(--primary-300)", isDigital: true, thumbImage: "" },
  { id: "tr-1", title: "JEE Mock Series", subtitle: "25 Full-Length Papers", categoryId: "mock-tests", price: 799, originalPrice: 1499, rating: 4.7, reviewCount: 3100, badge: "TOP RATED", badgeColor: "var(--primary-300)", isDigital: true, thumbImage: "" },
  { id: "tr-2", title: "NCERT Class 12 Set", subtitle: "All Subjects · PCM", categoryId: "books", price: 1199, originalPrice: 1800, rating: 4.8, reviewCount: 5600, badge: "BESTSELLER", badgeColor: "var(--warning-500)", isDigital: false, thumbImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=320&h=240&fit=crop" },
  { id: "tr-3", title: "UPSC Foundation Course", subtitle: "12-Month + Tests", categoryId: "courses", price: 4499, originalPrice: 8999, rating: 4.7, reviewCount: 980, badge: "NEW", badgeColor: "var(--success-500)", isDigital: true, thumbImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=320&h=240&fit=crop" },
  { id: "tr-4", title: "GATE CSE 2025 Mock Pack", subtitle: "Complete Test Series", categoryId: "mock-tests", price: 899, originalPrice: 1799, rating: 4.6, reviewCount: 1400, isDigital: true, thumbImage: "" },
  { id: "tr-5", title: "NCERT Class 10 Set", subtitle: "Science + Maths + SST", categoryId: "books", price: 899, originalPrice: 1400, rating: 4.8, reviewCount: 4200, badge: "BESTSELLER", badgeColor: "var(--warning-500)", isDigital: false, thumbImage: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=320&h=240&fit=crop" },
  { id: "fd-5", title: "Science Lab Kit", subtitle: "Class 6–10 NCERT", categoryId: "lab-kits", price: 349, originalPrice: 699, rating: 4.6, reviewCount: 1100, isDigital: false, thumbImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=320&h=240&fit=crop" },
];

// TODO(api): GET /api/marketplace/search/recent
const DUMMY_RECENT_SEARCHES = ["JEE mock test", "NCERT books", "Python course", "Study kit"];

// TODO(api): GET /api/marketplace/search/trending
const DUMMY_TRENDING_SEARCHES = ["NEET 2025", "GATE CSE", "UPSC foundation", "Class 10 books", "Coding kits"];

// TODO(api): GET /api/marketplace/categories
// Trimmed to the 4 main categories that exist in marketplace-v1 — extras (Books,
// Stationery, Skills, Lab Kits, Olympiad, Music) were dead-end tiles.
const DUMMY_QUICK_CATEGORIES: CategoryLink[] = [
  { id: "courses",    label: "Courses",     path: "/marketplace/category/courses",    Icon: GraduationCap, gradient: "135deg, #1a3a5c 0%, #0f2340 100%", accentColor: "#4a9eff" },
  { id: "mock-tests", label: "Test Series", path: "/marketplace/category/mock-tests", Icon: ClipboardList, gradient: "135deg, #3a2800 0%, #201500 100%", accentColor: "#ffc53d" },
  { id: "apps",       label: "Apps",        path: "/marketplace/apps",                Icon: LayoutGrid,    gradient: "135deg, #1a3a3a 0%, #0f2323 100%", accentColor: "#5cdbd3" },
  { id: "devices",    label: "Devices",     path: "/marketplace/category/devices",    Icon: Cpu,           gradient: "135deg, #3a2810 0%, #1f1505 100%", accentColor: "#ffa940" },
];

// ─── Keyboard rows ────────────────────────────────────────────────────────────
const KEY_ROWS = [
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l"],
  ["z","x","c","v","b","n","m"],
];

// ─── Simulated Keyboard ───────────────────────────────────────────────────────
function SimulatedKeyboard({
  suggestions,
  onKey,
  onDelete,
  onSpace,
  onSearch,
  onSuggestion,
}: {
  suggestions: string[];
  onKey: (k: string) => void;
  onDelete: () => void;
  onSpace: () => void;
  onSearch: () => void;
  onSuggestion: (s: string) => void;
}) {
  const [caps, setCaps] = useState(false);

  const letterKey: React.CSSProperties = {
    height: 42,
    borderRadius: 4,
    backgroundColor: "var(--gray-900)",
    border: "none",
    color: "var(--white)",
    fontSize: "var(--text-base)",
    fontWeight: 400,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 0 0 rgba(0,0,0,0.45)",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    flexShrink: 0,
    userSelect: "none",
  };

  const specialKey: React.CSSProperties = {
    ...letterKey,
    backgroundColor: "var(--gray-700)",
    fontSize: "var(--text-sm)",
    fontWeight: 500,
  };

  return (
    <motion.div
      initial={{ y: KEYBOARD_HEIGHT }}
      animate={{ y: 0 }}
      exit={{ y: KEYBOARD_HEIGHT }}
      transition={{ type: "spring", stiffness: 360, damping: 40 }}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: KEYBOARD_HEIGHT,
        backgroundColor: "var(--card)",
        borderTop: "0.5px solid rgba(255,255,255,0.08)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* QuickType suggestions strip */}
      <div
        style={{
          height: 44,
          flexShrink: 0,
          backgroundColor: "var(--secondary)",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {suggestions.slice(0, 3).map((s, i) => (
          <button
            key={`${s}-${i}`}
            onPointerDown={(e) => { e.preventDefault(); onSuggestion(s); }}
            style={{
              flex: 1,
              height: "100%",
              background: "none",
              border: "none",
              borderRight: i < 2 ? "0.5px solid rgba(255,255,255,0.10)" : "none",
              color: "rgba(255,255,255,0.85)",
              fontSize: "var(--text-sm)",
              cursor: "pointer",
              padding: "0 8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            &ldquo;{s}&rdquo;
          </button>
        ))}
      </div>

      {/* Keys area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "12px 4px 16px",
        }}
      >
        {/* Row 1 — 10 letters */}
        <div style={{ display: "flex", gap: 4 }}>
          {KEY_ROWS[0].map((k) => (
            <button
              key={k}
              onPointerDown={(e) => { e.preventDefault(); onKey(caps ? k.toUpperCase() : k); }}
              style={{ ...letterKey, flex: 1 }}
            >
              {caps ? k.toUpperCase() : k}
            </button>
          ))}
        </div>

        {/* Row 2 — 9 letters, indented */}
        <div style={{ display: "flex", gap: 4, paddingLeft: 16, paddingRight: 16 }}>
          {KEY_ROWS[1].map((k) => (
            <button
              key={k}
              onPointerDown={(e) => { e.preventDefault(); onKey(caps ? k.toUpperCase() : k); }}
              style={{ ...letterKey, flex: 1 }}
            >
              {caps ? k.toUpperCase() : k}
            </button>
          ))}
        </div>

        {/* Row 3 — Shift + 7 letters + Delete */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onPointerDown={(e) => { e.preventDefault(); setCaps((c) => !c); }}
            style={{
              ...specialKey,
              width: 44,
              backgroundColor: caps ? "rgba(255,255,255,0.22)" : "var(--gray-700)",
            }}
            aria-label="Shift"
          >
            <ChevronUp size={16} style={{ strokeWidth: caps ? 2.5 : 1.5 }} />
          </button>
          {KEY_ROWS[2].map((k) => (
            <button
              key={k}
              onPointerDown={(e) => { e.preventDefault(); onKey(caps ? k.toUpperCase() : k); }}
              style={{ ...letterKey, flex: 1 }}
            >
              {caps ? k.toUpperCase() : k}
            </button>
          ))}
          <button
            onPointerDown={(e) => { e.preventDefault(); onDelete(); }}
            style={{ ...specialKey, width: 44 }}
            aria-label="Delete"
          >
            <Delete size={16} />
          </button>
        </div>

        {/* Row 4 — 123 | space | search */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onPointerDown={(e) => { e.preventDefault(); }}
            aria-label="Numbers"
            style={{ ...specialKey, width: 80 }}
          >
            123
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); onSpace(); }}
            style={{ ...letterKey, flex: 1, fontSize: "var(--text-sm)" }}
          >
            space
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); onSearch(); }}
            style={{
              ...specialKey,
              width: 88,
              backgroundColor: "var(--primary-600)",
              color: "var(--white)",
              fontWeight: 600,
            }}
          >
            search
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Search Product Card ──────────────────────────────────────────────────────
function SearchProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [imgFailed, setImgFailed] = useState(!product.thumbImage);
  const pct = discountPct(product.price, product.originalPrice);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      style={{
        width: "100%", cursor: "pointer",
      }}
    >
      <div style={{
        position: "relative", aspectRatio: "3/2",
        backgroundColor: "var(--surface-2)", overflow: "hidden", borderRadius: 8,
      }}>
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
          <div style={{
            position: "absolute", top: 8, left: 8,
            backgroundColor: "var(--error-600)", color: "var(--white)",
            fontSize: "var(--text-2xs)", fontWeight: 700,
            padding: "2px 6px", borderRadius: 4,
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
            width: 24, height: 24, borderRadius: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.52)", border: "none", cursor: "pointer",
          }}
        >
          <Heart
            size={16}
            style={{ color: wishlisted ? "var(--error-500)" : "var(--white)" }}
            fill={wishlisted ? "var(--error-500)" : "none"}
          />
        </motion.button>
      </div>

      <div className="flex flex-col gap-1" style={{ padding: "8px 4px" }}>
        <p style={{
          fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)",
          lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0,
        }}>
          {product.title}
        </p>
        {product.subtitle && (
          <p style={{
            fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
            lineHeight: 1.2, overflow: "hidden", whiteSpace: "nowrap",
            textOverflow: "ellipsis", margin: 0,
          }}>
            {product.subtitle}
          </p>
        )}
        <div className="flex items-center gap-1">
          <Star size={10} fill="var(--warning-500)" style={{ color: "var(--warning-500)" }} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
            {product.rating} ({formatCount(product.reviewCount)})
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(DUMMY_RECENT_SEARCHES);
  const [resultCategoryFilter, setResultCategoryFilter] = useState<string | null>(null);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setResultCategoryFilter(null);
  }, [query]);

  const allResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return DUMMY_ALL_PRODUCTS.filter(
      (p) => p.title.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q) || p.categoryId.includes(q)
    );
  }, [query]);

  const resultCategories = useMemo(() => {
    const catIds = [...new Set(allResults.map((r) => r.categoryId))];
    return catIds.map((id) => ({
      id,
      label: DUMMY_QUICK_CATEGORIES.find((c) => c.id === id)?.label ?? id,
      count: allResults.filter((r) => r.categoryId === id).length,
    }));
  }, [allResults]);

  const displayedResults = useMemo(() => {
    if (!resultCategoryFilter) return allResults;
    return allResults.filter((r) => r.categoryId === resultCategoryFilter);
  }, [allResults, resultCategoryFilter]);

  const hasQuery = query.trim().length > 0;
  const showKeyboard = !hasQuery;

  // QuickType strip: trending when empty, matching titles when typing
  const suggestions = useMemo(() => {
    if (!query.trim()) return DUMMY_TRENDING_SEARCHES.slice(0, 3);
    const q = query.toLowerCase();
    return DUMMY_ALL_PRODUCTS
      .filter((p) => p.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map((p) => p.title);
  }, [query]);

  const handleSearchTap = (term: string) => {
    setQuery(term);
    setRecentSearches((prev) => [term, ...prev.filter((s) => s !== term)].slice(0, 8));
  };

  const removeRecent = (term: string) => {
    setRecentSearches((prev) => prev.filter((s) => s !== term));
  };

  const handleKey = (k: string) => setQuery((prev) => prev + k);
  const handleDelete = () => setQuery((prev) => prev.slice(0, -1));
  const handleSpace = () => setQuery((prev) => prev + " ");
  const handleSearch = () => {
    if (query.trim()) handleSearchTap(query.trim());
  };

  return (
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ── Header — frosted glass ── */}
      <div
        style={{
          backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <StatusBar />
        <div className="flex items-center" style={{ height: 64, padding: "0 16px", gap: 10 }}>
          {/* Back — matches Discover chrome (32×32 squircle) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              backgroundColor: "var(--border-secondary)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16, color: "var(--foreground)", strokeWidth: 2 }} />
          </motion.button>

          {/* Search input — slimmer pill, animated glow on focus */}
          <motion.div
            layout
            className="flex items-center flex-1"
            animate={{
              borderColor: showKeyboard ? "var(--primary-400)" : "var(--border)",
              boxShadow: showKeyboard
                ? "0 0 0 3px color-mix(in srgb, var(--primary-400) 14%, transparent), 0 4px 12px color-mix(in srgb, var(--primary-400) 18%, transparent)"
                : "0 1px 2px rgba(0,0,0,0.08)",
            }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{
              height: 32, borderRadius: 8,
              backgroundColor: "var(--card)",
              borderWidth: "1px",
              borderStyle: "solid",
              paddingLeft: 12, paddingRight: 6, gap: 8,
              minWidth: 0,
            }}
          >
            <motion.div
              animate={{
                scale: showKeyboard ? [1, 1.15, 1] : 1,
                color: showKeyboard ? "var(--primary-400)" : "var(--muted-foreground)",
              }}
              transition={{
                scale: { duration: 0.4, ease: "easeOut" },
                color: { duration: 0.2 },
              }}
              style={{ display: "flex", flexShrink: 0 }}
            >
              <Search
                style={{
                  width: 14, height: 14, strokeWidth: 1.75,
                  color: "currentColor",
                }}
              />
            </motion.div>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) handleSearchTap(query.trim());
              }}
              placeholder="Search courses, books, kits..."
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)",
                color: "var(--foreground)", minWidth: 0,
              }}
            />
            <AnimatePresence>
              {hasQuery && (
                <motion.button
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  style={{
                    width: 18, height: 18, borderRadius: 9999, flexShrink: 0,
                    backgroundColor: "var(--muted-foreground)", border: "none", opacity: 0.7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X style={{ width: 10, height: 10, color: "var(--background)", strokeWidth: 3 }} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Cart — matches Discover chrome (32×32 squircle) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/marketplace/cart")}
            aria-label="View cart"
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              backgroundColor: "var(--border-secondary)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
            }}
          >
            <ShoppingCart style={{ width: 16, height: 16, color: "var(--foreground)" }} />
            <span style={{
              position: "absolute", top: 2, right: 2,
              width: 16, height: 16, borderRadius: 9999,
              backgroundColor: "var(--primary-600)",
              color: "var(--white)", fontSize: "var(--text-2xs)", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-family-inter)",
            }}>
              3
            </span>
          </motion.button>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: showKeyboard ? KEYBOARD_HEIGHT : 0 }}
      >
        <AnimatePresence mode="wait">

          {/* ── Discovery (keyboard open, no query) ── */}
          {!hasQuery && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], staggerChildren: 0.06, delayChildren: 0.05 }}
            >
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
                  style={{ paddingTop: 20 }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ padding: "0 16px", marginBottom: 8 }}
                  >
                    <span style={{
                      fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)",
                      color: "var(--foreground)", fontFamily: "var(--font-family-inter)",
                    }}>
                      Recent
                    </span>
                    <button
                      onClick={() => setRecentSearches([])}
                      style={{
                        fontSize: "var(--text-xs)", color: "var(--primary-400)",
                        background: "none", border: "none", cursor: "pointer",
                        padding: "4px 0", fontFamily: "var(--font-family-inter)",
                        fontWeight: "var(--font-weight-medium)",
                      }}
                    >
                      Clear all
                    </button>
                  </div>

                  <div style={{ marginLeft: 16, marginRight: 16, borderRadius: 16, overflow: "hidden", border: "0.5px solid var(--border)", backgroundColor: "var(--card)" }}>
                    <AnimatePresence>
                      {recentSearches.map((s, i) => (
                        <motion.div
                          key={s}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 48 }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: "hidden" }}
                        >
                          {i > 0 && <div style={{ height: "0.5px", backgroundColor: "var(--border)", marginLeft: 44 }} />}
                          <div className="flex items-center" style={{ height: 48, paddingLeft: 12, paddingRight: 4, backgroundColor: "var(--card)" }}>
                            <button
                              onClick={() => handleSearchTap(s)}
                              className="flex items-center flex-1"
                              style={{
                                height: "100%", gap: 12,
                                background: "none", border: "none",
                                cursor: "pointer", textAlign: "left", minWidth: 0,
                              }}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                backgroundColor: "var(--surface-2)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <Clock style={{ width: 13, height: 13, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
                              </div>
                              <span style={{
                                fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)",
                                color: "var(--foreground)", overflow: "hidden",
                                textOverflow: "ellipsis", whiteSpace: "nowrap",
                                fontFamily: "var(--font-family-inter)",
                              }}>
                                {s}
                              </span>
                            </button>
                            <button
                              onClick={() => removeRecent(s)}
                              aria-label={`Remove ${s} from recent`}
                              style={{
                                width: 40, height: 40, flexShrink: 0,
                                background: "none", border: "none", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                            >
                              <X style={{ width: 12, height: 12, color: "var(--muted-foreground)", strokeWidth: 2 }} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Trending */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: 0.12 }}
                style={{ paddingTop: 24 }}
              >
                <div
                  className="flex items-center"
                  style={{ gap: 6, padding: "0 16px", marginBottom: 12 }}
                >
                  <TrendingUp style={{ width: 13, height: 13, color: "var(--primary-400)", strokeWidth: 1.5 }} />
                  <span style={{
                    fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)", fontFamily: "var(--font-family-inter)",
                  }}>
                    Trending
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, padding: "0 16px 4px", overflowX: "auto", scrollbarWidth: "none" }}>
                  {DUMMY_TRENDING_SEARCHES.map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.18 + i * 0.04, duration: 0.25 }}
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ y: -2 }}
                      onClick={() => handleSearchTap(s)}
                      style={{
                        flexShrink: 0, height: 34, padding: "0 14px",
                        borderRadius: 9999,
                        border: "0.5px solid color-mix(in srgb, var(--primary-400) 35%, transparent)",
                        backgroundColor: "color-mix(in srgb, var(--primary-400) 10%, var(--card))",
                        boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.08), 0 2px 6px color-mix(in srgb, var(--primary-400) 14%, transparent)",
                        fontSize: "var(--text-sm)", color: "var(--primary-300)",
                        fontWeight: "var(--font-weight-semibold)",
                        cursor: "pointer", whiteSpace: "nowrap",
                        fontFamily: "var(--font-family-inter)",
                      }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Browse by Category */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
                style={{ padding: "24px 16px 32px" }}
              >
                <div className="flex items-center" style={{ marginBottom: 16, gap: 10 }}>
                  <div
                    aria-hidden
                    style={{
                      width: 3, height: 16, borderRadius: 3,
                      background: "linear-gradient(180deg, var(--primary-400) 0%, color-mix(in srgb, var(--primary-400) 50%, transparent) 100%)",
                      boxShadow: "0 0 8px color-mix(in srgb, var(--primary-400) 55%, transparent)",
                    }}
                  />
                  <span style={{
                    fontSize: "var(--text-2xs)",
                    fontWeight: 700,
                    color: "var(--muted-foreground)",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    fontFamily: "var(--font-family-inter)",
                  }}>
                    Browse Categories
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  {DUMMY_QUICK_CATEGORIES.map((cat, i) => {
                    const accent = cat.accentColor;
                    return (
                      <motion.button
                        key={cat.id}
                        initial={{ opacity: 0, y: 12, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          delay: 0.26 + i * 0.035,
                          type: "spring",
                          stiffness: 380,
                          damping: 26,
                        }}
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ y: -3 }}
                        onClick={() => navigate(cat.path)}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          gap: 8, background: "none", border: "none", cursor: "pointer",
                          padding: 0,
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
                          <cat.Icon
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
                          fontFamily: "var(--font-family-inter)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 64,
                        }}>
                          {cat.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── No Results ── */}
          {hasQuery && allResults.length === 0 && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center"
              style={{ padding: "48px 32px 32px", gap: 16 }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                backgroundColor: "var(--card)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Search style={{ width: 28, height: 28, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
              </div>
              <div className="flex flex-col items-center" style={{ gap: 4 }}>
                <span style={{
                  fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)",
                  color: "var(--foreground)", fontFamily: "var(--font-family-inter)",
                }}>
                  No results found
                </span>
                <span style={{
                  fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
                  textAlign: "center", fontFamily: "var(--font-family-inter)",
                }}>
                  No matches for &ldquo;{query}&rdquo;
                </span>
              </div>
              <span style={{
                fontSize: "var(--text-xs)", color: "var(--muted-foreground)",
                fontFamily: "var(--font-family-inter)",
              }}>
                Try browsing categories
              </span>
              <div className="flex flex-wrap justify-center" style={{ gap: 8 }}>
                {DUMMY_QUICK_CATEGORIES.slice(0, 4).map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(cat.path)}
                    style={{
                      height: 32, paddingLeft: 16, paddingRight: 16,
                      borderRadius: 9999, border: "1px solid var(--border)",
                      backgroundColor: "var(--card)", cursor: "pointer",
                      fontSize: "var(--text-sm)", color: "var(--foreground)",
                      fontWeight: "var(--font-weight-medium)",
                      fontFamily: "var(--font-family-inter)",
                    }}
                  >
                    {cat.label}
                  </motion.button>
                ))}
              </div>

              {/* Wishlist entry — capture intent at the highest-signal moment
                  (failed search). Per competitive research (Duolingo pattern). */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setWishlistOpen(true)}
                className="flex items-center"
                style={{
                  width: "100%", maxWidth: 360, marginTop: 16,
                  padding: "14px 16px", borderRadius: 12,
                  backgroundColor: "color-mix(in srgb, var(--primary-500) 10%, var(--card))",
                  gap: 12, cursor: "pointer", border: "none",
                  fontFamily: "inherit", textAlign: "left",
                }}
              >
                <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                    Tell us what's missing
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                    We'll WhatsApp you when "{query}" is added
                  </span>
                </div>
                <div style={{
                  height: 28, paddingLeft: 10, paddingRight: 10,
                  borderRadius: 9999, backgroundColor: "var(--primary-500)",
                  display: "inline-flex", alignItems: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--white)" }}>
                    Request
                  </span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* ── Results ── */}
          {hasQuery && allResults.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <div style={{ borderBottom: "1px solid var(--border)" }}>
                <div style={{ padding: "12px 16px 0" }}>
                  <span style={{
                    fontSize: "var(--text-xs)", color: "var(--muted-foreground)",
                    fontFamily: "var(--font-family-inter)",
                  }}>
                    {allResults.length} result{allResults.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
                  </span>
                </div>
                {resultCategories.length > 1 && (
                  <div
                    className="flex"
                    style={{ gap: 6, padding: "8px 16px 10px", overflowX: "auto", scrollbarWidth: "none" }}
                  >
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setResultCategoryFilter(null)}
                      className="flex items-center"
                      style={{
                        flexShrink: 0, height: 28,
                        paddingLeft: resultCategoryFilter === null ? 8 : 12, paddingRight: 12,
                        borderRadius: 9999,
                        border: resultCategoryFilter === null
                          ? "1.5px solid var(--primary)"
                          : "1px solid var(--border)",
                        backgroundColor: resultCategoryFilter === null
                          ? "color-mix(in srgb, var(--primary-400) 12%, transparent)"
                          : "transparent",
                        fontSize: "var(--text-xs)",
                        fontWeight: resultCategoryFilter === null
                          ? "var(--font-weight-semibold)"
                          : "var(--font-weight-regular)",
                        color: resultCategoryFilter === null
                          ? "var(--primary-400)"
                          : "var(--muted-foreground)",
                        cursor: "pointer", whiteSpace: "nowrap", gap: 4,
                        fontFamily: "var(--font-family-inter)",
                      }}
                    >
                      {resultCategoryFilter === null && (
                        <Check style={{ width: 12, height: 12, strokeWidth: 2.5, flexShrink: 0 }} />
                      )}
                      All ({allResults.length})
                    </motion.button>

                    {resultCategories.map((cat) => {
                      const active = resultCategoryFilter === cat.id;
                      return (
                        <motion.button
                          key={cat.id}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setResultCategoryFilter(active ? null : cat.id)}
                          className="flex items-center"
                          style={{
                            flexShrink: 0, height: 28,
                            paddingLeft: active ? 8 : 12, paddingRight: 12,
                            borderRadius: 9999,
                            border: active
                              ? "1.5px solid var(--primary)"
                              : "1px solid var(--border)",
                            backgroundColor: active
                              ? "color-mix(in srgb, var(--primary-400) 12%, transparent)"
                              : "transparent",
                            fontSize: "var(--text-xs)",
                            fontWeight: active
                              ? "var(--font-weight-semibold)"
                              : "var(--font-weight-regular)",
                            color: active ? "var(--primary-400)" : "var(--muted-foreground)",
                            cursor: "pointer", whiteSpace: "nowrap", gap: 4,
                            fontFamily: "var(--font-family-inter)",
                          }}
                        >
                          {active && (
                            <Check style={{ width: 12, height: 12, strokeWidth: 2.5, flexShrink: 0 }} />
                          )}
                          {cat.label} ({cat.count})
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2-col product grid */}
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, padding: 16 }}
              >
                {displayedResults.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: i * 0.05,
                      type: "spring",
                      stiffness: 320,
                      damping: 26,
                    }}
                  >
                    <SearchProductCard
                      product={product}
                      onPress={() => navigate(`/marketplace/product/${product.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Simulated Keyboard ── */}
      <AnimatePresence>
        {showKeyboard && (
          <SimulatedKeyboard
            suggestions={suggestions}
            onKey={handleKey}
            onDelete={handleDelete}
            onSpace={handleSpace}
            onSearch={handleSearch}
            onSuggestion={handleSearchTap}
          />
        )}
      </AnimatePresence>

      <WishlistSheet
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        source="search-empty"
        initialMessage={query ? `Add ${query} — please.` : ""}
      />
    </motion.div>
  );
}
