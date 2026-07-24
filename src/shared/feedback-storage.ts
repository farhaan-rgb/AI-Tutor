/**
 * Feedback storage — shared module-level state for the 3 feedback features:
 *  1. Discover wishlist entries
 *  2. Post-live-class feedback
 *  3. Test Series reviews (per-pack)
 *
 * Module-level (not localStorage) so the demo resets on full page refresh —
 * stakeholders can re-walk each flow without dev-tool clearing. Real impl
 * sends to `// TODO(api): POST /...` markers below.
 */

import { useState, useEffect } from "react";

const EVENT_NAME = "feedback-storage-change";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

function useFeedbackSubscription() {
  const [, force] = useState(0);
  useEffect(() => {
    const h = () => force((n) => n + 1);
    window.addEventListener(EVENT_NAME, h);
    return () => window.removeEventListener(EVENT_NAME, h);
  }, []);
}

// ─── GYD Max entitlement (shared) ────────────────────────────────────────────
// Single source of truth for "does this student have GYD Max?". Used by the
// Class 6 crash course gate today; other paid surfaces can read the same flag
// when their entitlement story lands. Module-level so the demo resets on full
// refresh (per file-level convention above).
// TODO(api): GET /api/user/entitlements/gyd-max

let GYD_MAX_ACTIVE = false;

export function useGydMax() {
  useFeedbackSubscription();
  return {
    active: GYD_MAX_ACTIVE,
    setActive(v: boolean) {
      if (GYD_MAX_ACTIVE === v) return;
      GYD_MAX_ACTIVE = v;
      emit();
    },
  };
}

// ─── VocabularyFast purchases + progress ─────────────────────────────────────
// State for the VocabularyFast marketplace integration:
//  1. Which packs the student has purchased
//  2. Mock progress (words mastered, streak, last activity) per pack — used by
//     /classes card and the post-purchase "Open" experience.
// Module-level so the demo resets on refresh (per file-level convention).
// TODO(api): GET /api/vocabfast/purchases — entitlement list
// TODO(api): GET /api/vocabfast/progress?packs=...&userId=...

export interface VocabFastProgress {
  packId: string;
  wordsMastered: number;
  totalWords: number;
  streakDays: number;
  recallRatePct: number;
  lastActivityAt: number;   // epoch ms
}

const VOCABFAST_PURCHASED = new Set<string>();
const VOCABFAST_PROGRESS = new Map<string, VocabFastProgress>();

// Seed a couple of packs as already-purchased for demo so /classes has
// something to render without a fresh purchase. Toolbar shortcut "/classes ·
// vocabfast active" surfaces this state. Comment-out to start empty.
(function seedDemo() {
  // Empty by default — student starts fresh, purchases reveal /classes card.
  // To preview the purchased state, uncomment the lines below:
  // VOCABFAST_PURCHASED.add("vf-cat");
  // VOCABFAST_PROGRESS.set("vf-cat", {
  //   packId: "vf-cat",
  //   wordsMastered: 47,
  //   totalWords: 750,
  //   streakDays: 12,
  //   recallRatePct: 84,
  //   lastActivityAt: Date.now() - 1000 * 60 * 60 * 6,
  // });
})();

export function useVocabFastPurchases() {
  useFeedbackSubscription();
  return {
    purchasedIds: Array.from(VOCABFAST_PURCHASED),
    isPurchased(packId: string) {
      return VOCABFAST_PURCHASED.has(packId);
    },
    purchase(packId: string, opts?: { totalWords?: number }) {
      if (VOCABFAST_PURCHASED.has(packId)) return;
      VOCABFAST_PURCHASED.add(packId);
      // Initialize a fresh progress record so the /classes card has data.
      VOCABFAST_PROGRESS.set(packId, {
        packId,
        wordsMastered: 0,
        totalWords: opts?.totalWords ?? 0,
        streakDays: 0,
        recallRatePct: 0,
        lastActivityAt: Date.now(),
      });
      emit();
    },
    progress(packId: string): VocabFastProgress | null {
      return VOCABFAST_PROGRESS.get(packId) ?? null;
    },
    allProgress(): VocabFastProgress[] {
      return Array.from(VOCABFAST_PROGRESS.values());
    },
    // Demo helper: increment a pack's progress without going through the real
    // VocabFast loop. Useful for showing the /classes card with realistic data.
    bumpProgress(packId: string, deltaMastered: number, deltaStreak: number) {
      const existing = VOCABFAST_PROGRESS.get(packId);
      if (!existing) return;
      VOCABFAST_PROGRESS.set(packId, {
        ...existing,
        wordsMastered: Math.min(existing.totalWords, existing.wordsMastered + deltaMastered),
        streakDays: existing.streakDays + deltaStreak,
        lastActivityAt: Date.now(),
      });
      emit();
    },
  };
}

