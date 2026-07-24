/**
 * My Test Series — Mock Take (per-exam-type exam shell)
 * Route: /my-test-series/:packId/mock/:mockId/take
 *
 * Phase 1: NTA shell (JEE / NEET / GATE) — overall timer + non-locking sections.
 * Phase 2: CAT shell — per-section 40-min timer + sectional locks (can't return
 *          to a section once advanced or its time expires) + on-screen calculator.
 *
 * Branch lives at the Component level via pack.examType. NTA-specific behavior is
 * the default; CAT-specific features kick in when `isCAT` is true.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  Clock,
  X,
  ChevronLeft,
  Bookmark,
  Grid3x3,
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Lock,
  Delete,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar, typo } from "../shared/premium-ui";
import { useIsMobile } from "../app/components/ui/use-mobile";
import {
  getPackById,
  getAttemptById,
  getMarkingScheme,
  STUB_QUESTIONS,
  STUB_SECTIONS,
  gradeMock,
  type MockAnswer,
  type MockQuestion,
  type StubSection,
} from "../shared/test-series-progress";
import { olympiadIdFromPackId } from "../shared/olympiads";

type AnswerMap = Record<string, MockAnswer>;
type QStatus = "current" | "answered-marked" | "answered" | "marked" | "not-answered" | "not-visited";

// NTA's 5-state palette + current highlight. "Not Visited" is gray, "Not
// Answered" (visited but no input) is red — these are visually distinct in the
// real portal so students know which questions they've already glanced at.
function questionStatus(answers: AnswerMap, visited: Set<string>, qId: string, currentId: string): QStatus {
  if (qId === currentId) return "current";
  const a = answers[qId];
  const answered = !!a && (typeof a.selectedOptionIndex === "number" || typeof a.numericalAnswer === "number");
  const marked = !!a?.markedForReview;
  if (answered && marked) return "answered-marked";
  if (answered) return "answered";
  if (marked) return "marked";
  if (visited.has(qId)) return "not-answered";
  return "not-visited";
}

function statusColor(status: QStatus): { bg: string; color: string; ring?: string } {
  switch (status) {
    case "current":         return { bg: "var(--card)", color: "var(--primary)", ring: "var(--primary)" };
    case "answered":        return { bg: "var(--success-500)", color: "#fff" };
    case "marked":          return { bg: "var(--mark-review-500)", color: "var(--white)" };
    case "answered-marked": return { bg: "var(--mark-review-500)", color: "var(--white)" };
    case "not-answered":    return { bg: "var(--error-500)", color: "#fff" };
    case "not-visited":     return { bg: "color-mix(in srgb, var(--foreground) 8%, transparent)", color: "var(--muted-foreground)" };
  }
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Palette square (with the "answered & marked" green-dot corner accent) ───
// ─── Action-bar secondary button (NTA-style tonal chip) ─────────────────────
// Shared by Save & Mark / Mark / Clear in the action bar — same height,
// same radius, same font; only the accent token + label diverge.
function NtaSecondaryButton({
  label,
  accentToken,
  onClick,
  disabled,
  flex,
}: {
  label: string;
  /** CSS var name for the accent. Pass undefined for a neutral outline button (e.g. Clear). */
  accentToken?: string;
  onClick: () => void;
  disabled?: boolean;
  /** When true, the button flex-grows (used in the desktop single-row action bar). */
  flex?: boolean;
}) {
  const isNeutral = !accentToken;
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center"
      style={{
        height: flex ? 44 : 36, borderRadius: flex ? 12 : 8, gap: 4,
        flex: flex ? "1 1 0" : undefined,
        // AntD secondary in dark mode: solid 1px border + tinted bg + accent text.
        // Mirrors AntD's `<Tag color="blue">` styling for the accent variant.
        border: isNeutral
          ? "1px solid color-mix(in srgb, var(--border) 70%, transparent)"
          : `1px solid color-mix(in srgb, ${accentToken} 36%, transparent)`,
        // Use alpha-compositing on transparent (not mix-with-background) so the
        // tint stays visibly accent-colored in both themes. Mixing with
        // var(--background) washed to near-white in light mode.
        backgroundColor: isNeutral
          ? "transparent"
          : `color-mix(in srgb, ${accentToken} 12%, transparent)`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        padding: "0 8px",
      }}
    >
      <span style={{
        fontSize: "var(--text-sm)", fontWeight: 600,
        color: isNeutral ? "var(--foreground)" : accentToken,
        whiteSpace: "nowrap", letterSpacing: 0,
      }}>
        {label}
      </span>
    </motion.button>
  );
}

