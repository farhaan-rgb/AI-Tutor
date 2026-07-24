/**
 * Daily Drill — solo 10-question daily quiz for all grades.
 * Route: /marketplace/game/daily-sprint/play  (id stable; UI title rebranded)
 *
 * Phases:
 *   1. intro    — current streak display + "Start sprint" CTA
 *   2. playing  — 10 questions, 12s each, single timer per Q
 *   3. result   — correct/wrong/skipped breakdown, streak +1 animation,
 *                  pass-aware trial gate (sheet) or quiet cross-sell
 *
 * No opponent simulation (solo game). 7-day perfect streak = bonus reward.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Trophy, Sparkles, ChevronRight } from "lucide-react";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { useGamesPass } from "../shared/games-pass-state";
import { GAMES_PASS, DUMMY_GAMES } from "./marketplace-v1";
import {
  TopExitBar,
  DailyComparisonStrip,
  NextSessionEta,
  OtherGamesRail,
  DismissCTA,
  DifficultyPicker,
  HowToButton,
  HowToSheet,
  HintButton,
  MAX_HINTS,
  getVibe,
  type Difficulty,
  type HowToStep,
} from "../shared/game-result-shared";

// Difficulty maps to per-question time pressure (only thing varying for Daily Drill).
const QUESTION_DURATION_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 18,
  medium: 12,
  hard: 8,
};

const HOW_TO_STEPS: HowToStep[] = [
  { title: "Read each question", body: "Quick mixed-topic questions across Math, English, Science, GK." },
  { title: "Tap your answer", body: "4 options per question. Beat the timer for streak credit." },
  { title: "Keep the streak alive", body: "Play once a day. 7 days perfect = bonus reward." },
];

const QUESTION_DURATION_SEC = 12;  // default, overridden by difficulty
const TOTAL_QUESTIONS = 10;
const ACCENT = "var(--success-500)"; // Daily Sprint's per-game green accent
const CURRENT_STREAK = 4; // TODO(api): from server

// All-grades daily mix — warm-up questions across Math, Science, GK, English
// that work as far down as Class 1–3. Used here as demo stubs.
type DemoQ = { id: string; stem: string; options: string[]; correctIdx: number; topic: string };
const DEMO_QUESTIONS: DemoQ[] = [
  { id: "ds1",  stem: "How many days are in a week?",                          options: ["5", "6", "7", "8"],                       correctIdx: 2, topic: "Math" },
  { id: "ds2",  stem: "What color do you get by mixing red and yellow?",       options: ["Green", "Orange", "Purple", "Brown"],     correctIdx: 1, topic: "GK" },
  { id: "ds3",  stem: "What is 8 + 5?",                                        options: ["12", "13", "14", "15"],                   correctIdx: 1, topic: "Math" },
  { id: "ds4",  stem: "How many letters are in the English alphabet?",         options: ["24", "25", "26", "27"],                   correctIdx: 2, topic: "English" },
  { id: "ds5",  stem: "What do bees make?",                                    options: ["Milk", "Honey", "Wax only", "Silk"],      correctIdx: 1, topic: "Science" },
  { id: "ds6",  stem: "Which season comes right after summer?",                options: ["Winter", "Spring", "Monsoon", "Autumn"],  correctIdx: 3, topic: "GK" },
  { id: "ds7",  stem: "What is half of 20?",                                   options: ["5", "10", "15", "12"],                    correctIdx: 1, topic: "Math" },
  { id: "ds8",  stem: "The opposite of 'big' is:",                             options: ["Tall", "Small", "Round", "Fat"],          correctIdx: 1, topic: "English" },
  { id: "ds9",  stem: "How many hours are in a day?",                          options: ["12", "20", "24", "30"],                   correctIdx: 2, topic: "Math" },
  { id: "ds10", stem: "Which is the smallest planet in our solar system?",     options: ["Earth", "Mars", "Mercury", "Venus"],      correctIdx: 2, topic: "Science" },
];

type Phase = "intro" | "playing" | "result";

export function Component() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const pass = useGamesPass();

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [showHowTo, setShowHowTo] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const questionDurationSec = QUESTION_DURATION_BY_DIFFICULTY[difficulty];

  // Daily Drill is a free game (hybrid model) — no trial gate, no Pass check.
  // The result-screen cross-sell card handles soft conversion to the Pass for
  // non-pass users without blocking the play loop.
  const [qIdx, setQIdx] = useState(0);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [answers, setAnswers] = useState<("correct" | "wrong" | "skipped")[]>([]);
  const [timeLeft, setTimeLeft] = useState(questionDurationSec);
  const [revealed, setRevealed] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [eliminatedIdxs, setEliminatedIdxs] = useState<Set<number>>(new Set());
  const vibe = getVibe(difficulty);

  function useFiftyFifty() {
    if (hintsLeft <= 0 || chosenIdx !== null || revealed) return;
    const wrongIdxs = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== currentQ.correctIdx && !eliminatedIdxs.has(i));
    if (wrongIdxs.length < 2) return;
    // Shuffle and take 2
    const shuffled = [...wrongIdxs].sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedIdxs(new Set([...eliminatedIdxs, ...shuffled]));
    setHintsLeft((h) => h - 1);
  }

  const currentQ = DEMO_QUESTIONS[qIdx];
  const correctCount = answers.filter((a) => a === "correct").length;
  const wrongCount = answers.filter((a) => a === "wrong").length;
  const skippedCount = answers.filter((a) => a === "skipped").length;

  // Tick the per-Q timer during playing
  useEffect(() => {
    if (phase !== "playing" || revealed) return;
    setTimeLeft(questionDurationSec);
    setChosenIdx(null);
    setEliminatedIdxs(new Set());
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, qIdx, revealed]);

  // Auto-reveal when timer hits 0 with no answer (counts as skipped)
  useEffect(() => {
    if (phase !== "playing" || revealed) return;
    if (timeLeft === 0) {
      setAnswers((a) => [...a, "skipped"]);
      setRevealed(true);
    }
  }, [phase, timeLeft, revealed]);

  // After reveal, advance to next question OR result
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => {
      setRevealed(false);
      if (qIdx + 1 >= TOTAL_QUESTIONS) {
        setPhase("result");
      } else {
        setQIdx((i) => i + 1);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [revealed, qIdx]);

  function pickOption(idx: number) {
    if (phase !== "playing" || revealed) return;
    setChosenIdx(idx);
    const correct = idx === currentQ.correctIdx;
    setAnswers((a) => [...a, correct ? "correct" : "wrong"]);
    setRevealed(true);
  }

  function startSprint() {
    setPhase("playing");
    setQIdx(0);
    setAnswers([]);
    setRevealed(false);
    setHintsLeft(MAX_HINTS);
    setEliminatedIdxs(new Set());
  }

  const containerStyle: React.CSSProperties = {
    fontFamily: "var(--font-family-inter)",
    backgroundColor: "var(--background)",
    height: "100dvh",
    overflow: "hidden",
    maxWidth: isDesktop ? 720 : undefined,
    marginLeft: isDesktop ? "auto" : undefined,
    marginRight: isDesktop ? "auto" : undefined,
  };

  // ─── INTRO ────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="flex flex-col" style={containerStyle}>
        <TopExitBar onExit={() => navigate(-1)} />
        <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: 24, gap: 24 }}>
          <span style={{
            fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.2,
            color: "var(--muted-foreground)", textTransform: "uppercase",
          }}>
            Daily Drill
          </span>

          {/* Streak display — large flame + day count */}
          <div className="flex flex-col items-center" style={{ gap: 12 }}>
            <div style={{
              position: "relative",
              width: 120, height: 120,
              borderRadius: 9999,
              background: `radial-gradient(circle, color-mix(in srgb, ${ACCENT} 30%, var(--background)) 0%, var(--background) 80%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 40px color-mix(in srgb, ${ACCENT} 30%, transparent)`,
            }}>
              <span style={{
                fontSize: 56, fontWeight: 800,
                color: ACCENT, lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}>
                {CURRENT_STREAK}
              </span>
            </div>
            <span style={{ fontSize: "var(--text-base)", color: "var(--foreground)", fontWeight: 700 }}>
              Day {CURRENT_STREAK} streak
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center", lineHeight: 1.5 }}>
              {CURRENT_STREAK < 7
                ? `${7 - CURRENT_STREAK} more days for a bonus reward`
                : "You've earned this week's bonus reward!"}
            </span>
          </div>

          {/* Today's mix preview */}
          <div className="flex items-center" style={{
            gap: 16,
            padding: "12px 20px",
            borderRadius: 12,
            backgroundColor: "var(--card)",
            border: "0.5px solid var(--border)",
          }}>
            <div className="flex flex-col items-center" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
                {TOTAL_QUESTIONS}
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", letterSpacing: 0.4, textTransform: "uppercase" }}>
                Questions
              </span>
            </div>
            <span style={{ width: 1, height: 24, backgroundColor: "var(--border)" }} />
            <div className="flex flex-col items-center" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
                {questionDurationSec}s
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", letterSpacing: 0.4, textTransform: "uppercase" }}>
                Per question
              </span>
            </div>
            <span style={{ width: 1, height: 24, backgroundColor: "var(--border)" }} />
            <div className="flex flex-col items-center" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>
                Mixed
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", letterSpacing: 0.4, textTransform: "uppercase" }}>
                Topics
              </span>
            </div>
          </div>

          <DifficultyPicker value={difficulty} onChange={setDifficulty} accent={ACCENT} />

          <HowToButton onTap={() => setShowHowTo(true)} accent={ACCENT} />

          {/* Start CTA — 44h / 14|600 / primary-500. Game theme stays in the
              page background + streak chip; CTA follows brand primary. */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={startSprint}
            className="flex items-center justify-center"
            style={{
              width: "100%", maxWidth: 320, height: 44, borderRadius: 12, gap: 8, border: "none",
              backgroundColor: "var(--primary-500)", cursor: "pointer",
            }}
          >
            <Sparkles size={16} style={{ color: "var(--white)" }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)" }}>
              Start today's sprint
            </span>
          </motion.button>
        </div>
        <HowToSheet
          open={showHowTo}
          gameTitle="Daily Drill"
          steps={HOW_TO_STEPS}
          accent={ACCENT}
          onClose={() => setShowHowTo(false)}
          isDesktop={isDesktop}
        />
      </div>
    );
  }

  // ─── RESULT ───────────────────────────────────────────────────────────
  if (phase === "result") {
    const allCorrect = correctCount === TOTAL_QUESTIONS;
    const newStreak = CURRENT_STREAK + 1;
    return (
      <div className="flex flex-col" style={containerStyle}>
        <TopExitBar onExit={() => navigate(-1)} />
        <div className="flex-1 flex flex-col items-center" style={{ padding: 24, paddingTop: 32, paddingBottom: 40, gap: 24, overflowY: "auto", minHeight: 0 }}>
          {/* Streak +1 animation */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            style={{
              position: "relative",
              width: 140, height: 140,
              borderRadius: 9999,
              background: `radial-gradient(circle, color-mix(in srgb, ${ACCENT} 36%, var(--background)) 0%, var(--background) 80%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 48px color-mix(in srgb, ${ACCENT} 40%, transparent)`,
            }}
          >
            <span style={{ fontSize: 64, fontWeight: 800, color: ACCENT, fontVariantNumeric: "tabular-nums" }}>
              {newStreak}
            </span>
            <motion.span
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -40, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.6, delay: 0.3 }}
              style={{
                position: "absolute",
                right: -8, top: 8,
                fontSize: "var(--text-sm)", fontWeight: 800,
                color: ACCENT,
              }}
            >
              +1
            </motion.span>
          </motion.div>

          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            <h1 style={{ fontSize: vibe.titleSize, fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: vibe.letterSpacing, lineHeight: "40px", minHeight: 40 }}>
              {allCorrect ? "Perfect run!" : "Sprint complete"}
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
              Day {newStreak} streak · {correctCount}/{TOTAL_QUESTIONS} correct
            </span>
          </div>

          {/* Breakdown */}
          <div className="flex" style={{
            width: "100%", maxWidth: 360,
            padding: "16px 0",
            borderRadius: 16,
            backgroundColor: "var(--card)",
            border: "0.5px solid var(--border)",
          }}>
            {[
              { label: "Correct",  value: correctCount, color: "var(--success-500)" },
              { label: "Wrong",    value: wrongCount,   color: "var(--error-500)" },
              { label: "Skipped",  value: skippedCount, color: "var(--muted-foreground)" },
            ].map((s, i) => (
              <div key={s.label} className="flex flex-col items-center" style={{
                flex: 1, paddingLeft: 8, paddingRight: 8,
                borderRight: i < 2 ? "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)" : "none",
                gap: 4,
              }}>
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Daily comparison — score-tied percentile vs other players today */}
          <DailyComparisonStrip
            yourScore={correctCount}
            total={TOTAL_QUESTIONS}
            periodLabel="today"
          />

          {/* Other games rail — LinkedIn-style cross-game push, excludes Daily Drill */}
          <div style={{ width: "100%", maxWidth: 360 }}>
            <OtherGamesRail currentGameId="daily-sprint" games={DUMMY_GAMES} />
          </div>

          {/* Cross-sell card — "wait before you go" conversion ask just above
              the dismiss CTA. Copy adapts by pass state: non-pass → Pass upsell;
              pass-holders → soft "browse more games" nudge. */}
          <motion.div
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate(pass.active ? "/marketplace-v1" : "/marketplace/games-pass")}
            className="flex items-center"
            style={{
              width: "100%", maxWidth: 360,
              padding: "12px 14px",
              borderRadius: 12,
              backgroundColor: "var(--card)",
              border: `0.5px solid color-mix(in srgb, ${ACCENT} 30%, var(--border))`,
              gap: 12,
              cursor: "pointer",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              backgroundColor: `color-mix(in srgb, ${ACCENT} 18%, transparent)`,
              border: `0.5px solid color-mix(in srgb, ${ACCENT} 36%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Trophy size={16} style={{ color: ACCENT }} />
            </div>
            <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                {pass.active ? "Browse more games" : "Unlock 7 more games"}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                {pass.active
                  ? `Pass active · ${pass.daysLeft} days left`
                  : `${GAMES_PASS.label} · ₹${GAMES_PASS.price} / ${GAMES_PASS.durationLabel}`}
              </span>
            </div>
            <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          </motion.div>

          {/* Next-drill ETA + Done CTA — paired (countdown sits above the dismiss button) */}
          <div className="flex flex-col items-center w-full" style={{ gap: 12, maxWidth: 360 }}>
            <NextSessionEta daily label="Next drill" />
            <DismissCTA onClick={() => navigate(-1)} label="Done" />
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYING ──────────────────────────────────────────────────────────
  const correctIdx = currentQ.correctIdx;
  const playerCorrect = chosenIdx !== null && chosenIdx === correctIdx;

  return (
    <div className="flex flex-col" style={containerStyle}>
      <TopExitBar onExit={() => navigate(-1)} />

      {/* Top bar — timer + Q counter + topic */}
      <div className="flex items-center justify-between" style={{
        padding: "12px 16px",
        borderBottom: "0.5px solid var(--border)",
        gap: 12,
      }}>
        <CountdownRing seconds={timeLeft} total={questionDurationSec} />
        <div className="flex items-center" style={{ gap: 10 }}>
          <div className="flex flex-col items-end" style={{ gap: 2 }}>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700 }}>
              Q {qIdx + 1} of {TOTAL_QUESTIONS}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--foreground)", fontWeight: 600 }}>
              {currentQ.topic}
            </span>
          </div>
          <HintButton remaining={hintsLeft} onTap={useFiftyFifty} accent={ACCENT} />
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, backgroundColor: "var(--card)", position: "relative" }}>
        <motion.div
          initial={{ width: `${(qIdx / TOTAL_QUESTIONS) * 100}%` }}
          animate={{ width: `${((qIdx + 1) / TOTAL_QUESTIONS) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: "100%", backgroundColor: ACCENT }}
        />
      </div>

      {/* Question + options */}
      <div className="flex-1" style={{ padding: "24px 16px" }}>
        <p style={{
          fontSize: "var(--text-base)", color: "var(--foreground)",
          lineHeight: 1.55, margin: "0 0 24px",
        }}>
          {currentQ.stem}
        </p>

        <div className="flex flex-col" style={{ gap: 8 }}>
          {currentQ.options.map((opt, idx) => {
            const isChosen = chosenIdx === idx;
            const isCorrect = revealed && idx === correctIdx;
            const isWrongChosen = revealed && isChosen && idx !== correctIdx;
            const isEliminated = eliminatedIdxs.has(idx) && !revealed;
            const bg = isCorrect ? "color-mix(in srgb, var(--success-500) 16%, var(--card))"
              : isWrongChosen ? "color-mix(in srgb, var(--error-500) 16%, var(--card))"
              : isChosen ? `color-mix(in srgb, ${ACCENT} 14%, var(--card))`
              : isEliminated ? "color-mix(in srgb, var(--muted-foreground) 6%, var(--card))"
              : "var(--card)";
            const border = isCorrect ? "1px solid var(--success-500)"
              : isWrongChosen ? "1px solid var(--error-500)"
              : isChosen ? `1px solid ${ACCENT}`
              : "1px solid var(--border)";
            return (
              <motion.button
                key={idx}
                whileTap={chosenIdx === null && !revealed && !isEliminated ? { scale: 0.99 } : undefined}
                onClick={() => { if (!isEliminated) pickOption(idx); }}
                disabled={chosenIdx !== null || revealed || isEliminated}
                className="flex items-center w-full text-left"
                style={{
                  gap: 12, padding: "14px 12px", borderRadius: 12,
                  backgroundColor: bg, border,
                  cursor: chosenIdx === null && !revealed && !isEliminated ? "pointer" : "default",
                  opacity: isEliminated ? 0.4 : 1,
                  textDecoration: isEliminated ? "line-through" : "none",
                  transition: "background-color 0.15s, border-color 0.15s, opacity 0.2s",
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 9999,
                  backgroundColor: isCorrect ? "var(--success-500)" : isWrongChosen ? "var(--error-500)" : isChosen ? ACCENT : "transparent",
                  border: isCorrect || isWrongChosen || isChosen ? "none" : "1.5px solid color-mix(in srgb, var(--foreground) 25%, transparent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {isCorrect ? (
                    <Check size={12} style={{ color: "var(--white)", strokeWidth: 3 }} />
                  ) : (
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: isWrongChosen || isChosen ? "var(--white)" : "var(--muted-foreground)" }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                  )}
                </div>
                <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.5 }}>
                  {opt}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Resolve toast — 1.5s */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
              padding: "16px",
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              backgroundColor: "var(--card)",
              borderTop: "0.5px solid var(--border)",
              maxWidth: isDesktop ? 720 : undefined,
              marginLeft: isDesktop ? "auto" : undefined,
              marginRight: isDesktop ? "auto" : undefined,
            }}
          >
            <div className="flex items-center justify-between" style={{ gap: 12 }}>
              <div className="flex items-center" style={{ gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9999,
                  backgroundColor: playerCorrect ? "var(--success-500)" : "var(--error-500)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {playerCorrect ? <Check size={14} style={{ color: "var(--white)", strokeWidth: 3 }} /> : <X size={14} style={{ color: "var(--white)", strokeWidth: 3 }} />}
                </div>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", fontWeight: 600 }}>
                  {playerCorrect ? "Correct!" : chosenIdx === null ? "Time's up" : `Correct was ${String.fromCharCode(65 + correctIdx)}`}
                </span>
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 500 }}>
                Next in 1.5s
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
// TopExitBar now imported from src/shared/game-result-shared.tsx (right-aligned).

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const RADIUS = 14;
  const STROKE = 3;
  const circumference = 2 * Math.PI * RADIUS;
  const offset = circumference * (1 - seconds / total);
  const critical = seconds <= 3;
  const color = critical ? "var(--error-500)" : ACCENT;
  return (
    <div style={{ position: "relative", width: 32, height: 32 }}>
      <svg width={32} height={32} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={16} cy={16} r={RADIUS} fill="none" stroke="color-mix(in srgb, var(--foreground) 14%, transparent)" strokeWidth={STROKE} />
        <circle cx={16} cy={16} r={RADIUS} fill="none" stroke={color} strokeWidth={STROKE} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear, stroke 0.2s" }} />
      </svg>
      <span style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "var(--text-xs)", fontWeight: 700, color, fontVariantNumeric: "tabular-nums",
      }}>
        {seconds}
      </span>
    </div>
  );
}
