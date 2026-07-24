/**
 * Olympiad Performance Report — the deep-dive blocks that used to live on a
 * separate /analytics page, now composed inline on the result screen (overview
 * at top → detail on scroll). `ReadinessCard` is the at-a-glance gauge for the
 * overview; `PerformanceReport` is the scrollable detail (you-vs-field, section
 * deep-dive, strengths/focus).
 *
 * Everything self-derived (readiness, your accuracy, section scores) renders at
 * any time. Cohort-relative figures (percentile, you-vs-field, cohort marker)
 * only render once `resultsOut` — before that the field is still "open".
 */

import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cohortSectionAvg, cohortPercentile, type Olympiad, type OlympiadAttempt } from "../shared/olympiads";

export function ReadinessCard({ o, attempt }: { o: Olympiad; attempt: OlympiadAttempt }) {
  const readiness = computeReadiness(o, attempt);
  return (
    <div className="flex items-center" style={{ gap: 16, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      <div className="flex items-center justify-center shrink-0" style={{
        width: 64, height: 64, borderRadius: 9999,
        background: `conic-gradient(${o.accent} ${readiness * 3.6}deg, var(--card-bg-secondary) 0deg)`,
      }}>
        <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 9999, backgroundColor: "var(--card)" }}>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)" }}>{readiness}</span>
        </div>
      </div>
      <div className="flex flex-col" style={{ gap: 2 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Readiness Index</span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
          A blend of accuracy, coverage and speed. {readiness >= 70 ? "You're on track." : "Targeted revision will move this fast."}
        </span>
      </div>
    </div>
  );
}

export function PerformanceReport({ o, attempt, resultsOut }: { o: Olympiad; attempt: OlympiadAttempt; resultsOut: boolean }) {
  const topperAvg = Math.round(o.maxScore * 0.92);
  // Cohort avg = sum of modelled per-section cohort means (distribution-backed).
  const cohortAvg = attempt.sectionBreakdown.reduce(
    (sum, sec, i) => sum + cohortSectionAvg(o, i, sec.maxScore), 0,
  );
  const { strong, focus } = split(o, attempt, resultsOut);

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      {/* You vs the field — field figures only once the cohort closes */}
      {resultsOut && (
        <div className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>You vs the field</span>
          <CompareBar label="You" value={attempt.score} max={o.maxScore} color={o.accent} bold />
          <CompareBar label="Topper avg" value={topperAvg} max={o.maxScore} color="var(--muted-foreground)" />
          <CompareBar label="Cohort avg" value={cohortAvg} max={o.maxScore} color="color-mix(in srgb, var(--muted-foreground) 50%, transparent)" />
        </div>
      )}

      {/* Section deep-dive */}
      <div className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Section deep-dive</span>
        {attempt.sectionBreakdown.map((sec, i) => {
          const selfPct = Math.round((sec.score / sec.maxScore) * 100);
          const cohort = cohortSectionAvg(o, i, sec.maxScore);
          const pctile = cohortPercentile(sec.score / sec.maxScore, cohort / sec.maxScore);
          const ahead = sec.score >= cohort;
          const acc = (sec.correct + sec.incorrect) > 0 ? Math.round((sec.correct / (sec.correct + sec.incorrect)) * 100) : 0;
          return (
            <div key={sec.section} className="flex flex-col" style={{ gap: 8 }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", fontWeight: 600 }}>{sec.section}</span>
                {resultsOut ? (
                  <span className="flex items-center" style={{ gap: 4, fontSize: "var(--text-xs)", fontWeight: 600, color: ahead ? "var(--success-500)" : "var(--error-500)" }}>
                    {ahead ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{pctile} %ile
                  </span>
                ) : (
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{acc}% accuracy</span>
                )}
              </div>
              {/* your score; cohort-average marker only once results are out */}
              <div className="relative" style={{ height: 8, borderRadius: 9999, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${selfPct}%`, borderRadius: 9999, backgroundColor: o.accent }} />
                {resultsOut && (
                  <div title="Cohort average" style={{ position: "absolute", top: -2, bottom: -2, left: `${Math.round((cohort / sec.maxScore) * 100)}%`, width: 2, backgroundColor: "var(--foreground)" }} />
                )}
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                {sec.score}/{sec.maxScore}{resultsOut ? ` · ${ahead ? `+${sec.score - cohort}` : `−${cohort - sec.score}`} vs cohort` : ""}
              </span>
            </div>
          );
        })}
        {resultsOut && (
          <div className="flex items-center" style={{ gap: 6, marginTop: 2 }}>
            <span style={{ width: 2, height: 12, backgroundColor: "var(--foreground)" }} />
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>marker = cohort average for the section</span>
          </div>
        )}
      </div>

      {/* Strengths / focus */}
      <div className="flex" style={{ gap: 8 }}>
        <TopicCard title="Strengths" icon={TrendingUp} color="var(--success-500)" topics={strong} />
        <TopicCard title="Focus next" icon={TrendingDown} color="var(--error-500)" topics={focus} />
      </div>
    </div>
  );
}

function computeReadiness(o: Olympiad, a: OlympiadAttempt): number {
  const scorePart = (a.score / a.maxScore) * 60;
  const accPart = a.attempted > 0 ? (a.correct / a.attempted) * 25 : 0;
  const coverage = (a.attempted / o.questionCount) * 15;
  return Math.round(Math.min(100, scorePart + accPart + coverage));
}

// Rank sections to split into strengths vs focus. Once results are out we rank
// by edge over the COHORT average (where you beat/trail the field). Before that
// the field is still locked, so we rank self-relative — by raw score ratio.
function split(o: Olympiad, a: OlympiadAttempt, resultsOut: boolean): { strong: string[]; focus: string[] } {
  const sorted = [...a.sectionBreakdown]
    .map((s, i) => ({
      section: s.section,
      metric: resultsOut
        ? (s.score - cohortSectionAvg(o, i, s.maxScore)) / Math.max(1, s.maxScore)
        : s.score / Math.max(1, s.maxScore),
    }))
    .sort((x, y) => y.metric - x.metric)
    .map((s) => s.section);
  const cut = Math.ceil(sorted.length / 2);
  return { strong: sorted.slice(0, cut), focus: sorted.slice(cut) };
}

function CompareBar({ label, value, max, color, bold }: { label: string; value: number; max: number; color: string; bold?: boolean }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex flex-col" style={{ gap: 4 }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: "var(--text-xs)", fontWeight: bold ? 700 : 500, color: bold ? "var(--foreground)" : "var(--muted-foreground)" }}>{label}</span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{value}/{max}</span>
      </div>
      <div style={{ height: 8, borderRadius: 9999, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
          style={{ height: "100%", borderRadius: 9999, backgroundColor: color }} />
      </div>
    </div>
  );
}

function TopicCard({ title, icon: Icon, color, topics }: { title: string; icon: typeof TrendingUp; color: string; topics: string[] }) {
  return (
    <div className="flex flex-col" style={{ gap: 8, padding: 16, borderRadius: 12, flex: 1, minWidth: 0, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      <span className="flex items-center" style={{ gap: 8, fontSize: "var(--text-xs)", fontWeight: 700, color }}>
        <Icon size={14} /> {title}
      </span>
      <div className="flex flex-col" style={{ gap: 4 }}>
        {topics.map((t) => (
          <span key={t} style={{ fontSize: "var(--text-sm)", color: "var(--foreground)" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
