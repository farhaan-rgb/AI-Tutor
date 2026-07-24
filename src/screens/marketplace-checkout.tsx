/**
 * Marketplace Checkout — 2-step checkout flow
 * Step 1: Address  →  Step 2: Payment (with order summary)
 * Route: /marketplace/checkout
 */

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  Check,
  MapPin,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GlassHeader, StatusBar, typo } from "../shared/premium-ui";
import { ProductImageFallback } from "./marketplace-shared";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Address {
  id: string;
  name: string;
  line1: string;
  cityPin: string;
  phone: string;
  tag?: string;
}

type Step = 1 | 2;

interface CartItem {
  id: string;
  title: string;
  qty: number;
  price: number;
  categoryId: string;
}

interface CartSummary {
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
}

function buildDigitalCart(state: Record<string, unknown> | null): { items: CartItem[]; summary: CartSummary } | null {
  // Test-series flow
  if (state?.testSeriesPackId) {
    const price = Number(state.price ?? 0);
    const originalPrice = Number(state.originalPrice ?? price);
    const title = String(state.productTitle ?? "Test Series");
    const plan = state.planLabel ? ` — ${String(state.planLabel)} Pack` : "";
    return {
      items: [{
        id: String(state.testSeriesPackId),
        title: `${title}${plan}`,
        qty: 1,
        price,
        categoryId: "mock-tests",
      }],
      summary: {
        subtotal: originalPrice,
        discount: Math.max(0, originalPrice - price),
        delivery: 0,
        total: price,
      },
    };
  }
  // Olympiad paid-entry flow — same digital-cart shape; order-confirm grants the registration.
  if (state?.source === "olympiad" && state.olympiadPackId) {
    const price = Number(state.price ?? 0);
    const originalPrice = Number(state.originalPrice ?? price);
    const title = String(state.productTitle ?? "Olympiad");
    return {
      items: [{
        id: String(state.olympiadPackId),
        title: `${title} — Olympiad entry`,
        qty: 1,
        price,
        categoryId: "olympiads",
      }],
      summary: {
        subtotal: originalPrice,
        discount: Math.max(0, originalPrice - price),
        delivery: 0,
        total: price,
      },
    };
  }
  // VocabularyFast pack flow — partner integration. Same digital-cart shape.
  if (state?.source === "vocabfast" && state.packId) {
    const price = Number(state.price ?? 499);
    const originalPrice = Number(state.originalPrice ?? 999);
    const title = String(state.packTitle ?? "VocabularyFast Pack");
    return {
      items: [{
        id: String(state.packId),
        title,
        qty: 1,
        price,
        categoryId: "vocab",
      }],
      summary: {
        subtotal: originalPrice,
        discount: Math.max(0, originalPrice - price),
        delivery: 0,
        total: price,
      },
    };
  }
  // Course enrolment flow — digital cart for the selected plan variant.
  if (state?.courseId) {
    const price = Number(state.price ?? 0);
    const originalPrice = Number(state.originalPrice ?? price);
    const title = String(state.productTitle ?? "Course");
    const plan = state.planLabel ? ` — ${String(state.planLabel)}` : "";
    return {
      items: [{
        id: String(state.courseId),
        title: `${title}${plan}`,
        qty: 1,
        price,
        categoryId: "courses",
      }],
      summary: {
        subtotal: originalPrice,
        discount: Math.max(0, originalPrice - price),
        delivery: 0,
        total: price,
      },
    };
  }
  // Physical product Buy-Now flow (devices etc.). Same cart shape; honours qty.
  if (state?.physicalId) {
    const price = Number(state.price ?? 0);
    const originalPrice = Number(state.originalPrice ?? price);
    const title = String(state.productTitle ?? "Product");
    const qty = Math.max(1, Number(state.qty ?? 1));
    return {
      items: [{
        id: String(state.physicalId),
        title,
        qty,
        price,
        categoryId: String(state.categoryId ?? "devices"),
      }],
      summary: {
        subtotal: originalPrice * qty,
        discount: Math.max(0, (originalPrice - price) * qty),
        delivery: 0,
        total: price * qty,
      },
    };
  }
  return null;
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────
// TODO(api): GET /api/user/addresses
const DUMMY_ADDRESSES: Address[] = [
  {
    id: "addr-1",
    name: "Sagar Prabhu",
    line1: "404, Green Valley Apts, Sector 12",
    cityPin: "Bengaluru — 560 001",
    phone: "+91 98765 43210",
    tag: "Home",
  },
  {
    id: "addr-2",
    name: "Sagar Prabhu",
    line1: "12/A, Marol Industrial Estate",
    cityPin: "Mumbai — 400 059",
    phone: "+91 98765 00000",
    tag: "Work",
  },
];

// TODO(api): GET /api/cart/summary
const DUMMY_CART_SUMMARY = {
  subtotal: 36989,
  discount: 13500,
  delivery: 0,
  total: 23489,
};

// TODO(api): GET /api/cart/items
const DUMMY_CART_ITEMS = [
  {
    id: "pb-pro",
    title: "Primebook 2 Pro — 14\" · 6GB · 128GB",
    qty: 1,
    price: 19990,
    categoryId: "devices",
  },
  {
    id: "fd-1",
    title: "JEE Main 2027 — 12-Month Complete Course",
    qty: 1,
    price: 3499,
    categoryId: "courses",
  },
];

// ─── Step bar (2 steps) ───────────────────────────────────────────────────────
function StepBar({ current }: { current: Step }) {
  const steps: { label: string; num: Step }[] = [
    { label: "Address", num: 1 },
    { label: "Payment", num: 2 },
  ];

  return (
    <div className="flex items-center justify-center" style={{ padding: "8px 20px 12px", gap: 0 }}>
      {steps.map((s, idx) => {
        const done = current > s.num;
        const active = current === s.num;
        return (
          <div key={s.num} className="flex items-center" style={{ gap: 0 }}>
            <div className="flex items-center" style={{ gap: 6 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 22, height: 22, borderRadius: 9999,
                  backgroundColor: done ? "var(--success-500)" : active ? "var(--primary)" : "var(--card)",
                  border: done || active ? "none" : "1.5px solid var(--border)",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <Check style={{ width: 12, height: 12, color: "var(--white)", strokeWidth: 2.5 }} />
                ) : (
                  <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: active ? "var(--white)" : "var(--muted-foreground)" }}>
                    {s.num}
                  </span>
                )}
              </div>
              <span style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-sm)",
                fontWeight: active ? "var(--font-weight-semibold)" : "var(--font-weight-normal)",
                color: active ? "var(--foreground)" : done ? "var(--success-500)" : "var(--muted-foreground)",
                whiteSpace: "nowrap",
              }}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ width: 48, height: 1.5, margin: "0 10px", backgroundColor: done ? "var(--success-500)" : "var(--border)", transition: "background-color 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Price rows (shared) ──────────────────────────────────────────────────────
function PriceRows({ summary, isDigital }: { summary: CartSummary; isDigital: boolean }) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <div className="flex items-center justify-between">
        <span style={{ ...typo.cardBodyStyle }}>Subtotal</span>
        <span style={{ ...typo.cardBodyStyle }}>₹{summary.subtotal.toLocaleString("en-IN")}</span>
      </div>
      {summary.discount > 0 && (
        <div className="flex items-center justify-between">
          <span style={{ ...typo.cardBodyStyle, color: "var(--success-500)" }}>Discount</span>
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--success-500)" }}>
            −₹{summary.discount.toLocaleString("en-IN")}
          </span>
        </div>
      )}
      {!isDigital && (
        <div className="flex items-center justify-between">
          <span style={{ ...typo.cardBodyStyle }}>Delivery</span>
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--success-500)" }}>FREE</span>
        </div>
      )}
      <div style={{ height: "0.5px", backgroundColor: "var(--border)", margin: "4px 0" }} />
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>Total</span>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
          ₹{summary.total.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}