// Sample-flow completion state — once a student finishes the 3 free words on a
// pack, we record it so they can't replay (matches VocabularyFast's own
// behaviour). Resets if they actually buy the pack (no longer needed gated).
const VOCABFAST_SAMPLE_COMPLETED = new Set<string>();

export function useVocabFastSample() {
  useFeedbackSubscription();
  return {
    isCompleted(packId: string) {
      return VOCABFAST_SAMPLE_COMPLETED.has(packId);
    },
    markCompleted(packId: string) {
      if (VOCABFAST_SAMPLE_COMPLETED.has(packId)) return;
      VOCABFAST_SAMPLE_COMPLETED.add(packId);
      emit();
    },
    reset(packId: string) {
      if (!VOCABFAST_SAMPLE_COMPLETED.has(packId)) return;
      VOCABFAST_SAMPLE_COMPLETED.delete(packId);
      emit();
    },
  };
}

// ─── Wishlist / general-purpose request ──────────────────────────────────────
// TODO(api): POST /api/requests — { message, contactPhone, source }
export interface WishlistEntry {
  message: string;           // free-text — anything the user wants to ask for
  contactPhone: string;      // optional — when present, send WhatsApp updates
  submittedAt: number;       // epoch ms
  source: string;            // where the sheet was triggered from (free string)
}

const WISHLIST: WishlistEntry[] = [];

export function useWishlist() {
  useFeedbackSubscription();
  return {
    entries: [...WISHLIST],
    submittedThisSession: WISHLIST.length > 0,
    submit(entry: Omit<WishlistEntry, "submittedAt">) {
      WISHLIST.push({ ...entry, submittedAt: Date.now() });
      emit();
    },
  };
}

// ─── Live class feedback ──────────────────────────────────────────────────────
// TODO(api): POST /api/live-classes/:id/feedback — { rating, techIssues[], classIssues[], comment }
export interface ClassFeedback {
  classId: string;
  rating: number;            // 1–5 (face index)
  techIssues: string[];      // when rating <= 3
  classIssues: string[];     // when rating <= 3
  comment: string;
  submittedAt: number;
}

const CLASS_FEEDBACK: Record<string, ClassFeedback> = {};

export function useClassFeedback(classId: string) {
  useFeedbackSubscription();
  return {
    hasRated: !!CLASS_FEEDBACK[classId],
    rating: CLASS_FEEDBACK[classId]?.rating,
    submit(payload: Omit<ClassFeedback, "classId" | "submittedAt">) {
      CLASS_FEEDBACK[classId] = { ...payload, classId, submittedAt: Date.now() };
      emit();
    },
  };
}

// ─── Test Series reviews ──────────────────────────────────────────────────────
// Single source of truth for review-tag value → label mapping. Used by the
// write sheet (chip options) AND the reviews-all list (rendered as pills) so
// no slug/label drift. Add new tags here.
export const REVIEW_TAG_LABELS: Record<string, string> = {
  "concept-clarity":  "Concept clarity",
  "difficulty":       "Difficulty matches real exam",
  "solutions":        "Solutions clear",
  "mock-pattern":     "Mock pattern accurate",
  "syllabus":         "Full syllabus covered",
  "shortcut":         "Good shortcuts taught",
};

