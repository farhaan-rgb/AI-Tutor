/**
 * AI Tutor prototype — Chapter Home
 * Rebuilt to match learning-path.tsx's real pattern: ALL chapters render in one
 * continuous scroll (not a single-chapter page), with a sticky current-chapter
 * header (hexagon chapter badge + topic count + "Jump to Lesson" sheet) that
 * tracks scroll position via IntersectionObserver — mirroring StickyChapterHeader
 * + ChapterListSheet in the real app.
 *
 * Chapters 1 (Real Numbers) and 2 (Polynomials) have real interactive content
 * (Explain/Solve built for their topics). Chapters 3-14 show their real
 * sub-topic line items (sourced from jemh103-114.pdf) inline in the same
 * status-circle + connector timeline as Chapters 1-2 — dimmed with a lock
 * icon, per the real app's convention of keeping locked and unlocked topics
 * in one unbroken list rather than a separate disconnected screen.
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, Play, AlertCircle, ChevronDown, Sparkles, BookOpen, Lock } from "lucide-react";
import { StatusBar, AnimatedProgress, typo } from "../shared/premium-ui";
import { FloatingAITutor } from "../shared/floating-ai-tutor";
import { BottomSheet } from "../shared/bottom-sheet";
import { DUMMY_CRASH_COURSES_1112, getCrash1112Info } from "../shared/classroom-catalog";

// Chapter list is resolved per-sku at render time (see chapterTitlesFor /
// sectionsForChapter below) — this file now serves more than one course.
const DEFAULT_SKU = "ncert-10-maths";

type TopicStatus = "completed" | "in-progress" | "not-started" | "open-doubt" | "locked";

interface Topic {
  id: string;
  title: string;
  meta: string;
  status: TopicStatus;
  explainQuery?: string;
  // Marks "the recommended next action" — pre-expanded on load, with a pulsing
  // glow ring on its Explain icon. Orthogonal to `status`: real ActionCard.tsx's
  // `highlight` flag works the same way, independent of completion state.
  highlighted?: boolean;
  // Only meaningful when explainQuery is set (exercises are already Practice-only
  // regardless). "concept" (a theorem/proof — Explain only), "example" (a solved,
  // procedural worked example — Practice only, since watching it explained again
  // matters less than trying it yourself), or "both" for a topic that genuinely
  // mixes a concept explanation with its own practice-worthy example.
  kind?: "concept" | "example" | "both";
}

interface Section {
  label: string;
  topics: Topic[];
}

interface ChapterData {
  title: string;
  sections: Section[];
}

// Chapter 1 — everything starts not-started, matching what a student sees the
// moment they enroll, before opening anything. No fabricated history.
const CH1_SECTIONS: Section[] = [
  {
    label: "1.2 — Fundamental Theorem of Arithmetic",
    topics: [
      { id: "unique-factorisation", title: "Unique prime factorisation", meta: "Not started · Theorem 1.1, Example 1", status: "not-started", explainQuery: "unique-factorisation", kind: "both" },
      { id: "hcf-lcm-two", title: "HCF & LCM — two numbers", meta: "Not started · Examples 2–3", status: "not-started", explainQuery: "hcf-lcm-two", kind: "example" },
      { id: "hcf-lcm-three", title: "HCF & LCM — three numbers", meta: "Not started · Example 4", status: "not-started", explainQuery: "hcf-lcm-three", kind: "example" },
      { id: "ex-1-1", title: "Exercise 1.1 — Practice", meta: "Not started · 7 questions", status: "not-started" },
    ],
  },
  {
    label: "1.3 — Revisiting Irrational Numbers",
    topics: [
      { id: "root-p-irrational", title: "Proving √p is irrational", meta: "Not started · Theorems 1.2–1.3, Example 5", status: "not-started", explainQuery: "root-p-irrational", kind: "both" },
      { id: "composite-proofs", title: "Proving expressions like 5−√3 are irrational", meta: "Not started · Examples 6–7", status: "not-started", explainQuery: "composite-proofs", kind: "example" },
      { id: "ex-1-2", title: "Exercise 1.2 — Practice", meta: "Not started · 3 questions", status: "not-started" },
    ],
  },
];

// Chapter 2 — everything starts not-started, same convention as Chapter 1.
// "Geometrical meaning" is kind: "both" via the Remark ("degree n → at most
// n zeroes") rather than a numbered Theorem — Ch.2 doesn't number this one,
// so the meta cites what the book actually calls it (see CONTENT_RULEBOOK.md
// rule 2). Exercise 2.1 and Example 1 are visual/perceptual (read zero-count
// off a real graph) — still Practice, just a different interaction inside
// ai-tutor-solve.tsx, not a different Explain/Practice classification.
const CH2_SECTIONS: Section[] = [
  {
    label: "2.2 — Geometrical Meaning of the Zeroes of a Polynomial",
    topics: [
      { id: "zeroes-geometrical-meaning", title: "Geometrical meaning of zeroes", meta: "Not started · Example 1", status: "not-started", explainQuery: "zeroes-geometrical-meaning", kind: "both" },
      { id: "ex-2-1", title: "Exercise 2.1 — Practice", meta: "Not started · 1 question", status: "not-started" },
    ],
  },
  {
    label: "2.3 — Relationship between Zeroes and Coefficients",
    topics: [
      { id: "zeroes-coeff-quadratic", title: "Zeroes & coefficients — quadratic", meta: "Not started · Examples 2–4", status: "not-started", explainQuery: "zeroes-coeff-quadratic", kind: "both" },
      { id: "zeroes-coeff-cubic", title: "Zeroes & coefficients — cubic", meta: "Not started · Example 5", status: "not-started", explainQuery: "zeroes-coeff-cubic", kind: "both" },
      { id: "ex-2-2", title: "Exercise 2.2 — Practice", meta: "Not started · 2 questions", status: "not-started" },
    ],
  },
];

// Science Chapter 1 — "Chemical Reactions and Equations" (jesc101.pdf). Sample
// scope (see CONTENT_RULEBOOK.md / the AI Tutor conversation): 2 of the
// chapter's real sections, not all 5 reaction types or the full 20-question
// end exercise. Per rulebook rule 3a, each concept topic's own Practice is
// just its matching worked example — the book's own separate "QUESTIONS"
// box (section 1.1) and end-of-chapter "EXERCISES" section each get their
// own standalone topic instead of being folded into a concept topic.
const CH1_SCIENCE_SECTIONS: Section[] = [
  {
    label: "1.1 — Chemical Equations",
    topics: [
      { id: "balancing-chemical-equations", title: "Writing & balancing chemical equations", meta: "Not started · Worked example", status: "not-started", explainQuery: "balancing-chemical-equations", kind: "both" },
      { id: "sec-1-1-questions", title: "In-text Questions — Practice", meta: "Not started · 3 questions", status: "not-started" },
    ],
  },
  {
    label: "1.2 — Types of Chemical Reactions",
    topics: [
      { id: "reaction-types-redox", title: "Types of reactions, oxidation & reduction", meta: "Not started · Worked example", status: "not-started", explainQuery: "reaction-types-redox", kind: "both" },
    ],
  },
  {
    label: "End-of-chapter Exercises",
    topics: [
      { id: "ch1-sci-exercises", title: "Chapter Exercises — Practice", meta: "Not started · Q1–Q2 of 20 (sample)", status: "not-started" },
    ],
  },
];

// Science chapters 2-13 have no built Explain/Solve content yet, and unlike
// Maths chapters 3-14, their real sub-topic bullets haven't been researched
// from jesc102-113.pdf yet either (only Ch.1 has) — so this is an honest
// generic "locked, not yet broken down" placeholder rather than inventing
// specific bullet points from memory.
function scienceLockedSections(chapterIdx: number): Section[] {
  return [
    { label: "Full chapter", topics: [{ id: `sci-c${chapterIdx}-locked`, title: "Concepts & practice", meta: "", status: "locked" }] },
  ];
}

// Real sub-topic line items for Maths Chapters 3-14 — theorems, named examples,
// real exercise question counts, sourced from each chapter's actual body text
// (jemh103.pdf-jemh114.pdf). These chapters have no built Explain/Solve content
// yet, so every topic here stays "locked" regardless of enrollment — the lock
// represents "not built in this prototype," same treatment either way.
const MATHS_LOCKED_CHAPTER_RAW: Record<number, { label: string; topics: string[]; exercise: string }[]> = {
  2: [
    { label: "3.2 — Graphical Method of Solution", topics: ["Intersecting, parallel, or coincident lines", "Consistent vs. inconsistent pairs"], exercise: "Exercise 3.1 — 7 questions" },
    { label: "3.3.1 — Substitution Method", topics: ["Solving by substituting one variable", "Recognising infinite / no solutions"], exercise: "Exercise 3.2 — 3 questions" },
    { label: "3.3.2 — Elimination Method", topics: ["Equalising coefficients to eliminate a variable", "Age & digit-reversal word problems"], exercise: "Exercise 3.3 — 2 questions" },
  ],
  3: [
    { label: "4.2 — Quadratic Equations", topics: ["Standard form ax² + bx + c = 0", "Recognising quadratic equations"], exercise: "Exercise 4.1 — 2 questions" },
    { label: "4.3 — Solution by Factorisation", topics: ["Finding roots via factorisation", "Word problems → quadratic equations"], exercise: "Exercise 4.2 — 6 questions" },
    { label: "4.4 — Nature of Roots", topics: ["Quadratic formula & discriminant", "Two distinct / equal / no real roots"], exercise: "Exercise 4.3 — 5 questions" },
  ],
  4: [
    { label: "5.2 — Arithmetic Progressions", topics: ["Common difference & general form", "Identifying an AP"], exercise: "Exercise 5.1 — 4 questions" },
    { label: "5.3 — nth Term of an AP", topics: ["nth term formula aₙ = a + (n−1)d", "Term-from-the-end problems"], exercise: "Exercise 5.2 — 20 questions" },
    { label: "5.4 — Sum of First n Terms", topics: ["Sum formula Sₙ = (n/2)[2a + (n−1)d]", "Sum of the first n positive integers"], exercise: "Exercise 5.3 — 20 questions" },
  ],
  5: [
    { label: "6.2 — Similar Figures", topics: ["Equal angles + proportional sides", "Similar vs. congruent figures"], exercise: "Exercise 6.1 — 3 questions" },
    { label: "6.3 — Similarity of Triangles", topics: ["Basic Proportionality (Thales) Theorem", "Converse of the Basic Proportionality Theorem"], exercise: "Exercise 6.2 — 10 questions" },
    { label: "6.4 — Criteria for Similarity", topics: ["AA / AAA similarity", "SSS similarity", "SAS similarity"], exercise: "Exercise 6.3 — 16 questions" },
  ],
  6: [
    { label: "7.2 — Distance Formula", topics: ["Distance between two points", "Checking collinearity & triangle type"], exercise: "Exercise 7.1 — 10 questions" },
    { label: "7.3 — Section Formula", topics: ["Dividing a segment in a given ratio", "Midpoint formula"], exercise: "Exercise 7.2 — 10 questions" },
  ],
  7: [
    { label: "8.2 — Trigonometric Ratios", topics: ["sin, cos, tan and their reciprocals", "Ratios from a given right triangle"], exercise: "Exercise 8.1 — 11 questions" },
    { label: "8.3 — Ratios of Specific Angles", topics: ["Values at 0°, 30°, 45°, 60°, 90°"], exercise: "Exercise 8.2 — 4 questions" },
    { label: "8.4 — Trigonometric Identities", topics: ["sin²A + cos²A = 1", "1 + tan²A = sec²A", "cot²A + 1 = cosec²A"], exercise: "Exercise 8.3 — 10 questions" },
  ],
  8: [
    { label: "9.1 — Heights and Distances", topics: ["Angle of elevation & angle of depression", "Solving real height/distance problems"], exercise: "Exercise 9.1 — 15 questions" },
  ],
  9: [
    { label: "10.2 — Tangent to a Circle", topics: ["Tangent is perpendicular to the radius"], exercise: "Exercise 10.1 — 4 questions" },
    { label: "10.3 — Number of Tangents from a Point", topics: ["Tangent lengths from an external point are equal", "One, two, or no tangents from a point"], exercise: "Exercise 10.2 — 13 questions" },
  ],
  10: [
    { label: "11.1 — Areas of Sector and Segment", topics: ["Area of a sector", "Area of a segment"], exercise: "Exercise 11.1 — 14 questions" },
  ],
  11: [
    { label: "12.2 — Surface Area of a Combination of Solids", topics: ["Combining cones, cylinders, hemispheres", "Why joined faces aren't double-counted"], exercise: "Exercise 12.1 — 9 questions" },
    { label: "12.3 — Volume of a Combination of Solids", topics: ["Volumes simply add when solids combine"], exercise: "Exercise 12.2 — 8 questions" },
  ],
  12: [
    { label: "13.2 — Mean of Grouped Data", topics: ["Direct method", "Assumed mean method", "Step-deviation method"], exercise: "Exercise 13.1 — 9 questions" },
    { label: "13.3 — Mode of Grouped Data", topics: ["Modal class & the mode formula"], exercise: "Exercise 13.2 — 6 questions" },
    { label: "13.4 — Median of Grouped Data", topics: ["Cumulative frequency & the median formula", "3 × Median = Mode + 2 × Mean"], exercise: "Exercise 13.3 — 7 questions" },
  ],
  13: [
    { label: "14.1 — Probability: A Theoretical Approach", topics: ["P(E) = favourable outcomes ÷ total outcomes", "Complementary events: P(E) + P(not E) = 1"], exercise: "Exercise 14.1 — 25 questions" },
  ],
};

function mathsLockedSectionsFor(chapterIdx: number): Section[] {
  const raw = MATHS_LOCKED_CHAPTER_RAW[chapterIdx] ?? [];
  return raw.map((s, si) => ({
    label: s.label,
    topics: [
      ...s.topics.map((t, ti) => ({ id: `c${chapterIdx}-s${si}-t${ti}`, title: t, meta: "", status: "locked" as TopicStatus })),
      { id: `c${chapterIdx}-s${si}-ex`, title: s.exercise, meta: "", status: "locked" as TopicStatus },
    ],
  }));
}

// This screen now serves more than one course — chapter list and per-chapter
// content both need to resolve against whichever sku is actually active,
// not just assume ncert-10-maths.
function chapterTitlesFor(sku: string): string[] {
  const info = getCrash1112Info(sku) ?? DUMMY_CRASH_COURSES_1112[DEFAULT_SKU];
  return info.subjects[0].chapterList;
}

function sectionsForChapter(sku: string, chapterIdx: number): Section[] {
  if (sku === "ncert-10-science") {
    return chapterIdx === 0 ? CH1_SCIENCE_SECTIONS : scienceLockedSections(chapterIdx);
  }
  return chapterIdx === 0 ? CH1_SECTIONS : chapterIdx === 1 ? CH2_SECTIONS : mathsLockedSectionsFor(chapterIdx);
}

function allChaptersFor(sku: string): ChapterData[] {
  return chapterTitlesFor(sku).map((title, i) => ({
    title,
    sections: sectionsForChapter(sku, i),
  }));
}

const STATUS_COLOR: Record<TopicStatus, string> = {
  completed: "var(--success)",
  "in-progress": "var(--primary)",
  "not-started": "var(--muted-foreground)",
  "open-doubt": "var(--error)",
  locked: "var(--border)",
};

// 44px + layered shadow (colored drop-shadow + inset highlight/shadow) — the
// "glossy pressed-button" treatment used throughout the real app's icon/circle UI.
function StatusCircle({ status }: { status: TopicStatus }) {
  const size = 44;
  const bg =
    status === "completed" ? "var(--success)" :
    status === "in-progress" ? "var(--primary)" :
    status === "open-doubt" ? "var(--error)" :
    status === "locked" ? "var(--secondary)" :
    "var(--secondary)";
  const border = status === "not-started" ? "2px solid var(--border)" : "none";
  const shadowColor =
    status === "completed" ? "var(--success-700)" :
    status === "in-progress" ? "var(--primary-700)" :
    status === "open-doubt" ? "var(--error-700, var(--error-600))" :
    "transparent";
  const dropShadow = status === "not-started" || status === "locked" ? "none" : `0 4px 0 0 ${shadowColor}`;
  const glossInset = status === "not-started" || status === "locked"
    ? "none"
    : "inset 0 -2px 0 rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.25)";

  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size, height: size, borderRadius: "50%", background: bg, border,
        opacity: status === "locked" ? 0.5 : 1,
        boxShadow: [dropShadow, glossInset].filter((s) => s !== "none").join(", ") || "none",
      }}
    >
      {status === "completed" && <Check style={{ width: 18, height: 18, color: "var(--white)" }} strokeWidth={2.5} />}
      {status === "in-progress" && <Play style={{ width: 16, height: 16, color: "var(--white)" }} fill="var(--white)" />}
      {status === "not-started" && <Play style={{ width: 16, height: 16, color: "var(--muted-foreground)" }} />}
      {status === "open-doubt" && <AlertCircle style={{ width: 18, height: 18, color: "var(--white)" }} strokeWidth={2.5} />}
      {status === "locked" && <Lock style={{ width: 15, height: 15, color: "var(--muted-foreground)" }} />}
    </div>
  );
}

// Hexagon chapter badge — sticky header's current-chapter indicator.
function HexBadge({ n }: { n: number }) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: 32, height: 32,
        clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        background: "var(--gradient-primary-btn)",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--white)" }}>{n}</span>
    </div>
  );
}

// Square chapter-number badge — used in the Jump-to-Lesson list and per-chapter
// block headers within the scroll, matching the real app's NumberBadge shape.
function SquareBadge({ n, active }: { n: number; active: boolean }) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: 28, height: 28, borderRadius: 10,
        background: active ? "var(--primary)" : "color-mix(in srgb, var(--primary) 14%, var(--card))",
        border: active ? "none" : "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: active ? "var(--white)" : "var(--primary)" }}>{n}</span>
    </div>
  );
}

// Flanking divider lines (equal-width lines either side of a centered label)
// collapse to invisible once the label itself is wide — fine for Chapter 1's
// short section names, but the real NCERT section titles elsewhere (e.g.
// "Geometrical Meaning of the Zeroes of a Polynomial") are much longer and
// left the divider with no visible line at all. A bottom-border header reads
// consistently regardless of label length.
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ margin: "18px 0 12px", paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
      <span style={typo.metaStyle}>{label}</span>
    </div>
  );
}

function TopicRow({ topic, isLast, nextStatus, isPreview, onExplain, onPractice, onLockedTap }: {
  topic: Topic;
  isLast: boolean;
  nextStatus?: TopicStatus;
  isPreview: boolean;
  onExplain: (t: Topic) => void;
  onPractice: (t: Topic) => void;
  onLockedTap: () => void;
}) {
  // Every row starts collapsed EXCEPT the recommended next action, which opens
  // pre-expanded so its Explain/Practice buttons are visible without an extra tap.
  const [open, setOpen] = useState(topic.highlighted ?? false);
  const [openDoubt, setOpenDoubt] = useState(false);
  const expanded = topic.status === "open-doubt" ? openDoubt : open;
  const setExpanded = topic.status === "open-doubt" ? setOpenDoubt : setOpen;
  const dim = topic.status === "not-started" || topic.status === "locked";
  const locked = topic.status === "locked";

  return (
    <div className="flex" style={{ gap: 10 }}>
      <div className="flex flex-col items-center shrink-0" style={{ width: 44 }}>
        <StatusCircle status={topic.status} />
        {!isLast && (
          <div
            style={{
              width: 2, flex: 1, marginTop: 4, minHeight: 18,
              backgroundImage: `repeating-linear-gradient(to bottom, ${STATUS_COLOR[nextStatus ?? topic.status]} 0px, ${STATUS_COLOR[nextStatus ?? topic.status]} 4px, transparent 4px, transparent 10px)`,
            }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0" style={{ paddingBottom: 12 }}>
        <button
          onClick={() => (locked ? (isPreview ? onLockedTap() : undefined) : setExpanded(!expanded))}
          className="flex items-center gap-2 w-full text-left"
          style={{ padding: "6px 4px", borderRadius: 8, background: "none", border: "none", cursor: locked && !isPreview ? "default" : "pointer" }}
        >
          <div className="flex-1 min-w-0">
            <p style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)", color: dim ? "var(--muted-foreground)" : "var(--foreground)" }}>
              {topic.title}
            </p>
            {topic.meta && <p style={{ ...typo.metaStyle, marginTop: 1 }}>{topic.meta}</p>}
          </div>
          {!locked && (
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown style={{ width: 15, height: 15, color: "var(--muted-foreground)" }} />
            </motion.div>
          )}
        </button>

        <AnimatePresence initial={false}>
          {expanded && !locked && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              {topic.status === "open-doubt" ? (
                <div className="flex gap-2 flex-wrap" style={{ padding: "8px 4px 4px 4px" }}>
                  <button style={chipSolidStyle("var(--error)")}>Resolve now</button>
                  <button style={chipOutlineStyle}>Remind me later</button>
                </div>
              ) : topic.status === "in-progress" ? (
                <div className="flex gap-2 flex-wrap" style={{ padding: "8px 4px 4px 4px" }}>
                  <button style={chipSolidStyle("var(--primary)")}>Resume practice</button>
                  <button style={chipOutlineStyle} onClick={() => onExplain(topic)}>Explain a step</button>
                </div>
              ) : (() => {
                // Concepts (theorems/proofs) show only Explain. Solved/worked
                // examples that teach a procedure (kind: "example") show only
                // Practice — trying the method yourself matters more than being
                // walked through it again. Exercises (no explainQuery at all)
                // are already Practice-only. A topic can show both if it's
                // authored as kind: "both".
                const showExplain = !!topic.explainQuery && topic.kind !== "example";
                const showPractice = !topic.explainQuery || topic.kind === "example" || topic.kind === "both";
                // Only one action glows for a highlighted topic — whichever is
                // the single thing to do next (Explain for concepts, Practice
                // for solved examples). If both show (kind: "both"), Explain wins.
                const explainGlows = topic.highlighted && showExplain;
                const practiceGlows = topic.highlighted && showPractice && !showExplain;
                return (
                <div className="flex gap-3" style={{ padding: "8px 4px 4px 42px" }}>
                  {showExplain && (
                    <button onClick={() => onExplain(topic)} className="flex flex-col items-center" style={{ gap: 6, width: 62, background: "none", border: "none", cursor: "pointer" }}>
                      <div className="relative" style={{ width: 52, height: 52 }}>
                        {explainGlows && (
                          <motion.div
                            animate={{ opacity: [0.1, 0.75, 0.1], scale: [0.98, 1.06, 0.98] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute pointer-events-none"
                            style={{ inset: -5, borderRadius: 21, border: "2px solid var(--warning)", boxShadow: "0 0 10px color-mix(in srgb, var(--warning) 40%, transparent)" }}
                          />
                        )}
                        <div style={{ position: "relative", ...actionIconStyle("var(--warning)", "var(--warning-950)") }}>
                          <Play style={{ width: 18, height: 18 }} fill="var(--warning)" color="var(--warning)" />
                        </div>
                      </div>
                      <span style={{ ...actionLabelStyle, ...(explainGlows ? { fontWeight: "var(--font-weight-bold)", color: "var(--warning)" } : {}) }}>Explain</span>
                    </button>
                  )}
                  {showPractice && (
                    <button onClick={() => onPractice(topic)} className="flex flex-col items-center" style={{ gap: 6, width: 62, background: "none", border: "none", cursor: "pointer" }}>
                      <div className="relative" style={{ width: 52, height: 52 }}>
                        {practiceGlows && (
                          <motion.div
                            animate={{ opacity: [0.1, 0.75, 0.1], scale: [0.98, 1.06, 0.98] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute pointer-events-none"
                            style={{ inset: -5, borderRadius: 21, border: "2px solid var(--primary)", boxShadow: "0 0 10px color-mix(in srgb, var(--primary) 40%, transparent)" }}
                          />
                        )}
                        <div style={{ position: "relative", ...actionIconStyle("var(--primary)", "var(--primary-950)") }}>
                          <span style={{ fontSize: 18 }}>⚡</span>
                        </div>
                      </div>
                      <span style={{ ...actionLabelStyle, ...(practiceGlows ? { fontWeight: "var(--font-weight-bold)", color: "var(--primary)" } : {}) }}>Practice</span>
                    </button>
                  )}
                </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function actionIconStyle(color: string, bg: string): React.CSSProperties {
  return {
    width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
    background: bg, border: `1.5px solid color-mix(in srgb, ${color} 35%, transparent)`,
    boxShadow: `0 3px 0 0 color-mix(in srgb, ${color} 30%, transparent), inset 0 -1px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)`,
  };
}
const actionLabelStyle: React.CSSProperties = { ...typo.metaStyle, fontWeight: "var(--font-weight-semibold)" };
function chipSolidStyle(color: string): React.CSSProperties {
  return { ...typo.badgeStyle, padding: "8px 14px", borderRadius: 20, border: "none", background: color, color: "var(--white)", cursor: "pointer" };
}
const chipOutlineStyle: React.CSSProperties = { ...typo.badgeStyle, padding: "8px 14px", borderRadius: 20, border: "1.5px solid var(--primary)", background: "transparent", color: "var(--primary)", cursor: "pointer" };

// Flat two-button banner — matches the real FreemiumUnlockBanner (an outline
// "View Details" + a solid flat "Enroll Now"), not a gradient pill CTA.
function FreemiumUnlockBanner({ onViewDetails, onEnroll }: { onViewDetails: () => void; onEnroll: () => void }) {
  return (
    <div
      className="flex items-center shrink-0"
      style={{ gap: 10, padding: "12px 16px calc(16px + env(safe-area-inset-bottom)) 16px", backgroundColor: "var(--card)", borderTop: "1px solid var(--border)" }}
    >
      <button
        onClick={onViewDetails}
        className="flex items-center justify-center flex-1"
        style={{ height: 44, borderRadius: 10, background: "transparent", border: "1.5px solid var(--primary)", cursor: "pointer" }}
      >
        <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary)" }}>View Details</span>
      </button>
      <button
        onClick={onEnroll}
        className="flex items-center justify-center flex-1"
        style={{ height: 44, borderRadius: 10, background: "var(--primary)", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>Enroll Now</span>
      </button>
    </div>
  );
}

function chapterTopicCount(c: ChapterData) {
  return c.sections.reduce((sum, s) => sum + s.topics.length, 0);
}

// Demo-only: a topic shows as completed once both its Explain and Practice
// screens have been marked complete (see ai-tutor-explain.tsx / ai-tutor-solve.tsx).
// Not a real progress-tracking system — just lets the person driving the demo
// simulate "this has been done" and see the resulting completed state.
// Concepts show only an Explain button now (Practice was dropped — it pointed
// at an unrelated generic exercise for every concept). So "understood" IS the
// completion bar for a concept; requiring a practice flag too meant marking a
// concept understood could never actually complete it. Exercises (no
// explainQuery, Practice-only) still complete via their own practice flag.
function isTopicComplete(t: Topic) {
  const key = t.explainQuery ?? t.id;
  const explainDone = localStorage.getItem(`ai_tutor_demo_explain_${key}`) === "1";
  const practiceDone = localStorage.getItem(`ai_tutor_demo_practice_${key}`) === "1";
  if (!t.explainQuery) return practiceDone; // exercises — Practice-only
  if (t.kind === "example") return practiceDone; // solved examples — Practice-only
  if (t.kind === "both") return explainDone && practiceDone;
  return explainDone; // concept (default) — Explain-only
}

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Free preview of Chapter 1, reached pre-enrollment from curriculum-preview.tsx.
  const isPreview = params.get("preview") === "1";
  const skuParam = params.get("sku") ?? DEFAULT_SKU;
  const allChapters = allChaptersFor(skuParam);
  const initialChapter = Math.min(Math.max(parseInt(params.get("chapter") ?? "0", 10), 0), allChapters.length - 1);

  const [currentChapter, setCurrentChapter] = useState(initialChapter);
  const [showJumpSheet, setShowJumpSheet] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Jump to the requested chapter on first mount — no animation, this is the
  // initial landing position, not a user-triggered navigation.
  useEffect(() => {
    chapterRefs.current[initialChapter]?.scrollIntoView({ block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-spy — tracks which chapter block is topmost-visible so the sticky
  // header always reflects what's actually on screen, same as StickyChapterHeader.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        const idx = Number((topMost.target as HTMLElement).dataset.chapterIndex);
        if (!Number.isNaN(idx)) setCurrentChapter(idx);
      },
      { root, rootMargin: "-8% 0px -75% 0px", threshold: 0 }
    );
    chapterRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function scrollToChapter(idx: number) {
    setShowJumpSheet(false);
    chapterRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const currentChapterData = allChapters[currentChapter];
  const isViewingLockedChapter = currentChapter > 0;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
      <StatusBar />

      {/* Sticky current-chapter header */}
      <div className="flex items-center gap-3 shrink-0" style={{ padding: "10px 20px 12px" }}>
        <button onClick={() => navigate(-1)} className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: "var(--radius-button)", background: "var(--card)", border: "1px solid var(--border)" }}>
          <ArrowLeft style={{ width: 18, height: 18, color: "var(--foreground)" }} />
        </button>
        <HexBadge n={currentChapter + 1} />
        <div className="flex-1 min-w-0">
          <p style={{ ...typo.pageTitleStyle }} className="truncate">{currentChapterData.title}</p>
          <p style={typo.metaStyle}>{chapterTopicCount(currentChapterData)} topics</p>
        </div>
        <button
          onClick={() => setShowJumpSheet(true)}
          className="flex items-center justify-center shrink-0"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-button)", background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <BookOpen style={{ width: 17, height: 17, color: "var(--foreground)" }} />
        </button>
      </div>
      <div style={{ height: 1, background: "var(--border)" }} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ padding: "16px 20px 24px" }}>
        {allChapters.map((c, ci) => (
          <div
            key={c.title}
            ref={(el) => { chapterRefs.current[ci] = el; }}
            data-chapter-index={ci}
            style={{ marginBottom: 32, scrollMarginTop: 4 }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
              <SquareBadge n={ci + 1} active={ci === 0} />
              <span style={typo.cardTitleStyle}>{c.title}</span>
            </div>

            {ci === 0 && (
              isPreview ? (
                <div
                  className="flex items-center gap-2"
                  style={{ padding: "10px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)", marginBottom: 20 }}
                >
                  <Sparkles style={{ width: 15, height: 15, color: "var(--primary)", flexShrink: 0 }} />
                  <span style={{ ...typo.metaStyle, color: "var(--foreground)" }}>Free preview — explore all of Chapter 1, no enrollment needed.</span>
                </div>
              ) : (
                <div style={{ marginBottom: 20 }}>
                  <div className="flex items-baseline justify-between" style={{ marginBottom: 6 }}>
                    <span style={typo.metaStyle}>Concepts explained</span>
                    <span style={{ ...typo.metaStyle, fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>0 / 6</span>
                  </div>
                  <AnimatedProgress percent={0} color="var(--primary)" />
                  <div className="flex items-baseline justify-between" style={{ margin: "10px 0 6px" }}>
                    <span style={typo.metaStyle}>Problems solved</span>
                    <span style={{ ...typo.metaStyle, fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>0 / 14</span>
                  </div>
                  <AnimatedProgress percent={0} color="var(--success)" />
                </div>
              )
            )}

            {(() => {
              // The "recommended next action" advances as topics get completed —
              // it's always the first not-yet-complete topic in the chapter's
              // explain sequence, not just whichever one was authored first.
              const explainSequence = c.sections.flatMap((s) => s.topics.filter((t) => t.explainQuery));
              const recommended = explainSequence.find((t) => !isTopicComplete(t));
              const recommendedKey = recommended?.explainQuery;

              return c.sections.map((section) => {
              const effectiveTopics = section.topics.map((t) => {
                if (isTopicComplete(t)) {
                  // Swap the status word but keep the citation (Theorem/Example
                  // numbers) that was already there — completing a topic doesn't
                  // make its source reference disappear.
                  const citation = t.meta.replace(/^Not started · /, "");
                  const statusWord = !t.explainQuery ? "Completed" : t.kind === "example" ? "Practiced" : t.kind === "both" ? "Explained · Practiced" : "Explained";
                  return { ...t, status: "completed" as TopicStatus, meta: `${statusWord} · ${citation}`, highlighted: false };
                }
                return { ...t, highlighted: t.explainQuery === recommendedKey };
              });
              return (
              <div key={section.label}>
                <SectionDivider label={section.label} />
                {effectiveTopics.map((topic, i) => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    isLast={i === effectiveTopics.length - 1}
                    nextStatus={effectiveTopics[i + 1]?.status}
                    isPreview={isPreview}
                    onExplain={(t) => navigate(`/ai-tutor/explain?topic=${t.explainQuery ?? t.id}`)}
                    onPractice={(t) => navigate(`/ai-tutor/solve?topic=${t.explainQuery ?? t.id}`)}
                    onLockedTap={() => navigate(`/crash-course-enrolled?sku=${skuParam}`)}
                  />
                ))}
              </div>
              );
            });
            })()}
          </div>
        ))}
      </div>

      {isPreview && isViewingLockedChapter && (
        <FreemiumUnlockBanner
          onViewDetails={() => navigate(`/crash-course-detail?sku=${skuParam}&demo=ai-tutor`)}
          onEnroll={() => navigate(`/crash-course-enrolled?sku=${skuParam}`)}
        />
      )}

      <BottomSheet isOpen={showJumpSheet} onClose={() => setShowJumpSheet(false)} title="Jump to Lesson">
        <div className="flex flex-col" style={{ padding: "8px 16px 20px", gap: 6 }}>
          {allChapters.map((c, ci) => (
            <button
              key={c.title}
              onClick={() => scrollToChapter(ci)}
              className="flex items-center gap-3 w-full text-left"
              style={{ padding: "10px 8px", borderRadius: 10, background: ci === currentChapter ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "transparent", border: "none", cursor: "pointer" }}
            >
              <SquareBadge n={ci + 1} active={ci === currentChapter} />
              <span className="flex-1 min-w-0 truncate" style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)" }}>{c.title}</span>
              <span style={typo.metaStyle}>{ci === 0 ? "0%" : "Locked"}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <FloatingAITutor topicContext={`${currentChapterData.title} — Class 10 Mathematics`} />
    </div>
  );
}