// ─── Step 1 — Address ─────────────────────────────────────────────────────────
function StepAddress({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState(DUMMY_ADDRESSES[0].id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLine1, setNewLine1] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const formFields: { label: string; value: string; setter: (v: string) => void; placeholder: string }[] = [
    { label: "Full Name", value: newName, setter: setNewName, placeholder: "Enter your name" },
    { label: "Address", value: newLine1, setter: setNewLine1, placeholder: "House no., Street, Area" },
    { label: "City & Pincode", value: newCity, setter: setNewCity, placeholder: "City — 000 000" },
    { label: "Mobile", value: newPhone, setter: setNewPhone, placeholder: "+91 XXXXX XXXXX" },
  ];

  return (
    <div className="flex flex-col" style={{ padding: "0 16px" }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
        <MapPin style={{ width: 16, height: 16, color: "var(--primary-300)", strokeWidth: 1.5, flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
          Select delivery address
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: 8 }}>
        {DUMMY_ADDRESSES.map((addr) => {
          const isSel = selected === addr.id;
          return (
            <motion.button
              key={addr.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelected(addr.id)}
              className="flex items-start w-full text-left"
              style={{
                gap: 12, padding: 16, borderRadius: 12,
                backgroundColor: isSel ? "color-mix(in srgb, var(--primary) 8%, var(--card))" : "var(--card)",
                border: isSel ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 9999, border: isSel ? "none" : "2px solid var(--border)", backgroundColor: isSel ? "var(--primary)" : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isSel && <div style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "var(--white)" }} />}
              </div>
              <div className="flex flex-col" style={{ gap: 2, flex: 1 }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                    {addr.name}
                  </span>
                  {addr.tag && (
                    <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-medium)", color: "var(--primary-300)", backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", padding: "2px 6px", borderRadius: 4 }}>
                      {addr.tag}
                    </span>
                  )}
                </div>
                <span style={{ ...typo.cardBodyStyle }}>{addr.line1}</span>
                <span style={{ ...typo.metaStyle }}>{addr.cityPin}</span>
                <span style={{ ...typo.metaStyle }}>{addr.phone}</span>
              </div>
            </motion.button>
          );
        })}

        <AnimatePresence mode="wait">
          {!showAddForm ? (
            <motion.button
              key="add-btn"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center w-full"
              style={{ height: 48, borderRadius: 12, border: "1.5px dashed var(--border)", backgroundColor: "transparent", gap: 8, cursor: "pointer" }}
            >
              <Plus style={{ width: 16, height: 16, color: "var(--primary-300)", strokeWidth: 2 }} />
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--primary-300)" }}>
                Add New Address
              </span>
            </motion.button>
          ) : (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ padding: 16, borderRadius: 12, backgroundColor: "var(--card)", border: "1.5px solid var(--border)" }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                  New Address
                </span>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{ background: "none", border: "none", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", cursor: "pointer", padding: 0 }}
                >
                  Cancel
                </button>
              </div>
              <div className="flex flex-col" style={{ gap: 12 }}>
                {formFields.map(({ label, value, setter, placeholder }) => (
                  <div key={label}>
                    <label style={{ display: "block", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", marginBottom: 6 }}>
                      {label}
                    </label>
                    <input
                      type="text" value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      style={{ width: "100%", height: 44, borderRadius: 8, border: "1.5px solid var(--border)", backgroundColor: "var(--background)", paddingLeft: 12, paddingRight: 12, fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--foreground)", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAddForm(false)}
                  className="flex items-center justify-center w-full"
                  style={{ height: 44, borderRadius: 8, backgroundColor: "var(--primary)", border: "none", cursor: "pointer", marginTop: 4 }}
                >
                  <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}>
                    Save Address
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {!showAddForm && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="flex items-center justify-center w-full"
            style={{ height: 52, borderRadius: 12, backgroundColor: "var(--primary)", border: "none", cursor: "pointer", marginTop: 20 }}
          >
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}>
              Deliver Here
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Payment brand logos (inline SVG) ────────────────────────────────────────
// All tiles are 40×40, 8px corner radius. Brand colors are intentional —
// matching live brand identity is the whole point of these icons.

const LogoAmazonPay = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="#FFFFFF"/>
    <text x="20" y="17" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial,Helvetica,sans-serif" fill="#232F3E" letterSpacing="-0.3">amazon</text>
    <path d="M9 22.5 Q20 29 28 23" stroke="#FF9900" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <path d="M26.5 20.8 L29.5 22.7 L26.8 25.2" stroke="#FF9900" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="20" y="34" textAnchor="middle" fontSize="9" fontWeight="800" fontFamily="Arial,Helvetica,sans-serif" fill="#232F3E">pay</text>
  </svg>
);

// Google "G" rendered as 4 colored quadrant arcs — matches the canonical Google G mark.
// Followed by "Pay" wordmark. Tuned so both fit cleanly inside 40px without clipping.
const LogoGooglePay = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="#FFFFFF"/>
    <g transform="translate(11 20)">
      {/* Red top-right arc */}
      <path d="M0 -6 A 6 6 0 0 1 5.2 -3" stroke="#EA4335" strokeWidth="2" fill="none" strokeLinecap="butt"/>
      {/* Yellow right arc */}
      <path d="M5.2 -3 A 6 6 0 0 1 6 0 H 0 V -1.6 H 4.2" stroke="#FBBC04" strokeWidth="1.6" fill="#FBBC04"/>
      {/* Green bottom-right arc */}
      <path d="M6 0 A 6 6 0 0 1 0 6" stroke="#34A853" strokeWidth="2" fill="none" strokeLinecap="butt"/>
      {/* Blue left arc */}
      <path d="M0 6 A 6 6 0 1 1 0 -6" stroke="#4285F4" strokeWidth="2" fill="none" strokeLinecap="butt"/>
    </g>
    <text x="20" y="25" fontSize="10" fontWeight="600" fontFamily="Arial,Helvetica,sans-serif" fill="#5F6368">Pay</text>
  </svg>
);

const LogoPaytm = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="#FFFFFF"/>
    <text x="20" y="25" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="Arial,Helvetica,sans-serif" fill="#00BAF2" letterSpacing="-0.2">paytm</text>
  </svg>
);

const LogoPhonePe = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="#5F259F"/>
    <text x="20" y="27" textAnchor="middle" fontSize="17" fontWeight="700" fontFamily="Arial,Helvetica,sans-serif" fill="#FFFFFF">Pe</text>
  </svg>
);

const LogoUPI = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="#FFFFFF"/>
    <text x="20" y="25" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Arial,Helvetica,sans-serif" letterSpacing="0.5">
      <tspan fill="#097BDF">U</tspan>
      <tspan fill="#E4771F">P</tspan>
      <tspan fill="#097BDF">I</tspan>
    </text>
  </svg>
);

const LogoVisa = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="#FFFFFF"/>
    <text x="20" y="26" textAnchor="middle" fontSize="13" fontWeight="900" fontStyle="italic" fontFamily="Arial,Helvetica,sans-serif" fill="#1A1F71" letterSpacing="0.4">VISA</text>
  </svg>
);

// Two overlapping circles with the yellow ring overlapping the red one at 0.85 opacity
// so the intersection blends to brand-true orange. No central almond shape.
const LogoMastercard = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="#FFFFFF"/>
    <circle cx="16" cy="20" r="8" fill="#EB001B"/>
    <circle cx="24" cy="20" r="8" fill="#F79E1B" fillOpacity="0.88"/>
  </svg>
);

