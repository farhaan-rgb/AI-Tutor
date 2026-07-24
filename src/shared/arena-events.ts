/**
 * Arena Events — the event-centric model (the new spine).
 *
 * An EVENT is a self-contained contest. Unlike the old persistent League/Tier
 * season, everything that matters lives INSIDE the event:
 *   • a per-event LEVEL ladder (1 → maxLevel, up to 50) that resets each instance
 *   • a per-event LEADERBOARD (your level, your rank, the top rankers)
 *   • a per-event REWARD ROADMAP (gems + badges per level; a real prize for the
 *     top performers at close)
 *
 * Three formats, one model:
 *   • ladder — the hero. Recurring, scheduled, locked-with-countdown before it
 *     opens. Climb up to 50 levels; difficulty AND question variety rise as you go.
 *   • exam   — a single timed paper (the "3-hour exam"), ranked by score.
 *   • sprint — the always-on daily warm-up: short, one run a day, feeds gems +
 *     a daily leaderboard. The low-commitment habit loop.
 *
 * Content here is DUMMY and shaped to its eventual API. State (your progress,
 * gems, spins) lives in arena.ts so there's one store.
 *
 *   TODO(api): GET /api/arena/events                  — scheduled events for my division
 *   TODO(api): GET /api/arena/events/:id/level/:n     — server-served question set
 *   TODO(api): GET /api/arena/events/:id/leaderboard  — server-ranked board
 */

import { buildBoard, seeded, questionPoints, type Question, type QuestionType, type ReviewItem } from "./arena";
import type { LeaderboardEntry, OlympiadIconKey } from "./olympiads";

const NOW = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// ─── Event model ───────────────────────────────────────────────────────────────
export type EventFormat = "ladder" | "exam" | "sprint";
export type EventGate = "free" | "gyd-pass";
export type EventPhase = "locked" | "live" | "ended";

/** One stop on the reward roadmap — what clearing a given level hands you. */
export interface RewardStop {
  level: number;
  hearts?: number;
  badge?: string;       // milestone badge label
  cert?: string;        // certificate label (top of the ladder — recognition, not cash)
  prizeLabel?: string;  // headline prize (top of the ladder)
  icon: "heart" | "badge" | "trophy" | "shield";
}

export interface ArenaEvent {
  id: string;
  title: string;
  theme: string;            // one-line subtitle
  accent: string;           // CSS-var token
  iconKey: OlympiadIconKey;
  format: EventFormat;
  gate: EventGate;
  subjectId: string;        // the league/subject it belongs to
  anySubject?: boolean;     // true → shows regardless of the active subject filter
  recurrence: string;       // "Every Saturday" · "Every 3 days" · "Daily" · "One-time"
  startsAt: number;
  endsAt: number;
  prizeLabel: string;       // weekly leaderboard prize — top-N points-earners win it
  promoteTop: number;       // top-N on the WEEKLY board who win the cash prize
  boardReset?: string;      // when the leaderboard wipes, e.g. "every Sunday" — fresh board each cycle
  completionBadge?: string; // exclusive badge for clearing the full ladder (paid > free prestige)
  pointsMultiplier?: number;// paid perk — banks N× points toward the weekly board
  comingSoon?: boolean;     // teaser — announced to build hype, exact open date not set yet
  teaser?: string;          // coming-soon "what to expect" hook line
  // ladder
  maxLevel?: number;        // up to 50
  questionsPerLevel?: number;
  livesPerLevel?: number;
  // exam
  durationMinutes?: number;
  questionCount?: number;
}

