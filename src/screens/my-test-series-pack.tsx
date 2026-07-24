/**
 * My Test Series — Pack Detail
 * Route: /my-test-series/:packId
 *
 * Post-purchase pack view: hero + stat tiles + mock list with per-row status.
 * Entry points: Classes tab rail · Order Confirm CTA · Order Detail CTA.
 */

import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Pause,
  Play,
  ChevronRight,
  FileText,
} from "lucide-react";
import { motion } from "motion/react";
import { GlassHeader, StatusBar, typo } from "../shared/premium-ui";
import {
  getPackById,
  nextPendingMock,
  packStats,
  type MockProgress,
  type MyTestSeriesPack,
} from "../shared/test-series-progress";

// Score band — returns the full AntD-tag dark-mode palette (bg / border / text)
// for one of three semantic levels. Mirrors AntD 5's Tag with `color="success"`
// etc. on dark surfaces, using tokens already in theme.css.
function scoreBand(pct: number): { bg: string; border: string; text: string } {
  if (pct >= 75) return {
    bg: "var(--success-d2)",
    border: "var(--success-d4)",
    text: "var(--success-500)",
  };
  if (pct >= 40) return {
    bg: "var(--warning-d2)",
    border: "var(--warning-d4)",
    text: "var(--warning-500)",
  };
  return {
    bg: "var(--error-d2)",
    border: "var(--error-d4)",
    text: "var(--error-500)",
  };
}

// AntD-style Tag (dark mode) — solid d2 bg + d4 border + 500 text. Direct
// equivalent of AntD `<Tag color="success|warning|error" />` styling for
// PrepMaster's tokens (since the project doesn't ship antd).
function ScoreTag({ score, maxScore, band }: { score: number; maxScore: number; band: ReturnType<typeof scoreBand> }) {
  return (
    <div
      className="inline-flex items-center"
      style={{
        height: 24,
        paddingLeft: 8, paddingRight: 8,
        borderRadius: 4,
        backgroundColor: band.bg,
        border: `1px solid ${band.border}`,
        flexShrink: 0,
        gap: 2,
      }}
    >
      <span style={{
        fontSize: "var(--text-xs)", fontWeight: 600, color: band.text,
        fontVariantNumeric: "tabular-nums", lineHeight: 1,
      }}>
        {score}
      </span>
      <span style={{
        fontSize: "var(--text-xs)", fontWeight: 400, color: band.text,
        opacity: 0.55,
        fontVariantNumeric: "tabular-nums", lineHeight: 1,
      }}>
        /{maxScore}
      </span>
    </div>
  );
}

