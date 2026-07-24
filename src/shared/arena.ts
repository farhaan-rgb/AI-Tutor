/**
 * Arena — the competitive-learning platform's data model + state.
 *
 * The spine is DIVISION × SUBJECT × LEAGUE (per the PRD):
 *  • DIVISION (inferred from class/exam, never asked cold) is the fairness axis —
 *    a student only competes against others in their division.
 *  • Within a division a student picks SUBJECTS; each subject is its own league.
 *  • Inside a subject's league two SEPARATE axes coexist — never blur them:
 *      – LEVEL (from lifetime `xp`) = persistent skill. Only ever grows, survives
 *        every season; the "I'm getting better" number on return.
 *      – TIER + season RANK (from `seasonPoints`) = this season's competition.
 *        Resets each season, can go up or down, drives the cohort leaderboard.
 *
 * Practice is the free Daily Sprint (10 Qs). Competition is events: the recurring
 * weekend League (an always-on cohort + a per-event board) and scheduled
 * Championships (the Olympiad feature). `isPaid` gates elite arenas — it never
 * touches Level/Tier/rank (no pay-affects-progress).
 *
 * This file owns: divisions/subjects, the tier ladder, the xp→level curve,
 * daily-sprint scoring + lives, streak, energy, a tagged question bank, and both
 * the standing cohort board and the per-event leaderboard builder.
 *
 * Like games-pass-state / olympiads, state lives in module memory and notifies
 * via a window event, so it resets on refresh (prototype-appropriate). Every
 * placeholder is shaped to its eventual API.
 *
 *   TODO(api): GET  /api/arena/me              — division, subjects, standings (tier/seasonPoints/xp), isPaid, streak, energy
 *   TODO(api): POST /api/arena/sprint/result   — submit a run, get new seasonPoints + xp
 *   TODO(api): GET  /api/arena/event/:id/board — per-event leaderboard (server-ranked)
 */

import { useEffect, useState } from "react";
import type { LeaderboardEntry, OlympiadIconKey } from "./olympiads";
import type { EventProgress, LevelResult } from "./arena-events";

// ─── Time anchors ──────────────────────────────────────────────────────────────
const BASE = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const MAX_ENERGY = 5;        // daily sprints before refill
export const SPRINT_LIVES = 3;       // wrong answers allowed before a run ends
export const SPRINT_LEVELS = 10;     // questions in a daily sprint
export const EVENT_LIVES = 5;        // weekend events run longer → more forgiving
export const EVENT_LEVELS = 20;      // questions in a weekend event
export const COHORT_SIZE = 30;       // players in a league cohort you're ranked against

// Weekly league season — closes soon so the "season ends in …" pressure is demoable.
export const SEASON_ENDS_AT = BASE + 1 * DAY + 22 * HOUR;

// ─── Divisions (the fairness axis — inferred, never asked cold) ─────────────────
// A student competes ONLY inside their division, so a Class-9 kid never faces a JEE
// aspirant. We infer it from the exams/class the app already knows (TODO(api):
// GET /api/me/profile), then let them confirm — we never interrogate for class.
export type DivisionId = "c6-8" | "c9-10" | "c11-12" | "jee" | "neet" | "foundation" | "skills";
export interface Division { id: DivisionId; label: string; short: string }
export const DIVISIONS: Division[] = [
  { id: "c6-8", label: "Class 6–8", short: "6–8" },
  { id: "c9-10", label: "Class 9–10", short: "9–10" },
  { id: "c11-12", label: "Class 11–12", short: "11–12" },
  { id: "jee", label: "JEE", short: "JEE" },
  { id: "neet", label: "NEET", short: "NEET" },
  { id: "foundation", label: "Foundation / UPSC", short: "Foundation" },
  { id: "skills", label: "Skills", short: "Skills" },
];
export function getDivision(id: DivisionId): Division {
  return DIVISIONS.find((d) => d.id === id) ?? DIVISIONS[1];
}
/** The subject tracks a division offers (each is its own league ladder). */
export function subjectsForDivision(id: DivisionId): string[] {
  switch (id) {
    case "jee": return ["maths", "physics", "chemistry"];
    case "neet": return ["physics", "chemistry", "biology"];
    case "c11-12": return ["maths", "physics", "chemistry"];
    case "c9-10": return ["maths", "physics", "biology"];
    case "c6-8": return ["maths", "gk"];
    case "foundation": return ["gk", "aptitude"];
    case "skills": return ["gk", "aptitude"];
  }
}

// ─── Subjects ────────────────────────────────────────────────────────────────
// A subject is a league track within a division — it drives the question bank,
// concepts, and its own Bronze→Champion ladder.
export interface Subject { id: string; label: string; iconKey: OlympiadIconKey; accent: string }

export const SUBJECTS: Subject[] = [
  { id: "maths", label: "Maths", iconKey: "math", accent: "var(--primary-500)" },
  { id: "physics", label: "Physics", iconKey: "science", accent: "var(--teal-500)" },
  { id: "chemistry", label: "Chemistry", iconKey: "science", accent: "var(--success-500)" },
  { id: "biology", label: "Biology", iconKey: "science", accent: "var(--warning-500)" },
  { id: "gk", label: "GK", iconKey: "general", accent: "var(--purple-500)" },
  { id: "aptitude", label: "Aptitude", iconKey: "aptitude", accent: "var(--error-500)" },
];

export function getSubject(id: string): Subject {
  return SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];
}

// ─── Leagues (the engagement + fairness engine) ────────────────────────────────
// Within a division+subject you sit in a LEAGUE TIER. Each season (weekly) the top
// of your ~30-player cohort PROMOTE and the bottom RELEGATE. `promote`/`relegate`
// are graded — generous at the bottom (beginners win early), scarce at the top (the
// climb is earned). Soft floors: Bronze never relegates.
export type TierId = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "champion";

export interface Tier {
  id: TierId;
  label: string;
  color: string;
  promote: number;   // top-N of the cohort promote each season
  relegate: number;  // bottom-N relegate (0 = protected floor)
}

export const TIERS: Tier[] = [
  { id: "bronze",   label: "Bronze",   color: "color-mix(in srgb, var(--warning-500) 55%, var(--error-500))", promote: 15, relegate: 0 },
  { id: "silver",   label: "Silver",   color: "color-mix(in srgb, var(--foreground) 55%, transparent)",       promote: 12, relegate: 5 },
  { id: "gold",     label: "Gold",     color: "var(--warning-500)",                                            promote: 10, relegate: 5 },
  { id: "platinum", label: "Platinum", color: "var(--teal-500)",                                               promote: 7,  relegate: 5 },
  { id: "diamond",  label: "Diamond",  color: "var(--primary-400)",                                            promote: 5,  relegate: 5 },
  { id: "champion", label: "Champion", color: "var(--purple-500)",                                             promote: 0,  relegate: 5 },
];