// ─── The schedule (DUMMY — a vivid, demoable mix of phases) ─────────────────────
// TODO(api): GET /api/arena/events — server schedules these per division.
export const DUMMY_EVENTS: ArenaEvent[] = [
  {
    id: "saturday-showdown",
    title: "Saturday Showdown",
    theme: "The free weekly climb. Top the board, win a voucher.",
    accent: "var(--purple-500)",
    iconKey: "math",
    format: "ladder", gate: "free", subjectId: "maths",
    recurrence: "Every Saturday · 9 AM – 9 PM",
    startsAt: NOW - 1 * DAY,                       // LIVE
    endsAt: NOW + 2 * DAY,
    maxLevel: 30, questionsPerLevel: 5, livesPerLevel: 3,
    prizeLabel: "₹500 voucher + Climber badge", promoteTop: 5,
    boardReset: "every Saturday", completionBadge: "Climber",
  },
  {
    id: "speed-climb",
    title: "Speed Climb",
    theme: "A 30-level dash that refreshes every 3 days.",
    accent: "var(--teal-500)",
    iconKey: "science",
    format: "ladder", gate: "free", subjectId: "physics",
    recurrence: "Every 3 days",
    startsAt: NOW - 6 * HOUR,                      // LIVE
    endsAt: NOW + 2 * DAY + 6 * HOUR,
    maxLevel: 30, questionsPerLevel: 5, livesPerLevel: 3,
    prizeLabel: "500 Hearts", promoteTop: 100,
  },
  {
    id: "champions-ladder",
    title: "Champions Ladder",
    theme: "The toughest 50 levels · 2× points.",
    accent: "var(--warning-500)",
    iconKey: "general",
    format: "ladder", gate: "gyd-pass", subjectId: "maths",
    recurrence: "Every Sunday · 6 – 11 PM",
    startsAt: NOW - 1 * DAY,                       // LIVE (gated)
    endsAt: NOW + 6 * HOUR,                         // ends in 6h
    maxLevel: 50, questionsPerLevel: 5, livesPerLevel: 2,
    prizeLabel: "₹2,500 cash", promoteTop: 5,
    boardReset: "every Sunday", completionBadge: "Champion", pointsMultiplier: 2,
  },
  {
    id: "grand-aptitude-test",
    title: "Grand Aptitude Test",
    theme: "One 90-minute paper. National rank + certificate.",
    accent: "var(--primary-500)",
    iconKey: "aptitude",
    format: "exam", gate: "free", subjectId: "aptitude", anySubject: true,
    recurrence: "One-time",
    startsAt: NOW + 5 * HOUR,                      // LOCKED — opens in 5h
    endsAt: NOW + 5 * HOUR + 90 * MIN,
    durationMinutes: 90, questionCount: 60,
    prizeLabel: "Top 100 win ₹500 + certificate", promoteTop: 100,
  },
  {
    id: "grandmaster-paper",
    title: "Grandmaster Paper",
    theme: "Pass-holder exam. 120-minute paper, national rank + certificate.",
    accent: "var(--purple-500)",
    iconKey: "aptitude",
    format: "exam", gate: "gyd-pass", subjectId: "aptitude", anySubject: true,
    recurrence: "Monthly",
    startsAt: NOW + 1 * DAY + 2 * HOUR,            // LOCKED — opens in ~1 day
    endsAt: NOW + 1 * DAY + 4 * HOUR,
    durationMinutes: 120, questionCount: 75,
    prizeLabel: "Top 50 win ₹5,000 + certificate", promoteTop: 50,
    completionBadge: "Grandmaster",
  },
  {
    id: "masters-arena",
    title: "Masters Arena",
    theme: "The premium 50-level ladder · bigger prizes.",
    accent: "var(--purple-400)",
    iconKey: "general",
    format: "ladder", gate: "gyd-pass", subjectId: "maths", anySubject: true,
    recurrence: "Every Friday · 6 – 11 PM",
    startsAt: NOW + 3 * HOUR,                       // LOCKED — opens in 3h
    endsAt: NOW + 3 * HOUR + 5 * HOUR,
    maxLevel: 50, questionsPerLevel: 5, livesPerLevel: 2,
    prizeLabel: "₹5,000 cash", promoteTop: 10,
    boardReset: "every Friday", completionBadge: "Masters", pointsMultiplier: 2,
  },
  // ── Coming soon (teasers — build hype, no firm open date) ──────────────────────
  {
    id: "national-olympiad-cup",
    title: "National Olympiad Cup",
    theme: "India's biggest aptitude showdown — one nationwide paper.",
    teaser: "₹1,00,000 prize pool · all classes",
    comingSoon: true,
    accent: "var(--error-500)",
    iconKey: "aptitude",
    format: "exam", gate: "free", subjectId: "aptitude", anySubject: true,
    recurrence: "Coming this season",
    startsAt: NOW + 24 * DAY,
    endsAt: NOW + 24 * DAY + 3 * HOUR,
    durationMinutes: 180, questionCount: 100,
    prizeLabel: "₹1,00,000 prize pool", promoteTop: 500,
  },
  {
    id: "midnight-marathon",
    title: "Midnight Marathon",
    theme: "50 levels, one night. For the relentless.",
    teaser: "Overnight ladder · double Hearts",
    comingSoon: true,
    accent: "var(--teal-500)",
    iconKey: "general",
    format: "ladder", gate: "free", subjectId: "maths", anySubject: true,
    recurrence: "Launching soon",
    startsAt: NOW + 12 * DAY,
    endsAt: NOW + 12 * DAY + 8 * HOUR,
    maxLevel: 50, questionsPerLevel: 5, livesPerLevel: 3,
    prizeLabel: "1,000 Hearts", promoteTop: 50,
    boardReset: "each run",
  },
  {
    id: "boss-battle",
    title: "Boss Battle",
    theme: "Beat the Level-50 boss to claim the crown.",
    teaser: "GYD Max · exclusive Boss badge",
    comingSoon: true,
    accent: "var(--warning-500)",
    iconKey: "science",
    format: "ladder", gate: "gyd-pass", subjectId: "physics", anySubject: true,
    recurrence: "Launching soon",
    startsAt: NOW + 18 * DAY,
    endsAt: NOW + 18 * DAY + 6 * HOUR,
    maxLevel: 50, questionsPerLevel: 5, livesPerLevel: 2,
    prizeLabel: "₹10,000 + Boss badge", promoteTop: 1,
    completionBadge: "Boss Slayer", pointsMultiplier: 3,
  },
  {
    id: "daily-sprint",
    title: "Daily Sprint",
    theme: "7 quick questions. Keep your streak alive.",
    accent: "var(--success-500)",
    iconKey: "general",
    format: "sprint", gate: "free", subjectId: "maths", anySubject: true,
    recurrence: "Daily · resets midnight",
    startsAt: NOW - 12 * HOUR,                     // always-on (rolling)
    endsAt: NOW + 12 * HOUR,
    questionsPerLevel: 7, livesPerLevel: 3,
    prizeLabel: "200 Hearts", promoteTop: 10, boardReset: "at midnight",
  },
];

