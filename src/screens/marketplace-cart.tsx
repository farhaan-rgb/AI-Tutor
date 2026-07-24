/**
 * Marketplace Cart — /marketplace/cart
 * Shopping cart with per-item selection, delivery progress, coupon, and checkout.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Truck, X, Plus, Minus, MapPin, Loader2, Sparkles, ShoppingCart,
  Trash2, Zap, Star, ChevronRight, Check,
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import { StatusBar, GlassHeader, Card, typo } from "../shared/premium-ui";
import { CATEGORY_FALLBACK, ProductImageFallback, discountPct } from "./marketplace-shared";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  categoryId: string;
  urgency?: string;
  thumbImage?: string;
}

interface UpsellProduct {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  categoryId: string;
  rating: number;
  reviewCount: number;
  thumbImage?: string;
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────
// TODO(api): GET /api/cart
const DUMMY_CART_ITEMS: CartItem[] = [
  {
    id: "pb-pro",
    title: "Primebook 2 Pro",
    subtitle: "14\" · 6GB · 128GB · Android 15 · Device",
    price: 19990,
    originalPrice: 29990,
    categoryId: "devices",
    urgency: "Free 1-yr warranty included",
    thumbImage: "/primebook-pro.png",
  },
  {
    id: "fd-1",
    title: "JEE Main 2027 Complete Course",
    subtitle: "12-Month Access · Digital",
    price: 3499,
    originalPrice: 6999,
    categoryId: "courses",
    urgency: "Only 12 seats left",
    thumbImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=240&h=240&fit=crop",
  },
  {
    id: "fd-3",
    title: "HC Verma Physics",
    subtitle: "Vol. 1 & 2 Set · Physical",
    price: 499,
    originalPrice: 850,
    categoryId: "books",
    thumbImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=240&h=240&fit=crop",
  },
  {
    id: "fd-4",
    title: "PrepMaster Study Kit",
    subtitle: "5 Notebooks + Pens · Physical",
    price: 399,
    originalPrice: 799,
    categoryId: "stationery",
    thumbImage: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=240&h=240&fit=crop",
  },
];

const FREE_DELIVERY_THRESHOLD = 500;
const DELIVERY_CHARGE = 50;

// TODO(api): GET /api/delivery/estimate?pin=:pincode
const DUMMY_PINCODES: Record<string, { city: string; days: number }> = {
  "110001": { city: "New Delhi", days: 2 },
  "400001": { city: "Mumbai", days: 3 },
  "560001": { city: "Bengaluru", days: 4 },
  "600001": { city: "Chennai", days: 5 },
  "700001": { city: "Kolkata", days: 4 },
  "500001": { city: "Hyderabad", days: 3 },
};

// TODO(api): GET /api/marketplace/recommendations?context=cart
const DUMMY_UPSELL_PRODUCTS: UpsellProduct[] = [
  { id: "up-1", title: "NEET Mock Series", price: 699, originalPrice: 1299, categoryId: "mock-tests", rating: 4.7, reviewCount: 2847, thumbImage: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=320&h=240&fit=crop" },
  { id: "up-2", title: "Revision Flashcards", price: 199, originalPrice: 399, categoryId: "books", rating: 4.3, reviewCount: 891, thumbImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=320&h=240&fit=crop" },
  { id: "up-3", title: "Olympiad Math Prep", price: 299, originalPrice: 599, categoryId: "olympiad", rating: 4.5, reviewCount: 1234, thumbImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=320&h=240&fit=crop" },
];

// ─── QuantityStepper — pill-shaped, single container ──────────────────────────
function QuantityStepper({
  count,
  onDecrement,
  onIncrement,
}: {
  count: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        height: 32,
        borderRadius: 9999,
        border: "0.5px solid var(--border)",
        backgroundColor: "var(--card)",
        boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <motion.button
        whileTap={{ scale: 0.9, backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)" }}
        onClick={onDecrement}
        aria-label="Decrease quantity"
        style={{
          width: 32, height: 32,
          border: "none", background: "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Minus style={{ width: 13, height: 13, color: "var(--foreground)", strokeWidth: 2.5 }} />
      </motion.button>
      <motion.span
        key={count}
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
        style={{
          minWidth: 24,
          textAlign: "center",
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-sm)",
          fontWeight: 700,
          color: "var(--foreground)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </motion.span>
      <motion.button
        whileTap={{ scale: 0.9, backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)" }}
        onClick={onIncrement}
        aria-label="Increase quantity"
        style={{
          width: 32, height: 32,
          border: "none", background: "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Plus style={{ width: 13, height: 13, color: "var(--foreground)", strokeWidth: 2.5 }} />
      </motion.button>
    </div>
  );
}

// ─── PremiumThumb — real product image when available, gradient orb otherwise
function PremiumThumb({
  categoryId,
  thumbImage,
  title,
  size = 88,
  iconSize = 36,
  borderRadius = 14,
}: {
  categoryId: string;
  thumbImage?: string;
  title?: string;
  size?: number;
  iconSize?: number;
  borderRadius?: number;
}) {
  const fb = CATEGORY_FALLBACK[categoryId] ?? CATEGORY_FALLBACK["books"];
  const accent = fb.color;
  const { Icon } = fb;
  const [imgFailed, setImgFailed] = useState(!thumbImage);

  if (thumbImage && !imgFailed) {
    return (
      <div
        style={{
          width: size, height: size, borderRadius,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "var(--card)",
          border: `0.5px solid ${accent}40`,
          boxShadow: [
            "inset 0 0.5px 0 rgba(255,255,255,0.08)",
            "0 4px 12px rgba(0,0,0,0.25)",
            `0 0 18px ${accent}1a`,
          ].join(", "),
          flexShrink: 0,
        }}
      >
        <img
          src={thumbImage}
          alt={title ?? ""}
          onError={() => setImgFailed(true)}
          style={{
            width: "100%", height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size, height: size, borderRadius,
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
        flexShrink: 0,
      }}
    >
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(135deg, ${accent}26 0%, transparent 100%)`,
        pointerEvents: "none",
      }} />
      <div aria-hidden style={{
        position: "absolute", top: -size * 0.3, right: -size * 0.3, width: size * 0.95, height: size * 0.95,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
        filter: `blur(${size * 0.13}px)`, opacity: 0.52, pointerEvents: "none",
      }} />
      <div aria-hidden style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "50%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />
      <Icon
        size={iconSize}
        style={{
          color: accent,
          filter: `drop-shadow(0 0 ${iconSize * 0.4}px ${accent}99) drop-shadow(0 2px 4px ${accent}55)`,
          position: "relative",
          zIndex: 1,
        }}
      />
    </div>
  );
}

// ─── CartItemCard — checkbox + swipe-to-delete ────────────────────────────────
function CartItemCard({
  item,
  qty,
  selected,
  onQtyChange,
  onRemove,
  onSaveForLater,
  onToggleSelect,
}: {
  item: CartItem;
  qty: number;
  selected: boolean;
  onQtyChange: (delta: number) => void;
  onRemove: () => void;
  onSaveForLater: () => void;
  onToggleSelect: () => void;
}) {
  const x = useMotionValue(0);
  const deleteReveal = useTransform(x, [-80, -20], [1, 0]);
  const isDigital = !item.subtitle.includes("Physical");
  const pct = discountPct(item.price, item.originalPrice);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -60) {
      onRemove();
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
    }
  }

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
        {/* Delete reveal zone */}
        <motion.div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 80,
            opacity: deleteReveal,
            backgroundColor: "var(--error-500)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Trash2 style={{ width: 18, height: 18, color: "var(--white)", strokeWidth: 2 }} />
          <span
            style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-2xs)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--white)",
            }}
          >
            Remove
          </span>
        </motion.div>

        {/* Draggable card */}
        <motion.div
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: -80, right: 0 }}
          dragElastic={{ left: 0.08, right: 0 }}
          onDragEnd={handleDragEnd}
          animate={{ opacity: selected ? 1 : 0.5 }}
          transition={{ duration: 0.15 }}
          style={{
            x,
            backgroundColor: "var(--background)",
          }}
        >
          <div style={{ padding: 12 }}>
            <div
              style={{
                padding: 12, borderRadius: 16,
                backgroundColor: "var(--card)",
                border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
                boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.12)",
              }}
            >
              <div className="flex items-start" style={{ gap: 14 }}>
                {/* Premium thumbnail — real product image, gradient orb fallback */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <PremiumThumb categoryId={item.categoryId} thumbImage={item.thumbImage} title={item.title} size={88} iconSize={40} borderRadius={14} />
                  {pct >= 20 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 6, left: 6,
                        height: 18, paddingLeft: 6, paddingRight: 6,
                        borderRadius: 4,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        border: "0.5px solid rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-family-inter)",
                          fontSize: "var(--text-2xs)",
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.95)",
                          lineHeight: 1,
                          letterSpacing: 0.2,
                        }}
                      >
                        {pct}% OFF
                      </span>
                    </div>
                  )}
                  {/* Checkbox overlay — bottom-right of thumbnail */}
                  <motion.div
                    role="checkbox"
                    aria-checked={selected}
                    aria-label={selected ? "Deselect item" : "Select item"}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
                    whileTap={{ scale: 0.85 }}
                    animate={{
                      backgroundColor: selected ? "var(--primary)" : "rgba(0,0,0,0.55)",
                      borderColor: selected ? "var(--primary)" : "rgba(255,255,255,0.45)",
                    }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute",
                      bottom: 6, right: 6,
                      width: 22, height: 22,
                      borderRadius: 6,
                      borderWidth: "1.5px",
                      borderStyle: "solid",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: selected ? "0 2px 8px var(--primary)" : "0 1px 3px rgba(0,0,0,0.4)",
                    }}
                  >
                    <AnimatePresence>
                      {selected && (
                        <motion.div
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 28 }}
                          style={{ display: "flex" }}
                        >
                          <Check style={{ width: 13, height: 13, color: "var(--white)", strokeWidth: 3 }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Info column */}
                <div className="flex flex-col flex-1" style={{ gap: 4, minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-family-inter)",
                      fontSize: "var(--text-sm)",
                      fontWeight: 700,
                      color: "var(--foreground)",
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.title}
                  </span>

                  <span
                    style={{
                      fontFamily: "var(--font-family-inter)",
                      fontSize: "var(--text-xs)",
                      color: "var(--muted-foreground)",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.subtitle}
                  </span>

                  <div className="flex items-baseline" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-base)",
                        fontWeight: 800,
                        color: "var(--foreground)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      ₹{(item.price * qty).toLocaleString("en-IN")}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-xs)",
                        color: "var(--muted-foreground)",
                        textDecoration: "line-through",
                      }}
                    >
                      ₹{(item.originalPrice * qty).toLocaleString("en-IN")}
                    </span>
                    {pct > 0 && (
                      <span
                        style={{
                          fontFamily: "var(--font-family-inter)",
                          fontSize: "var(--text-xs)",
                          fontWeight: 700,
                          color: "var(--success-500)",
                        }}
                      >
                        {pct}% off
                      </span>
                    )}
                  </div>

                  {item.urgency && (
                    <div className="flex items-center" style={{ gap: 4, marginTop: 6 }}>
                      <Zap style={{ width: 11, height: 11, color: "var(--warning-500)", strokeWidth: 2, flexShrink: 0, fill: "var(--warning-500)" }} />
                      <span
                        style={{
                          fontFamily: "var(--font-family-inter)",
                          fontSize: "var(--text-2xs)",
                          fontWeight: 600,
                          color: "var(--warning-500)",
                        }}
                      >
                        {item.urgency}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom action row */}
              <div className="flex items-center justify-between" style={{ marginTop: 12, paddingTop: 12, borderTop: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)" }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={onSaveForLater}
                    className="flex items-center"
                    style={{
                      gap: 5,
                      height: 28, paddingLeft: 10, paddingRight: 12,
                      borderRadius: 9999,
                      background: "transparent",
                      border: "0.5px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <Star style={{ width: 11, height: 11, color: "var(--muted-foreground)", strokeWidth: 1.75 }} />
                    <span
                      style={{
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-2xs)",
                        fontWeight: 600,
                        color: "var(--muted-foreground)",
                      }}
                    >
                      Save
                    </span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={onRemove}
                    aria-label="Remove from cart"
                    className="flex items-center justify-center"
                    style={{
                      width: 28, height: 28,
                      borderRadius: 9999,
                      background: "transparent",
                      border: "0.5px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 style={{ width: 12, height: 12, color: "var(--muted-foreground)", strokeWidth: 1.75 }} />
                  </motion.button>
                </div>

                {!isDigital && (
                  <QuantityStepper
                    count={qty}
                    onDecrement={() => onQtyChange(-1)}
                    onIncrement={() => onQtyChange(1)}
                  />
                )}
              </div>
            </div>
          </div>
        </motion.div>
    </div>
  );
}

// ─── SavedItemRow ─────────────────────────────────────────────────────────────
function SavedItemRow({
  item,
  onMoveToCart,
  onRemove,
}: {
  item: CartItem;
  onMoveToCart: () => void;
  onRemove: () => void;
}) {
  const pct = discountPct(item.price, item.originalPrice);
  return (
    <div className="flex items-center" style={{ gap: 12, paddingTop: 12, paddingBottom: 12 }}>
      <PremiumThumb categoryId={item.categoryId} thumbImage={item.thumbImage} title={item.title} size={48} iconSize={20} borderRadius={10} />
      <div className="flex flex-col flex-1" style={{ gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-medium)",
            color: "var(--foreground)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.title}
        </span>
        <div className="flex items-center" style={{ gap: 4 }}>
          <span
            style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--foreground)",
            }}
          >
            ₹{item.price.toLocaleString("en-IN")}
          </span>
          {pct > 0 && (
            <span
              style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-2xs)",
                color: "var(--success-500)",
              }}
            >
              {pct}% off
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center" style={{ gap: 8, flexShrink: 0 }}>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={onMoveToCart}
          style={{
            height: 28,
            paddingLeft: 8,
            paddingRight: 8,
            borderRadius: 8,
            border: "1.5px solid var(--primary)",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--primary-300)",
          }}
        >
          Move to cart
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          aria-label={`Remove ${item.title}`}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: "1px solid var(--border)",
            backgroundColor: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X style={{ width: 12, height: 12, color: "var(--muted-foreground)", strokeWidth: 2 }} />
        </motion.button>
      </div>
    </div>
  );
}


// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center" style={{ gap: 4 }}>
      <Star
        style={{ width: 10, height: 10, color: "var(--warning-500)", strokeWidth: 0, fill: "var(--warning-500)" }}
      />
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-2xs)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--warning-500)",
        }}
      >
        {rating}
      </span>
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-2xs)",
          color: "var(--muted-foreground)",
        }}
      >
        ({count > 999 ? `${(count / 1000).toFixed(1)}k` : count})
      </span>
    </div>
  );
}

// ─── PriceRow ─────────────────────────────────────────────────────────────────
function PriceRow({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: bold ? "var(--text-base)" : "var(--text-sm)",
          fontWeight: bold ? "var(--font-weight-bold)" : "var(--font-weight-regular)",
          color: bold ? "var(--foreground)" : "var(--muted-foreground)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: bold ? "var(--text-base)" : "var(--text-sm)",
          fontWeight: bold ? "var(--font-weight-bold)" : "var(--font-weight-medium)",
          color: valueColor ?? "var(--foreground)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();

  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(DUMMY_CART_ITEMS.map((item) => [item.id, 1]))
  );
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(DUMMY_CART_ITEMS.map((i) => i.id))
  );
  const [pinInput, setPinInput] = useState(() => localStorage.getItem("cart_last_pin") ?? "");
  const [pinStatus, setPinStatus] = useState<"idle" | "checking" | "found" | "error">("idle");
  const [pinResult, setPinResult] = useState<{ city: string; days: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("cart_last_pin");
    if (saved && saved.length === 6) {
      const result = DUMMY_PINCODES[saved];
      if (result) { setPinResult(result); setPinStatus("found"); }
      else setPinStatus("error");
    }
  }, []);

  const allItems = DUMMY_CART_ITEMS.filter((item) => !removedIds.has(item.id));
  const activeItems = allItems.filter((item) => !savedIds.has(item.id));
  const savedItems = allItems.filter((item) => savedIds.has(item.id));
  const selectedActiveItems = activeItems.filter((i) => selectedIds.has(i.id));
  const subtotal = selectedActiveItems.reduce((sum, item) => sum + item.price * (quantities[item.id] ?? 1), 0);
  const totalMRP = selectedActiveItems.reduce((sum, item) => sum + item.originalPrice * (quantities[item.id] ?? 1), 0);
  const discount = totalMRP - subtotal;
  const physicalTotal = selectedActiveItems
    .filter((item) => item.subtitle.includes("Physical"))
    .reduce((sum, item) => sum + item.price * (quantities[item.id] ?? 1), 0);
  const freeDelivery = physicalTotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryCharge = physicalTotal === 0 ? 0 : freeDelivery ? 0 : DELIVERY_CHARGE;
  const total = subtotal + deliveryCharge;
  const remaining = Math.max(FREE_DELIVERY_THRESHOLD - physicalTotal, 0);

  function handleQty(id: string, delta: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }));
  }

  function handleRemove(id: string) {
    setRemovedIds((prev) => new Set([...prev, id]));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  function handleSaveForLater(id: string) {
    setSavedIds((prev) => new Set([...prev, id]));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  function handleMoveToCart(id: string) {
    setSavedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setSelectedIds((prev) => new Set([...prev, id]));
  }

  function handleRemoveSaved(id: string) {
    setRemovedIds((prev) => new Set([...prev, id]));
    setSavedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  function handleToggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCheckPin() {
    const pin = pinInput.trim();
    if (pin.length !== 6) return;
    setPinStatus("checking");
    setPinResult(null);
    setTimeout(() => {
      const result = DUMMY_PINCODES[pin];
      if (result) {
        setPinResult(result);
        setPinStatus("found");
        localStorage.setItem("cart_last_pin", pin);
      } else {
        setPinStatus("error");
      }
    }, 800);
  }

  const isEmpty = activeItems.length === 0 && savedItems.length === 0;
  const canCheckout = selectedActiveItems.length > 0;

  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, paddingLeft: 8, paddingRight: 16, gap: 4 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: 44,
              height: 44,
              borderRadius: 9999,
              border: "none",
              backgroundColor: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: "var(--foreground)", strokeWidth: 2 }} />
          </motion.button>
          <div className="flex flex-col" style={{ gap: 2 }}>
            <span style={typo.pageTitleStyle}>My Cart</span>
            {activeItems.length > 0 && (
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-xs)",
                  color: "var(--muted-foreground)",
                }}
              >
                {selectedActiveItems.length > 0 && selectedActiveItems.length < activeItems.length
                  ? `${selectedActiveItems.length} of ${activeItems.length} selected`
                  : `${activeItems.length} item${activeItems.length !== 1 ? "s" : ""}`}
              </span>
            )}
          </div>
        </div>
      </GlassHeader>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: activeItems.length > 0 ? 96 : 32 }}>

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="flex flex-col items-center justify-center"
            style={{ gap: 20, padding: "80px 32px 32px", textAlign: "center" }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 96, height: 96, borderRadius: 28,
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(135deg, color-mix(in srgb, var(--primary-400) 14%, #0a0408) 0%, color-mix(in srgb, var(--primary-400) 28%, #0a0408) 50%, color-mix(in srgb, var(--primary-400) 36%, #0a0408) 100%)",
                border: "0.5px solid color-mix(in srgb, var(--primary-400) 50%, transparent)",
                boxShadow: [
                  "inset 0 0.5px 0 rgba(255,255,255,0.32)",
                  "inset 0 1.5px 0 color-mix(in srgb, var(--primary-400) 38%, transparent)",
                  "inset 0 -0.5px 0 rgba(0,0,0,0.5)",
                  "0 8px 24px color-mix(in srgb, var(--primary-400) 28%, transparent)",
                ].join(", "),
              }}
            >
              <div aria-hidden style={{
                position: "absolute", top: -28, right: -28, width: 88, height: 88,
                borderRadius: "50%",
                background: "radial-gradient(circle, var(--primary-400) 0%, transparent 70%)",
                filter: "blur(14px)", opacity: 0.55,
              }} />
              <ShoppingCart style={{
                width: 40, height: 40, color: "var(--primary-300)", strokeWidth: 1.5,
                filter: "drop-shadow(0 0 14px color-mix(in srgb, var(--primary-400) 90%, transparent))",
                position: "relative", zIndex: 1,
              }} />
            </div>
            <div className="flex flex-col" style={{ gap: 8 }}>
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--foreground)",
                }}
              >
                Your cart is empty
              </span>
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  color: "var(--muted-foreground)",
                }}
              >
                Browse courses, books, and stationery for your exam prep
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/marketplace")}
              style={{
                height: 44,
                paddingLeft: 24,
                paddingRight: 24,
                borderRadius: 8,
                border: "none",
                backgroundColor: "var(--primary)",
                cursor: "pointer",
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--white)",
              }}
            >
              Browse Marketplace
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* ── Active cart items ── */}
            {activeItems.length > 0 && (
              <div style={{ paddingTop: 8 }}>
                <AnimatePresence>
                  {activeItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 16, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 40, height: 0, scale: 0.94 }}
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 28,
                        delay: index * 0.04,
                      }}
                    >
                      <CartItemCard
                        item={item}
                        qty={quantities[item.id] ?? 1}
                        selected={selectedIds.has(item.id)}
                        onQtyChange={(delta) => handleQty(item.id, delta)}
                        onRemove={() => handleRemove(item.id)}
                        onSaveForLater={() => handleSaveForLater(item.id)}
                        onToggleSelect={() => handleToggleSelected(item.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* ── Saved for later ── */}
            <AnimatePresence>
              {savedItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden", padding: "12px 16px 0" }}
                >
                  <Card style={{ padding: "4px 12px", border: "none" }}>
                    <div className="flex items-center justify-between" style={{ paddingTop: 12, paddingBottom: 8 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-family-inter)",
                          fontSize: "var(--text-sm)",
                          fontWeight: "var(--font-weight-semibold)",
                          color: "var(--foreground)",
                        }}
                      >
                        Saved for Later
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-family-inter)",
                          fontSize: "var(--text-xs)",
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {savedItems.length} item{savedItems.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {savedItems.map((item, i) => (
                      <div key={item.id}>
                        {i > 0 && <div style={{ height: 1, backgroundColor: "var(--border)" }} />}
                        <SavedItemRow
                          item={item}
                          onMoveToCart={() => handleMoveToCart(item.id)}
                          onRemove={() => handleRemoveSaved(item.id)}
                        />
                      </div>
                    ))}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>


            {/* ── Upsell — You might also need ── */}
            <div style={{ padding: "20px 0 0" }}>
              <div className="flex items-center justify-between" style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 12 }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <Sparkles style={{ width: 14, height: 14, color: "var(--primary-300)", strokeWidth: 1.5 }} />
                  <span
                    style={{
                      fontFamily: "var(--font-family-inter)",
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--foreground)",
                    }}
                  >
                    You might also need
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/marketplace")}
                  style={{ display: "flex", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--primary-300)" }}>
                    See all
                  </span>
                  <ChevronRight style={{ width: 12, height: 12, color: "var(--primary-300)", strokeWidth: 2 }} />
                </motion.button>
              </div>
              <div
                className="flex"
                style={{ gap: 12, overflowX: "auto", scrollbarWidth: "none", paddingLeft: 16, paddingRight: 16, paddingBottom: 4 }}
              >
                {DUMMY_UPSELL_PRODUCTS.map((item) => {
                  const pct = discountPct(item.price, item.originalPrice);
                  return (
                    <motion.div
                      key={item.id}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        flexShrink: 0,
                        width: 148,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{
                        position: "relative",
                        aspectRatio: "3/2",
                        overflow: "hidden",
                        borderRadius: 12,
                        backgroundColor: "var(--card)",
                        border: "0.5px solid var(--border)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      }}>
                        {item.thumbImage ? (
                          <img
                            src={item.thumbImage}
                            alt={item.title}
                            style={{
                              width: "100%", height: "100%",
                              objectFit: "cover", display: "block",
                            }}
                          />
                        ) : (
                          <ProductImageFallback categoryId={item.categoryId} iconSize={36} />
                        )}
                        {pct >= 20 && (
                          <div
                            style={{
                              position: "absolute",
                              top: 6, left: 6,
                              height: 18, paddingLeft: 6, paddingRight: 6,
                              borderRadius: 4,
                              backgroundColor: "rgba(0,0,0,0.55)",
                              backdropFilter: "blur(10px)",
                              WebkitBackdropFilter: "blur(10px)",
                              border: "0.5px solid rgba(255,255,255,0.1)",
                              display: "flex", alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-family-inter)",
                                fontSize: "var(--text-2xs)",
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.95)",
                                lineHeight: 1,
                                letterSpacing: 0.2,
                              }}
                            >
                              {pct}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col" style={{ paddingTop: 8, gap: 4 }}>
                        <span
                          style={{
                            fontFamily: "var(--font-family-inter)",
                            fontSize: "var(--text-xs)",
                            fontWeight: "var(--font-weight-medium)",
                            color: "var(--foreground)",
                            lineHeight: 1.3,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.title}
                        </span>
                        <StarRating rating={item.rating} count={item.reviewCount} />
                        <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
                          <div className="flex flex-col" style={{ gap: 2 }}>
                            <span
                              style={{
                                fontFamily: "var(--font-family-inter)",
                                fontSize: "var(--text-xs)",
                                fontWeight: "var(--font-weight-bold)",
                                color: "var(--foreground)",
                              }}
                            >
                              ₹{item.price.toLocaleString("en-IN")}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-family-inter)",
                                fontSize: "var(--text-2xs)",
                                color: "var(--muted-foreground)",
                                textDecoration: "line-through",
                              }}
                            >
                              ₹{item.originalPrice.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.88 }}
                            aria-label={`Add ${item.title} to cart`}
                            style={{
                              height: 28,
                              paddingLeft: 8,
                              paddingRight: 8,
                              borderRadius: 9999,
                              border: "1.5px solid var(--primary)",
                              backgroundColor: "transparent",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            <Plus style={{ width: 10, height: 10, color: "var(--primary-300)", strokeWidth: 2.5 }} />
                            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary-300)" }}>Add</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── PIN delivery check (physical items only) ── */}
            {physicalTotal > 0 && (
              <div style={{ padding: "12px 16px 0" }}>
                <Card style={{ padding: 16, border: "none" }}>
                  <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}>
                    <MapPin style={{ width: 15, height: 15, color: "var(--primary-300)", strokeWidth: 1.8, flexShrink: 0 }} />
                    <span
                      style={{
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-weight-semibold)",
                        color: "var(--foreground)",
                      }}
                    >
                      Check Delivery
                    </span>
                  </div>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "")); setPinStatus("idle"); setPinResult(null); }}
                      placeholder="Enter 6-digit PIN code"
                      onKeyDown={(e) => { if (e.key === "Enter") handleCheckPin(); }}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--input)",
                        paddingLeft: 12,
                        paddingRight: 12,
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-sm)",
                        color: "var(--foreground)",
                        outline: "none",
                      }}
                    />
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleCheckPin}
                      disabled={pinInput.length !== 6 || pinStatus === "checking"}
                      style={{
                        height: 44,
                        paddingLeft: 16,
                        paddingRight: 16,
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: pinInput.length === 6 ? "var(--primary)" : "var(--muted)",
                        cursor: pinInput.length === 6 ? "pointer" : "not-allowed",
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-weight-semibold)",
                        color: pinInput.length === 6 ? "var(--white)" : "var(--muted-foreground)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      {pinStatus === "checking" && (
                        <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                      )}
                      Check
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {pinStatus === "found" && pinResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                        style={{ gap: 8, marginTop: 8 }}
                      >
                        <Truck style={{ width: 13, height: 13, color: "var(--success-500)", strokeWidth: 2, flexShrink: 0 }} />
                        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--success-500)" }}>
                          Delivery to {pinResult.city} in {pinResult.days} day{pinResult.days !== 1 ? "s" : ""}
                        </span>
                      </motion.div>
                    )}
                    {pinStatus === "error" && (
                      <motion.span
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                          fontFamily: "var(--font-family-inter)",
                          fontSize: "var(--text-xs)",
                          color: "var(--error-500)",
                          display: "block",
                          marginTop: 8,
                        }}
                      >
                        PIN code not serviceable. Please try another.
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Card>
              </div>
            )}

            {/* ── Price summary ── */}
            <div style={{ padding: "16px 16px 0" }}>
              <Card style={{ padding: 16, border: "none" }}>
                <span
                  style={{
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-base)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)",
                    display: "block",
                    marginBottom: 12,
                  }}
                >
                  Price Details
                </span>

                <div className="flex flex-col" style={{ gap: 8 }}>
                  <PriceRow
                    label={`MRP (${selectedActiveItems.length} item${selectedActiveItems.length !== 1 ? "s" : ""})`}
                    value={`₹${totalMRP.toLocaleString("en-IN")}`}
                  />
                  <PriceRow
                    label="Discount"
                    value={`−₹${discount.toLocaleString("en-IN")}`}
                    valueColor="var(--success-500)"
                  />
                  {physicalTotal > 0 && (
                    <div className="flex flex-col" style={{ gap: 4 }}>
                      <PriceRow
                        label="Delivery"
                        value={freeDelivery ? "FREE" : `₹${DELIVERY_CHARGE}`}
                        valueColor={freeDelivery ? "var(--success-500)" : undefined}
                      />
                      {!freeDelivery && (
                        <div className="flex items-center" style={{ gap: 4 }}>
                          <Truck style={{ width: 12, height: 12, color: "var(--primary-300)", strokeWidth: 2, flexShrink: 0 }} />
                          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--primary-300)" }}>
                            Add ₹{remaining.toLocaleString("en-IN")} more for free delivery
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ height: 1, backgroundColor: "var(--border)", margin: "12px 0" }} />

                <PriceRow label="Total Payable" value={`₹${total.toLocaleString("en-IN")}`} bold />

              </Card>
            </div>

          </>
        )}
      </div>

      {/* ── Sticky checkout footer — frosted glass ── */}
      {activeItems.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0, left: 0, right: 0,
            backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderTop: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
            padding: "12px 16px 16px",
            zIndex: 10,
          }}
        >
          <motion.button
            whileTap={canCheckout ? { scale: 0.97 } : {}}
            onClick={() => { if (canCheckout) navigate("/marketplace/checkout"); }}
            className="w-full"
            style={{
              height: 52,
              borderRadius: 14,
              border: "none",
              background: canCheckout
                ? "linear-gradient(180deg, color-mix(in srgb, var(--primary) 100%, white 12%) 0%, var(--primary) 100%)"
                : "var(--muted)",
              cursor: canCheckout ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: canCheckout
                ? "inset 0 0.5px 0 rgba(255,255,255,0.25), 0 6px 18px color-mix(in srgb, var(--primary) 40%, transparent), 0 0 24px color-mix(in srgb, var(--primary) 20%, transparent)"
                : "none",
              opacity: canCheckout ? 1 : 0.5,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-base)",
                fontWeight: 700,
                color: canCheckout ? "var(--white)" : "var(--muted-foreground)",
                letterSpacing: "-0.01em",
              }}
            >
              {canCheckout ? "Place Order" : "No items selected"}
            </span>
            {canCheckout && (
              <>
                <span style={{
                  width: 4, height: 4, borderRadius: 9999,
                  backgroundColor: "rgba(255,255,255,0.5)",
                }} />
                <span
                  style={{
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-base)",
                    fontWeight: 800,
                    color: "var(--white)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  ₹{total.toLocaleString("en-IN")}
                </span>
                <ChevronRight style={{ width: 18, height: 18, color: "var(--white)", strokeWidth: 2.5, marginLeft: 2 }} />
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}
