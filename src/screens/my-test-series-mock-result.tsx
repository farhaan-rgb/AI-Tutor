/**
 * My Test Series — Mock Result
 * Route: /my-test-series/:packId/mock/:mockId/result
 *
 * Shown after submit. Receives MockResult via location.state.
 *  - Big score + percentage + AIR prediction
 *  - Stat tiles: attempted / correct / incorrect / unattempted / time
 *  - Subject-wise score breakdown
 *  - CTAs: Review Solutions · Back to Pack
 */

import { useLocation, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Trophy,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";
import { GlassHeader, StatusBar, typo } from "../shared/premium-ui";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { getPackById, getAttemptById, STUB_SECTIONS, type MockResult, type MockAnswer } from "../shared/test-series-progress";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Performance band — drives the verdict chip color + label
function performanceBand(pct: number): { label: string; color: string } {
  if (pct >= 75) return { label: "Excellent", color: "var(--success-500)" };
  if (pct >= 60) return { label: "Strong",    color: "var(--success-500)" };
  if (pct >= 40) return { label: "On track",  color: "var(--warning-500)" };
  if (pct >= 25) return { label: "Needs work", color: "var(--warning-500)" };
  return { label: "Below target", color: "var(--error-500)" };
}

// Hero — animated circular progress ring with score + AIR
function ScoreHero({
  score,
  maxScore,
  pct,
  accent,
  air,
  percentile,
}: {
  score: number;
  maxScore: number;
  pct: number;
  accent: string;
  air: number | null;
  percentile?: number | null;
}) {
  const SIZE = 168;
  const STROKE = 10;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  // Visually clamp very-low scores to a minimum 4% arc so the indicator reads
  // as "very low" rather than a stray dot at the top of the ring (the real pct
  // is still shown as a number in the center).
  const displayPct = score === 0 ? 0 : Math.max(pct, 4);
  const dashOffset = circumference * (1 - displayPct / 100);
  const band = performanceBand(pct);

  const isEmpty = score === 0;
  return (
    <div className="flex flex-col items-center" style={{ gap: 16, marginBottom: 24 }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        style={{ position: "relative", width: SIZE, height: SIZE }}
      >
        {/* Soft brand-tinted halo behind — dimmed when score is empty so the
            ring doesn't feel decorative for a zero/skipped attempt */}
        <div aria-hidden style={{
          position: "absolute", inset: -20,
          background: `radial-gradient(circle, color-mix(in srgb, ${accent} ${isEmpty ? 8 : 22}%, transparent) 0%, transparent 65%)`,
          filter: "blur(14px)",
          pointerEvents: "none",
        }} />

        <svg width={SIZE} height={SIZE} style={{ position: "relative", transform: "rotate(-90deg)" }}>
          {/* Background track — always visible so the ring reads intentional
              even when the progress arc is invisible (zero score) */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            fill="none"
            stroke="color-mix(in srgb, var(--foreground) 10%, transparent)"
            strokeWidth={STROKE}
          />
          {/* Progress arc — only when there's positive score */}
          {!isEmpty && (
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={radius}
              fill="none"
              stroke={accent}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
              style={{
                filter: `drop-shadow(0 0 8px color-mix(in srgb, ${accent} 53%, transparent))`,
              }}
            />
          )}
        </svg>

        {/* Center content */}
        <div
          className="flex flex-col items-center justify-center"
          style={{
            position: "absolute", inset: 0,
            gap: 2,
          }}
        >
          <span style={{
            fontSize: "var(--text-2xs)",
            fontWeight: 600,
            color: "var(--muted-foreground)",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            marginBottom: 2,
          }}>
            Your score
          </span>
          <div className="flex items-baseline" style={{ gap: 4 }}>
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: 44,
              fontWeight: 700,
              color: "var(--foreground)",
              lineHeight: 1,
              letterSpacing: -1.2,
              fontVariantNumeric: "tabular-nums",
            }}>
              {score}
            </span>
            <span style={{
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              color: "var(--muted-foreground)",
              fontVariantNumeric: "tabular-nums",
            }}>
              / {maxScore}
            </span>
          </div>
          <span style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: isEmpty ? "var(--muted-foreground)" : accent,
            marginTop: 4,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: 0,
          }}>
            {pct}%
          </span>
        </div>
      </motion.div>

      {/* Performance band chip */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="flex items-center"
        style={{
          gap: 6,
          paddingLeft: 8, paddingRight: 12, height: 24,
          borderRadius: 9999,
          backgroundColor: `color-mix(in srgb, ${band.color} 14%, transparent)`,
          border: `0.5px solid color-mix(in srgb, ${band.color} 38%, transparent)`,
        }}
      >
        <span style={{
          width: 4, height: 4, borderRadius: 9999,
          backgroundColor: band.color,
          boxShadow: `0 0 6px ${band.color}`,
        }} />
        <span style={{
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: band.color,
          letterSpacing: 0.2,
        }}>
          {band.label}
        </span>
      </motion.div>

      {/* Sub-headline row — always renders ONE of:
          (1) AIR/Percentile when above the prediction threshold
          (2) Coach hint when score is too low / zero for a meaningful prediction
          This keeps the result page layout stable across all score bands. */}
      {(() => {
        const hasAir = !isEmpty && (air !== null || (percentile !== null && percentile !== undefined));
        return (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="flex items-center"
            style={{ gap: 6 }}
          >
            {hasAir ? (
              // AIR/Percentile is the headline a student actually came for.
              // Render it as a callout chip so it reads as a top-level result,
              // not a footnote under the score ring.
              <div
                className="flex items-center"
                style={{
                  gap: 8,
                  paddingLeft: 12, paddingRight: 14, height: 32,
                  borderRadius: 9999,
                  backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
                  border: `0.5px solid color-mix(in srgb, ${accent} 36%, transparent)`,
                }}
              >
                <Trophy size={14} style={{ color: accent }} />
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
                  {air !== null ? "Pred. AIR" : "Pred. %ile"}
                </span>
                <span style={{
                  fontSize: "var(--text-base)", color: "var(--foreground)", fontWeight: 800,
                  fontVariantNumeric: "tabular-nums", letterSpacing: -0.2,
                }}>
                  {air !== null ? air.toLocaleString("en-IN") : `${percentile?.toFixed(1)}`}
                </span>
              </div>
            ) : (
              // Below prediction band — coach toward the highest-value next action
              <span style={{
                fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontWeight: 500,
                textAlign: "center",
              }}>
                {isEmpty
                  ? "Walk through the solutions to start scoring"
                  : "Walk through the solutions to lift your rank"}
              </span>
            )}
          </motion.div>
        );
      })()}
    </div>
  );
}


