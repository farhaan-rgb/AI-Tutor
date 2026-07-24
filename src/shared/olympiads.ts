/**
 * Olympiads — the "live event" variant of test series.
 *
 * Unlike test series (self-paced, take anytime), an Olympiad is ONE exam that
 * EVERYONE sits in the SAME fixed time window. Entry is free or GYD-Max-exclusive
 * (per Olympiad). After the window closes there is a leaderboard, rank-based +
 * participation certificates, deep analytics and a feedback capture.
 *
 * The exam itself REUSES the test-series taking engine — see `getOlympiadPack`,
 * which projects an Olympiad into a `MyTestSeriesPack` so `getPackById` →
 * instructions → /take → grading all work unchanged. Only the productization
 * BEFORE the exam (discovery, registration, payment, waiting room, live
 * lockout) and AFTER (rank, leaderboard, certificate, analytics, feedback) is
 * new — and that is what this module + the `olympiad-*` screens own.
 *
 * Demo timing: schedule fields are computed once at module load relative to
 * `BASE = Date.now()`, so a fresh page gives one Olympiad live-now, one
 * upcoming, one closing-soon and two ended (one attempted, one missed). State
 * (registrations + attempts) lives in module memory and resets on full refresh
 * — same convention as games-pass-state.ts — so stakeholders can re-walk the
 * flow repeatedly. The "ended + attempted" Olympiad is pre-seeded so its whole
 * post-exam surface (result, leaderboard, certificate, analytics) is viewable
 * without sitting the exam.
 *
 * TODO(api): replace DUMMY_OLYMPIADS + the in-memory store with
 *   GET  /api/olympiads                       — catalogue
 *   GET  /api/olympiads/:id                    — detail + live schedule
 *   POST /api/olympiads/:id/register           — free or post-payment
 *   POST /api/olympiads/:id/submit             — attempt + server-side grade
 *   GET  /api/olympiads/:id/leaderboard?scope= — ranked entries
 *   GET  /api/olympiads/:id/certificate        — participation / rank artifact
 */

import { useState, useEffect } from "react";
import type {
  MyTestSeriesPack,
  ExamType,
  MockResult,
} from "./test-series-progress";
import type { Certificate } from "./certificates";

// ─── Types ───────────────────────────────────────────────────────────────────

export type OlympiadIconKey = "math" | "science" | "aptitude" | "general";

export interface OlympiadPrize {
  rank: string;   // "Rank 1", "Rank 2–10", "Top 100"
  reward: string; // "₹50,000 + Gold medal", "Certificate of Merit"
  /** Optional override for how the reward is fulfilled; inferred from text if absent. */
  kind?: RewardKind;
}

// How a won reward is fulfilled. `voucher` = Amazon/brand e-voucher (code
// reveal); `goods` = physical white-good (address + KYC + shipping); `merit` =
// certificate/medal only (auto-issued, nothing to claim).
export type RewardKind = "voucher" | "goods" | "merit";

// Claim lifecycle for a real-value reward (voucher/goods). Merit needs no claim.
export type ClaimStatus = "unclaimed" | "pending" | "claimed" | "shipped" | "delivered";

// Infer how a piece of reward text is fulfilled. `splitPrizeRewards` classifies
// each component; medals/trophies count as `goods` (they ship), certificates as
// `merit` (auto-issued, nothing to claim).
function rewardKindFromText(text: string): RewardKind {
  const t = text.toLowerCase();
  if (/laptop|tablet|device|primebook|headphone|earbud|watch|kit|white\s?good|hamper|goodies|medal|trophy|merch|t-?shirt|bag/.test(t)) return "goods";
  if (/voucher|coupon|amazon|gift\s?card|cash|₹|rs\.?|inr/.test(t)) return "voucher";
  return "merit";
}

// Infer how a prize is fulfilled from its reward text (overridable via prize.kind).
export function rewardKind(prize: OlympiadPrize): RewardKind {
  if (prize.kind) return prize.kind;
  const t = prize.reward.toLowerCase();
  if (/laptop|tablet|device|primebook|headphone|watch|kit|white\s?good|hamper|goodies/.test(t)) return "goods";
  if (/voucher|coupon|amazon|gift\s?card|cash|₹|rs\.?|inr/.test(t)) return "voucher";
  return "merit";
}

