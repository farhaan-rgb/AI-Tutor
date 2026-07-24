/**
 * Olympiad Claim — turns a won prize tier into a real, claimable reward (the
 * piece that was previously read-only text on the rewards page). Kind-aware:
 *   • voucher → reveal an Amazon/brand e-voucher code (money routed through a
 *     voucher rail, never raw cash — the India-safe pattern from research)
 *   • goods   → parent/guardian + address + KYC capture → shipping status
 *   • merit   → medal/certificate is auto-issued; nothing to claim
 * Claim is allowed only after results are out; one reward per registration.
 *
 * TODO(api): POST /api/olympiads/:id/claim — issue voucher (Gyftr/QwikCilver) or
 *            create a fulfillment order; persist the claim state-machine server-side.
 *
 * Route: /olympiad/:olympiadId/claim
 */

import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  Gift, Copy, Check, Truck, ShieldCheck, Package, Award, Clock, Info,
  Trophy, Medal, IndianRupee, BadgeCheck,
} from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import {
  getOlympiadById, olympiadStatus, useOlympiadState, prizeForRank, formatCount,
  type Olympiad, type ClaimStatus,
} from "../shared/olympiads";
import { OlympiadHeader, OlympiadTag, olympiadBack } from "./olympiad-ui";
import { ConfettiBurst } from "./certificate-view";

// A prize tier's reward is often a BUNDLE ("₹20,000 + Gold medal + Trophy").
// Split it on " + " and classify each piece so the claim screen shows the whole
// haul and routes each component to the right fulfilment.
type RewardPartKind = "cash" | "medal" | "trophy" | "certificate" | "badge" | "goodies";
interface RewardPart { kind: RewardPartKind; label: string }

function parseReward(reward: string): RewardPart[] {
  return reward.split(/\s*\+\s*/).map((raw) => {
    const t = raw.toLowerCase();
    let kind: RewardPartKind = "goodies";
    if (/₹|rs\.?|cash|voucher|gift\s?card|inr/.test(t)) kind = "cash";
    else if (/trophy/.test(t)) kind = "trophy";
    else if (/medal/.test(t)) kind = "medal";
    else if (/cert|merit/.test(t)) kind = "certificate";
    else if (/badge/.test(t)) kind = "badge";
    return { kind, label: raw.trim() };
  });
}

const PART_META: Record<RewardPartKind, { icon: typeof Gift; note: string }> = {
  cash:        { icon: IndianRupee, note: "Claim as an Amazon e-voucher below" },
  medal:       { icon: Medal,       note: "Couriered free to your address" },
  trophy:      { icon: Trophy,      note: "Couriered free to your address" },
  certificate: { icon: Award,       note: "Auto-issued — view anytime" },
  badge:       { icon: BadgeCheck,  note: "Added to your Olympiad rewards" },
  goodies:     { icon: Package,     note: "Shipped after verification" },
};

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const { olympiadId } = useParams<{ olympiadId: string }>();
  const o = olympiadId ? getOlympiadById(olympiadId) : undefined;
  const state = useOlympiadState();
  // Back returns to wherever we came from (rewards or result), default result.
  const backTo = (location.state as { from?: string } | null)?.from
    ?? `/olympiad/${olympiadId}/result`;

  if (!o) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", backgroundColor: "var(--background)" }}>
        <span style={{ color: "var(--foreground)" }}>Olympiad not found</span>
      </div>
    );
  }

  const s = olympiadStatus(o);
  const attempt = state.getAttempt(o.id);
  const prize = attempt ? prizeForRank(o, attempt.rank) : null;
  const claim = state.getClaim(o.id);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="Claim reward" onBack={() => olympiadBack(navigate, backTo)} />
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 32px", gap: 16 }}>
        {!attempt || !prize || !s.resultsOut ? (
          <NoReward resultsOut={s.resultsOut} attempted={!!attempt} />
        ) : (
          <ClaimBody o={o} prizeReward={prize.reward} prizeRank={prize.rank} rank={attempt.rank}
            claim={claim} onSetClaim={(st) => state.setClaim(o.id, st)}
            onViewCert={() => navigate(`/olympiad/${o.id}/certificate`)} />
        )}
      </div>
    </div>
  );
}