const LogoCreditCard = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="#1E2040"/>
    <rect x="7" y="13" width="26" height="14" rx="3" stroke="#7878AA" strokeWidth="1.5"/>
    <rect x="7" y="18" width="26" height="3.5" fill="#7878AA"/>
    <rect x="10" y="23" width="7" height="1.5" rx="0.75" fill="#7878AA"/>
    <rect x="19" y="23" width="5" height="1.5" rx="0.75" fill="#7878AA"/>
  </svg>
);

// ─── Step 2 — Payment data ────────────────────────────────────────────────────
const UPI_METHODS: { id: string; label: string; Logo: React.ComponentType }[] = [
  { id: "amazon-pay", label: "Amazon Pay UPI", Logo: LogoAmazonPay },
  { id: "google-pay", label: "Google Pay UPI",  Logo: LogoGooglePay },
  { id: "paytm",      label: "Paytm UPI",       Logo: LogoPaytm },
  { id: "phonepe",    label: "PhonePe UPI",      Logo: LogoPhonePe },
];

const SAVED_CARDS: { id: string; Logo: React.ComponentType; bank: string; masked: string }[] = [
  { id: "visa-sbi",  Logo: LogoVisa,       bank: "SBI",             masked: "8912" },
  { id: "mc-hdfc",   Logo: LogoMastercard, bank: "HDFC Mastercard", masked: "8912" },
];

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", height: 44, borderRadius: 8,
  border: "1.5px solid var(--border)",
  backgroundColor: "var(--background)",
  paddingLeft: 12, paddingRight: 12,
  fontFamily: "var(--font-family-inter)",
  fontSize: "var(--text-sm)",
  color: "var(--foreground)",
  outline: "none",
  boxSizing: "border-box",
};

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: 9999,
      border: selected ? "none" : "1.5px solid var(--border)",
      backgroundColor: selected ? "var(--primary)" : "transparent",
      flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {selected && <div style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "var(--white)" }} />}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--font-family-inter)",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--font-weight-medium)",
      color: "var(--muted-foreground)",
      display: "block",
      marginBottom: 8,
      paddingLeft: 4,
    }}>{children}</span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", marginBottom: 6 }}>
      {children}
    </label>
  );
}