// One fulfillable line within a prize tier. A tier reward like
// "₹20,000 + Gold medal + Trophy" splits into 3 components, each with its own
// fulfillment path (claim the cash voucher; the medal + trophy ship).
export interface RewardComponent { label: string; kind: RewardKind; }

export function splitPrizeRewards(prize: OlympiadPrize): RewardComponent[] {
  if (prize.kind) return [{ label: prize.reward, kind: prize.kind }];
  return prize.reward
    .split(/\s*\+\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((label) => ({ label, kind: rewardKindFromText(label) }));
}

export interface Olympiad {
  id: string;
  title: string;
  subject: string;
  examLabel: string;
  tagline: string;
  description: string;
  iconKey: OlympiadIconKey;
  accent: string;   // CSS var token
  /** Entry — `max` Olympiads are exclusive to GYD Max members (platform plan). */
  entryType: "free" | "max";
  price: number;          // 0 when free
  originalPrice: number;
  eligibility: string;    // "Class 11–12 · JEE/NEET aspirants"
  // ── Schedule (epoch ms) ──
  registrationOpensAt: number;
  registrationClosesAt: number;
  startsAt: number;        // common start instant for ALL participants
  durationMinutes: number;
  graceMinutes: number;    // late-join grace after startsAt
  resultsAt: number;       // when rank + leaderboard go live
  // ── Exam config (fed to the reused take engine) ──
  examType: ExamType;
  pattern: string;
  questionCount: number;
  sections: string[];
  maxScore: number;
  // ── Post-exam ──
  participantCount: number;
  prizes: OlympiadPrize[];
  /** Top-N ranks earn a rank/merit certificate; everyone else gets participation. */
  rankCertThreshold: number;
  organization: string;    // printed on the certificate
}

export type OlympiadPhase =
  | "upcoming"            // before registration opens
  | "registration-open"
  | "registration-closing" // < 24h to close
  | "live"               // exam window open right now
  | "grading"            // window closed, results not yet out
  | "results-out";       // leaderboard + certificates available

export interface OlympiadStatus {
  phase: OlympiadPhase;
  canRegister: boolean;
  registrationClosed: boolean;
  canEnter: boolean;       // live window open
  isLive: boolean;
  isUpcoming: boolean;
  isEnded: boolean;        // window closed (grading or results-out)
  resultsOut: boolean;
  windowEndsAt: number;
  msToStart: number;
  msToRegClose: number;
  msToResults: number;
}

export interface OlympiadAttempt {
  olympiadId: string;
  score: number;
  maxScore: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  timeTakenSeconds: number;
  sectionBreakdown: MockResult["sectionBreakdown"];
  perQuestion?: MockResult["perQuestion"];
  rank: number;
  percentile: number;
  submittedAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  city: string;
  school: string;
  score: number;
  isMe: boolean;
}

export type LeaderboardScope = "all-india" | "city" | "school";

// ─── Demo schedule anchors ─────────────────────────────────────────────────────

const BASE = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// ─── Catalogue ─────────────────────────────────────────────────────────────────

// TODO(api): GET /api/olympiads
export const DUMMY_OLYMPIADS: Olympiad[] = [
  // ── LIVE NOW (free) — started 5 min ago, 60-min window still open ──
  {
    id: "math-titans",
    title: "Math Titans National Olympiad",
    subject: "Mathematics",
    examLabel: "MATH TITANS",
    tagline: "Rank against India's sharpest minds.",
    description:
      "A national-level mathematics Olympiad conducted live across India. Every participant sits the same paper at the same time. When results drop, see exactly where you rank against the country's sharpest minds, earn a rank certificate, and benchmark your prep.",
    iconKey: "math",
    accent: "var(--primary-500)",
    entryType: "free",
    price: 0,
    originalPrice: 0,
    eligibility: "Class 11–12 · JEE aspirants",
    registrationOpensAt: BASE - 10 * DAY,
    registrationClosesAt: BASE - 5 * MIN,   // closed when it went live
    startsAt: BASE - 5 * MIN,                // LIVE: started 5 min ago
    durationMinutes: 60,
    graceMinutes: 10,
    resultsAt: BASE + 60 * MIN,
    examType: "nta",
    pattern: "NTA Pattern · +4 / −1",
    questionCount: 90,
    sections: ["Algebra", "Calculus", "Geometry"],
    maxScore: 360,
    participantCount: 48213,
    prizes: [
      { rank: "Rank 1", reward: "₹50,000 + Gold medal" },
      { rank: "Rank 2", reward: "₹25,000 + Silver medal" },
      { rank: "Rank 3", reward: "₹15,000 + Bronze medal" },
      { rank: "Rank 4–10", reward: "₹5,000 + Certificate of Merit" },
    ],
    rankCertThreshold: 100,
    organization: "Teachmint National Olympiads",
  },

  // ── REGISTRATION CLOSING SOON (free) — starts in 3h, reg closes in 1h ──
  {
    id: "aptitude-challenge",
    title: "All-India Aptitude Challenge",
    subject: "Logical & Quantitative Aptitude",
    examLabel: "APTITUDE",
    tagline: "Think fast. Rank high.",
    description:
      "A timed reasoning + quantitative aptitude Olympiad open to all streams. Sharpen the speed-and-accuracy edge that competitive exams reward, and see exactly where you stand nationally.",
    iconKey: "aptitude",
    accent: "var(--purple-500)",
    entryType: "free",
    price: 0,
    originalPrice: 0,
    eligibility: "Class 9–12 · All streams",
    registrationOpensAt: BASE - 6 * DAY,
    registrationClosesAt: BASE + 1 * HOUR,  // CLOSING SOON
    startsAt: BASE + 3 * HOUR,
    durationMinutes: 45,
    graceMinutes: 10,
    resultsAt: BASE + 3 * HOUR + 90 * MIN,
    examType: "nta",
    pattern: "NTA Pattern · +4 / −1",
    questionCount: 90,
    sections: ["Logical", "Quantitative", "Data"],
    maxScore: 360,
    participantCount: 12740,
    prizes: [
      { rank: "Rank 1–3", reward: "₹15,000 + medal" },
      { rank: "Rank 4–50", reward: "Certificate of Merit" },
      { rank: "Top 500", reward: "Digital badge" },
    ],
    rankCertThreshold: 50,
    organization: "Teachmint National Olympiads",
  },

  // ── UPCOMING (GYD Max) — registration open, starts in 2 days ──
  {
    id: "science-sprint",
    title: "Science Sprint Olympiad 2026",
    subject: "Physics · Chemistry · Biology",
    examLabel: "SCIENCE SPRINT",
    tagline: "For the future doctors & engineers of India.",
    description:
      "A premium science Olympiad modelled on the real NEET/JEE pattern. Included with GYD Max — a ₹1,00,000 prize pool and verified rank certificates recognised by partner institutes, at no extra cost to members.",
    iconKey: "science",
    accent: "var(--success-500)",
    entryType: "max",
    price: 0,
    originalPrice: 0,
    eligibility: "Class 11–12 · NEET/JEE aspirants",
    registrationOpensAt: BASE - 2 * DAY,
    registrationClosesAt: BASE + 2 * DAY - 2 * HOUR,
    startsAt: BASE + 2 * DAY,
    durationMinutes: 90,
    graceMinutes: 15,
    resultsAt: BASE + 2 * DAY + 4 * HOUR,
    examType: "nta",
    pattern: "NTA Pattern · +4 / −1",
    questionCount: 90,
    sections: ["Physics", "Chemistry", "Biology"],
    maxScore: 360,
    participantCount: 8920,
    prizes: [
      { rank: "Rank 1", reward: "₹50,000 + Gold medal" },
      { rank: "Rank 2–5", reward: "₹10,000 each + medal" },
      { rank: "Rank 6–100", reward: "Verified rank certificate" },
    ],
    rankCertThreshold: 100,
    organization: "Teachmint National Olympiads",
  },

  // ── ENDED · RESULTS OUT (GYD Max) — user ATTEMPTED (pre-seeded) ──
  {
    id: "jee-grand",
    title: "JEE Grand Challenge 2026",
    subject: "Physics · Chemistry · Maths",
    examLabel: "JEE GRAND",
    tagline: "The pre-boards every topper sat.",
    description:
      "A full-length JEE Main pattern Olympiad held nationally last week. Results are out — view your rank, the national leaderboard, your certificate and a deep analytics breakdown.",
    iconKey: "general",
    accent: "var(--warning-500)",
    entryType: "max",
    price: 0,
    originalPrice: 0,
    eligibility: "Class 12 · JEE aspirants",
    registrationOpensAt: BASE - 12 * DAY,
    registrationClosesAt: BASE - 2 * DAY - 2 * HOUR,
    startsAt: BASE - 2 * DAY,
    durationMinutes: 90,
    graceMinutes: 15,
    resultsAt: BASE - 2 * DAY + 4 * HOUR,   // results already out
    examType: "nta",
    pattern: "NTA Pattern · +4 / −1",
    questionCount: 90,
    sections: ["Physics", "Chemistry", "Maths"],
    maxScore: 360,
    participantCount: 64108,
    prizes: [
      { rank: "Rank 1", reward: "₹1,00,000 + Trophy" },
      { rank: "Rank 2–10", reward: "₹20,000 + medal" },
      { rank: "Rank 11–500", reward: "Rank certificate" },
    ],
    rankCertThreshold: 500,
    organization: "Teachmint National Olympiads",
  },

  // ── ENDED · RESULTS OUT (free) — user did NOT attempt (missed-it state) ──
  {
    id: "neet-warmup",
    title: "NEET Warm-up Olympiad",
    subject: "Physics · Chemistry · Biology",
    examLabel: "NEET WARM-UP",
    tagline: "The free national warm-up before the big day.",
    description:
      "A free NEET-pattern warm-up Olympiad held last week. Registration and the live window have closed — results are published below.",
    iconKey: "science",
    accent: "var(--error-500)",
    entryType: "free",
    price: 0,
    originalPrice: 0,
    eligibility: "Class 11–12 · NEET aspirants",
    registrationOpensAt: BASE - 14 * DAY,
    registrationClosesAt: BASE - 4 * DAY - 2 * HOUR,
    startsAt: BASE - 4 * DAY,
    durationMinutes: 60,
    graceMinutes: 10,
    resultsAt: BASE - 4 * DAY + 2 * HOUR,
    examType: "nta",
    pattern: "NTA Pattern · +4 / −1",
    questionCount: 90,
    sections: ["Physics", "Chemistry", "Biology"],
    maxScore: 360,
    participantCount: 31544,
    prizes: [
      { rank: "Rank 1–10", reward: "Certificate of Merit" },
      { rank: "Top 1000", reward: "Digital badge" },
    ],
    rankCertThreshold: 10,
    organization: "Teachmint National Olympiads",
  },
];

// ─── Lookups ───────────────────────────────────────────────────────────────────

export function getOlympiadById(id: string): Olympiad | undefined {
  return DUMMY_OLYMPIADS.find((o) => o.id === id);
}

export function listOlympiads(): Olympiad[] {
  return DUMMY_OLYMPIADS;
}

export function windowEndsAt(o: Olympiad): number {
  return o.startsAt + (o.durationMinutes + o.graceMinutes) * MIN;
}

/** Rich, time-derived status for an Olympiad. Pass `now` for testability. */
export function olympiadStatus(o: Olympiad, now: number = Date.now()): OlympiadStatus {
  const ends = windowEndsAt(o);
  const isLive = now >= o.startsAt && now < ends;
  const isUpcoming = now < o.startsAt;
  const isEnded = now >= ends;
  const resultsOut = now >= o.resultsAt && isEnded;
  const registrationClosed = now >= o.registrationClosesAt;
  const canRegister = now >= o.registrationOpensAt && !registrationClosed;
  const closingSoon = canRegister && o.registrationClosesAt - now < DAY;

  let phase: OlympiadPhase;
  if (isLive) phase = "live";
  else if (isEnded) phase = resultsOut ? "results-out" : "grading";
  else if (now < o.registrationOpensAt) phase = "upcoming";
  else if (closingSoon) phase = "registration-closing";
  else phase = "registration-open";

  return {
    phase,
    canRegister,
    registrationClosed,
    canEnter: isLive,
    isLive,
    isUpcoming,
    isEnded,
    resultsOut,
    windowEndsAt: ends,
    msToStart: Math.max(0, o.startsAt - now),
    msToRegClose: Math.max(0, o.registrationClosesAt - now),
    msToResults: Math.max(0, o.resultsAt - now),
  };
}

export const PHASE_LABEL: Record<OlympiadPhase, string> = {
  "upcoming": "Coming soon",
  "registration-open": "Registration open",
  "registration-closing": "Closing soon",
  "live": "Live now",
  "grading": "Grading",
  "results-out": "Results out",
};

// ─── Exam-engine bridge ──────────────────────────────────────────────────────
// Projects an Olympiad into the MyTestSeriesPack shape the take engine expects,
// so the same instructions → /take → gradeMock pipeline conducts the exam. The
// packId convention `oly-<id>` lets the take screen detect Olympiad submissions
// and route them into the post-exam (rank/leaderboard/certificate) flow.

export const OLYMPIAD_PACK_PREFIX = "oly-";

export function olympiadIdFromPackId(packId: string): string | null {
  return packId.startsWith(OLYMPIAD_PACK_PREFIX)
    ? packId.slice(OLYMPIAD_PACK_PREFIX.length)
    : null;
}

/** Returns a MyTestSeriesPack for `oly-<id>`, else undefined. Wired into getPackById. */
export function getOlympiadPack(packId: string): MyTestSeriesPack | undefined {
  const id = olympiadIdFromPackId(packId);
  if (!id) return undefined;
  const o = getOlympiadById(id);
  if (!o) return undefined;
  return {
    packId,
    productId: o.id,
    title: o.title,
    planLabel: "Olympiad",
    examLabel: o.examLabel,
    examAccent: o.accent,
    takeAccent: o.accent,
    examType: o.examType,
    pattern: o.pattern,
    validTill: new Date(windowEndsAt(o)).toISOString().slice(0, 10),
    purchasedOn: new Date(o.registrationOpensAt).toISOString().slice(0, 10),
    totalMocks: 1,
    sections: o.sections,
    maxScore: o.maxScore,
    mocks: [
      {
        id: "exam",
        number: 1,
        title: o.title,
        questionCount: o.questionCount,
        durationMinutes: o.durationMinutes,
        status: "not-started",
        kind: "mock",
      },
    ],
  };
}

// ─── Rank + percentile ─────────────────────────────────────────────────────────
// Deterministic mapping from a raw score to a national rank, modelled on a
// realistic right-skewed score distribution (most cluster low, a thin elite tail).

export function computeRank(o: Olympiad, score: number): { rank: number; percentile: number } {
  const pct = Math.max(0, Math.min(1, score / o.maxScore));
  // Percentile rises steeply then flattens — top scores are rare.
  const percentile = Math.round(Math.min(99.99, 100 * Math.pow(pct, 0.55)) * 100) / 100;
  const topFraction = Math.max(0.00002, 1 - percentile / 100);
  const rank = Math.max(1, Math.round(topFraction * o.participantCount));
  return { rank, percentile };
}

// ─── Modelled cohort stats (for comparative analytics) ───────────────────────
// No real per-section distribution exists yet, so model a believable cohort:
// average ~38–48% of section max (deterministic per olympiad+section), sd ~18%.
// TODO(api): replace with real cohort section means + percentile placement.

export function cohortSectionAvg(o: Olympiad, sectionIndex: number, sectionMax: number): number {
  const pct = 0.38 + seeded(o.id, sectionIndex * 5 + 71) * 0.10;
  return Math.round(sectionMax * pct);
}

/** Your percentile within the cohort for a section, vs the modelled mean (sd 18%). */
export function cohortPercentile(scorePct: number, cohortAvgPct: number): number {
  const z = (scorePct - cohortAvgPct) / 0.18;
  const cdf = 1 / (1 + Math.exp(-1.7 * z));
  return Math.round(Math.min(99.9, Math.max(0.5, cdf * 100)) * 10) / 10;
}

// ─── Leaderboard (deterministic, stable across renders) ────────────────────────

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Ananya", "Diya", "Ishaan", "Kavya", "Reyansh",
  "Saanvi", "Arjun", "Myra", "Vihaan", "Anika", "Krish", "Riya", "Aryan",
  "Navya", "Kabir", "Aadhya", "Dhruv", "Pari", "Atharv", "Sara", "Ved",
  "Tara", "Rudra", "Ira", "Shaurya", "Mira", "Yug",
];
const LAST_INITIALS = ["S.", "K.", "M.", "R.", "P.", "G.", "B.", "N.", "J.", "D.", "T.", "V."];
const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune",
  "Kota", "Jaipur", "Lucknow", "Patna", "Indore", "Nagpur", "Bhopal", "Surat",
];
const SCHOOLS = [
  "DPS R.K. Puram", "Allen Career", "FIITJEE", "Narayana", "Sri Chaitanya",
  "Bansal Classes", "Resonance", "Aakash Institute", "Kendriya Vidyalaya",
  "DAV Public School",
];

