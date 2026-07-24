/**
 * Arena Play — the Daily Sprint. A ladder of questions, easy → hard, with lives,
 * a per-question speed countdown that rewards fast-and-accurate, and a live rank
 * that climbs as you score. Run ends when the ladder is cleared or lives run out.
 *
 * Route: /arena/play
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, Check } from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import { arenaBack } from "./arena-ui";
import {
  useArenaState, activeSubjectId, getSprintQuestions, getEventQuestions, questionPoints, subjectLevel,
  SPRINT_LIVES, EVENT_LIVES, type SprintQuestion, type ReviewItem,
} from "../shared/arena";

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, completeSprint, completeEvent } = useArenaState();
  const isEvent = params.get("mode") === "event";
  // Targeted practice from the Mastery map: ?subject=<id>&focus=<concept>.
  const focusConcept = params.get("focus") ?? undefined;
  const paramSubject = params.get("subject");
  const subjectId = !isEvent && paramSubject && state.subjects.includes(paramSubject) ? paramSubject : activeSubjectId(state);
  const maxLives = isEvent ? EVENT_LIVES : SPRINT_LIVES;
  // Your SKILL level sets how hard this sprint's questions are.
  const playLevel = subjectLevel(state, subjectId);
  const questions = useRef<SprintQuestion[]>(isEvent ? getEventQuestions(subjectId) : getSprintQuestions(subjectId, playLevel, focusConcept)).current;

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(questions[0].perSeconds);
  const [disp, setDisp] = useState({ xp: 0, lives: maxLives, streak: 0 });

  // Refs are the source of truth (closures in timers/timeouts stay correct).
  const xpRef = useRef(0);
  const correctRef = useRef(0);
  const incorrectRef = useRef(0);
  const livesRef = useRef(maxLives);
  const streakRef = useRef(0);
  const bestRef = useRef(0);
  const answeredCountRef = useRef(0);
  const answeredRef = useRef(false);
  const endedRef = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reviewRef = useRef<ReviewItem[]>([]); // per-question, for the post-arena review

  // Events don't draw from the daily-sprint energy pool; sprints do.
  const blocked = isEvent ? false : state.energy <= 0;
  const q = questions[i];
  const inFeedback = picked !== null;

  // No sprints left → a direct deep-link / refresh can't be used to grind free XP.
  useEffect(() => {
    if (blocked) navigate("/arena", { replace: true });
  }, [blocked, navigate]);

  function finish() {
    if (endedRef.current) return;
    endedRef.current = true;
    const answered = answeredCountRef.current;
    const accuracy = answered > 0 ? Math.round((correctRef.current / answered) * 100) : 0;
    const reachedLevel = Math.min(i + 1, questions.length);
    const ranOutOfLives = livesRef.current <= 0;
    if (isEvent) {
      completeEvent({
        score: xpRef.current, correct: correctRef.current, incorrect: incorrectRef.current,
        answered, accuracy, bestStreak: bestRef.current, reachedLevel, ranOutOfLives,
        review: reviewRef.current,
      });
      navigate("/arena/result?mode=event", { replace: true });
    } else {
      completeSprint({
        xp: xpRef.current, correct: correctRef.current, incorrect: incorrectRef.current,
        answered, bestStreak: bestRef.current, accuracy, reachedLevel, ranOutOfLives,
        review: reviewRef.current,
      });
      navigate("/arena/result", { replace: true });
    }
  }

  function advance() {
    if (i >= questions.length - 1 || livesRef.current <= 0) { finish(); return; }
    answeredRef.current = false;
    setI((n) => n + 1);
  }

  function answer(choice: number | null) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    answeredCountRef.current += 1;
    const isCorrect = choice === q.correct;
    reviewRef.current.push({ prompt: q.prompt, options: q.options, correct: q.correct, picked: choice, concept: q.concept, explanation: q.explanation });
    if (isCorrect) {
      xpRef.current += questionPoints(q, true, secondsLeft);
      correctRef.current += 1;
      streakRef.current += 1;
      if (streakRef.current > bestRef.current) bestRef.current = streakRef.current;
    } else {
      incorrectRef.current += 1;
      streakRef.current = 0;
      livesRef.current -= 1;
    }
    setPicked(choice ?? -1);
    setDisp({ xp: xpRef.current, lives: livesRef.current, streak: streakRef.current });
    advanceTimer.current = setTimeout(advance, 1150);
  }

  // Per-question countdown. Re-armed each time the question index changes.
  useEffect(() => {
    if (blocked) return;
    answeredRef.current = false;
    setPicked(null);
    setSecondsLeft(q.perSeconds);
    const start = Date.now();
    const id = setInterval(() => {
      if (answeredRef.current) return;
      const left = q.perSeconds - (Date.now() - start) / 1000;
      if (left <= 0) { clearInterval(id); setSecondsLeft(0); answer(null); }
      else setSecondsLeft(left);
    }, 100);
    return () => { clearInterval(id); if (advanceTimer.current) clearTimeout(advanceTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  if (blocked) return null;

  const pct = Math.max(0, Math.min(100, (secondsLeft / q.perSeconds) * 100));
  const barColor = pct > 50 ? "var(--success-500)" : pct > 20 ? "var(--warning-500)" : "var(--error-500)";

  // Question-format kicker (CSS-uppercased in the header) — "True or False", etc.
  const TYPE_LABEL: Record<string, string> = {
    mcq: "Multiple Choice", multi: "Select All", boolean: "True or False",
    fill: "Fill in the Blank", match: "Match", order: "Put in Order", assertion: "Assertion & Reason",
  };
  const typeLabel = TYPE_LABEL[q.type ?? "mcq"] ?? "Quiz";

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <StatusBar />

      {/* Top bar — exit · level + question position · lives */}
      <div className="flex items-center" style={{ height: 52, padding: "0 12px", gap: 12 }}>
        <button onClick={() => arenaBack(navigate)} aria-label="Exit sprint" className="flex items-center justify-center shrink-0"
          style={{ width: 36, height: 36, background: "none", border: "none", cursor: "pointer" }}>
          <X size={20} style={{ color: "var(--muted-foreground)" }} />
        </button>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
          {isEvent ? (
            <>Question {i + 1}<span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>/{questions.length}</span></>
          ) : (
            <>Level {playLevel}<span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}> · Q {i + 1}/{questions.length}</span></>
          )}
        </span>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--success-500)" }}>
          {typeLabel}
        </span>
        {focusConcept && !isEvent && (
          <span className="truncate" style={{
            maxWidth: 140, fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--primary-300)",
            backgroundColor: "color-mix(in srgb, var(--primary-500) 16%, transparent)",
            padding: "2px 8px", borderRadius: 9999,
          }}>
            Focus · {focusConcept}
          </span>
        )}
        <div className="flex-1" />
        <div className="flex items-center" style={{ gap: 4 }}>
          {Array.from({ length: maxLives }).map((_, k) => (
            <Heart key={k} size={16}
              fill={k < disp.lives ? "var(--error-500)" : "transparent"}
              style={{ color: k < disp.lives ? "var(--error-500)" : "var(--muted-foreground)" }} />
          ))}
        </div>
      </div>

      {/* Speed bar */}
      <div style={{ height: 4, margin: "0 12px", borderRadius: 9999, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: barColor, borderRadius: 9999, transition: "width 0.1s linear" }} />
      </div>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 justify-center overflow-y-auto" style={{ padding: "32px 20px", gap: 28 }}>
        {/* Question */}
        <span style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.35 }}>{q.prompt}</span>

        {/* Options */}
        <div className="flex flex-col" style={{ gap: 16 }}>
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correct;
            const isPicked = picked === idx;
            let bg = "var(--card)", border = "0.5px solid var(--border)", fg = "var(--foreground)";
            if (inFeedback) {
              if (isCorrect) { bg = "color-mix(in srgb, var(--success-500) 16%, transparent)"; border = "1px solid var(--success-500)"; fg = "var(--success-500)"; }
              else if (isPicked) { bg = "color-mix(in srgb, var(--error-500) 16%, transparent)"; border = "1px solid var(--error-500)"; fg = "var(--error-500)"; }
              else { fg = "var(--muted-foreground)"; }
            }
            return (
              <motion.button
                key={idx}
                whileTap={inFeedback ? undefined : { scale: 0.99 }}
                disabled={inFeedback}
                onClick={() => answer(idx)}
                className="flex items-center justify-between text-left w-full"
                style={{
                  minHeight: 64, padding: "16px 20px", borderRadius: 12, gap: 12,
                  backgroundColor: bg, border, cursor: inFeedback ? "default" : "pointer",
                  fontSize: "var(--text-lg)", fontWeight: 600, color: fg,
                }}
              >
                <span>{opt}</span>
                {inFeedback && isCorrect && <Check size={18} style={{ color: "var(--success-500)", flexShrink: 0 }} />}
                {inFeedback && isPicked && !isCorrect && <X size={18} style={{ color: "var(--error-500)", flexShrink: 0 }} />}
              </motion.button>
            );
          })}
        </div>

        {/* Feedback line — fixed-height slot so revealing it doesn't shift the
            vertically-centred question/options. */}
        <div className="flex items-center justify-center" style={{ minHeight: 24 }}>
          <AnimatePresence>
            {inFeedback && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center" style={{ gap: 8 }}>
                {picked === q.correct
                  ? <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--success-500)" }}>Correct · +{questionPoints(q, true, secondsLeft)} pts</span>
                  : <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--error-500)" }}>{picked === -1 ? "Time's up" : "Not quite"} · −1 life</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
