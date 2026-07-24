/**
 * Marketplace Return — Request return/replacement for a delivered physical order
 * Route: /marketplace/return
 * Receives: { orderId: string } via location.state
 *
 * Implements Primebook return policy (verified from shop.primebook.in):
 *  - 7-day return window from delivery
 *  - Must report damage on arrival within 24 hours
 *  - Refund within 10 business days after pickup
 *  - Free pickup arranged within 24 hours of approval
 *  - Replacement available for defective/damaged/malfunctioning units
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Replace,
  AlertTriangle,
  Camera,
  ChevronRight,
  Clock,
  Phone,
  Package,
  Truck,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar, Card, typo } from "../shared/premium-ui";

// ─── Types ────────────────────────────────────────────────────────────────────
type ReturnReasonId =
  | "damaged-on-arrival"
  | "defective"
  | "wrong-item"
  | "not-as-described"
  | "no-longer-needed";

type ResolutionId = "refund" | "replacement";

interface ReturnReason {
  id: ReturnReasonId;
  label: string;
  sub: string;
  requiresPhoto: boolean;
  eligibleForRefund: boolean;
  eligibleForReplacement: boolean;
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────
// TODO(api): GET /api/orders/:orderId (return-eligibility snapshot)
const DUMMY_RETURN_CONTEXT = {
  orderId: "PM2024020114",
  product: {
    title: "Primebook 2 Neo — 11.6\" · 4GB · 64GB",
    image: "/primebook-neo.png",
    price: 15990,
  },
  deliveredOn: "10 Feb 2026",
  returnWindowEnds: "17 Feb 2026",
  pickupAddress: {
    name: "Sagar Prabhu",
    line1: "404, Green Valley Apts, Sector 12",
    cityPin: "Bengaluru — 560 001",
    phone: "+91 98765 43210",
  },
};

const RETURN_REASONS: ReturnReason[] = [
  {
    id: "damaged-on-arrival",
    label: "Damaged on arrival",
    sub: "Cracked screen, dents, water damage",
    requiresPhoto: true,
    eligibleForRefund: true,
    eligibleForReplacement: true,
  },
  {
    id: "defective",
    label: "Defective or not turning on",
    sub: "Hardware fault, battery issue, won't boot",
    requiresPhoto: false,
    eligibleForRefund: true,
    eligibleForReplacement: true,
  },
  {
    id: "wrong-item",
    label: "Wrong item delivered",
    sub: "Different model or variant",
    requiresPhoto: true,
    eligibleForRefund: true,
    eligibleForReplacement: true,
  },
  {
    id: "not-as-described",
    label: "Not as described",
    sub: "Specs or features don't match listing",
    requiresPhoto: false,
    eligibleForRefund: true,
    eligibleForReplacement: false,
  },
  {
    id: "no-longer-needed",
    label: "No longer needed",
    sub: "Changed my mind · returns minus delivery charges",
    requiresPhoto: false,
    eligibleForRefund: true,
    eligibleForReplacement: false,
  },
];

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepHeader({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <div className="flex flex-col" style={{ gap: 4, padding: "16px 16px 8px" }}>
      <span style={{ ...typo.metaStyle }}>Step {step} of {total}</span>
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-lg)",
          fontWeight: "var(--font-weight-bold)",
          color: "var(--foreground)",
        }}
      >
        {title}
      </span>
    </div>
  );
}

// ─── Product Mini Card ────────────────────────────────────────────────────────
function ProductMini() {
  const p = DUMMY_RETURN_CONTEXT.product;
  return (
    <div className="flex items-center" style={{ gap: 12, padding: 12, backgroundColor: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
      <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", backgroundColor: "var(--card-dark)", flexShrink: 0 }}>
        <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
          {p.title}
        </span>
        <span style={{ ...typo.metaStyle }}>
          Delivered {DUMMY_RETURN_CONTEXT.deliveredOn} · ₹{p.price.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}

// ─── Step 1 — Reason ──────────────────────────────────────────────────────────
function ReasonStep({
  selected,
  onSelect,
  onNext,
}: {
  selected: ReturnReasonId | null;
  onSelect: (id: ReturnReasonId) => void;
  onNext: () => void;
}) {
  return (
    <>
      <StepHeader step={1} total={4} title="Why are you returning this?" />
      <div className="flex flex-col" style={{ padding: "0 16px 16px", gap: 12 }}>
        <ProductMini />

        {/* Policy banner */}
        <div
          className="flex items-start"
          style={{
            gap: 10,
            padding: 12,
            borderRadius: 10,
            backgroundColor: "color-mix(in srgb, var(--warning-500) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--warning-500) 24%, transparent)",
          }}
        >
          <AlertTriangle style={{ width: 16, height: 16, color: "var(--warning-500)", marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--foreground)", lineHeight: 1.5 }}>
            Returns must be raised within 7 days of delivery. Damage must be reported within 24 hours of receipt. Window ends <strong>{DUMMY_RETURN_CONTEXT.returnWindowEnds}</strong>.
          </span>
        </div>

        <div className="flex flex-col" style={{ gap: 8 }}>
          {RETURN_REASONS.map((r) => {
            const isSel = selected === r.id;
            return (
              <motion.button
                key={r.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelect(r.id)}
                className="flex items-start w-full text-left"
                style={{
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  border: isSel ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                  backgroundColor: isSel ? "color-mix(in srgb, var(--primary) 8%, var(--card))" : "var(--card)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 9999,
                    border: isSel ? "none" : "2px solid var(--border)",
                    backgroundColor: isSel ? "var(--primary)" : "transparent",
                    flexShrink: 0,
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSel && <div style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "var(--white)" }} />}
                </div>
                <div className="flex flex-col" style={{ flex: 1, gap: 2 }}>
                  <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                    {r.label}
                  </span>
                  <span style={{ ...typo.metaStyle }}>{r.sub}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      <FooterCta enabled={!!selected} label="Continue" onClick={onNext} />
    </>
  );
}

// ─── Step 2 — Photos & Description ────────────────────────────────────────────
function EvidenceStep({
  reason,
  description,
  onDescriptionChange,
  photoCount,
  onAddPhoto,
  onNext,
}: {
  reason: ReturnReason;
  description: string;
  onDescriptionChange: (v: string) => void;
  photoCount: number;
  onAddPhoto: () => void;
  onNext: () => void;
}) {
  const canContinue = reason.requiresPhoto ? photoCount > 0 : true;

  return (
    <>
      <StepHeader step={2} total={4} title="Add details" />
      <div className="flex flex-col" style={{ padding: "0 16px 16px", gap: 16 }}>
        {/* Photos */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
              Photos {reason.requiresPhoto ? "" : "(optional)"}
            </span>
            <span style={{ ...typo.metaStyle }}>{photoCount} / 4</span>
          </div>
          <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
            {Array.from({ length: photoCount }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 10,
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <CheckCircle2 style={{ width: 18, height: 18, color: "var(--success-500)" }} />
              </div>
            ))}
            {photoCount < 4 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onAddPhoto}
                className="flex flex-col items-center justify-center"
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 10,
                  border: "1.5px dashed var(--border)",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  gap: 4,
                }}
              >
                <Camera style={{ width: 18, height: 18, color: "var(--muted-foreground)" }} />
                <span style={{ ...typo.metaStyle }}>Add</span>
              </motion.button>
            )}
          </div>
          {reason.requiresPhoto && (
            <span style={{ ...typo.metaStyle }}>At least 1 photo required for "{reason.label}"</span>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
            Tell us what happened (optional)
          </span>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe the issue in a few words…"
            rows={4}
            style={{
              width: "100%",
              backgroundColor: "var(--card)",
              border: "1.5px solid var(--border)",
              borderRadius: 10,
              padding: "10px 12px",
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-sm)",
              color: "var(--foreground)",
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
      <FooterCta enabled={canContinue} label="Continue" onClick={onNext} />
    </>
  );
}

// ─── Step 3 — Resolution ──────────────────────────────────────────────────────
function ResolutionStep({
  reason,
  selected,
  onSelect,
  onNext,
}: {
  reason: ReturnReason;
  selected: ResolutionId | null;
  onSelect: (id: ResolutionId) => void;
  onNext: () => void;
}) {
  const options: { id: ResolutionId; title: string; sub: string; Icon: typeof Wallet; eligible: boolean }[] = [
    {
      id: "replacement",
      title: "Replacement",
      sub: "New unit dispatched within 24 hrs of pickup",
      Icon: Replace,
      eligible: reason.eligibleForReplacement,
    },
    {
      id: "refund",
      title: "Refund to original payment",
      sub: "₹15,990 back within 10 business days",
      Icon: Wallet,
      eligible: reason.eligibleForRefund,
    },
  ];

  return (
    <>
      <StepHeader step={3} total={4} title="How can we resolve this?" />
      <div className="flex flex-col" style={{ padding: "0 16px 16px", gap: 8 }}>
        {options.map((opt) => {
          const isSel = selected === opt.id;
          const disabled = !opt.eligible;
          return (
            <motion.button
              key={opt.id}
              whileTap={disabled ? undefined : { scale: 0.99 }}
              onClick={() => !disabled && onSelect(opt.id)}
              disabled={disabled}
              className="flex items-start w-full text-left"
              style={{
                gap: 12,
                padding: 14,
                borderRadius: 12,
                border: isSel ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                backgroundColor: isSel ? "color-mix(in srgb, var(--primary) 8%, var(--card))" : "var(--card)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                transition: "all 0.15s",
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: "color-mix(in srgb, var(--primary) 14%, transparent)",
                  flexShrink: 0,
                }}
              >
                <opt.Icon style={{ width: 18, height: 18, color: "var(--primary-300)" }} />
              </div>
              <div className="flex flex-col" style={{ flex: 1, gap: 2 }}>
                <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                  {opt.title}
                </span>
                <span style={{ ...typo.metaStyle }}>
                  {disabled ? "Not eligible for this reason" : opt.sub}
                </span>
              </div>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 9999,
                  border: isSel ? "none" : "2px solid var(--border)",
                  backgroundColor: isSel ? "var(--primary)" : "transparent",
                  flexShrink: 0,
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSel && <div style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "var(--white)" }} />}
              </div>
            </motion.button>
          );
        })}
      </div>
      <FooterCta enabled={!!selected} label="Continue" onClick={onNext} />
    </>
  );
}