export function getEvent(id: string): ArenaEvent | undefined {
  return DUMMY_EVENTS.find((e) => e.id === id);
}
export function listEvents(): ArenaEvent[] {
  return DUMMY_EVENTS;
}

// ─── Schedule / phase ───────────────────────────────────────────────────────────
/** Where an event is in its window + the timestamp the UI counts down to. */
export function eventStatus(ev: ArenaEvent, now: number = Date.now()): { phase: EventPhase; countdownTo: number } {
  if (now < ev.startsAt) return { phase: "locked", countdownTo: ev.startsAt };
  if (now < ev.endsAt) return { phase: "live", countdownTo: ev.endsAt };
  return { phase: "ended", countdownTo: ev.endsAt };
}

// ─── Level rules (difficulty + question variety scale with the climb) ────────────
/** Difficulty floor (1–4) for a level, scaled across the ladder's height. */
export function difficultyForLevel(level: number, maxLevel = 50): 1 | 2 | 3 | 4 {
  const band = Math.ceil((level / maxLevel) * 4);
  return Math.min(4, Math.max(1, band)) as 1 | 2 | 3 | 4;
}

/** Which question TYPES a level can serve — warm formats early, unguessable and
 *  exam-authentic ones as you climb. This is what makes "complete a level" mean
 *  real work, not four-option guessing. */
