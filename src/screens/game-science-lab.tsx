/**
 * Science Lab — playable recipe-matching experiment game for Class 4–7 kids.
 * Route: /marketplace/game/concept-labs/play  (id stable; UI title "Science Lab")
 *
 * PAID game in the hybrid model — trial-gate sheet fires after 3 sessions for
 * non-Pass users (same pattern as Brain Battle / Math Mountain).
 *
 * v1 mechanic — honest about scope:
 *   This is NOT a real chemistry sim. It's recipe-matching with a beaker
 *   visualization. Kid taps ingredients into the beaker, taps Mix, beaker
 *   animates + the combination either matches a target or fizzles.
 *
 *   A real sim (free-form reactions, discoverable chemistry) is a multi-session
 *   build. v1 ships the loop + visual + 5 curated experiments — enough to
 *   prove the engagement model. v2 could add real reactions + discovery mode.
 *
 * Phases:
 *   1. intro   — beaker hero + stats + Start experimenting
 *   2. playing — 5 experiments, each a target outcome the kid must recreate
 *                by selecting ingredients then tapping Mix
 *   3. result  — Lab tier title + breakdown + cross-sell (pass-holders only)
 *
 * Why this mechanic feels different from the other 3 playables:
 *   - Multi-step per problem (add, add, mix) vs single-tap submit
 *   - Reaction animation creates a small theatrical moment between attempts
 *   - "Mix" as an explicit verb makes the kid feel like an experimenter
 *   - Beaker visualization changes physically (fill level + colored layers)
 *     based on what's in it — feedback is spatial, not just textual
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, FlaskConical, Trash2, Trophy, ChevronRight, RefreshCw, Sparkles,
} from "lucide-react";
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

const HOW_TO_STEPS: HowToStep[] = [
  { title: "Read the experiment", body: "Each card asks you to make something — like 'salt water' or 'fizzy drink'." },
  { title: "Tap the right ingredients", body: "Pick from the catalog at the bottom. Up to 4 ingredients fit in the beaker." },
  { title: "Mix and see the reaction", body: "If you got it right, the beaker reacts. If not, you have 2 tries before the recipe is revealed." },
];

const EXPERIMENTS_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 3,
  medium: 5,
  hard: 7,
};

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCENT = "var(--cyan-500)";        // Science Lab's per-game cyan
const MAX_BEAKER_SLOTS = 4;
const MAX_WRONG_PER_EXP = 2;            // After 2 wrongs, reveal recipe + advance
const REACTION_MS = 900;                // Mix animation hold
const CORRECT_HOLD_MS = 1400;
const REVEAL_HOLD_MS = 2200;
const WRONG_RESET_MS = 800;

const GAME_ID = "concept-labs";
const TRIAL_LEVELS = 3;

// ─── Ingredient catalog ──────────────────────────────────────────────────────
type IngredientId = "water" | "salt" | "sugar" | "vinegar" | "bakingSoda" | "lemon" | "oil" | "ice";

interface Ingredient {
  id: IngredientId;
  name: string;
  color: string;                       // CSS var or color-mix only
  textColor?: string;                  // override for low-contrast tiles
}

const INGREDIENTS: Ingredient[] = [
  { id: "water",      name: "Water",       color: "var(--primary-500)" },
  { id: "salt",       name: "Salt",        color: "color-mix(in srgb, var(--foreground) 16%, var(--card))" },
  { id: "sugar",      name: "Sugar",       color: "color-mix(in srgb, var(--warning-500) 30%, var(--card))" },
  { id: "vinegar",    name: "Vinegar",     color: "color-mix(in srgb, var(--success-500) 35%, var(--card))" },
  { id: "bakingSoda", name: "Baking Soda", color: "color-mix(in srgb, var(--muted-foreground) 40%, var(--card))" },
  { id: "lemon",      name: "Lemon",       color: "var(--warning-500)" },
  { id: "oil",        name: "Oil",         color: "color-mix(in srgb, var(--warning-500) 70%, var(--success-500))" },
  { id: "ice",        name: "Ice",         color: "color-mix(in srgb, var(--primary-300) 60%, var(--card))" },
];

function getIngredient(id: IngredientId): Ingredient {
  return INGREDIENTS.find((i) => i.id === id) ?? INGREDIENTS[0];
}

// ─── Experiments ─────────────────────────────────────────────────────────────
// Curated for Class 4–7. Set-equality on recipe — order doesn't matter, but
// every required ingredient must be present and nothing extra.
// TODO(api): server-side experiment bank with difficulty tiers + per-kid progress.
interface Experiment {
  id: string;
  name: string;
  description: string;          // hint shown above the beaker
  recipe: IngredientId[];       // set; order ignored
  outcomeColor: string;         // beaker color when the reaction succeeds
}

const EXPERIMENTS: Experiment[] = [
  {
    id: "salt-water",
    name: "Salt Water",
    description: "Salty ocean-like water you can taste",
    recipe: ["water", "salt"],
    outcomeColor: "color-mix(in srgb, var(--primary-500) 40%, var(--card))",
  },
  {
    id: "sweet-tea",
    name: "Sweet Drink",
    description: "Sugary water — like sweet lemonade base",
    recipe: ["water", "sugar"],
    outcomeColor: "color-mix(in srgb, var(--warning-500) 30%, var(--primary-500))",
  },
  {
    id: "lemonade",
    name: "Lemonade",
    description: "Cold, tangy and sweet — a 3-ingredient classic",
    recipe: ["water", "lemon", "sugar"],
    outcomeColor: "color-mix(in srgb, var(--warning-500) 50%, var(--card))",
  },
  {
    id: "volcano",
    name: "Volcano Foam",
    description: "The classic kitchen science eruption",
    recipe: ["vinegar", "bakingSoda"],
    outcomeColor: "color-mix(in srgb, var(--success-400) 45%, var(--warning-500))",
  },
  {
    id: "iced-tea",
    name: "Iced Drink",
    description: "Sweet, cold, refreshing — needs three things",
    recipe: ["water", "sugar", "ice"],
    outcomeColor: "color-mix(in srgb, var(--primary-300) 50%, var(--warning-500))",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Set equality on multiset of ingredient ids (order doesn't matter; duplicates
// counted). v1 recipes have no duplicates, so this is effectively set equality.
function recipeMatches(beaker: IngredientId[], recipe: IngredientId[]): boolean {
  if (beaker.length !== recipe.length) return false;
  const a = [...beaker].sort();
  const b = [...recipe].sort();
  return a.every((id, i) => id === b[i]);
}

type Phase = "intro" | "playing" | "result";
type Feedback = "none" | "reacting" | "correct" | "wrong" | "revealed";

// ─── Component ───────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const pass = useGamesPass();

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [showHowTo, setShowHowTo] = useState(false);
  const experimentsPerSession = EXPERIMENTS_BY_DIFFICULTY[difficulty];
  const [phase, setPhase] = useState<Phase>("intro");
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [expIdx, setExpIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Per-experiment state
  const [beaker, setBeaker] = useState<IngredientId[]>([]);
  const [wrongOnThisExp, setWrongOnThisExp] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>("none");
  const [revealedRecipe, setRevealedRecipe] = useState<IngredientId[] | null>(null);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [showHintSheet, setShowHintSheet] = useState(false);
  const vibe = getVibe(difficulty);

  function useHint() {
    if (hintsLeft <= 0) return;
    setHintsLeft((h) => h - 1);
  }
  function hintForCurrent(): string | null {
    if (!currentExp) return null;
    // Reveal one ingredient that's required but not yet in the beaker.
    const missing = currentExp.recipe.find((id) => !beaker.includes(id));
    if (!missing) return "You've got all the right ingredients in the beaker — tap Mix!";
    const name = getIngredient(missing).name;
    return `You'll need ${name} in this experiment.`;
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

  const currentExp = experiments[expIdx];

  // Reset per-experiment state on each new experiment
  useEffect(() => {
    if (phase !== "playing") return;
    setBeaker([]);
    setWrongOnThisExp(0);
    setFeedback("none");
    setRevealedRecipe(null);
  }, [phase, expIdx]);

  function addIngredient(id: IngredientId) {
    if (feedback !== "none") return;
    if (beaker.length >= MAX_BEAKER_SLOTS) return;
    setBeaker((b) => [...b, id]);
  }

  function clearBeaker() {
    if (feedback !== "none") return;
    setBeaker([]);
  }

  function mix() {
    if (feedback !== "none" || beaker.length === 0 || !currentExp) return;
    setFeedback("reacting");
    const t = setTimeout(() => {
      if (recipeMatches(beaker, currentExp.recipe)) {
        setFeedback("correct");
        setCorrectCount((c) => c + 1);
        const t2 = setTimeout(() => {
          if (expIdx + 1 >= experimentsPerSession) setPhase("result");
          else setExpIdx((i) => i + 1);
        }, CORRECT_HOLD_MS);
        return () => clearTimeout(t2);
      }
      // Wrong
      const nextWrong = wrongOnThisExp + 1;
      setWrongOnThisExp(nextWrong);
      if (nextWrong >= MAX_WRONG_PER_EXP) {
        // Reveal recipe + advance
        setFeedback("revealed");
        setRevealedRecipe(currentExp.recipe);
        setBeaker(currentExp.recipe);
        const t2 = setTimeout(() => {
          if (expIdx + 1 >= experimentsPerSession) setPhase("result");
          else setExpIdx((i) => i + 1);
        }, REVEAL_HOLD_MS);
        return () => clearTimeout(t2);
      }
      // Soft reset
      setFeedback("wrong");
      const t2 = setTimeout(() => {
        setBeaker([]);
        setFeedback("none");
      }, WRONG_RESET_MS);
      return () => clearTimeout(t2);
    }, REACTION_MS);
    return () => clearTimeout(t);
  }

  function startGame() {
    setExperiments(shuffle(EXPERIMENTS).slice(0, experimentsPerSession));
    setExpIdx(0);
    setCorrectCount(0);
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
            Science Lab · Class 4–7
          </span>

          {/* Beaker hero — empty, just an icon block */}
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
              position: "relative",
              width: 96, height: 96, borderRadius: 24,
              background: `linear-gradient(135deg, ${ACCENT} 0%, color-mix(in srgb, var(--primary-500) 60%, ${ACCENT}) 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 16px 40px color-mix(in srgb, ${ACCENT} 55%, transparent), inset 0 2px 0 color-mix(in srgb, var(--white) 32%, transparent)`,
            }}>
              <FlaskConical size={44} style={{ color: "var(--white)" }} strokeWidth={2.25} />
            </div>
          </div>

          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <h1 style={{ fontSize: vibe.titleSize, fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: vibe.letterSpacing, lineHeight: "40px", minHeight: 40 }}>
              Science Lab
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center", maxWidth: 280 }}>
              Mix ingredients to recreate {experimentsPerSession} experiments
            </span>
          </div>

          <div className="flex items-center" style={{
            gap: 16, padding: "12px 20px", borderRadius: 12,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
          }}>
            <StatCol value={`${experimentsPerSession}`} label="Labs" />
            <Divider />
            <StatCol value={`${INGREDIENTS.length}`} label="Tools" />
            <Divider />
            <StatCol value="Mix" label="To react" />
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
            <Sparkles size={16} style={{ color: "var(--white)" }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)" }}>
              Start experimenting
            </span>
          </motion.button>
        </div>
        <HowToSheet
          open={showHowTo}
          gameTitle="Science Lab"
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
    const tier = labTier(correctCount);
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
              {tier.title}
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
              {correctCount}/{experimentsPerSession} experiments completed
            </span>
          </div>

          <div className="flex" style={{
            width: "100%", maxWidth: 360, padding: "16px 0", borderRadius: 16,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
          }}>
            <BreakdownCol label="Solved" value={correctCount} color="var(--success-500)" />
            <BreakdownDivider />
            <BreakdownCol label="Missed" value={experimentsPerSession - correctCount} color="var(--muted-foreground)" />
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

          {/* Daily comparison + Other games rail (LinkedIn-style) */}
          <DailyComparisonStrip yourScore={correctCount} total={experimentsPerSession} />
          <div style={{ width: "100%", maxWidth: 360 }}>
            <OtherGamesRail currentGameId="concept-labs" games={DUMMY_GAMES} />
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
              Run more experiments
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
          gameTitle="Science Lab"
          isDesktop={isDesktop}
        />
      </div>
    );
  }

  // ─── PLAYING ──────────────────────────────────────────────────────────
  if (!currentExp) return null;
  const reacting = feedback === "reacting";
  const correct = feedback === "correct";
  const wrong = feedback === "wrong";
  const showRevealed = feedback === "revealed";
  const interactionsDisabled = feedback !== "none";

  const beakerColor = correct || showRevealed
    ? currentExp.outcomeColor
    : reacting
      ? `color-mix(in srgb, ${ACCENT} 30%, var(--card))`
      : null;

  return (
    <div className="flex flex-col" style={containerStyle}>
      <TopExitBar onExit={() => navigate(-1)} />

      {/* Top bar — experiment counter + completed count */}
      <div className="flex items-center justify-between" style={{
        padding: "12px 16px", borderBottom: "0.5px solid var(--border)", gap: 12,
      }}>
        <span style={{
          fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
          letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700,
        }}>
          Experiment {expIdx + 1} of {experimentsPerSession}
        </span>
        <div className="flex items-center" style={{ gap: 10 }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <FlaskConical size={14} style={{ color: ACCENT }} />
            <span style={{
              fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--foreground)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {correctCount}/{experimentsPerSession}
            </span>
          </div>
          <HintButton remaining={hintsLeft} onTap={() => setShowHintSheet(true)} accent={ACCENT} />
        </div>
      </div>

      <div style={{ height: 4, backgroundColor: "var(--card)", position: "relative" }}>
        <motion.div
          initial={{ width: `${(expIdx / experimentsPerSession) * 100}%` }}
          animate={{ width: `${((expIdx + 1) / experimentsPerSession) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: "100%", backgroundColor: ACCENT }}
        />
      </div>

      {/* Target outcome card */}
      <div style={{ padding: "16px 16px 8px" }}>
        <div style={{
          padding: "12px 16px", borderRadius: 12,
          backgroundColor: `color-mix(in srgb, ${ACCENT} 10%, var(--card))`,
          border: `0.5px solid color-mix(in srgb, ${ACCENT} 30%, var(--border))`,
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <span style={{
            fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
            letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700,
          }}>
            Make
          </span>
          <span style={{
            fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)",
            letterSpacing: -0.2,
          }}>
            {currentExp.name}
          </span>
          <span style={{
            fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.4,
          }}>
            {currentExp.description}
          </span>
        </div>
      </div>

      {/* Beaker — central visual. Shows stacked ingredient layers. */}
      <motion.div
        animate={wrong ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center"
        style={{ padding: "8px 16px" }}
      >
        <BeakerSVG
          contents={beaker}
          overrideColor={beakerColor}
          reacting={reacting}
          accent={ACCENT}
        />
      </motion.div>

      {/* Feedback band */}
      <div style={{ minHeight: 24, padding: "0 16px", textAlign: "center" }}>
        <AnimatePresence>
          {reacting && (
            <motion.span
              key="reacting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)" }}
            >
              Reacting…
            </motion.span>
          )}
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
              {currentExp.name} created!
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
              That didn't work — try another combo
            </motion.span>
          )}
          {showRevealed && revealedRecipe && (
            <motion.span
              key="revealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)" }}
            >
              Recipe was {revealedRecipe.map((id) => getIngredient(id).name).join(" + ")}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons — Clear + Mix */}
      <div className="flex items-center justify-center" style={{ padding: "12px 16px 16px", gap: 8 }}>
        <motion.button
          whileTap={!interactionsDisabled && beaker.length > 0 ? { scale: 0.97 } : undefined}
          onClick={clearBeaker}
          disabled={interactionsDisabled || beaker.length === 0}
          className="flex items-center justify-center"
          style={{
            height: 40, borderRadius: 8, gap: 8,
            paddingLeft: 16, paddingRight: 16,
            backgroundColor: interactionsDisabled || beaker.length === 0 ? "var(--disabled-bg)" : "var(--card)",
            border: "0.5px solid var(--border)",
            cursor: interactionsDisabled || beaker.length === 0 ? "default" : "pointer",
          }}
        >
          <Trash2 size={14} style={{ color: interactionsDisabled || beaker.length === 0 ? "var(--disabled-text)" : "var(--muted-foreground)" }} />
          <span style={{
            fontSize: "var(--text-sm)", fontWeight: 600,
            color: interactionsDisabled || beaker.length === 0 ? "var(--disabled-text)" : "var(--foreground)",
          }}>
            Clear
          </span>
        </motion.button>
        <motion.button
          whileTap={!interactionsDisabled && beaker.length > 0 ? { scale: 0.97 } : undefined}
          onClick={mix}
          disabled={interactionsDisabled || beaker.length === 0}
          className="flex items-center justify-center"
          style={{
            height: 40, borderRadius: 8, gap: 8,
            paddingLeft: 20, paddingRight: 20,
            backgroundColor: interactionsDisabled || beaker.length === 0 ? "var(--disabled-bg)" : ACCENT,
            border: "none",
            cursor: interactionsDisabled || beaker.length === 0 ? "default" : "pointer",
          }}
        >
          <Sparkles size={14} style={{ color: interactionsDisabled || beaker.length === 0 ? "var(--disabled-text)" : "var(--white)" }} />
          <span style={{
            fontSize: "var(--text-sm)", fontWeight: 600,
            color: interactionsDisabled || beaker.length === 0 ? "var(--disabled-text)" : "var(--white)",
            letterSpacing: 0.2,
          }}>
            Mix
          </span>
        </motion.button>
      </div>

      {/* Ingredient palette — 4×2 grid */}
      <div className="flex flex-wrap items-center justify-center" style={{
        padding: "8px 16px 24px",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        marginTop: "auto", gap: 8,
      }}>
        {INGREDIENTS.map((ing) => {
          const count = beaker.filter((b) => b === ing.id).length;
          return (
            <motion.button
              key={ing.id}
              whileTap={!interactionsDisabled ? { scale: 0.95 } : undefined}
              onClick={() => addIngredient(ing.id)}
              disabled={interactionsDisabled || beaker.length >= MAX_BEAKER_SLOTS}
              className="flex flex-col items-center justify-center"
              style={{
                width: 72, height: 56, borderRadius: 8,
                backgroundColor: "var(--card)",
                border: count > 0
                  ? `1px solid ${ing.color}`
                  : "0.5px solid var(--border)",
                cursor: interactionsDisabled || beaker.length >= MAX_BEAKER_SLOTS ? "default" : "pointer",
                gap: 4, position: "relative", overflow: "hidden",
              }}
            >
              {/* Color bar at top — communicates the ingredient identity */}
              <div aria-hidden style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 8,
                backgroundColor: ing.color,
              }} />
              <span style={{
                fontSize: "var(--text-xs)", fontWeight: 700,
                color: "var(--foreground)", marginTop: 12,
              }}>
                {ing.name}
              </span>
              {count > 0 && (
                <span style={{
                  position: "absolute", top: 4, right: 4,
                  fontSize: "var(--text-2xs)", fontWeight: 800,
                  color: "var(--foreground)",
                  backgroundColor: `color-mix(in srgb, ${ing.color} 50%, var(--card))`,
                  width: 16, height: 16, borderRadius: 9999,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      <HintSheet
        open={showHintSheet}
        hint={hintForCurrent()}
        remaining={hintsLeft}
        accent={ACCENT}
        onUse={useHint}
        onClose={() => setShowHintSheet(false)}
        isDesktop={isDesktop}
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// Lab beaker SVG. Renders stacked colored layers for each ingredient added,
// with optional outcome override and reaction bubbles.
function BeakerSVG({
  contents, overrideColor, reacting, accent,
}: {
  contents: IngredientId[];
  overrideColor: string | null;
  reacting: boolean;
  accent: string;
}) {
  // Beaker shape: 160 wide × 200 tall, lip at top, conical body
  // Inside fill area: roughly (28, 60) to (132, 184) — a rectangle
  const fillTop = 60;
  const fillBottom = 184;
  const fillHeight = fillBottom - fillTop;
  const layerCount = Math.max(1, MAX_BEAKER_SLOTS); // visual slots
  const layerHeight = fillHeight / layerCount;

  return (
    <svg viewBox="0 0 160 220" width="160" height="220" aria-hidden>
      <defs>
        <clipPath id="beaker-inside">
          {/* Inside cavity follows the beaker walls */}
          <polygon points="32,60 128,60 124,184 36,184" />
        </clipPath>
      </defs>

      {/* Beaker lip + neck */}
      <rect x="24" y="48" width="112" height="12" rx="2" fill="none" stroke={accent} strokeOpacity="0.6" strokeWidth="1.5" />

      {/* Beaker body outline */}
      <polygon
        points="32,60 128,60 124,184 36,184"
        fill="color-mix(in srgb, var(--card) 80%, transparent)"
        stroke={accent} strokeOpacity="0.6" strokeWidth="1.5"
      />

      {/* Stacked ingredient layers OR override color (correct reaction / reacting) */}
      <g clipPath="url(#beaker-inside)">
        {overrideColor ? (
          <rect x="28" y={fillTop} width="104" height={fillHeight} fill={overrideColor} />
        ) : (
          contents.map((id, i) => {
            const y = fillBottom - (i + 1) * layerHeight;
            return (
              <rect
                key={`${id}-${i}`}
                x="28" y={y}
                width="104" height={layerHeight}
                fill={getIngredient(id).color}
                opacity={0.85}
              />
            );
          })
        )}

        {/* Reaction bubbles overlay */}
        {reacting && (
          <g>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.circle
                key={i}
                cx={48 + i * 16}
                cy={fillBottom}
                r="4"
                fill="var(--white)"
                opacity={0.7}
                initial={{ cy: fillBottom, opacity: 0.8 }}
                animate={{ cy: fillTop, opacity: 0 }}
                transition={{ duration: 0.9, delay: i * 0.08, repeat: 0 }}
              />
            ))}
          </g>
        )}
      </g>

      {/* Volume marks on the side */}
      {[1, 2, 3].map((i) => {
        const y = fillTop + (fillHeight / 4) * i;
        return (
          <line
            key={i}
            x1="118" y1={y} x2="124" y2={y}
            stroke={accent} strokeOpacity="0.4" strokeWidth="1"
          />
        );
      })}

      {/* Lab table baseline */}
      <line x1="20" y1="200" x2="140" y2="200" stroke="var(--border)" strokeWidth="1" />
    </svg>
  );
}

// Lab tier title — light identity reward at result; no shaming at low scores.
function labTier(correct: number): { title: string } {
  if (correct >= 5) return { title: "Lab Master!" };
  if (correct >= 4) return { title: "Senior Scientist" };
  if (correct >= 3) return { title: "Junior Scientist" };
  if (correct >= 1) return { title: "Lab Apprentice" };
  return { title: "Scientist in training" };
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
