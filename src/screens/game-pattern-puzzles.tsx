/**
 * Pattern Puzzles — "what comes next?" sequence game for Class 3–6 kids.
 * Route: /marketplace/game/pattern-puzzles/play
 *
 * Why this game exists:
 *   - Indian parents specifically pay for olympiad-prep / IQ-test-prep games
 *     (Cuemath, Vedantu Junior, Mathletics charge ₹2000+/month for this).
 *   - None of the existing 7 games tests abstract pattern recognition — the
 *     core cognitive skill behind IMO / NTSE / IIT mindset.
 *   - Pattern Puzzles is positioned for ambitious parents who want their
 *     child trained in "thinking" beyond rote quiz.
 *
 * Mechanic — what-comes-next sequence puzzles:
 *   - Each puzzle shows a sequence of 4 items + a "?" slot at the end.
 *   - 4 answer options below; tap to select.
 *   - 5 puzzles per session, progressive difficulty.
 *   - Sequence types: shape progression, color progression, number progression,
 *     mixed (shape+number combined). No timer; reasoning > speed.
 *
 * Paid game. Trial gate after 3 sessions.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, Trophy, RefreshCw, ChevronRight, Lightbulb, Puzzle,
  Circle, Square, Triangle, Hexagon, Star, Heart, Diamond,
} from "lucide-react";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { useGamesPass } from "../shared/games-pass-state";
import { TrialGateSheet } from "./trial-gate-sheet";
import { DUMMY_GAMES } from "./marketplace-v1";
import {
  TopExitBar, DailyComparisonStrip, OtherGamesRail,
  DifficultyPicker, HowToButton, HowToSheet,
  HintButton, HintSheet, MAX_HINTS,
  getVibe,
  type Difficulty, type HowToStep,
} from "../shared/game-result-shared";

const HOW_TO_STEPS: HowToStep[] = [
  { title: "Look at the sequence", body: "Four shapes/numbers are shown — find the pattern." },
  { title: "Pick what comes next", body: "Tap one of the 4 options. Read the hint if you're stuck." },
  { title: "Solve 5 puzzles", body: "Patterns get harder. 2 wrongs reveals the answer and moves on." },
];

// Pick subset of curated puzzles based on difficulty. Bank has 8 puzzles
// of mixed complexity; difficulty picks 3/5/all.
const PUZZLES_TO_SHOW_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 3,
  medium: 5,
  hard: 8,
};

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCENT = "var(--mark-review-500)";   // Purple (shares with Word Wizard; both target K-5 cognitive)
const PUZZLES_PER_SESSION = 5;
const MAX_WRONG_PER_PUZZLE = 2;
const CORRECT_HOLD_MS = 1200;
const REVEAL_HOLD_MS = 1900;
const WRONG_RESET_MS = 600;

const GAME_ID = "pattern-puzzles";
const TRIAL_LEVELS = 3;

// ─── Cell types — what can appear in a sequence slot ────────────────────────
type CellShape = "circle" | "square" | "triangle" | "hexagon" | "star" | "heart" | "diamond";
type CellColor = "primary" | "success" | "warning" | "error" | "cyan";

const SHAPE_ICONS: Record<CellShape, typeof Circle> = {
  circle:   Circle,
  square:   Square,
  triangle: Triangle,
  hexagon:  Hexagon,
  star:     Star,
  heart:    Heart,
  diamond:  Diamond,
};

const COLOR_VARS: Record<CellColor, string> = {
  primary: "var(--primary-500)",
  success: "var(--success-500)",
  warning: "var(--warning-500)",
  error:   "var(--error-500)",
  cyan:    "var(--cyan-500)",
};

interface Cell {
  // shape + color identify the visual; number adds a tiny digit on top for
  // number-based progressions.
  shape: CellShape;
  color: CellColor;
  number?: number;
}

// ─── Puzzle generation ──────────────────────────────────────────────────────
interface Puzzle {
  id: string;
  hint: string;             // 1-line description shown above the sequence
  sequence: Cell[];         // 4 cells shown
  answer: Cell;             // The correct "?" cell
  options: Cell[];          // 4 options (1 correct + 3 distractors)
}

// Curated puzzle bank. 8 hand-built puzzles; pick 5 per session.
// Mix of: same-color progressions, same-shape progressions, alternating
// patterns, and number progressions. Tuned for Class 3–6.
// TODO(api): server-side bank with adaptive difficulty bands.
function generatePuzzles(): Puzzle[] {
  return [
    // 1. Same-shape, color rotation (primary → success → warning → error → primary)
    {
      id: "p1",
      hint: "The colors are changing in a circle",
      sequence: [
        { shape: "circle", color: "primary" },
        { shape: "circle", color: "success" },
        { shape: "circle", color: "warning" },
        { shape: "circle", color: "error" },
      ],
      answer: { shape: "circle", color: "primary" },
      options: [
        { shape: "circle", color: "primary" },
        { shape: "circle", color: "warning" },
        { shape: "circle", color: "cyan" },
        { shape: "circle", color: "success" },
      ],
    },
    // 2. Same color, shape progression (circle → square → triangle → hexagon → ?)
    {
      id: "p2",
      hint: "The shapes are getting more sides",
      sequence: [
        { shape: "circle",   color: "primary" },
        { shape: "square",   color: "primary" },
        { shape: "triangle", color: "primary" },
        { shape: "hexagon",  color: "primary" },
      ],
      answer: { shape: "star", color: "primary" },
      options: [
        { shape: "star",     color: "primary" },
        { shape: "circle",   color: "primary" },
        { shape: "diamond",  color: "primary" },
        { shape: "square",   color: "primary" },
      ],
    },
    // 3. Number progression (2 → 4 → 6 → 8 → ?)
    {
      id: "p3",
      hint: "Counting by twos",
      sequence: [
        { shape: "square", color: "success", number: 2 },
        { shape: "square", color: "success", number: 4 },
        { shape: "square", color: "success", number: 6 },
        { shape: "square", color: "success", number: 8 },
      ],
      answer: { shape: "square", color: "success", number: 10 },
      options: [
        { shape: "square", color: "success", number: 10 },
        { shape: "square", color: "success", number: 9 },
        { shape: "square", color: "success", number: 12 },
        { shape: "square", color: "success", number: 16 },
      ],
    },
    // 4. Alternating shapes (circle, square, circle, square, ?)
    {
      id: "p4",
      hint: "Two shapes taking turns",
      sequence: [
        { shape: "circle", color: "warning" },
        { shape: "square", color: "warning" },
        { shape: "circle", color: "warning" },
        { shape: "square", color: "warning" },
      ],
      answer: { shape: "circle", color: "warning" },
      options: [
        { shape: "circle",   color: "warning" },
        { shape: "square",   color: "warning" },
        { shape: "triangle", color: "warning" },
        { shape: "star",     color: "warning" },
      ],
    },
    // 5. Color + shape both rotating (harder)
    {
      id: "p5",
      hint: "Both color and shape are changing each step",
      sequence: [
        { shape: "circle",   color: "primary" },
        { shape: "square",   color: "success" },
        { shape: "triangle", color: "warning" },
        { shape: "hexagon",  color: "error" },
      ],
      answer: { shape: "star", color: "cyan" },
      options: [
        { shape: "star",    color: "cyan" },
        { shape: "circle",  color: "primary" },
        { shape: "star",    color: "primary" },
        { shape: "hexagon", color: "cyan" },
      ],
    },
    // 6. Multiplication progression (3 → 6 → 12 → 24 → ?)
    {
      id: "p6",
      hint: "Each number doubles the one before it",
      sequence: [
        { shape: "circle", color: "cyan", number: 3 },
        { shape: "circle", color: "cyan", number: 6 },
        { shape: "circle", color: "cyan", number: 12 },
        { shape: "circle", color: "cyan", number: 24 },
      ],
      answer: { shape: "circle", color: "cyan", number: 48 },
      options: [
        { shape: "circle", color: "cyan", number: 48 },
        { shape: "circle", color: "cyan", number: 36 },
        { shape: "circle", color: "cyan", number: 30 },
        { shape: "circle", color: "cyan", number: 50 },
      ],
    },
    // 7. Same color, shape sequence (heart-diamond-heart-diamond-?)
    {
      id: "p7",
      hint: "Find the rhythm",
      sequence: [
        { shape: "heart",   color: "error" },
        { shape: "diamond", color: "error" },
        { shape: "heart",   color: "error" },
        { shape: "diamond", color: "error" },
      ],
      answer: { shape: "heart", color: "error" },
      options: [
        { shape: "heart",   color: "error" },
        { shape: "diamond", color: "error" },
        { shape: "circle",  color: "error" },
        { shape: "star",    color: "error" },
      ],
    },
    // 8. Fibonacci-like (1, 2, 3, 5, ?)
    {
      id: "p8",
      hint: "Each number is the sum of the two before it",
      sequence: [
        { shape: "hexagon", color: "warning", number: 1 },
        { shape: "hexagon", color: "warning", number: 2 },
        { shape: "hexagon", color: "warning", number: 3 },
        { shape: "hexagon", color: "warning", number: 5 },
      ],
      answer: { shape: "hexagon", color: "warning", number: 8 },
      options: [
        { shape: "hexagon", color: "warning", number: 8 },
        { shape: "hexagon", color: "warning", number: 7 },
        { shape: "hexagon", color: "warning", number: 10 },
        { shape: "hexagon", color: "warning", number: 6 },
      ],
    },
  ];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function cellsEqual(a: Cell, b: Cell): boolean {
  return a.shape === b.shape && a.color === b.color && a.number === b.number;
}

type Phase = "intro" | "playing" | "result";
type Feedback = "none" | "correct" | "wrong" | "revealed";

// ─── Component ───────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const pass = useGamesPass();

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [showHowTo, setShowHowTo] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const puzzlesPerSession = PUZZLES_TO_SHOW_BY_DIFFICULTY[difficulty];
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [showHintSheet, setShowHintSheet] = useState(false);
  const [revealedHintIdx, setRevealedHintIdx] = useState<Set<number>>(new Set());
  const vibe = getVibe(difficulty);

  // Per-puzzle state
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [wrongOnThisPuzzle, setWrongOnThisPuzzle] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>("none");

  // Trial gate
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

  const currentPuzzle = puzzles[puzzleIdx];

  // Reset per-puzzle state on advance
  useEffect(() => {
    if (phase !== "playing") return;
    setChosenIdx(null);
    setWrongOnThisPuzzle(0);
    setFeedback("none");
  }, [phase, puzzleIdx]);

  function pickOption(idx: number) {
    if (feedback !== "none" || !currentPuzzle) return;
    setChosenIdx(idx);
    const chosen = currentPuzzle.options[idx];
    if (cellsEqual(chosen, currentPuzzle.answer)) {
      setFeedback("correct");
      setCorrectCount((c) => c + 1);
      const t = setTimeout(() => {
        if (puzzleIdx + 1 >= puzzles.length) setPhase("result");
        else setPuzzleIdx((i) => i + 1);
      }, CORRECT_HOLD_MS);
      return () => clearTimeout(t);
    }
    // Wrong
    const nextWrong = wrongOnThisPuzzle + 1;
    setWrongOnThisPuzzle(nextWrong);
    if (nextWrong >= MAX_WRONG_PER_PUZZLE) {
      setFeedback("revealed");
      const t = setTimeout(() => {
        if (puzzleIdx + 1 >= puzzles.length) setPhase("result");
        else setPuzzleIdx((i) => i + 1);
      }, REVEAL_HOLD_MS);
      return () => clearTimeout(t);
    }
    // Soft reset
    setFeedback("wrong");
    const t = setTimeout(() => {
      setChosenIdx(null);
      setFeedback("none");
    }, WRONG_RESET_MS);
    return () => clearTimeout(t);
  }

  function startGame() {
    setPuzzles(shuffle(generatePuzzles()).slice(0, puzzlesPerSession));
    setPuzzleIdx(0);
    setCorrectCount(0);
    setHintsLeft(MAX_HINTS);
    setRevealedHintIdx(new Set());
    setPhase("playing");
  }

  function useHint() {
    if (hintsLeft <= 0) return;
    setHintsLeft((h) => h - 1);
    setRevealedHintIdx((prev) => {
      const next = new Set(prev);
      next.add(puzzleIdx);
      return next;
    });
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
            Pattern Puzzles · Class 3–6
          </span>

          <div style={{
            position: "relative", width: 140, height: 140,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div aria-hidden style={{
              position: "absolute", inset: 0, borderRadius: 9999,
              background: `radial-gradient(circle, color-mix(in srgb, ${ACCENT} 36%, var(--background)) 0%, var(--background) 75%)`,
              filter: "blur(8px)",
            }} />
            <div style={{
              position: "relative", width: 96, height: 96, borderRadius: 24,
              background: `linear-gradient(135deg, ${ACCENT} 0%, color-mix(in srgb, var(--primary-500) 50%, ${ACCENT}) 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 16px 40px color-mix(in srgb, ${ACCENT} 55%, transparent), inset 0 2px 0 color-mix(in srgb, var(--white) 32%, transparent)`,
            }}>
              <Puzzle size={44} style={{ color: "var(--white)" }} strokeWidth={2.25} />
            </div>
          </div>

          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <h1 style={{ fontSize: vibe.titleSize, fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: vibe.letterSpacing, lineHeight: "40px", minHeight: 40 }}>
              Pattern Puzzles
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center", maxWidth: 280 }}>
              What comes next? Olympiad-style sequences.
            </span>
          </div>

          <div className="flex items-center" style={{
            gap: 16, padding: "12px 20px", borderRadius: 12,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
          }}>
            <StatCol value={`${puzzlesPerSession}`} label="Puzzles" />
            <Divider />
            <StatCol value="No timer" label="Pace" />
            <Divider />
            <StatCol value="Think" label="To solve" />
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
            <Puzzle size={16} style={{ color: "var(--white)" }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)" }}>
              Start solving
            </span>
          </motion.button>
        </div>
        <HowToSheet
          open={showHowTo}
          gameTitle="Pattern Puzzles"
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
    return (
      <div className="flex flex-col" style={containerStyle}>
        <TopExitBar onExit={() => navigate(-1)} />
        <div className="flex-1 flex flex-col items-center" style={{ padding: 24, paddingTop: 32, paddingBottom: 40, gap: 24, overflowY: "auto", minHeight: 0 }}>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            style={{
              position: "relative", width: 140, height: 140, borderRadius: 9999,
              background: `radial-gradient(circle, color-mix(in srgb, ${ACCENT} 36%, var(--background)) 0%, var(--background) 80%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 48px color-mix(in srgb, ${ACCENT} 40%, transparent)`,
            }}
          >
            <Trophy size={56} style={{ color: ACCENT }} strokeWidth={2.25} />
          </motion.div>

          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            <h1 style={{ fontSize: vibe.titleSize, fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: vibe.letterSpacing, lineHeight: "40px", minHeight: 40 }}>
              {puzzleTier(correctCount, puzzles.length).title}
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
              {correctCount}/{puzzles.length} puzzles solved
            </span>
          </div>

          <div className="flex" style={{
            width: "100%", maxWidth: 360, padding: "16px 0", borderRadius: 16,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
          }}>
            <BreakdownCol label="Solved" value={correctCount} color="var(--success-500)" />
            <BreakdownDivider />
            <BreakdownCol label="Missed" value={puzzles.length - correctCount} color="var(--muted-foreground)" />
          </div>

          <DailyComparisonStrip yourScore={correctCount} total={puzzles.length} />

          <div style={{ width: "100%", maxWidth: 360 }}>
            <OtherGamesRail currentGameId={GAME_ID} games={DUMMY_GAMES} />
          </div>

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
              Play again
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

        <TrialGateSheet
          open={showTrialGate}
          onClose={() => setShowTrialGate(false)}
          gameTitle="Pattern Puzzles"
          isDesktop={isDesktop}
        />
      </div>
    );
  }

  // ─── PLAYING ──────────────────────────────────────────────────────────
  if (!currentPuzzle) return null;
  const correct = feedback === "correct";
  const wrong = feedback === "wrong";
  const showRevealed = feedback === "revealed";
  const interactionsDisabled = feedback !== "none";

  return (
    <div className="flex flex-col" style={containerStyle}>
      <TopExitBar onExit={() => navigate(-1)} />

      <div className="flex items-center justify-between" style={{
        padding: "12px 16px", borderBottom: "0.5px solid var(--border)", gap: 12,
      }}>
        <span style={{
          fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
          letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700,
        }}>
          Puzzle {puzzleIdx + 1} of {puzzles.length}
        </span>
        <div className="flex items-center" style={{ gap: 10 }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <Puzzle size={14} style={{ color: ACCENT }} />
            <span style={{
              fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--foreground)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {correctCount}/{puzzles.length}
            </span>
          </div>
          <HintButton remaining={hintsLeft} onTap={() => setShowHintSheet(true)} accent={ACCENT} />
        </div>
      </div>

      <div style={{ height: 4, backgroundColor: "var(--card)", position: "relative" }}>
        <motion.div
          animate={{ width: `${((puzzleIdx + 1) / puzzles.length) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: "100%", backgroundColor: ACCENT }}
        />
      </div>

      {/* Hint card — only shown when the kid spent a hint on this puzzle */}
      {revealedHintIdx.has(puzzleIdx) && (
        <div style={{ padding: "20px 16px 8px" }}>
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-start"
            style={{
              gap: 8, padding: "10px 12px", borderRadius: 12,
              backgroundColor: `color-mix(in srgb, ${ACCENT} 10%, var(--card))`,
              border: `0.5px solid color-mix(in srgb, ${ACCENT} 30%, var(--border))`,
            }}
          >
            <Lightbulb size={14} style={{ color: ACCENT, marginTop: 2, flexShrink: 0 }} />
            <span style={{
              fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.4,
            }}>
              {currentPuzzle.hint}
            </span>
          </motion.div>
        </div>
      )}

      {/* Prompt */}
      <div style={{ padding: "20px 16px 4px", textAlign: "center" }}>
        <span style={{
          fontSize: "var(--text-2xs)", fontWeight: 700,
          color: "var(--muted-foreground)", letterSpacing: 0.8,
          textTransform: "uppercase",
        }}>
          What comes next?
        </span>
      </div>

      {/* Sequence row — 4 cells + "?" */}
      <motion.div
        key={`seq-${puzzleIdx}`}
        initial={{ opacity: 0, y: 8 }}
        animate={wrong ? { x: [-4, 4, -4, 4, 0], opacity: 1, y: 0 } : { x: 0, opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-center"
        style={{ padding: "8px 16px", gap: 8, flexWrap: "wrap" }}
      >
        {currentPuzzle.sequence.map((cell, i) => (
          <CellTile key={i} cell={cell} />
        ))}
        <span aria-hidden style={{
          fontSize: 24, color: "var(--muted-foreground)", fontWeight: 700,
          paddingLeft: 4, paddingRight: 4,
        }}>
          →
        </span>
        <motion.div
          animate={correct ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <CellTile
            cell={showRevealed || correct ? currentPuzzle.answer : null}
            isAnswerSlot
            highlight={showRevealed || correct ? "success" : null}
          />
        </motion.div>
      </motion.div>

      {/* Feedback band */}
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
              You spotted the pattern!
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
              Not that one — try again
            </motion.span>
          )}
          {showRevealed && (
            <motion.span
              key="revealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)" }}
            >
              Tricky pattern — onto the next
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Options — 2×2 */}
      <div style={{
        padding: "8px 16px 24px",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        marginTop: "auto",
      }}>
        <span style={{
          display: "block",
          fontSize: "var(--text-2xs)", fontWeight: 700,
          color: "var(--muted-foreground)", letterSpacing: 0.6,
          textTransform: "uppercase", marginBottom: 12, textAlign: "center",
        }}>
          Pick the next one
        </span>
        <div className="flex flex-wrap items-center justify-center" style={{ gap: 12 }}>
          {currentPuzzle.options.map((option, i) => {
            const isChosen = chosenIdx === i;
            const isCorrectAnswer = cellsEqual(option, currentPuzzle.answer);
            const isWrongChosen = wrong && isChosen;
            const isRevealedAnswer = showRevealed && isCorrectAnswer;
            const tileColor = isRevealedAnswer || (correct && isChosen)
              ? "var(--success-500)"
              : isWrongChosen
                ? "var(--error-500)"
                : isChosen
                  ? ACCENT
                  : null;
            const bg = isRevealedAnswer || (correct && isChosen)
              ? "color-mix(in srgb, var(--success-500) 12%, var(--card))"
              : isWrongChosen
                ? "color-mix(in srgb, var(--error-500) 10%, var(--card))"
                : isChosen
                  ? `color-mix(in srgb, ${ACCENT} 10%, var(--card))`
                  : "var(--card)";
            return (
              <motion.button
                key={i}
                whileTap={!interactionsDisabled ? { scale: 0.95 } : undefined}
                onClick={() => pickOption(i)}
                disabled={interactionsDisabled}
                style={{
                  width: 132, height: 100, borderRadius: 16,
                  padding: 0,
                  backgroundColor: bg,
                  border: tileColor
                    ? `1.5px solid ${tileColor}`
                    : "0.5px solid var(--border)",
                  cursor: interactionsDisabled ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background-color 0.15s, border-color 0.15s",
                  boxShadow: isChosen ? `0 0 0 3px color-mix(in srgb, ${tileColor ?? ACCENT} 14%, transparent)` : "none",
                }}
                aria-label={`Option ${i + 1}`}
              >
                <CellTile cell={option} size={64} />
              </motion.button>
            );
          })}
        </div>
      </div>
      <HintSheet
        open={showHintSheet}
        hint={currentPuzzle.hint}
        remaining={hintsLeft}
        accent={ACCENT}
        onUse={useHint}
        onClose={() => setShowHintSheet(false)}
        isDesktop={isDesktop}
      />
    </div>
  );
}

