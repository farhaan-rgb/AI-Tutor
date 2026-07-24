/**
 * ReferAndEarn — Profile referral dashboard.
 *
 * Sections (top → bottom):
 *   1. Hero — reward preview + invite CTA
 *   2. Rewards to claim — voucher list (only when unlocked > 0)
 *   3. Referrals list — friends who installed/purchased/unlocked
 *   4. How it works — first-time explainer (only when total === 0)
 *
 * No "pending invite" rows: we can't reliably track delivery of a
 * WhatsApp link, so the dashboard only shows referrals once we have
 * real signal (the friend installed).
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Gift, Send, Sparkles, ArrowRight, User as UserIcon, Check, X as XIcon } from "lucide-react";
import { GlassHeader, StatusBar, Card, typo } from "../shared/premium-ui";
import { useReferrals, type ReferralStatus, type ReferralRecord } from "../shared/referral-storage";
import { ShareSheet } from "./share-sheet";
import { FeedbackSheet } from "../app/components/ui/feedback-sheet";

// Same default avatar the project uses in bottom-nav (DUMMY_AVATAR_URL).
// TODO(api): replace with friend's actual avatar URL once attribution lands.
const FRIEND_AVATAR_URL = "/avatar.svg";

export function Component() {
  const navigate = useNavigate();
  const referrals = useReferrals();
  const [shareOpen, setShareOpen] = useState(false);
  const [claimTarget, setClaimTarget] = useState<ReferralRecord | null>(null);

  const { all, currentReward, unredeemedUnlocked, total } = referrals;
  const unlockedRecords = all.filter((r) => r.status === "unlocked");

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      <StatusBar />

      <GlassHeader>
        <div className="flex items-center w-full" style={{ gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 44, height: 44, borderRadius: 9999,
              background: "transparent", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={20} style={{ color: "var(--foreground)" }} />
          </button>
          <span style={{ ...typo.h3, color: "var(--foreground)" }}>Refer &amp; Earn</span>
        </div>
      </GlassHeader>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col" style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 80px", gap: 24 }}>

          {/* ── Hero ── */}
          <Hero
            rewardLabel={currentReward.label}
            rewardDescription={currentReward.description}
            unredeemedCount={unredeemedUnlocked}
            onInvite={() => setShareOpen(true)}
          />

          {/* ── Rewards to claim (only when unlocked rewards exist) ── */}
          {unredeemedUnlocked > 0 && (
            <Section title={`Rewards to claim (${unredeemedUnlocked})`}>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {unlockedRecords.map((r) => (
                  <VoucherCard key={r.id} record={r} onClaim={() => setClaimTarget(r)} />
                ))}
              </div>
            </Section>
          )}

          {/* ── Referrals list ── */}
          {total > 0 && (
            <Section title={`Your referrals (${total})`}>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {all.map((r) => (
                  <ReferralRow key={r.id} record={r} />
                ))}
              </div>
            </Section>
          )}

          {/* ── How it works — empty-state explainer ── */}
          {total === 0 && (
            <Section title="How it works">
              <Card style={{ padding: 0 }}>
                <StepRow step={1} title="Share PrepMaster" body="Pick a friend who's prepping — send them your link." />
                <Divider />
                <StepRow step={2} title="They get ₹300 OFF" body="Applied automatically on their first purchase." />
                <Divider />
                <StepRow step={3} title="You earn your reward" body="When their purchase clears the 10-day refund window." last />
              </Card>
            </Section>
          )}

        </div>
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        trigger="profile"
        productKind="generic"
      />

      <ClaimSheet
        record={claimTarget}
        onClose={() => setClaimTarget(null)}
        onConfirm={(id) => {
          referrals.claimReward(id);
          // ClaimSheet swaps to its success state internally; parent
          // keeps it mounted until the sheet auto-closes.
        }}
        onViewLibrary={() => {
          setClaimTarget(null);
          navigate("/classes");
        }}
      />
    </div>
  );
}

// ─── Claim sheet ─────────────────────────────────────────────────────────────

interface ClaimSheetProps {
  record: ReferralRecord | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onViewLibrary: () => void;
}