// ─── Step 2 — Payment ─────────────────────────────────────────────────────────
function StepPayment({ items, summary, isDigital }: { items: CartItem[]; summary: CartSummary; isDigital: boolean }) {
  const [selected, setSelected] = useState<string>("amazon-pay");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [showAddUpi, setShowAddUpi] = useState(false);
  const [newUpiId, setNewUpiId] = useState("");
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  return (
    <div className="flex flex-col" style={{ gap: 16, padding: "0 16px" }}>

      {/* Order summary — collapsible */}
      <div style={{ borderRadius: 12, backgroundColor: "var(--card)", border: "1.5px solid var(--border)", overflow: "hidden" }}>
        <button
          onClick={() => setSummaryOpen((v) => !v)}
          className="flex items-center justify-between w-full"
          style={{ padding: "12px 16px", cursor: "pointer", background: "none", border: "none", textAlign: "left" }}
        >
          <div className="flex items-center" style={{ gap: 12, minWidth: 0, flex: 1 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
              <ProductImageFallback categoryId={items[0].categoryId} iconSize={18} />
            </div>
            <div className="flex flex-col" style={{ gap: 2, minWidth: 0 }}>
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", lineHeight: 1.3 }}>
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
              <span style={{ ...typo.metaStyle, lineHeight: 1.3 }}>
                ₹{summary.total.toLocaleString("en-IN")} total{summary.discount > 0 ? ` · ₹${summary.discount.toLocaleString("en-IN")} off` : ""}
              </span>
            </div>
          </div>
          {summaryOpen
            ? <ChevronUp style={{ width: 18, height: 18, color: "var(--muted-foreground)", strokeWidth: 1.5, flexShrink: 0 }} />
            : <ChevronDown style={{ width: 18, height: 18, color: "var(--muted-foreground)", strokeWidth: 1.5, flexShrink: 0 }} />
          }
        </button>

        <AnimatePresence>
          {summaryOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ height: "0.5px", backgroundColor: "var(--border)" }} />
              <div style={{ padding: "12px 16px 16px" }}>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center" style={{ gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <ProductImageFallback categoryId={item.categoryId} iconSize={22} />
                    </div>
                    <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--foreground)", flex: 1, lineHeight: "1.35" }}>
                      {item.title}
                    </span>
                    <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", flexShrink: 0 }}>
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
                <PriceRows summary={summary} isDigital={isDigital} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* UPI section */}
      <div>
        <SectionLabel>Pay by UPI</SectionLabel>
        <div style={{ borderRadius: 12, backgroundColor: "var(--card)", border: "1.5px solid var(--border)", overflow: "hidden" }}>
          {UPI_METHODS.map((upi, idx) => {
            const isSel = selected === upi.id;
            const Logo = upi.Logo;
            return (
              <div key={upi.id}>
                {idx > 0 && <div style={{ height: "0.5px", backgroundColor: "var(--border)", marginLeft: 68 }} />}
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelected(upi.id)}
                  className="flex items-center w-full text-left"
                  style={{
                    gap: 12, padding: "12px 16px",
                    backgroundColor: isSel ? "color-mix(in srgb, var(--primary) 6%, transparent)" : "transparent",
                    border: "none", cursor: "pointer", transition: "background-color 0.15s",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                    <Logo />
                  </div>
                  <div className="flex flex-col" style={{ gap: 1, flex: 1 }}>
                    <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)" }}>
                      {upi.label}
                    </span>
                    <span style={{ ...typo.metaStyle }}>UPI</span>
                  </div>
                  <RadioDot selected={isSel} />
                </motion.button>
              </div>
            );
          })}

          {/* Add new UPI ID — inline expand */}
          <div style={{ height: "0.5px", backgroundColor: "var(--border)", marginLeft: 68 }} />
          <AnimatePresence>
            {!showAddUpi && (
              <motion.button
                key="add-upi-btn"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowAddUpi(true)}
                className="flex items-center w-full"
                style={{ gap: 12, padding: "12px 16px", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
              >
                <div className="flex items-center justify-center" style={{
                  width: 40, height: 40, borderRadius: 8,
                  backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                  flexShrink: 0,
                }}>
                  <Plus style={{ width: 16, height: 16, color: "var(--primary-300)", strokeWidth: 2 }} />
                </div>
                <span style={{ flex: 1, fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--primary-300)", textAlign: "left" }}>
                  Add new UPI ID
                </span>
              </motion.button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showAddUpi && (
              <motion.div
                key="add-upi-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ padding: 16 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                      Add UPI ID
                    </span>
                    <button
                      onClick={() => { setShowAddUpi(false); setNewUpiId(""); }}
                      style={{ background: "none", border: "none", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", cursor: "pointer", padding: 0 }}
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newUpiId}
                    onChange={(e) => setNewUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    style={{ ...INPUT_STYLE, marginBottom: 12 }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAddUpi(false)}
                    className="flex items-center justify-center w-full"
                    style={{ height: 44, borderRadius: 8, backgroundColor: "var(--primary)", border: "none", cursor: "pointer" }}
                  >
                    <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}>
                      Verify &amp; Add
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cards section */}
      <div>
        <SectionLabel>Credit &amp; Debit Cards</SectionLabel>
        <div style={{ borderRadius: 12, backgroundColor: "var(--card)", border: "1.5px solid var(--border)", overflow: "hidden" }}>
          {SAVED_CARDS.map((card, idx) => {
            const isSel = selected === card.id;
            const Logo = card.Logo;
            return (
              <div key={card.id}>
                {idx > 0 && <div style={{ height: "0.5px", backgroundColor: "var(--border)", marginLeft: 68 }} />}
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelected(card.id)}
                  className="flex items-center w-full text-left"
                  style={{
                    gap: 12, padding: "12px 16px",
                    backgroundColor: isSel ? "color-mix(in srgb, var(--primary) 6%, transparent)" : "transparent",
                    border: "none", cursor: "pointer", transition: "background-color 0.15s",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                    <Logo />
                  </div>
                  <div className="flex flex-col" style={{ gap: 1, flex: 1 }}>
                    <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)" }}>
                      {card.bank}
                    </span>
                    <span style={{ ...typo.metaStyle }}>•••• {card.masked}</span>
                  </div>
                  <RadioDot selected={isSel} />
                </motion.button>
              </div>
            );
          })}

          {/* Add new card — inline expand */}
          <div style={{ height: "0.5px", backgroundColor: "var(--border)", marginLeft: 68 }} />
          <AnimatePresence>
            {!showAddCard && (
              <motion.button
                key="add-card-btn"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowAddCard(true)}
                className="flex items-center w-full"
                style={{ gap: 12, padding: "12px 16px", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
              >
                <div className="flex items-center justify-center" style={{
                  width: 40, height: 40, borderRadius: 8,
                  backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                  flexShrink: 0,
                }}>
                  <Plus style={{ width: 16, height: 16, color: "var(--primary-300)", strokeWidth: 2 }} />
                </div>
                <span style={{ flex: 1, fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--primary-300)", textAlign: "left" }}>
                  Add new card
                </span>
              </motion.button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showAddCard && (
              <motion.div
                key="add-card-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ padding: 16 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                      New Card
                    </span>
                    <button
                      onClick={() => { setShowAddCard(false); setCardNumber(""); setCardName(""); setCardExpiry(""); setCardCvv(""); }}
                      style={{ background: "none", border: "none", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", cursor: "pointer", padding: 0 }}
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex flex-col" style={{ gap: 12 }}>
                    <div>
                      <FieldLabel>Card Number</FieldLabel>
                      <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" style={INPUT_STYLE} />
                    </div>
                    <div>
                      <FieldLabel>Cardholder Name</FieldLabel>
                      <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" style={INPUT_STYLE} />
                    </div>
                    <div className="flex" style={{ gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <FieldLabel>Expiry</FieldLabel>
                        <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM / YY" style={INPUT_STYLE} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <FieldLabel>CVV</FieldLabel>
                        <input type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="•••" style={INPUT_STYLE} />
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowAddCard(false)}
                      className="flex items-center justify-center w-full"
                      style={{ height: 44, borderRadius: 8, backgroundColor: "var(--primary)", border: "none", cursor: "pointer" }}
                    >
                      <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}>
                        Save Card
                      </span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Price summary */}
      <div style={{ padding: 16, borderRadius: 12, backgroundColor: "var(--card)", border: "1.5px solid var(--border)" }}>
        <PriceRows summary={summary} isDigital={isDigital} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  // State threaded from Buy Now → Checkout → Order Confirm. Test-series flows
  // carry { testSeriesPackId, planLabel, packCount } so order-confirm can show
  // pack-specific copy + "Take First Mock" CTAs.
  const incomingState = location.state as Record<string, unknown> | null;
  // Digital products (test series, vocab packs, courses) skip the address
  // step — nothing to ship.
  const isDigital = !!incomingState?.testSeriesPackId || incomingState?.source === "vocabfast" || incomingState?.source === "olympiad";
  const digitalCart = buildDigitalCart(incomingState);
  const cartItems = digitalCart?.items ?? DUMMY_CART_ITEMS;
  const cartSummary = digitalCart?.summary ?? DUMMY_CART_SUMMARY;
  const [currentStep, setCurrentStep] = useState<Step>(isDigital ? 2 : 1);

  return (
    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, paddingLeft: 16, paddingRight: 20, gap: 12 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => (!isDigital && currentStep > 1) ? setCurrentStep((s) => (s - 1) as Step) : navigate(-1)}
            aria-label="Go back"
            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "none", border: "none", flexShrink: 0 }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: "var(--foreground)", strokeWidth: 1.5 }} />
          </motion.button>
          <span style={{ ...typo.pageTitleStyle }}>{isDigital ? "Payment" : "Checkout"}</span>
        </div>
        {!isDigital && <StepBar current={currentStep} />}
      </GlassHeader>

      <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingTop: 16, paddingBottom: currentStep === 2 ? 128 : 32 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && <StepAddress onNext={() => setCurrentStep(2)} />}
            {currentStep === 2 && <StepPayment items={cartItems} summary={cartSummary} isDigital={isDigital} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Pay CTA — step 2 only */}
      <AnimatePresence>
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px 24px", backgroundColor: "var(--background)", borderTop: "0.5px solid var(--border)" }}
          >
            <div className="flex items-center justify-center" style={{ gap: 6, marginBottom: 10 }}>
              <ShieldCheck style={{ width: 14, height: 14, color: "var(--success-500)", strokeWidth: 1.5, flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                100% secure payment · SSL encrypted
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/marketplace/order-confirm", { state: incomingState })}
              className="flex items-center justify-center w-full"
              style={{ height: 52, borderRadius: 12, backgroundColor: "var(--primary)", border: "none", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}>
                Pay ₹{cartSummary.total.toLocaleString("en-IN")}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