export function typesForLevel(level: number): QuestionType[] {
  // "fill" = short typed answers only (numeric / one-token), never long-form essays —
  // those stay objective and auto-gradable.
  if (level <= 10) return ["mcq", "boolean"];
  if (level <= 20) return ["mcq", "boolean", "fill", "multi"];
  if (level <= 35) return ["mcq", "fill", "multi", "match", "assertion"];
  return ["mcq", "fill", "multi", "match", "order", "assertion"];
}

/** Lives for a level — the top of the ladder tightens to 2 (event can override). */
export function livesForLevel(ev: ArenaEvent, level: number): number {
  const base = ev.livesPerLevel ?? 3;
  if ((ev.maxLevel ?? 50) >= 40 && level > 40) return Math.min(base, 2);
  return base;
}

// ─── Reward roadmap (the Galaxy-Defense-style "earn this at each level" track) ───
/** Hearts you bank for clearing a level — grows in steps as you climb. */
export function heartsForLevel(level: number): number {
  return 8 + Math.floor((level - 1) / 5) * 4; // 8 … rising every 5 levels
}

/** XP you earn for clearing a level — feeds the app's leveling. */
export function xpForLevel(level: number): number {
  return 40 + level * 6;
}

/** Milestone stops for a ladder event's reward track (not every level — the ones
 *  worth showing). Each names what clearing that level hands you. */
// The ladder rewards RECOGNITION, not cash: milestone badges as you climb, and a
// Certificate of Completion (+ the event's exclusive badge) for finishing. Cash is a
// separate, weekly thing — only the top-N points-earners on the board win it.
export function rewardRoadmap(ev: ArenaEvent): RewardStop[] {
  const max = ev.maxLevel ?? 50;
  const marks = [Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75)]
    .filter((v, i, a) => v >= 2 && v < max && a.indexOf(v) === i);
  const badgeNames = ["Rookie Climber", "Halfway Hero", "Summit Seeker"];
  const stops: RewardStop[] = marks.map((level, i) => ({ level, badge: badgeNames[i], icon: "badge" as const }));
  stops.push({ level: max, cert: "Certificate of Completion", badge: ev.completionBadge, icon: "trophy" as const });
  return stops;
}

// ─── Question bank (varied types — DUMMY, shaped to the API) ─────────────────────
// TODO(api): GET /api/arena/events/:id/level/:n — server serves the real set.
type BankItem = Question & { subject: string };

