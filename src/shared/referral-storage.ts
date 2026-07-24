/**
 * Referral storage — state for the share/refer feature.
 *
 * Model:
 *  - Each referral is one record (status: invited → installed → purchased → reward unlocked / expired)
 *  - Persona-adaptive reward mapping is segment-driven (server-side in real impl)
 *  - Module-level (no localStorage) so the demo resets on full refresh — same
 *    contract as feedback-storage.ts.
 */

import { useState, useEffect } from "react";

const EVENT_NAME = "referral-storage-change";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

function useReferralSubscription() {
  const [, force] = useState(0);
  useEffect(() => {
    const h = () => force((n) => n + 1);
    window.addEventListener(EVENT_NAME, h);
    return () => window.removeEventListener(EVENT_NAME, h);
  }, []);
}

// ─── Persona-adaptive reward mapping ─────────────────────────────────────────
// TODO(api): GET /api/referrals/reward-mapping?segment=...
// Maps each referrer's primary engagement segment to their next-tier reward.

export type ReferrerSegment =
  | "practice-6-10"
  | "jee-neet-crash"
  | "cat-test-prep"
  | "mock-buyer"
  | "upsc"
  | "skill-course"
  | "unknown";

export interface SegmentReward {
  label: string;          // human-readable reward name
  description: string;    // one-line elaboration
}

const SEGMENT_REWARDS: Record<ReferrerSegment, SegmentReward> = {
  "practice-6-10":   { label: "1 month unlimited practice",            description: "Unlimited practice questions + NCERT premium for 30 days" },
  "jee-neet-crash":  { label: "1 free mock pack",                      description: "Mock pack matching your exam — yours when your friend's purchase confirms" },
  "cat-test-prep":   { label: "1 free crash-course module",            description: "DI/LR intensive week, on the house" },
  "mock-buyer":      { label: "1 free month of new mock series",       description: "Or pick a doubt-clearing session instead" },
  "upsc":            { label: "1 month current-affairs monthly",       description: "30 days of curated daily current affairs" },
  "skill-course":    { label: "1 free skill course",                   description: "Similar-level skill course — your pick" },
  "unknown":         { label: "₹99 OFF next purchase",                 description: "Token credit, auto-applied at checkout" },
};

// Current user's segment — settable for demo. Defaults to JEE/NEET crash since
// the customer-call signal came from that cohort.
let CURRENT_SEGMENT: ReferrerSegment = "jee-neet-crash";

export function getSegmentReward(segment: ReferrerSegment): SegmentReward {
  return SEGMENT_REWARDS[segment];
}

// ─── Referrals ────────────────────────────────────────────────────────────────
// TODO(api): POST /api/referrals — { friendIdentifier, referrerCode, ts }
// TODO(api): GET /api/referrals/mine?status=...

export type ReferralStatus = "invited" | "installed" | "purchased" | "unlocked" | "claimed" | "expired";

export interface ReferralRecord {
  id: string;
  friendDisplayName: string;     // first name or initial
  status: ReferralStatus;
  invitedAt: number;             // epoch ms
  rewardLabel: string;           // captured at trigger fire — locks even if segment changes later
  rewardDescription: string;
}

const REFERRALS: ReferralRecord[] = [];
let REFERRAL_COUNTER = 0;

// Seed demo records. We only track referrals once the friend has installed
// and signed up — sending a WhatsApp link gives us no proof of delivery or
// receipt, so we don't persist "Invite sent" rows in the dashboard. The
// 2 unlocked + 1 installed seed lets us preview the multi-voucher state.
(function seedDemo() {
  const now = Date.now();
  const rew = SEGMENT_REWARDS[CURRENT_SEGMENT];
  REFERRALS.push(
    {
      id: "ref-001",
      friendDisplayName: "Karan",
      status: "unlocked",
      invitedAt: now - 1000 * 60 * 60 * 24 * 8,
      rewardLabel: rew.label,
      rewardDescription: rew.description,
    },
    {
      id: "ref-002",
      friendDisplayName: "Sneha",
      status: "unlocked",
      invitedAt: now - 1000 * 60 * 60 * 24 * 4,
      rewardLabel: rew.label,
      rewardDescription: rew.description,
    },
    {
      id: "ref-003",
      friendDisplayName: "Aditi",
      status: "installed",
      invitedAt: now - 1000 * 60 * 60 * 24 * 3,
      rewardLabel: rew.label,
      rewardDescription: rew.description,
    },
  );
})();

