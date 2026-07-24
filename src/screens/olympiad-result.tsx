/**
 * Olympiad Result — the post-close reveal moment. Animated rank count-up +
 * percentile band first (celebration), then the score/accuracy drill-down,
 * section breakdown, and "distance to the next rung" nudge. Results are
 * private-by-default and framed on percentile; the rank is shown to the user but
 * sharing is explicit (opt-in) via the certificate ShareSheet. A `?practice=1`
 * variant shows an unrated score with no rank/leaderboard/certificate.
 *
 * Route: /olympiad/:olympiadId/result
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router";
import { motion } from "motion/react";
import {
  Trophy, Award, MessageSquare, Share2, ListOrdered, Target, Info, Gift,
  Lock, CheckCircle2,
} from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import {
  getOlympiadById, olympiadStatus, useOlympiadState, isRankCertificate, buildOlympiadCertificate,
  computeRank, formatCount, prizeForRank, rewardKind, type Olympiad, type OlympiadAttempt,
} from "../shared/olympiads";
import type { MockResult } from "../shared/test-series-progress";
import { ConfettiBurst, ShareSheet } from "./certificate-view";
import { OlympiadSeal, MetricTile, OlympiadHeader, CountdownBlocks, OlympiadTag } from "./olympiad-ui";
import { ReadinessCard, PerformanceReport } from "./olympiad-report";

function percentileBand(p: number): { label: string; color: string } {
  if (p >= 99) return { label: "Top 1% nationally", color: "var(--warning-500)" };
  if (p >= 95) return { label: "Top 5% nationally", color: "var(--success-500)" };
  if (p >= 90) return { label: "Top 10% nationally", color: "var(--success-500)" };
  if (p >= 75) return { label: "Top 25% nationally", color: "var(--primary-400)" };
  if (p >= 50) return { label: "Above the median", color: "var(--primary-400)" };
  return { label: "Keep climbing", color: "var(--muted-foreground)" };
}

// Inverse of computeRank's percentile curve → marks needed for a target rank.
function marksForRank(o: Olympiad, targetRank: number): number {
  const targetPercentile = Math.max(0, 100 * (1 - targetRank / o.participantCount));
  const pct = Math.pow(targetPercentile / 100, 1 / 0.55);
  return Math.round(pct * o.maxScore);
}

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { olympiadId } = useParams<{ olympiadId: string }>();
  const o = olympiadId ? getOlympiadById(olympiadId) : undefined;
  const state = useOlympiadState();
  const [showShare, setShowShare] = useState(false);

  const practice = searchParams.get("practice") === "1";

  if (!o) return <NotFound onBack={() => navigate("/olympiad")} />;

  // Practice: build an unrated attempt-like object straight from the passed result.
  const practiceResult = (location.state as { result?: MockResult } | null)?.result;
  const stored = state.getAttempt(o.id);

  const attempt: OlympiadAttempt | undefined = practice && practiceResult
    ? {
        olympiadId: o.id,
        score: practiceResult.totalScore,
        maxScore: o.maxScore,
        attempted: practiceResult.attempted,
        correct: practiceResult.correct,
        incorrect: practiceResult.incorrect,
        unanswered: practiceResult.unanswered,
        timeTakenSeconds: practiceResult.timeTakenSeconds,
        sectionBreakdown: practiceResult.sectionBreakdown,
        ...computeRank(o, practiceResult.totalScore),
        submittedAt: Date.now(),
      }
    : stored;

  // Results-out gate: a real (non-practice) attempt can't reveal its RANK during
  // the live/grading window — everyone sits the same paper, so the leaderboard,
  // percentile, certificate and rewards only publish once the window closes.
  // But the candidate's OWN performance (score, accuracy, section split) needs
  // nothing from the cohort, so we surface it immediately as a submitted-report
  // rather than a dead-end lock screen.
  if (!practice && stored && !olympiadStatus(o).resultsOut) {
    const sub = olympiadStatus(o);
    const subAcc = stored.attempted > 0 ? Math.round((stored.correct / stored.attempted) * 100) : 0;
    return (
      <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
        <GlassHeader><StatusBar /><OlympiadHeader title="Submitted" onBack={() => navigate(`/olympiad/${o.id}`)} /></GlassHeader>

        <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 32px", gap: 20 }}>
          {/* Submitted confirmation — what's done, what's next */}
          <div className="flex flex-col items-center text-center" style={{ gap: 12, padding: 24, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
              <CheckCircle2 size={56} style={{ color: "var(--success-500)" }} strokeWidth={2} />
            </motion.div>
            <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)" }}>Your responses are in</span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", maxWidth: 320, lineHeight: 1.5 }}>
              {sub.phase === "grading"
                ? "The window has closed and papers are being graded. Your rank and the rankings go live shortly."
                : "Everyone sits the same paper at the same time. Your rank, rankings and certificate unlock once the window closes — so it's fair for all."}
            </span>
          </div>

          {/* Immediate self-report — needs nothing from the cohort */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", padding: "0 4px" }}>Your performance</span>
            <div className="flex" style={{ gap: 8 }}>
              <MetricTile label="Score" value={`${stored.score}`} sub={`/ ${stored.maxScore}`} color={o.accent} />
              <MetricTile label="Accuracy" value={`${subAcc}%`} sub={`${stored.correct}/${stored.attempted}`} />
              <MetricTile label="Attempted" value={`${stored.attempted}`} sub={`of ${o.questionCount}`} />
            </div>
            <div className="flex" style={{ gap: 8 }}>
              <MetricTile label="Correct" value={`${stored.correct}`} color="var(--success-500)" />
              <MetricTile label="Incorrect" value={`${stored.incorrect}`} color="var(--error-500)" />
              <MetricTile label="Skipped" value={`${stored.unanswered}`} />
            </div>
          </div>

          {/* Readiness + full self-report inline — provisional, no cohort/rank */}
          <ReadinessCard o={o} attempt={stored} />
          <PerformanceReport o={o} attempt={stored} resultsOut={false} />

          {/* Unlocks at results — credibility gate + countdown */}
          <div className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <span className="flex items-center" style={{ gap: 8, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
              <Lock size={15} style={{ color: "var(--muted-foreground)" }} /> Unlocks when results publish
            </span>
            <div className="flex flex-col" style={{ gap: 6 }}>
              {["All-India rank & percentile", "National rankings", "Your certificate", "Reward claim (if you've won)"].map((t) => (
                <span key={t} className="flex items-center" style={{ gap: 8, fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  <span style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: "var(--muted-foreground)", flexShrink: 0 }} /> {t}
                </span>
              ))}
            </div>
            <div className="flex flex-col items-center" style={{ gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4 }}>Results in</span>
              <CountdownBlocks to={o.resultsAt} accent={o.accent} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
        <GlassHeader><StatusBar /><OlympiadHeader title="Result" onBack={() => navigate(`/olympiad/${o.id}`)} /></GlassHeader>
        <div className="flex flex-col items-center justify-center text-center" style={{ flex: 1, gap: 12, padding: 24 }}>
          <Trophy size={40} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>You didn't sit this Olympiad</span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", maxWidth: 280 }}>
            The window has closed and the paper isn't replayable — but you can see how the nation did.
          </span>
          <div className="flex" style={{ gap: 8, marginTop: 8 }}>
            <button onClick={() => navigate(`/olympiad/${o.id}/leaderboard`)}
              style={{ height: 44, padding: "0 16px", borderRadius: 12, border: "none", color: "var(--white)", backgroundColor: "var(--primary-500)", fontWeight: 600, fontSize: "var(--text-sm)", cursor: "pointer" }}>
              View leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pct = Math.round((attempt.score / attempt.maxScore) * 100);
  const accuracy = attempt.attempted > 0 ? Math.round((attempt.correct / attempt.attempted) * 100) : 0;
  const band = percentileBand(attempt.percentile);
  const ranked = isRankCertificate(o, attempt.rank);

  // Distance to next rung — only meaningful for ranked attempts.
  const nextTargets = [o.rankCertThreshold, 1000, 100, 10, 1].filter((t) => t < attempt.rank);
  const nextTarget = nextTargets.length ? Math.max(...nextTargets) : null;
  const marksToNext = nextTarget ? Math.max(0, marksForRank(o, nextTarget) - attempt.score) : 0;

  // Reward (non-merit) is promoted to a callout right under the rank — it's the
  // single most important action for a winner, not a row to bury below.
  const wonPrize = !practice ? prizeForRank(o, attempt.rank) : null;
  const showReward = !!wonPrize && rewardKind(wonPrize) !== "merit";

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        {/* Real result is now entered straight from the home card → back to the
            hub, not the (skipped) detail page. Practice is launched from detail. */}
        <OlympiadHeader title={practice ? "Practice result" : "Your result"} onBack={() => navigate(practice ? `/olympiad/${o.id}` : "/olympiad")} />
      </GlassHeader>

      {!practice && <ConfettiBurst />}

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 32px", gap: 20 }}>
        {practice && (
          <div className="flex items-center" style={{ gap: 12, padding: 12, borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", border: "0.5px solid var(--border)" }}>
            <Info size={16} style={{ color: "var(--muted-foreground)" }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
              Practice attempt — your score isn't counted on the official rankings.
            </span>
          </div>
        )}

        {/* Reveal */}
        <div className="flex flex-col items-center text-center" style={{
          gap: 12, padding: 24, borderRadius: 16,
          backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
        }}>
          <OlympiadSeal o={o} size={48} />
          {!practice ? (
            <>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
                All-India Rank
              </span>
              <RankCountUp rank={attempt.rank} accent={o.accent} />
              {/* Canonical OlympiadTag (radius 8 + d2/d4/500) so the band matches
                  every other tag in the feature instead of a one-off color-mix pill. */}
              <OlympiadTag
                label={`${band.label} · ${attempt.percentile} %ile`}
                variant={attempt.percentile >= 99 ? "warning" : attempt.percentile >= 75 ? "success" : "neutral"}
              />
            </>
          ) : (
            <span style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: o.accent }}>
              {attempt.score}<span style={{ color: "var(--muted-foreground)", fontSize: "var(--text-lg)" }}>/{attempt.maxScore}</span>
            </span>
          )}
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
            out of {formatCount(o.participantCount)} candidates
          </span>
          {/* Leaderboard paired with the rank — the natural next step. A solid
              primary CTA (our button language) so it reads clearly, not a faint
              ghost pill that disappears into the card. */}
          {!practice && (
            <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => navigate(`/olympiad/${o.id}/leaderboard`)}
              className="flex items-center justify-center w-full"
              style={{
                marginTop: 8, height: 44, borderRadius: 12, gap: 8, cursor: "pointer", border: "none",
                backgroundColor: "var(--primary-500)", color: "var(--white)",
                fontSize: "var(--text-sm)", fontWeight: 600,
              }}>
              <ListOrdered size={16} /> View full rankings
            </motion.button>
          )}
        </div>

        {/* Reward — promoted right under the rank for winners */}
        {showReward && wonPrize && (
          <RewardCallout reward={wonPrize.reward} onClick={() => navigate(`/olympiad/${o.id}/claim`)} />
        )}

        {/* Overview — at-a-glance metrics + readiness */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <div className="flex" style={{ gap: 8 }}>
            <MetricTile label="Score" value={`${attempt.score}`} sub={`/ ${attempt.maxScore}`} />
            <MetricTile label="Percentile" value={`${attempt.percentile}`} sub="national" />
            <MetricTile label="Accuracy" value={`${accuracy}%`} sub={`${attempt.correct}/${attempt.attempted}`} />
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <MetricTile label="Correct" value={`${attempt.correct}`} color="var(--success-500)" />
            <MetricTile label="Incorrect" value={`${attempt.incorrect}`} color="var(--error-500)" />
            <MetricTile label="Skipped" value={`${attempt.unanswered}`} />
          </div>
        </div>
        {!practice && <ReadinessCard o={o} attempt={attempt} />}

        {/* Detailed report — you-vs-field, section deep-dive, strengths/focus */}
        <PerformanceReport o={o} attempt={attempt} resultsOut={!practice} />

        {/* Distance to next rung — forward nudge after the deep-dive */}
        {!practice && nextTarget && marksToNext > 0 && (
          <div className="flex items-center" style={{ gap: 12, padding: 16, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <Target size={18} style={{ color: o.accent }} />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)" }}>
              <b>{marksToNext} marks</b> from the Top {nextTarget.toLocaleString("en-IN")} — the next Olympiad is your shot.
            </span>
          </div>
        )}

        {/* What next */}
        {!practice ? (
          <div className="flex flex-col" style={{ gap: 12 }}>
            {/* Certificate — the keepsake. Promoted to a card and made the single
                home for sharing (verifiable artifact > a generic result card). */}
            <div className="flex flex-col" style={{
              gap: 12, padding: 16, borderRadius: 16, backgroundColor: "var(--card)",
              border: "0.5px solid color-mix(in srgb, var(--warning-500) 30%, var(--border))",
            }}>
              <div className="flex items-center" style={{ gap: 12 }}>
                <div className="flex items-center justify-center shrink-0" style={{
                  width: 40, height: 40, borderRadius: 8,
                  backgroundColor: "color-mix(in srgb, var(--warning-500) 16%, transparent)",
                }}>
                  <Award size={20} style={{ color: "var(--warning-500)" }} />
                </div>
                <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                    {ranked ? "Your rank certificate" : "Participation certificate"}
                  </span>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                    {ranked ? `Verifiable · AIR #${attempt.rank.toLocaleString("en-IN")}` : "Verifiable credential"}
                  </span>
                </div>
              </div>
              <div className="flex" style={{ gap: 8 }}>
                <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => setShowShare(true)}
                  className="flex items-center justify-center" style={{
                    flex: 1, height: 36, borderRadius: 8, gap: 8, cursor: "pointer",
                    border: "1px solid var(--white-alpha-25)", backgroundColor: "transparent",
                    color: "var(--foreground)", fontSize: "var(--text-sm)", fontWeight: 600,
                  }}>
                  <Share2 size={16} /> Share
                </motion.button>
                <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => navigate(`/olympiad/${o.id}/certificate`)}
                  className="flex items-center justify-center" style={{
                    flex: 1, height: 36, borderRadius: 8, border: "none", cursor: "pointer",
                    backgroundColor: "var(--primary-500)", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600,
                  }}>
                  View certificate
                </motion.button>
              </div>
            </div>

            {/* Feedback — quiet tertiary */}
            <button type="button" onClick={() => navigate(`/olympiad/${o.id}/feedback`)}
              className="flex items-center justify-center w-full" style={{
                height: 40, borderRadius: 12, gap: 6, cursor: "pointer", border: "none",
                backgroundColor: "transparent", color: "var(--muted-foreground)", fontSize: "var(--text-sm)", fontWeight: 600,
              }}>
              <MessageSquare size={15} /> Share feedback
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => navigate(`/olympiad/${o.id}/leaderboard`)}
            className="flex items-center justify-center w-full"
            style={{ height: 44, borderRadius: 12, border: "none", cursor: "pointer", backgroundColor: "var(--primary-500)", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
            See the official leaderboard
          </button>
        )}
      </div>

      {showShare && !practice && (
        <ShareSheet certificate={buildOlympiadCertificate(o, attempt)} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

function RewardCallout({ reward, onClick }: { reward: string; onClick: () => void }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.99 }} onClick={onClick}
      className="flex items-center w-full text-left"
      style={{ gap: 12, padding: 16, borderRadius: 16, cursor: "pointer", backgroundColor: "var(--card)", border: "0.5px solid color-mix(in srgb, var(--warning-500) 40%, var(--border))" }}>
      <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "var(--warning-d2)", border: "0.5px solid var(--warning-d4)" }}>
        <Gift size={20} style={{ color: "var(--warning-500)" }} />
      </div>
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>You won a reward</span>
        <span className="truncate" style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{reward}</span>
      </div>
      <span className="inline-flex items-center justify-center shrink-0" style={{ height: 32, padding: "0 16px", borderRadius: 9999, backgroundColor: "var(--warning-500)", color: "var(--white)", fontSize: "var(--text-xs)", fontWeight: 700 }}>Claim</span>
    </motion.button>
  );
}

function RankCountUp({ rank, accent }: { rank: number; accent: string }) {
  const [display, setDisplay] = useState(rank > 5000 ? rank : 0);
  useEffect(() => {
    const target = rank;
    const start = Math.min(target, 5000);
    const duration = 900;
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (p >= 1) clearInterval(id);
    }, 32);
    return () => clearInterval(id);
  }, [rank]);
  return (
    <span style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
      #{display.toLocaleString("en-IN")}
    </span>
  );
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", overflow: "hidden", gap: 12, backgroundColor: "var(--background)" }}>
      <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>Olympiad not found</span>
      <button onClick={onBack} style={{ color: "var(--primary-400)", background: "none", border: "none", cursor: "pointer", fontSize: "var(--text-sm)" }}>Back to Olympiads</button>
    </div>
  );
}