export function getTier(id: TierId): Tier {
  return TIERS.find((t) => t.id === id) ?? TIERS[0];
}
export function tierIndex(id: TierId): number {
  return TIERS.findIndex((t) => t.id === id);
}
export function nextTier(id: TierId): Tier | null {
  const i = tierIndex(id);
  return i < TIERS.length - 1 ? TIERS[i + 1] : null;
}
export function prevTier(id: TierId): Tier | null {
  const i = tierIndex(id);
  return i > 0 ? TIERS[i - 1] : null;
}

/** Your standing in one subject's league. Three things, kept strictly separate:
 *  • LEVEL = your SKILL. Stored, only ever grows, and it decides how HARD the
 *    questions you're served are. This is the "my skill is growing" axis.
 *  • xp / seasonPoints = your SCORE. Points you bank by playing; they rank the
 *    leaderboard. NOT your skill. (`tier` is legacy and no longer surfaced.) */
export interface LeagueStanding { tier: TierId; seasonPoints: number; xp: number; level: number }

// ─── Level (your SKILL — drives question difficulty) ─────────────────────────
// LEVEL is skill, NOT score. It's stored per subject, only ever grows, and the
// higher it is the HARDER the questions we serve. XP/seasonPoints are the score
// (they rank the leaderboard) — deliberately separate so "am I improving?" and
// "where do I rank?" never blur.
//   TODO(api): the real adaptive engine serves questions by level, server-side.

/** Your stored skill level in a subject (1-based). */
export function subjectLevel(state: ArenaState, subjectId = state.activeSubjectId): number {
  return Math.max(1, state.leagues[subjectId]?.level ?? 1);
}

/** Difficulty floor (1–4) a level serves — higher level starts you on harder Qs. */
export function difficultyFloorForLevel(level: number): 1 | 2 | 3 | 4 {
  if (level <= 4) return 1;
  if (level <= 9) return 2;
  if (level <= 15) return 3;
  return 4;
}

export interface LevelInfo {
  level: number;        // current skill level
  pct: number;          // 0–100 progress toward the next level (from concept mastery)
  toNextLabel: string;  // human label for the gap to the next level
}
/** Skill level + progress for the active subject. Progress comes from concept
 *  MASTERY — mastering your current concepts is what levels you up — never score. */
export function activeLevel(state: ArenaState): LevelInfo {
  const level = subjectLevel(state);
  const concepts = getMastery(state).find((s) => s.subjectId === state.activeSubjectId)?.concepts ?? [];
  const pct = concepts.length ? Math.round(concepts.reduce((a, c) => a + c.pct, 0) / concepts.length) : 0;
  return { level, pct, toNextLabel: `${Math.max(0, 100 - pct)}% mastery to Level ${level + 1}` };
}

// ─── Deterministic helpers ───────────────────────────────────────────────────
const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Ananya", "Diya", "Ishaan", "Kavya", "Reyansh",
  "Saanvi", "Arjun", "Myra", "Vihaan", "Anika", "Krish", "Riya", "Aryan",
  "Navya", "Kabir", "Aadhya", "Dhruv", "Pari", "Atharv", "Sara", "Ved",
  "Tara", "Rudra", "Ira", "Shaurya", "Mira", "Yug", "Advik", "Nitya",
];
const LAST_INITIALS = ["S.", "K.", "M.", "R.", "P.", "G.", "B.", "N.", "J.", "D.", "T.", "V."];