const EVENT_BANK: BankItem[] = [
  // ── mcq ──
  { subject: "maths", type: "mcq", prompt: "What is 18% of 350?", options: ["63", "59", "70", "54"], correct: 0, difficulty: 1, perSeconds: 22, concept: "Percentages", explanation: "0.18 × 350 = 63." },
  { subject: "physics", type: "mcq", prompt: "The SI unit of force is the", options: ["Joule", "Newton", "Watt", "Pascal"], correct: 1, difficulty: 1, perSeconds: 18, concept: "Units", explanation: "Force is measured in newtons (kg·m/s²)." },
  { subject: "maths", type: "mcq", prompt: "Derivative of sin x is", options: ["cos x", "−cos x", "−sin x", "tan x"], correct: 0, difficulty: 3, perSeconds: 26, concept: "Calculus", explanation: "d/dx(sin x) = cos x." },
  { subject: "aptitude", type: "mcq", prompt: "Complete: 2, 6, 12, 20, ?", options: ["28", "30", "32", "26"], correct: 1, difficulty: 2, perSeconds: 24, concept: "Series", explanation: "Differences 4,6,8,10 → 20 + 10 = 30." },
  // ── boolean ──
  { subject: "physics", type: "boolean", prompt: "True or False: A heavier object always falls faster than a lighter one in a vacuum.", options: ["True", "False"], correct: 1, difficulty: 1, perSeconds: 16, concept: "Gravity", explanation: "In a vacuum all objects fall at the same rate." },
  { subject: "biology", type: "boolean", prompt: "True or False: The mitochondrion is the site of photosynthesis.", options: ["True", "False"], correct: 1, difficulty: 2, perSeconds: 16, concept: "Cell Biology", explanation: "Photosynthesis happens in chloroplasts; mitochondria do respiration." },
  { subject: "maths", type: "boolean", prompt: "True or False: Every prime number greater than 2 is odd.", options: ["True", "False"], correct: 0, difficulty: 2, perSeconds: 16, concept: "Number theory", explanation: "Any even number > 2 is divisible by 2, so it can't be prime." },
  // ── fill (short / integer typed answer — NO long-form) ──
  { subject: "maths", type: "fill", prompt: "Solve for x:  3x − 7 = 14", options: [], answer: "7", accept: ["x=7", "x = 7"], correct: 0, difficulty: 2, perSeconds: 28, concept: "Linear equations", explanation: "3x = 21, so x = 7." },
  { subject: "maths", type: "fill", prompt: "The value of 7! ÷ 5! is", options: [], answer: "42", accept: [], correct: 0, difficulty: 3, perSeconds: 26, concept: "Permutations", explanation: "7!/5! = 7 × 6 = 42." },
  { subject: "physics", type: "fill", prompt: "How many seconds are there in 3 minutes?", options: [], answer: "180", accept: [], correct: 0, difficulty: 1, perSeconds: 20, concept: "Units", explanation: "3 × 60 = 180 seconds." },
  // ── multi (select all) ──
  { subject: "maths", type: "multi", prompt: "Select ALL prime numbers.", options: ["51", "53", "59", "57"], correct: 1, correctSet: [1, 2], difficulty: 3, perSeconds: 30, concept: "Number theory", explanation: "53 and 59 are prime; 51 = 3×17, 57 = 3×19." },
  { subject: "physics", type: "multi", prompt: "Select ALL scalar quantities.", options: ["Velocity", "Speed", "Mass", "Force"], correct: 1, correctSet: [1, 2], difficulty: 2, perSeconds: 28, concept: "Vectors", explanation: "Speed and mass are scalars; velocity and force are vectors." },
  { subject: "biology", type: "multi", prompt: "Select ALL that are parts of a plant cell but NOT an animal cell.", options: ["Cell wall", "Nucleus", "Chloroplast", "Mitochondria"], correct: 0, correctSet: [0, 2], difficulty: 3, perSeconds: 30, concept: "Cell Biology", explanation: "Cell wall and chloroplast are unique to plant cells." },
  // ── match ──
  { subject: "chemistry", type: "match", prompt: "Match each element to its symbol.", options: [], pairs: [{ left: "Potassium", right: "K" }, { left: "Iron", right: "Fe" }, { left: "Gold", right: "Au" }, { left: "Lead", right: "Pb" }], correct: 0, difficulty: 3, perSeconds: 40, concept: "Periodic Table", explanation: "K=Potassium, Fe=Iron, Au=Gold, Pb=Lead." },
  { subject: "physics", type: "match", prompt: "Match each quantity to its SI unit.", options: [], pairs: [{ left: "Power", right: "Watt" }, { left: "Energy", right: "Joule" }, { left: "Pressure", right: "Pascal" }, { left: "Charge", right: "Coulomb" }], correct: 0, difficulty: 3, perSeconds: 40, concept: "Units", explanation: "Power→W, Energy→J, Pressure→Pa, Charge→C." },
  // ── order ──
  { subject: "maths", type: "order", prompt: "Arrange in ascending order.", options: [], sequence: ["1/2", "0.6", "2/3", "0.75"], correct: 0, difficulty: 3, perSeconds: 36, concept: "Fractions", explanation: "0.5 < 0.6 < 0.667 < 0.75." },
  { subject: "biology", type: "order", prompt: "Order these from smallest to largest.", options: [], sequence: ["Cell", "Tissue", "Organ", "Organ system"], correct: 0, difficulty: 2, perSeconds: 34, concept: "Biology", explanation: "Cell → Tissue → Organ → Organ system." },
  // ── assertion–reason ──
  { subject: "physics", type: "assertion", prompt: "Assertion: A body in uniform circular motion has constant speed. Reason: The net force on it is zero.", options: ["Both true, R explains A", "Both true, R doesn't explain A", "A true, R false", "A false, R true"], correct: 2, difficulty: 4, perSeconds: 34, concept: "Circular motion", explanation: "Speed is constant (A true) but a centripetal force acts inward, so R is false." },
  { subject: "chemistry", type: "assertion", prompt: "Assertion: Noble gases are inert. Reason: They have completely filled valence shells.", options: ["Both true, R explains A", "Both true, R doesn't explain A", "A true, R false", "A false, R true"], correct: 0, difficulty: 3, perSeconds: 30, concept: "Periodic Table", explanation: "Full valence shells make noble gases stable/inert — R correctly explains A." },
  { subject: "maths", type: "assertion", prompt: "Assertion: The sum of angles in a triangle is 180°. Reason: A straight line measures 180°.", options: ["Both true, R explains A", "Both true, R doesn't explain A", "A true, R false", "A false, R true"], correct: 0, difficulty: 3, perSeconds: 30, concept: "Geometry", explanation: "The parallel-line proof rests on the straight-angle of 180° — R explains A." },
];

