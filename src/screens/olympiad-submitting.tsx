/**
 * Olympiad Submitting — the post-submit interstitial. Takes the graded
 * MockResult handed over by the take engine, computes the national rank +
 * percentile, persists the attempt, then reveals the result. The brief animated
 * "scoring against N candidates" beat recovers some of the drama that a
 * post-close (non-live) leaderboard loses.
 *
 * Route: /olympiad/:olympiadId/submitting
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { motion } from "motion/react";
import { Loader2, Users } from "lucide-react";
import {
  getOlympiadById, computeRank, useOlympiadState, formatCount,
  type OlympiadAttempt,
} from "../shared/olympiads";
import type { MockResult } from "../shared/test-series-progress";
import { OlympiadSeal } from "./olympiad-ui";

const STEPS = ["Submitting your responses", "Grading your paper", "Ranking you nationally"];

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const { olympiadId } = useParams<{ olympiadId: string }>();
  const o = olympiadId ? getOlympiadById(olympiadId) : undefined;
  const state = useOlympiadState();
  // Hold the store in a ref: useOlympiadState() returns a fresh object every
  // render, and saveAttempt() emits an event that forces a re-render. If `state`
  // were an effect dependency, that re-render would re-run the effect, whose
  // cleanup clears the step/navigation timers — and the `done` guard then blocks
  // rescheduling, leaving the interstitial stuck forever. Keep it out of deps.
  const stateRef = useRef(state);
  stateRef.current = state;
  const [step, setStep] = useState(0);
  const done = useRef(false);

  const result = (location.state as { result?: MockResult } | null)?.result;
  const timeTaken = (location.state as { timeTaken?: number } | null)?.timeTaken ?? 0;

  useEffect(() => {
    if (!o) return;
    // No result in state (e.g. refresh) — bounce straight to the result screen,
    // which falls back to the stored/seeded attempt.
    if (!result) {
      navigate(`/olympiad/${o.id}/result`, { replace: true });
      return;
    }
    if (done.current) return;
    done.current = true;

    const { rank, percentile } = computeRank(o, result.totalScore);
    const attempt: OlympiadAttempt = {
      olympiadId: o.id,
      score: result.totalScore,
      maxScore: o.maxScore,
      attempted: result.attempted,
      correct: result.correct,
      incorrect: result.incorrect,
      unanswered: result.unanswered,
      timeTakenSeconds: timeTaken || result.timeTakenSeconds,
      sectionBreakdown: result.sectionBreakdown,
      perQuestion: result.perQuestion,
      rank,
      percentile,
      submittedAt: Date.now(),
    };
    stateRef.current.saveAttempt(attempt);

    const t1 = setTimeout(() => setStep(1), 700);
    const t2 = setTimeout(() => setStep(2), 1500);
    const t3 = setTimeout(() => navigate(`/olympiad/${o.id}/result`, { replace: true }), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // state intentionally omitted — read via stateRef to avoid re-running this effect
  }, [o, result, timeTaken, navigate]);

  if (!o) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: "100dvh", backgroundColor: "var(--background)" }}>
        <span style={{ color: "var(--foreground)" }}>Olympiad not found</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center" style={{
      minHeight: "100dvh", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)",
      padding: 24, gap: 24,
    }}>
      <OlympiadSeal o={o} size={64} />

      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Loader2 size={32} style={{ color: o.accent }} />
      </motion.div>

      <span className="sr-only" role="status" aria-live="polite">{STEPS[step]}</span>

      <div className="flex flex-col items-center" style={{ gap: 8, minHeight: 56 }}>
        {STEPS.map((label, i) => (
          <motion.span
            key={label}
            animate={{ opacity: i === step ? 1 : i < step ? 0.4 : 0.2 }}
            style={{
              fontSize: "var(--text-base)", fontWeight: i === step ? 700 : 500,
              color: i === step ? "var(--foreground)" : "var(--muted-foreground)",
            }}
          >
            {label}
          </motion.span>
        ))}
      </div>

      <span className="flex items-center" style={{ gap: 8, fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
        <Users size={13} /> Against {formatCount(o.participantCount)} candidates nationwide
      </span>
    </div>
  );
}
