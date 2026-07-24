/**
 * My Test Series — Mock Review
 * Route: /my-test-series/:packId/mock/:mockId/review
 *
 * Read-only walkthrough of every question in a completed mock. Shows the user's
 * answer side-by-side with the correct answer + explanation. Filter chips:
 *   All · Wrong · Skipped · Correct
 *
 * Data source: location.state.answers (set when navigating from result screen
 * after a fresh submit). For historical mocks where we don't have answers
 * persisted, falls back to "Solutions only" mode — questions + correct answers
 * + explanations, no per-answer comparison.
 */

import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, Check, X as XIcon, Minus, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { useIsMobile } from "../app/components/ui/use-mobile";
import {
  getPackById,
  getAttemptById,
  STUB_QUESTIONS,
  STUB_SECTIONS,
  type MockAnswer,
  type MockQuestion,
} from "../shared/test-series-progress";

type FilterId = "all" | "wrong" | "skipped" | "correct";

type Verdict = "correct" | "wrong" | "skipped";

function verdictOf(q: MockQuestion, a: MockAnswer | undefined): Verdict {
  if (!a) return "skipped";
  if (q.type === "mcq") {
    if (typeof a.selectedOptionIndex !== "number") return "skipped";
    return a.selectedOptionIndex === q.correctOptionIndex ? "correct" : "wrong";
  }
  if (typeof a.numericalAnswer !== "number") return "skipped";
  return a.numericalAnswer === q.correctNumericalAnswer ? "correct" : "wrong";
}

function FilterChip({
  label,
  count,
  active,
  accent,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  accent: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      style={{
        flexShrink: 0,
        height: 32,
        paddingLeft: 12, paddingRight: 12,
        borderRadius: 9999,
        border: active
          ? `1px solid color-mix(in srgb, ${accent} 53%, transparent)`
          : "0.5px solid var(--border)",
        backgroundColor: active
          ? `color-mix(in srgb, ${accent} 18%, var(--card))`
          : "var(--card)",
        boxShadow: active ? `inset 0 0.5px 0 rgba(255,255,255,0.08), 0 2px 6px color-mix(in srgb, ${accent} 15%, transparent)` : "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "var(--text-xs)",
        fontWeight: active ? 700 : 600,
        color: active ? accent : "var(--muted-foreground)",
        display: "flex", alignItems: "center", gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      <span>{label}</span>
      <span style={{
        minWidth: 18, paddingLeft: 5, paddingRight: 5, height: 16,
        borderRadius: 9999,
        backgroundColor: active ? `color-mix(in srgb, ${accent} 30%, var(--card))` : "var(--border-secondary)",
        fontSize: "var(--text-2xs)",
        fontWeight: 700,
        color: active ? accent : "var(--muted-foreground)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{count}</span>
    </motion.button>
  );
}

function VerdictBadge({ verdict }: { verdict: Verdict | "study" }) {
  const config = {
    correct: { Icon: Check, color: "var(--success-500)", bg: "color-mix(in srgb, var(--success-500) 16%, transparent)", label: "Correct" },
    wrong:   { Icon: XIcon, color: "var(--error-500)",   bg: "color-mix(in srgb, var(--error-500) 16%, transparent)",   label: "Wrong" },
    skipped: { Icon: Minus, color: "var(--muted-foreground)", bg: "var(--border-secondary)",                             label: "Skipped" },
    study:   { Icon: BookOpen, color: "var(--primary-300)", bg: "color-mix(in srgb, var(--primary-400) 16%, transparent)", label: "Solution" },
  } as const;
  const c = config[verdict];
  return (
    <div className="flex items-center" style={{
      gap: 5,
      paddingLeft: 8, paddingRight: 10, height: 22,
      borderRadius: 9999,
      backgroundColor: c.bg,
    }}>
      <c.Icon size={11} style={{ color: c.color, strokeWidth: 2.5 }} />
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: c.color, letterSpacing: 0.3 }}>
        {c.label}
      </span>
    </div>
  );
}

function OptionRow({
  label,
  text,
  isCorrect,
  isUserPick,
  studyMode,
}: {
  label: string;
  text: string;
  isCorrect: boolean;
  isUserPick: boolean;
  studyMode: boolean;
}) {
  // Visual treatment:
  //   correct        → green outline + green check
  //   user wrong     → red outline + red X
  //   neither        → plain
  //   study mode     → only correct gets accent
  let borderColor = "var(--border)";
  let bg = "var(--card)";
  let labelColor = "var(--foreground)";
  let trailing: React.ReactNode = null;

  if (isCorrect) {
    borderColor = "color-mix(in srgb, var(--success-500) 60%, transparent)";
    bg = "color-mix(in srgb, var(--success-500) 10%, var(--card))";
    labelColor = "var(--success-500)";
    trailing = <Check size={14} style={{ color: "var(--success-500)", strokeWidth: 2.5 }} />;
  } else if (isUserPick && !studyMode) {
    borderColor = "color-mix(in srgb, var(--error-500) 60%, transparent)";
    bg = "color-mix(in srgb, var(--error-500) 10%, var(--card))";
    labelColor = "var(--error-500)";
    trailing = <XIcon size={14} style={{ color: "var(--error-500)", strokeWidth: 2.5 }} />;
  }

  return (
    <div className="flex items-start" style={{
      gap: 10,
      padding: 12,
      borderRadius: 10,
      backgroundColor: bg,
      border: `0.5px solid ${borderColor}`,
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 9999, flexShrink: 0,
        backgroundColor: "var(--border-secondary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "var(--text-2xs)", fontWeight: 800,
        color: labelColor,
      }}>{label}</span>
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: "var(--text-sm)", lineHeight: 1.5,
        color: "var(--foreground)",
      }}>{text}</span>
      {trailing && <div style={{ flexShrink: 0, marginTop: 4 }}>{trailing}</div>}
    </div>
  );
}

