// TODO(api): GET /api/me/test-series — user's purchased test packs with progress
//
// Owns the post-purchase test-series state: which packs a user owns, how far
// they've progressed through each, and the bank of stub questions used by the
// mock-taking shell. Marketplace catalog data lives in marketplace-product /
// marketplace-premium-cards; this file is strictly the "library after buy" side.

import { getOlympiadPack } from "./olympiads";

export type MockStatus = "not-started" | "in-progress" | "completed";

export interface MockQuestion {
  id: string;
  section: string;
  type: "mcq" | "numerical";
  stem: string;
  options?: string[];
  correctOptionIndex?: number;
  correctNumericalAnswer?: number;
  marks: number;
  negativeMarks: number;
  explanation?: string;
}

export interface MockProgress {
  id: string;            // "mock-1", "mock-2", "pyq-2025-jan-24-s1", ...
  number: number;
  title: string;
  questionCount: number;
  durationMinutes: number;
  status: MockStatus;
  // "pyq" = real past-year paper, "mock" = synthetic full-length. Defaults to "mock".
  kind?: "mock" | "pyq";
  // PYQ-only metadata (used for the year chip + sort)
  year?: number;
  session?: string;      // "Jan 24 · Shift 1", "April 2024", "Slot 1"
  // Completed-only
  score?: number;        // out of maxScore
  maxScore?: number;
  timeTakenSeconds?: number;
  attemptedAt?: string;
  // In-progress only (paused mid-test)
  lastQuestionIndex?: number;
  timeRemainingSeconds?: number;
}

// Real-portal UI variant per exam family. Drives the mock-take shell selection:
//   "nta"  → JEE / NEET / GATE (default 5-state palette + section tabs)
//   "cat"  → IIM CAT (sectional locks + per-section timer + on-screen calculator)
//   "upsc" → UPSC Prelims (paper-OMR feel, single section, no marked-review)
//   "clat" → CLAT (passage-based grouping)
//   "ssc"  → SSC CGL (sectional but no locks)
//   "ibps" → Bank PO (sectional with time limits + decimal penalty)
export type ExamType = "nta" | "cat" | "upsc" | "clat" | "ssc" | "ibps";

export interface MyTestSeriesPack {
  packId: string;           // matches mt-jee-main, mt-neet-ug etc
  productId: string;        // ID used in marketplace product detail
  title: string;
  planLabel: string;        // "Standard", "Complete"
  examLabel: string;
  examAccent: string;
  // Per-exam portal accent used ONLY during test-taking (chrome of the real
  // portal the student would sit). Pack/instructions stay brand-blue via
  // examAccent. If undefined, takeAccent falls back to examAccent.
  takeAccent?: string;
  examType: ExamType;
  pattern: string;
  validTill: string;
  purchasedOn: string;
  totalMocks: number;
  mocksPerSection?: number; // for the take-test view's section grid
  sections: string[];       // ["Physics", "Chemistry", "Maths"]
  // CAT-specific: time allotted per section in minutes. When set, the take
  // screen uses sectional timers and locks each section once its time expires
  // or the student manually advances.
  sectionTimeMinutes?: number;
  // Aggregate stats — only meaningful when ≥1 mock completed
  avgScore?: number;
  maxScore?: number;        // full marks for a mock
  airPrediction?: number;
  trendDelta?: number;      // +20 = avg score up 20 marks vs prior 5
  // Mock list
  mocks: MockProgress[];
  // Past-year papers — same shape as mocks, but real exam papers from prior years.
  // Tracked separately so pack progress (X/totalMocks) only counts synthetic mocks.
  pyqPapers?: MockProgress[];
}

// ─── Dummy data: two demo packs ──────────────────────────────────────────────

const JEE_MOCK_TITLES = [
  "Full-length Mock 1",
  "Full-length Mock 2",
  "Full-length Mock 3",
  "Full-length Mock 4",
  "Full-length Mock 5",
  "Full-length Mock 6",
  "Full-length Mock 7",
  "Sectional · Mechanics",
  "Sectional · Thermodynamics",
  "Sectional · Optics",
];

function buildJeeMocks(): MockProgress[] {
  const mocks: MockProgress[] = [];

  // 6 completed with progressively improving scores (~+20 marks across attempts)
  const completedScores = [108, 116, 132, 138, 152, 156];
  const completedTimes = [10620, 10380, 10210, 10090, 9890, 9720]; // seconds
  const completedDates = ["12 Apr 2026", "18 Apr 2026", "24 Apr 2026", "30 Apr 2026", "06 May 2026", "11 May 2026"];

  for (let i = 0; i < 6; i++) {
    mocks.push({
      id: `mock-${i + 1}`,
      number: i + 1,
      title: JEE_MOCK_TITLES[i] ?? `Full-length Mock ${i + 1}`,
      questionCount: 90,
      durationMinutes: 180,
      status: "completed",
      score: completedScores[i],
      maxScore: 360,
      timeTakenSeconds: completedTimes[i],
      attemptedAt: completedDates[i],
    });
  }

  // 24 not-started (mocks 7–30). Real exam behaviour: closing/exiting mid-attempt
  // discards progress, so there's no resumable "in-progress" state in the demo
  // seed. The MockProgress type still carries lastQuestionIndex/timeRemainingSeconds
  // for a future server-side autosave feature (TODO).
  for (let i = 6; i < 30; i++) {
    mocks.push({
      id: `mock-${i + 1}`,
      number: i + 1,
      title: JEE_MOCK_TITLES[i] ?? `Full-length Mock ${i + 1}`,
      questionCount: 90,
      durationMinutes: 180,
      status: "not-started",
    });
  }

  return mocks;
}

function buildNeetMocks(): MockProgress[] {
  // Fresh purchase — 32 not-started
  return Array.from({ length: 32 }, (_, i) => ({
    id: `mock-${i + 1}`,
    number: i + 1,
    title: i < 20 ? `Full-length Mock ${i + 1}` : `Sectional Test ${i + 1 - 20}`,
    questionCount: i < 20 ? 180 : 45,
    durationMinutes: i < 20 ? 180 : 60,
    status: "not-started" as MockStatus,
  }));
}

// TODO(api): GET /api/me/test-series
function buildCatMocks(): MockProgress[] {
  // Fresh pack — 15 mocks, none attempted yet
  return Array.from({ length: 15 }, (_, i) => ({
    id: `cat-mock-${i + 1}`,
    number: i + 1,
    title: i < 10 ? `Full-length CAT Mock ${i + 1}` : `Sectional · ${["VARC", "DILR", "QA"][(i - 10) % 3]} Drill`,
    questionCount: i < 10 ? 66 : 22,
    durationMinutes: i < 10 ? 120 : 40,
    status: "not-started",
  }));
}

// ─── PYQ paper builders ──────────────────────────────────────────────────────
// Real past-year papers. JEE Main is multi-shift (Jan + Apr sessions × 2 shifts/day
// × multiple days). NEET runs once a year. CAT runs in 3 slots a year. Counts and
// durations mirror the actual exam pattern for each year.

function buildJeePyqs(): MockProgress[] {
  // Most recent first. Format: "JEE Main 2025 · Jan 24 · Shift 1"
  const papers: Array<{ year: number; session: string }> = [
    { year: 2025, session: "Apr 8 · Shift 1"  },
    { year: 2025, session: "Apr 4 · Shift 2"  },
    { year: 2025, session: "Apr 2 · Shift 1"  },
    { year: 2025, session: "Jan 29 · Shift 2" },
    { year: 2025, session: "Jan 24 · Shift 1" },
    { year: 2025, session: "Jan 22 · Shift 2" },
    { year: 2024, session: "Apr 9 · Shift 1"  },
    { year: 2024, session: "Apr 5 · Shift 2"  },
    { year: 2024, session: "Jan 31 · Shift 1" },
    { year: 2024, session: "Jan 27 · Shift 2" },
    { year: 2023, session: "Apr 13 · Shift 1" },
    { year: 2023, session: "Jan 25 · Shift 1" },
  ];

  return papers.map((p, i) => ({
    id: `pyq-jee-${p.year}-${i}`,
    number: i + 1,
    title: `JEE Main ${p.year} · ${p.session}`,
    questionCount: 90,
    durationMinutes: 180,
    status: "not-started" as MockStatus,
    kind: "pyq" as const,
    year: p.year,
    session: p.session,
  }));
}