function PaletteSquare({ number, status, onClick }: { number: number; status: QStatus; onClick: () => void }) {
  const c = statusColor(status);
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex items-center justify-center"
      style={{
        position: "relative",
        width: 36, height: 36, borderRadius: 8,
        backgroundColor: c.bg,
        border: c.ring ? `2px solid ${c.ring}` : "none",
        cursor: "pointer",
        fontFamily: "var(--font-family-inter)",
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        color: c.color,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {number}
      {status === "answered-marked" && (
        <span aria-hidden style={{
          position: "absolute", top: -2, right: -2,
          width: 10, height: 10, borderRadius: 9999,
          backgroundColor: "var(--success-500)",
          border: "1px solid var(--background)",
        }} />
      )}
    </motion.button>
  );
}

// ─── Palette Sheet ────────────────────────────────────────────────────────────
function PaletteSheet({
  onClose,
  onSubmit,
  questionsBySection,
  currentId,
  answers,
  visited,
  onJump,
  counts,
  lockedSections,
  sectionLabel,
}: {
  onClose: () => void;
  onSubmit: () => void;
  questionsBySection: Record<string, MockQuestion[]>;
  currentId: string;
  answers: AnswerMap;
  visited: Set<string>;
  onJump: (qId: string) => void;
  counts: { answered: number; notAnswered: number; marked: number; markedAnswered: number; notVisited: number };
  lockedSections: Set<string>;
  sectionLabel: (internal: string) => string;
}) {
  const legendItems: { label: string; status: QStatus; count: number }[] = [
    { label: "Answered",          status: "answered",        count: counts.answered },
    { label: "Not Answered",      status: "not-answered",    count: counts.notAnswered },
    { label: "Marked",            status: "marked",          count: counts.marked },
    { label: "Marked & Answered", status: "answered-marked", count: counts.markedAnswered },
    { label: "Not Visited",       status: "not-visited",     count: counts.notVisited },
  ];

  // Per-section answered count
  function sectionStats(qs: MockQuestion[]) {
    let answered = 0;
    let marked = 0;
    for (const q of qs) {
      const a = answers[q.id];
      const isAns = !!a && (typeof a.selectedOptionIndex === "number" || typeof a.numericalAnswer === "number");
      if (isAns) answered++;
      if (a?.markedForReview) marked++;
    }
    return { answered, marked };
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Question palette"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", zIndex: 60, display: "flex", flexDirection: "column" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          marginTop: "auto",
          backgroundColor: "var(--background)",
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          maxHeight: "85vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center" style={{ paddingTop: 8, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)" }} />
        </div>

        <div className="flex items-center justify-between" style={{ padding: "8px 20px 12px" }}>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--foreground)" }}>
            Question Palette
          </span>
          <button
            onClick={onClose}
            aria-label="Close palette"
            style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={16} style={{ color: "var(--foreground)" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: "0 20px 12px" }}>
          {/* Legend with counts */}
          <div
            className="flex flex-col"
            style={{ gap: 8, padding: 12, borderRadius: 12, backgroundColor: "var(--card)", marginBottom: 16 }}
          >
            {legendItems.map((l) => {
              const c = statusColor(l.status);
              return (
                <div key={l.label} className="flex items-center justify-between" style={{ gap: 8 }}>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <div style={{
                      position: "relative",
                      width: 16, height: 16, borderRadius: 4,
                      backgroundColor: c.bg,
                      border: c.ring ? `1px solid ${c.ring}` : "none",
                    }}>
                      {l.status === "answered-marked" && (
                        <span aria-hidden style={{
                          position: "absolute", top: -2, right: -2,
                          width: 6, height: 6, borderRadius: 9999,
                          backgroundColor: "var(--success-500)",
                          border: "1px solid var(--background)",
                        }} />
                      )}
                    </div>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--foreground)" }}>{l.label}</span>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                    {l.count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Section blocks */}
          {STUB_SECTIONS.map((section) => {
            const qs = questionsBySection[section] || [];
            const stats = sectionStats(qs);
            const locked = lockedSections.has(section);
            return (
              <div key={section} style={{ marginBottom: 16, opacity: locked ? 0.5 : 1 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <div className="flex items-center" style={{ gap: 4 }}>
                    {locked && <Lock size={11} style={{ color: "var(--muted-foreground)" }} />}
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
                      {sectionLabel(section)}
                    </span>
                  </div>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                    {locked ? "Locked · " : ""}{stats.answered}/{qs.length} answered{stats.marked ? ` · ${stats.marked} marked` : ""}
                  </span>
                </div>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {qs.map((q, idx) => (
                    <PaletteSquare
                      key={q.id}
                      number={idx + 1}
                      status={questionStatus(answers, visited, q.id, currentId)}
                      onClick={() => { if (!locked) onJump(q.id); }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit footer */}
        <div style={{ padding: "12px 20px", paddingBottom: "max(16px, env(safe-area-inset-bottom))", backgroundColor: "var(--background)" }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onSubmit}
            className="flex items-center justify-center w-full"
            style={{
              height: 44, borderRadius: 12, border: "none", gap: 8,
              backgroundColor: "var(--primary)", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
              Submit Mock Test
            </span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── PalettePanel — persistent right sidebar (desktop only) ──────────────────
function PalettePanel({
  questionsBySection,
  currentId,
  answers,
  visited,
  onJump,
  counts,
  lockedSections,
  sectionLabel,
  onSubmit,
}: {
  questionsBySection: Record<string, MockQuestion[]>;
  currentId: string;
  answers: AnswerMap;
  visited: Set<string>;
  onJump: (qId: string) => void;
  counts: { answered: number; notAnswered: number; marked: number; markedAnswered: number; notVisited: number };
  lockedSections: Set<string>;
  sectionLabel: (internal: string) => string;
  onSubmit: () => void;
}) {
  const legendItems: { label: string; status: QStatus; count: number }[] = [
    { label: "Answered",          status: "answered",        count: counts.answered },
    { label: "Not Answered",      status: "not-answered",    count: counts.notAnswered },
    { label: "Marked",            status: "marked",          count: counts.marked },
    { label: "Marked & Answered", status: "answered-marked", count: counts.markedAnswered },
    { label: "Not Visited",       status: "not-visited",     count: counts.notVisited },
  ];

  function sectionStats(qs: MockQuestion[]) {
    let answered = 0;
    let marked = 0;
    for (const q of qs) {
      const a = answers[q.id];
      const isAns = !!a && (typeof a.selectedOptionIndex === "number" || typeof a.numericalAnswer === "number");
      if (isAns) answered++;
      if (a?.markedForReview) marked++;
    }
    return { answered, marked };
  }

  return (
    <aside
      className="flex flex-col"
      style={{
        width: 340,
        flexShrink: 0,
        backgroundColor: "var(--card)",
        border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
        borderRadius: 12,
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center"
        style={{
          padding: "14px 20px",
          borderBottom: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
          gap: 8,
        }}
      >
        <Grid3x3 size={14} style={{ color: "var(--muted-foreground)" }} />
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: 0.8, textTransform: "uppercase" }}>
          Question Palette
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px" }}>
        {/* Legend */}
        <div
          className="flex flex-col"
          style={{
            gap: 8,
            padding: 12,
            borderRadius: 8,
            backgroundColor: "var(--card)",
            border: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
            marginBottom: 18,
          }}
        >
          {legendItems.map((l) => {
            const c = statusColor(l.status);
            return (
              <div key={l.label} className="flex items-center justify-between" style={{ gap: 8 }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <div style={{
                    position: "relative",
                    width: 16, height: 16, borderRadius: 4,
                    backgroundColor: c.bg,
                    border: c.ring ? `1px solid ${c.ring}` : "none",
                  }}>
                    {l.status === "answered-marked" && (
                      <span aria-hidden style={{
                        position: "absolute", top: -2, right: -2,
                        width: 6, height: 6, borderRadius: 9999,
                        backgroundColor: "var(--success-500)",
                        border: "1px solid var(--background)",
                      }} />
                    )}
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--foreground)" }}>{l.label}</span>
                </div>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                  {l.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Section blocks */}
        {STUB_SECTIONS.map((section) => {
          const qs = questionsBySection[section] || [];
          const stats = sectionStats(qs);
          const locked = lockedSections.has(section);
          return (
            <div key={section} style={{ marginBottom: 18, opacity: locked ? 0.5 : 1 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                <div className="flex items-center" style={{ gap: 4 }}>
                  {locked && <Lock size={11} style={{ color: "var(--muted-foreground)" }} />}
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
                    {sectionLabel(section)}
                  </span>
                </div>
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                  {locked ? "Locked · " : ""}{stats.answered}/{qs.length}
                </span>
              </div>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {qs.map((q, idx) => (
                  <PaletteSquare
                    key={q.id}
                    number={idx + 1}
                    status={questionStatus(answers, visited, q.id, currentId)}
                    onClick={() => { if (!locked) onJump(q.id); }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit footer */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
        }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit}
          className="flex items-center justify-center w-full"
          style={{
            height: 44, borderRadius: 12, gap: 8,
            backgroundColor: "transparent",
            border: "0.5px solid color-mix(in srgb, var(--error-500) 45%, transparent)",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--error-500)", letterSpacing: 0 }}>
            Submit Test
          </span>
        </motion.button>
      </div>
    </aside>
  );
}

// ─── Submit Confirmation Modal ───────────────────────────────────────────────
function SubmitModal({
  onCancel,
  onConfirm,
  counts,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  counts: { answered: number; notAnswered: number; marked: number; markedAnswered: number; notVisited: number };
}) {
  const pending = counts.notAnswered + counts.notVisited + counts.marked;
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Submit confirmation"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 70,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--card)",
          border: "0.5px solid color-mix(in srgb, var(--border) 70%, transparent)",
          borderRadius: 16,
          padding: 20,
          maxWidth: 360,
          width: "100%",
          boxShadow: "0 24px 56px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
          <AlertTriangle size={18} style={{ color: "var(--warning-500)" }} />
          <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--foreground)" }}>
            Submit Mock?
          </span>
        </div>
        <span style={{ ...typo.cardBodyStyle, display: "block", marginBottom: 16, lineHeight: 1.5 }}>
          You won't be able to change your responses after submission.
        </span>

        <div className="flex flex-col" style={{
          gap: 8,
          marginBottom: 20,
          padding: 12,
          borderRadius: 8,
          backgroundColor: "color-mix(in srgb, var(--foreground) 5%, transparent)",
          border: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
        }}>
          <Stat label="Answered"            value={counts.answered}         accent="var(--success-500)" />
          <Stat label="Marked & Answered"   value={counts.markedAnswered}   accent="var(--mark-review-300)" />
          <Stat label="Marked for review"   value={counts.marked}           accent="var(--mark-review-300)" />
          <Stat label="Not answered"        value={counts.notAnswered}      accent="var(--error-500)" />
          <Stat label="Not visited"         value={counts.notVisited}       accent="var(--muted-foreground)" />
        </div>

        {pending > 0 && (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--warning-500)", display: "block", marginBottom: 12, lineHeight: 1.45 }}>
            {pending} question{pending > 1 ? "s" : ""} still pending. Once submitted, you can't return.
          </span>
        )}

        <div className="flex" style={{ gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            style={{
              flex: 1, height: 44, borderRadius: 12,
              backgroundColor: "transparent",
              border: "0.5px solid var(--border)",
              cursor: "pointer",
              fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)",
            }}
          >
            Keep Going
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            style={{
              flex: 1, height: 44, borderRadius: 12, border: "none",
              backgroundColor: "var(--primary)",
              cursor: "pointer",
              fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)",
            }}
          >
            Submit Final
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ ...typo.metaStyle, color: "var(--muted-foreground)" }}>{label}</span>
      <span style={{
        fontSize: "var(--text-sm)",
        fontWeight: 600,
        color: accent ?? "var(--foreground)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── CAT Calculator (basic 4-function, mirrors the IIM on-screen calculator) ──
function CalculatorOverlay({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [previous, setPrevious] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  function inputDigit(d: string) {
    if (waitingForOperand) {
      setDisplay(d);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? d : display + d);
    }
  }
  function inputDot() {
    if (waitingForOperand) { setDisplay("0."); setWaitingForOperand(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  }
  function clear() {
    setDisplay("0"); setPrevious(null); setOp(null); setWaitingForOperand(false);
  }
  function backspace() {
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
  }
  function toggleSign() {
    setDisplay(display.startsWith("-") ? display.slice(1) : display === "0" ? display : "-" + display);
  }
  function percent() {
    const v = parseFloat(display);
    setDisplay(String(v / 100));
  }
  function sqrt() {
    const v = parseFloat(display);
    if (v < 0) { setDisplay("Err"); return; }
    setDisplay(String(Math.sqrt(v)));
  }
  function compute(prev: number, curr: number, operator: string): number {
    switch (operator) {
      case "+": return prev + curr;
      case "−": return prev - curr;
      case "×": return prev * curr;
      case "÷": return curr === 0 ? NaN : prev / curr;
      default:  return curr;
    }
  }
  function applyOp(nextOp: string) {
    const curr = parseFloat(display);
    if (previous === null) {
      setPrevious(curr);
    } else if (op) {
      const result = compute(previous, curr, op);
      setDisplay(Number.isFinite(result) ? String(+result.toFixed(8)) : "Err");
      setPrevious(Number.isFinite(result) ? result : null);
    }
    setOp(nextOp);
    setWaitingForOperand(true);
  }
  function equals() {
    if (op === null || previous === null) return;
    const curr = parseFloat(display);
    const result = compute(previous, curr, op);
    setDisplay(Number.isFinite(result) ? String(+result.toFixed(8)) : "Err");
    setPrevious(null); setOp(null); setWaitingForOperand(true);
  }

  const btn = (label: string, onClick: () => void, variant: "num" | "op" | "fn" | "eq" = "num") => {
    const styles: Record<string, React.CSSProperties> = {
      num: { backgroundColor: "var(--card)", color: "var(--foreground)" },
      op:  { backgroundColor: "color-mix(in srgb, var(--primary) 22%, transparent)", color: "var(--primary)" },
      fn:  { backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)", color: "var(--muted-foreground)" },
      eq:  { backgroundColor: "var(--primary)", color: "var(--foreground)" },
    };
    return (
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={onClick}
        style={{
          height: 44, borderRadius: 8, border: "none", cursor: "pointer",
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-base)",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          ...styles[variant],
        }}
      >
        {label}
      </motion.button>
    );
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Calculator"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 8, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 320,
          backgroundColor: "var(--background)",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <Calculator size={14} style={{ color: "var(--muted-foreground)" }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
              On-screen Calculator
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close calculator"
            style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={16} style={{ color: "var(--foreground)" }} />
          </button>
        </div>

        {/* Display */}
        <div
          style={{
            padding: "16px 14px",
            borderRadius: 8,
            backgroundColor: "var(--card)",
            marginBottom: 12,
            textAlign: "right",
            fontFamily: "var(--font-family-inter)",
            fontSize: 30,
            fontWeight: 700,
            color: "var(--foreground)",
            fontVariantNumeric: "tabular-nums",
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {op && <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", marginRight: 8, fontWeight: 600 }}>{op}</span>}
          {display}
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {btn("C", clear, "fn")}
          {btn("±", toggleSign, "fn")}
          {btn("%", percent, "fn")}
          {btn("÷", () => applyOp("÷"), "op")}

          {btn("7", () => inputDigit("7"))}
          {btn("8", () => inputDigit("8"))}
          {btn("9", () => inputDigit("9"))}
          {btn("×", () => applyOp("×"), "op")}

          {btn("4", () => inputDigit("4"))}
          {btn("5", () => inputDigit("5"))}
          {btn("6", () => inputDigit("6"))}
          {btn("−", () => applyOp("−"), "op")}

          {btn("1", () => inputDigit("1"))}
          {btn("2", () => inputDigit("2"))}
          {btn("3", () => inputDigit("3"))}
          {btn("+", () => applyOp("+"), "op")}

          {btn("√", sqrt, "fn")}
          {btn("0", () => inputDigit("0"))}
          {btn(".", inputDot)}
          {btn("=", equals, "eq")}
        </div>

        {/* Backspace row */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={backspace}
          className="flex items-center justify-center"
          style={{
            marginTop: 8, width: "100%", height: 36, borderRadius: 8,
            backgroundColor: "color-mix(in srgb, var(--foreground) 6%, transparent)",
            border: "none", cursor: "pointer", gap: 6,
          }}
        >
          <Delete size={14} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontWeight: 600 }}>Backspace</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── CAT Section Lock Confirmation ────────────────────────────────────────────
function SectionLockModal({ sectionLabel, nextSectionLabel, onCancel, onConfirm }: {
  sectionLabel: string;
  nextSectionLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Section lock confirmation"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 75,
        backgroundColor: "var(--overlay-strong)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--card)",
          border: "0.5px solid var(--border)",
          borderRadius: 16,
          padding: 20,
          maxWidth: 360,
          width: "100%",
        }}
      >
        <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 24, height: 24, borderRadius: 4,
              backgroundColor: "color-mix(in srgb, var(--warning-500) 14%, transparent)",
              border: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
              flexShrink: 0,
            }}
          >
            <Lock size={12} style={{ color: "var(--warning-500)" }} />
          </div>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--foreground)", lineHeight: 1.25 }}>
            Submit {sectionLabel}?
          </span>
        </div>
        <span style={{ ...typo.cardBodyStyle, display: "block", marginBottom: 16, lineHeight: 1.5 }}>
          Moving to <b style={{ color: "var(--foreground)" }}>{nextSectionLabel}</b> will lock {sectionLabel}. You won't be able to return to this section.
        </span>

        <div className="flex" style={{ gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            style={{
              flex: 1, height: 44, borderRadius: 12,
              padding: "0 16px",
              border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
              backgroundColor: "var(--card-bg-secondary)", cursor: "pointer",
              fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)",
              lineHeight: 1, whiteSpace: "nowrap",
            }}
          >
            Stay in {sectionLabel}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            style={{
              flex: 1, height: 44, borderRadius: 12, border: "none",
              padding: "0 16px",
              backgroundColor: "var(--primary-500)", cursor: "pointer",
              fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)",
              lineHeight: 1, whiteSpace: "nowrap",
            }}
          >
            Lock & Continue
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Exit confirmation modal ─────────────────────────────────────────────────
// Lets the student leave the test mid-attempt and resume from the pack screen.
// Saves the current question index + remaining time as "in-progress" state.
function ExitModal({ currentQ, totalQ, onCancel, onConfirm }: {
  currentQ: number;
  totalQ: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Exit test confirmation"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 90,
        backgroundColor: "var(--overlay-strong)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          // Card surface so the modal is visible against the pure-black page bg
          backgroundColor: "var(--card)",
          border: "0.5px solid var(--border)",
          borderRadius: 16,
          padding: 20,
          maxWidth: 360,
          width: "100%",
        }}
      >
        <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--foreground)", display: "block", marginBottom: 8 }}>
          Exit this attempt?
        </span>
        <span style={{ ...typo.cardBodyStyle, display: "block", marginBottom: 16, lineHeight: 1.5 }}>
          Your progress at <b style={{ color: "var(--foreground)" }}>Q{currentQ} of {totalQ}</b> will be lost. You'll need to start this mock over from the beginning. This mirrors how the real exam handles exits.
        </span>
        <div className="flex" style={{ gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            style={{
              flex: 1, height: 44, borderRadius: 12,
              border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
              backgroundColor: "var(--card-bg-secondary)",
              cursor: "pointer",
              fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)",
            }}
          >
            Keep going
          </motion.button>
          {/* Destructive confirm — uses error-500 since this action loses work.
              Mirrors AntD `<Button danger />` semantics. */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            style={{
              flex: 1, height: 44, borderRadius: 12, border: "none",
              backgroundColor: "var(--error-500)", cursor: "pointer",
              fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)",
            }}
          >
            Exit anyway
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const params = useParams<{ packId: string; mockId: string }>();
  const [searchParams] = useSearchParams();
  const pack = params.packId ? getPackById(params.packId) : undefined;
  const mock = pack && params.mockId ? getAttemptById(pack, params.mockId) : undefined;
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;

  const allQuestions = useMemo(() => STUB_QUESTIONS, []);
  const questionsBySection = useMemo(() => {
    const map: Record<string, MockQuestion[]> = {};
    for (const q of allQuestions) {
      if (!map[q.section]) map[q.section] = [];
      map[q.section].push(q);
    }
    return map;
  }, [allQuestions]);
  // Fast lookups by id — avoids running .find / .findIndex on every render
  // across the 90-question array (called ~4× per render for current Q + index).
  const questionById = useMemo(() => {
    const map = new Map<string, MockQuestion>();
    const idx = new Map<string, number>();
    allQuestions.forEach((q, i) => { map.set(q.id, q); idx.set(q.id, i); });
    return { map, idx };
  }, [allQuestions]);

  // ─── Exam-type derived behavior ─────────────────────────────────────────────
  // For CAT, sections are time-locked: each section has its own timer, and once
  // you advance (or its timer expires), you can't return. The display labels for
  // CAT are taken from pack.sections (VARC/DILR/QA), but internal question
  // grouping still uses STUB_SECTIONS (Physics/Chemistry/Maths) — demo stub data.
  const isCAT = pack?.examType === "cat";
  // IBPS PO Prelims = sectional-time-limit shell (auto-advance + no manual lock).
  // Reuses the same per-section timer engine as CAT but disables the manual lock CTA path.
  const isIBPS = pack?.examType === "ibps";
  // Engines that need per-section timers + auto-advance. Reuses one code path.
  const isSectionalTimed = isCAT || isIBPS;
  // Single-section exams (UPSC GS, CSAT) — render without section tabs, palette
  // section headers, or section-switch logic. One continuous flow.
  const isSingleSection = (pack?.sections.length ?? 0) <= 1;
  const sectionTimeSec = (pack?.sectionTimeMinutes ?? 40) * 60;
  // Exam-aware marking display for the question metadata strip
  const marking = pack ? getMarkingScheme(pack.examType) : null;
  // Generic mapping for every exam type — internal STUB stays Physics/Chem/Maths,
  // but the displayed label always comes from pack.sections (NEET → Botany,
  // CAT → VARC/DILR/QA, etc.). Was CAT-only previously; now universal.
  const displaySectionLabel = (internal: string) => {
    if (!pack) return internal;
    const idx = STUB_SECTIONS.indexOf(internal as StubSection);
    return pack.sections[idx] ?? internal;
  };

  const [section, setSection] = useState<StubSection>(STUB_SECTIONS[0]);
  const [currentQId, setCurrentQId] = useState<string>(allQuestions[0].id);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [visited, setVisited] = useState<Set<string>>(() => new Set([allQuestions[0].id]));
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  // SSC TCS portal exposes per-question language toggle (English/हिंदी). Display-only
  // for the demo (no Hindi translations); shows the toggle for portal authenticity.
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [pendingSectionSwitch, setPendingSectionSwitch] = useState<string | null>(null);
  const [lockedSections, setLockedSections] = useState<Set<string>>(() => new Set());
  const [numericalInput, setNumericalInput] = useState("");

  // CAT: per-section seconds remaining. NTA: ignored (uses overall timer).
  const [sectionTime, setSectionTime] = useState<Record<string, number>>(() =>
    Object.fromEntries(STUB_SECTIONS.map((s) => [s, sectionTimeSec])),
  );
  const initialSeconds = (mock?.durationMinutes ?? 180) * 60;
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const startTimeRef = useRef<number>(Date.now());

  // Single overall timer (NTA/UPSC/SSC) vs per-section timer (CAT/IBPS).
  // CAT + IBPS share the engine; differences (manual-lock CTA, calculator) are
  // gated separately on `isCAT` only.
  useEffect(() => {
    const id = setInterval(() => {
      if (isSectionalTimed) {
        setSectionTime((prev) => ({ ...prev, [section]: Math.max(0, (prev[section] ?? sectionTimeSec) - 1) }));
      } else {
        setTimeRemaining((t) => Math.max(0, t - 1));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isSectionalTimed, section, sectionTimeSec]);

  // Overall timer expiry → auto-submit. Only fires when the exam HAS an overall
  // timer (NTA/UPSC/SSC). CAT/IBPS auto-submit via section-expiry effect below.
  const doSubmitRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!isSectionalTimed && timeRemaining === 0) doSubmitRef.current();
  }, [timeRemaining, isSectionalTimed]);

  useEffect(() => {
    if (!isSectionalTimed) return;
    if ((sectionTime[section] ?? 1) > 0) return;
    // current section just expired — lock it and advance, or submit if it was last
    setLockedSections((prev) => {
      const next = new Set(prev);
      next.add(section);
      return next;
    });
    const sIdx = STUB_SECTIONS.indexOf(section as StubSection);
    const nextSection = STUB_SECTIONS.slice(sIdx + 1).find((s) => !lockedSections.has(s));
    if (nextSection) {
      setSection(nextSection);
      setCurrentQId(questionsBySection[nextSection][0].id);
    } else {
      doSubmitRef.current();
    }
  }, [sectionTime, section, isSectionalTimed, lockedSections, questionsBySection]);

  // Mark each question visited as the student views it
  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(currentQId)) return prev;
      const next = new Set(prev);
      next.add(currentQId);
      return next;
    });
  }, [currentQId]);

  if (!pack || !mock) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", backgroundColor: "var(--background)", padding: 24, gap: 12 }}>
        <span style={{ fontSize: "var(--text-base)", color: "var(--foreground)", fontWeight: 600 }}>Mock not found</span>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "var(--primary-300)", cursor: "pointer" }}>Back</button>
      </div>
    );
  }

  // Take screen uses takeAccent so the chrome reflects the real portal the
  // student would sit (CAT yellow / IBPS orange / GATE indigo / NTA blue).
  // Pack + instructions screens stay brand-blue via examAccent.
  const accent = pack.takeAccent ?? pack.examAccent;
  const currentQ = questionById.map.get(currentQId) ?? allQuestions[0];
  const sectionQs = questionsBySection[section] ?? [];
  const currentIndexInSection = sectionQs.findIndex((q) => q.id === currentQId);
  const isLastInSection = currentIndexInSection === sectionQs.length - 1;
  const isFirstInSection = currentIndexInSection === 0;
  const sectionIdx = STUB_SECTIONS.indexOf(section);
  const isFirstQuestionOverall = isFirstInSection && sectionIdx === 0;

  // Sync numerical input when current Q changes. Always resets — clears stale
  // text when navigating from a numerical Q to an MCQ.
  useEffect(() => {
    if (currentQ.type === "numerical") {
      const existing = answers[currentQ.id]?.numericalAnswer;
      setNumericalInput(existing !== undefined ? String(existing) : "");
    } else {
      setNumericalInput("");
    }
  }, [currentQId, currentQ.type, currentQ.id, answers]);

  function jumpTo(qId: string) {
    const q = questionById.map.get(qId);
    if (!q) return;
    // CAT: cross-section jumps go through the lock-confirmation flow.
    // IBPS: cross-section jumps are forbidden (forced linear) — block silently.
    if (isCAT && q.section !== section) {
      if (lockedSections.has(q.section)) return;
      setShowPalette(false);
      setPendingSectionSwitch(q.section);
      return;
    }
    if (isIBPS && q.section !== section) return;
    setSection(q.section);
    setCurrentQId(qId);
    setShowPalette(false);
  }

  function selectOption(idx: number) {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: { ...prev[currentQ.id], questionId: currentQ.id, selectedOptionIndex: idx },
    }));
  }

  function setNumerical(value: string) {
    setNumericalInput(value);
    const num = value.trim() === "" ? undefined : Number(value);
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: { ...prev[currentQ.id], questionId: currentQ.id, numericalAnswer: Number.isFinite(num) ? num : undefined },
    }));
  }

  function clearResponse() {
    setAnswers((prev) => {
      const next = { ...prev };
      const a = next[currentQ.id];
      if (a) {
        next[currentQ.id] = { ...a, selectedOptionIndex: undefined, numericalAnswer: undefined };
      }
      return next;
    });
    setNumericalInput("");
  }

  function saveAndNext() {
    // NTA convention — Save & Next saves answer (already auto-saved on click) AND clears the marked flag
    setAnswers((prev) => {
      const a = prev[currentQ.id];
      if (!a?.markedForReview) return prev;
      return { ...prev, [currentQ.id]: { ...a, markedForReview: false } };
    });
    goNext();
  }

  function markAndNext() {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: { ...prev[currentQ.id], questionId: currentQ.id, markedForReview: true },
    }));
    goNext();
  }

  function goNext() {
    if (isLastInSection) {
      // CAT/IBPS: no auto-cross-section advance. CAT waits for manual tap+confirm,
      // IBPS waits for the per-section timer to auto-advance. Both stay put.
      if (isSectionalTimed) return;
      if (sectionIdx < STUB_SECTIONS.length - 1) {
        const nextSection = STUB_SECTIONS[sectionIdx + 1];
        setSection(nextSection);
        setCurrentQId(questionsBySection[nextSection][0].id);
      }
    } else {
      setCurrentQId(sectionQs[currentIndexInSection + 1].id);
    }
  }

  function goPrev() {
    if (isFirstInSection) {
      // CAT/IBPS: prior section is locked (or strictly forward) — Prev is a no-op.
      if (isSectionalTimed) return;
      if (sectionIdx > 0) {
        const prevSection = STUB_SECTIONS[sectionIdx - 1];
        setSection(prevSection);
        const prevQs = questionsBySection[prevSection];
        setCurrentQId(prevQs[prevQs.length - 1].id);
      }
    } else {
      setCurrentQId(sectionQs[currentIndexInSection - 1].id);
    }
  }

  function doSubmit() {
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const result = gradeMock(answers, allQuestions, timeTaken, pack.examType);
    // Olympiad exams reuse this engine but route into the olympiad post-exam
    // flow (rank → leaderboard → certificate). `?practice=1` is the unrated
    // replay for students who missed the live window — it skips ranking.
    const olyId = olympiadIdFromPackId(pack.packId);
    if (olyId) {
      const practice = searchParams.get("practice") === "1";
      const dest = practice
        ? `/olympiad/${olyId}/result?practice=1`
        : `/olympiad/${olyId}/submitting`;
      navigate(dest, { state: { result, answers, timeTaken } });
      return;
    }
    navigate(`/my-test-series/${pack.packId}/mock/${mock.id}/result`, {
      state: { result, mockTitle: mock.title, mockNumber: mock.number, answers },
    });
  }
  // Keep the submit ref pointing at the current closure so the timer-driven
  // auto-submit effect can fire it without re-installing every render.
  doSubmitRef.current = doSubmit;

  // Save & exit — flips the mock to "in-progress" state so it surfaces as
  // PAUSED on the pack screen + reachable via the Resume sticky CTA.
  // TODO(api): PUT /api/mocks/:id/pause with answers + lastQuestionIndex + timeRemaining
  function saveAndExit() {
    const olyId = olympiadIdFromPackId(pack.packId);
    navigate(olyId ? `/olympiad/${olyId}` : `/my-test-series/${pack.packId}`);
  }

  // Counts for legend + submit modal
  const counts = useMemo(() => {
    let answered = 0, marked = 0, markedAnswered = 0, notAnswered = 0, notVisited = 0;
    for (const q of allQuestions) {
      const a = answers[q.id];
      const isAns = !!a && (typeof a.selectedOptionIndex === "number" || typeof a.numericalAnswer === "number");
      const isMarked = !!a?.markedForReview;
      const wasVisited = visited.has(q.id) || q.id === currentQId;
      if (isAns && isMarked) markedAnswered++;
      else if (isAns) answered++;
      else if (isMarked) marked++;
      else if (wasVisited) notAnswered++;
      else notVisited++;
    }
    return { answered, marked, markedAnswered, notAnswered, notVisited };
  }, [allQuestions, answers, visited, currentQId]);

  const isCurrentMarked = !!answers[currentQ.id]?.markedForReview;
  const hasResponse = answers[currentQ.id] !== undefined && (
    typeof answers[currentQ.id].selectedOptionIndex === "number" ||
    typeof answers[currentQ.id].numericalAnswer === "number"
  );
  // CAT/IBPS show the current section's remaining time; NTA/UPSC/SSC show the overall.
  const displayedTime = isSectionalTimed ? (sectionTime[section] ?? sectionTimeSec) : timeRemaining;
  const timerCritical = displayedTime < 300;
  const overallIndex = (questionById.idx.get(currentQId) ?? 0) + 1;

  // CAT: confirm before switching sections (locks the current one).
  // IBPS: section switching is forbidden (forced linear) — silently ignored.
  // Others: free navigation.
  function attemptSectionSwitch(target: string) {
    if (target === section) return;
    if (lockedSections.has(target)) return; // already locked, no-op
    if (isIBPS) return;
    if (isCAT) {
      setPendingSectionSwitch(target);
    } else {
      setSection(target);
      setCurrentQId(questionsBySection[target][0].id);
    }
  }
  function confirmSectionSwitch() {
    if (!pendingSectionSwitch) return;
    const from = section;
    const to = pendingSectionSwitch;
    setLockedSections((prev) => {
      const next = new Set(prev);
      next.add(from);
      return next;
    });
    setSection(to);
    setCurrentQId(questionsBySection[to][0].id);
    setPendingSectionSwitch(null);
  }

  // Desktop NTA/UPSC/SSC exams render a TCS-iON candidate strip. When that's
  // present, we merge the timer + exit controls into it so there's ONE header
  // band instead of two stacked strips (matches real NTA portal layout).
  const hasCandidateStrip = isDesktop && (pack.examType === "nta" || pack.examType === "upsc" || pack.examType === "ssc");

  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        height: "100dvh",
        overflow: "hidden",
        maxWidth: isDesktop ? 1280 : undefined,
        marginLeft: isDesktop ? "auto" : undefined,
        marginRight: isDesktop ? "auto" : undefined,
        width: "100%",
        borderLeft: isDesktop ? "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)" : undefined,
        borderRight: isDesktop ? "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)" : undefined,
      }}
    >
      {/* Top header shell — system status bar always renders first (mimics iOS
          top safe area), then portal-specific chrome (TCS strip / IBPS banner /
          standard top bar) underneath. Shell bg matches whatever the *top*
          chrome strip is so StatusBar + that strip read as one continuous band. */}
      <div
        className="shrink-0"
        style={{
          backgroundColor: isIBPS
            ? `color-mix(in srgb, ${accent} 6%, var(--card))`
            : "var(--card)",
        }}
      >
        {/* StatusBar mimics the iOS top safe area — only meaningful on mobile.
            On desktop it's pure noise above the real chrome. */}
        {isMobile && <StatusBar />}

      {/* TCS-iON candidate strip — desktop only, for NTA-family exams (JEE/NEET/
          UPSC/SSC). Acts as the SINGLE primary header on desktop: candidate
          info + exam meta + timer + exit. */}
      {hasCandidateStrip && (
        <div
          className="shrink-0 flex items-center justify-between"
          style={{
            backgroundColor: "color-mix(in srgb, var(--foreground) 6%, var(--background))",
            borderBottom: "0.5px solid var(--border)",
            padding: "8px 24px",
            gap: 16,
          }}
        >
          <div className="flex items-center" style={{ gap: 12 }}>
            {/* X exit on the LEFT — matches mobile top bar position so the
                affordance lives in the same spot across all exams + viewports. */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowExit(true)}
              aria-label="Exit attempt"
              style={{
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: "transparent", border: "none",
                cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={18} style={{ color: "var(--muted-foreground)" }} />
            </motion.button>
            <div
              className="flex items-center justify-center"
              style={{
                width: 36, height: 36, borderRadius: 4,
                backgroundColor: "color-mix(in srgb, var(--foreground) 12%, transparent)",
                border: "0.5px solid var(--border)",
                fontSize: "var(--text-2xs)", fontWeight: 600,
                color: "var(--muted-foreground)",
              }}
              aria-hidden
            >
              {/* TODO(api): real candidate photo */}
              ID
            </div>
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 500, letterSpacing: 0.6, textTransform: "uppercase" }}>
                Candidate
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", fontWeight: 600, lineHeight: 1 }}>
                {/* TODO(api): real candidate name */}
                Demo Student · Roll No 24010001
              </span>
            </div>
            <span style={{ width: 1, height: 24, backgroundColor: "var(--border)", marginLeft: 4, marginRight: 4 }} />
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 500, letterSpacing: 0.6, textTransform: "uppercase" }}>
                {pack.examLabel} · {pack.pattern}
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", fontWeight: 600, lineHeight: 1 }}>
                {mock.title}
              </span>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: 8 }}>
            {/* Timer — same chip style as mobile, lifted into the header band */}
            <div
              className="flex items-center"
              style={{
                gap: 6, paddingLeft: 12, paddingRight: 12, height: 36, borderRadius: 8,
                backgroundColor: timerCritical
                  ? "color-mix(in srgb, var(--error-500) 18%, transparent)"
                  : "color-mix(in srgb, var(--foreground) 8%, transparent)",
              }}
            >
              <Clock size={14} style={{ color: timerCritical ? "var(--error-500)" : "var(--foreground)" }} />
              <span style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: timerCritical ? "var(--error-500)" : "var(--foreground)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {formatTime(displayedTime)}
              </span>
              {isSectionalTimed && (
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: timerCritical ? "var(--error-500)" : "var(--muted-foreground)", letterSpacing: 0.4, marginLeft: 4 }}>
                  {displaySectionLabel(section).toUpperCase()}
                </span>
              )}
            </div>
            {pack.examType === "ssc" && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
                aria-label="Switch language"
                style={{
                  height: 36, paddingLeft: 10, paddingRight: 10, borderRadius: 8,
                  backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <span style={{
                  fontSize: "var(--text-2xs)", fontWeight: 600,
                  color: language === "en" ? "var(--foreground)" : "var(--muted-foreground)",
                }}>EN</span>
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", opacity: 0.5 }}>|</span>
                <span style={{
                  fontSize: "var(--text-2xs)", fontWeight: 600,
                  color: language === "hi" ? "var(--foreground)" : "var(--muted-foreground)",
                }}>हिं</span>
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* ─── IBPS section banner — replaces the standard top-bar look with a
            section-prominent header. Real IBPS NSEIT portal foregrounds the
            current section banner. */}
      {isIBPS && (
        <div
          className="shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 6%, var(--card))`,
            borderBottom: `1px solid color-mix(in srgb, ${accent} 36%, transparent)`,
            padding: "10px 16px",
          }}
        >
          <div className="flex items-center justify-between" style={{ gap: 12 }}>
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 500, letterSpacing: 0.4, textTransform: "uppercase" }}>
                Section {STUB_SECTIONS.indexOf(section) + 1} of {pack.sections.length}
              </span>
              <span style={{ fontSize: "var(--text-base)", color: "var(--foreground)", fontWeight: 600, lineHeight: 1.2 }}>
                {displaySectionLabel(section)}
              </span>
            </div>
            <span style={{ fontSize: "var(--text-xs)", color: accent, fontWeight: 600, letterSpacing: 0.4 }}>
              Auto-advances at 0:00
            </span>
          </div>
        </div>
      )}

      {/* Mobile / non-TCS-family top bar — exit + title + utility buttons.
          Lives inside the same top-header shell opened above so the system
          StatusBar always sits above every chrome variant. */}
        {!hasCandidateStrip && (
        <div className="flex items-center justify-between" style={{ minHeight: 48, padding: "8px 12px", gap: 8, backgroundColor: "var(--card)" }}>
          {/* Exit — discards progress (mirrors real exam exit behaviour) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowExit(true)}
            aria-label="Exit attempt"
            style={{
              width: 36, height: 36, borderRadius: 8,
              backgroundColor: "transparent", border: "none",
              cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={18} style={{ color: "var(--muted-foreground)" }} />
          </motion.button>
          {/* Single-line title — real exam headers stay minimal. Student already
              knows what exam they're sitting. Drop the JEE MAIN subtitle. */}
          <span
            style={{
              fontSize: "var(--text-sm)", color: "var(--foreground)", fontWeight: 600,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              minWidth: 0, flex: 1, lineHeight: 1.3,
            }}
          >
            {mock.title}
          </span>
          <div className="flex items-center" style={{ gap: 8, flexShrink: 0 }}>
            <div
              className="flex items-center"
              style={{
                gap: 6, paddingLeft: 12, paddingRight: 12, height: 32, borderRadius: 8,
                backgroundColor: timerCritical
                  ? "color-mix(in srgb, var(--error-500) 18%, transparent)"
                  : "color-mix(in srgb, var(--foreground) 8%, transparent)",
              }}
            >
              <Clock size={13} style={{ color: timerCritical ? "var(--error-500)" : "var(--foreground)" }} />
              <span style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: timerCritical ? "var(--error-500)" : "var(--foreground)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {formatTime(displayedTime)}
              </span>
              {isSectionalTimed && (
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: timerCritical ? "var(--error-500)" : "var(--muted-foreground)", letterSpacing: 0.4, marginLeft: 4 }}>
                  {displaySectionLabel(section).toUpperCase()}
                </span>
              )}
            </div>
            {isCAT && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setShowCalculator(true)}
                aria-label="Open calculator"
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Calculator size={14} style={{ color: "var(--foreground)" }} />
              </motion.button>
            )}
            {pack.examType === "ssc" && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
                aria-label="Switch language"
                style={{
                  height: 36, paddingLeft: 8, paddingRight: 8, borderRadius: 8,
                  backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <span style={{
                  fontSize: "var(--text-2xs)", fontWeight: 600,
                  color: language === "en" ? "var(--foreground)" : "var(--muted-foreground)",
                }}>
                  EN
                </span>
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", opacity: 0.5 }}>|</span>
                <span style={{
                  fontSize: "var(--text-2xs)", fontWeight: 600,
                  color: language === "hi" ? "var(--foreground)" : "var(--muted-foreground)",
                }}>
                  हिं
                </span>
              </motion.button>
            )}
            {isMobile && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setShowPalette(true)}
                aria-label="Show question palette"
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Grid3x3 size={14} style={{ color: "var(--foreground)" }} />
              </motion.button>
            )}
          </div>
        </div>
        )}

        {/* Section tabs — hidden for single-section exams (UPSC GS Paper) where
            there's nothing to switch between. Also hidden for IBPS since cross-
            section navigation is forbidden (forced linear via per-section timer). */}
        {!isSingleSection && !isIBPS && (
        <div className="flex" style={{ overflowX: "auto", scrollbarWidth: "none" }}>
          {STUB_SECTIONS.map((s) => {
            const isActive = s === section;
            const isLocked = lockedSections.has(s);
            const qs = questionsBySection[s] || [];
            const ansCount = qs.filter((q) => {
              const a = answers[q.id];
              return !!a && (typeof a.selectedOptionIndex === "number" || typeof a.numericalAnswer === "number");
            }).length;
            // Per-section status — drives the leading dot so students can scan
            // all sections at once and see done / in-progress / untouched.
            // Locked beats current beats done beats in-progress beats untouched.
            const status: "locked" | "complete" | "in-progress" | "untouched" =
              isLocked ? "locked"
              : ansCount === qs.length && qs.length > 0 ? "complete"
              : ansCount > 0 ? "in-progress"
              : "untouched";
            const dotColor =
              status === "complete"    ? "var(--success-500)"
              : status === "in-progress" ? "var(--warning-500)"
              : status === "locked"    ? "var(--muted-foreground)"
              : "color-mix(in srgb, var(--foreground) 25%, transparent)";
            const labelColor = isLocked
              ? "var(--muted-foreground)"
              : isActive ? accent : "var(--foreground)";
            return (
              <motion.button
                key={s}
                whileTap={isLocked ? undefined : { scale: 0.97 }}
                onClick={() => attemptSectionSwitch(s)}
                disabled={isLocked}
                aria-label={
                  isLocked ? `${displaySectionLabel(s)} section (locked)`
                  : `${displaySectionLabel(s)} section · ${status === "complete" ? "complete" : status === "in-progress" ? `${ansCount} of ${qs.length} done` : "not started"}`
                }
                aria-current={isActive ? "page" : undefined}
                className="flex items-center flex-shrink-0"
                style={{
                  paddingLeft: 16, paddingRight: 16,
                  paddingTop: 12, paddingBottom: 12,
                  borderBottom: isActive ? `2px solid ${accent}` : "2px solid transparent",
                  borderLeft: "none", borderRight: "none", borderTop: "none",
                  backgroundColor: "transparent",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.5 : 1,
                  gap: 8,
                  whiteSpace: "nowrap",
                }}
              >
                {/* Status dot — solid for complete, ring for in-progress, hollow
                    for untouched. Locks render the dedicated Lock icon instead. */}
                {isLocked ? (
                  <Lock size={11} style={{ color: "var(--muted-foreground)" }} />
                ) : status === "complete" ? (
                  <CheckCircle2 size={12} style={{ color: dotColor, strokeWidth: 2.5 }} />
                ) : (
                  <span aria-hidden style={{
                    width: 8, height: 8, borderRadius: 9999,
                    backgroundColor: status === "in-progress" ? dotColor : "transparent",
                    border: status === "in-progress" ? "none" : `1.5px solid ${dotColor}`,
                    flexShrink: 0,
                  }} />
                )}
                <span style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: isActive ? 700 : 500,
                  color: labelColor,
                }}>
                  {displaySectionLabel(s)}
                </span>
                {/* Per-tab count removed — the palette panel already shows
                    answered/total per section. Keeping it here doubled the
                    cognitive load per tab. */}
              </motion.button>
            );
          })}
        </div>
        )}
      </div>

      {/* Body — on desktop, splits into main column + persistent palette sidebar.
            Desktop adds explicit padding + gap so left and right read as two
            physically separate panels floating over the background (matches real
            NTA portal which uses card-on-canvas, not edge-to-edge). */}
      <div
        className={isDesktop ? "flex" : "flex flex-col"}
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          padding: isDesktop ? 16 : 0,
          gap: isDesktop ? 16 : 0,
          backgroundColor: isDesktop ? "color-mix(in srgb, var(--foreground) 3%, var(--background))" : undefined,
        }}
      >
      <div
        className="flex flex-col"
        style={{
          flex: 1, minWidth: 0, minHeight: 0,
          backgroundColor: isDesktop ? "var(--card)" : undefined,
          borderRadius: isDesktop ? 12 : 0,
          border: isDesktop ? "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)" : undefined,
          overflow: isDesktop ? "hidden" : undefined,
        }}
      >
      {/* ─── Question metadata strip ─── */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          padding: "8px 16px",
          backgroundColor: "color-mix(in srgb, var(--card) 50%, var(--background))",
        }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <motion.button
            whileTap={!isFirstQuestionOverall ? { scale: 0.9 } : undefined}
            onClick={goPrev}
            disabled={isFirstQuestionOverall}
            aria-label="Previous question"
            className="flex items-center justify-center"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: "transparent", border: "none",
              cursor: isFirstQuestionOverall ? "not-allowed" : "pointer",
              opacity: isFirstQuestionOverall ? 0.25 : 0.85,
              flexShrink: 0, marginLeft: -8,
            }}
          >
            <ChevronLeft size={16} style={{ color: "var(--muted-foreground)" }} />
          </motion.button>
          <span style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--foreground)",
            fontVariantNumeric: "tabular-nums",
          }}>
            Q {overallIndex}/{allQuestions.length}
          </span>
          <span style={{
            fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)",
            letterSpacing: 0.4, textTransform: "uppercase",
            padding: "4px 8px", borderRadius: 4,
            backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
          }}>
            {currentQ.type === "mcq" ? "MCQ" : "Numerical"}
          </span>
          {/* Marks chip — real NTA portal renders the scoring scheme as a small
              callout so students see "+4 / −1" at a glance. Plain inline text
              didn't have enough visual weight to read at a glance. */}
          <span style={{
            fontSize: "var(--text-2xs)", fontWeight: 700,
            color: "var(--foreground)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: 0.2,
            padding: "4px 8px", borderRadius: 4,
            backgroundColor: "color-mix(in srgb, var(--foreground) 6%, transparent)",
            border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
          }}>
            {currentQ.type === "numerical" && marking && marking.wrongNumerical === 0
              ? `+${marking?.correct ?? currentQ.marks} / 0`
              : marking
              ? marking.display
              : `+${currentQ.marks}${currentQ.negativeMarks > 0 ? ` / −${currentQ.negativeMarks}` : ""}`}
          </span>
        </div>
        {/* MARKED state is already communicated by (a) the option's purple ring
            when selected and (b) the palette square — a third indicator on the
            metadata strip is redundant. Dropped. */}
      </div>

      {/* ─── Question area ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 12px" }}>
        <p style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-base)",
          color: "var(--foreground)",
          lineHeight: 1.6,
          margin: 0,
          marginBottom: 20,
        }}>
          {currentQ.stem}
        </p>

        {currentQ.type === "mcq" && currentQ.options && (() => {
          // IBPS PO Prelims uses 5 options (a/b/c/d/e); a "None of these" 5th
          // option is the canonical IBPS pattern when the stub bank has 4.
          const renderedOptions = isIBPS && currentQ.options.length === 4
            ? [...currentQ.options, "None of these"]
            : currentQ.options;
          return (
          <div className="flex flex-col" role="radiogroup" aria-label="Answer options" style={{ gap: 8 }}>
            {renderedOptions.map((opt, idx) => {
              const isSelected = answers[currentQ.id]?.selectedOptionIndex === idx;
              return (
                <motion.button
                  key={idx}
                  role="radio"
                  aria-checked={isSelected}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => selectOption(idx)}
                  className="flex items-start w-full text-left"
                  style={{
                    gap: 12, padding: "12px 12px", borderRadius: 8,
                    backgroundColor: isSelected ? `color-mix(in srgb, ${accent} 14%, var(--card))` : "var(--card)",
                    border: isSelected ? `1px solid ${accent}` : "1px solid transparent",
                    cursor: "pointer",
                    transition: "background-color 0.12s, border-color 0.12s",
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 20, height: 20, borderRadius: 9999,
                      backgroundColor: isSelected ? accent : "transparent",
                      border: isSelected ? "none" : "2px solid color-mix(in srgb, var(--foreground) 25%, transparent)",
                      flexShrink: 0, marginTop: 2,
                    }}
                  >
                    {isSelected && <div style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "var(--white)" }} />}
                  </div>
                  <span className="flex items-center" style={{ gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: isSelected ? 600 : 500, color: isSelected ? accent : "var(--muted-foreground)" }}>
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.5 }}>
                      {opt}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
          );
        })()}

        {currentQ.type === "numerical" && (
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>
              Enter numerical answer · no negative marking
            </span>
            <input
              type="number"
              aria-label="Numerical answer"
              value={numericalInput}
              onChange={(e) => setNumerical(e.target.value)}
              placeholder="0"
              style={{
                width: "100%",
                height: 56,
                padding: "0 16px",
                borderRadius: 8,
                border: "1px solid transparent",
                backgroundColor: "var(--card)",
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--foreground)",
                outline: "none",
                fontVariantNumeric: "tabular-nums",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = accent; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
            />
          </div>
        )}
      </div>

      {/* ─── Action bar — desktop renders all 4 controls in one horizontal row
            (matches real NTA portal). Mobile keeps the 2-row stack since 4
            buttons don't fit comfortably on a 360px screen. */}
      <div
        style={{
          backgroundColor: "var(--card)",
          borderTop: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
          padding: "12px 12px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: isDesktop ? "row" : "column",
          gap: 8,
        }}
      >
        {/* Primary — Save & Next. Real NTA portal makes this green and ~1.5× the
            width of the secondaries so the canonical action is obvious. */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={saveAndNext}
          className="flex items-center justify-center"
          style={{
            height: 44, borderRadius: 12, gap: 4,
            border: "none",
            cursor: "pointer",
            backgroundColor: "color-mix(in srgb, var(--success-500) 88%, var(--card))",
            flex: isDesktop ? "1.5 1 0" : undefined,
            width: isDesktop ? undefined : "100%",
          }}
        >
          <span style={{
            fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)",
            whiteSpace: "nowrap", letterSpacing: 0,
          }}>
            Save & Next
          </span>
        </motion.button>

        {/* Secondaries — AntD-style blue. Desktop: inline siblings to the
            primary. Mobile: 3-up grid below the primary. */}
        {/* Secondaries — Mark + Clear. Real NTA portal has both "Save & Mark"
            and "Mark for Review & Next" buttons, but selecting an option already
            auto-saves the answer in our shell, so the two collapse cleanly into
            one Mark button (flags whatever state the question is in + advances).
            accentToken is the per-exam takeAccent so blue/amber/orange/green/indigo
            apply per portal family. */}
        {isDesktop ? (
          <>
            <NtaSecondaryButton flex label="Mark"  accentToken={accent} onClick={markAndNext} />
            <NtaSecondaryButton flex label="Clear" accentToken={accent} onClick={clearResponse} disabled={!hasResponse} />
          </>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <NtaSecondaryButton label="Mark"  accentToken={accent} onClick={markAndNext} />
            <NtaSecondaryButton label="Clear" accentToken={accent} onClick={clearResponse} disabled={!hasResponse} />
          </div>
        )}
      </div>
      </div>

      {/* Desktop palette sidebar — always visible, replaces bottom-sheet */}
      {isDesktop && (
        <PalettePanel
          questionsBySection={questionsBySection}
          currentId={currentQId}
          answers={answers}
          visited={visited}
          onJump={jumpTo}
          counts={counts}
          lockedSections={lockedSections}
          sectionLabel={displaySectionLabel}
          onSubmit={() => setShowSubmit(true)}
        />
      )}
      </div>

      <AnimatePresence>
        {showPalette && (
          <PaletteSheet
            onClose={() => setShowPalette(false)}
            onSubmit={() => { setShowPalette(false); setShowSubmit(true); }}
            questionsBySection={questionsBySection}
            currentId={currentQId}
            answers={answers}
            visited={visited}
            onJump={jumpTo}
            counts={counts}
            lockedSections={lockedSections}
            sectionLabel={displaySectionLabel}
          />
        )}
        {showSubmit && (
          <SubmitModal
            onCancel={() => setShowSubmit(false)}
            onConfirm={() => { setShowSubmit(false); doSubmit(); }}
            counts={counts}
          />
        )}
        {showExit && (
          <ExitModal
            currentQ={overallIndex}
            totalQ={allQuestions.length}
            onCancel={() => setShowExit(false)}
            onConfirm={() => { setShowExit(false); saveAndExit(); }}
          />
        )}
        {showCalculator && (
          <CalculatorOverlay onClose={() => setShowCalculator(false)} />
        )}
        {pendingSectionSwitch && (
          <SectionLockModal
            sectionLabel={displaySectionLabel(section)}
            nextSectionLabel={displaySectionLabel(pendingSectionSwitch)}
            onCancel={() => setPendingSectionSwitch(null)}
            onConfirm={confirmSectionSwitch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