/** A level's question set: `questionsPerLevel` items at the level's difficulty +
 *  allowed types, chosen deterministically so a given (event, level) is stable. */
export function getLevelQuestions(ev: ArenaEvent, level: number): Question[] {
  const n = ev.questionsPerLevel ?? 5;
  const diff = difficultyForLevel(level, ev.maxLevel ?? 50);
  const allow = typesForLevel(level);
  const inSubject = (q: BankItem) => ev.anySubject || q.subject === ev.subjectId;
  const key = `${ev.id}-L${level}`;
  const ranked = [...EVENT_BANK]
    .filter((q) => inSubject(q) && allow.includes(q.type ?? "mcq"))
    .sort((a, b) => {
      const da = Math.abs(a.difficulty - diff), db = Math.abs(b.difficulty - diff);
      if (da !== db) return da - db;
      return seeded(key, EVENT_BANK.indexOf(a)) - seeded(key, EVENT_BANK.indexOf(b));
    });
  let picked = ranked.slice(0, n);
  if (picked.length < n) {
    const fill = [...EVENT_BANK].filter((q) => inSubject(q) && !picked.includes(q));
    picked = [...picked, ...fill, ...EVENT_BANK].slice(0, n);
  }
  return picked;
}

// ─── Answer checking ─────────────────────────────────────────────────────────
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "").replace(/^x=/, "");

export function checkChoice(q: Question, index: number): boolean {
  return index === q.correct;
}
export function checkMulti(q: Question, indices: number[]): boolean {
  const want = [...(q.correctSet ?? [])].sort().join(",");
  const got = [...indices].sort().join(",");
  return want.length > 0 && want === got;
}
export function checkFill(q: Question, value: string): boolean {
  const accepted = [q.answer ?? "", ...(q.accept ?? [])].map(norm);
  return accepted.includes(norm(value));
}

/** Deterministic shuffle → returns items in shuffled order + the source index of
 *  each (so the renderer can present a stable scramble and still grade it). */
