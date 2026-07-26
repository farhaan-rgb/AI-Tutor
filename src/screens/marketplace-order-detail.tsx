/**
 * Marketplace Order Detail — Individual order view
 * Route: /marketplace/order-detail
 * Receives: { orderId: string } via location.state
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Receipt,
  KeyRound,
  PlayCircle,
  Clock,
  CalendarCheck,
  Star,
  X,
  Share2,
  XCircle,
  Video,
  Radio,
  FileText,
  BookOpen,
  Monitor,
  ShieldCheck,
  RotateCcw,
  Phone,
} from "lucide-react";
import { Brain, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar, Card, typo } from "../shared/premium-ui";
import { getVocabFastPack, VOCABFAST_BRAND, VOCABFAST_PRICING, type VocabFastPack } from "../shared/classroom-catalog";

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
  | "device";

interface OrderDetailItem {
  id: string;
  title: string;
  kind: ProductKind;
  qty: number;
  price: number;
  thumbImage?: string;
}

interface TimelineStep {
  id: string;
  label: string;
  sublabel?: string;
  datetime: string;
  completed: boolean;
  isFuture?: boolean;
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
}

interface OrderDetail {
  orderId: string;
  status: OrderStatus;
  statusDate: string;
  paymentMethod: string;
  customer: { name: string; email: string };
  items: OrderDetailItem[];
  priceSummary: {
    subtotal: number;
    discount: number;
    delivery: number;
    total: number;
  };
  deliveryAddress?: {
    name: string;
    line1: string;
    cityPin: string;
  };
  accessDetails?: {
    validTill: string;
    daysRemaining: number;
    platforms: Array<"mobile" | "web">;
    lastAccessed?: string;
  };
  invoice?: {
    number: string;
    date: string;
  };
  cancelReason?: string;
  isReturnEligible?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIGITAL_KINDS: ProductKind[] = [
  "course",
  "live-class",
  "recording",
  "test-series",
  "pyq",
];

function isDigital(order: OrderDetail) {
  return order.items.every((it) => DIGITAL_KINDS.includes(it.kind));
}

function kindColor(kind: ProductKind): string {
  switch (kind) {
    case "course": return "var(--primary-300)";
    case "live-class": return "var(--error-500)";
    case "recording": return "var(--primary-400)";
    case "test-series": return "var(--success-500)";
    case "pyq": return "var(--success-500)";
    case "book": return "var(--warning)";
    case "kit": return "var(--warning)";
    case "device": return "#ffa940";
  }
}

function kindLabel(kind: ProductKind): string {
  switch (kind) {
    case "course": return "Course";
    case "live-class": return "Live Class";
    case "recording": return "Recording";
    case "test-series": return "Test Series";
    case "pyq": return "PYQs";
    case "book": return "Book";
    case "kit": return "Kit";
    case "device": return "Device";
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
  }
}

function gstRateForKind(kind: ProductKind): number {
  if (DIGITAL_KINDS.includes(kind)) return 0.18;
  if (kind === "book") return 0;
  if (kind === "device") return 0.18;
  return 0.12;
}

function hsnForKind(kind: ProductKind): string {
  if (DIGITAL_KINDS.includes(kind)) return "9992";
  if (kind === "book") return "4901";
  if (kind === "device") return "8471";
  return "4820";
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────
// TODO(api): GET /api/orders/:orderId
const DUMMY_DIGITAL_ORDER: OrderDetail = {
  orderId: "PM2024041001",
  status: "Active",
  statusDate: "15 Apr 2026",
  paymentMethod: "UPI",
  customer: { name: "Sagar Prabhu", email: "sagar@teachmint.com" },
  items: [
    {
      id: "item-1",
      title: "JEE Main 2027 — 12-Month Complete Course",
      kind: "course",
      qty: 1,
      price: 2999,
    },
  ],
  priceSummary: {
    subtotal: 3499,
    discount: 500,
    delivery: 0,
    total: 2999,
  },
  accessDetails: {
    validTill: "15 Apr 2027",
    daysRemaining: 357,
    platforms: ["mobile", "web"],
    lastAccessed: "Today, 9:45 AM",
  },
  invoice: { number: "INV-PM2024041001", date: "15 Apr 2026" },
};

// TODO(api): GET /api/orders/:orderId
const DUMMY_PHYSICAL_ORDER: OrderDetail = {
  orderId: "PM2024031234",
  status: "Delivered",
  statusDate: "18 Apr 2026",
  paymentMethod: "UPI",
  customer: { name: "Sagar Prabhu", email: "sagar@teachmint.com" },
  items: [
    {
      id: "item-1",
      title: "JEE Main 2027 — 12-Month Complete Course",
      kind: "course",
      qty: 1,
      price: 2999,
      thumbImage:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=112&h=112&fit=crop&q=80",
    },
    {
      id: "item-2",
      title: "HC Verma Physics Vol 1 & 2",
      kind: "book",
      qty: 1,
      price: 500,
      thumbImage:
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=112&h=112&fit=crop&q=80",
    },
  ],
  priceSummary: {
    subtotal: 4199,
    discount: 700,
    delivery: 0,
    total: 3499,
  },
  deliveryAddress: {
    name: "Sagar Prabhu",
    line1: "404, Green Valley Apts, Sector 12",
    cityPin: "Bengaluru — 560 001",
  },
  invoice: { number: "INV-PM2024031234", date: "18 Apr 2026" },
  isReturnEligible: true,
};

// TODO(api): GET /api/orders/:orderId/tracking
const DUMMY_PHYSICAL_TIMELINE: TimelineStep[] = [
  { id: "s1", label: "Order Placed", datetime: "15 Apr, 10:32 AM", completed: true, Icon: Package },
  { id: "s2", label: "Confirmed", sublabel: "Seller confirmed your order", datetime: "15 Apr, 11:00 AM", completed: true, Icon: CheckCircle2 },
  { id: "s3", label: "Shipped", sublabel: "Tracking: BD12345678IN", datetime: "16 Apr, 2:15 PM", completed: true, Icon: Truck },
  { id: "s4", label: "Delivered", sublabel: "Delivered to your address", datetime: "18 Apr, 11:45 AM", completed: true, Icon: MapPin },
];

// TODO(api): GET /api/orders/:orderId/activation
const DUMMY_ACTIVATION_TIMELINE: TimelineStep[] = [
  {
    id: "s1",
    label: "Payment Confirmed",
    sublabel: "Paid via UPI · ₹2,999",
    datetime: "15 Apr, 10:32 AM",
    completed: true,
    Icon: Receipt,
  },
  {
    id: "s2",
    label: "Access Activated",
    sublabel: "Your course is ready to start",
    datetime: "15 Apr, 10:35 AM",
    completed: true,
    Icon: KeyRound,
  },
  {
    id: "s3",
    label: "Access Expires",
    sublabel: "357 days remaining",
    datetime: "15 Apr 2027",
    completed: false,
    isFuture: true,
    Icon: CalendarCheck,
  },
];

// TODO(api): GET /api/orders/:orderId (active Primebook device order)
const DUMMY_DEVICE_ACTIVE: OrderDetail = {
  orderId: "PM2024050801",
  status: "Active",
  statusDate: "10 May 2026",
  paymentMethod: "UPI",
  customer: { name: "Sagar Prabhu", email: "sagar@teachmint.com" },
  items: [
    {
      id: "item-1",
      title: "Primebook 2 Pro — 14\" · 6GB · 128GB",
      kind: "device",
      qty: 1,
      price: 19990,
      thumbImage: "/primebook-pro.png",
    },
  ],
  priceSummary: {
    subtotal: 29990,
    discount: 10000,
    delivery: 0,
    total: 19990,
  },
  deliveryAddress: {
    name: "Sagar Prabhu",
    line1: "404, Green Valley Apts, Sector 12",
    cityPin: "Bengaluru — 560 001",
  },
  invoice: { number: "INV-PM2024050801", date: "10 May 2026" },
};

// TODO(api): GET /api/orders/:orderId (delivered Primebook eligible for return)
const DUMMY_DEVICE_DELIVERED: OrderDetail = {
  orderId: "PM2024020114",
  status: "Delivered",
  statusDate: "10 Feb 2026",
  paymentMethod: "Credit Card",
  customer: { name: "Sagar Prabhu", email: "sagar@teachmint.com" },
  items: [
    {
      id: "item-1",
      title: "Primebook 2 Neo — 11.6\" · 4GB · 64GB",
      kind: "device",
      qty: 1,
      price: 15990,
      thumbImage: "/primebook-neo.png",
    },
  ],
  priceSummary: {
    subtotal: 22990,
    discount: 7000,
    delivery: 0,
    total: 15990,
  },
  deliveryAddress: {
    name: "Sagar Prabhu",
    line1: "404, Green Valley Apts, Sector 12",
    cityPin: "Bengaluru — 560 001",
  },
  invoice: { number: "INV-PM2024020114", date: "10 Feb 2026" },
  isReturnEligible: true,
};

// TODO(api): GET /api/orders/:orderId/tracking (device shipment)
const DUMMY_DEVICE_TIMELINE: TimelineStep[] = [
  { id: "s1", label: "Order Placed", sublabel: "Payment confirmed via UPI", datetime: "10 May, 09:14 AM", completed: true, Icon: Receipt },
  { id: "s2", label: "Packed by Primebook", sublabel: "Sealed factory box · Bengaluru warehouse", datetime: "10 May, 06:30 PM", completed: true, Icon: Package },
  { id: "s3", label: "Out for Delivery", sublabel: "Bluedart · AWB BD78934512IN", datetime: "13 May, 08:00 AM", completed: false, Icon: Truck },
  { id: "s4", label: "Expected Delivery", sublabel: "By 7 PM today", datetime: "13 May 2026", completed: false, isFuture: true, Icon: MapPin },
];

// TODO(api): GET /api/orders/:orderId (active Test Series order)
const DUMMY_TEST_SERIES_ORDER: OrderDetail = {
  orderId: "PM2024051201",
  status: "Active",
  statusDate: "12 May 2026",
  paymentMethod: "UPI",
  customer: { name: "Sagar Prabhu", email: "sagar@teachmint.com" },
  items: [
    {
      id: "item-1",
      title: "JEE Main Mock Series 2026 — Standard (30 Tests)",
      kind: "test-series",
      qty: 1,
      price: 599,
    },
  ],
  priceSummary: {
    subtotal: 999,
    discount: 400,
    delivery: 0,
    total: 599,
  },
  accessDetails: {
    validTill: "12 May 2027",
    daysRemaining: 364,
    platforms: ["mobile", "web"],
    lastAccessed: "Today, 8:12 PM",
  },
  invoice: { number: "INV-PM2024051201", date: "12 May 2026" },
};

const ORDER_MAP: Record<string, OrderDetail> = {
  PM2024041001: DUMMY_DIGITAL_ORDER,
  PM2024031234: DUMMY_PHYSICAL_ORDER,
  PM2024050801: DUMMY_DEVICE_ACTIVE,
  PM2024020114: DUMMY_DEVICE_DELIVERED,
  PM2024051201: DUMMY_TEST_SERIES_ORDER,
};

const TIMELINE_MAP: Record<string, TimelineStep[]> = {
  PM2024050801: DUMMY_DEVICE_TIMELINE,
};

function hasDevice(order: OrderDetail) {
  return order.items.some((it) => it.kind === "device");
}

// ─── Hero Status ──────────────────────────────────────────────────────────────
function HeroStatus({ order }: { order: OrderDetail }) {
  const digital = isDigital(order);

  const cfg: Record<OrderStatus, { color: string; label: string; Icon: typeof CheckCircle2; sub: string }> = {
    Active: {
      color: "var(--primary-300)",
      label: digital ? "Access Active" : "Order in Transit",
      Icon: digital ? KeyRound : Truck,
      sub: digital ? "Your course is ready to learn" : "On the way to you",
    },
    Delivered: {
      color: "var(--success-500)",
      label: digital ? "Access Granted" : "Delivered",
      Icon: CheckCircle2,
      sub: digital ? "Full access available on all devices" : `Delivered on ${order.statusDate}`,
    },
    Cancelled: {
      color: "var(--error-500)",
      label: "Order Cancelled",
      Icon: XCircle,
      sub: order.cancelReason ?? "This order was cancelled",
    },
    Returned: {
      color: "var(--warning-500)",
      label: "Return in Progress",
      Icon: RotateCcw,
      sub: "Pickup arranged · Refund within 10 business days",
    },
  };

  const { color, label, Icon, sub } = cfg[order.status];

  return (
    <div
      style={{
        padding: "16px 20px",
        backgroundColor: "var(--card)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-start justify-between" style={{ gap: 12 }}>
        <div className="flex items-start" style={{ gap: 12 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
              border: `1.5px solid color-mix(in srgb, ${color} 32%, transparent)`,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <Icon style={{ width: 18, height: 18, color, strokeWidth: 2 }} aria-hidden />
          </div>
          <div className="flex flex-col" style={{ gap: 2 }}>
            <span
              style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--font-weight-bold)",
                color,
              }}
            >
              {label}
            </span>
            <span style={{ ...typo.metaStyle }}>{sub}</span>
          </div>
        </div>
        <div className="flex flex-col items-end" style={{ gap: 2, flexShrink: 0 }}>
          <span style={{ ...typo.metaStyle }}>Order</span>
          <span
            style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--foreground)",
              letterSpacing: 0,
            }}
          >
            #{order.orderId}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Action Bar ─────────────────────────────────────────────────────────
function QuickActionBar({ order }: { order: OrderDetail }) {
  const navigate = useNavigate();
  const digital = isDigital(order);
  if (order.status === "Cancelled") return null;
  // Physical orders show their shipping timeline inline on this screen, so a
  // sticky "Track Shipment" action would be both redundant and (previously) a
  // dead no-op. Only digital orders get a sticky primary action.
  if (!digital) return null;

  // Test-series orders deep-link to the user's pack detail (where they actually
  // attempt mocks). Other digital → "Continue Learning" → learning path.
  const testSeriesItem = order.items.find((it) => it.kind === "test-series");
  const isTestSeries = !!testSeriesItem;
  const packId = (() => {
    if (!isTestSeries) return undefined;
    // Order item titles encode the pack: derive packId from the title prefix.
    // For now, the seeded test-series order uses the JEE Main Mock Series pack.
    if (testSeriesItem!.title.includes("JEE Main")) return "mt-jee-main";
    if (testSeriesItem!.title.includes("NEET")) return "mt-neet-ug";
    return undefined;
  })();

  const label = isTestSeries ? "Open Test Series" : "Continue Learning";
  const Icon = PlayCircle;

  return (
    <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 16 }}>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          // Test series → pack detail (fall back to Classes, where the My Test
          // Series rail lives, if the pack can't be resolved). Other digital →
          // back to the order itself. No branch is a no-op.
          if (isTestSeries) navigate(packId ? `/my-test-series/${packId}` : "/classes");
          else navigate("/marketplace/orders");
        }}
        className="flex items-center justify-center w-full"
        style={{
          height: 48,
          borderRadius: 12,
          background: "linear-gradient(180deg, var(--primary-400) 0%, var(--primary) 100%)",
          border: "none",
          gap: 8,
          cursor: "pointer",
          boxShadow: "0 4px 12px color-mix(in srgb, var(--primary) 30%, transparent)",
        }}
      >
        <Icon style={{ width: 18, height: 18, color: "var(--white)", strokeWidth: 2 }} aria-hidden />
        <span
          style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--white)",
          }}
        >
          {label}
        </span>
      </motion.button>
    </div>
  );
}

// ─── Timeline List ────────────────────────────────────────────────────────────
function TimelineList({
  steps,
  accentColor,
}: {
  steps: TimelineStep[];
  accentColor: string;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 0 }}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const dotBg = step.completed
          ? accentColor
          : step.isFuture
          ? "transparent"
          : "var(--card)";
        const dotBorder = step.completed
          ? "none"
          : `2px solid color-mix(in srgb, var(--border) 80%, transparent)`;
        const lineColor = step.completed ? accentColor : "var(--border)";

        return (
          <div key={step.id} className="flex" style={{ gap: 12 }}>
            <div className="flex flex-col items-center" style={{ width: 28, flexShrink: 0 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.08, type: "spring", stiffness: 300, damping: 22 }}
                className="flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9999,
                  backgroundColor: dotBg,
                  border: dotBorder,
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                <step.Icon
                  style={{
                    width: 13,
                    height: 13,
                    color: step.completed ? "var(--white)" : "var(--muted-foreground)",
                    strokeWidth: 2,
                  }}
                  aria-hidden
                />
              </motion.div>
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 24,
                    backgroundColor: lineColor,
                    margin: "4px 0",
                    borderRadius: 1,
                  }}
                />
              )}
            </div>

            <div
              className="flex flex-col"
              style={{ gap: 2, paddingBottom: isLast ? 0 : 20, paddingTop: 4 }}
            >
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: step.completed
                    ? "var(--font-weight-semibold)"
                    : "var(--font-weight-normal)",
                  color: step.completed ? "var(--foreground)" : "var(--muted-foreground)",
                }}
              >
                {step.label}
              </span>
              {step.sublabel && (
                <span style={{ ...typo.metaStyle }}>{step.sublabel}</span>
              )}
              <div className="flex items-center" style={{ gap: 4, marginTop: 2 }}>
                <Clock
                  style={{ width: 10, height: 10, color: "var(--muted-foreground)", strokeWidth: 1.5 }}
                />
                <span style={{ ...typo.metaStyle, fontSize: "var(--text-2xs)" }}>
                  {step.datetime}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Activation Timeline ──────────────────────────────────────────────────────
function ActivationTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <Card style={{ padding: 16, border: "none" }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
        <KeyRound
          style={{ width: 15, height: 15, color: "var(--primary-300)", strokeWidth: 2, flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}
        >
          Activation
        </span>
      </div>
      <TimelineList steps={steps} accentColor="var(--primary-300)" />
    </Card>
  );
}

// ─── Delivery Timeline ────────────────────────────────────────────────────────
function DeliveryTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <Card style={{ padding: 16, border: "none" }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
        <Truck
          style={{ width: 15, height: 15, color: "var(--success-500)", strokeWidth: 2, flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}
        >
          Delivery Tracking
        </span>
      </div>
      <TimelineList steps={steps} accentColor="var(--success-500)" />
    </Card>
  );
}

// ─── Access Details ───────────────────────────────────────────────────────────
function AccessDetails({
  details,
}: {
  details: NonNullable<OrderDetail["accessDetails"]>;
}) {
  const usedDays = 365 - details.daysRemaining;
  const progressPct = Math.min(100, Math.round((usedDays / 365) * 100));

  return (
    <Card style={{ padding: 16, border: "none" }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
        <KeyRound
          style={{ width: 15, height: 15, color: "var(--primary-300)", strokeWidth: 2, flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}
        >
          Access Details
        </span>
      </div>

      <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
        <div className="flex flex-col" style={{ gap: 2 }}>
          <span style={{ ...typo.metaStyle }}>Valid till</span>
          <span
            style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--foreground)",
            }}
          >
            {details.validTill}
          </span>
          <span style={{ ...typo.metaStyle }}>{details.daysRemaining} days remaining</span>
        </div>
      </div>

      <div
        style={{
          height: 4,
          borderRadius: 9999,
          backgroundColor: "var(--border)",
          marginBottom: 16,
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            height: "100%",
            borderRadius: 9999,
            background: "linear-gradient(90deg, var(--primary) 0%, var(--primary-300) 100%)",
          }}
        />
      </div>

      <div style={{ marginBottom: details.lastAccessed ? 12 : 0 }}>
        <span style={{ ...typo.metaStyle, display: "block", marginBottom: 4 }}>Access on</span>
        <span style={{ ...typo.metaStyle }}>
          {details.platforms.map((p) => (p === "mobile" ? "Mobile App" : "Web")).join(" · ")}
        </span>
      </div>

      {details.lastAccessed && (
        <div className="flex items-center" style={{ gap: 6, marginTop: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: "var(--success-500)", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)" }}>
            Last accessed <span style={{ color: "var(--foreground)" }}>{details.lastAccessed}</span>
          </span>
        </div>
      )}
    </Card>
  );
}

// ─── Delivery Address ─────────────────────────────────────────────────────────
function DeliveryAddress({
  address,
}: {
  address: NonNullable<OrderDetail["deliveryAddress"]>;
}) {
  return (
    <Card style={{ padding: 16, border: "none" }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}>
        <MapPin
          style={{ width: 15, height: 15, color: "var(--primary-300)", strokeWidth: 2, flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}
        >
          Delivery Address
        </span>
      </div>
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--foreground)",
          display: "block",
          marginBottom: 4,
        }}
      >
        {address.name}
      </span>
      <span style={{ ...typo.metaStyle, display: "block" }}>{address.line1}</span>
      <span style={{ ...typo.metaStyle, display: "block", marginTop: 2 }}>{address.cityPin}</span>
    </Card>
  );
}

// ─── Items Card ───────────────────────────────────────────────────────────────
function ItemsCard({ order }: { order: OrderDetail }) {
  return (
    <Card style={{ padding: 16, border: "none" }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}>
        <Package
          style={{ width: 15, height: 15, color: "var(--muted-foreground)", strokeWidth: 2, flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}
        >
          Items ({order.items.length})
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: 0 }}>
        {order.items.map((item, idx) => {
          const Icon = kindIcon(item.kind);
          const color = kindColor(item.kind);
          return (
            <div key={item.id}>
              <div className="flex" style={{ gap: 12 }}>
                {item.thumbImage ? (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.thumbImage}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      flexShrink: 0,
                      backgroundColor: `color-mix(in srgb, ${color} 14%, var(--card))`,
                    }}
                  >
                    <Icon style={{ width: 24, height: 24, color, strokeWidth: 1.75 }} aria-hidden />
                  </div>
                )}

                <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-family-inter)",
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-weight-medium)",
                      color: "var(--foreground)",
                      lineHeight: 1.4,
                    }}
                  >
                    {item.title}
                  </span>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-2xs)",
                        fontWeight: "var(--font-weight-semibold)",
                        color,
                      }}
                    >
                      {kindLabel(item.kind)}
                    </span>
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 9999,
                        backgroundColor: "var(--border)",
                      }}
                    />
                    <span style={{ ...typo.metaStyle }}>Qty: {item.qty}</span>
                  </div>
                </div>

                <span
                  style={{
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)",
                    flexShrink: 0,
                    paddingTop: 4,
                  }}
                >
                  ₹{item.price.toLocaleString("en-IN")}
                </span>
              </div>
              {idx < order.items.length - 1 && (
                <div style={{ height: 1, backgroundColor: "var(--border)", margin: "14px 0" }} />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Price Summary ────────────────────────────────────────────────────────────
function PriceSummary({ order, onOpenInvoice }: { order: OrderDetail; onOpenInvoice?: () => void }) {
  const digital = isDigital(order);
  const gstRate = digital ? 0.18 : 0;
  const taxableAmount = gstRate > 0 ? Math.round(order.priceSummary.total / (1 + gstRate)) : order.priceSummary.total;
  const cgst = gstRate > 0 ? Math.round((order.priceSummary.total - taxableAmount) / 2) : 0;
  const sgst = cgst;

  return (
    <Card style={{ padding: 16, border: "none" }}>
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--foreground)",
          display: "block",
          marginBottom: 12,
        }}
      >
        Price Breakdown
      </span>

      <div className="flex flex-col" style={{ gap: 10 }}>
        <div className="flex items-center justify-between">
          <span style={{ ...typo.cardBodyStyle }}>Subtotal (MRP)</span>
          <span style={{ ...typo.cardBodyStyle }}>
            ₹{order.priceSummary.subtotal.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ ...typo.cardBodyStyle, color: "var(--success-500)" }}>Discount</span>
          <span
            style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: "var(--success-500)",
            }}
          >
            −₹{order.priceSummary.discount.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ ...typo.cardBodyStyle }}>Delivery</span>
          <span
            style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: "var(--success-500)",
            }}
          >
            FREE
          </span>
        </div>

        {gstRate > 0 && (
          <>
            <div style={{ height: 1, backgroundColor: "var(--border)", marginTop: 2, marginBottom: 2 }} />
            <div className="flex items-center justify-between">
              <span style={{ ...typo.metaStyle }}>Taxable amount</span>
              <span style={{ ...typo.metaStyle }}>₹{taxableAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ ...typo.metaStyle }}>CGST (9%)</span>
              <span style={{ ...typo.metaStyle }}>₹{cgst.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ ...typo.metaStyle }}>SGST (9%)</span>
              <span style={{ ...typo.metaStyle }}>₹{sgst.toLocaleString("en-IN")}</span>
            </div>
          </>
        )}

        <div style={{ height: 1, backgroundColor: "var(--border)", marginTop: 2, marginBottom: 2 }} />

        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--foreground)",
            }}
          >
            Total Paid
          </span>
          <span
            style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--foreground)",
              letterSpacing: 0,
            }}
          >
            ₹{order.priceSummary.total.toLocaleString("en-IN")}
          </span>
        </div>

        {gstRate > 0 && (
          <span style={{ ...typo.metaStyle }}>
            Inclusive of all applicable taxes
          </span>
        )}

        <div style={{ height: 1, backgroundColor: "var(--border)", marginTop: 8, marginBottom: 12 }} />
        <div className="flex items-center justify-between">
          <span style={{ ...typo.metaStyle }}>Paid via {order.paymentMethod}</span>
          {order.invoice && onOpenInvoice && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onOpenInvoice}
              className="flex items-center"
              style={{ background: "none", border: "none", cursor: "pointer", gap: 4 }}
            >
              <Receipt style={{ width: 12, height: 12, color: "var(--primary-600)", strokeWidth: 2 }} />
              <span style={{ ...typo.ctaStyle }}>View Invoice</span>
            </motion.button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Invoice Modal ────────────────────────────────────────────────────────────
function InvoiceModal({
  order,
  invoice,
  onClose,
}: {
  order: OrderDetail;
  invoice: NonNullable<OrderDetail["invoice"]>;
  onClose: () => void;
}) {
  type InvoiceLineItem = {
    description: string;
    hsn: string;
    qty: number;
    rate: number;
    gstRate: number;
    taxable: number;
    cgst: number;
    sgst: number;
    amount: number;
  };

  const lineItems: InvoiceLineItem[] = order.items.map((item) => {
    const rate = item.price;
    const gstRate = gstRateForKind(item.kind);
    const taxable = gstRate > 0 ? Math.round(rate / (1 + gstRate)) : rate;
    const gstAmount = rate - taxable;
    const cgst = Math.round(gstAmount / 2);
    const sgst = gstAmount - cgst;
    return {
      description: item.title,
      hsn: hsnForKind(item.kind),
      qty: item.qty,
      rate: taxable,
      gstRate,
      taxable,
      cgst,
      sgst,
      amount: rate,
    };
  });

  const totalTaxable = lineItems.reduce((s, l) => s + l.taxable, 0);
  const totalCgst = lineItems.reduce((s, l) => s + l.cgst, 0);
  const totalSgst = lineItems.reduce((s, l) => s + l.sgst, 0);
  const totalPaid = order.priceSummary.total;

  return (
    <motion.div
      key="invoice-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "color-mix(in srgb, var(--background) 70%, transparent)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <motion.div
        key="invoice-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "96%",
          backgroundColor: "var(--background)",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Sheet header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            height: 56,
            paddingLeft: 20,
            paddingRight: 20,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <Receipt
              style={{ width: 16, height: 16, color: "var(--primary-300)", strokeWidth: 2 }}
            />
            <span
              style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--foreground)",
              }}
            >
              Tax Invoice
            </span>
          </div>
          <div className="flex items-center" style={{ gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              aria-label="Share invoice"
              style={{
                width: 36,
                height: 36,
                borderRadius: 9999,
                backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Share2 style={{ width: 15, height: 15, color: "var(--muted-foreground)", strokeWidth: 2 }} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              aria-label="Close invoice"
              style={{
                width: 36,
                height: 36,
                borderRadius: 9999,
                backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X style={{ width: 15, height: 15, color: "var(--muted-foreground)", strokeWidth: 2 }} />
            </motion.button>
          </div>
        </div>

        {/* Invoice content */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "20px 20px 40px" }}
        >
          {/* Company header */}
          <div style={{ marginBottom: 20 }}>
            <span
              style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--foreground)",
                display: "block",
                marginBottom: 4,
              }}
            >
              PrepMaster EdTech Pvt. Ltd.
            </span>
            <span style={{ ...typo.metaStyle, display: "block" }}>
              #101, 1st Floor, Koramangala
            </span>
            <span style={{ ...typo.metaStyle, display: "block" }}>
              Bengaluru — 560 034, Karnataka
            </span>
            <span style={{ ...typo.metaStyle, display: "block", marginTop: 8 }}>
              GSTIN: 29AABCP1234A1Z5
            </span>
            <span style={{ ...typo.metaStyle, display: "block" }}>
              CIN: U80904KA2021PTC001234
            </span>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--border)", marginBottom: 20 }} />

          {/* Invoice meta + bill-to */}
          <div className="flex items-start justify-between" style={{ marginBottom: 20, gap: 16 }}>
            <div className="flex flex-col" style={{ gap: 4 }}>
              <span style={{ ...typo.metaStyle }}>Invoice No.</span>
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--foreground)",
                  letterSpacing: 0,
                }}
              >
                {invoice.number}
              </span>
              <span style={{ ...typo.metaStyle, marginTop: 8 }}>Invoice Date</span>
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--foreground)",
                }}
              >
                {invoice.date}
              </span>
            </div>
            <div className="flex flex-col items-end" style={{ gap: 4 }}>
              <span style={{ ...typo.metaStyle }}>Bill To</span>
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--foreground)",
                  textAlign: "right",
                }}
              >
                {order.customer.name}
              </span>
              <span style={{ ...typo.metaStyle, textAlign: "right" }}>
                {order.customer.email}
              </span>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--border)", marginBottom: 16 }} />

          {/* Items table header */}
          <div
            className="flex items-center"
            style={{
              paddingBottom: 8,
              borderBottom: "1px solid var(--border)",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                flex: 1,
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-2xs)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: 0,
              }}
            >
              Description
            </span>
            <span
              style={{
                width: 36,
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-2xs)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: 0,
                textAlign: "right",
              }}
            >
              HSN
            </span>
            <span
              style={{
                width: 40,
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-2xs)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: 0,
                textAlign: "right",
              }}
            >
              GST
            </span>
            <span
              style={{
                width: 64,
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-2xs)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: 0,
                textAlign: "right",
              }}
            >
              Amount
            </span>
          </div>

          {/* Items rows */}
          {lineItems.map((li, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <div className="flex items-start" style={{ gap: 4 }}>
                <span
                  style={{
                    flex: 1,
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-weight-medium)",
                    color: "var(--foreground)",
                    lineHeight: 1.4,
                  }}
                >
                  {li.description}
                </span>
                <span
                  style={{
                    width: 36,
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-xs)",
                    color: "var(--muted-foreground)",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {li.hsn}
                </span>
                <span
                  style={{
                    width: 40,
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-xs)",
                    color: "var(--muted-foreground)",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {li.gstRate > 0 ? `${li.gstRate * 100}%` : "Nil"}
                </span>
                <span
                  style={{
                    width: 64,
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  ₹{li.amount.toLocaleString("en-IN")}
                </span>
              </div>
              {li.gstRate > 0 && (
                <div
                  className="flex"
                  style={{ marginTop: 4, paddingLeft: 0, gap: 4 }}
                >
                  <span style={{ flex: 1 }} />
                  <span
                    style={{
                      fontFamily: "var(--font-family-inter)",
                      fontSize: "var(--text-2xs)",
                      color: "var(--muted-foreground)",
                      width: 140,
                      flexShrink: 0,
                      textAlign: "right",
                    }}
                  >
                    Taxable ₹{li.taxable.toLocaleString("en-IN")} · CGST ₹{li.cgst} · SGST ₹{li.sgst}
                  </span>
                </div>
              )}
            </div>
          ))}

          <div style={{ height: 1, backgroundColor: "var(--border)", marginBottom: 12 }} />

          {/* Tax summary */}
          <div className="flex flex-col" style={{ gap: 8, marginBottom: 16 }}>
            <div className="flex items-center justify-between">
              <span style={{ ...typo.metaStyle }}>Taxable Amount</span>
              <span style={{ ...typo.metaStyle }}>₹{totalTaxable.toLocaleString("en-IN")}</span>
            </div>
            {totalCgst > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span style={{ ...typo.metaStyle }}>CGST (9%)</span>
                  <span style={{ ...typo.metaStyle }}>₹{totalCgst.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ ...typo.metaStyle }}>SGST (9%)</span>
                  <span style={{ ...typo.metaStyle }}>₹{totalSgst.toLocaleString("en-IN")}</span>
                </div>
              </>
            )}
            {/* No discount line on the tax invoice: line-item amounts are the
                net (post-discount) price actually charged, so they already sum
                to Total Paid. Showing a separate −Discount line here implied a
                deduction that was never reflected in the total (double-count). */}
            <div style={{ height: 1, backgroundColor: "var(--border)" }} />
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--foreground)",
                }}
              >
                Total Paid
              </span>
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--foreground)",
                  letterSpacing: 0,
                }}
              >
                ₹{totalPaid.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--border)", marginBottom: 20 }} />

          {/* Footer */}
          <span
            style={{
              ...typo.metaStyle,
              display: "block",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            This is a computer generated invoice and does not require a physical signature.
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Rate & Review ────────────────────────────────────────────────────────────
function RateReview({
  submitted,
  onSubmit,
}: {
  submitted: boolean;
  onSubmit: (rating: number, review: string) => void;
}) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");

  if (submitted) {
    return (
      <Card style={{ padding: 16, border: "none" }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              backgroundColor: "color-mix(in srgb, var(--success-500) 14%, transparent)",
              flexShrink: 0,
            }}
          >
            <CheckCircle2
              style={{ width: 18, height: 18, color: "var(--success-500)", strokeWidth: 2 }}
            />
          </div>
          <div className="flex flex-col" style={{ gap: 2 }}>
            <span
              style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--foreground)",
              }}
            >
              Review submitted
            </span>
            <span style={{ ...typo.metaStyle }}>Thank you for your feedback</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 16, border: "none" }}>
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--foreground)",
          display: "block",
          marginBottom: 12,
        }}
      >
        Rate your purchase
      </span>

      <div className="flex" style={{ gap: 4, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= (hovered || stars);
          return (
            <motion.button
              key={n}
              whileTap={{ scale: 0.85 }}
              onClick={() => setStars(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`Rate ${n} star${n !== 1 ? "s" : ""}`}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Star
                style={{
                  width: 28,
                  height: 28,
                  color: filled ? "var(--warning)" : "var(--border)",
                  strokeWidth: 1.5,
                  fill: filled ? "var(--warning)" : "transparent",
                }}
              />
            </motion.button>
          );
        })}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your experience (optional)"
        rows={3}
        style={{
          width: "100%",
          backgroundColor: "var(--card-dark)",
          border: "1.5px solid var(--border)",
          borderRadius: 8,
          padding: "8px 12px",
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-sm)",
          color: "var(--foreground)",
          resize: "none",
          outline: "none",
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => stars > 0 && onSubmit(stars, text)}
        disabled={stars === 0}
        className="w-full flex items-center justify-center"
        style={{
          height: 48,
          borderRadius: "var(--radius-button)",
          background: stars > 0 ? "var(--gradient-primary-btn)" : "var(--card-dark)",
          boxShadow: stars > 0 ? "var(--glow-primary)" : "none",
          border: "none",
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-semibold)",
          color: stars > 0 ? "var(--white)" : "var(--muted-foreground)",
          cursor: stars > 0 ? "pointer" : "not-allowed",
          transition: "background 0.2s, box-shadow 0.2s",
        }}
      >
        Submit Review
      </motion.button>
    </Card>
  );
}