// ─── Step 4 — Pickup confirm ──────────────────────────────────────────────────
function PickupStep({ onSubmit }: { onSubmit: () => void }) {
  const a = DUMMY_RETURN_CONTEXT.pickupAddress;
  return (
    <>
      <StepHeader step={4} total={4} title="Confirm pickup address" />
      <div className="flex flex-col" style={{ padding: "0 16px 16px", gap: 12 }}>
        <Card style={{ padding: 14, border: "1px solid var(--border)" }}>
          <div className="flex items-start" style={{ gap: 10 }}>
            <Truck style={{ width: 18, height: 18, color: "var(--primary-300)", flexShrink: 0, marginTop: 2 }} />
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                {a.name}
              </span>
              <span style={{ ...typo.metaStyle }}>{a.line1}</span>
              <span style={{ ...typo.metaStyle }}>{a.cityPin}</span>
              <span style={{ ...typo.metaStyle, marginTop: 4 }}>{a.phone}</span>
            </div>
          </div>
        </Card>

        {/* Helpful tips */}
        <div className="flex flex-col" style={{ gap: 10, padding: 14, borderRadius: 10, backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <Row Icon={Package} title="Pack it well" sub="Original box, charger, all accessories" />
          <Row Icon={Clock} title="Pickup within 24 hours" sub="Primebook agent will call before arrival" />
          <Row Icon={Phone} title="Need help?" sub="Primebook care: +91 96674 13981" />
        </div>
      </div>
      <FooterCta enabled={true} label="Submit Return Request" onClick={onSubmit} primary />
    </>
  );
}

function Row({ Icon, title, sub }: { Icon: typeof Clock; title: string; sub: string }) {
  return (
    <div className="flex items-start" style={{ gap: 10 }}>
      <Icon style={{ width: 16, height: 16, color: "var(--muted-foreground)", marginTop: 2, flexShrink: 0 }} />
      <div className="flex flex-col" style={{ gap: 2 }}>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)" }}>
          {title}
        </span>
        <span style={{ ...typo.metaStyle }}>{sub}</span>
      </div>
    </div>
  );
}

// ─── Footer CTA ───────────────────────────────────────────────────────────────
function FooterCta({ enabled, label, onClick, primary }: { enabled: boolean; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <div
      className="sticky"
      style={{
        bottom: 0,
        backgroundColor: "var(--background)",
        borderTop: "1px solid var(--border)",
        padding: "12px 16px",
      }}
    >
      <motion.button
        whileTap={enabled ? { scale: 0.98 } : undefined}
        disabled={!enabled}
        onClick={onClick}
        className="flex items-center justify-center w-full"
        style={{
          height: 48,
          borderRadius: 12,
          border: "none",
          background: enabled
            ? primary
              ? "linear-gradient(180deg, var(--warning-500) 0%, var(--warning) 100%)"
              : "linear-gradient(180deg, var(--primary-400) 0%, var(--primary) 100%)"
            : "var(--card)",
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-base)",
          fontWeight: "var(--font-weight-semibold)",
          color: enabled ? "var(--white)" : "var(--muted-foreground)",
          cursor: enabled ? "pointer" : "not-allowed",
          boxShadow: enabled ? "0 4px 14px color-mix(in srgb, var(--primary) 28%, transparent)" : "none",
        }}
      >
        {label}
        {enabled && <ChevronRight style={{ width: 16, height: 16, marginLeft: 4 }} />}
      </motion.button>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ resolution }: { resolution: ResolutionId }) {
  const navigate = useNavigate();
  const isReplacement = resolution === "replacement";

  return (
    <div className="flex flex-col items-center" style={{ padding: "48px 24px", gap: 20, textAlign: "center" }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 16 }}
        className="flex items-center justify-center"
        style={{
          width: 88,
          height: 88,
          borderRadius: 9999,
          backgroundColor: "color-mix(in srgb, var(--success-500) 18%, transparent)",
        }}
      >
        <CheckCircle2 style={{ width: 44, height: 44, color: "var(--success-500)" }} />
      </motion.div>
      <div className="flex flex-col items-center" style={{ gap: 8 }}>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
          Return request raised
        </span>
        <span style={{ ...typo.cardBodyStyle, textAlign: "center", maxWidth: 280 }}>
          {isReplacement
            ? "Primebook will arrange pickup within 24 hours and dispatch a new unit right after."
            : "Primebook will arrange pickup within 24 hours. Refund of ₹15,990 will reach you within 10 business days."}
        </span>
      </div>

      <div
        className="flex flex-col w-full"
        style={{
          gap: 12,
          padding: 16,
          backgroundColor: "var(--card)",
          borderRadius: 12,
          border: "1px solid var(--border)",
          textAlign: "left",
        }}
      >
        <Row Icon={Truck} title="Pickup scheduled" sub="Tomorrow, between 10 AM – 6 PM" />
        <Row Icon={isReplacement ? Replace : Wallet} title={isReplacement ? "Replacement dispatch" : "Refund timeline"} sub={isReplacement ? "Within 24 hrs of pickup confirmation" : "Within 10 business days"} />
        <Row Icon={Phone} title="Track this return" sub="Status updates in My Orders → Returned" />
      </div>

      <div className="flex flex-col w-full" style={{ gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/marketplace/orders")}
          className="flex items-center justify-center w-full"
          style={{
            height: 48,
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(180deg, var(--primary-400) 0%, var(--primary) 100%)",
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--white)",
            cursor: "pointer",
          }}
        >
          Go to My Orders
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/marketplace-v1")}
          className="flex items-center justify-center w-full"
          style={{
            height: 44,
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "transparent",
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-medium)",
            color: "var(--foreground)",
            cursor: "pointer",
          }}
        >
          Back to Marketplace
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const _location = useLocation();
  // TODO(api): hydrate from /api/orders/:orderId — using DUMMY_RETURN_CONTEXT
  void _location;

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [reasonId, setReasonId] = useState<ReturnReasonId | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [description, setDescription] = useState("");
  const [resolution, setResolution] = useState<ResolutionId | null>(null);

  const reason = RETURN_REASONS.find((r) => r.id === reasonId);

  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        minHeight: "100vh",
      }}
    >
      <div
        className="sticky top-0 z-20 shrink-0"
        style={{
          backgroundColor: "var(--card)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, paddingLeft: 8, paddingRight: 20, gap: 12 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => (step === 1 || step === 5 ? navigate(-1) : setStep((s) => (s - 1) as 1 | 2 | 3 | 4))}
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
            <ArrowLeft style={{ width: 20, height: 20, color: "var(--foreground)", strokeWidth: 2 }} />
          </motion.button>
          <div className="flex items-center" style={{ gap: 8 }}>
            <RotateCcw style={{ width: 16, height: 16, color: "var(--warning-500)" }} />
            <span style={{ ...typo.pageTitleStyle }}>
              {step === 5 ? "Return Submitted" : "Return / Replacement"}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col flex-1"
        >
          {step === 1 && (
            <ReasonStep
              selected={reasonId}
              onSelect={setReasonId}
              onNext={() => reasonId && setStep(2)}
            />
          )}
          {step === 2 && reason && (
            <EvidenceStep
              reason={reason}
              description={description}
              onDescriptionChange={setDescription}
              photoCount={photoCount}
              onAddPhoto={() => setPhotoCount((c) => Math.min(4, c + 1))}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && reason && (
            <ResolutionStep
              reason={reason}
              selected={resolution}
              onSelect={setResolution}
              onNext={() => resolution && setStep(4)}
            />
          )}
          {step === 4 && <PickupStep onSubmit={() => setStep(5)} />}
          {step === 5 && resolution && <SuccessScreen resolution={resolution} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