export function useReferrals() {
  useReferralSubscription();
  const all = [...REFERRALS];
  const counts = {
    invited:   all.filter((r) => r.status === "invited").length,
    installed: all.filter((r) => r.status === "installed").length,
    purchased: all.filter((r) => r.status === "purchased").length,
    unlocked:  all.filter((r) => r.status === "unlocked").length,
    claimed:   all.filter((r) => r.status === "claimed").length,
    expired:   all.filter((r) => r.status === "expired").length,
  };
  return {
    all,
    counts,
    total: all.length,
    unredeemedUnlocked: counts.unlocked,
    segment: CURRENT_SEGMENT,
    currentReward: SEGMENT_REWARDS[CURRENT_SEGMENT],
    setSegment(s: ReferrerSegment) {
      if (CURRENT_SEGMENT === s) return;
      CURRENT_SEGMENT = s;
      emit();
    },
    // Stub for the post-share moment. Intentionally does NOT persist a
    // "pending invite" row — we have no way of knowing whether the link
    // was actually delivered, opened, or received. Dashboard rows only
    // appear once the friend installs (real signal from attribution).
    // TODO(api): POST /api/referrals/track-share — analytics-only event
    recordShare(_channel: string) {
      // Intentional no-op for the demo. Real impl: fire analytics event.
      void _channel;
    },
    // Mark an unlocked reward as claimed (added to the user's library).
    // TODO(api): POST /api/referrals/:id/claim — server adds entitlement
    claimReward(referralId: string) {
      const idx = REFERRALS.findIndex((r) => r.id === referralId);
      if (idx === -1) return;
      if (REFERRALS[idx].status !== "unlocked") return;
      REFERRALS[idx] = { ...REFERRALS[idx], status: "claimed" };
      emit();
    },
  };
}

// ─── Trigger cooldowns + state machine ───────────────────────────────────────
// Mirrors PRD §4 — global 14-day cooldown, 90-day post-share suppression,
// 1-year hard cooldown on "Don't show again", suppress ≤3-rating users.
//
// Module-level (resets on refresh), simple Date.now() comparisons.

const COOLDOWNS: Record<string, number> = {};

const DAY_MS = 24 * 60 * 60 * 1000;

const KEY_GLOBAL          = "ref.global";              // any-trigger 14-day cooldown
const KEY_POST_SHARE      = "ref.postshare";           // 90 days after a successful share
const KEY_DONT_SHOW_AGAIN = "ref.dontshow";            // 1 year
const KEY_LOW_RATING      = "ref.lowrating";           // 14 days after ≤3 feedback

export function isAnyCooldownActive(): boolean {
  const now = Date.now();
  return [KEY_GLOBAL, KEY_POST_SHARE, KEY_DONT_SHOW_AGAIN, KEY_LOW_RATING]
    .some((k) => (COOLDOWNS[k] ?? 0) > now);
}

export function startGlobalCooldown(days = 14) {
  COOLDOWNS[KEY_GLOBAL] = Date.now() + days * DAY_MS;
  emit();
}

export function startPostShareSuppression(days = 90) {
  COOLDOWNS[KEY_POST_SHARE] = Date.now() + days * DAY_MS;
  emit();
}

export function startDontShowAgain(days = 365) {
  COOLDOWNS[KEY_DONT_SHOW_AGAIN] = Date.now() + days * DAY_MS;
  emit();
}

export function registerLowRating(days = 14) {
  COOLDOWNS[KEY_LOW_RATING] = Date.now() + days * DAY_MS;
  emit();
}

// Sheet-fired-this-session guard. Prevents the post-feedback chain from
// triggering twice if the user re-enters live class within the same tab.
let FIRED_THIS_SESSION = false;
export function hasFiredThisSession() { return FIRED_THIS_SESSION; }
export function markFiredThisSession() { FIRED_THIS_SESSION = true; emit(); }