function ClaimSheet({ record, onClose, onConfirm, onViewLibrary }: ClaimSheetProps) {
  type Phase = "confirm" | "success";
  const [phase, setPhase] = useState<Phase>("confirm");

  function handleConfirm() {
    if (!record) return;
    onConfirm(record.id);
    setPhase("success");
  }

  function handleClose() {
    setPhase("confirm");
    onClose();
  }

  return (
    <FeedbackSheet open={record !== null} onClose={handleClose}>
      <AnimatePresence mode="wait">
        {phase === "confirm" && record && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col"
            style={{ gap: 16 }}
          >
            <div className="flex items-center justify-between" style={{ gap: 8, padding: "0 0 4px" }}>
              <h2 style={{
                fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)",
                margin: 0, letterSpacing: -0.2,
              }}>
                Claim your reward
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                style={{
                  width: 32, height: 32, borderRadius: 9999,
                  backgroundColor: "transparent", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", padding: 0,
                  color: "var(--muted-foreground)",
                  marginRight: -4,
                }}
              >
                <XIcon size={20} />
              </button>
            </div>

            <div aria-hidden style={{
              height: 0.5,
              backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)",
            }} />

            <div
              className="flex items-center"
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: "var(--card-bg-secondary)",
                gap: 12,
              }}
            >
              <div
                aria-hidden
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: "var(--success-d2)",
                  color: "var(--success-500)",
                }}
              >
                <Sparkles size={22} />
              </div>
              <div className="flex flex-col" style={{ flex: 1, gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>
                  {record.rewardLabel}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  Earned from {record.friendDisplayName}
                </span>
              </div>
            </div>

            <p style={{
              fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
              margin: 0, lineHeight: 1.55,
            }}>
              Claiming adds this to your library. It'll show up in <strong style={{ color: "var(--foreground)" }}>My Test Series</strong> right away — no checkout, no payment.
            </p>

            <div className="flex flex-col" style={{ gap: 8, paddingTop: 4 }}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className="flex items-center justify-center w-full"
                style={{
                  height: 44, borderRadius: 12, border: "none",
                  backgroundColor: "var(--primary-500)",
                  color: "var(--white)",
                  fontSize: "var(--text-sm)", fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: 0.2,
                }}
              >
                Claim now
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="flex items-center justify-center w-full"
                style={{
                  height: 36, borderRadius: 12, border: "none",
                  backgroundColor: "transparent",
                  color: "var(--muted-foreground)",
                  fontSize: "var(--text-sm)", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Not now
              </motion.button>
            </div>
          </motion.div>
        )}

        {phase === "success" && record && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="flex flex-col items-center"
            style={{ gap: 12, padding: "24px 8px 8px" }}
          >
            <div
              aria-hidden
              className="flex items-center justify-center"
              style={{
                width: 64, height: 64, borderRadius: 9999,
                backgroundColor: "color-mix(in srgb, var(--success-500) 16%, transparent)",
              }}
            >
              <Check size={32} style={{ color: "var(--success-500)" }} strokeWidth={3} />
            </div>
            <h2 style={{
              fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)",
              margin: 0, letterSpacing: -0.2, textAlign: "center",
            }}>
              Reward claimed
            </h2>
            <p style={{
              fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
              margin: 0, textAlign: "center", maxWidth: 300, lineHeight: 1.55,
            }}>
              {record.rewardLabel} is now in My Test Series.
            </p>
            <div className="flex flex-col w-full" style={{ gap: 8, paddingTop: 12 }}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onViewLibrary}
                className="flex items-center justify-center w-full"
                style={{
                  height: 44, borderRadius: 12, border: "none",
                  backgroundColor: "var(--primary-500)",
                  color: "var(--white)",
                  fontSize: "var(--text-sm)", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                View My Test Series
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="flex items-center justify-center w-full"
                style={{
                  height: 36, borderRadius: 12, border: "none",
                  backgroundColor: "transparent",
                  color: "var(--muted-foreground)",
                  fontSize: "var(--text-sm)", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </FeedbackSheet>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <span style={{
        fontSize: "var(--text-2xs)", fontWeight: 700,
        color: "var(--muted-foreground)",
        letterSpacing: 0.8, textTransform: "uppercase",
      }}>
        {title}
      </span>
      {children}
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

interface HeroProps {
  rewardLabel: string;
  rewardDescription: string;
  unredeemedCount: number;
  onInvite: () => void;
}

function Hero({ rewardLabel, rewardDescription, unredeemedCount, onInvite }: HeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        borderRadius: 16,
        padding: 20,
        backgroundColor: "var(--card)",
        backgroundImage: "linear-gradient(135deg, color-mix(in srgb, var(--primary-500) 12%, transparent) 0%, transparent 60%)",
        border: "1px solid color-mix(in srgb, var(--primary-500) 24%, transparent)",
        color: "var(--foreground)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div aria-hidden style={{
        position: "absolute", top: -40, right: -40,
        width: 140, height: 140, borderRadius: 9999,
        background: "color-mix(in srgb, var(--primary-500) 6%, transparent)",
      }} />

      <div className="flex flex-col" style={{ gap: 16, position: "relative" }}>
        <div className="flex items-center justify-between" style={{ gap: 8 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <div
              aria-hidden
              className="flex items-center justify-center shrink-0"
              style={{
                width: 32, height: 32, borderRadius: 9999,
                backgroundColor: "color-mix(in srgb, var(--primary-500) 18%, transparent)",
              }}
            >
              <Gift size={16} style={{ color: "var(--primary-500)" }} />
            </div>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--muted-foreground)" }}>
              {unredeemedCount > 0 ? "Earn another reward" : "Your next reward"}
            </span>
          </div>
        </div>

        <div className="flex flex-col" style={{ gap: 4 }}>
          <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, letterSpacing: -0.3, color: "var(--foreground)" }}>
            {rewardLabel}
          </span>
          <span style={{ fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--muted-foreground)" }}>
            {rewardDescription}
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onInvite}
          className="flex items-center justify-center"
          style={{
            height: 44, borderRadius: 12,
            border: "none",
            backgroundColor: "var(--primary-500)",
            color: "var(--white)",
            fontSize: "var(--text-sm)", fontWeight: 600,
            cursor: "pointer",
            gap: 8,
          }}
        >
          <Send size={16} />
          Invite a friend
        </motion.button>

        <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textAlign: "center" }}>
          Friend gets ₹300 OFF · You earn when they buy
        </span>
      </div>
    </motion.div>
  );
}