function QuestionCard({
  q,
  index,
  total,
  userAnswer,
  studyMode,
  accent,
  sectionLabel,
}: {
  q: MockQuestion;
  index: number;
  total: number;
  userAnswer: MockAnswer | undefined;
  studyMode: boolean;
  accent: string;
  sectionLabel: string;
}) {
  const verdict: Verdict | "study" = studyMode ? "study" : verdictOf(q, userAnswer);
  const earned = (() => {
    if (studyMode) return null;
    if (verdict === "correct") return `+${q.marks}`;
    if (verdict === "wrong") return `−${q.negativeMarks}`;
    return "0";
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        backgroundColor: "var(--card)",
        borderRadius: 14,
        border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <span style={{
            paddingLeft: 8, paddingRight: 8, height: 22,
            borderRadius: 6,
            backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
            border: `0.5px solid color-mix(in srgb, ${accent} 33%, transparent)`,
            display: "flex", alignItems: "center",
            fontSize: "var(--text-2xs)", fontWeight: 800,
            color: accent, letterSpacing: 0.4,
          }}>
            Q{index + 1}/{total}
          </span>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
            {sectionLabel}
          </span>
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          {earned !== null && (
            <span style={{
              fontSize: "var(--text-xs)", fontWeight: 800,
              color: verdict === "correct" ? "var(--success-500)" : verdict === "wrong" ? "var(--error-500)" : "var(--muted-foreground)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {earned}
            </span>
          )}
          <VerdictBadge verdict={verdict} />
        </div>
      </div>

      {/* Stem */}
      <p style={{
        fontSize: "var(--text-sm)", lineHeight: 1.55,
        color: "var(--foreground)",
        margin: 0, marginBottom: 14,
        whiteSpace: "pre-wrap",
      }}>{q.stem}</p>

      {/* MCQ options */}
      {q.type === "mcq" && q.options && (
        <div className="flex flex-col" style={{ gap: 8 }}>
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correctOptionIndex;
            const isUserPick = !studyMode && userAnswer?.selectedOptionIndex === i;
            const label = String.fromCharCode(65 + i);
            return (
              <OptionRow
                key={i}
                label={label}
                text={opt}
                isCorrect={isCorrect}
                isUserPick={isUserPick}
                studyMode={studyMode}
              />
            );
          })}
        </div>
      )}

      {/* Numerical */}
      {q.type === "numerical" && (
        <div className="flex flex-col" style={{ gap: 8 }}>
          {!studyMode && (
            <div className="flex items-center justify-between" style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: verdict === "correct"
                ? "color-mix(in srgb, var(--success-500) 10%, var(--card))"
                : verdict === "wrong"
                ? "color-mix(in srgb, var(--error-500) 10%, var(--card))"
                : "var(--card)",
              border: `0.5px solid ${
                verdict === "correct"
                  ? "color-mix(in srgb, var(--success-500) 60%, transparent)"
                  : verdict === "wrong"
                  ? "color-mix(in srgb, var(--error-500) 60%, transparent)"
                  : "var(--border)"
              }`,
            }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
                Your answer
              </span>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
                {userAnswer?.numericalAnswer ?? "—"}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between" style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: "color-mix(in srgb, var(--success-500) 10%, var(--card))",
            border: "0.5px solid color-mix(in srgb, var(--success-500) 60%, transparent)",
          }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--success-500)", fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>
              Correct answer
            </span>
            <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--success-500)", fontVariantNumeric: "tabular-nums" }}>
              {q.correctNumericalAnswer}
            </span>
          </div>
        </div>
      )}

      {/* Explanation */}
      {q.explanation && (
        <div style={{
          marginTop: 14, paddingTop: 14,
          borderTop: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
        }}>
          <div className="flex items-center" style={{ gap: 6, marginBottom: 6 }}>
            <BookOpen size={12} style={{ color: accent, strokeWidth: 2 }} />
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: accent, letterSpacing: 0.6, textTransform: "uppercase" }}>
              Explanation
            </span>
          </div>
          <p style={{
            fontSize: "var(--text-sm)", lineHeight: 1.55,
            color: "var(--foreground)", margin: 0,
            opacity: 0.92,
          }}>{q.explanation}</p>
        </div>
      )}
    </motion.div>
  );
}

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ packId: string; mockId: string }>();
  const pack = params.packId ? getPackById(params.packId) : undefined;
  const state = location.state as { answers?: Record<string, MockAnswer>; mockNumber?: number } | null;
  const userAnswers = state?.answers;
  const studyMode = !userAnswers;
  const mockNumber = state?.mockNumber ?? (params.mockId && pack ? getAttemptById(pack, params.mockId)?.number : undefined);
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;

  const [filter, setFilter] = useState<FilterId>("all");

  const questions = STUB_QUESTIONS;
  const accent = pack?.examAccent ?? "var(--primary-400)";
  // Universal section-label remap — NEET → Botany, CAT → VARC/DILR/QA, etc.
  const displaySectionLabel = (internal: string) => {
    if (!pack) return internal;
    const idx = STUB_SECTIONS.indexOf(internal as typeof STUB_SECTIONS[number]);
    return pack.sections[idx] ?? internal;
  };

  // Categorize questions by verdict
  const buckets = useMemo(() => {
    const correct: MockQuestion[] = [];
    const wrong: MockQuestion[] = [];
    const skipped: MockQuestion[] = [];
    if (!userAnswers) return { correct, wrong, skipped };
    for (const q of questions) {
      const v = verdictOf(q, userAnswers[q.id]);
      if (v === "correct") correct.push(q);
      else if (v === "wrong") wrong.push(q);
      else skipped.push(q);
    }
    return { correct, wrong, skipped };
  }, [questions, userAnswers]);

  const visibleQuestions = useMemo(() => {
    if (studyMode) return questions;
    if (filter === "all") return questions;
    if (filter === "wrong") return buckets.wrong;
    if (filter === "skipped") return buckets.skipped;
    if (filter === "correct") return buckets.correct;
    return questions;
  }, [filter, questions, buckets, studyMode]);

  if (!pack) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", backgroundColor: "var(--background)", padding: 24, gap: 12 }}>
        <span style={{ fontSize: "var(--text-base)", color: "var(--foreground)", fontWeight: 600 }}>Pack not found</span>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "var(--primary-300)", cursor: "pointer" }}>Back</button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        height: "100dvh",
        overflow: "hidden",
        maxWidth: isDesktop ? 960 : undefined,
        marginLeft: isDesktop ? "auto" : undefined,
        marginRight: isDesktop ? "auto" : undefined,
        width: "100%",
        borderLeft: isDesktop ? "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)" : undefined,
        borderRight: isDesktop ? "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)" : undefined,
      }}
    >
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ minHeight: 56, paddingLeft: 4, paddingRight: 16, paddingTop: 8, paddingBottom: 8, gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 44, height: 44, borderRadius: 9999,
              backgroundColor: "transparent", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} style={{ color: "var(--foreground)" }} />
          </motion.button>
          <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--foreground)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              lineHeight: 1.25,
            }}>
              {studyMode ? "Solutions" : `Review · Mock ${mockNumber ?? "?"}`}
            </span>
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-xs)",
              color: "var(--muted-foreground)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}>
              {pack.title}
            </span>
          </div>
        </div>
      </GlassHeader>

      <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingBottom: 32 }}>
        {/* Filter chips — only when we have full answer data */}
        {!studyMode && (
          <div
            className="flex"
            style={{
              gap: 8,
              padding: "16px 16px 12px",
              overflowX: "auto",
              scrollbarWidth: "none",
              maskImage: "linear-gradient(to right, black 0%, black 94%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, black 0%, black 94%, transparent 100%)",
            }}
          >
            <FilterChip
              label="All"
              count={questions.length}
              active={filter === "all"}
              accent={accent}
              onClick={() => setFilter("all")}
            />
            <FilterChip
              label="Wrong"
              count={buckets.wrong.length}
              active={filter === "wrong"}
              accent="var(--error-500)"
              onClick={() => setFilter("wrong")}
            />
            <FilterChip
              label="Skipped"
              count={buckets.skipped.length}
              active={filter === "skipped"}
              accent="var(--muted-foreground)"
              onClick={() => setFilter("skipped")}
            />
            <FilterChip
              label="Correct"
              count={buckets.correct.length}
              active={filter === "correct"}
              accent="var(--success-500)"
              onClick={() => setFilter("correct")}
            />
          </div>
        )}

        {studyMode && (
          <div
            className="flex items-start"
            style={{
              margin: "16px 16px 12px",
              padding: 12,
              borderRadius: 12,
              backgroundColor: "color-mix(in srgb, var(--primary-400) 8%, var(--card))",
              border: "0.5px solid color-mix(in srgb, var(--primary-400) 30%, transparent)",
              gap: 10,
            }}
          >
            <BookOpen size={14} style={{ color: "var(--primary-300)", flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--foreground)", lineHeight: 1.5 }}>
              Solutions view — your original answers aren't available for this attempt. Showing correct answers and explanations for study.
            </span>
          </div>
        )}

        {/* Question cards */}
        <div style={{ padding: "0 16px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {visibleQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center" style={{ padding: "48px 32px", gap: 8, textAlign: "center" }}>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
                    {filter === "wrong" ? "No wrong answers — well done." : filter === "skipped" ? "No skipped questions." : "No questions in this view."}
                  </span>
                </div>
              ) : (
                visibleQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    index={questions.findIndex((qq) => qq.id === q.id)}
                    total={questions.length}
                    userAnswer={userAnswers?.[q.id]}
                    studyMode={studyMode}
                    accent={accent}
                    sectionLabel={displaySectionLabel(q.section)}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