// ─── CellTile — renders a single sequence cell ─────────────────────────────
function CellTile({
  cell, isAnswerSlot, highlight, size = 60,
}: {
  cell: Cell | null;
  isAnswerSlot?: boolean;
  highlight?: "success" | null;
  size?: number;
}) {
  const w = size;
  const h = size;
  // Empty answer slot
  if (!cell) {
    return (
      <div style={{
        width: w, height: h, borderRadius: 12,
        backgroundColor: "var(--card)",
        border: "1px dashed color-mix(in srgb, var(--foreground) 22%, transparent)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: "var(--muted-foreground)" }}>?</span>
      </div>
    );
  }
  const ShapeIcon = SHAPE_ICONS[cell.shape];
  const shapeColor = COLOR_VARS[cell.color];
  const bg = highlight === "success"
    ? "color-mix(in srgb, var(--success-500) 18%, var(--card))"
    : isAnswerSlot
      ? "var(--card)"
      : `color-mix(in srgb, ${shapeColor} 14%, var(--card))`;
  const border = highlight === "success"
    ? "1px solid var(--success-500)"
    : isAnswerSlot
      ? "1px dashed color-mix(in srgb, var(--foreground) 22%, transparent)"
      : `0.5px solid color-mix(in srgb, ${shapeColor} 35%, var(--border))`;
  // For number puzzles the digit IS the signal — drop the shape icon entirely
  // and show the number large + centered so 2-digit values (10/12/16) don't
  // burst past a small icon outline.
  const isNumberCell = cell.number !== undefined;
  return (
    <div style={{
      position: "relative",
      width: w, height: h, borderRadius: 12,
      backgroundColor: bg,
      border,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {isNumberCell ? (
        <span style={{
          fontSize: Math.floor(w * 0.5), fontWeight: 800, color: shapeColor,
          fontVariantNumeric: "tabular-nums", lineHeight: 1,
        }}>
          {cell.number}
        </span>
      ) : (
        <ShapeIcon
          size={Math.floor(w * 0.55)}
          style={{ color: shapeColor }}
          strokeWidth={2.25}
          fill={cell.shape === "heart" || cell.shape === "star" || cell.shape === "diamond" ? shapeColor : "transparent"}
          fillOpacity={cell.shape === "heart" || cell.shape === "star" || cell.shape === "diamond" ? 0.25 : undefined}
        />
      )}
    </div>
  );
}

function puzzleTier(correct: number, total: number): { title: string } {
  if (correct >= total)     return { title: "Pattern Master!" };
  if (correct >= total - 1) return { title: "Sharp Thinker" };
  if (correct >= total - 2) return { title: "Pattern Spotter" };
  if (correct >= 1)         return { title: "Keep practising" };
  return { title: "Thinker in training" };
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
