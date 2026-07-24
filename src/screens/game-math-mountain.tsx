/**
 * Math Mountain — playable arithmetic climb for Class 2–5 kids.
 * Route: /marketplace/game/brain-sprint/play  (id stable; UI title is "Math Mountain")
 *
 * PAID game in the hybrid model — trial-gate sheet fires after 3 mountains
 * climbed without an active Games Pass (same pattern as Brain Battle).
 *
 * Phases:
 *   1. intro    — mountain hero + stats (5 problems, 5 altitudes, no timer) + Start climb
 *   2. playing  — 5 arithmetic problems, number-keypad input, climber rises
 *                 one altitude per correct answer
 *   3. result   — Summit reached / Almost there, score breakdown, cross-sell
 *                 (pass-holders only — trial gate handles non-pass)
 *
 * Mechanic — deliberately NOT another MCQ:
 *   - Number-keypad input (kid actually computes; no answer choices to elimination-guess)
 *   - Visual progression metaphor (climber rises with each correct answer; summit feels earned)
 *   - 5-problem level structure (not the 10-Q session of Daily Drill / Brain Battle)
 *   - No timer at Class 2–5 (computation under pressure is anxiety, not motivation)
 *   - 2 wrongs on a problem → auto-reveal answer + advance (no shaming, no soft-locked kid)
 *
 * The 60 levels promised in marketplace catalog are a future addition (per-level
 * progress + difficulty bands). v1 generates a single 5-problem mountain per session
 * with an internal difficulty curve.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Check, Delete, Mountain, Trophy, ChevronRight, RefreshCw } from "lucide-react";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { useGamesPass } from "../shared/games-pass-state";
import { TrialGateSheet } from "./trial-gate-sheet";
import { DUMMY_GAMES } from "./marketplace-v1";
import {
  TopExitBar,
  DailyComparisonStrip,
  OtherGamesRail,
  DifficultyPicker,
  HowToButton,
  HowToSheet,
  HintButton,
  HintSheet,
  MAX_HINTS,
  getVibe,
  type Difficulty,
  type HowToStep,
} from "../shared/game-result-shared";

function hintFor(p: { a: number; b: number; op: "+" | "−" | "×" }): string {
  if (p.op === "+") {
    const bigger = Math.max(p.a, p.b);
    const smaller = Math.min(p.a, p.b);
    return `Start at ${bigger} and count up by ${smaller}.`;
  }
  if (p.op === "−") {
    return `Start at ${p.a} and count back ${p.b} steps.`;
  }
  return `Think of it as ${p.a} groups of ${p.b} — add ${p.b} to itself ${p.a} times.`;
}

// How-to-play steps shown in the intro phase HowToSheet.
const HOW_TO_STEPS: HowToStep[] = [
  { title: "Solve the problem", body: "Read the equation at the top, then tap the number keypad to enter your answer." },
  { title: "Tap the green check", body: "Submit when you're ready. Correct answers climb one altitude up the mountain." },
  { title: "Reach the summit", body: "Solve all 5 problems to plant your flag at the top. 2 wrongs on the same problem auto-reveals the answer." },
];

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCENT = "var(--warning-500)";        // Math Mountain's per-game orange
const PROBLEMS_PER_MOUNTAIN = 5;
const MAX_WRONG_PER_PROBLEM = 2;            // After 2 wrongs, auto-reveal + advance
const CORRECT_HOLD_MS = 900;                // Celebrate before next problem
const REVEAL_HOLD_MS = 1500;                // Show answer before advancing
const WRONG_SHAKE_MS = 400;
const MAX_INPUT_LEN = 4;                    // Max answer is < 100, but allow up to 4 digits

const GAME_ID = "brain-sprint";
const TRIAL_LEVELS = 3;

// ─── Types ───────────────────────────────────────────────────────────────────
type Operator = "+" | "−" | "×";
interface Problem {
  a: number;
  b: number;
  op: Operator;
  answer: number;
}
type Phase = "intro" | "playing" | "result";
type Feedback = "none" | "correct" | "wrong" | "revealed";

// ─── Helpers — problem generation ────────────────────────────────────────────
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeAddSub(maxOperand: number, allowSub: boolean): Problem {
  const op: Operator = allowSub && Math.random() < 0.45 ? "−" : "+";
  if (op === "+") {
    const a = randInt(1, maxOperand);
    const b = randInt(1, maxOperand);
    return { a, b, op, answer: a + b };
  }
  // Subtraction: ensure a > b so answer is non-negative
  const a = randInt(2, maxOperand);
  const b = randInt(1, a - 1);
  return { a, b, op, answer: a - b };
}

function makeMultiplication(): Problem {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  return { a, b, op: "×", answer: a * b };
}

// 5-problem difficulty curve per session — adjusted by selected difficulty.
// Easy (Class 1–4): single-digit only, no multiplication.
// Medium (Class 5–8, default): mixed range up to small multiplication.
// Hard (Class 9–12): larger numbers, more multiplication.
// TODO(api): server-side problem bank with adaptive bands + per-kid progress.
function generateMountain(diff: Difficulty): Problem[] {
  if (diff === "easy") {
    return [
      makeAddSub(5, false),
      makeAddSub(9, false),
      makeAddSub(12, true),
      makeAddSub(18, true),
      makeAddSub(20, false),
    ];
  }
  if (diff === "hard") {
    return [
      makeAddSub(20, true),
      makeAddSub(50, true),
      makeAddSub(99, true),
      makeMultiplication(),
      makeMultiplication(),
    ];
  }
  // medium (default)
  return [
    makeAddSub(9, false),
    makeAddSub(15, true),
    makeAddSub(30, false),
    makeAddSub(60, true),
    makeMultiplication(),
  ];
}

// Climber position along the LEFT mountain slope.
// step=0 → base (30, 200); step=5 → summit (100, 20).
function climberPos(step: number): { x: number; y: number } {
  const t = Math.min(1, step / PROBLEMS_PER_MOUNTAIN);
  return { x: 30 + t * 70, y: 200 - t * 180 };
}

// ─── Component ───────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const pass = useGamesPass();

  const [phase, setPhase] = useState<Phase>("intro");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemIdx, setProblemIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [climberStep, setClimberStep] = useState(0);

  // Per-problem state
  const [input, setInput] = useState("");
  const [wrongOnThisProblem, setWrongOnThisProblem] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>("none");

  // v1: difficulty selector + how-to sheet
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [showHowTo, setShowHowTo] = useState(false);
  const vibe = getVibe(difficulty);

  // Hint lifeline (max 3 per session)
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [showHintSheet, setShowHintSheet] = useState(false);
  function useHintNow() {
    if (hintsLeft <= 0) return;
    setHintsLeft((h) => h - 1);
  }

  // Trial-gate state (paid game)
  const [showTrialGate, setShowTrialGate] = useState(false);
  useEffect(() => {
    if (phase !== "result") return;
    pass.trackPlay(GAME_ID);
    if (pass.active) return;
    const plays = pass.playsFor(GAME_ID) + 1;
    if (plays < TRIAL_LEVELS) return;
    const t = setTimeout(() => setShowTrialGate(true), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const currentProblem = problems[problemIdx];

  // Reset per-problem state when entering a new problem
  useEffect(() => {
    if (phase !== "playing") return;
    setInput("");
    setWrongOnThisProblem(0);
    setFeedback("none");
  }, [phase, problemIdx]);

  function tapDigit(d: string) {
    if (feedback !== "none") return;
    if (input.length >= MAX_INPUT_LEN) return;
    setInput((s) => s + d);
  }

  function tapDelete() {
    if (feedback !== "none") return;
    setInput((s) => s.slice(0, -1));
  }

  function tapCheck() {
    if (feedback !== "none" || input.length === 0 || !currentProblem) return;
    const guess = parseInt(input, 10);
    if (guess === currentProblem.answer) {
      setFeedback("correct");
      setCorrectCount((c) => c + 1);
      setClimberStep((s) => s + 1);
      const t = setTimeout(() => {
        if (problemIdx + 1 >= PROBLEMS_PER_MOUNTAIN) setPhase("result");
        else setProblemIdx((i) => i + 1);
      }, CORRECT_HOLD_MS);
      return () => clearTimeout(t);
    }
    // Wrong attempt
    const nextWrong = wrongOnThisProblem + 1;
    setWrongOnThisProblem(nextWrong);
    if (nextWrong >= MAX_WRONG_PER_PROBLEM) {
      // Auto-reveal answer + advance (no climb)
      setFeedback("revealed");
      setInput(String(currentProblem.answer));
      const t = setTimeout(() => {
        if (problemIdx + 1 >= PROBLEMS_PER_MOUNTAIN) setPhase("result");
        else setProblemIdx((i) => i + 1);
      }, REVEAL_HOLD_MS);
      return () => clearTimeout(t);
    }
    // Soft shake; clear input after the shake settles
    setFeedback("wrong");
    const t = setTimeout(() => {
      setInput("");
      setFeedback("none");
    }, WRONG_SHAKE_MS);
    return () => clearTimeout(t);
  }

  function startGame() {
    setProblems(generateMountain(difficulty));
    setProblemIdx(0);
    setCorrectCount(0);
    setClimberStep(0);
    setHintsLeft(MAX_HINTS);
    setPhase("playing");
  }

  function playAgain() {
    startGame();
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
            Math Mountain · Class 2–5
          </span>

          {/* Mountain hero — preview of the climb */}
          <div style={{
            position: "relative", width: 200, height: 220,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MountainSVG step={0} accent={ACCENT} />
          </div>

          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <h1 style={{ fontSize: vibe.titleSize, fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: vibe.letterSpacing, lineHeight: "40px", minHeight: 40 }}>
              Math Mountain
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center" }}>
              Solve 5 problems to reach the summit
            </span>
          </div>

          <div className="flex items-center" style={{
            gap: 16, padding: "12px 20px", borderRadius: 12,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
          }}>
            <StatCol value={`${PROBLEMS_PER_MOUNTAIN}`} label="Problems" />
            <Divider />
            <StatCol value="No timer" label="Pace" />
            <Divider />
            <StatCol value="Type" label="Answer" />
          </div>

          <DifficultyPicker value={difficulty} onChange={setDifficulty} accent={ACCENT} />

          <HowToButton onTap={() => setShowHowTo(true)} accent={ACCENT} />

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={startGame}
            className="flex items-center justify-center"
            style={{
              width: "100%", maxWidth: 320, height: 44, borderRadius: 12, gap: 8, border: "none",
              backgroundColor: "var(--primary-500)", cursor: "pointer",
            }}
          >
            <Mountain size={16} style={{ color: "var(--white)" }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)" }}>
              Start climb
            </span>
          </motion.button>
        </div>
        <HowToSheet
          open={showHowTo}
          gameTitle="Math Mountain"
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
    const summitReached = correctCount === PROBLEMS_PER_MOUNTAIN;
    const title = summitReached ? "Summit reached!"
      : correctCount >= 3 ? "Strong climb"
      : "Almost there — try again";

    return (
      <div className="flex flex-col" style={containerStyle}>
        <TopExitBar onExit={() => navigate(-1)} />
        <div className="flex-1 flex flex-col items-center" style={{ padding: 24, paddingTop: 24, paddingBottom: 40, gap: 24, overflowY: "auto", minHeight: 0 }}>
          {/* Mountain in final climbed state */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{
              position: "relative", width: 200, height: 220,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <MountainSVG step={climberStep} accent={ACCENT} celebrate={summitReached} />
          </motion.div>

          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            <h1 style={{
              fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: -0.5,
              color: summitReached ? "var(--success-500)" : "var(--foreground)",
            }}>
              {title}
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
              {correctCount}/{PROBLEMS_PER_MOUNTAIN} problems solved
            </span>
          </div>

          {/* Breakdown — minimal: just correct vs missed */}
          <div className="flex" style={{
            width: "100%", maxWidth: 360, padding: "16px 0", borderRadius: 16,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
          }}>
            <BreakdownCol label="Solved" value={correctCount} color="var(--success-500)" />
            <BreakdownDivider />
            <BreakdownCol label="Missed" value={PROBLEMS_PER_MOUNTAIN - correctCount} color="var(--muted-foreground)" />
          </div>

          {/* Cross-sell — only when pass active. Trial gate handles non-pass. */}
          {pass.active && (
            <motion.div
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate("/marketplace-v1")}
              className="flex items-center"
              style={{
                width: "100%", maxWidth: 360,
                padding: "12px 12px", borderRadius: 12,
                backgroundColor: "var(--card)",
                border: `0.5px solid color-mix(in srgb, ${ACCENT} 30%, var(--border))`,
                gap: 12, cursor: "pointer",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: `color-mix(in srgb, ${ACCENT} 18%, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Trophy size={16} style={{ color: ACCENT }} />
              </div>
              <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                  Browse more games
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                  Pass active · {pass.daysLeft} days left
                </span>
              </div>
              <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            </motion.div>
          )}

          {/* Daily comparison + Other games rail (LinkedIn-style) */}
          <DailyComparisonStrip yourScore={correctCount} total={PROBLEMS_PER_MOUNTAIN} />
          <div style={{ width: "100%", maxWidth: 360 }}>
            <OtherGamesRail currentGameId="brain-sprint" games={DUMMY_GAMES} />
          </div>

          <div className="flex flex-col w-full" style={{ gap: 8, maxWidth: 360 }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={playAgain}
              className="flex items-center justify-center"
              style={{
                width: "100%", height: 44, borderRadius: 12, gap: 8, border: "none",
                backgroundColor: ACCENT, cursor: "pointer",
                fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)",
              }}
            >
              <RefreshCw size={16} style={{ color: "var(--white)" }} />
              Climb again
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="flex items-center justify-center"
              style={{
                width: "100%", height: 44, borderRadius: 12,
                border: "0.5px solid var(--border)",
                backgroundColor: "transparent", cursor: "pointer",
                fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)",
              }}
            >
              Back to game
            </motion.button>
          </div>
        </div>

        {/* Trial-gate bottom sheet — auto-rises 0.9s after result phase renders
            when user does not have an active pass and has climbed >= TRIAL_LEVELS times. */}
        <TrialGateSheet
          open={showTrialGate}
          onClose={() => setShowTrialGate(false)}
          gameTitle="Math Mountain"
          isDesktop={isDesktop}
        />
      </div>
    );
  }

  // ─── PLAYING ──────────────────────────────────────────────────────────
  if (!currentProblem) return null;
  const correct = feedback === "correct";
  const wrong = feedback === "wrong";
  const showRevealed = feedback === "revealed";
  const interactionsDisabled = feedback !== "none";

  return (
    <div className="flex flex-col" style={containerStyle}>
      <TopExitBar onExit={() => navigate(-1)} />

      {/* Top bar — problem counter + altitude indicator */}
      <div className="flex items-center justify-between" style={{
        padding: "12px 16px", borderBottom: "0.5px solid var(--border)", gap: 12,
      }}>
        <span style={{
          fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
          letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700,
        }}>
          Problem {problemIdx + 1} of {PROBLEMS_PER_MOUNTAIN}
        </span>
        <div className="flex items-center" style={{ gap: 10 }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <Mountain size={14} style={{ color: ACCENT }} />
            <span style={{
              fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--foreground)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {climberStep}/{PROBLEMS_PER_MOUNTAIN}
            </span>
          </div>
          <HintButton remaining={hintsLeft} onTap={() => setShowHintSheet(true)} accent={ACCENT} />
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, backgroundColor: "var(--card)", position: "relative" }}>
        <motion.div
          initial={{ width: `${(problemIdx / PROBLEMS_PER_MOUNTAIN) * 100}%` }}
          animate={{ width: `${((problemIdx + 1) / PROBLEMS_PER_MOUNTAIN) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: "100%", backgroundColor: ACCENT }}
        />
      </div>

      {/* Mountain — climber animates between altitudes */}
      <div className="flex items-center justify-center" style={{ padding: "16px 16px 0" }}>
        <div style={{ width: 200, height: 200 }}>
          <MountainSVG step={climberStep} accent={ACCENT} celebrate={correct} />
        </div>
      </div>

      {/* Problem display */}
      <div className="flex items-center justify-center" style={{ padding: "8px 16px 4px" }}>
        <span style={{
          fontSize: 32, fontWeight: 800, color: "var(--foreground)",
          fontVariantNumeric: "tabular-nums", letterSpacing: -0.5,
        }}>
          {currentProblem.a} {currentProblem.op} {currentProblem.b} = ?
        </span>
      </div>

      {/* Input display — shows what kid has typed */}
      <motion.div
        animate={wrong ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-center"
        style={{ padding: "8px 16px" }}
      >
        <div style={{
          minWidth: 96, height: 56, borderRadius: 12,
          paddingLeft: 16, paddingRight: 16,
          backgroundColor: showRevealed
            ? "color-mix(in srgb, var(--success-500) 16%, var(--card))"
            : correct
              ? "color-mix(in srgb, var(--success-500) 16%, var(--card))"
              : wrong
                ? "color-mix(in srgb, var(--error-500) 14%, var(--card))"
                : `color-mix(in srgb, ${ACCENT} 10%, var(--card))`,
          border: showRevealed || correct
            ? "1px solid var(--success-500)"
            : wrong
              ? "1px solid var(--error-500)"
              : `1px solid color-mix(in srgb, ${ACCENT} 30%, var(--border))`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, fontWeight: 800,
          color: showRevealed || correct ? "var(--success-500)" : "var(--foreground)",
          fontVariantNumeric: "tabular-nums",
          transition: "background-color 0.15s ease, border-color 0.15s ease",
        }}>
          {input || "?"}
        </div>
      </motion.div>

      {/* Inline feedback band */}
      <div style={{ minHeight: 24, padding: "0 16px", textAlign: "center" }}>
        <AnimatePresence>
          {correct && (
            <motion.span
              key="correct"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--success-500)",
              }}
            >
              <Check size={14} strokeWidth={3} />
              {problemIdx + 1 >= PROBLEMS_PER_MOUNTAIN ? "Summit!" : "Up one altitude!"}
            </motion.span>
          )}
          {wrong && (
            <motion.span
              key="wrong"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)" }}
            >
              Not quite — try again
            </motion.span>
          )}
          {showRevealed && (
            <motion.span
              key="revealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)" }}
            >
              The answer was {currentProblem.answer} — onto the next
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Keypad */}
      <div className="flex flex-col items-center" style={{
        padding: "16px 16px 24px", paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        marginTop: "auto", gap: 8,
      }}>
        {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]].map((row, ri) => (
          <div key={ri} className="flex" style={{ gap: 8 }}>
            {row.map((d) => (
              <KeypadButton key={d} onClick={() => tapDigit(d)} disabled={interactionsDisabled}>
                {d}
              </KeypadButton>
            ))}
          </div>
        ))}
        <div className="flex" style={{ gap: 8 }}>
          <KeypadButton onClick={tapDelete} disabled={interactionsDisabled || input.length === 0} kind="delete">
            <Delete size={20} style={{ color: input.length === 0 || interactionsDisabled ? "var(--disabled-text)" : "var(--muted-foreground)" }} />
          </KeypadButton>
          <KeypadButton onClick={() => tapDigit("0")} disabled={interactionsDisabled}>
            0
          </KeypadButton>
          <KeypadButton onClick={tapCheck} disabled={interactionsDisabled || input.length === 0} kind="check">
            <Check size={20} style={{ color: input.length === 0 || interactionsDisabled ? "var(--disabled-text)" : "var(--white)" }} strokeWidth={3} />
          </KeypadButton>
        </div>
      </div>
      <HintSheet
        open={showHintSheet}
        hint={currentProblem ? hintFor(currentProblem) : null}
        remaining={hintsLeft}
        accent={ACCENT}
        onUse={useHintNow}
        onClose={() => setShowHintSheet(false)}
        isDesktop={isDesktop}
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// Mountain illustration with animated climber. `step` 0..5 controls climber position.
function MountainSVG({ step, accent, celebrate }: { step: number; accent: string; celebrate?: boolean }) {
  const { x, y } = climberPos(step);
  return (
    <svg viewBox="0 0 200 220" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="mtn-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* Sky background */}
      <rect x="0" y="0" width="200" height="200" fill="url(#sky-grad)" rx="12" />

      {/* Background mountain (back ridge) */}
      <polygon points="60,200 130,60 200,200" fill={accent} fillOpacity="0.12" />

      {/* Main mountain */}
      <polygon points="100,20 30,200 170,200" fill="url(#mtn-grad)" stroke={accent} strokeOpacity="0.4" strokeWidth="1" />

      {/* Snow cap */}
      <polygon points="100,20 78,72 122,72" fill="var(--white)" fillOpacity="0.85" />

      {/* Altitude markers — subtle horizontal ticks along the left slope */}
      {[1, 2, 3, 4].map((i) => {
        const p = climberPos(i);
        return (
          <line
            key={i}
            x1={p.x - 6} y1={p.y}
            x2={p.x + 6} y2={p.y}
            stroke={accent}
            strokeOpacity={i <= step ? 0.7 : 0.25}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}

      {/* Trail dots from base to current step — visual evidence of climb */}
      {Array.from({ length: step }, (_, i) => {
        const p = climberPos(i);
        return (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={accent} fillOpacity="0.55" />
        );
      })}

      {/* Climber */}
      <motion.g
        animate={{ x, y }}
        initial={false}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
      >
        <circle cx={0} cy={0} r="8" fill={accent} stroke="var(--white)" strokeWidth="1.5" />
        {celebrate && (
          <motion.circle
            cx={0} cy={0} r="8"
            fill="none" stroke={accent} strokeWidth="2"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.g>

      {/* Flag at summit when climber reaches the top */}
      {step >= PROBLEMS_PER_MOUNTAIN && (
        <motion.g
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <line x1="100" y1="20" x2="100" y2="4" stroke="var(--foreground)" strokeWidth="1.5" />
          <polygon points="100,4 112,8 100,12" fill="var(--success-500)" />
        </motion.g>
      )}
    </svg>
  );
}

function KeypadButton({
  children, onClick, disabled, kind,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  kind?: "delete" | "check";
}) {
  const bg = kind === "check"
    ? (disabled ? "var(--disabled-bg)" : ACCENT)
    : (disabled ? "var(--disabled-bg)" : "var(--card)");
  const border = kind === "check"
    ? "none"
    : disabled
      ? "0.5px solid var(--border)"
      : "0.5px solid var(--border)";
  const color = kind === "check"
    ? "var(--white)"
    : disabled
      ? "var(--disabled-text)"
      : "var(--foreground)";
  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.93 } : undefined}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 64, height: 56, borderRadius: 12,
        backgroundColor: bg, border,
        cursor: disabled ? "default" : "pointer",
        fontSize: "var(--text-lg)", fontWeight: 700,
        color, fontVariantNumeric: "tabular-nums",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background-color 0.15s ease",
      }}
    >
      {children}
    </motion.button>
  );
}

function StatCol({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 2 }}>
      <span style={{
        fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </span>
      <span style={{
        fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
        letterSpacing: 0.4, textTransform: "uppercase",
      }}>
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <span aria-hidden style={{ width: 1, height: 24, backgroundColor: "var(--border)" }} />;
}

function BreakdownCol({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center" style={{ flex: 1, paddingLeft: 8, paddingRight: 8, gap: 4 }}>
      <span style={{
        fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
        fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 28, fontWeight: 800, color, lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </span>
    </div>
  );
}

function BreakdownDivider() {
  return (
    <span aria-hidden style={{
      width: "0.5px", alignSelf: "stretch",
      backgroundColor: "color-mix(in srgb, var(--border) 60%, transparent)",
    }} />
  );
}