// ─── Mock row ─────────────────────────────────────────────────────────────────
function MockRow({
  pack,
  mock,
  onClick,
  isNext,
}: {
  pack: MyTestSeriesPack;
  mock: MockProgress;
  onClick: () => void;
  /** Highlights the row as the student's next action. Only one row per list. */
  isNext?: boolean;
}) {
  const accent = pack.examAccent;
  const isPyq = mock.kind === "pyq";
  const isCompleted = mock.status === "completed";
  const isInProgress = mock.status === "in-progress";

  const completedPct = isCompleted && mock.score !== undefined && mock.maxScore
    ? Math.round((Math.max(0, mock.score) / mock.maxScore) * 100)
    : 0;
  const band = isCompleted ? scoreBand(completedPct) : null;

  const subLabel = (() => {
    if (isCompleted && mock.score !== undefined && mock.maxScore) {
      const mins = Math.round((mock.timeTakenSeconds ?? 0) / 60);
      return `${mins} min · ${completedPct}%`;
    }
    if (isInProgress && mock.lastQuestionIndex !== undefined) {
      const minsLeft = Math.round((mock.timeRemainingSeconds ?? 0) / 60);
      return `Paused at Q${mock.lastQuestionIndex + 1} · ${minsLeft} min left`;
    }
    return `${mock.questionCount} questions · ${mock.durationMinutes} min`;
  })();

  return (
    <motion.button
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className="flex items-center justify-between w-full text-left"
      style={{
        padding: "12px 12px",
        borderRadius: 12,
        backgroundColor: isNext
          ? `color-mix(in srgb, ${accent} 10%, var(--card))`
          : "var(--card)",
        border: isNext
          ? `1px solid color-mix(in srgb, ${accent} 40%, transparent)`
          : "1px solid transparent",
        cursor: "pointer",
        gap: 12,
      }}
    >
      <div className="flex items-center" style={{ gap: 12, flex: 1, minWidth: 0 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: isCompleted && band
              ? band.bg
              : `color-mix(in srgb, ${accent} 14%, transparent)`,
            border: isCompleted && band
              ? `1px solid ${band.border}`
              : "1px solid transparent",
            flexShrink: 0,
          }}
        >
          {isCompleted && band ? (
            <CheckCircle2 size={16} style={{ color: band.text }} />
          ) : isPyq ? (
            <FileText size={16} style={{ color: accent }} />
          ) : (
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: accent, letterSpacing: -0.3 }}>
              {mock.number}
            </span>
          )}
        </div>

        <div className="flex flex-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                // Completed mocks de-emphasized; pending + next-pending stay full-strength
                color: isCompleted ? "var(--muted-foreground)" : "var(--foreground)",
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {mock.title}
            </span>
            {/* NEXT pill — AntD-style tag in pack accent color (matches the
                ScoreTag visual language: subtle tinted bg + colored border + colored text). */}
            {isNext && (
              <div
                className="inline-flex items-center"
                style={{
                  paddingLeft: 6, paddingRight: 6, height: 16,
                  borderRadius: 4,
                  backgroundColor: `color-mix(in srgb, ${accent} 18%, var(--background))`,
                  border: `1px solid color-mix(in srgb, ${accent} 36%, transparent)`,
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: accent, letterSpacing: 0.4, lineHeight: 1 }}>NEXT</span>
              </div>
            )}
          </div>
          <span style={{ ...typo.metaStyle }}>{subLabel}</span>
        </div>
      </div>

      {isCompleted && band && mock.score !== undefined && mock.maxScore ? (
        // AntD-style score tag, color-banded by % of max — the canonical
        // "how did you do?" signal, scannable down the list.
        <ScoreTag score={mock.score} maxScore={mock.maxScore} band={band} />
      ) : (
        <ChevronRight size={16} style={{ color: isNext ? accent : "var(--muted-foreground)", flexShrink: 0 }} />
      )}

    </motion.button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const params = useParams<{ packId: string }>();
  const pack = params.packId ? getPackById(params.packId) : undefined;

  if (!pack) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", backgroundColor: "var(--background)", gap: 12, padding: 24 }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
          Pack not found
        </span>
        <button
          onClick={() => navigate("/classes")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "var(--text-sm)", color: "var(--primary-300)",
          }}
        >
          Back to Classes
        </button>
      </div>
    );
  }

  const { completed, progressPct } = packStats(pack);
  const next = nextPendingMock(pack);

  function openMock(mock: MockProgress) {
    if (mock.status === "completed") {
      navigate(`/my-test-series/${pack!.packId}/mock/${mock.id}/result`);
    } else {
      navigate(`/my-test-series/${pack!.packId}/mock/${mock.id}/instructions`);
    }
  }

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
      {/* Sticky header — uses shared GlassHeader so the glass-bg + backdrop blur
          matches every other detail page in the app. Two-line title/subtitle
          pattern (cf. topic detail "Verbal Ability / CAT"). */}
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ minHeight: 56, paddingLeft: 4, paddingRight: 16, paddingTop: 8, paddingBottom: 8, gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            // Routes to /classes — the canonical home of the My Test Series rail.
            // navigate(-1) was unreliable: post-purchase flow lands on this page
            // from order-confirm/marketplace, where going "back" returns the user
            // mid-funnel instead of to the library.
            onClick={() => navigate("/classes")}
            aria-label="Go to Classes"
            style={{
              width: 44, height: 44, borderRadius: 9999,
              backgroundColor: "transparent",
              border: "none", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} style={{ color: "var(--foreground)", strokeWidth: 2 }} />
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
              {pack.title}
            </span>
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-xs)",
              color: "var(--muted-foreground)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}>
              {pack.planLabel} Plan · {pack.pattern}
            </span>
          </div>
        </div>
      </GlassHeader>

      <div className="flex-1 min-h-0" style={{ overflowY: "auto", paddingBottom: 88 }}>
        {/* Progress bar */}
        <div className="flex flex-col" style={{ padding: "20px 16px 0", gap: 8 }}>
          <div className="flex items-baseline justify-between">
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
              Your progress
            </span>
            {/* Count tones down so the progress bar reads as the primary indicator,
                not a redundant label below the count. */}
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
              {completed} of {pack.totalMocks}
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 9999,
              backgroundColor: "color-mix(in srgb, var(--primary-500) 14%, transparent)",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                height: "100%",
                background: "linear-gradient(90deg, var(--primary-500) 0%, var(--primary-400) 100%)",
              }}
            />
          </div>
        </div>

        {/* Performance summary — flat hairline-divided strip. Three cells:
            Avg score · Best score · Predicted AIR. Trend is now implicit in
            the color-coded score chips on the mock rows below. */}
        {completed > 0 && (() => {
          const bestScore = pack.mocks
            .filter((m) => m.status === "completed" && m.score !== undefined)
            .reduce<number | undefined>((best, m) => {
              if (m.score === undefined) return best;
              return best === undefined || m.score > best ? m.score : best;
            }, undefined);
          const bestPct = bestScore !== undefined && pack.maxScore
            ? Math.round((bestScore / pack.maxScore) * 100)
            : undefined;
          return (
          <div className="flex" style={{
            margin: "16px 16px 0",
            borderRadius: 12,
            backgroundColor: "var(--card)",
            padding: "12px 0",
          }}>
            {[
              {
                label: "Avg score",
                value: pack.avgScore !== undefined ? `${pack.avgScore}` : "—",
                sub: pack.maxScore !== undefined ? `of ${pack.maxScore}` : undefined,
                color: "var(--foreground)",
              },
              {
                label: "Best score",
                value: bestScore !== undefined ? `${bestScore}` : "—",
                sub: bestPct !== undefined ? `${bestPct}%` : undefined,
                color: bestPct !== undefined ? scoreBand(bestPct).text : "var(--foreground)",
              },
              {
                // CAT uses percentile, others use AIR
                label: pack.examType === "cat" ? "Predicted %ile" : "Predicted AIR",
                value: pack.airPrediction
                  ? (pack.examType === "cat"
                      ? `${pack.airPrediction}%ile`
                      : pack.airPrediction.toLocaleString("en-IN"))
                  : "—",
                sub: "estimated",
                color: "var(--foreground)",
              },
            ].map((s, i) => (
              <div
                key={s.label}
                className="flex flex-col items-center"
                style={{
                  flex: 1,
                  paddingLeft: 8, paddingRight: 8,
                  borderRight: i < 2 ? "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)" : "none",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {s.label}
                </span>
                <span style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: s.color, lineHeight: 1, letterSpacing: -0.3 }}>
                  {s.value}
                </span>
                {s.sub && (
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                    {s.sub}
                  </span>
                )}
              </div>
            ))}
          </div>
          );
        })()}

        {/* Mock list */}
        <div className="flex flex-col" style={{ padding: "20px 16px 0", gap: 8 }}>
          <div className="flex items-baseline justify-between" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--foreground)" }}>
              Mocks
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 500 }}>
              {pack.mocks.length} tests
            </span>
          </div>
          {pack.mocks.map((mock) => (
            <MockRow key={mock.id} pack={pack} mock={mock} isNext={next?.id === mock.id} onClick={() => openMock(mock)} />
          ))}
        </div>

        {/* Past-year papers — same row UI, separate section so progress (X/N) only
            counts synthetic mocks. Hidden when the pack has no PYQ archive. */}
        {pack.pyqPapers && pack.pyqPapers.length > 0 && (
          <div className="flex flex-col" style={{ padding: "24px 16px 0", gap: 8 }}>
            <div className="flex items-baseline justify-between" style={{ marginBottom: 4 }}>
              <div className="flex flex-col" style={{ gap: 2 }}>
                <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--foreground)" }}>
                  Past Year Papers
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 500 }}>
                  Real exam papers, full-length
                </span>
              </div>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 500 }}>
                {pack.pyqPapers.length} papers
              </span>
            </div>
            {pack.pyqPapers.map((paper) => (
              <MockRow key={paper.id} pack={pack} mock={paper} onClick={() => openMock(paper)} />
            ))}
          </div>
        )}
      </div>

      {/* Sticky CTA — frosted glass to match instructions screen. Three states:
          (1) next-pending → "Resume / Continue / Start", (2) all 30 done → "View
          report card", (3) no pack data → none (handled above). */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
          backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
          padding: "12px 16px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        {next ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => openMock(next)}
            className="flex items-center justify-center w-full"
            style={{
              height: 44,
              borderRadius: 12,
              border: "none",
              gap: 8,
              cursor: "pointer",
              backgroundColor: pack.examAccent,
              boxShadow: `0 2px 8px color-mix(in srgb, ${pack.examAccent} 20%, transparent)`,
            }}
          >
            {next.status === "in-progress" ? (
              <Pause size={14} style={{ color: "var(--white)" }} />
            ) : (
              <Play size={14} style={{ color: "var(--white)", fill: "var(--white)" }} />
            )}
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--white)",
            }}>
              {next.status === "in-progress" ? "Resume" : completed === 0 ? "Start" : "Continue"} Mock {next.number}/{pack.totalMocks}
            </span>
          </motion.button>
        ) : (
          // Pack fully completed — surface the aggregate insight instead of hiding the bar.
          // TODO(api): route to a real report-card screen when one exists; for now,
          // tapping rewinds to the latest completed mock's result.
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const last = pack.mocks.filter((m) => m.status === "completed").slice(-1)[0];
              if (last) navigate(`/my-test-series/${pack.packId}/mock/${last.id}/result`);
            }}
            className="flex items-center justify-center w-full"
            style={{
              height: 44,
              borderRadius: 12,
              border: "0.5px solid color-mix(in srgb, var(--border) 70%, transparent)",
              gap: 8,
              cursor: "pointer",
              backgroundColor: "transparent",
            }}
          >
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--foreground)",
            }}>
              All {pack.totalMocks} mocks done — review your report
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