export function formatReviewTag(slugOrLabel: string): string {
  // Seed reviews historically stored full labels; user reviews store slugs.
  // Look up by slug; fall back to as-is for already-labelled tags.
  return REVIEW_TAG_LABELS[slugOrLabel] ?? slugOrLabel;
}

// TODO(api): POST /api/test-series/:packId/reviews — { rating, tags[], comment, anonymous }
// TODO(api): GET /api/test-series/:packId/reviews?sort=helpful&filter=5&page=1
// TODO(api): POST /api/reviews/:id/helpful (for the ThumbsUp button in reviews-all)
export interface UserReview {
  packId: string;
  authorHandle: string;      // student handle or "Anonymous"
  authorBadge?: string;      // e.g., "Verified buyer · Day 18 of prep"
  verified: boolean;
  anonymous: boolean;
  isOwn: boolean;            // true when this is the current user's own review
                             // (gates the "Your rating is live · Edit" banner —
                             // can't rely on authorHandle since anonymous = "Anonymous")
  rating: number;            // 1–5
  tags: string[];            // chip selections
  comment: string;
  submittedAt: number;
  helpfulCount: number;
}

// DUMMY seed reviews for COURSES that users have purchased + are using —
// crash courses (Class 6–10) and test-prep courses (CAT / JEE Mains / JEE Adv).
// Cold-start social proof, labelled "Verified Student" reviews.
// TODO(api): GET /api/courses/:courseId/reviews?seed=true  (or drop once a
// real verified-students table backs this).
const DUMMY_SEED_REVIEWS: Record<string, UserReview[]> = {
  // ─── Crash courses (per class) ───
  "crash-9": [
    {
      packId: "crash-9",
      authorHandle: "Karthik V.",
      authorBadge: "Verified student · Class 9 · 8 weeks in",
      verified: true, anonymous: false, isOwn: false,
      rating: 5,
      tags: ["Concept clarity", "Good shortcuts taught"],
      comment: "Maths chapters finally clicked. The shortcut for quadratic factoring saved me in the unit test.",
      submittedAt: Date.now() - 1000 * 60 * 60 * 24 * 16,
      helpfulCount: 92,
    },
    {
      packId: "crash-9",
      authorHandle: "Anushka R.",
      authorBadge: "Verified student · Class 9 · 3 weeks in",
      verified: true, anonymous: false, isOwn: false,
      rating: 4,
      tags: ["Concept clarity"],
      comment: "Science is well taught — physics specifically. Wish there were more practice questions after each chapter.",
      submittedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
      helpfulCount: 41,
    },
    {
      packId: "crash-9",
      authorHandle: "Devansh M.",
      authorBadge: "Verified student · Class 9 · 5 weeks in",
      verified: true, anonymous: false, isOwn: false,
      rating: 3,
      tags: ["Difficulty matches real exam"],
      comment: "Honestly mixed. Maths is excellent but some science topics feel rushed.",
      submittedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
      helpfulCount: 28,
    },
  ],
  // ─── Test-prep courses (per exam key) ───
  "cat": [
    {
      packId: "cat",
      authorHandle: "Ishaan G. · 99.4 %ile",
      authorBadge: "Verified Student · CAT 2024",
      verified: true, anonymous: false, isOwn: false,
      rating: 5,
      tags: ["Concept clarity", "Mock pattern accurate"],
      comment: "DILR sections were a game-changer. The pattern-recognition tricks shaved 12 minutes off my mocks.",
      submittedAt: Date.now() - 1000 * 60 * 60 * 24 * 24,
      helpfulCount: 187,
    },
    {
      packId: "cat",
      authorHandle: "Meera K.",
      authorBadge: "Verified student · 2 months in",
      verified: true, anonymous: false, isOwn: false,
      rating: 4,
      tags: ["Concept clarity", "Good shortcuts taught"],
      comment: "QA fundamentals are taught well. VARC could use more RC drills.",
      submittedAt: Date.now() - 1000 * 60 * 60 * 24 * 11,
      helpfulCount: 64,
    },
    {
      packId: "cat",
      authorHandle: "Tanvi A.",
      authorBadge: "Verified student · 5 weeks in",
      verified: true, anonymous: false, isOwn: false,
      rating: 3,
      tags: ["Difficulty matches real exam"],
      comment: "Live classes are great but some recorded sessions feel dated. Helpful overall.",
      submittedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
      helpfulCount: 39,
    },
  ],
  "jee-mains": [
    {
      packId: "jee-mains",
      authorHandle: "Aarav P. · AIR 1,432",
      authorBadge: "Verified Student · JEE Main 2025",
      verified: true, anonymous: false, isOwn: false,
      rating: 5,
      tags: ["Concept clarity", "Solutions clear"],
      comment: "Physics derivations are the cleanest I've seen. Maths is the only place I wish for more shortcut drills.",
      submittedAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
      helpfulCount: 142,
    },
    {
      packId: "jee-mains",
      authorHandle: "Sneha M.",
      authorBadge: "Verified student · 6 weeks in",
      verified: true, anonymous: false, isOwn: false,
      rating: 4,
      tags: ["Concept clarity", "Mock pattern accurate"],
      comment: "Solid program. Chemistry inorganic chapters are taught with real-life context which helps a lot.",
      submittedAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
      helpfulCount: 57,
    },
  ],
};