export function deterministicShuffle<T>(arr: T[], key: string): { items: T[]; order: number[] } {
  const idx = arr.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(seeded(key, i) * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { items: idx.map((i) => arr[i]), order: idx };
}

// ─── Per-event progress + level result ───────────────────────────────────────
export interface EventProgress {
  eventId: string;
  highestCleared: number;   // 0 = none yet; the next playable level is +1
  score: number;            // cumulative event score (ranks the board)
  heartsEarned: number;
  bestAccuracy: number;
  attempts: number;
  /** Your result from the PREVIOUS instance of a recurring event — shown on the
   *  locked page so you can aim to beat it. Current progress always starts fresh.
   *  TODO(api): server archives last run + resets current when a new instance opens. */
  lastRun?: { level: number; rank: number; accuracy: number };
}

/** The level you'd play next in an event (1-based). */
export function currentLevel(p?: EventProgress): number {
  return Math.min((p?.highestCleared ?? 0) + 1, 9999);
}

export interface LevelResult {
  eventId: string;
  level: number;
  cleared: boolean;
  correct: number;
  total: number;
  livesLeft: number;
  accuracy: number;
  scoreGained: number;
  heartsGained: number;
  xpGained: number;
  newHighest: boolean;       // cleared a level you'd never cleared before
  reachedMax: boolean;       // just cleared the final level
  review: ReviewItem[];
  daily?: boolean;           // a Daily Sprint run → records today's once-a-day result
  timeSec?: number;          // total time taken (for the daily "your time vs avg")
}

// ─── Daily Sprint — the once-a-day "where do I stand today" loop (LinkedIn-games) ─
/** Today's field across everyone who's played the daily sprint so far.
 *  DUMMY/derived — TODO(api): GET /api/arena/daily/today → live aggregates. */
export function dailyFieldStats(ev: ArenaEvent) {
  const n = ev.questionsPerLevel ?? 7;
  return { participants: 12480, avgScore: Math.round(n * 18), avgTimeSec: n * 14 };
}
/** Rough percentile: where your score lands vs the field's average (clamped). */
export function dailyBeatPct(score: number, avgScore: number): number {
  const r = avgScore > 0 ? score / avgScore : 1;
  return Math.max(5, Math.min(97, Math.round(50 + (r - 1) * 70)));
}
/** "2m 14s" style. */
export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/** Score for one cleared level = banked question points + a clear bonus that
 *  scales with the level (climbing higher is worth more). */
export function levelClearScore(questionPointsSum: number, level: number): number {
  return questionPointsSum + 20 + level * 4;
}

export { questionPoints };

// ─── Per-event leaderboard ─────────────────────────────────────────────────────
export type EventScope = "friends" | "school" | "national";

/** Per-event board, ranked by cumulative event score. Reuses the shared cohort
 *  builder; the "top" anchor widens with the crowd so you place realistically. */
export function getEventLeaderboard(ev: ArenaEvent, myScore: number, scope: EventScope = "national"): LeaderboardEntry[] {
  const size = scope === "friends" ? 12 : scope === "school" ? 24 : 50;
  const maxL = ev.maxLevel ?? 50;
  const perLevel = levelClearScore(ev.questionsPerLevel ? ev.questionsPerLevel * 24 : 120, maxL);
  const ceiling = perLevel * maxL; // a near-perfect full clear
  const top = scope === "friends" ? Math.max(myScore + 200, Math.round(ceiling * 0.45))
    : scope === "school" ? Math.max(myScore + 400, Math.round(ceiling * 0.7))
    : Math.max(myScore + 600, Math.round(ceiling * 0.95));
  return buildBoard(`event-${ev.id}-${scope}`, size, myScore, top);
}

export function getEventRank(ev: ArenaEvent, myScore: number, scope: EventScope = "national"): number {
  return getEventLeaderboard(ev, myScore, scope).find((e) => e.isMe)?.rank ?? 50;
}

/** Estimated score to break into the prize zone (top-N) — a concrete target. */
export function eventPrizeCutoff(ev: ArenaEvent): number {
  const board = getEventLeaderboard(ev, 0, "national");
  return board[Math.min(ev.promoteTop, board.length) - 1]?.score ?? 0;
}