// Simple AIR prediction stub: AIR scales with %scored (1k @ 90%, 10k @ 70%, 100k @ 50%, none under 25%)
function predictAir(pct: number): number | null {
  if (pct < 25) return null;
  if (pct >= 90) return 1500;
  if (pct >= 80) return 3500;
  if (pct >= 70) return 9000;
  if (pct >= 60) return 24000;
  if (pct >= 50) return 65000;
  if (pct >= 40) return 150000;
  return 400000;
}

// CAT uses percentile, not AIR — predict approximate percentile from raw %
function predictPercentile(pct: number): number | null {
  if (pct < 15) return null;
  if (pct >= 90) return 99.8;
  if (pct >= 80) return 99.0;
  if (pct >= 70) return 97.5;
  if (pct >= 60) return 94.0;
  if (pct >= 50) return 88.0;
  if (pct >= 40) return 78.0;
  if (pct >= 30) return 60.0;
  return 40.0;
}

// Estimate a MockResult from the stored pack data when we don't have a live
// state.result (e.g. user reopened a completed mock from the rail — we only
// persist score/timeTaken per mock, not the full per-question history).
function reconstructResult(pack: ReturnType<typeof getPackById>, mockId: string): { result: MockResult; isReconstructed: true } | null {
  if (!pack) return null;
  const mock = getAttemptById(pack, mockId);
  if (!mock || mock.status !== "completed" || mock.score === undefined || mock.maxScore === undefined) return null;
  // MCQ scoring (+4 correct / −1 incorrect): solve for correct/incorrect given total.
  // Assume ~70% attempt rate as a reasonable demo default.
  const total = mock.questionCount;
  const attempted = Math.round(total * 0.7);
  const score = mock.score;
  const maxPossible = mock.maxScore;
  // score = 4c - i, c + i = attempted  =>  c = (score + attempted) / 5
  const correct = Math.max(0, Math.min(attempted, Math.round((score + attempted) / 5)));
  const incorrect = Math.max(0, attempted - correct);
  const unanswered = total - attempted;

  // Synthesize per-section breakdown so historical mocks still render the
  // "By section" card. We don't store per-section data — distribute the totals
  // evenly across pack.sections with a small variance so it doesn't look
  // mechanically identical. Last section absorbs the remainder.
  const sections = pack.sections;
  const sectionTotal = Math.floor(total / sections.length);
  const remainder = total - sectionTotal * sections.length;
  // Variance pattern: middle section slightly weaker, ends slightly stronger.
  // Keeps the breakdown visually interesting without faking real data.
  const variance = [0, -1, 1].slice(0, sections.length);
  const sectionBreakdown = sections.map((section, i) => {
    const isLast = i === sections.length - 1;
    const sCount = sectionTotal + (isLast ? remainder : 0);
    const sCorrect = Math.max(0, Math.min(sCount, Math.round(correct / sections.length) + (variance[i] ?? 0)));
    const sIncorrect = Math.max(0, Math.min(sCount - sCorrect, Math.round(incorrect / sections.length)));
    const sUnanswered = Math.max(0, sCount - sCorrect - sIncorrect);
    const marking = 4; // NTA default; per-exam scheme not threaded into reconstruction
    return {
      section,
      score: sCorrect * marking - sIncorrect,
      maxScore: sCount * marking,
      correct: sCorrect,
      incorrect: sIncorrect,
      unanswered: sUnanswered,
    };
  });

  return {
    result: {
      totalScore: score,
      maxScore: maxPossible,
      attempted,
      correct,
      incorrect,
      unanswered,
      timeTakenSeconds: mock.timeTakenSeconds ?? mock.durationMinutes * 60,
      sectionBreakdown,
      perQuestion: [],
    },
    isReconstructed: true,
  };
}

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ packId: string; mockId: string }>();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const pack = params.packId ? getPackById(params.packId) : undefined;
  const state = location.state as { result?: MockResult; mockTitle?: string; mockNumber?: number; answers?: Record<string, MockAnswer> } | null;
  const reconstructed = !state?.result && params.mockId ? reconstructResult(pack, params.mockId) : null;
  const result = state?.result ?? reconstructed?.result;
  const mockNumber = state?.mockNumber ?? (params.mockId && pack ? getAttemptById(pack, params.mockId)?.number : undefined);
  const userAnswers = state?.answers;

  if (!pack || !result) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", backgroundColor: "var(--background)", padding: 24, gap: 12 }}>
        <span style={{ fontSize: "var(--text-base)", color: "var(--foreground)", fontWeight: 600 }}>Result not available</span>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "var(--primary-300)", cursor: "pointer" }}>Back</button>
      </div>
    );
  }

  const accent = pack.examAccent;
  // Prefer pack.maxScore when defined (per-exam total: NEET 720, CAT 198, JEE 360)
  // — falls back to result.maxScore (sum of graded questions) for safety.
  const effectiveMaxScore = pack.maxScore ?? result.maxScore;
  const pct = Math.round((Math.max(0, result.totalScore) / effectiveMaxScore) * 100);
  // CAT uses percentile, others use AIR
  const isCAT = pack.examType === "cat";
  const air = isCAT ? null : predictAir(pct);
  const percentile = isCAT ? predictPercentile(pct) : null;
  const accuracy = result.attempted > 0 ? Math.round((result.correct / result.attempted) * 100) : 0;
  // Universal section-label remapping: STUB stays Physics/Chem/Maths, display
  // comes from pack.sections (NEET → Botany; CAT → VARC/DILR/QA; etc.)
  const displaySectionLabel = (internal: string) => {
    const idx = STUB_SECTIONS.indexOf(internal as typeof STUB_SECTIONS[number]);
    return pack.sections[idx] ?? internal;
  };

  // ─── DESKTOP — exam-portal result dashboard ─────────────────────────────
  if (isDesktop) {
    return (
      <DesktopResult
        pack={pack}
        mockNumber={mockNumber}
        accent={accent}
        result={result}
        effectiveMaxScore={effectiveMaxScore}
        pct={pct}
        air={air}
        percentile={percentile}
        accuracy={accuracy}
        userAnswers={userAnswers}
        displaySectionLabel={displaySectionLabel}
        onBack={() => navigate(`/my-test-series/${pack.packId}`)}
        onReview={() =>
          navigate(`/my-test-series/${pack.packId}/mock/${params.mockId}/review`, {
            state: { answers: userAnswers, mockNumber },
          })
        }
      />
    );
  }

  // ─── MOBILE — existing layout ────────────────────────────────────────────
  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ minHeight: 56, paddingLeft: 4, paddingRight: 16, paddingTop: 8, paddingBottom: 8, gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/my-test-series/${pack.packId}`)}
            aria-label="Back to pack"
            style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
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
              Mock {mockNumber ?? "?"} Result
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

      <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: "24px 16px 32px" }}>
        {/* Hero — circular progress ring + score + AIR */}
        <ScoreHero score={Math.max(0, result.totalScore)} maxScore={effectiveMaxScore} pct={pct} accent={accent} air={air} percentile={percentile} />


        {/* ── Performance section ── */}
        <SectionLabel>Performance</SectionLabel>
        <div style={{
          marginBottom: 24,
          borderRadius: 12,
          backgroundColor: "var(--card)",
          overflow: "hidden",
          border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
        }}>
          {/* Stats strip */}
          <div className="flex" style={{ padding: "16px 0" }}>
            {[
              { label: "Correct",   value: result.correct,    color: "var(--success-500)" },
              { label: "Incorrect", value: result.incorrect,  color: "var(--error-500)" },
              { label: "Skipped",   value: result.unanswered, color: "var(--muted-foreground)" },
            ].map((s, i) => (
              <div
                key={s.label}
                className="flex flex-col items-center"
                style={{
                  flex: 1,
                  paddingLeft: 8, paddingRight: 8,
                  borderRight: i < 2 ? "1px solid var(--border)" : "none",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1, letterSpacing: -0.3, fontVariantNumeric: "tabular-nums" }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
          {/* Meta strip — accuracy + time */}
          <div
            className="flex items-center justify-center"
            style={{
              gap: 8,
              padding: "8px 16px",
              borderTop: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--foreground) 2%, transparent)",
            }}
          >
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 500 }}>
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{accuracy}%</span> accuracy
            </span>
            <span style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: "var(--muted-foreground)", opacity: 0.5 }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 500 }}>
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{formatTime(result.timeTakenSeconds)}</span> taken
            </span>
          </div>
        </div>

        {/* ── Section breakdown — only when per-section data is available ── */}
        {result.sectionBreakdown.length > 0 && (
          <>
            <SectionLabel>By section</SectionLabel>
            <div style={{
              marginBottom: 24,
              borderRadius: 12,
              backgroundColor: "var(--card)",
              border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
              overflow: "hidden",
            }}>
              {result.sectionBreakdown.map((sec, idx) => {
                // Stacked accuracy bar: green = correct%, red = wrong%, rest = skipped track.
                // Means even a zero-scored section with wrong attempts still renders
                // an informative red slice (instead of a blank bar).
                const sectionTotal = sec.correct + sec.incorrect + sec.unanswered;
                const correctPct = sectionTotal > 0 ? (sec.correct   / sectionTotal) * 100 : 0;
                const wrongPct   = sectionTotal > 0 ? (sec.incorrect / sectionTotal) * 100 : 0;
                return (
                  <div
                    key={sec.section}
                    style={{
                      padding: 16,
                      borderBottom: idx < result.sectionBreakdown.length - 1 ? "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)" : "none",
                    }}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
                        {displaySectionLabel(sec.section)}
                      </span>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums" }}>
                        {Math.max(0, sec.score)} / {sec.maxScore}
                      </span>
                    </div>
                    <div
                      className="flex"
                      style={{
                        height: 6,
                        borderRadius: 9999,
                        backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
                        overflow: "hidden",
                        marginBottom: 8,
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${correctPct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.08 }}
                        style={{ height: "100%", backgroundColor: "var(--success-500)" }}
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${wrongPct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.08 + 0.1 }}
                        style={{ height: "100%", backgroundColor: "var(--error-500)" }}
                      />
                    </div>
                    <div className="flex" style={{ gap: 16 }}>
                      <SmallStat label="Correct" value={sec.correct}    color="var(--success-500)" />
                      <SmallStat label="Wrong"   value={sec.incorrect}  color="var(--error-500)" />
                      <SmallStat label="Skipped" value={sec.unanswered} color="var(--muted-foreground)" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Next action ── */}
        <SectionLabel>Next step</SectionLabel>
        {/* Review answers CTA — the highest-value action on this screen */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/my-test-series/${pack.packId}/mock/${params.mockId}/review`, {
            state: { answers: userAnswers, mockNumber },
          })}
          className="flex items-center justify-between w-full"
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            backgroundColor: `color-mix(in srgb, ${accent} 10%, var(--card))`,
            border: `0.5px solid color-mix(in srgb, ${accent} 35%, transparent)`,
            cursor: "pointer",
            gap: 12,
            textAlign: "left",
          }}
        >
          <div className="flex items-center" style={{ gap: 12, flex: 1, minWidth: 0 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: `color-mix(in srgb, ${accent} 13%, transparent)`,
                border: `0.5px solid color-mix(in srgb, ${accent} 27%, transparent)`,
                flexShrink: 0,
              }}
            >
              <BookOpen size={16} style={{ color: accent, strokeWidth: 2 }} />
            </div>
            <div className="flex flex-col" style={{ alignItems: "flex-start", gap: 2 }}>
              <span style={{
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--foreground)",
                lineHeight: 1.25,
              }}>
                {userAnswers ? "Review your answers" : "View solutions"}
              </span>
              <span style={{ ...typo.metaStyle, lineHeight: 1.2 }}>
                {userAnswers
                  ? `See where you ${result.incorrect > 0 ? `went wrong (${result.incorrect}) + explanations` : "skipped + explanations"}`
                  : "Walk through correct answers + explanations"}
              </span>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: accent, flexShrink: 0 }} />
        </motion.button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: "var(--text-2xs)",
        fontWeight: 600,
        color: "var(--muted-foreground)",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        display: "block",
        marginBottom: 8,
        paddingLeft: 4,
      }}
    >
      {children}
    </span>
  );
}

function SmallStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center" style={{ gap: 4 }}>
      <span style={{ fontSize: "var(--text-xs)", color, fontWeight: 800 }}>{value}</span>
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{label}</span>
    </div>
  );
}

// ─── Desktop — exam-portal result dashboard ──────────────────────────────────
function DesktopResult({
  pack,
  mockNumber,
  accent,
  result,
  effectiveMaxScore,
  pct,
  air,
  percentile,
  accuracy,
  userAnswers,
  displaySectionLabel,
  onBack,
  onReview,
}: {
  pack: NonNullable<ReturnType<typeof getPackById>>;
  mockNumber: number | undefined;
  accent: string;
  result: MockResult;
  effectiveMaxScore: number;
  pct: number;
  air: number | null;
  percentile: number | null;
  accuracy: number;
  userAnswers?: Record<string, MockAnswer>;
  displaySectionLabel: (internal: string) => string;
  onBack: () => void;
  onReview: () => void;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Portal top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: "color-mix(in srgb, var(--background) 82%, transparent)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "14px 32px",
            gap: 24,
          }}
        >
          <div className="flex items-center" style={{ gap: 14 }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onBack}
              aria-label="Back to pack"
              style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} style={{ color: "var(--foreground)" }} />
            </motion.button>
            <div className="flex items-center" style={{ gap: 8 }}>
              <Trophy size={14} style={{ color: accent }} />
              <span style={{
                fontSize: "var(--text-2xs)",
                fontWeight: 600,
                color: accent,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}>
                Result
              </span>
              <span style={{ width: 1, height: 12, backgroundColor: "var(--border)" }} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
                {pack.title} · Mock {mockNumber ?? "?"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body — 2-column grid */}
      <div
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          padding: "32px 32px 48px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 440px) minmax(0, 1fr)",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* LEFT — score hero card */}
        <div
          style={{
            padding: 28,
            borderRadius: 16,
            backgroundColor: "var(--card)",
            border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
            position: "sticky",
            top: 88,
          }}
        >
          <ScoreHero score={Math.max(0, result.totalScore)} maxScore={effectiveMaxScore} pct={pct} accent={accent} air={air} percentile={percentile} />

          {/* Review CTA — the page's primary action. Solid-filled at 44px so
              the student lands on a clear "what next" without scanning. The
              accuracy/time + section breakdown to the right is reference; this
              button is what they came to click. */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onReview}
            className="flex items-center justify-center w-full"
            style={{
              marginTop: 16,
              height: 44,
              borderRadius: 12,
              backgroundColor: "var(--primary-500)",
              border: "none",
              cursor: "pointer",
              gap: 8,
              padding: "0 16px",
              boxShadow: "0 2px 8px color-mix(in srgb, var(--primary-500) 22%, transparent)",
            }}
          >
            <BookOpen size={16} style={{ color: "var(--white)", strokeWidth: 2 }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--white)", letterSpacing: 0 }}>
              {userAnswers ? "Review your answers" : "View solutions"}
            </span>
            <ChevronRight size={16} style={{ color: "var(--white)", opacity: 0.85, marginLeft: 4 }} />
          </motion.button>
          <span style={{
            display: "block", textAlign: "center", marginTop: 8,
            fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 500,
          }}>
            {userAnswers
              ? `See where you ${result.incorrect > 0 ? `went wrong (${result.incorrect}) + explanations` : "skipped + explanations"}`
              : "Walk through correct answers + explanations"}
          </span>
        </div>

        {/* RIGHT — Performance + Section breakdown stacked */}
        <div className="flex flex-col" style={{ gap: 28 }}>
          {/* Performance section */}
          <div>
            <SectionLabel>Performance</SectionLabel>
            <div style={{
              borderRadius: 14,
              backgroundColor: "var(--card)",
              overflow: "hidden",
              border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
            }}>
              <div className="flex" style={{ padding: "20px 0" }}>
                {[
                  { label: "Correct",   value: result.correct,    color: "var(--success-500)" },
                  { label: "Incorrect", value: result.incorrect,  color: "var(--error-500)" },
                  { label: "Skipped",   value: result.unanswered, color: "var(--muted-foreground)" },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center"
                    style={{
                      flex: 1,
                      paddingLeft: 8, paddingRight: 8,
                      borderRight: i < 2 ? "1px solid var(--border)" : "none",
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700 }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: s.color, lineHeight: 1, letterSpacing: -0.3, fontVariantNumeric: "tabular-nums" }}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center justify-center"
                style={{
                  gap: 14,
                  padding: "12px 20px",
                  borderTop: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--foreground) 2%, transparent)",
                }}
              >
                <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                  <span style={{ color: "var(--foreground)", fontWeight: 800 }}>{accuracy}%</span> accuracy
                </span>
                <span style={{ width: 3, height: 3, borderRadius: 9999, backgroundColor: "var(--muted-foreground)", opacity: 0.5 }} />
                <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                  <span style={{ color: "var(--foreground)", fontWeight: 800 }}>{formatTime(result.timeTakenSeconds)}</span> taken
                </span>
              </div>
            </div>
          </div>

          {/* Section breakdown */}
          {result.sectionBreakdown.length > 0 && (
            <div>
              <SectionLabel>By section</SectionLabel>
              <div style={{
                borderRadius: 14,
                backgroundColor: "var(--card)",
                border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
                overflow: "hidden",
              }}>
                {result.sectionBreakdown.map((sec, idx) => {
                  const secPct = sec.maxScore > 0 ? Math.round((Math.max(0, sec.score) / sec.maxScore) * 100) : 0;
                  return (
                    <div
                      key={sec.section}
                      style={{
                        padding: "18px 20px",
                        borderBottom: idx < result.sectionBreakdown.length - 1 ? "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)" : "none",
                      }}
                    >
                      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                          {displaySectionLabel(sec.section)}
                        </span>
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
                          {Math.max(0, sec.score)} <span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>/ {sec.maxScore}</span>
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--primary-500) 14%, transparent)", overflow: "hidden", marginBottom: 10 }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${secPct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: idx * 0.08 }}
                          style={{ height: "100%", backgroundColor: "var(--primary-500)" }}
                        />
                      </div>
                      <div className="flex" style={{ gap: 20 }}>
                        <SmallStat label="Correct" value={sec.correct}    color="var(--success-500)" />
                        <SmallStat label="Wrong"   value={sec.incorrect}  color="var(--error-500)" />
                        <SmallStat label="Skipped" value={sec.unanswered} color="var(--muted-foreground)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