const USER_REVIEWS: Record<string, UserReview[]> = {};

export function useReviews(packId: string) {
  useFeedbackSubscription();
  const seed = DUMMY_SEED_REVIEWS[packId] ?? [];
  const userAdded = USER_REVIEWS[packId] ?? [];
  const all = [...userAdded, ...seed]; // user's own review surfaces first
  const avg = all.length === 0
    ? 0
    : Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10;
  // Distribution: count per star bucket. Clamp ratings 1..5 so any malformed
  // value (e.g., 0 or 6) doesn't write to an undefined bucket.
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  all.forEach((r) => {
    const clamped = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[clamped]++;
  });
  return {
    reviews: all,
    average: avg,
    total: all.length,
    distribution,
    // userOwnReview uses isOwn flag (not authorHandle string) so anonymous
    // reviews still resolve to "this is mine" for the banner state.
    userOwnReview: userAdded.find((r) => r.isOwn) ?? null,
    submit(payload: Omit<UserReview, "packId" | "submittedAt" | "helpfulCount" | "authorHandle" | "authorBadge" | "verified" | "isOwn">) {
      const arr = USER_REVIEWS[packId] ?? [];
      USER_REVIEWS[packId] = [
        ...arr,
        {
          ...payload,
          packId,
          authorHandle: payload.anonymous ? "Anonymous" : "You",
          authorBadge: "Verified buyer · Day 1 of prep",
          verified: true,
          isOwn: true,
          submittedAt: Date.now(),
          helpfulCount: 0,
        },
      ];
      emit();
    },
  };
}

// Module-level cooldown store — used by both the dismiss-cooldown hook
// (below) and the auto-rise gating functions (next block). Declared up
// here so the auto-rise block can reference it without TDZ surprises.
const COOLDOWNS: Record<string, number> = {};

// ─── Course-review auto-rise trigger ─────────────────────────────────────────
// Sagar wants the review sheet to *occasionally* rise on its own after the
// student leaves a class — but with a passive banner as the always-available
// fallback. Rules (per UX Flow Agent):
//   - Fire after the user has accumulated >= 3 class-exits for this courseId
//   - Never when they've already submitted a review
//   - Fire on the NEXT hub mount (learning-path / crash-course-hub) — not on
//     the player itself, so the sheet appears in the course context
//   - 14-day cooldown between auto-rises (separate from the 7-day banner-dismiss)
//   - 1 auto-rise per session, hard cap
//
// State lives in sessionStorage so it persists across an in-tab refresh but
// resets on a fresh tab — matches the demo's "reset on refresh" contract.

const MIN_EXITS_BEFORE_AUTORISE = 3;
const AUTORISE_COOLDOWN_DAYS = 14;