// ─── Voucher card (for claimable rewards) ────────────────────────────────────

function VoucherCard({ record, onClaim }: { record: ReferralRecord; onClaim: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      onClick={onClaim}
      className="flex items-center w-full"
      style={{
        padding: 12,
        borderRadius: 12,
        backgroundColor: "var(--card)",
        border: "none",
        gap: 12,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div
        aria-hidden
        className="flex items-center justify-center shrink-0"
        style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: "var(--success-d2)",
          color: "var(--success-500)",
        }}
      >
        <Sparkles size={18} />
      </div>
      <div className="flex flex-col" style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
          {record.rewardLabel}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
          Earned from {record.friendDisplayName}
        </span>
      </div>
      <span
        aria-hidden
        className="flex items-center shrink-0"
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 700,
          color: "var(--success-500)",
          gap: 4,
        }}
      >
        Claim
        <ArrowRight size={14} />
      </span>
    </motion.button>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepRow({ step, title, body, last }: { step: number; title: string; body: string; last?: boolean }) {
  return (
    <div className="flex items-start" style={{ padding: 16, gap: 12, borderBottom: last ? "none" : undefined }}>
      <div
        aria-hidden
        className="flex items-center justify-center shrink-0"
        style={{
          width: 32, height: 32, borderRadius: 9999,
          backgroundColor: "color-mix(in srgb, var(--primary-500) 14%, transparent)",
          color: "var(--primary-500)",
          fontSize: "var(--text-sm)", fontWeight: 700,
        }}
      >
        {step}
      </div>
      <div className="flex flex-col" style={{ gap: 2 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
          {title}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.55 }}>
          {body}
        </span>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div aria-hidden style={{
      height: 0.5,
      backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)",
      margin: "0 16px",
    }} />
  );
}

// ─── Referral row ────────────────────────────────────────────────────────────

function ReferralRow({ record }: { record: ReferralRecord }) {
  const status = statusMeta(record.status);
  const relativeTime = formatRelativeTime(record.invitedAt);

  return (
    <div
      className="flex items-center w-full"
      style={{
        padding: 12,
        borderRadius: 12,
        backgroundColor: "var(--card)",
        gap: 12,
      }}
    >
      <FriendAvatar />

      <div className="flex flex-col" style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
          {record.friendDisplayName}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.45 }}>
          {relativeTime} · {status.label}
        </span>
      </div>
    </div>
  );
}

function FriendAvatar() {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div
      aria-hidden
      className="flex items-center justify-center shrink-0"
      style={{
        width: 40, height: 40, borderRadius: 9999,
        overflow: "hidden",
        backgroundColor: "var(--card-bg-secondary)",
      }}
    >
      {imgFailed ? (
        <UserIcon size={20} style={{ color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
      ) : (
        <img
          src={FRIEND_AVATAR_URL}
          alt=""
          onError={() => setImgFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </div>
  );
}

function statusMeta(status: ReferralStatus): { label: string } {
  switch (status) {
    case "invited":   return { label: "Invited" };
    case "installed": return { label: "Just joined" };
    case "purchased": return { label: "Purchased" };
    case "unlocked":  return { label: "Reward unlocked" };
    case "claimed":   return { label: "Reward claimed" };
    case "expired":   return { label: "Expired" };
  }
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