function ClaimBody({ o, prizeReward, prizeRank, rank, claim, onSetClaim, onViewCert }: {
  o: Olympiad; prizeReward: string; prizeRank: string; rank: number;
  claim: ClaimStatus; onSetClaim: (s: ClaimStatus) => void; onViewCert: () => void;
}) {
  const parts = parseReward(prizeReward);
  const hasCash = parts.some((p) => p.kind === "cash");
  const hasGoodies = parts.some((p) => p.kind === "goodies");
  const multi = parts.length > 1;

  return (
    <>
      {/* ── WOW hero — celebratory win moment ─────────────────────────────── */}
      <div className="relative flex flex-col items-center text-center overflow-hidden" style={{
        gap: 16, padding: "32px 24px 32px", borderRadius: 20,
        background: "radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--warning-500) 22%, var(--card)) 0%, var(--card) 70%)",
        border: "0.5px solid color-mix(in srgb, var(--warning-500) 38%, var(--border))",
        boxShadow: "0 8px 40px color-mix(in srgb, var(--warning-500) 18%, transparent)",
      }}>
        <ConfettiBurst count={36} />

        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
          className="relative flex items-center justify-center shrink-0"
          style={{
            width: 84, height: 84, flexShrink: 0, aspectRatio: "1 / 1", borderRadius: 9999,
            background: "linear-gradient(155deg, var(--warning-500) 0%, var(--warning-700) 100%)",
            boxShadow: "0 0 0 8px color-mix(in srgb, var(--warning-500) 14%, transparent), 0 0 36px color-mix(in srgb, var(--warning-500) 45%, transparent)",
          }}
        >
          <Trophy size={40} style={{ color: "var(--white)" }} />
          <motion.span
            aria-hidden
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1.25, opacity: 0 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0, borderRadius: 9999, border: "2px solid var(--warning-500)" }}
          />
        </motion.div>

        <div className="flex flex-col" style={{ gap: 4 }}>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--warning-500)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 800 }}>
            Congratulations
          </span>
          <motion.span
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.1 }}
          >
            All-India Rank #{rank.toLocaleString("en-IN")}
          </motion.span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
            out of {formatCount(o.participantCount)} · {prizeRank} tier
          </span>
        </div>

        {/* Prize headline — a solid gold reward banner (radius 12, system-matched)
            with high-contrast text, so the win reads as a real prize. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.28, type: "spring", stiffness: 220, damping: 18 }}
          className="inline-flex items-center" style={{
            gap: 8, padding: "12px 20px", borderRadius: 12,
            background: "linear-gradient(155deg, var(--warning-500) 0%, var(--warning-700) 100%)",
            boxShadow: "0 2px 12px color-mix(in srgb, var(--warning-500) 30%, transparent)",
          }}
        >
          <Gift size={18} style={{ color: "var(--white)" }} />
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--white)" }}>{prizeReward}</span>
        </motion.div>
      </div>

      {/* ── What you won — every component of the bundle ──────────────────── */}
      {multi && (
        <div className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Here's everything you won</span>
          {parts.map((p, i) => {
            const meta = PART_META[p.kind];
            return (
              <div key={i} className="flex items-center" style={{ gap: 12 }}>
                <div className="flex items-center justify-center shrink-0" style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: "color-mix(in srgb, var(--warning-500) 14%, transparent)",
                  border: "0.5px solid color-mix(in srgb, var(--warning-500) 32%, transparent)",
                }}>
                  <meta.icon size={18} style={{ color: "var(--warning-500)" }} />
                </div>
                <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>{p.label}</span>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{meta.note}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Claim action — cash routes to voucher; pure-goods to shipping;
             everything else is auto-issued. Medals/trophies in a bundle are
             couriered free (shown in the breakdown above). ─────────────────── */}
      {hasCash
        ? <VoucherReward reward={prizeReward} o={o} claim={claim} onSetClaim={onSetClaim} />
        : hasGoodies
        ? <GoodsReward claim={claim} onSetClaim={onSetClaim} />
        : <MeritReward onViewCert={onViewCert} />}

      {/* Fairness note */}
      <div className="flex items-start" style={{ gap: 8 }}>
        <Info size={14} style={{ color: "var(--muted-foreground)", marginTop: 2 }} />
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
          Claim within 14 days of results. One reward per registration · non-transferable · subject to leaderboard verification.
        </span>
      </div>
    </>
  );
}

function MeritReward({ onViewCert }: { onViewCert: () => void }) {
  return (
    <div className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      <span className="flex items-center" style={{ gap: 8, fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
        <Award size={16} style={{ color: "var(--warning-500)", flexShrink: 0 }} />
        Your medal &amp; certificate are issued automatically — nothing to claim.
      </span>
      <PrimaryBtn label="View certificate" onClick={onViewCert} />
    </div>
  );
}

function VoucherReward({ reward, o, claim, onSetClaim }: {
  reward: string; o: Olympiad; claim: ClaimStatus; onSetClaim: (s: ClaimStatus) => void;
}) {
  const claimed = claim === "claimed" || claim === "delivered";
  const code = `AMZN-${o.examLabel.replace(/[^A-Z]/g, "").slice(0, 3)}26-${String(10000 + (reward.length * 731) % 89999)}`;
  const [copied, setCopied] = useState(false);

  if (!claimed) {
    return (
      <div className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Amazon e-voucher</span>
        <Term icon={ShieldCheck} text="Issued to your registered phone &amp; email instantly." />
        <Term icon={Clock} text="Valid 12 months · non-encashable · single use." />
        <PrimaryBtn label="Claim voucher" onClick={() => onSetClaim("claimed")} />
      </div>
    );
  }
  return (
    <div className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--success-500)" }}>
      <span className="inline-flex items-center" style={{ gap: 6 }}>
        <OlympiadTag label="Claimed" variant="success" icon={Check} />
      </span>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>Your voucher code</span>
      <button type="button" onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }}
        className="flex items-center justify-between w-full" style={{
          height: 48, padding: "0 16px", borderRadius: 12, cursor: "pointer",
          backgroundColor: "var(--card-bg-secondary)", border: "0.5px dashed var(--border)",
        }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", fontFamily: "monospace", letterSpacing: 1 }}>{code}</span>
        <span className="inline-flex items-center" style={{ gap: 4, fontSize: "var(--text-xs)", fontWeight: 600, color: copied ? "var(--success-500)" : "var(--primary-400)" }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}
        </span>
      </button>
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Also sent to your registered phone &amp; email · valid 12 months.</span>
    </div>
  );
}

const GOODS_STEPS: { key: ClaimStatus; label: string; icon: typeof Truck }[] = [
  { key: "pending", label: "Verifying details", icon: ShieldCheck },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
];

function GoodsReward({ claim, onSetClaim }: { claim: ClaimStatus; onSetClaim: (s: ClaimStatus) => void }) {
  const [form, setForm] = useState({ winner: "Rahul Sharma", guardian: "", phone: "", address: "", pan: "" });
  const submitted = claim !== "unclaimed";
  const ok = form.guardian.trim() && form.phone.trim().length >= 10 && form.address.trim().length > 8 && form.pan.trim().length >= 6;

  if (!submitted) {
    return (
      <div className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Shipping &amp; verification</span>
        <Field label="Winner name" value={form.winner} onChange={(v) => setForm({ ...form, winner: v })} />
        <Field label="Parent / guardian name" value={form.guardian} onChange={(v) => setForm({ ...form, guardian: v })} placeholder="Required for minors" />
        <Field label="Contact phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="10-digit mobile" />
        <Field label="Full shipping address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="House, street, city, PIN" />
        <Field label="Guardian PAN (KYC)" value={form.pan} onChange={(v) => setForm({ ...form, pan: v })} placeholder="For prize-value compliance" />
        <PrimaryBtn label="Submit claim" disabled={!ok} onClick={() => onSetClaim("pending")} />
      </div>
    );
  }
  const currentIdx = GOODS_STEPS.findIndex((st) => st.key === claim);
  return (
    <div className="flex flex-col" style={{ gap: 14, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      <OlympiadTag label={claim === "delivered" ? "Delivered" : "Claim received"} variant="success" icon={Check} />
      {GOODS_STEPS.map((st, i) => {
        const done = i <= currentIdx;
        return (
          <div key={st.key} className="flex items-center" style={{ gap: 12 }}>
            <div className="flex items-center justify-center shrink-0" style={{
              width: 32, height: 32, borderRadius: 9999,
              backgroundColor: done ? "color-mix(in srgb, var(--success-500) 18%, transparent)" : "var(--card-bg-secondary)",
            }}>
              <st.icon size={16} style={{ color: done ? "var(--success-500)" : "var(--muted-foreground)" }} />
            </div>
            <span style={{ flex: 1, fontSize: "var(--text-sm)", fontWeight: done ? 600 : 500, color: done ? "var(--foreground)" : "var(--muted-foreground)" }}>{st.label}</span>
            {i === currentIdx && <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Current</span>}
          </div>
        );
      })}
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
        We'll notify you at each step. Estimated delivery 10–15 business days after verification.
      </span>
    </div>
  );
}

function NoReward({ resultsOut, attempted }: { resultsOut: boolean; attempted: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ flex: 1, gap: 12, padding: 24, minHeight: 320 }}>
      <Gift size={40} style={{ color: "var(--muted-foreground)" }} />
      <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>
        {!resultsOut ? "Rewards unlock with results" : !attempted ? "No reward to claim" : "You didn't place in a prize tier"}
      </span>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", maxWidth: 300 }}>
        {!resultsOut
          ? "Prizes are released once the rankings publish — check back after results."
          : !attempted
          ? "You didn't sit this Olympiad, so there's no reward to claim."
          : "Finish in a ranked prize tier next time to win a reward. Your certificate is still yours."}
      </span>
    </div>
  );
}

function Term({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <span className="flex items-center" style={{ gap: 8, fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
      <Icon size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />{text}
    </span>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col" style={{ gap: 6 }}>
      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ height: 44, padding: "0 12px", borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", border: "0.5px solid var(--border)", color: "var(--foreground)", fontSize: "var(--text-sm)", outline: "none", fontFamily: "var(--font-family-inter)" }} />
    </label>
  );
}

function PrimaryBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button type="button" whileTap={disabled ? undefined : { scale: 0.98 }} onClick={onClick} disabled={disabled}
      className="flex items-center justify-center w-full" style={{
        height: 44, borderRadius: 12, border: "none", marginTop: 2,
        fontSize: "var(--text-sm)", fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        color: disabled ? "var(--disabled-text)" : "var(--white)",
        backgroundColor: disabled ? "var(--disabled-bg)" : "var(--primary-500)",
      }}>
      {label}
    </motion.button>
  );
}
