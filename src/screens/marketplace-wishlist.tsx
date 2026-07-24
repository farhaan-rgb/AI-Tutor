/**
 * Marketplace Wishlist — Saved/wishlisted products
 * Route: /marketplace/wishlist
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ShoppingCart, Heart, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar, GlassHeader, typo } from "../shared/premium-ui";
import { ProductImageFallback, discountPct } from "./marketplace-shared";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProductKind = "course" | "mock-test" | "physical";
type FilterKind = "all" | ProductKind;

interface WishlistItem {
  id: string;
  kind: ProductKind;
  categoryId: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  rating: number;
}

// ─── DUMMY Data ───────────────────────────────────────────────────────────────
// TODO(api): GET /api/user/wishlist
const DUMMY_WISHLIST: WishlistItem[] = [
  { id: "wl-c1", kind: "course", categoryId: "courses", title: "JEE Main 2027 Complete Course", subtitle: "12-Month Access", price: 3499, originalPrice: 6999, rating: 4.8 },
  { id: "wl-c4", kind: "course", categoryId: "courses", title: "CAT 2025 Complete Preparation", subtitle: "6-Month Access + Mock Tests", price: 2999, originalPrice: 5999, rating: 4.8 },
  { id: "wl-c2", kind: "course", categoryId: "courses", title: "UPSC CSE Foundation Course", subtitle: "18-Month Access", price: 7999, originalPrice: 14999, rating: 4.7 },
  { id: "wl-m1", kind: "mock-test", categoryId: "mock-tests", title: "NEET 2025 Mock Test Series", subtitle: "20 Full-Length Papers + PYQs", price: 699, originalPrice: 1299, rating: 4.7 },
  { id: "wl-m2", kind: "mock-test", categoryId: "mock-tests", title: "JEE Advanced Full Mock Series", subtitle: "10 Full Length + 15 Chapter Tests", price: 899, originalPrice: 1499, rating: 4.9 },
  { id: "wl-p1", kind: "physical", categoryId: "books", title: "HC Verma Concepts of Physics", subtitle: "Vol. 1 & Vol. 2 Set", price: 499, originalPrice: 850, rating: 4.9 },
  { id: "wl-p3", kind: "physical", categoryId: "stationery", title: "PrepMaster Study Kit", subtitle: "5 Notebooks + Pens + Highlighters", price: 399, originalPrice: 799, rating: 4.5 },
];

const KIND_LABEL: Record<ProductKind, string> = {
  "course": "Course",
  "mock-test": "Mock Test",
  "physical": "Book",
};

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const FILTER_TABS: { kind: FilterKind; label: string }[] = [
  { kind: "all", label: "All" },
  { kind: "course", label: "Courses" },
  { kind: "mock-test", label: "Mock Tests" },
  { kind: "physical", label: "Books & More" },
];

function FilterTabs({
  active,
  onChange,
}: {
  active: FilterKind;
  onChange: (k: FilterKind) => void;
}) {
  return (
    <div
      className="flex"
      style={{ overflowX: "auto", scrollbarWidth: "none", borderBottom: "1px solid var(--border)" }}
    >
      {FILTER_TABS.map(({ kind, label }) => {
        const isActive = active === kind;
        return (
          <motion.button
            key={kind}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(kind)}
            style={{
              flexShrink: 0,
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: isActive ? "2px solid var(--primary-500)" : "2px solid transparent",
              marginBottom: -1,
              cursor: "pointer",
              whiteSpace: "nowrap",
              color: isActive ? "var(--primary-400)" : "var(--muted-foreground)",
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-sm)",
              fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)",
            }}
          >
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Wishlist Card ────────────────────────────────────────────────────────────
function WishlistCard({
  item,
  onRemove,
  onMoveToCart,
}: {
  item: WishlistItem;
  onRemove: (id: string) => void;
  onMoveToCart: (id: string) => void;
}) {
  const navigate = useNavigate();
  const pct = discountPct(item.price, item.originalPrice);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={() => navigate(`/marketplace/product/${item.id}`)}
      style={{ display: "flex", flexDirection: "column", height: "100%", cursor: "pointer" }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", aspectRatio: "3/2", borderRadius: 8, overflow: "hidden" }}>
        <ProductImageFallback categoryId={item.categoryId} />

        {/* Discount badge */}
        {pct >= 10 && (
          <span
            style={{
              position: "absolute", top: 8, left: 8,
              height: 20, paddingLeft: 6, paddingRight: 6, borderRadius: 4,
              display: "inline-flex", alignItems: "center",
              backgroundColor: "var(--error-500)",
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-2xs)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--white)",
              letterSpacing: "0.3px",
            }}
          >
            {pct}% OFF
          </span>
        )}

        {/* Remove — filled heart */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          aria-label="Remove from wishlist"
          style={{
            position: "absolute", top: 8, right: 8,
            width: 28, height: 28, borderRadius: 9999,
            backgroundColor: "rgba(0,0,0,0.5)",
            border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Heart style={{ width: 14, height: 14, fill: "var(--error-500)", color: "var(--error-500)", strokeWidth: 0 }} />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col" style={{ flex: 1, paddingTop: 8, gap: 4 }}>
        {/* Product type label */}
        <span
          style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--primary-400)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {KIND_LABEL[item.kind]}
        </span>

        {/* Title */}
        <span
          style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
            lineHeight: "1.35",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.title}
        </span>

        {/* Subtitle + star rating */}
        <div className="flex items-center justify-between" style={{ gap: 4 }}>
          <span
            style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-2xs)",
              color: "var(--muted-foreground)",
              lineHeight: "1.3",
              flex: 1,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {item.subtitle}
          </span>
          <div className="flex items-center shrink-0" style={{ gap: 2 }}>
            <Star style={{ width: 10, height: 10, fill: "var(--warning-400)", color: "var(--warning-400)", strokeWidth: 0 }} />
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: "var(--font-weight-medium)" }}>
              {item.rating}
            </span>
          </div>
        </div>


        {/* Price */}
        <div className="flex items-baseline" style={{ gap: 4, paddingTop: 4 }}>
          <span style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--foreground)",
          }}>
            &#x20B9;{item.price.toLocaleString("en-IN")}
          </span>
          <span style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-2xs)",
            color: "var(--muted-foreground)",
            textDecoration: "line-through",
          }}>
            &#x20B9;{item.originalPrice.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Add to Cart CTA */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={(e) => { e.stopPropagation(); onMoveToCart(item.id); }}
          aria-label="Move to cart"
          className="w-full flex items-center justify-center"
          style={{
            height: 32, borderRadius: 8, gap: 6, marginTop: 8,
            border: "1px solid color-mix(in srgb, var(--primary) 35%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)",
            cursor: "pointer",
          }}
        >
          <ShoppingCart style={{ width: 12, height: 12, color: "var(--primary-300)", strokeWidth: 2 }} />
          <span
            style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--primary-300)",
            }}
          >
            Add to Cart
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ filter, onExplore }: { filter: FilterKind; onExplore: () => void }) {
  const isFiltered = filter !== "all";
  const filterLabel =
    filter === "course" ? "Courses"
    : filter === "mock-test" ? "Mock Tests"
    : "Books & More";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center"
      style={{ gap: 12, paddingTop: 80, paddingBottom: 64, paddingLeft: 32, paddingRight: 32 }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "color-mix(in srgb, var(--error-500) 12%, transparent)" }}
      >
        <Heart style={{ width: 32, height: 32, color: "var(--error-500)", strokeWidth: 1.5 }} />
      </div>
      <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", textAlign: "center" }}>
        {isFiltered ? `No ${filterLabel} saved` : "Your wishlist is empty"}
      </span>
      <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center", lineHeight: "1.5" }}>
        {isFiltered
          ? `Browse the marketplace and tap the heart on any ${filterLabel.toLowerCase()} to save them`
          : "Save items you love and come back to them anytime"}
      </span>
      {!isFiltered && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onExplore}
          style={{
            height: 44, paddingLeft: 24, paddingRight: 24,
            borderRadius: 12, border: "none",
            backgroundColor: "var(--primary)", cursor: "pointer",
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--white)",
          }}
        >
          Explore Marketplace
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const [items, setItems] = useState<WishlistItem[]>(DUMMY_WISHLIST);
  const [filter, setFilter] = useState<FilterKind>("all");
  const [cartCount, setCartCount] = useState(0);

  const filtered = useMemo(() => {
    return filter === "all" ? items : items.filter((i) => i.kind === filter);
  }, [items, filter]);

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  // TODO(api): POST /api/cart/items
  const handleMoveToCart = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    setCartCount((c) => c + 1);
  };

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)" }}
    >
      <StatusBar />
      <GlassHeader transparent={!scrolled}>
        <div className="flex items-center" style={{ height: 56, paddingLeft: 4, paddingRight: 12, gap: 4 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: 44, height: 44, borderRadius: 9999, border: "none",
              backgroundColor: "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: "var(--foreground)", strokeWidth: 2 }} />
          </motion.button>

          {/* Title + item count subtitle */}
          <div className="flex flex-col" style={{ flex: 1, gap: 1 }}>
            <span style={{ ...typo.pageTitleStyle }}>Wishlist</span>
            {items.length > 0 && (
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-xs)",
                  color: "var(--muted-foreground)",
                  fontWeight: "var(--font-weight-normal)",
                }}
              >
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Cart icon with badge */}
          <div style={{ position: "relative" }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/marketplace/cart")}
              aria-label="View cart"
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ShoppingCart style={{ width: 16, height: 16, color: "var(--foreground)", strokeWidth: 1.5 }} />
            </motion.button>
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  style={{
                    position: "absolute", top: -4, right: -4,
                    minWidth: 18, height: 18, borderRadius: 9999,
                    backgroundColor: "var(--primary-500)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-2xs)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--white)",
                    paddingLeft: 4, paddingRight: 4,
                  }}
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GlassHeader>

      <div ref={scrollRef} className="flex-1 min-h-0" style={{ overflowY: "auto" }}>
        <AnimatePresence mode="wait">
          {items.length === 0 ? (
            <motion.div key="empty-global" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <EmptyState filter="all" onExplore={() => navigate("/marketplace")} />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              <FilterTabs active={filter} onChange={setFilter} />

              <AnimatePresence mode="wait">
                {filtered.length === 0 ? (
                  <motion.div key={`empty-${filter}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <EmptyState filter={filter} onExplore={() => navigate("/marketplace")} />
                  </motion.div>
                ) : (
                  <motion.div key={`grid-${filter}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <div className="grid grid-cols-2" style={{ gap: 16, padding: 16 }}>
                      <AnimatePresence mode="popLayout">
                        {filtered.map((item) => (
                          <WishlistCard
                            key={item.id}
                            item={item}
                            onRemove={handleRemove}
                            onMoveToCart={handleMoveToCart}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