const SS_CURRENT_COURSE = "pm.feedback.currentCourseId";
const SS_EXIT_COUNT     = "pm.feedback.classExitCount.";   // + courseId
const SS_PENDING        = "pm.feedback.pendingAutorise";
const SS_FIRED_SESSION  = "pm.feedback.firedThisSession";  // 1-per-session cap

/** learning-path / crash-course-hub call this on mount so class-exit handlers
 *  in player screens can attribute the exit to the right course. */
export function setCurrentCourseId(courseId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SS_CURRENT_COURSE, courseId);
}

export function getCurrentCourseId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SS_CURRENT_COURSE);
}

/** Called from live-class.tsx and recording-player.tsx when the student exits.
 *  Increments the per-course counter and queues the auto-rise if all gates pass. */
export function recordClassExit(courseId: string | null): void {
  if (typeof window === "undefined" || !courseId) return;

  // Gate 0 — one fire per session, hard cap
  if (sessionStorage.getItem(SS_FIRED_SESSION) === "1") return;

  // Gate 1 — already submitted? Never auto-rise.
  const seedAndUser = [
    ...(DUMMY_SEED_REVIEWS[courseId] ?? []),
    ...(USER_REVIEWS[courseId] ?? []),
  ];
  if (seedAndUser.some((r) => r.isOwn)) return;

  // Gate 2 — active 14-day cooldown? Skip.
  const cooldownUntil = COOLDOWNS[`rate-autorise-${courseId}`] ?? 0;
  if (cooldownUntil > Date.now()) return;

  // Gate 3 — banner's own 7-day cooldown? If user dismissed the banner
  // entirely, also skip the auto-rise (consistent dismiss semantics).
  if ((COOLDOWNS[`rate-${courseId}`] ?? 0) > Date.now()) return;

  // Increment + decide
  const key = SS_EXIT_COUNT + courseId;
  // Guard against a poisoned key (e.g., a "NaN" string written by some other
  // tab or older session) — fall back to a fresh count of 1.
  const prev = parseInt(sessionStorage.getItem(key) ?? "0", 10);
  const count = (Number.isFinite(prev) ? prev : 0) + 1;

  if (count >= MIN_EXITS_BEFORE_AUTORISE) {
    sessionStorage.setItem(SS_PENDING, courseId);
    sessionStorage.removeItem(key);                          // reset for next round
  } else {
    sessionStorage.setItem(key, String(count));
  }
}

/** Banner reads this on mount. If it matches the banner's courseId, the
 *  banner auto-opens and clears the flag. Caller handles skip cooldown. */
export function consumePendingAutorise(courseId: string): boolean {
  if (typeof window === "undefined") return false;
  const pending = sessionStorage.getItem(SS_PENDING);
  if (pending !== courseId) return false;
  sessionStorage.removeItem(SS_PENDING);
  sessionStorage.setItem(SS_FIRED_SESSION, "1");
  return true;
}

/** Manually set the auto-rise cooldown (called when the user dismisses the
 *  auto-risen sheet without submitting). */
export function setAutoriseCooldown(courseId: string, days: number = AUTORISE_COOLDOWN_DAYS): void {
  COOLDOWNS[`rate-autorise-${courseId}`] = Date.now() + days * 24 * 60 * 60 * 1000;
  emit();
}

// ─── Dismissal cooldowns ─────────────────────────────────────────────────────
// Prevents nag loops (e.g., wishlist card hides for the session after submit;
// live class feedback silences for 7 days after a skip). `COOLDOWNS` module
// store is declared above the auto-rise block.

export function useDismissCooldown(key: string, days: number = 7) {
  useFeedbackSubscription();
  const dismissedUntil = COOLDOWNS[key] ?? 0;
  return {
    dismissed: dismissedUntil > Date.now(),
    dismiss() {
      COOLDOWNS[key] = Date.now() + days * 24 * 60 * 60 * 1000;
      emit();
    },
    clear() {
      delete COOLDOWNS[key];
      emit();
    },
  };
}