// ─── Secondary Actions ────────────────────────────────────────────────────────
function SecondaryActions({ order, digital }: { order: OrderDetail; digital: boolean }) {
  const navigate = useNavigate();
  const showCancel = order.status === "Active" && !digital;
  const showReturn = order.status === "Delivered" && !digital && order.isReturnEligible;

  return (
    <div className="flex flex-col items-center" style={{ gap: 12, paddingTop: 4, paddingBottom: 4 }}>
      {showCancel && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-medium)",
            color: "var(--error-500)",
          }}
        >
          Cancel Order
        </motion.button>
      )}
      {showReturn && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/marketplace/return", { state: { orderId: order.orderId } })}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-medium)",
            color: "var(--warning)",
          }}
        >
          Request Return / Replacement
        </motion.button>
      )}
      <a
        href="tel:+918001234567"
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--font-weight-medium)",
          color: "var(--muted-foreground)",
          textDecoration: "none",
        }}
      >
        Contact Support
      </a>
    </div>
  );
}

// ─── Warranty & Support (device-specific) ─────────────────────────────────────
function DeviceWarrantyCard({ order }: { order: OrderDetail }) {
  const deviceItem = order.items.find((it) => it.kind === "device");
  if (!deviceItem) return null;
  return (
    <Card style={{ padding: 16, border: "none" }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}>
        <ShieldCheck
          style={{ width: 15, height: 15, color: "var(--success-500)", strokeWidth: 2, flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}
        >
          Warranty & Support
        </span>
      </div>
      <div className="flex flex-col" style={{ gap: 10 }}>
        <div className="flex items-start" style={{ gap: 10 }}>
          <ShieldCheck style={{ width: 14, height: 14, color: "var(--muted-foreground)", marginTop: 2, flexShrink: 0 }} />
          <div className="flex flex-col" style={{ gap: 2 }}>
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)" }}>
              12-month manufacturer warranty
            </span>
            <span style={{ ...typo.metaStyle }}>Doorstep service by Primebook</span>
          </div>
        </div>
        <div className="flex items-start" style={{ gap: 10 }}>
          <RotateCcw style={{ width: 14, height: 14, color: "var(--muted-foreground)", marginTop: 2, flexShrink: 0 }} />
          <div className="flex flex-col" style={{ gap: 2 }}>
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)" }}>
              7-day return window
            </span>
            <span style={{ ...typo.metaStyle }}>Report damage on arrival within 24 hours</span>
          </div>
        </div>
        <div className="flex items-start" style={{ gap: 10 }}>
          <Phone style={{ width: 14, height: 14, color: "var(--muted-foreground)", marginTop: 2, flexShrink: 0 }} />
          <div className="flex flex-col" style={{ gap: 2 }}>
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)" }}>
              Primebook care line
            </span>
            <a href="tel:+919667413981" style={{ ...typo.metaStyle, color: "var(--primary-300)", textDecoration: "none" }}>
              +91 96674 13981
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const location = useLocation();

  // All hooks must run before any conditional return (rules of hooks).
  const [showInvoice, setShowInvoice] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const state = (location.state ?? {}) as { orderId?: string; vocabPackId?: string };
  const orderId: string | undefined = state.orderId;
  const vocabPackId: string | undefined = state.vocabPackId;

  // VocabularyFast partner orders render their own simpler layout below.
  const vocabPack = vocabPackId ? getVocabFastPack(vocabPackId) : null;
  if (vocabPack) {
    return (
      <VocabOrderDetailView
        pack={vocabPack}
        orderId={orderId ?? `PMV-${Date.now().toString().slice(-8)}`}
        onBack={() => navigate(-1)}
        onOpen={() => navigate(`/marketplace/webview/vf-${vocabPack.id.replace("vf-", "")}`)}
      />
    );
  }

  const order = (orderId && ORDER_MAP[orderId]) || DUMMY_DIGITAL_ORDER;
  const digital = isDigital(order);
  const customTimeline = orderId ? TIMELINE_MAP[orderId] : undefined;
  const timeline = customTimeline ?? (digital ? DUMMY_ACTIVATION_TIMELINE : DUMMY_PHYSICAL_TIMELINE);
  const deviceOrder = hasDevice(order);

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
          <span style={{ ...typo.pageTitleStyle }}>Order Details</span>
        </div>
      </div>

      {/* Hero status */}
      <HeroStatus order={order} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick Action */}
        <QuickActionBar order={order} />

        <div className="flex flex-col" style={{ gap: 12, padding: "12px 16px 40px" }}>

          {/* Timeline */}
          {digital ? (
            <ActivationTimeline steps={timeline} />
          ) : (
            <DeliveryTimeline steps={timeline} />
          )}

          {/* Access Details (digital) or Delivery Address (physical) */}
          {digital && order.accessDetails ? (
            <AccessDetails details={order.accessDetails} />
          ) : order.deliveryAddress ? (
            <DeliveryAddress address={order.deliveryAddress} />
          ) : null}

          {/* Items */}
          <ItemsCard order={order} />

          {/* Warranty (device only) */}
          {deviceOrder && <DeviceWarrantyCard order={order} />}

          {/* Price */}
          <PriceSummary order={order} onOpenInvoice={() => setShowInvoice(true)} />

          {/* Rate & Review — delivered only */}
          {order.status === "Delivered" && (
            <RateReview
              submitted={reviewSubmitted}
              onSubmit={() => setReviewSubmitted(true)}
            />
          )}

          {/* Secondary actions */}
          <SecondaryActions order={order} digital={digital} />
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoice && order.invoice && (
          <InvoiceModal
            order={order}
            invoice={order.invoice}
            onClose={() => setShowInvoice(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── VocabOrderDetailView — partner order detail layout ────────────────────
// Simpler than the main physical/digital order layout — vocab is fully
// digital, no shipping, no return window, no review prompt (yet).
// Reuses the same header chrome (back button + "Order Details") for
// consistency with sibling order screens.

interface VocabOrderDetailViewProps {
  pack: VocabFastPack;
  orderId: string;
  onBack: () => void;
  onOpen: () => void;
}

function VocabOrderDetailView({ pack, orderId, onBack, onOpen }: VocabOrderDetailViewProps) {
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
      {/* Header — same chrome as the main order detail */}
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
            onClick={onBack}
            aria-label="Go back"
            style={{
              width: 44, height: 44, borderRadius: 9999,
              backgroundColor: "transparent", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: "var(--foreground)", strokeWidth: 2 }} />
          </motion.button>
          <span style={{ ...typo.pageTitleStyle }}>Order Details</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: 16, paddingBottom: 96 }}>
        {/* Item card */}
        <Card style={{ padding: 16 }}>
          <div className="flex items-start" style={{ gap: 12 }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 56, height: 56, borderRadius: 12,
                backgroundColor: VOCABFAST_BRAND.accentSoft,
                border: `0.5px solid ${VOCABFAST_BRAND.accentBorder}`,
              }}
            >
              <Brain size={24} style={{ color: VOCABFAST_BRAND.accentColor }} />
            </div>
            <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3 }}>
                {pack.title}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                {pack.wordsCount.toLocaleString("en-IN")} words · {pack.audience}
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: VOCABFAST_BRAND.accentColor, fontWeight: 600, marginTop: 2 }}>
                {VOCABFAST_BRAND.partnerLabel}
              </span>
            </div>
          </div>
        </Card>

        {/* Order meta */}
        <div style={{ marginTop: 12 }}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div className="flex items-center justify-between" style={{ padding: "14px 16px" }}>
              <div className="flex flex-col" style={{ gap: 2 }}>
                <span style={{ ...typo.metaStyle }}>Order ID</span>
                <span style={{
                  fontFamily: "monospace",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--primary-300)",
                  letterSpacing: "0.5px",
                }}>
                  #{orderId}
                </span>
              </div>
              <div className="flex items-center" style={{
                gap: 4,
                paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 4,
                backgroundColor: "color-mix(in srgb, var(--success-500) 14%, transparent)",
                border: "1px solid color-mix(in srgb, var(--success-500) 30%, transparent)",
              }}>
                <CheckCircle2 size={10} style={{ color: "var(--success-500)" }} />
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--success-500)", letterSpacing: 0.4 }}>
                  DELIVERED
                </span>
              </div>
            </div>
            <div style={{ height: 0.5, backgroundColor: "var(--border)", margin: "0 16px" }} />
            <div className="flex items-center justify-between" style={{ padding: "14px 16px" }}>
              <span style={{ ...typo.metaStyle }}>Amount paid</span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                ₹{VOCABFAST_PRICING.packPrice.toLocaleString("en-IN")}
              </span>
            </div>
          </Card>
        </div>

        {/* Access note */}
        <div style={{ marginTop: 12 }}>
          <Card style={{ padding: 16 }}>
            <div className="flex items-center" style={{ gap: 12 }}>
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: VOCABFAST_BRAND.accentSoft,
                }}
              >
                <ExternalLink size={18} style={{ color: VOCABFAST_BRAND.accentColor }} />
              </div>
              <div className="flex flex-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
                  Learning on {VOCABFAST_BRAND.hostName}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  Tap below to open your pack — your account is already set up.
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky CTA */}
      <div
        className="shrink-0"
        style={{
          paddingLeft: 16, paddingRight: 16, paddingTop: 12,
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))" as unknown as number,
          backgroundColor: "var(--card)",
          borderTop: "0.5px solid var(--border)",
        }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onOpen}
          className="flex items-center justify-center w-full"
          style={{
            height: 48, borderRadius: 12, gap: 8,
            backgroundColor: VOCABFAST_BRAND.accentColor,
            border: "none", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <ExternalLink size={16} style={{ color: "#fff" }} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "#fff" }}>
            Open {VOCABFAST_BRAND.name}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