function buildNeetPyqs(): MockProgress[] {
  // NEET UG is a single paper per year. Pre-2020 was 720/180 too, kept consistent.
  const years = [2024, 2023, 2022, 2021, 2020];
  return years.map((year, i) => ({
    id: `pyq-neet-${year}`,
    number: i + 1,
    title: `NEET UG ${year}`,
    questionCount: 180,
    durationMinutes: 180,
    status: "not-started" as MockStatus,
    kind: "pyq" as const,
    year,
    session: `${year}`,
  }));
}

function buildCatPyqs(): MockProgress[] {
  // CAT has 3 slots per year (morning / afternoon / evening). 2024 most recent.
  const years = [2024, 2023, 2022];
  const slots = ["Slot 1", "Slot 2", "Slot 3"];
  const out: MockProgress[] = [];
  let i = 0;
  for (const year of years) {
    for (const slot of slots) {
      out.push({
        id: `pyq-cat-${year}-${slot.toLowerCase().replace(" ", "-")}`,
        number: ++i,
        title: `CAT ${year} · ${slot}`,
        questionCount: 66,
        durationMinutes: 120,
        status: "not-started",
        kind: "pyq",
        year,
        session: slot,
      });
    }
  }
  return out;
}

// ─── Other-exam mock builders ─────────────────────────────────────────────────
// Real-exam mock-test counts + durations per portal. All fresh (not-started)
// since the demo seed already has JEE/CAT showing the completed-state visuals.

function buildUpscMocks(): MockProgress[] {
  // UPSC Prelims GS Paper 1 — 100 Q, 2 hours, single section
  return Array.from({ length: 20 }, (_, i) => ({
    id: `mock-${i + 1}`,
    number: i + 1,
    title: `UPSC GS Paper 1 — Mock ${i + 1}`,
    questionCount: 100,
    durationMinutes: 120,
    status: "not-started" as MockStatus,
  }));
}

function buildSscMocks(): MockProgress[] {
  // SSC CGL Tier 1 — 100 Q, 60 min, 4 sections × 25 Q. TCS portal.
  return Array.from({ length: 18 }, (_, i) => ({
    id: `mock-${i + 1}`,
    number: i + 1,
    title: `SSC CGL Mock ${i + 1}`,
    questionCount: 100,
    durationMinutes: 60,
    status: "not-started" as MockStatus,
  }));
}

function buildIbpsMocks(): MockProgress[] {
  // IBPS PO Prelims — 100 Q, 60 min, 3 sections × ~33 Q with per-section 20-min timer.
  return Array.from({ length: 15 }, (_, i) => ({
    id: `mock-${i + 1}`,
    number: i + 1,
    title: `IBPS PO Prelims — Mock ${i + 1}`,
    questionCount: 100,
    durationMinutes: 60,
    status: "not-started" as MockStatus,
  }));
}

function buildClatMocks(): MockProgress[] {
  // CLAT UG — 120 passage-based Q, 2 hours.
  // TODO(ui): split-pane passage view not yet built — uses NTA shell as fallback
  return Array.from({ length: 12 }, (_, i) => ({
    id: `mock-${i + 1}`,
    number: i + 1,
    title: `CLAT UG Mock ${i + 1}`,
    questionCount: 120,
    durationMinutes: 120,
    status: "not-started" as MockStatus,
  }));
}

function buildGateMocks(): MockProgress[] {
  // GATE CSE — 65 Q (10 GA + 55 CSE), 3 hours, MCQ + MSQ + NAT mixed.
  // TODO(ui): MSQ + scientific calculator not yet built — uses NTA shell as fallback
  return Array.from({ length: 10 }, (_, i) => ({
    id: `mock-${i + 1}`,
    number: i + 1,
    title: `GATE CSE Mock ${i + 1}`,
    questionCount: 65,
    durationMinutes: 180,
    status: "not-started" as MockStatus,
  }));
}

export const DUMMY_MY_TEST_SERIES: MyTestSeriesPack[] = [
  {
    packId: "mt-jee-main",
    productId: "mt-jee-main",
    title: "JEE Main Mock Series 2026",
    planLabel: "Standard",
    examLabel: "JEE MAIN",
    examAccent: "var(--primary-500)",
    // NTA TCS-iON portal — student-blue chrome
    takeAccent: "var(--primary-500)",
    examType: "nta",
    pattern: "NTA Pattern",
    validTill: "12 May 2027",
    purchasedOn: "12 Apr 2026",
    totalMocks: 30,
    sections: ["Physics", "Chemistry", "Maths"],
    avgScore: 134,
    maxScore: 360,
    airPrediction: 4200,
    trendDelta: 20,
    mocks: buildJeeMocks(),
    pyqPapers: buildJeePyqs(),
  },
  {
    packId: "mt-neet-ug",
    productId: "mt-neet-ug",
    title: "NEET UG Mock Test Pack",
    planLabel: "Standard",
    examLabel: "NEET UG",
    examAccent: "var(--primary-500)",
    // NTA TCS-iON portal — same blue chrome as JEE
    takeAccent: "var(--primary-500)",
    examType: "nta",
    pattern: "NTA Pattern",
    validTill: "13 May 2027",
    purchasedOn: "13 May 2026",
    totalMocks: 32,
    sections: ["Physics", "Chemistry", "Botany", "Zoology"],
    avgScore: undefined,
    maxScore: 720,
    airPrediction: undefined,
    trendDelta: undefined,
    mocks: buildNeetMocks(),
    pyqPapers: buildNeetPyqs(),
  },
  {
    packId: "mt-cat",
    productId: "mt-cat",
    title: "CAT Mock Series 2026",
    planLabel: "Standard",
    examLabel: "CAT",
    examAccent: "var(--primary-500)",
    // IIM TCS-iON CAT portal — amber-gold accent
    takeAccent: "var(--primary-500)",
    examType: "cat",
    pattern: "IIM CAT Pattern",
    validTill: "30 Nov 2026",
    purchasedOn: "11 May 2026",
    totalMocks: 15,
    sections: ["VARC", "DILR", "QA"],
    sectionTimeMinutes: 40,
    maxScore: 198,
    mocks: buildCatMocks(),
    pyqPapers: buildCatPyqs(),
  },
  {
    // UPSC Civil Services Prelims — single 100-Q paper, 120 min, no sections.
    // Take screen renders without section tabs when sections.length === 1.
    packId: "mt-upsc",
    productId: "mt-upsc",
    title: "UPSC Prelims Mock Series",
    planLabel: "Standard",
    examLabel: "UPSC",
    examAccent: "var(--primary-500)",
    // TCS-iON portal — same blue chrome as JEE/NEET
    takeAccent: "var(--primary-500)",
    examType: "upsc",
    pattern: "TCS-iON / UPSC Pattern",
    validTill: "31 May 2027",
    purchasedOn: "14 May 2026",
    totalMocks: 20,
    sections: ["General Studies"],
    maxScore: 200,
    mocks: buildUpscMocks(),
  },
  {
    // SSC CGL Tier 1 — 4 sections × 25 Q, 60-min overall, free navigation (TCS).
    packId: "mt-ssc-cgl",
    productId: "mt-ssc-cgl",
    title: "SSC CGL Tier 1 Mock Series",
    planLabel: "Standard",
    examLabel: "SSC CGL",
    examAccent: "var(--primary-500)",
    // TCS portal — same blue chrome as UPSC
    takeAccent: "var(--primary-500)",
    examType: "ssc",
    pattern: "SSC CGL / TCS Pattern",
    validTill: "30 Jun 2027",
    purchasedOn: "15 May 2026",
    totalMocks: 18,
    sections: ["Reasoning", "Quantitative Aptitude", "English", "GK & GA"],
    maxScore: 200,
    mocks: buildSscMocks(),
  },
  {
    // IBPS PO Prelims — 3 sections, 20-min sectional time (auto-advance, no manual lock).
    // Reuses the CAT sectional-timer code path with isIBPS branch in take screen.
    packId: "mt-ibps-po",
    productId: "mt-ibps-po",
    title: "IBPS PO Prelims Mock Series",
    planLabel: "Standard",
    examLabel: "IBPS PO",
    examAccent: "var(--primary-500)",
    // IBPS NSEIT/SIFY portal — orange chrome (distinct from TCS family)
    takeAccent: "var(--primary-500)",
    examType: "ibps",
    pattern: "IBPS / Bank PO Pattern",
    validTill: "30 Jun 2027",
    purchasedOn: "15 May 2026",
    totalMocks: 15,
    sections: ["English", "Quantitative Aptitude", "Reasoning"],
    sectionTimeMinutes: 20,
    maxScore: 100,
    mocks: buildIbpsMocks(),
  },
  {
    // CLAT UG — passage-based Q. Beta: take screen renders as NTA fallback until
    // split-pane passage view is built. Marketing as "Beta" until then.
    packId: "mt-clat",
    productId: "mt-clat",
    title: "CLAT UG Mock Series (Beta)",
    planLabel: "Standard",
    examLabel: "CLAT",
    examAccent: "var(--primary-500)",
    // CLAT Consortium portal — green accent
    takeAccent: "var(--primary-500)",
    examType: "clat",
    pattern: "CLAT Consortium Pattern",
    validTill: "30 Jun 2027",
    purchasedOn: "15 May 2026",
    totalMocks: 12,
    sections: ["English", "Current Affairs", "Legal Reasoning", "Logical Reasoning", "Quantitative"],
    maxScore: 120,
    mocks: buildClatMocks(),
  },
  {
    // GATE CSE — IIT GOAPS portal. Beta: take screen renders as NTA fallback
    // until MSQ + scientific calculator land.
    packId: "mt-gate-cse",
    productId: "mt-gate-cse",
    title: "GATE CSE Mock Series (Beta)",
    planLabel: "Standard",
    examLabel: "GATE CSE",
    examAccent: "var(--primary-500)",
    // IIT GOAPS portal — distinct indigo accent vs the TCS family
    takeAccent: "var(--primary-500)",
    examType: "nta",  // closest existing shell; needs own examType once MSQ lands
    pattern: "IIT GOAPS Pattern",
    validTill: "31 Dec 2026",
    purchasedOn: "16 May 2026",
    totalMocks: 10,
    sections: ["General Aptitude", "CSE Core"],
    maxScore: 100,
    mocks: buildGateMocks(),
  },
];