// Cheap deterministic hash so the same (id, i) always yields the same entry.
function seeded(id: string, i: number): number {
  let h = 2166136261 ^ i;
  for (let k = 0; k < id.length; k++) {
    h = Math.imul(h ^ id.charCodeAt(k), 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Build a stable leaderboard for an Olympiad. If `me` is provided, the user is
 * inserted at their computed rank with their real score.
 */
export function getLeaderboard(
  o: Olympiad,
  me?: { rank: number; score: number } | null,
  scope: LeaderboardScope = "all-india",
  size: number = 50,
): LeaderboardEntry[] {
  const myCity = CITIES[Math.floor(seeded(o.id, 999) * CITIES.length)];
  const mySchool = SCHOOLS[Math.floor(seeded(o.id, 998) * SCHOOLS.length)];

  // Top scorers — STRICTLY descending: each rank drops 1–3 marks below the one
  // above it, so the board always reads correctly (rank 1 = highest score).
  const topScore = Math.round(o.maxScore * (0.95 + seeded(o.id, 1) * 0.04));
  const entries: LeaderboardEntry[] = [];
  let prev = topScore;
  const used = new Set<string>();
  for (let i = 0; i < size; i++) {
    const r = i + 1;
    const score = r === 1 ? topScore : prev - (1 + Math.floor(seeded(o.id, r * 7 + 3) * 3));
    prev = score;
    // Pick a name pair; nudge the initial on collision so no exact duplicates show.
    let first = FIRST_NAMES[Math.floor(seeded(o.id, r * 31 + 11) * FIRST_NAMES.length)];
    let init = LAST_INITIALS[Math.floor(seeded(o.id, r * 37 + 17) * LAST_INITIALS.length)];
    for (let k = 0; used.has(`${first} ${init}`) && k < LAST_INITIALS.length; k++) {
      init = LAST_INITIALS[(LAST_INITIALS.indexOf(init) + 1) % LAST_INITIALS.length];
    }
    used.add(`${first} ${init}`);
    entries.push({
      rank: r,
      name: `${first} ${init}`,
      city: scope === "city" ? myCity : CITIES[Math.floor(seeded(o.id, r * 13 + 5) * CITIES.length)],
      school: scope === "school" ? mySchool : SCHOOLS[Math.floor(seeded(o.id, r * 11 + 9) * SCHOOLS.length)],
      score,
      isMe: false,
    });
  }

  if (me) {
    if (me.rank <= size) {
      // Replace the row at that rank, but KEEP the positionally-generated score
      // so the board stays strictly monotonic (the stored attempt score may not
      // line up exactly with the synthetic top-N curve). Result/rewards screens
      // show the real stored score; the board shows the rank-consistent one.
      entries[me.rank - 1] = { ...entries[me.rank - 1], name: "You", isMe: true };
    } else {
      // Off the visible top — append so the screen can show a sticky "your rank".
      entries.push({ rank: me.rank, name: "You", city: myCity, school: mySchool, score: me.score, isMe: true });
    }
  }
  return entries;
}

// ─── Certificate projection ────────────────────────────────────────────────────

export function isRankCertificate(o: Olympiad, rank: number): boolean {
  return rank <= o.rankCertThreshold;
}

/**
 * Resolve which prize tier (if any) a given rank wins. Parses the human prize
 * labels — "Rank 1", "Rank 2–10", "Rank 1–3", "Top 100", "Top 500" — into a
 * [low, high] range and returns the first tier the rank falls into.
 */
export function prizeForRank(o: Olympiad, rank: number): OlympiadPrize | null {
  for (const prize of o.prizes) {
    const nums = (prize.rank.match(/\d[\d,]*/g) ?? []).map((n) => parseInt(n.replace(/,/g, ""), 10));
    if (nums.length === 0) continue;
    const isTop = /top/i.test(prize.rank);
    const low = isTop ? 1 : nums[0];
    const high = isTop ? nums[0] : (nums[1] ?? nums[0]);
    if (rank >= low && rank <= high) return prize;
  }
  return null;
}

/** Build a Certificate artifact from an Olympiad attempt (participation or rank). */
export function buildOlympiadCertificate(
  o: Olympiad,
  attempt: OlympiadAttempt,
  recipientName: string = "Rahul Sharma",
): Certificate {
  const ranked = isRankCertificate(o, attempt.rank);
  const detail = ranked
    ? `All-India Rank ${attempt.rank.toLocaleString("en-IN")} · ${attempt.score}/${o.maxScore} · ${attempt.percentile} percentile`
    : `Participated nationally · ${attempt.score}/${o.maxScore} · ${attempt.percentile} percentile`;
  return {
    id: `oly-${o.id}`,
    courseId: `oly-${o.id}`,
    courseTitle: ranked ? `${o.title} — Rank Certificate` : `${o.title} — Participation`,
    organization: o.organization,
    recipientName,
    issuedOn: new Date(o.resultsAt).toISOString().slice(0, 10),
    credentialId: `TNO-${o.examLabel.replace(/[^A-Z]/g, "").slice(0, 4)}-2026-${String(
      10000 + Math.floor(seeded(o.id, 42) * 80000),
    )}`,
    category: "olympiad",
    detail,
  };
}

// ─── Registration + attempt store (module memory, resets on refresh) ───────────

interface OlympiadStore {
  registered: Record<string, number>;       // olympiadId → registeredAt (epoch ms)
  attempts: Record<string, OlympiadAttempt>; // olympiadId → attempt
  notify: Record<string, boolean>;           // olympiadId → notify-me toggle
  claims: Record<string, ClaimStatus>;       // olympiadId → reward claim status
}

const EVENT_NAME = "olympiad-state-change";

// Pre-seed: registered for everything reachable + a completed attempt on the
// "ended + results-out" paid Olympiad so its full post-exam surface is viewable.
function seedStore(): OlympiadStore {
  const jee = getOlympiadById("jee-grand")!;
  // Pre-seed a TOP-10 finish (All-India Rank 6) so the full winning surface is
  // demoable: a cash prize on the rewards page (Rank 2–10 → ₹10,000 + medal),
  // the National Merit badge (rank-certificate band) + a celebratory result.
  // Podium (top 3) stays locked to show the earned-vs-locked contrast.
  const score = 348;       // 348/360 — top-tier paper
  const rank = 6;
  const percentile = 99.99;
  // Varied per-section profile so result + analytics show real strengths.
  // Totals reconcile to score 348 · correct 87 · unanswered 3.
  const perSection = [
    { section: jee.sections[0], score: 120, maxScore: 120, correct: 30, incorrect: 0, unanswered: 0 },
    { section: jee.sections[1], score: 116, maxScore: 120, correct: 29, incorrect: 0, unanswered: 1 },
    { section: jee.sections[2], score: 112, maxScore: 120, correct: 28, incorrect: 0, unanswered: 2 },
  ];
  return {
    registered: {
      "math-titans": BASE - 6 * DAY,
      // aptitude-challenge intentionally left UNregistered so the free
      // registration flow is reachable from discovery (its detail page shows a
      // live "Register free" CTA → register form → confirmed). Completing it
      // re-registers the event, restoring the "You're registered" + countdown
      // state — the full round-trip is demoable from this one Olympiad.
      "jee-grand": BASE - 11 * DAY,
    },
    attempts: {
      "jee-grand": {
        olympiadId: "jee-grand",
        score,
        maxScore: jee.maxScore,
        attempted: 87,
        correct: 87,
        incorrect: 0,
        unanswered: 3,
        timeTakenSeconds: 80 * 60,
        sectionBreakdown: perSection,
        rank,
        percentile,
        submittedAt: jee.startsAt + 80 * MIN,
      },
    },
    notify: {},
    // jee-grand reward left UNCLAIMED so the claim flow is demoable end-to-end.
    claims: {},
  };
}

let STORE: OlympiadStore = seedStore();

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export interface UseOlympiadStateReturn {
  isRegistered: (id: string) => boolean;
  register: (id: string) => void;
  getAttempt: (id: string) => OlympiadAttempt | undefined;
  saveAttempt: (attempt: OlympiadAttempt) => void;
  isNotifying: (id: string) => boolean;
  toggleNotify: (id: string) => void;
  /** Reward claim lifecycle for an Olympiad's won prize. */
  getClaim: (id: string) => ClaimStatus;
  setClaim: (id: string, status: ClaimStatus) => void;
  /** Certificates earned across all attempted Olympiads — for the profile wallet. */
  earnedCertificates: Certificate[];
  reset: () => void;
}

export function useOlympiadState(): UseOlympiadStateReturn {
  const [, force] = useState(0);
  useEffect(() => {
    const handler = () => force((n) => n + 1);
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return {
    isRegistered: (id) => STORE.registered[id] != null,
    register: (id) => {
      if (STORE.registered[id] != null) return;
      STORE = { ...STORE, registered: { ...STORE.registered, [id]: Date.now() } };
      emit();
    },
    getAttempt: (id) => STORE.attempts[id],
    saveAttempt: (attempt) => {
      STORE = {
        ...STORE,
        attempts: { ...STORE.attempts, [attempt.olympiadId]: attempt },
      };
      emit();
    },
    isNotifying: (id) => !!STORE.notify[id],
    toggleNotify: (id) => {
      STORE = { ...STORE, notify: { ...STORE.notify, [id]: !STORE.notify[id] } };
      emit();
    },
    getClaim: (id) => STORE.claims[id] ?? "unclaimed",
    setClaim: (id, status) => {
      STORE = { ...STORE, claims: { ...STORE.claims, [id]: status } };
      emit();
    },
    earnedCertificates: DUMMY_OLYMPIADS
      .filter((o) => STORE.attempts[o.id])
      .map((o) => buildOlympiadCertificate(o, STORE.attempts[o.id])),
    reset: () => {
      STORE = seedStore();
      emit();
    },
  };
}

// Non-hook readers for modules outside React (e.g. the take engine bridge).
export function readAttempt(id: string): OlympiadAttempt | undefined {
  return STORE.attempts[id];
}
export function readRegistered(id: string): boolean {
  return STORE.registered[id] != null;
}
export function writeAttempt(attempt: OlympiadAttempt): void {
  STORE = { ...STORE, attempts: { ...STORE.attempts, [attempt.olympiadId]: attempt } };
  emit();
}

// ─── Weekly cadence + audience tiers ─────────────────────────────────────────
// Product model: 2 Olympiads go live every Sunday — a free one open to ALL
// students, and a GYD Max one for plan members — each at a fixed Sunday slot.
// Derived from entryType so it stays a single source of truth (free = all,
// max = members). TODO(api): make slot + audience real per-event config fields.

export type OlympiadAudience = "all" | "max";

export function olympiadAudience(o: Olympiad): OlympiadAudience {
  return o.entryType === "free" ? "all" : "max";
}

export function olympiadAudienceLabel(o: Olympiad): string {
  return o.entryType === "free" ? "Open to all" : "GYD Max members";
}

/** Fixed Sunday slot — free events run the morning slot, Max the evening slot. */
export function olympiadSlotLabel(o: Olympiad): string {
  return o.entryType === "free" ? "Sundays · 11:00 AM" : "Sundays · 6:00 PM";
}

// ─── Misc formatting helpers ─────────────────────────────────────────────────

export function formatCount(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function msToCountdown(ms: number): Countdown {
  const totalMs = Math.max(0, ms);
  return {
    days: Math.floor(totalMs / DAY),
    hours: Math.floor((totalMs / HOUR) % 24),
    minutes: Math.floor((totalMs / MIN) % 60),
    seconds: Math.floor((totalMs / 1000) % 60),
    totalMs,
  };
}