export function seeded(key: string, i: number): number {
  let h = 2166136261 ^ i;
  for (let k = 0; k < key.length; k++) h = Math.imul(h ^ key.charCodeAt(k), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

// ─── Cohort + leaderboard ──────────────────────────────────────────────────────
export type ArenaScope = "league" | "friends" | "school" | "national";

/** Generate a stable cohort and slot "You" in by score. Bots are spread PROPORTIONALLY
 *  from `topScore` down to a floor (~45% of top) with jitter, so the player lands at a
 *  sensible rank for their score (never artificially last). `seedKey` keeps a given
 *  division+subject+scope cohort identical across renders. */
export function buildBoard(seedKey: string, size: number, myScore: number, topScore: number): LeaderboardEntry[] {
  const n = size - 1; // bots; "You" always fills a slot (never sliced off)
  const floor = Math.max(0, Math.round(topScore * 0.45));
  const span = Math.max(1, topScore - floor);
  const bots: { name: string; score: number }[] = [];
  const used = new Set<string>();
  for (let i = 0; i < n; i++) {
    const frac = n > 1 ? i / (n - 1) : 0;                       // 0 (top) → 1 (floor)
    const jitter = (seeded(seedKey, i * 7 + 3) - 0.5) * (span / n) * 1.6;
    const score = Math.max(floor, Math.min(topScore, Math.round(topScore - frac * span + jitter)));
    let first = FIRST_NAMES[Math.floor(seeded(seedKey, i * 31 + 11) * FIRST_NAMES.length)];
    let init = LAST_INITIALS[Math.floor(seeded(seedKey, i * 37 + 17) * LAST_INITIALS.length)];
    for (let k = 0; used.has(`${first} ${init}`) && k < LAST_INITIALS.length; k++) {
      init = LAST_INITIALS[(LAST_INITIALS.indexOf(init) + 1) % LAST_INITIALS.length];
    }
    used.add(`${first} ${init}`);
    bots.push({ name: `${first} ${init}`, score });
  }
  const all: { name: string; score: number; isMe?: boolean }[] = [...bots, { name: "You", score: myScore, isMe: true }];
  all.sort((a, b) => b.score - a.score);
  return all.map((e, i) => ({ rank: i + 1, name: e.name, city: "", school: "", score: e.score, isMe: !!e.isMe }));
}


// ─── Sprint scoring ──────────────────────────────────────────────────────────
export interface SprintQuestion {
  type?: QuestionType;       // defaults to "mcq" when omitted (legacy bank)
  prompt: string;
  options: string[];         // mcq/multi/boolean/assertion choices ([] for fill)
  correct: number;           // mcq/boolean/assertion: correct option index
  correctSet?: number[];     // multi: indices that are ALL correct
  answer?: string;           // fill: the canonical accepted answer
  accept?: string[];         // fill: extra accepted answers (case/space-insensitive)
  pairs?: { left: string; right: string }[]; // match: correct left↔right pairing
  sequence?: string[];       // order: items in their correct sequence
  difficulty: 1 | 2 | 3 | 4; // ●○○○ … ●●●●
  perSeconds: number;        // time budget for this question
  concept: string;           // for weak-area detection + review grouping
  explanation: string;       // shown in the post-arena review
}

/** Canonical question alias used by the event engine (same shape, clearer name). */
export type Question = SprintQuestion;

/** One answered question, captured for the post-arena review. */
export interface ReviewItem {
  prompt: string;
  options: string[];
  correct: number;
  picked: number | null;     // null = timed out (MCQ-style index)
  concept: string;
  explanation: string;
  // Generic capture for non-MCQ types (fill / match / order / multi):
  pickedText?: string;       // what the player entered/arranged, human-readable
  correctText?: string;      // the correct answer, human-readable
  ok?: boolean;              // resolved correctness for ANY question type
}

export interface SprintResult {
  xp: number;                // league points earned this run
  correct: number;
  incorrect: number;
  answered: number;
  bestStreak: number;
  accuracy: number;          // %
  subjectId: string;         // which league this run counted toward
  tier: TierId;              // your tier in that league
  pointsBefore: number;      // season points before this run
  pointsAfter: number;       // after (xp added)
  rankBefore: number;        // your cohort rank before
  rankAfter: number;         // after — the climb the result celebrates
  levelBefore: number;       // persistent skill level before this run
  levelAfter: number;        // after — > before means "Levelled up!"
  reachedLevel: number;      // how far up the question ladder you got (1–10)
  ranOutOfLives: boolean;
  review: ReviewItem[];      // per-question, for review + weak-area
  reviewed?: boolean;        // reward granted once the review is completed
}

/** Points for a question: accuracy-GATED (wrong = 0), speed-rewarded, weighted by
 *  difficulty. Additive (not a fragile 4-way multiply) — grinding volume can't
 *  beat focused accuracy on hard questions. */
export function questionPoints(q: SprintQuestion, correct: boolean, secondsLeft: number): number {
  if (!correct) return 0;
  const base = 8 + q.difficulty * 6;                       // diff 1–4 → 14–32
  const speed = 0.6 + 0.4 * Math.max(0, secondsLeft) / q.perSeconds; // 0.6–1.0
  return Math.round(base * speed);
}

// ─── Question types (the engine renders all of these) ─────────────────────────
// MCQ is the legacy default. Events add unguessable + exam-authentic formats so
// climbing a level requires real knowledge, not stabbing at four options.
//   mcq        — one correct option (legacy)
//   multi      — select ALL correct options (correctSet)
//   boolean    — True / False (options = ["True","False"], correct = index)
//   fill       — type the answer (answer + accept[]); no options to guess from
//   match      — match left↔right pairs (pairs); right column shown shuffled
//   order      — arrange items into the right sequence (sequence)
//   assertion  — Assertion–Reason (4 standard options; correct = index)
export type QuestionType = "mcq" | "multi" | "boolean" | "fill" | "match" | "order" | "assertion";

// ─── Question bank (tagged by concept/difficulty) ──────────────────────────────
// TODO(api): GET /api/arena/sprint?division=&subject= — server-served, anti-leak.
const MATHS_Q: SprintQuestion[] = [
  { prompt: "What is 15% of 240?", options: ["36", "32", "40", "30"], correct: 0, difficulty: 1, perSeconds: 20, concept: "Percentages", explanation: "15% of 240 = 0.15 × 240 = 36." },
  { prompt: "Solve: 2x + 7 = 19", options: ["x = 5", "x = 6", "x = 7", "x = 4"], correct: 1, difficulty: 1, perSeconds: 20, concept: "Linear equations", explanation: "2x = 19 − 7 = 12, so x = 6." },
  { prompt: "The HCF of 36 and 48 is", options: ["6", "8", "12", "16"], correct: 2, difficulty: 2, perSeconds: 25, concept: "Number theory", explanation: "36 = 2²·3², 48 = 2⁴·3 → common factors 2²·3 = 12." },
  { prompt: "If a triangle has angles 40° and 75°, the third is", options: ["55°", "65°", "75°", "45°"], correct: 1, difficulty: 2, perSeconds: 25, concept: "Geometry", explanation: "Angles sum to 180°: 180 − 40 − 75 = 65°." },
  { prompt: "Simplify: √144 + √81", options: ["21", "23", "20", "25"], correct: 0, difficulty: 2, perSeconds: 22, concept: "Roots", explanation: "√144 = 12 and √81 = 9, so 12 + 9 = 21." },
  { prompt: "The sum of first 10 natural numbers is", options: ["45", "50", "55", "60"], correct: 2, difficulty: 3, perSeconds: 28, concept: "Series", explanation: "n(n+1)/2 = 10·11/2 = 55." },
  { prompt: "Derivative of x³ with respect to x is", options: ["3x", "x²", "3x²", "2x³"], correct: 2, difficulty: 3, perSeconds: 30, concept: "Calculus", explanation: "Power rule: d/dx(xⁿ) = n·xⁿ⁻¹ → 3x²." },
  { prompt: "If log₂ 8 = x, then x =", options: ["2", "3", "4", "8"], correct: 1, difficulty: 3, perSeconds: 28, concept: "Logarithms", explanation: "2³ = 8, so log₂ 8 = 3." },
  { prompt: "∫ 2x dx equals", options: ["x² + C", "2x² + C", "x + C", "2 + C"], correct: 0, difficulty: 4, perSeconds: 35, concept: "Calculus", explanation: "∫2x dx = 2·(x²/2) + C = x² + C." },
  { prompt: "The roots of x² − 5x + 6 = 0 are", options: ["2, 3", "1, 6", "−2, −3", "2, −3"], correct: 0, difficulty: 4, perSeconds: 35, concept: "Quadratics", explanation: "Factor: (x−2)(x−3) = 0 → x = 2 or 3." },
];
const GENERIC_Q: SprintQuestion[] = [
  { prompt: "Which is the largest planet in the solar system?", options: ["Saturn", "Jupiter", "Neptune", "Earth"], correct: 1, difficulty: 1, perSeconds: 18, concept: "Astronomy", explanation: "Jupiter is the largest — over 1,300 Earths fit inside it." },
  { prompt: "The capital of Australia is", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2, difficulty: 2, perSeconds: 20, concept: "Geography", explanation: "Canberra is the capital — not Sydney, a common mix-up." },
  { prompt: "Which gas do plants absorb for photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct: 2, difficulty: 1, perSeconds: 18, concept: "Biology", explanation: "Plants take in CO₂ and release O₂ during photosynthesis." },
  { prompt: "Find the odd one out: 2, 3, 5, 9, 11", options: ["3", "5", "9", "11"], correct: 2, difficulty: 2, perSeconds: 22, concept: "Reasoning", explanation: "9 is the only non-prime (9 = 3×3); the rest are primes." },
  { prompt: "If CAT = 3120, then DOG =", options: ["4157", "41507", "4-15-7", "41-5-7"], correct: 0, difficulty: 3, perSeconds: 28, concept: "Coding-decoding", explanation: "Letter positions D=4, O=15, G=7 → 4157." },
  { prompt: "Complete the series: 1, 4, 9, 16, ?", options: ["20", "24", "25", "36"], correct: 2, difficulty: 2, perSeconds: 22, concept: "Series", explanation: "Perfect squares: 1², 2², 3², 4², 5² = 25." },
  { prompt: "Who wrote the Indian national anthem?", options: ["Bankim Chandra", "Tagore", "Gandhi", "Nehru"], correct: 1, difficulty: 2, perSeconds: 20, concept: "GK", explanation: "Rabindranath Tagore wrote 'Jana Gana Mana'." },
  { prompt: "A clock shows 3:15. The angle between hands is", options: ["0°", "7.5°", "15°", "30°"], correct: 1, difficulty: 4, perSeconds: 35, concept: "Reasoning", explanation: "Hour hand moves past 3 by 15 min → 0.5°/min × 15 = 7.5°." },
  { prompt: "Which is a prime number?", options: ["91", "87", "97", "93"], correct: 2, difficulty: 3, perSeconds: 26, concept: "Number theory", explanation: "97 is prime; 91=7×13, 87=3×29, 93=3×31." },
  { prompt: "Speed of light is approximately", options: ["3×10⁵ km/s", "3×10⁸ m/s", "3×10⁶ m/s", "3×10⁸ km/s"], correct: 1, difficulty: 3, perSeconds: 28, concept: "Physics", explanation: "c ≈ 3×10⁸ m/s (300,000 km/s)." },
];

/** A sprint = SPRINT_LEVELS questions. Your LEVEL sets the difficulty floor (higher
 *  level → harder questions); within that, still ordered easy → hard. Deterministic. */
export function getSprintQuestions(subjectId: string, level = 1, focusConcept?: string): SprintQuestion[] {
  const bank = subjectId === "maths" ? MATHS_Q : GENERIC_Q;
  const ladder = [...bank].sort((a, b) => a.difficulty - b.difficulty);
  if (focusConcept) {
    // Targeted practice: lead with the weak concept, then fill the ladder.
    // TODO(api): the real per-concept bank supplies a full focused set.
    const focused = ladder.filter((q) => q.concept === focusConcept);
    const rest = ladder.filter((q) => q.concept !== focusConcept);
    return [...focused, ...rest].slice(0, SPRINT_LEVELS);
  }
  // LEVEL drives difficulty: serve questions at/above your level's floor, then
  // backfill with the next-easiest (hardest-first) so a sprint always has enough.
  // TODO(api): real per-level adaptive bank, server-served.
  const floor = difficultyFloorForLevel(level);
  const atOrAbove = ladder.filter((q) => q.difficulty >= floor);
  const below = ladder.filter((q) => q.difficulty < floor).reverse();
  return [...atOrAbove, ...below].slice(0, SPRINT_LEVELS).sort((a, b) => a.difficulty - b.difficulty);
}

// ─── Weekend Event (the longer-window, higher-stakes League contest) ────────────
// The daily sprint drives retention; the weekend event drives virality — a 2-day
// window, more questions, a bigger prize and its own shareable result + board.
export interface WeekendEvent {
  id: string;
  title: string;
  theme: string;        // one-line subtitle
  accent: string;       // CSS-var token
  startsAt: number;
  endsAt: number;
  questionCount: number;
  prizeLabel: string;   // headline prize
  promoteTop: number;   // top-N who win
}

// TODO(api): GET /api/arena/event/active — server schedules the weekend event.
const ACTIVE_EVENT: WeekendEvent = {
  id: "weekend-blitz",
  title: "Weekend Blitz",
  theme: "Beat the nation in a 20-question dash",
  accent: "var(--purple-500)",
  startsAt: BASE - 6 * HOUR,
  endsAt: BASE + 38 * HOUR,   // ~1d 14h left
  questionCount: 20,
  prizeLabel: "₹500 voucher",
  promoteTop: 100,
};

export function getActiveEvent(): WeekendEvent | null {
  return ACTIVE_EVENT;
}

/** Event paper = a longer mixed set (subject bank + general), easy → hard. */
export function getEventQuestions(subjectId: string): SprintQuestion[] {
  const subj = subjectId === "maths" ? MATHS_Q : GENERIC_Q;
  const other = subjectId === "maths" ? GENERIC_Q : MATHS_Q;
  return [...subj, ...other].sort((a, b) => a.difficulty - b.difficulty).slice(0, EVENT_LEVELS);
}

/** Per-EVENT leaderboard (the only kind of leaderboard now — shown at the end of
 *  a league/championship, ranked by that run's score). Scoped to friends/school/
 *  national so you can see where you placed among each. */
export function getEventBoard(subjectId: string, score: number, scope: ArenaScope = "national"): LeaderboardEntry[] {
  const ev = getActiveEvent();
  const size = scope === "friends" ? 12 : scope === "school" ? 24 : 50;
  const base = Math.round((ev?.questionCount ?? EVENT_LEVELS) * 28 * 0.92); // ≈ a strong run
  const top = scope === "friends" ? Math.max(score + 60, Math.round(base * 0.6))
    : scope === "school" ? Math.max(score + 90, Math.round(base * 0.8))
    : Math.max(score + 120, base);
  return buildBoard(`event-${ev?.id}-${subjectId}-${scope}`, size, score, top);
}

export function getEventRank(subjectId: string, score: number): number {
  return getEventBoard(subjectId, score, "national").find((e) => e.isMe)?.rank ?? 50;
}

/** Estimated score to break into the prize zone (Top-N) this weekend — gives the
 *  player a concrete, winnable target instead of an unreachable #1 score.
 *  TODO(api): server returns the live Top-N cutoff. */
export function getEventCutoff(): number {
  const ev = getActiveEvent();
  const base = Math.round((ev?.questionCount ?? EVENT_LEVELS) * 28 * 0.92); // strong-run ceiling
  return Math.round((base * 0.86) / 10) * 10; // ~rank-100 score, rounded to 10
}

// ─── Standing LEAGUE leaderboard (the always-on cohort ranking) ─────────────────
// Your league = a ~30-player cohort in your division+subject, ranked by SEASON
// POINTS. Top promote, bottom relegate at season end. Scopes let you also see
// friends/school/national, but the cohort ("My League") is what drives promotion.
export function getBoard(state: ArenaState, scope: ArenaScope = "league"): LeaderboardEntry[] {
  const subjectId = state.activeSubjectId;
  const standing = activeStanding(state);
  const myScore = standing.seasonPoints;
  const size = scope === "league" ? COHORT_SIZE : scope === "friends" ? 12 : scope === "school" ? 24 : 50;
  // Cohort top: just above you in your own league (you're competitive, near the
  // promotion line), progressively higher in wider crowds (you place lower nationally).
  const mult = scope === "league" ? 1.05 : scope === "friends" ? 1.18 : scope === "school" ? 1.4 : 1.9;
  const top = Math.max(Math.round(myScore * mult), myScore + 120, 600);
  return buildBoard(`league-${state.divisionId}-${subjectId}-${scope}`, size, myScore, top);
}

export function myRank(state: ArenaState): number {
  return getBoard(state, "league").find((e) => e.isMe)?.rank ?? COHORT_SIZE;
}

/** Promotion/relegation zone for a rank in YOUR tier's cohort. */
export function zoneForRank(tierId: TierId, rank: number): "promote" | "hold" | "relegate" {
  const t = getTier(tierId);
  if (rank <= t.promote) return "promote";
  if (t.relegate > 0 && rank > COHORT_SIZE - t.relegate) return "relegate";
  return "hold";
}

// ─── Squads + collective boards (E5-3 / E5-4 — the virality engine) ─────────────
const SQUAD_NAMES = ["Quiz Khiladis", "Brainstormers", "The Toppers", "Mind Warriors", "Rank Raiders", "Logic Legends", "Prep Pirates", "Apex Minds"];
const SCHOOL_NAMES = ["DPS R.K. Puram", "Allen Career", "FIITJEE", "Narayana", "Sri Chaitanya", "Kendriya Vidyalaya", "DAV Public", "Delhi Public"];
export const MY_SQUAD_NAME = "Quiz Khiladis";
export const MY_SCHOOL_NAME = "DPS R.K. Puram";

export interface SquadMember { name: string; xp: number; isMe?: boolean }
export interface Squad { id: string; name: string; members: SquadMember[] }
export interface CollectiveRow { rank: number; name: string; score: number; members: number; isMe: boolean }

function pickName(key: string, i: number): string {
  const f = FIRST_NAMES[Math.floor(seeded(key, i * 31 + 11) * FIRST_NAMES.length)];
  const l = LAST_INITIALS[Math.floor(seeded(key, i * 37 + 17) * LAST_INITIALS.length)];
  return `${f} ${l}`;
}

/** Your squad: you + 4 squadmates; contribution scales with your league points. */
export function getMySquad(state: ArenaState): Squad {
  const myScore = Math.max(400, activeStanding(state).seasonPoints); // league points → squad contribution
  const key = `squad-${state.divisionId}-${state.activeSubjectId}`;
  const mates: SquadMember[] = Array.from({ length: 4 }, (_, i) => ({
    name: pickName(key, i),
    xp: Math.max(120, Math.round(myScore * (0.55 + seeded(key, i * 5 + 1) * 0.8))),
  }));
  return {
    id: "my-squad",
    name: MY_SQUAD_NAME,
    members: [{ name: "You", xp: myScore, isMe: true }, ...mates].sort((a, b) => b.xp - a.xp),
  };
}
export function squadCombined(sq: Squad): number {
  return sq.members.reduce((s, m) => s + m.xp, 0);
}

/** Rank a set of collective entities (squads or schools), inserting "yours". */
function buildCollective(seedKey: string, names: string[], myName: string, myScore: number, memberBase: number): CollectiveRow[] {
  const top = Math.max(myScore + 400, Math.round(myScore * 1.5));
  const rows = names.filter((n) => n !== myName).map((name, i) => ({
    name,
    score: Math.max(100, Math.round(top - (i + 1) * (top * 0.11) + (seeded(seedKey, i * 7 + 3) - 0.5) * (top * 0.08))),
    members: memberBase + Math.floor(seeded(seedKey, i * 13 + 2) * memberBase),
    isMe: false,
  }));
  rows.push({ name: myName, score: myScore, members: memberBase + 2, isMe: true });
  rows.sort((a, b) => b.score - a.score);
  return rows.map((r, i) => ({ rank: i + 1, ...r }));
}

export function getSquadBoard(state: ArenaState): CollectiveRow[] {
  return buildCollective(`squadboard-${state.activeSubjectId}`, SQUAD_NAMES, MY_SQUAD_NAME, squadCombined(getMySquad(state)), 4);
}
export function getSchoolBoard(state: ArenaState): CollectiveRow[] {
  // A school's collective score aggregates many students.
  return buildCollective(`schoolboard-${state.activeSubjectId}`, SCHOOL_NAMES, MY_SCHOOL_NAME, Math.round(activeStanding(state).seasonPoints * 14 + 4000), 120);
}

// ─── Mastery map (E6-3) + weak-area (E7-4) ─────────────────────────────────────
/** Unique concepts covered by a subject's question bank. */
// Concept lists per subject so a multi-subject track shows a real, distinct
// breakdown (not the same concepts repeated). Maths derives from its live bank so
// weak-area detection (which reads question concepts) lines up.
// TODO(api): replace with the real per-subject syllabus + question banks.
const CONCEPTS_BY_SUBJECT: Record<string, string[]> = {
  physics: ["Kinematics", "Newton's Laws", "Work & Energy", "Electrostatics", "Optics", "Thermodynamics"],
  chemistry: ["Mole Concept", "Periodic Table", "Chemical Bonding", "Acids & Bases", "Organic Basics", "Equilibrium"],
  biology: ["Cell Biology", "Genetics", "Human Physiology", "Ecology", "Plant Biology"],
  gk: ["Geography", "History", "Polity", "Current Affairs", "Science & Tech"],
  aptitude: ["Reasoning", "Series", "Coding-decoding", "Data Interpretation", "Arithmetic"],
};

export function subjectConcepts(subjectId: string): string[] {
  if (subjectId === "maths") return [...new Set(MATHS_Q.map((q) => q.concept))];
  return CONCEPTS_BY_SUBJECT[subjectId] ?? [...new Set(GENERIC_Q.map((q) => q.concept))];
}

/** Per-concept mastery for the current subject — a deterministic baseline nudged
 *  DOWN for concepts you recently missed, so weak areas surface. Weakest first. */
export interface MasteryConcept { concept: string; pct: number }
export interface SubjectMastery { subjectId: string; label: string; concepts: MasteryConcept[] }

/** Per-SUBJECT mastery for the active track (an exam spans several subjects).
 *  Each subject's concepts are a seeded baseline nudged DOWN for concepts you
 *  recently missed. Weakest concept first within each subject. */
export function getMastery(state: ArenaState): SubjectMastery[] {
  const weak = new Set((state.lastResult?.review ?? []).filter((r) => r.picked !== r.correct).map((r) => r.concept));
  return state.subjects.map((subjectId) => ({
    subjectId,
    label: getSubject(subjectId).label,
    concepts: subjectConcepts(subjectId)
      .map((concept, i) => {
        let pct = 48 + Math.round(seeded(`mastery-${subjectId}-${concept}`, i) * 47); // 48–95
        if (weak.has(concept)) pct = Math.max(22, pct - 32);
        return { concept, pct };
      })
      .sort((a, b) => a.pct - b.pct),
  }));
}

// ─── Rewards ───────────────────────────────────────────────────────────────────
export type ClaimStatus = "unclaimed" | "claimed";
export type RewardTier = "top" | "promotion" | "streak" | "sponsor";

export interface ArenaReward {
  id: string;
  tier: RewardTier;
  title: string;
  sub: string;
  kind: "voucher" | "gems" | "badge" | "coupon" | "giftcard" | "discount" | "pass" | "merch";
  /** Reward earned only if the condition holds for the current state. */
  earned: (s: ArenaState) => boolean;
}

// The full reward catalogue — every kind a student can win (cash vouchers, gift
// cards, discount coupons, Hearts, passes, cosmetics). A mix of already-earned and
// still-locked so the wall always has something to chase.
// TODO(api): GET /api/arena/me/rewards — server returns earned/claimed state.
export const ARENA_REWARDS: ArenaReward[] = [
  { id: "streak",      tier: "streak",    title: "Streak shield",         sub: "7-day streak reward",          kind: "badge",    earned: (s) => s.streakDays >= 7 },
  { id: "giftcard",    tier: "top",       title: "₹500 Amazon gift card", sub: "Won a weekend event",          kind: "giftcard", earned: () => true },
  { id: "sponsor",     tier: "sponsor",   title: "Flat ₹150 off boAt",    sub: "Sponsored arena reward",       kind: "coupon",   earned: () => true },
  { id: "discount",    tier: "sponsor",   title: "20% off any course",    sub: "Arena member perk",            kind: "discount", earned: () => true },
  { id: "promo",       tier: "promotion", title: "500 Hearts",            sub: "Reach Level 10 in any event",  kind: "gems",     earned: (s) => Object.values(s.events ?? {}).some((p) => (p?.highestCleared ?? 0) >= 10) },
  { id: "top3",        tier: "top",       title: "₹200 voucher",          sub: "Finish Top 3 in any event",    kind: "voucher",  earned: (s) => (s.eventEntry?.rank ?? 999) <= 3 },
  { id: "pass",        tier: "top",       title: "Free mock-test pass",   sub: "Top 100 in Grand Aptitude",    kind: "pass",     earned: (s) => (s.eventEntry?.rank ?? 999) <= 100 },
  { id: "scholarship", tier: "top",       title: "₹1,000 scholarship",    sub: "National rank — Top 50",       kind: "voucher",  earned: (s) => (s.eventEntry?.rank ?? 999) <= 50 },
  { id: "frame",       tier: "streak",    title: "Champion avatar frame", sub: "Clear the Champions Ladder",   kind: "merch",    earned: (s) => Object.values(s.events ?? {}).some((p) => (p?.highestCleared ?? 0) >= 50) },
];

// ─── State store ─────────────────────────────────────────────────────────────
export interface EventEntry {
  eventId: string;
  score: number;
  correct: number;
  incorrect: number;
  answered: number;
  accuracy: number;
  bestStreak: number;
  reachedLevel: number;
  ranOutOfLives: boolean;
  rank: number;
  review: ReviewItem[];
  reviewed?: boolean;
}

export interface ArenaState {
  onboarded: boolean;
  divisionId: DivisionId;    // the division you compete in (inferred, never asked cold)
  subjects: string[];        // subject league tracks you climb within the division
  activeSubjectId: string;   // which league you're currently viewing/playing
  leagues: Record<string, LeagueStanding>; // subjectId → your tier + season points
  isPaid: boolean;           // gates Pro/elite arenas — NEVER changes rank or progress
  streakDays: number;
  energy: number;            // sprints left today
  lastResult?: SprintResult;
  eventEntry?: EventEntry;   // best run in the active weekend event (legacy)
  claims: Record<string, ClaimStatus>;
  // ── Event-centric spine ──────────────────────────────────────────────────
  hearts: number;                            // spendable currency (Hearts — store, retries, spins)
  xp: number;                                // experience — drives the app's leveling
  retryTickets: number;                      // re-attempt a failed level without a fresh run
  events: Record<string, EventProgress>;     // per-event progress (level / score / hearts)
  lastLevelResult?: LevelResult;             // hand-off to the level-result screen
  lastSpinAt?: number;                       // gates the free daily spin
  // Daily Sprint — once-a-day result (LinkedIn-games style "where you stand today").
  dailyDone?: { dayKey: string; score: number; accuracy: number; correct: number; total: number; timeSec: number };
}

/** Day bucket for the once-a-day daily sprint (local date). */
export function dayKeyNow(): string {
  return new Date().toDateString();
}
/** Has the daily sprint been played today? */
export function dailyDoneToday(state: ArenaState): boolean {
  return state.dailyDone?.dayKey === dayKeyNow();
}

/** Free spin available? (Prototype: once per ~20h, or if never spun.) */
export function canSpinNow(state: ArenaState, now: number = Date.now()): boolean {
  return !state.lastSpinAt || now - state.lastSpinAt >= 20 * HOUR;
}
/** Your progress in an event (undefined until you enter it). */
export function eventProgress(state: ArenaState, eventId: string): EventProgress | undefined {
  return state.events[eventId];
}

/** Your league standing in the subject you're currently viewing. */
export function activeStanding(state: ArenaState): LeagueStanding {
  return state.leagues[state.activeSubjectId] ?? { tier: "bronze", seasonPoints: 0, xp: 0, level: 1 };
}
export function activeSubjectId(state: ArenaState): string {
  return state.activeSubjectId;
}

const EVENT_NAME = "arena-state-change";

// Seed: a Class 9–10 student (matches the wireframe), Silver League in Maths with a
// 2,655-point season (≈ rank #3), climbing Physics + Biology too. 12-day streak.
function seedState(): ArenaState {
  return {
    onboarded: true,
    divisionId: "c9-10",
    subjects: ["maths", "physics", "biology"],
    activeSubjectId: "maths",
    // level = SKILL (drives question difficulty); xp/seasonPoints = SCORE (rank the
    // leaderboard). Maths is the strongest track (Level 12), Physics mid, Biology new.
    leagues: {
      maths: { tier: "silver", seasonPoints: 2655, xp: 6820, level: 12 },
      physics: { tier: "bronze", seasonPoints: 1180, xp: 3180, level: 7 },
      biology: { tier: "bronze", seasonPoints: 640, xp: 1640, level: 4 },
    },
    isPaid: true,
    streakDays: 12,
    energy: 4,
    claims: { sponsor: "claimed", discount: "claimed" },
    hearts: 140,
    xp: 3280,
    retryTickets: 2,
    // A finished free ladder (Saturday Showdown, 30 levels — earns the milestone +
    // Climber badges) plus a mid-climb in the live "Speed Climb" ladder.
    events: {
      "saturday-showdown": { eventId: "saturday-showdown", highestCleared: 30, score: 2450, heartsEarned: 300, bestAccuracy: 91, attempts: 16 },
      "speed-climb": { eventId: "speed-climb", highestCleared: 7, score: 1180, heartsEarned: 120, bestAccuracy: 84, attempts: 11 },
      // Masters Arena (recurring, currently locked): fresh this instance, but last week's
      // result is archived in `lastRun` → powers the locked page's "Your last run" card.
      "masters-arena": { eventId: "masters-arena", highestCleared: 0, score: 0, heartsEarned: 0, bestAccuracy: 0, attempts: 0, lastRun: { level: 22, rank: 14, accuracy: 88 } },
    },
    lastSpinAt: undefined,
    // Already did today's Daily Sprint → shows the "where you stand today" standing.
    dailyDone: { dayKey: dayKeyNow(), score: 152, accuracy: 86, correct: 6, total: 7, timeSec: 96 },
  };
}

// A freshly-placed student who has never played: their division, one subject,
// Bronze with 0 season points, free, full energy, no streak. For `?demo=new`.
function seedNewUser(): ArenaState {
  return {
    onboarded: true,
    divisionId: "c9-10",
    subjects: ["maths"],
    activeSubjectId: "maths",
    leagues: { maths: { tier: "bronze", seasonPoints: 0, xp: 0, level: 1 } }, // Level 1, fresh
    isPaid: false,
    streakDays: 0,
    energy: MAX_ENERGY,
    claims: {},
    hearts: 0,
    xp: 0,
    retryTickets: 1,
    events: {},
    lastSpinAt: undefined,
  };
}

export type ArenaSeedVariant = "pro" | "new";

let STATE: ArenaState = seedState();

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export interface UseArenaStateReturn {
  state: ArenaState;
  /** Set your division (optional) + which subject leagues you climb. Reconciles —
   *  same-division kept subjects retain their standing; new ones start Bronze.
   *  Changing division resets ALL standings (you join fresh cohorts there). */
  place: (subjectIds: string[], divisionId?: DivisionId) => void;
  setActiveSubject: (id: string) => void;
  /** Toggle Pro (gates elite arenas — never changes rank or progress). */
  setPaid: (v: boolean) => void;
  /** Apply a finished sprint: add league points to the active subject + re-rank. */
  completeSprint: (r: Omit<SprintResult, "subjectId" | "tier" | "pointsBefore" | "pointsAfter" | "rankBefore" | "rankAfter" | "levelBefore" | "levelAfter">) => SprintResult;
  /** Submit a weekend-event run: keeps your best score + recomputes event rank. */
  completeEvent: (r: Omit<EventEntry, "rank" | "eventId">) => EventEntry;
  /** Mark the post-arena review done (learning loop). */
  markReviewed: (mode: "sprint" | "event") => void;
  getClaim: (id: string) => ClaimStatus;
  claim: (id: string) => void;
  /** Reset to a demo state — "pro" (established) or "new" (fresh). */
  reset: (variant?: ArenaSeedVariant) => void;
  // ── Event-centric actions ───────────────────────────────────────────────
  /** Start tracking an event (seeds empty progress the first time you enter). */
  enterEvent: (eventId: string) => EventProgress;
  /** Apply a finished level: bank score + gems, advance the ladder, store result. */
  completeLevel: (result: LevelResult) => void;
  /** Spend a retry ticket to re-attempt a level. Returns false if none left. */
  useRetryTicket: () => boolean;
  /** Add Hearts (level rewards, spins, milestones). */
  addHearts: (n: number) => void;
  /** Add XP (drives leveling). */
  addXp: (n: number) => void;
  /** Grant retry tickets (e.g. bought with Hearts). */
  addTickets: (n: number) => void;
  /** Spend Hearts. Returns false if the balance is too low. */
  spendHearts: (n: number) => boolean;
  /** Record a daily spin reward (Hearts / XP / retry tickets) + stamp the gate. */
  spin: (reward: { hearts?: number; xp?: number; tickets?: number }) => void;
}

export function useArenaState(): UseArenaStateReturn {
  const [, force] = useState(0);
  useEffect(() => {
    const handler = () => force((n) => n + 1);
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return {
    state: STATE,
    // Set which subject leagues you climb within your division. RECONCILES: kept
    // subjects retain their league standing; new ones start Bronze; deselected drop.
    // Division is inferred (kept from state). Only a true first-time placement seeds
    // streak/energy/paid.
    place: (subjectIds, divisionId) => {
      const firstTime = !STATE.onboarded;
      const div = divisionId ?? STATE.divisionId ?? "c9-10";
      const divChanged = div !== STATE.divisionId;
      const offered = subjectsForDivision(div);
      const valid = subjectIds.filter((s) => offered.includes(s));
      const safe = valid.length ? valid : [offered[0]];
      const leagues: Record<string, LeagueStanding> = {};
      // Same division → keep hard-won standings; new division → fresh cohorts (Bronze).
      safe.forEach((s) => { leagues[s] = (!divChanged && STATE.leagues?.[s]) ? STATE.leagues[s] : { tier: "bronze", seasonPoints: 0, xp: 0, level: 1 }; });
      STATE = {
        ...STATE,
        onboarded: true,
        divisionId: div,
        subjects: safe,
        activeSubjectId: (!divChanged && safe.includes(STATE.activeSubjectId)) ? STATE.activeSubjectId : safe[0],
        leagues,
        isPaid: firstTime ? false : STATE.isPaid,
        streakDays: firstTime ? 0 : STATE.streakDays,
        energy: firstTime ? MAX_ENERGY : STATE.energy,
        claims: firstTime ? {} : STATE.claims,
        lastResult: (firstTime || divChanged) ? undefined : STATE.lastResult,
        eventEntry: (firstTime || divChanged) ? undefined : STATE.eventEntry,
      };
      emit();
    },
    setActiveSubject: (id) => { STATE = { ...STATE, activeSubjectId: id }; emit(); },
    setPaid: (v) => { STATE = { ...STATE, isPaid: v }; emit(); },
    completeSprint: (r) => {
      const subjectId = STATE.activeSubjectId;
      const standing = activeStanding(STATE);
      const pointsBefore = standing.seasonPoints;
      const rankBefore = myRank(STATE);
      const pointsAfter = pointsBefore + r.xp;
      // Score (xp/seasonPoints) always accrues — it ranks the leaderboard.
      const xpAfter = standing.xp + r.xp;
      // SKILL level-up is SEPARATE: a strong, accurate run (you proved skill at this
      // difficulty) bumps your level by 1, which then serves harder questions.
      // TODO(api): server decides the new level from demonstrated skill.
      const levelBefore = standing.level;
      const strong = r.accuracy >= 70 && r.correct >= Math.ceil(SPRINT_LEVELS * 0.6);
      const levelAfter = strong ? levelBefore + 1 : levelBefore;
      const leagues = { ...STATE.leagues, [subjectId]: { tier: standing.tier, seasonPoints: pointsAfter, xp: xpAfter, level: levelAfter } };
      const afterState = { ...STATE, leagues };
      const rankAfter = myRank(afterState);
      const full: SprintResult = {
        ...r, subjectId, tier: standing.tier, pointsBefore, pointsAfter, rankBefore, rankAfter,
        levelBefore, levelAfter,
      };
      STATE = { ...afterState, energy: Math.max(0, STATE.energy - 1), lastResult: full };
      emit();
      return full;
    },
    completeEvent: (r) => {
      const ev = getActiveEvent();
      const subjectId = activeSubjectId(STATE);
      const prev = STATE.eventEntry;
      const keepPrev = !!prev && prev.eventId === ev?.id && prev.score >= r.score;
      const base: Omit<EventEntry, "rank"> = keepPrev ? prev! : { eventId: ev?.id ?? "", ...r };
      const entry: EventEntry = { ...base, rank: getEventRank(subjectId, base.score) };
      STATE = { ...STATE, eventEntry: entry };
      emit();
      return entry;
    },
    markReviewed: (mode) => {
      if (mode === "event") {
        if (!STATE.eventEntry || STATE.eventEntry.reviewed) return;
        STATE = { ...STATE, eventEntry: { ...STATE.eventEntry, reviewed: true } };
      } else {
        if (!STATE.lastResult || STATE.lastResult.reviewed) return;
        STATE = { ...STATE, lastResult: { ...STATE.lastResult, reviewed: true } };
      }
      emit();
    },
    getClaim: (id) => STATE.claims[id] ?? "unclaimed",
    claim: (id) => {
      STATE = { ...STATE, claims: { ...STATE.claims, [id]: "claimed" } };
      emit();
    },
    reset: (variant) => { STATE = variant === "new" ? seedNewUser() : seedState(); emit(); },
    enterEvent: (eventId) => {
      let p = STATE.events[eventId];
      if (!p) {
        p = { eventId, highestCleared: 0, score: 0, heartsEarned: 0, bestAccuracy: 0, attempts: 0 };
        STATE = { ...STATE, events: { ...STATE.events, [eventId]: p } };
        emit();
      }
      return p;
    },
    completeLevel: (result) => {
      const prev = STATE.events[result.eventId]
        ?? { eventId: result.eventId, highestCleared: 0, score: 0, heartsEarned: 0, bestAccuracy: 0, attempts: 0 };
      // Score + gems accrue only when you ADVANCE the ladder (clear a new level) —
      // replays can't farm currency, but still let you sharpen accuracy.
      const isAdvance = result.cleared && result.level > prev.highestCleared;
      const next: EventProgress = {
        ...prev,
        attempts: prev.attempts + 1,
        highestCleared: isAdvance ? result.level : prev.highestCleared,
        score: prev.score + (isAdvance ? result.scoreGained : 0),
        heartsEarned: prev.heartsEarned + (isAdvance ? result.heartsGained : 0),
        bestAccuracy: Math.max(prev.bestAccuracy, result.accuracy),
      };
      STATE = {
        ...STATE,
        events: { ...STATE.events, [result.eventId]: next },
        hearts: STATE.hearts + (isAdvance ? result.heartsGained : 0),
        xp: STATE.xp + (isAdvance ? result.xpGained : 0),
        lastLevelResult: result,
        // Daily Sprint → record today's once-a-day result for the standing view.
        dailyDone: result.daily
          ? { dayKey: dayKeyNow(), score: result.scoreGained || result.correct * 24, accuracy: result.accuracy, correct: result.correct, total: result.total, timeSec: result.timeSec ?? 0 }
          : STATE.dailyDone,
      };
      emit();
    },
    useRetryTicket: () => {
      if (STATE.retryTickets <= 0) return false;
      STATE = { ...STATE, retryTickets: STATE.retryTickets - 1 };
      emit();
      return true;
    },
    addHearts: (n) => { STATE = { ...STATE, hearts: STATE.hearts + n }; emit(); },
    addXp: (n) => { STATE = { ...STATE, xp: STATE.xp + n }; emit(); },
    addTickets: (n) => { STATE = { ...STATE, retryTickets: STATE.retryTickets + n }; emit(); },
    spendHearts: (n) => {
      if (STATE.hearts < n) return false;
      STATE = { ...STATE, hearts: STATE.hearts - n };
      emit();
      return true;
    },
    spin: (reward) => {
      STATE = {
        ...STATE,
        hearts: STATE.hearts + (reward.hearts ?? 0),
        xp: STATE.xp + (reward.xp ?? 0),
        retryTickets: STATE.retryTickets + (reward.tickets ?? 0),
        lastSpinAt: Date.now(),
      };
      emit();
    },
  };
}

/** Concepts you got wrong, most-missed first — powers weak-area + the mastery map. */
export function weakConcepts(review: ReviewItem[]): { concept: string; misses: number }[] {
  const missed = review.filter((r) => r.picked !== r.correct);
  const counts = new Map<string, number>();
  for (const r of missed) counts.set(r.concept, (counts.get(r.concept) ?? 0) + 1);
  return [...counts.entries()].map(([concept, misses]) => ({ concept, misses })).sort((a, b) => b.misses - a.misses);
}
