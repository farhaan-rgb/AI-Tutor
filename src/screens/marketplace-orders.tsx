/**
 * Marketplace Orders — My orders list
 * Route: /marketplace/orders
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Package,
  Truck,
  PlayCircle,
  Video,
  Radio,
  FileText,
  BookOpen,
  RotateCcw,
  Monitor,
  Gamepad2,
  Brain,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar, Card, typo } from "../shared/premium-ui";
import { useGamesPass } from "../shared/games-pass-state";
import { GAMES_PASS } from "./marketplace-v1";
import { useVocabFastPurchases } from "../shared/feedback-storage";
import { getVocabFastPack, VOCABFAST_BRAND, VOCABFAST_PRICING } from "../shared/classroom-catalog";

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus = "Active" | "Delivered" | "Cancelled" | "Returned";

type ProductKind =
  | "course"
  | "live-class"
  | "recording"
  | "test-series"
  | "pyq"
  | "book"
  | "kit"
  | "device"
  | "games-pass"
  | "vocab";

interface OrderItem {
  id: string;
  title: string;
  kind: ProductKind;
  thumbImage?: string;
}

// Return lifecycle stages — only applies to `status: "Returned"` orders.
// Drives the sub-label + CTA on the order card without polluting the main
// status enum (which is what filter tabs key off).
type ReturnStage =
  | "pickup-scheduled"      // user filed return, courier yet to come
  | "refund-processing"     // pickup done, refund 7–10 business days away
  | "refund-completed"      // money credited back
  | "replacement-in-transit"; // user picked replacement over refund; new unit shipping

interface Order {
  id: string;
  orderId: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  totalItems: number;
  totalPrice: number;
  eta?: string;
  currentStep?: 0 | 1 | 2 | 3;
  validTill?: string;
  lastAccessed?: string;
  cancelReason?: string;
  rated?: boolean;
  // Physical/device only: days left in the post-delivery return window.
  // 0 = expired (Reorder is the only action). undefined = N/A (digital).
  returnWindowDays?: number;
  // Returned status only: which stage of the return is the order at.
  returnStage?: ReturnStage;
  // Stage-specific copy for the card sub-label (pickup date, refund amount,
  // replacement ETA, etc). Lets each demo order tell its own story without
  // a switch-heavy lookup in the card.
  returnDetail?: string;
}

type FilterTab = "All" | OrderStatus;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIGITAL_KINDS: ProductKind[] = [
  "course",
  "live-class",
  "recording",
  "test-series",
  "pyq",
  "games-pass",
  "vocab",
];

function isDigital(order: Order) {
  return order.items.every((it) => DIGITAL_KINDS.includes(it.kind));
}

function kindLabel(kind: ProductKind) {
  switch (kind) {
    case "course": return "Course";
    case "live-class": return "Live Class";
    case "recording": return "Recording";
    case "test-series": return "Test Series";
    case "pyq": return "PYQs";
    case "book": return "Book";
    case "kit": return "Kit";
    case "device": return "Device";
    case "games-pass": return "Games Pass";
    case "vocab": return "Vocabulary";
  }
}

function kindIcon(kind: ProductKind) {
  switch (kind) {
    case "course": return PlayCircle;
    case "live-class": return Radio;
    case "recording": return Video;
    case "test-series": return FileText;
    case "pyq": return FileText;
    case "book": return BookOpen;
    case "kit": return Package;
    case "device": return Monitor;
    case "games-pass": return Gamepad2;
    case "vocab": return Brain;
  }
}

function kindColor(kind: ProductKind) {
  switch (kind) {
    case "course": return "var(--primary-300)";
    case "live-class": return "var(--error-500)";
    case "recording": return "var(--primary-400)";
    case "test-series": return "var(--success-500)";
    case "pyq": return "var(--success-500)";
    case "book": return "var(--warning)";
    case "kit": return "var(--warning)";
    case "device": return "#ffa940";
    case "games-pass": return "var(--primary-500)";
    case "vocab": return VOCABFAST_BRAND.accentColor;
  }
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  Active: {
    label: "Active",
    color: "var(--primary-300)",
    bg: "color-mix(in srgb, var(--primary) 16%, transparent)",
  },
  Delivered: {
    label: "Delivered",
    color: "var(--success-500)",
    bg: "color-mix(in srgb, var(--success-500) 14%, transparent)",
  },
  Cancelled: {
    label: "Cancelled",
    color: "var(--error-500)",
    bg: "color-mix(in srgb, var(--error-500) 14%, transparent)",
  },
  Returned: {
    label: "Returned",
    color: "var(--warning-500)",
    bg: "color-mix(in srgb, var(--warning-500) 14%, transparent)",
  },
};

// ─── Dummy Data ───────────────────────────────────────────────────────────────
// TODO(api): GET /api/orders?userId=me
const DUMMY_ORDERS: Order[] = [
  {
    id: "o-0",
    orderId: "PM2024050801",
    date: "10 May 2026",
    status: "Active",
    totalItems: 1,
    totalPrice: 19990,
    eta: "Arrives 13 May",
    currentStep: 2,
    items: [
      {
        id: "i-0",
        title: "Primebook 2 Pro — 14\" · 6GB · 128GB",
        kind: "device",
        thumbImage: "/primebook-pro.png",
      },
    ],
  },
  {
    id: "o-ts",
    orderId: "PM2024051201",
    date: "12 May 2026",
    status: "Active",
    totalItems: 1,
    totalPrice: 599,
    validTill: "12 May 2027",
    items: [
      {
        id: "i-ts",
        title: "JEE Main Mock Series 2026 — Standard (30 Tests)",
        kind: "test-series",
      },
    ],
  },
  {
    id: "o-1",
    orderId: "PM2024041001",
    date: "15 Apr 2026",
    status: "Active",
    totalItems: 1,
    totalPrice: 2999,
    validTill: "15 Apr 2027",
    items: [
      {
        id: "i-1",
        title: "JEE Main 2027 — 12-Month Complete Course",
        kind: "course",
      },
    ],
  },
  {
    id: "o-2",
    orderId: "PM2024031234",
    date: "10 Apr 2026",
    status: "Delivered",
    totalItems: 2,
    totalPrice: 3499,
    lastAccessed: "2 days ago",
    items: [
      {
        id: "i-2",
        title: "JEE Main 2027 Complete Course",
        kind: "course",
        thumbImage:
          "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=88&h=88&fit=crop&q=80",
      },
      {
        id: "i-3",
        title: "HC Verma Physics Vol 1 & 2",
        kind: "book",
        thumbImage:
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=88&h=88&fit=crop&q=80",
      },
    ],
  },
  {
    id: "o-3",
    orderId: "PM2024030942",
    date: "02 Apr 2026",
    status: "Cancelled",
    totalItems: 1,
    totalPrice: 399,
    cancelReason: "Payment failed",
    items: [
      {
        id: "i-4",
        title: "PrepMaster Study Kit",
        kind: "kit",
        thumbImage:
          "https://images.unsplash.com/photo-1583485088034-697b5bc36b8d?w=88&h=88&fit=crop&q=80",
      },
    ],
  },
  {
    id: "o-4",
    orderId: "PM2024030780",
    date: "28 Mar 2026",
    status: "Delivered",
    totalItems: 3,
    totalPrice: 5999,
    rated: true,
    items: [
      {
        id: "i-5",
        title: "JEE + NEET Bundle",
        kind: "book",
        thumbImage:
          "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=88&h=88&fit=crop&q=80",
      },
      {
        id: "i-6",
        title: "NCERT Class 12 Full Set",
        kind: "book",
        thumbImage:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=88&h=88&fit=crop&q=80",
      },
      {
        id: "i-7",
        title: "Organic Chemistry Masterclass",
        kind: "recording",
      },
    ],
  },
  {
    id: "o-5",
    orderId: "PM2024030601",
    date: "20 Mar 2026",
    status: "Active",
    totalItems: 1,
    totalPrice: 2999,
    validTill: "20 Sep 2026",
    items: [
      {
        id: "i-8",
        title: "CAT 2025 Complete Prep — 6 Months",
        kind: "course",
      },
    ],
  },
  {
    id: "o-6",
    orderId: "PM2024030422",
    date: "12 Mar 2026",
    status: "Delivered",
    totalItems: 1,
    totalPrice: 1499,
    lastAccessed: "Yesterday",
    items: [
      {
        id: "i-9",
        title: "Organic Chemistry Masterclass — 40 Hrs",
        kind: "recording",
      },
    ],
  },
  {
    id: "o-7",
    orderId: "PM2024020114",
    date: "06 Feb 2026",
    status: "Delivered",
    totalItems: 1,
    totalPrice: 15990,
    rated: false,
    // Delivered 3+ months ago — return window long expired. Drives the
    // "Reorder only, no return" branch in the card CTA.
    returnWindowDays: 0,
    items: [
      {
        id: "i-10",
        title: "Primebook 2 Neo — 11.6\" · 4GB · 64GB",
        kind: "device",
        thumbImage: "/primebook-neo.png",
      },
    ],
  },
  // ─── Device-lifecycle demo orders ────────────────────────────────────────────
  // Five additional Primebook orders that walk every return-flow edge case:
  // shipped → fresh delivery (window open) → returned (pickup) → refunded → replacement.
  {
    id: "o-d1",
    orderId: "PM2024051301",
    date: "13 May 2026",
    status: "Active",
    totalItems: 1,
    totalPrice: 22990,
    eta: "Arrives 16 May",
    currentStep: 1,
    items: [
      {
        id: "i-d1",
        title: "Primebook 2 Max — 14\" · 8GB · 256GB",
        kind: "device",
        thumbImage: "/primebook-max.png",
      },
    ],
  },
  {
    id: "o-d2",
    orderId: "PM2024050801",
    date: "11 May 2026",
    status: "Delivered",
    totalItems: 1,
    totalPrice: 19990,
    rated: false,
    returnWindowDays: 5,
    items: [
      {
        id: "i-d2",
        title: "Primebook 2 Pro — 14\" · 6GB · 128GB",
        kind: "device",
        thumbImage: "/primebook-pro.png",
      },
    ],
  },
  {
    id: "o-d3",
    orderId: "PM2024042701",
    date: "27 Apr 2026",
    status: "Returned",
    totalItems: 1,
    totalPrice: 19990,
    returnStage: "pickup-scheduled",
    returnDetail: "Pickup Thu 14 May · 10am–2pm",
    items: [
      {
        id: "i-d3",
        title: "Primebook 2 Pro — 14\" · 6GB · 128GB",
        kind: "device",
        thumbImage: "/primebook-pro.png",
      },
    ],
  },
  {
    id: "o-d4",
    orderId: "PM2024041501",
    date: "15 Apr 2026",
    status: "Returned",
    totalItems: 1,
    totalPrice: 15990,
    returnStage: "refund-completed",
    returnDetail: "₹15,990 refunded · 09 May",
    items: [
      {
        id: "i-d4",
        title: "Primebook 2 Neo — 11.6\" · 4GB · 64GB",
        kind: "device",
        thumbImage: "/primebook-neo.png",
      },
    ],
  },
  {
    id: "o-d5",
    orderId: "PM2024050301",
    date: "03 May 2026",
    status: "Returned",
    totalItems: 1,
    totalPrice: 19990,
    returnStage: "replacement-in-transit",
    returnDetail: "Replacement arrives 17 May",
    items: [
      {
        id: "i-d5",
        title: "Primebook 2 Pro — 14\" · 6GB · 128GB",
        kind: "device",
        thumbImage: "/primebook-pro.png",
      },
    ],
  },
];

const FILTER_TABS: FilterTab[] = ["All", "Active", "Delivered", "Returned", "Cancelled"];

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: OrderStatus }) {
  const { label, color } = STATUS_CONFIG[status];
  return (
    <div className="flex items-center" style={{ gap: 5, flexShrink: 0 }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 9999,
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--font-weight-semibold)",
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Item Thumb ───────────────────────────────────────────────────────────────
function ItemThumb({ item, size = 56 }: { item: OrderItem; size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (item.thumbImage && !imgError) {
    return (
      <div style={{ width: size, height: size, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
        <img
          src={item.thumbImage}
          alt={item.title}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  const Icon = kindIcon(item.kind);
  const color = kindColor(item.kind);

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        flexShrink: 0,
        backgroundColor: `color-mix(in srgb, ${color} 14%, var(--card))`,
      }}
    >
      <Icon style={{ width: size * 0.43, height: size * 0.43, color, strokeWidth: 1.75 }} aria-hidden />
    </div>
  );
}





// CTA + sub-label resolution for an order. Centralises the state-driven logic
// so the JSX stays declarative. Sub-label is the muted line just under the
// order date — gives the user a one-glance summary of what's actionable
// (return window left, refund status, pickup ETA, etc).
function resolveOrderCta(order: Order, digital: boolean): {
  label: string;
  Icon: typeof Truck;
  active: boolean;
  subLabel?: string;
  subTone?: "muted" | "warning" | "success";
} {
  // Returned: stage drives both CTA and sub-label.
  if (order.status === "Returned") {
    switch (order.returnStage) {
      case "pickup-scheduled":
        return { label: "Track Pickup", Icon: Truck, active: true, subLabel: order.returnDetail, subTone: "warning" };
      case "refund-processing":
        return { label: "View Refund", Icon: RotateCcw, active: true, subLabel: order.returnDetail ?? "Refund processing", subTone: "warning" };
      case "refund-completed":
        return { label: "Buy Again", Icon: RotateCcw, active: false, subLabel: order.returnDetail, subTone: "success" };
      case "replacement-in-transit":
        return { label: "Track Replacement", Icon: Truck, active: true, subLabel: order.returnDetail, subTone: "warning" };
      default:
        return { label: "View Status", Icon: RotateCcw, active: true };
    }
  }

  if (order.status === "Active") {
    return {
      label: digital ? "Continue" : "Track",
      Icon: digital ? PlayCircle : Truck,
      active: true,
      subLabel: order.eta,
      subTone: "muted",
    };
  }

  if (order.status === "Delivered") {
    // Device with return window still open → "Return" is the headline action.
    if (order.returnWindowDays !== undefined && order.returnWindowDays > 0) {
      return {
        label: "Return",
        Icon: RotateCcw,
        active: true,
        subLabel: `${order.returnWindowDays} ${order.returnWindowDays === 1 ? "day" : "days"} left to return`,
        subTone: "warning",
      };
    }
    // Device whose window closed → no return action; just Reorder.
    if (order.returnWindowDays === 0) {
      return { label: "Reorder", Icon: RotateCcw, active: false, subLabel: "Return window closed", subTone: "muted" };
    }
    // Digital delivered (course, recording) → standard Reorder.
    return { label: "Reorder", Icon: RotateCcw, active: false };
  }

  // Cancelled
  return { label: "Reorder", Icon: RotateCcw, active: false, subLabel: order.cancelReason, subTone: "muted" };
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, idx }: { order: Order; idx: number }) {
  const navigate = useNavigate();
  const digital = isDigital(order);
  const primaryItem = order.items[0];

  const cta = resolveOrderCta(order, digital);
  const subToneColor =
    cta.subTone === "warning" ? "var(--warning-500)"
    : cta.subTone === "success" ? "var(--success-500)"
    : "var(--muted-foreground)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: idx * 0.04, ease: "easeOut" }}
      onClick={() => {
        // Games Pass routes to its own pass-details screen (the checkout in
        // its active-success state). Vocab orders pass the pack id so the
        // order-detail page can render partner-specific content. Others use
        // the shared order detail page.
        const firstItem = order.items[0];
        if (firstItem?.kind === "games-pass") {
          navigate("/marketplace/games-pass");
        } else if (firstItem?.kind === "vocab") {
          // vocab-<packId> → extract the pack id portion for state.
          const packId = order.id.replace(/^vocab-/, "");
          navigate("/marketplace/order-detail", { state: { orderId: order.orderId, vocabPackId: packId } });
        } else {
          navigate("/marketplace/order-detail", { state: { orderId: order.orderId } });
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <Card style={{ padding: 16 }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <ItemThumb item={primaryItem} size={56} />
          <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 4 }}>
            {/* Title + price */}
            <div className="flex items-start justify-between" style={{ gap: 8 }}>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--foreground)",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {primaryItem.title}
                {order.totalItems > 1 && (
                  <span style={{ color: "var(--muted-foreground)", fontWeight: "var(--font-weight-normal)" }}>
                    {" +"}
                    {order.totalItems - 1}
                  </span>
                )}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--foreground)",
                  flexShrink: 0,
                  letterSpacing: 0,
                }}
              >
                ₹{order.totalPrice.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Order meta — date only */}
            <span style={{ ...typo.metaStyle }}>{order.date}</span>

            {/* Stage-specific sub-label — return window left, refund status,
                pickup ETA, replacement ETA, etc. Color-coded by tone. */}
            {cta.subLabel && (
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-medium)",
                  color: subToneColor,
                  lineHeight: 1.4,
                }}
              >
                {cta.subLabel}
              </span>
            )}

            {/* Status + CTA */}
            <div className="flex items-center justify-between" style={{ gap: 8 }}>
              <StatusPill status={order.status} />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center"
                style={{
                  gap: 4,
                  height: 28,
                  paddingLeft: 12,
                  paddingRight: 12,
                  borderRadius: 20,
                  cursor: "pointer",
                  border: cta.active ? "1px solid var(--primary-alpha-30)" : "1px solid var(--border)",
                  background: "transparent",
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: cta.active ? "var(--primary-300)" : "var(--muted-foreground)",
                }}
              >
                <cta.Icon
                  style={{ width: 11, height: 11, color: cta.active ? "var(--primary-300)" : "var(--muted-foreground)", strokeWidth: 2 }}
                  aria-hidden
                />
                {cta.label}
              </motion.button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ filter }: { filter: FilterTab }) {
  const copy: Record<FilterTab, { heading: string; sub: string }> = {
    All: { heading: "No orders yet", sub: "Your purchased courses and books will appear here" },
    Active: { heading: "No active orders", sub: "You have no orders currently in progress" },
    Delivered: { heading: "No delivered orders", sub: "Orders delivered to you will show here" },
    Returned: { heading: "No returns yet", sub: "Items you've returned will show here" },
    Cancelled: { heading: "No cancelled orders", sub: "You have no cancelled orders" },
  };
  const { heading, sub } = copy[filter];

  return (
    <div
      className="flex flex-col items-center"
      style={{ paddingTop: 72, paddingBottom: 32, gap: 12 }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <Package
          style={{ width: 28, height: 28, color: "var(--muted-foreground)", strokeWidth: 1.5 }}
          aria-hidden
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-base)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--foreground)",
        }}
      >
        {heading}
      </span>
      <span
        style={{
          ...typo.cardBodyStyle,
          textAlign: "center",
          maxWidth: 240,
        }}
      >
        {sub}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const pass = useGamesPass();
  const vocab = useVocabFastPurchases();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  // When the user owns an active Games Pass, prepend a synthetic order to the
  // history so they can see + open the pass like any other purchase. The order
  // is "Active" until the pass expires; tapping it routes to the pass details
  // page (the checkout screen renders its success/details state when active).
  const passOrder: Order | null = pass.active && pass.formattedExpiry && pass.formattedPurchasedAt
    ? {
        id: "games-pass-current",
        orderId: "PMG-" + (pass.purchasedAt ?? 0).toString().slice(-8),
        date: pass.formattedPurchasedAt,
        status: "Active",
        items: [{ id: "games-pass-item", title: GAMES_PASS.label, kind: "games-pass" }],
        totalItems: 1,
        totalPrice: GAMES_PASS.price,
        validTill: pass.formattedExpiry,
        lastAccessed: "Just now",
      }
    : null;

  // Synthesize an order entry for every VocabularyFast pack the student has
  // purchased. Status = "Delivered" since digital products are instantly
  // available. Tapping the order routes to /marketplace/order-detail with the
  // pack id in state, which renders the vocab-specific detail layout.
  const vocabOrders: Order[] = vocab.purchasedIds
    .map((packId) => {
      const p = getVocabFastPack(packId);
      if (!p) return null;
      const progress = vocab.progress(packId);
      const purchasedAt = progress?.lastActivityAt ?? Date.now();
      return {
        id: `vocab-${packId}`,
        orderId: "PMV-" + purchasedAt.toString().slice(-8),
        date: new Date(purchasedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        status: "Delivered" as OrderStatus,
        items: [{ id: `vocab-item-${packId}`, title: p.title, kind: "vocab" as ProductKind }],
        totalItems: 1,
        totalPrice: VOCABFAST_PRICING.packPrice,
        lastAccessed: progress && progress.lastActivityAt
          ? new Date(progress.lastActivityAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
          : undefined,
      } satisfies Order;
    })
    .filter((o): o is Order => o !== null);

  const allOrders: Order[] = [
    ...(passOrder ? [passOrder] : []),
    ...vocabOrders,
    ...DUMMY_ORDERS,
  ];

  const filtered =
    activeTab === "All"
      ? allOrders
      : allOrders.filter((o) => o.status === activeTab);

  const tabCounts: Record<FilterTab, number> = {
    All: allOrders.length,
    Active: allOrders.filter((o) => o.status === "Active").length,
    Delivered: allOrders.filter((o) => o.status === "Delivered").length,
    Returned: allOrders.filter((o) => o.status === "Returned").length,
    Cancelled: allOrders.filter((o) => o.status === "Cancelled").length,
  };

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
      {/* Header */}
      <div
        className="sticky top-0 z-20 shrink-0"
        style={{
          backgroundColor: "var(--card)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <StatusBar />
        <div
          className="flex items-center"
          style={{ height: 52, paddingLeft: 8, paddingRight: 20, gap: 12 }}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: 44,
              height: 44,
              borderRadius: 9999,
              backgroundColor: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <ArrowLeft
              style={{ width: 20, height: 20, color: "var(--foreground)", strokeWidth: 2 }}
            />
          </motion.button>
          <span style={{ ...typo.pageTitleStyle }}>My Orders</span>
        </div>

        {/* Filter tabs */}
        <div
          className="flex"
          style={{
            overflowX: "auto",
            paddingLeft: 4,
            paddingRight: 4,
            scrollbarWidth: "none",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab(tab)}
                style={{
                  flexShrink: 0,
                  height: 44,
                  paddingLeft: 12,
                  paddingRight: 12,
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid var(--primary)"
                    : "2px solid transparent",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: -1,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-sm)",
                    fontWeight: isActive
                      ? "var(--font-weight-semibold)"
                      : "var(--font-weight-medium)",
                    color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-2xs)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  }}
                >
                  {tabCounts[tab]}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "16px 16px 32px" }}>
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <EmptyState filter={activeTab} />
          ) : (
            <div className="flex flex-col" style={{ gap: 16 }}>
              {filtered.map((order, idx) => (
                <OrderCard key={order.id} order={order} idx={idx} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