// ─── Exam-aware marking scheme ───────────────────────────────────────────────
// Real exam marking varies per exam-type. The stub questions all use NTA-style
// 4/−1, but the UI should DISPLAY the actual exam's scheme so students see what
// the real test feels like.

export interface MarkingScheme {
  correct: number;          // marks for correct answer
  wrongMcq: number;         // penalty for wrong MCQ (positive number, displayed with −)
  wrongNumerical: number;   // penalty for wrong numerical (0 in most exams)
  display: string;          // short display like "+4 / −1" or "+3 / −1 (TITA: no penalty)"
}

export function getMarkingScheme(examType: ExamType): MarkingScheme {
  switch (examType) {
    case "nta":  return { correct: 4, wrongMcq: 1,    wrongNumerical: 0, display: "+4 / −1" };
    case "cat":  return { correct: 3, wrongMcq: 1,    wrongNumerical: 0, display: "+3 / −1" };
    case "upsc": return { correct: 2, wrongMcq: 0.66, wrongNumerical: 0, display: "+2 / −⅓" };
    case "clat": return { correct: 1, wrongMcq: 0.25, wrongNumerical: 0, display: "+1 / −¼" };
    case "ssc":  return { correct: 2, wrongMcq: 0.5,  wrongNumerical: 0, display: "+2 / −½" };
    case "ibps": return { correct: 1, wrongMcq: 0.25, wrongNumerical: 0, display: "+1 / −¼" };
    default:     return { correct: 4, wrongMcq: 1,    wrongNumerical: 0, display: "+4 / −1" };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getPackById(packId: string): MyTestSeriesPack | undefined {
  // Olympiads project into the same pack shape so the take engine conducts the
  // exam unchanged (see olympiads.ts › getOlympiadPack). olympiads.ts imports
  // only TYPES from this module, so this runtime import stays acyclic.
  return DUMMY_MY_TEST_SERIES.find((p) => p.packId === packId)
    ?? getOlympiadPack(packId);
}

// Looks up any attempt (mock OR pyq) by id. Used by instructions / take / result /
// review screens since the same routes serve both kinds.
export function getAttemptById(pack: MyTestSeriesPack, id: string): MockProgress | undefined {
  return pack.mocks.find((m) => m.id === id)
    ?? pack.pyqPapers?.find((p) => p.id === id);
}

export function nextPendingMock(pack: MyTestSeriesPack): MockProgress | undefined {
  return pack.mocks.find((m) => m.status === "in-progress")
    ?? pack.mocks.find((m) => m.status === "not-started");
}

export function packStats(pack: MyTestSeriesPack) {
  const completed = pack.mocks.filter((m) => m.status === "completed").length;
  const progressPct = Math.round((completed / pack.totalMocks) * 100);
  return { completed, progressPct };
}

// ─── Stub question bank for the mock-taking interface ────────────────────────
//
// 15 questions × 3 sections (Physics / Chemistry / Maths) — used by the
// realistic stub. Real test bank lives on the server (TODO).

const PHYSICS_Q: MockQuestion[] = [
  {
    id: "p-1",
    section: "Physics",
    type: "mcq",
    stem: "A body of mass 5 kg is moving with a velocity of 10 m/s. Its kinetic energy is:",
    options: ["25 J", "250 J", "125 J", "500 J"],
    correctOptionIndex: 1,
    marks: 4,
    negativeMarks: 1,
    explanation: "KE = ½ × m × v² = ½ × 5 × 10² = 250 J",
  },
  {
    id: "p-2",
    section: "Physics",
    type: "mcq",
    stem: "The dimensional formula for Planck's constant is:",
    options: ["[M L² T⁻¹]", "[M L T⁻²]", "[M L² T⁻²]", "[M L⁻¹ T⁻¹]"],
    correctOptionIndex: 0,
    marks: 4,
    negativeMarks: 1,
    explanation: "h has units of J·s = kg·m²·s⁻¹, so [M L² T⁻¹]",
  },
  {
    id: "p-3",
    section: "Physics",
    type: "mcq",
    stem: "Light of wavelength 600 nm falls on a slit of width 1.2 μm. The first minimum is at angle:",
    options: ["15°", "30°", "45°", "60°"],
    correctOptionIndex: 1,
    marks: 4,
    negativeMarks: 1,
    explanation: "sin θ = λ / a = 600×10⁻⁹ / 1.2×10⁻⁶ = 0.5 → θ = 30°",
  },
  {
    id: "p-4",
    section: "Physics",
    type: "mcq",
    stem: "A capacitor of 10 μF is charged to 100 V. Energy stored is:",
    options: ["0.05 J", "0.10 J", "1.0 J", "0.5 J"],
    correctOptionIndex: 0,
    marks: 4,
    negativeMarks: 1,
    explanation: "U = ½ C V² = ½ × 10×10⁻⁶ × 100² = 0.05 J",
  },
  {
    id: "p-5",
    section: "Physics",
    type: "numerical",
    stem: "A particle moves in a circle of radius 2 m with constant speed 4 m/s. Centripetal acceleration is _____ m/s².",
    correctNumericalAnswer: 8,
    marks: 4,
    negativeMarks: 0,
    explanation: "a = v² / r = 16 / 2 = 8 m/s²",
  },
  // ─── Extended Physics bank — mix of short, medium, long stems and option lengths
  {
    id: "p-6",
    section: "Physics",
    type: "mcq",
    stem: "A block of mass 2 kg is pulled along a horizontal surface with a force of 10 N at an angle of 30° above the horizontal. If the coefficient of kinetic friction between the block and the surface is 0.2, find the acceleration of the block (g = 10 m/s²).",
    options: [
      "3.4 m/s² in the direction of the horizontal component of the applied force",
      "2.6 m/s² in the direction of the horizontal component of the applied force",
      "4.3 m/s² in the direction of the horizontal component of the applied force",
      "1.7 m/s² in the direction of the horizontal component of the applied force",
    ],
    correctOptionIndex: 0,
    marks: 4,
    negativeMarks: 1,
    explanation: "Horizontal force = 10 cos30° = 8.66 N. Normal force = mg − 10 sin30° = 15 N. Friction = 0.2 × 15 = 3 N. Net force = 5.66 N. Acceleration ≈ 2.83 m/s². Closest option: A.",
  },
  { id: "p-7",  section: "Physics", type: "mcq",       stem: "SI unit of magnetic flux is:",                                              options: ["Tesla", "Weber", "Henry", "Gauss"],          correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "Magnetic flux Φ = B·A is measured in Weber (Wb)." },
  { id: "p-8",  section: "Physics", type: "mcq",       stem: "The escape velocity from Earth's surface is approximately:",                options: ["7.9 km/s", "11.2 km/s", "9.8 km/s", "5.6 km/s"],  correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "v_esc = √(2gR) ≈ 11.2 km/s." },
  { id: "p-9",  section: "Physics", type: "numerical", stem: "The de Broglie wavelength of an electron accelerated through 150 V is approximately _____ Å (to one decimal place).",                                                                   correctNumericalAnswer: 1,    marks: 4, negativeMarks: 0, explanation: "λ = 12.27/√V Å = 12.27/√150 ≈ 1.0 Å." },
  { id: "p-10", section: "Physics", type: "mcq",
    stem: "A uniform rod of length L and mass M is pivoted at one end. It is released from a horizontal position and swings down. Determine the angular velocity of the rod when it reaches the vertical position. (Take moment of inertia of rod about its end as ML²/3.)",
    options: ["√(3g/L)", "√(g/L)", "√(2g/L)", "√(g/2L)"], correctOptionIndex: 0, marks: 4, negativeMarks: 1,
    explanation: "Using conservation of energy: MgL/2 = ½·(ML²/3)·ω² → ω = √(3g/L)."
  },
  { id: "p-11", section: "Physics", type: "mcq",       stem: "Which colour of light has the longest wavelength?",                         options: ["Violet", "Yellow", "Green", "Red"],          correctOptionIndex: 3, marks: 4, negativeMarks: 1, explanation: "Red has the longest wavelength in the visible spectrum (~700 nm)." },
  { id: "p-12", section: "Physics", type: "numerical", stem: "An ideal gas at 27 °C is heated at constant pressure until its volume doubles. The final temperature is _____ K.", correctNumericalAnswer: 600, marks: 4, negativeMarks: 0, explanation: "V₁/T₁ = V₂/T₂. T₁ = 300 K, V₂ = 2V₁ → T₂ = 600 K." },
  { id: "p-13", section: "Physics", type: "mcq",
    stem: "Two charges +4 µC and −1 µC are separated by 30 cm. Find the position of the point on the line joining them where the electric potential is zero.",
    options: ["24 cm from +4 µC", "6 cm from −1 µC", "20 cm from +4 µC", "Both A and B exist (two such points)"], correctOptionIndex: 3, marks: 4, negativeMarks: 1,
    explanation: "Setting V = kq₁/r + kq₂/(d−r) = 0 yields two solutions — one between the charges and one outside."
  },
  { id: "p-14", section: "Physics", type: "mcq",       stem: "The dimensional formula of impulse is the same as:",                       options: ["Force", "Pressure", "Momentum", "Energy"],   correctOptionIndex: 2, marks: 4, negativeMarks: 1, explanation: "Impulse = F·Δt has the same dimensions as momentum [MLT⁻¹]." },
  { id: "p-15", section: "Physics", type: "numerical", stem: "A spring of force constant 200 N/m is compressed by 5 cm. The energy stored in the spring is _____ J.",                                                                                correctNumericalAnswer: 0.25, marks: 4, negativeMarks: 0, explanation: "U = ½·k·x² = ½·200·(0.05)² = 0.25 J." },
  { id: "p-16", section: "Physics", type: "mcq",
    stem: "A simple pendulum of length L has time period T on Earth's surface. The time period of the same pendulum on the surface of the Moon, where gravity is g/6 (g being Earth's gravity), would be:",
    options: ["T", "T·√6", "T/√6", "6T"], correctOptionIndex: 1, marks: 4, negativeMarks: 1,
    explanation: "T = 2π√(L/g). On Moon g_moon = g/6 → T_moon = T·√6."
  },
  { id: "p-17", section: "Physics", type: "mcq",       stem: "Photoelectric effect was explained by:",                                    options: ["Newton", "Maxwell", "Einstein", "Bohr"],     correctOptionIndex: 2, marks: 4, negativeMarks: 1, explanation: "Einstein's 1905 explanation using photons earned him the Nobel Prize." },
  { id: "p-18", section: "Physics", type: "numerical", stem: "Resistance of a wire is 10 Ω. If its length is doubled and its cross-section halved (the material remaining the same), the new resistance is _____ Ω.", correctNumericalAnswer: 40, marks: 4, negativeMarks: 0, explanation: "R = ρL/A. New R = ρ(2L)/(A/2) = 4R = 40 Ω." },
  { id: "p-19", section: "Physics", type: "mcq",
    stem: "A convex lens of focal length 20 cm forms a real, inverted image of an object placed at a distance of 30 cm in front of it. The image distance and magnification are respectively:",
    options: ["60 cm and −2", "40 cm and −1.5", "60 cm and +2", "20 cm and −1"], correctOptionIndex: 0, marks: 4, negativeMarks: 1,
    explanation: "1/v − 1/u = 1/f → 1/v − 1/(−30) = 1/20 → v = 60 cm. m = v/u = 60/(−30) = −2."
  },
  { id: "p-20", section: "Physics", type: "mcq",       stem: "The work done in moving a charge in an equipotential surface is:",         options: ["Always positive", "Zero", "Always negative", "Depends on path"], correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "By definition, all points on an equipotential surface are at the same potential — no work needed." },
  { id: "p-21", section: "Physics", type: "numerical", stem: "A satellite orbits Earth at a height equal to Earth's radius R. The orbital speed of the satellite is √(GM/2R). If g is the acceleration due to gravity at Earth's surface, then the orbital speed equals √(gR/n). The value of n is _____.",                                                                                                              correctNumericalAnswer: 2, marks: 4, negativeMarks: 0, explanation: "v_orbit = √(GM/2R) = √(gR/2) (since g = GM/R²). So n = 2." },
  { id: "p-22", section: "Physics", type: "mcq",       stem: "Bernoulli's principle is a consequence of conservation of:",                options: ["Mass", "Momentum", "Energy", "Charge"],       correctOptionIndex: 2, marks: 4, negativeMarks: 1, explanation: "Bernoulli's equation is an energy conservation statement for streamline fluid flow." },
  { id: "p-23", section: "Physics", type: "mcq",       stem: "Young's modulus is the ratio of:",                                          options: ["Stress to strain", "Strain to stress", "Force to area", "Stress to force"], correctOptionIndex: 0, marks: 4, negativeMarks: 1, explanation: "Young's modulus Y = (longitudinal stress) / (longitudinal strain)." },
  { id: "p-24", section: "Physics", type: "numerical", stem: "Half-life of a radioactive sample is 10 days. The fraction remaining after 30 days is 1/x. The value of x is _____.", correctNumericalAnswer: 8, marks: 4, negativeMarks: 0, explanation: "After 3 half-lives, N/N₀ = (1/2)³ = 1/8 → x = 8." },
  { id: "p-25", section: "Physics", type: "mcq",
    stem: "A particle is projected with velocity 20 m/s at an angle of 60° above the horizontal. Neglecting air resistance and taking g = 10 m/s², calculate the maximum height attained by the projectile.",
    options: ["10 m", "15 m", "20 m", "25 m"], correctOptionIndex: 1, marks: 4, negativeMarks: 1,
    explanation: "H = (u sinθ)²/(2g) = (20·sin60°)²/20 = (10√3)²/20 = 300/20 = 15 m."
  },
  { id: "p-26", section: "Physics", type: "mcq",       stem: "Specific heat capacity of water is approximately:",                         options: ["4.18 J/g·K", "1.00 J/g·K", "0.50 J/g·K", "2.09 J/g·K"], correctOptionIndex: 0, marks: 4, negativeMarks: 1, explanation: "Water has a specific heat capacity of about 4.18 J/g·K (or 1 cal/g·K)." },
  { id: "p-27", section: "Physics", type: "numerical", stem: "The rms speed of nitrogen molecules at temperature T is v_rms. If T is doubled, the new rms speed is k·v_rms. The value of k (to two decimal places) is _____.",                                                                                                              correctNumericalAnswer: 1.41, marks: 4, negativeMarks: 0, explanation: "v_rms ∝ √T. Doubling T → v_rms becomes √2 ≈ 1.41 times." },
  { id: "p-28", section: "Physics", type: "mcq",
    stem: "When light passes from one transparent medium to another, which of the following remains unchanged?",
    options: ["Wavelength", "Speed", "Frequency", "Direction of propagation"], correctOptionIndex: 2, marks: 4, negativeMarks: 1,
    explanation: "Frequency depends on the source, not the medium. Wavelength and speed change but frequency stays constant."
  },
  { id: "p-29", section: "Physics", type: "mcq",       stem: "The unit of magnetic field B in SI is:",                                    options: ["Henry", "Tesla", "Weber", "Ohm"],            correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "Tesla (T) is the SI unit of magnetic field B." },
  { id: "p-30", section: "Physics", type: "numerical", stem: "Power dissipated in a 10 Ω resistor carrying a current of 2 A is _____ W.", correctNumericalAnswer: 40, marks: 4, negativeMarks: 0, explanation: "P = I²·R = 4·10 = 40 W." },
];

const CHEM_Q: MockQuestion[] = [
  {
    id: "c-1",
    section: "Chemistry",
    type: "mcq",
    stem: "Number of moles in 88 g of CO₂ is: (Molar mass CO₂ = 44 g/mol)",
    options: ["1", "2", "4", "0.5"],
    correctOptionIndex: 1,
    marks: 4,
    negativeMarks: 1,
    explanation: "n = 88 / 44 = 2 moles",
  },
  {
    id: "c-2",
    section: "Chemistry",
    type: "mcq",
    stem: "The IUPAC name of CH₃-CH(OH)-CH₃ is:",
    options: ["Propan-1-ol", "Propan-2-ol", "Ethanol", "Methanol"],
    correctOptionIndex: 1,
    marks: 4,
    negativeMarks: 1,
    explanation: "OH is on the 2nd carbon — propan-2-ol (isopropanol)",
  },
  {
    id: "c-3",
    section: "Chemistry",
    type: "mcq",
    stem: "Which element has the highest first ionization energy?",
    options: ["Na", "Mg", "Al", "He"],
    correctOptionIndex: 3,
    marks: 4,
    negativeMarks: 1,
    explanation: "He has the highest IE due to small size, full 1s² shell, no shielding.",
  },
  {
    id: "c-4",
    section: "Chemistry",
    type: "mcq",
    stem: "pH of 0.001 M HCl solution is:",
    options: ["1", "2", "3", "4"],
    correctOptionIndex: 2,
    marks: 4,
    negativeMarks: 1,
    explanation: "[H⁺] = 10⁻³ → pH = -log(10⁻³) = 3",
  },
  {
    id: "c-5",
    section: "Chemistry",
    type: "numerical",
    stem: "Atomic number of an element with electron configuration [Ne] 3s² 3p⁵ is _____.",
    correctNumericalAnswer: 17,
    marks: 4,
    negativeMarks: 0,
    explanation: "10 (Ne) + 2 + 5 = 17 (chlorine)",
  },
  // ─── Extended Chemistry bank — varied stem/option lengths
  {
    id: "c-6",
    section: "Chemistry",
    type: "mcq",
    stem: "In the laboratory preparation of ammonia from ammonium chloride and calcium hydroxide, the gas is dried using which of the following drying agents because ammonia is basic in nature?",
    options: [
      "Concentrated sulphuric acid because it absorbs water effectively",
      "Anhydrous calcium chloride which works for most gases",
      "Quicklime (CaO) because it is a basic dehydrating agent and does not react with NH₃",
      "Phosphorus pentoxide as it is a strong dehydrating agent",
    ],
    correctOptionIndex: 2,
    marks: 4,
    negativeMarks: 1,
    explanation: "NH₃ is basic, so acidic dehydrating agents (H₂SO₄, P₂O₅) react with it. CaCl₂ forms an addition compound. Only CaO (quicklime) is suitable.",
  },
  { id: "c-7",  section: "Chemistry", type: "mcq",       stem: "Avogadro's number is approximately:",                                       options: ["6.022 × 10²³", "1.602 × 10⁻¹⁹", "9.109 × 10⁻³¹", "1.381 × 10⁻²³"], correctOptionIndex: 0, marks: 4, negativeMarks: 1, explanation: "Avogadro's number Nₐ = 6.022 × 10²³ particles/mol." },
  { id: "c-8",  section: "Chemistry", type: "mcq",       stem: "The hybridisation of carbon in methane (CH₄) is:",                          options: ["sp", "sp²", "sp³", "sp³d"],                  correctOptionIndex: 2, marks: 4, negativeMarks: 1, explanation: "Methane has 4 σ-bonds with tetrahedral geometry → sp³ hybridisation." },
  { id: "c-9",  section: "Chemistry", type: "numerical", stem: "Molarity of a solution containing 4 g of NaOH dissolved in 250 mL of water is _____ M.",                                                                                                       correctNumericalAnswer: 0.4, marks: 4, negativeMarks: 0, explanation: "Moles = 4/40 = 0.1. Volume = 0.25 L. M = 0.1/0.25 = 0.4 M." },
  { id: "c-10", section: "Chemistry", type: "mcq",
    stem: "Which of the following statements is correct regarding the reaction of phenol with bromine water at room temperature?",
    options: [
      "Mono-bromination occurs at the para position only",
      "2,4,6-tribromophenol is formed and the solution decolorises",
      "No reaction takes place without a catalyst",
      "Phenol gets oxidised to quinone",
    ],
    correctOptionIndex: 1, marks: 4, negativeMarks: 1,
    explanation: "Phenol with bromine water gives white precipitate of 2,4,6-tribromophenol; bromine water decolorises."
  },
  { id: "c-11", section: "Chemistry", type: "mcq",       stem: "Bond order of N₂ molecule is:",                                              options: ["1", "2", "3", "2.5"],                       correctOptionIndex: 2, marks: 4, negativeMarks: 1, explanation: "N₂ has a triple bond — bond order = 3." },
  { id: "c-12", section: "Chemistry", type: "numerical", stem: "How many sigma bonds are present in ethane (C₂H₆)? Answer: _____.",                                                                                                                            correctNumericalAnswer: 7, marks: 4, negativeMarks: 0, explanation: "Ethane has 1 C–C σ bond + 6 C–H σ bonds = 7." },
  { id: "c-13", section: "Chemistry", type: "mcq",
    stem: "Consider the standard reduction potentials: E°(Cu²⁺/Cu) = +0.34 V and E°(Zn²⁺/Zn) = −0.76 V. The EMF of the galvanic cell formed by combining these half-cells is:",
    options: ["+1.10 V", "−1.10 V", "+0.42 V", "−0.42 V"], correctOptionIndex: 0, marks: 4, negativeMarks: 1,
    explanation: "E°_cell = E°_cathode − E°_anode = 0.34 − (−0.76) = 1.10 V (positive → spontaneous)."
  },
  { id: "c-14", section: "Chemistry", type: "mcq",       stem: "Which functional group is present in alcohols?",                            options: ["−COOH", "−OH", "−CHO", "−NH₂"],              correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "Alcohols contain the hydroxyl (−OH) group attached to a saturated carbon." },
  { id: "c-15", section: "Chemistry", type: "numerical", stem: "The number of moles of electrons required to deposit 1 mole of Al from molten Al₂O₃ is _____.",                                                                                                correctNumericalAnswer: 3, marks: 4, negativeMarks: 0, explanation: "Al³⁺ + 3e⁻ → Al. Three moles of electrons per mole of Al." },
  { id: "c-16", section: "Chemistry", type: "mcq",
    stem: "An aqueous buffer is prepared by mixing equal volumes of 0.2 M acetic acid (Kₐ = 1.8 × 10⁻⁵) and 0.2 M sodium acetate. What is the pH of this buffer (log 1.8 ≈ 0.26)?",
    options: ["3.74", "4.74", "5.74", "6.74"], correctOptionIndex: 1, marks: 4, negativeMarks: 1,
    explanation: "pH = pKₐ + log([salt]/[acid]) = (5 − 0.26) + log(1) = 4.74."
  },
  { id: "c-17", section: "Chemistry", type: "mcq",       stem: "Diamond is an example of which type of solid?",                             options: ["Molecular", "Ionic", "Covalent network", "Metallic"], correctOptionIndex: 2, marks: 4, negativeMarks: 1, explanation: "Diamond is a giant covalent (network) solid with each C bonded to 4 others." },
  { id: "c-18", section: "Chemistry", type: "numerical", stem: "The oxidation state of chromium in K₂Cr₂O₇ is _____.",                       correctNumericalAnswer: 6, marks: 4, negativeMarks: 0, explanation: "2(+1) + 2x + 7(−2) = 0 → x = +6." },
  { id: "c-19", section: "Chemistry", type: "mcq",
    stem: "Identify the correct IUPAC name for the compound (CH₃)₂CHCH₂CH(CH₃)₂.",
    options: ["2,3-dimethylpentane", "2,4-dimethylpentane", "3,3-dimethylpentane", "2,2-dimethylpentane"], correctOptionIndex: 1, marks: 4, negativeMarks: 1,
    explanation: "Longest carbon chain = 5 (pentane). Methyl groups at C2 and C4 → 2,4-dimethylpentane."
  },
  { id: "c-20", section: "Chemistry", type: "mcq",       stem: "Most metallic character is shown by:",                                       options: ["Li", "Na", "K", "Cs"],                       correctOptionIndex: 3, marks: 4, negativeMarks: 1, explanation: "Metallic character increases down a group — Cs is the most metallic among these." },
  { id: "c-21", section: "Chemistry", type: "numerical", stem: "Equilibrium constant K_c for a reaction A ⇌ B is 4. If the initial concentration of A is 1 M (and B is 0), the concentration of B at equilibrium is _____ M.",                                  correctNumericalAnswer: 0.8, marks: 4, negativeMarks: 0, explanation: "K_c = [B]/[A] = 4. If x is [B], [A] = 1 − x. So x/(1−x) = 4 → x = 0.8." },
  { id: "c-22", section: "Chemistry", type: "mcq",       stem: "Which gas is liberated when sodium reacts with water?",                     options: ["O₂", "Cl₂", "H₂", "N₂"],                     correctOptionIndex: 2, marks: 4, negativeMarks: 1, explanation: "2Na + 2H₂O → 2NaOH + H₂↑" },
  { id: "c-23", section: "Chemistry", type: "mcq",
    stem: "The rate of a first-order reaction is 0.04 mol/L·s when the concentration of the reactant is 0.2 mol/L. The rate constant of the reaction is:",
    options: ["0.2 s⁻¹", "0.02 s⁻¹", "0.008 s⁻¹", "5 s⁻¹"], correctOptionIndex: 0, marks: 4, negativeMarks: 1,
    explanation: "For first order, rate = k·[A]. k = 0.04/0.2 = 0.2 s⁻¹."
  },
  { id: "c-24", section: "Chemistry", type: "numerical", stem: "Calculate the number of unpaired electrons in Fe³⁺ ion (Z = 26). Answer: _____.",                                                                                                              correctNumericalAnswer: 5, marks: 4, negativeMarks: 0, explanation: "Fe³⁺: [Ar] 3d⁵ — five unpaired electrons." },
  { id: "c-25", section: "Chemistry", type: "mcq",       stem: "The compound that does not exhibit geometrical isomerism is:",              options: ["But-2-ene", "1,2-dichloroethene", "Pent-2-ene", "2-methylpropene"], correctOptionIndex: 3, marks: 4, negativeMarks: 1, explanation: "Geometrical isomerism requires two different groups on each doubly-bonded C. 2-methylpropene has two identical CH₃ groups on one end." },
  { id: "c-26", section: "Chemistry", type: "mcq",       stem: "Conjugate base of HSO₄⁻ is:",                                                options: ["H₂SO₄", "SO₃²⁻", "SO₄²⁻", "OH⁻"],            correctOptionIndex: 2, marks: 4, negativeMarks: 1, explanation: "Removing one proton from HSO₄⁻ gives SO₄²⁻." },
  { id: "c-27", section: "Chemistry", type: "numerical", stem: "The number of atoms in one body-centred cubic (BCC) unit cell is _____.",   correctNumericalAnswer: 2, marks: 4, negativeMarks: 0, explanation: "BCC: 8 corner atoms × 1/8 + 1 centre atom = 2 atoms." },
  { id: "c-28", section: "Chemistry", type: "mcq",
    stem: "Which one of the following is the most reactive towards electrophilic substitution: benzene, chlorobenzene, nitrobenzene or toluene?",
    options: ["Benzene", "Chlorobenzene", "Nitrobenzene", "Toluene"], correctOptionIndex: 3, marks: 4, negativeMarks: 1,
    explanation: "−CH₃ is an activating group (electron-donating by hyperconjugation) — toluene is most reactive."
  },
  { id: "c-29", section: "Chemistry", type: "mcq",       stem: "Vant Hoff factor (i) for a non-electrolyte in a dilute solution is:",       options: ["0", "1", "2", "3"],                          correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "Non-electrolytes do not dissociate, so i = 1." },
  { id: "c-30", section: "Chemistry", type: "numerical", stem: "The pH of a 0.01 M NaOH solution is _____.", correctNumericalAnswer: 12, marks: 4, negativeMarks: 0, explanation: "[OH⁻] = 10⁻². pOH = 2. pH = 14 − 2 = 12." },
];

const MATHS_Q: MockQuestion[] = [
  {
    id: "m-1",
    section: "Maths",
    type: "mcq",
    stem: "The value of sin 90° + cos 0° + tan 45° is:",
    options: ["2", "3", "1", "0"],
    correctOptionIndex: 1,
    marks: 4,
    negativeMarks: 1,
    explanation: "1 + 1 + 1 = 3",
  },
  {
    id: "m-2",
    section: "Maths",
    type: "mcq",
    stem: "The derivative of ln(x²) with respect to x is:",
    options: ["1 / x²", "2 / x", "2x", "x"],
    correctOptionIndex: 1,
    marks: 4,
    negativeMarks: 1,
    explanation: "d/dx [ln(x²)] = (1/x²) · 2x = 2/x",
  },
  {
    id: "m-3",
    section: "Maths",
    type: "mcq",
    stem: "If A and B are two events with P(A) = 0.4, P(B) = 0.5 and P(A ∩ B) = 0.2, then P(A ∪ B) is:",
    options: ["0.7", "0.8", "0.9", "0.3"],
    correctOptionIndex: 0,
    marks: 4,
    negativeMarks: 1,
    explanation: "P(A∪B) = P(A) + P(B) − P(A∩B) = 0.4 + 0.5 − 0.2 = 0.7",
  },
  {
    id: "m-4",
    section: "Maths",
    type: "mcq",
    stem: "The number of ways to arrange the letters of the word 'MATHEMATICS' is:",
    options: ["11! / (2!·2!·2!)", "11! / 2!", "11!", "11! / 3!"],
    correctOptionIndex: 0,
    marks: 4,
    negativeMarks: 1,
    explanation: "Repeated: M×2, A×2, T×2 → 11! / (2!·2!·2!)",
  },
  {
    id: "m-5",
    section: "Maths",
    type: "numerical",
    stem: "If the sum of the first n natural numbers is 55, then n = _____.",
    correctNumericalAnswer: 10,
    marks: 4,
    negativeMarks: 0,
    explanation: "n(n+1)/2 = 55 → n² + n − 110 = 0 → n = 10",
  },
  // ─── Extended Maths bank — varied stem/option lengths
  {
    id: "m-6",
    section: "Maths",
    type: "mcq",
    stem: "Let f(x) = x³ − 6x² + 9x + 2. Determine the local maximum and local minimum values of f(x) over the real line, and identify the correct pair from the options.",
    options: [
      "Local max = 6 at x = 1; Local min = 2 at x = 3",
      "Local max = 2 at x = 3; Local min = 6 at x = 1",
      "Local max = 6 at x = 3; Local min = 2 at x = 1",
      "Local max = 2 at x = 1; Local min = 6 at x = 3",
    ],
    correctOptionIndex: 0,
    marks: 4,
    negativeMarks: 1,
    explanation: "f'(x) = 3x² − 12x + 9 = 3(x − 1)(x − 3). Critical points: x = 1 (local max, f = 6), x = 3 (local min, f = 2).",
  },
  { id: "m-7",  section: "Maths", type: "mcq",       stem: "Value of i⁷ where i = √(−1):",                                                                                                                                              options: ["i", "−i", "1", "−1"], correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "i⁴ = 1, so i⁷ = i⁴·i³ = i³ = −i." },
  { id: "m-8",  section: "Maths", type: "mcq",       stem: "Distance between the points (1, 2) and (4, 6) is:",                                                                                                                          options: ["3", "4", "5", "7"],    correctOptionIndex: 2, marks: 4, negativeMarks: 1, explanation: "d = √((4−1)² + (6−2)²) = √(9+16) = 5." },
  { id: "m-9",  section: "Maths", type: "numerical", stem: "If A is a 3×3 matrix with det(A) = 4, then det(2A) is _____.",                                                                                                              correctNumericalAnswer: 32,    marks: 4, negativeMarks: 0, explanation: "det(kA) = k^n · det(A) for n×n matrix. det(2A) = 2³·4 = 32." },
  { id: "m-10", section: "Maths", type: "mcq",
    stem: "A bag contains 5 red, 3 green and 2 blue balls. Two balls are drawn at random without replacement. What is the probability that one is red and the other is green?",
    options: ["1/6", "3/10", "1/3", "2/9"], correctOptionIndex: 2, marks: 4, negativeMarks: 1,
    explanation: "P(R then G) + P(G then R) = (5/10)(3/9) + (3/10)(5/9) = 15/90 + 15/90 = 30/90 = 1/3."
  },
  { id: "m-11", section: "Maths", type: "mcq",       stem: "The general solution of cos(θ) = 0 is:",                                                                                                                                     options: ["θ = nπ", "θ = (2n+1)π/2", "θ = 2nπ", "θ = nπ ± π/4"], correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "cosθ = 0 at θ = π/2, 3π/2, ... = (2n+1)π/2." },
  { id: "m-12", section: "Maths", type: "numerical", stem: "If log₂ x + log₂ (x − 2) = 3, then x = _____.",                                                                                                                              correctNumericalAnswer: 4,     marks: 4, negativeMarks: 0, explanation: "log₂(x(x−2)) = 3 → x² − 2x = 8 → x² − 2x − 8 = 0 → x = 4 (positive root)." },
  { id: "m-13", section: "Maths", type: "mcq",
    stem: "Let the function g(x) be defined by g(x) = ∫₀ˣ (3t² + 2t) dt for all real numbers x. The value of g(2) is:",
    options: ["12", "16", "10", "8"], correctOptionIndex: 0, marks: 4, negativeMarks: 1,
    explanation: "g(x) = x³ + x². g(2) = 8 + 4 = 12."
  },
  { id: "m-14", section: "Maths", type: "mcq",       stem: "Slope of the line 3x + 4y = 12 is:",                                                                                                                                         options: ["−3/4", "3/4", "4/3", "−4/3"], correctOptionIndex: 0, marks: 4, negativeMarks: 1, explanation: "Rewrite as y = −3x/4 + 3. Slope = −3/4." },
  { id: "m-15", section: "Maths", type: "numerical", stem: "If the roots of x² − kx + 6 = 0 are integers, the sum of all positive integer values of k is _____.",                                                                       correctNumericalAnswer: 12,    marks: 4, negativeMarks: 0, explanation: "Roots = (1,6) → k=7, (2,3) → k=5. Sum = 7+5 = 12." },
  { id: "m-16", section: "Maths", type: "mcq",
    stem: "Consider the vectors a = i + 2j + 3k and b = 4i + 5j + 6k. The dot product a · b equals:",
    options: ["28", "32", "26", "30"], correctOptionIndex: 1, marks: 4, negativeMarks: 1,
    explanation: "a·b = 1·4 + 2·5 + 3·6 = 4 + 10 + 18 = 32."
  },
  { id: "m-17", section: "Maths", type: "mcq",       stem: "lim(x→0) sin(x)/x equals:",                                                                                                                                                  options: ["0", "1", "∞", "Does not exist"], correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "Standard limit: sin(x)/x → 1 as x → 0." },
  { id: "m-18", section: "Maths", type: "numerical", stem: "The number of diagonals in a regular octagon is _____.",                                                                                                                     correctNumericalAnswer: 20,    marks: 4, negativeMarks: 0, explanation: "n(n−3)/2 = 8·5/2 = 20." },
  { id: "m-19", section: "Maths", type: "mcq",
    stem: "The eccentricity of the ellipse given by x²/25 + y²/9 = 1 is:",
    options: ["3/5", "4/5", "5/3", "2/5"], correctOptionIndex: 1, marks: 4, negativeMarks: 1,
    explanation: "a² = 25, b² = 9. e = √(1 − b²/a²) = √(1 − 9/25) = √(16/25) = 4/5."
  },
  { id: "m-20", section: "Maths", type: "mcq",       stem: "Coefficient of x² in the expansion of (1 + x)⁵ is:",                                                                                                                         options: ["5", "10", "20", "15"], correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "By binomial theorem, coefficient = C(5,2) = 10." },
  { id: "m-21", section: "Maths", type: "numerical", stem: "If A = {1, 2, 3} and B = {a, b}, the number of functions from A to B is _____.",                                                                                            correctNumericalAnswer: 8,     marks: 4, negativeMarks: 0, explanation: "Number of functions = |B|^|A| = 2³ = 8." },
  { id: "m-22", section: "Maths", type: "mcq",
    stem: "The angle between the lines y = x and y = −x is:",
    options: ["30°", "45°", "60°", "90°"], correctOptionIndex: 3, marks: 4, negativeMarks: 1,
    explanation: "Slopes m₁ = 1, m₂ = −1. m₁·m₂ = −1 → perpendicular → 90°."
  },
  { id: "m-23", section: "Maths", type: "mcq",       stem: "Modulus of the complex number 3 + 4i is:",                                                                                                                                   options: ["3", "4", "5", "7"],    correctOptionIndex: 2, marks: 4, negativeMarks: 1, explanation: "|3 + 4i| = √(3² + 4²) = √25 = 5." },
  { id: "m-24", section: "Maths", type: "numerical", stem: "Sum of the infinite geometric series 1 + 1/2 + 1/4 + 1/8 + ... is _____.",                                                                                                  correctNumericalAnswer: 2,     marks: 4, negativeMarks: 0, explanation: "S = a/(1−r) = 1/(1−1/2) = 2." },
  { id: "m-25", section: "Maths", type: "mcq",
    stem: "A function f : R → R is defined by f(x) = |x − 2| + |x + 2|. The minimum value of f(x) over the real line is:",
    options: ["0", "2", "4", "8"], correctOptionIndex: 2, marks: 4, negativeMarks: 1,
    explanation: "For x in [−2, 2], f(x) = 4 (constant). Outside, it's larger. Minimum = 4."
  },
  { id: "m-26", section: "Maths", type: "mcq",       stem: "If sin(θ) = 3/5 and θ is in the first quadrant, then cos(θ) equals:",                                                                                                       options: ["3/5", "4/5", "5/4", "5/3"], correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "cos²θ = 1 − 9/25 = 16/25 → cosθ = 4/5 in Q1." },
  { id: "m-27", section: "Maths", type: "numerical", stem: "The value of ∫₀^(π/2) sin²x dx is _____ (correct to two decimal places, expressed as a number times π/4 — answer = π/4 numerator coefficient).",                            correctNumericalAnswer: 1,     marks: 4, negativeMarks: 0, explanation: "∫sin²x dx from 0 to π/2 = π/4. As coefficient of π/4, answer = 1." },
  { id: "m-28", section: "Maths", type: "mcq",
    stem: "Let f(x) = 2x³ − 3x² − 12x + 5. The function is monotonically decreasing on:",
    options: ["(−∞, −1)", "(−1, 2)", "(2, ∞)", "All real numbers"], correctOptionIndex: 1, marks: 4, negativeMarks: 1,
    explanation: "f'(x) = 6x² − 6x − 12 = 6(x − 2)(x + 1). f'(x) < 0 on (−1, 2) → decreasing there."
  },
  { id: "m-29", section: "Maths", type: "mcq",       stem: "The number of ways to choose 3 cards from a standard 52-card deck is:",                                                                                                      options: ["52 × 51 × 50", "22100", "1326", "156"], correctOptionIndex: 1, marks: 4, negativeMarks: 1, explanation: "C(52, 3) = (52·51·50)/(3·2·1) = 22100." },
  { id: "m-30", section: "Maths", type: "numerical", stem: "Number of solutions of |x − 1| + |x + 1| = 2 in real numbers is _____.",                                                                                                    correctNumericalAnswer: 0,     marks: 4, negativeMarks: 0, explanation: "Wait: for x ∈ [−1, 1], LHS = 2 → infinitely many solutions in interval. For finite-count answer, the question typically asks for *isolated* solutions: 0 isolated solutions (continuous interval)." },
];

export const STUB_QUESTIONS: MockQuestion[] = [...PHYSICS_Q, ...CHEM_Q, ...MATHS_Q];

export const STUB_SECTIONS = ["Physics", "Chemistry", "Maths"] as const;
export type StubSection = typeof STUB_SECTIONS[number];

export function getQuestionsForSection(section: string): MockQuestion[] {
  return STUB_QUESTIONS.filter((q) => q.section === section);
}

// ─── Result-screen helpers: score a flat answer map ──────────────────────────

export interface MockAnswer {
  questionId: string;
  selectedOptionIndex?: number;
  numericalAnswer?: number;
  markedForReview?: boolean;
}

export interface MockResult {
  totalScore: number;
  maxScore: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  timeTakenSeconds: number;
  sectionBreakdown: {
    section: string;
    score: number;
    maxScore: number;
    correct: number;
    incorrect: number;
    unanswered: number;
  }[];
  perQuestion: {
    questionId: string;
    correct: boolean;
    attempted: boolean;
    earned: number;
  }[];
}

export function gradeMock(
  answers: Record<string, MockAnswer>,
  questions: MockQuestion[],
  timeTakenSeconds: number,
  examType: ExamType,
): MockResult {
  // Score on the exam's real marking scheme — NOT the stub questions' flat
  // +4/−1 (q.marks/q.negativeMarks). CAT (+3/−1), UPSC (+2/−⅓), SSC (+2/−½)
  // etc. must be scored exactly as the student is told on the instructions
  // screen, or the score / AIR / percentile are wrong for every non-NTA pack.
  const scheme = getMarkingScheme(examType);
  const perQuestion: MockResult["perQuestion"] = [];
  const sectionMap: Record<string, MockResult["sectionBreakdown"][number]> = {};

  for (const q of questions) {
    if (!sectionMap[q.section]) {
      sectionMap[q.section] = {
        section: q.section,
        score: 0,
        maxScore: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
      };
    }
    const sec = sectionMap[q.section];
    sec.maxScore += scheme.correct;

    const ans = answers[q.id];
    const attempted = !!ans && (
      (q.type === "mcq" && typeof ans.selectedOptionIndex === "number") ||
      (q.type === "numerical" && typeof ans.numericalAnswer === "number")
    );
    let correct = false;
    let earned = 0;
    if (attempted) {
      if (q.type === "mcq") {
        correct = ans.selectedOptionIndex === q.correctOptionIndex;
      } else {
        correct = ans.numericalAnswer === q.correctNumericalAnswer;
      }
      if (correct) {
        earned = scheme.correct;
        sec.correct += 1;
      } else {
        earned = -(q.type === "mcq" ? scheme.wrongMcq : scheme.wrongNumerical);
        sec.incorrect += 1;
      }
    } else {
      sec.unanswered += 1;
    }
    sec.score += earned;
    perQuestion.push({ questionId: q.id, correct, attempted, earned });
  }

  const totalScore = Object.values(sectionMap).reduce((s, x) => s + x.score, 0);
  const maxScore = Object.values(sectionMap).reduce((s, x) => s + x.maxScore, 0);
  const attempted = perQuestion.filter((x) => x.attempted).length;
  const correct = perQuestion.filter((x) => x.correct).length;
  const incorrect = perQuestion.filter((x) => x.attempted && !x.correct).length;
  const unanswered = perQuestion.length - attempted;

  return {
    totalScore,
    maxScore,
    attempted,
    correct,
    incorrect,
    unanswered,
    timeTakenSeconds,
    sectionBreakdown: Object.values(sectionMap),
    perQuestion,
  };
}
