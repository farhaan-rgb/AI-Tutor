/**
 * Memory Match — classic concentration / pairs game for Class 1–4 kids.
 * Route: /marketplace/game/memory-match/play
 *
 * Why this game exists in the catalog:
 *   - Indian K–5 parents instinctively associate memory training with
 *     intelligence development. None of the existing 6 games tests visual
 *     memory directly; they all test recall (quiz) or computation (math).
 *   - Memory Match is the cognitive-training pillar that brings the catalog
 *     out of quiz-only territory.
 *   - Mechanic is genuinely different from anything else shipped: tap-to-flip
 *     with delayed reveal, working-memory load, no time pressure.
 *
 * Mechanic — classic Concentration:
 *   - Cards face-down in a grid. Tap to flip. Find pairs of matching icons.
 *   - 3 progressive rounds: 2×3 (3 pairs) → 3×4 (6 pairs) → 4×4 (8 pairs).
 *   - 1-star / 2-star / 3-star rating per round based on moves vs minimum
 *     (minimum = pairs × 2 attempted card-flip pairs).
 *   - No timer. Memory + patience > speed.
 *
 * Paid game (Class 1–4 cohort). Trial gate fires after 3 sessions without Pass.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, Trophy, Star, RefreshCw, ChevronRight, Brain,
  Sun, Moon, Heart, Cat, Dog, Apple, Cake,
} from "lucide-react";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { useGamesPass } from "../shared/games-pass-state";
import { TrialGateSheet } from "./trial-gate-sheet";
import { DUMMY_GAMES } from "./marketplace-v1";
import {
  TopExitBar, DailyComparisonStrip, OtherGamesRail,
  DifficultyPicker, HowToButton, HowToSheet,
  HintButton, MAX_HINTS, getVibe,
  type Difficulty, type HowToStep,
} from "../shared/game-result-shared";

const HOW_TO_STEPS: HowToStep[] = [
  { title: "Tap a card to flip it", body: "You'll see what's underneath for a moment." },
  { title: "Find the matching pair", body: "Tap a second card. If it matches, both stay face-up. If not, they flip back." },
  { title: "Match all pairs to win", body: "Fewer moves = more stars. 3 rounds get harder each time." },
];

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCENT = "var(--primary-500)";    // Memory Match's per-game blue
const GAME_ID = "memory-match";
const TRIAL_LEVELS = 3;
const FLIP_BACK_MS = 1000;             // Wait before flipping unmatched pair back
const MATCH_HOLD_MS = 600;             // Pause after match before re-enabling taps
const ROUND_ADVANCE_MS = 1100;         // Pause after round complete before next round

// ─── Icon palette ────────────────────────────────────────────────────────────
// 8 friendly icons for the hardest round (4×4 = 8 pairs).
// All Lucide; no emojis. Colors set to ACCENT — identity comes from shape,
// not color (testing TRUE visual memory, not just color-matching).
type IconKey = "sun" | "moon" | "star" | "heart" | "cat" | "dog" | "apple" | "cake";
const ICON_POOL: { key: IconKey; Icon: typeof Sun }[] = [
  { key: "sun",   Icon: Sun },
  { key: "moon",  Icon: Moon },
  { key: "star",  Icon: Star },
  { key: "heart", Icon: Heart },
  { key: "cat",   Icon: Cat },
  { key: "dog",   Icon: Dog },
  { key: "apple", Icon: Apple },
  { key: "cake",  Icon: Cake },
];

// ─── Round configuration ─────────────────────────────────────────────────────
interface RoundConfig {
  pairs: number;
  cols: number;
  rows: number;
  cardW: number;
  cardH: number;
}
// Round mix per difficulty. Easy stays simple (3 small rounds). Medium is the
// progressive default. Hard skips warmup entirely — straight into 6/8/8.
const ROUNDS_BY_DIFFICULTY: Record<Difficulty, RoundConfig[]> = {
  easy: [
    { pairs: 3, cols: 3, rows: 2, cardW: 88, cardH: 112 },
    { pairs: 4, cols: 4, rows: 2, cardW: 80, cardH: 100 },
    { pairs: 5, cols: 5, rows: 2, cardW: 64, cardH: 80 },
  ],
  medium: [
    { pairs: 3, cols: 3, rows: 2, cardW: 88, cardH: 112 },
    { pairs: 6, cols: 4, rows: 3, cardW: 76, cardH: 96 },
    { pairs: 8, cols: 4, rows: 4, cardW: 72, cardH: 88 },
  ],
  hard: [
    { pairs: 6, cols: 4, rows: 3, cardW: 76, cardH: 96 },
    { pairs: 8, cols: 4, rows: 4, cardW: 72, cardH: 88 },
    { pairs: 8, cols: 4, rows: 4, cardW: 72, cardH: 88 },
  ],
};
const TOTAL_ROUNDS = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

interface Card {
  id: number;
  iconKey: IconKey;
  Icon: typeof Sun;
  flipped: boolean;
  matched: boolean;
}

// Generate the card deck for a round: pick `pairs` distinct icons, duplicate
// each, shuffle.
function buildDeck(pairs: number): Card[] {
  const picked = shuffle(ICON_POOL).slice(0, pairs);
  const deck: Card[] = [];
  picked.forEach(({ key, Icon }, i) => {
    deck.push({ id: i * 2,     iconKey: key, Icon, flipped: false, matched: false });
    deck.push({ id: i * 2 + 1, iconKey: key, Icon, flipped: false, matched: false });
  });
  return shuffle(deck);
}

// Stars from move count. Minimum theoretical = pairs (each match takes 1
// "pair-move"). 3-star = perfect or near-perfect, 2-star = a few mistakes,
// 1-star = many mistakes.
function starsFromMoves(moves: number, pairs: number): 1 | 2 | 3 {
  const min = pairs;
  if (moves <= min + 1) return 3;
  if (moves <= min + 4) return 2;
  return 1;
}

type Phase = "intro" | "playing" | "result";

// ─── Component ───────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const pass = useGamesPass();

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [showHowTo, setShowHowTo] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [roundResults, setRoundResults] = useState<{ stars: 1 | 2 | 3; moves: number }[]>([]);

  // Round config — driven by current difficulty
  const ROUNDS = ROUNDS_BY_DIFFICULTY[difficulty];

  // Per-round state
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIdx, setFlippedIdx] = useState<number[]>([]);   // 0–2 entries
  const [moves, setMoves] = useState(0);                         // pair-attempts
  const [locked, setLocked] = useState(false);                   // brief tap lock during reveal
  const [roundComplete, setRoundComplete] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [previewIdx, setPreviewIdx] = useState<number[]>([]);    // briefly reveal a pair
  const vibe = getVibe(difficulty);

  // Hint = briefly reveal one un-matched pair for 1.4s
  function useHint() {
    if (hintsLeft <= 0 || locked || roundComplete) return;
    // Find an un-matched pair that's not currently flipped
    const seen = new Map<string, number>();
    let pair: [number, number] | null = null;
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      if (c.matched || c.flipped) continue;
      const prev = seen.get(c.iconKey);
      if (prev !== undefined) { pair = [prev, i]; break; }
      seen.set(c.iconKey, i);
    }
    if (!pair) return;
    setHintsLeft((h) => h - 1);
    setPreviewIdx(pair);
    setTimeout(() => setPreviewIdx([]), 1400);
  }

  // Trial-gate (paid game)
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

  const cfg = ROUNDS[roundIdx];

  // Init deck on entering a new round
  useEffect(() => {
    if (phase !== "playing") return;
    setCards(buildDeck(cfg.pairs));
    setFlippedIdx([]);
    setMoves(0);
    setLocked(false);
    setRoundComplete(false);
  }, [phase, roundIdx, cfg.pairs]);

  // When two cards are flipped, evaluate
  useEffect(() => {
    if (flippedIdx.length !== 2) return;
    setLocked(true);
    setMoves((m) => m + 1);
    const [a, b] = flippedIdx;
    const cardA = cards[a];
    const cardB = cards[b];
    if (!cardA || !cardB) return;

    if (cardA.iconKey === cardB.iconKey) {
      // Match
      const t = setTimeout(() => {
        setCards((prev) => prev.map((c, i) =>
          i === a || i === b ? { ...c, matched: true } : c
        ));
        setFlippedIdx([]);
        setLocked(false);
      }, MATCH_HOLD_MS);
      return () => clearTimeout(t);
    }
    // Not a match — flip both back after a beat
    const t = setTimeout(() => {
      setCards((prev) => prev.map((c, i) =>
        i === a || i === b ? { ...c, flipped: false } : c
      ));
      setFlippedIdx([]);
      setLocked(false);
    }, FLIP_BACK_MS);
    return () => clearTimeout(t);
  }, [flippedIdx, cards]);

  // When all matched → mark round complete + record stars. We split detection
  // from advancement because before, both lived in one effect — setRoundComplete
  // re-ran the effect and its cleanup killed the advance timer before it fired.
  useEffect(() => {
    if (phase !== "playing" || cards.length === 0 || roundComplete) return;
    const allMatched = cards.every((c) => c.matched);
    if (!allMatched) return;
    const stars = starsFromMoves(moves, cfg.pairs);
    setRoundComplete(true);
    setRoundResults((prev) => [...prev, { stars, moves }]);
  }, [cards, phase, roundComplete, moves, cfg.pairs]);

  // After round-complete is set, schedule the advance separately. This effect
  // only re-runs when roundComplete flips, so its cleanup can't race the timer.
  useEffect(() => {
    if (!roundComplete) return;
    const t = setTimeout(() => {
      if (roundIdx + 1 >= TOTAL_ROUNDS) {
        setPhase("result");
      } else {
        setRoundIdx((i) => i + 1);
      }
    }, ROUND_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [roundComplete, roundIdx]);

  function tapCard(idx: number) {
    if (locked || roundComplete) return;
    if (flippedIdx.length >= 2) return;
    const c = cards[idx];
    if (!c || c.flipped || c.matched) return;
    setCards((prev) => prev.map((x, i) => i === idx ? { ...x, flipped: true } : x));
    setFlippedIdx((prev) => [...prev, idx]);
  }

  function startGame() {
    setRoundIdx(0);
    setRoundResults([]);
    setHintsLeft(MAX_HINTS);
    setPreviewIdx([]);
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
            Memory Match · Class 1–4
          </span>

          {/* Brain icon block */}
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
              background: `linear-gradient(135deg, ${ACCENT} 0%, color-mix(in srgb, ${ACCENT} 65%, var(--background)) 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 16px 40px color-mix(in srgb, ${ACCENT} 55%, transparent), inset 0 2px 0 color-mix(in srgb, var(--white) 32%, transparent)`,
            }}>
              <Brain size={44} style={{ color: "var(--white)" }} strokeWidth={2.25} />
            </div>
          </div>

          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <h1 style={{ fontSize: vibe.titleSize, fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: vibe.letterSpacing, lineHeight: "40px", minHeight: 40 }}>
              Memory Match
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center", maxWidth: 280 }}>
              Flip cards. Find pairs. 3 rounds, getting harder.
            </span>
          </div>

          <div className="flex items-center" style={{
            gap: 16, padding: "12px 20px", borderRadius: 12,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
          }}>
            <StatCol value={`${TOTAL_ROUNDS}`} label="Rounds" />
            <Divider />
            <StatCol value="No timer" label="Pace" />
            <Divider />
            <StatCol value="3 stars" label="Per round" />
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
            <Brain size={16} style={{ color: "var(--white)" }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)" }}>
              Start matching
            </span>
          </motion.button>
        </div>
        <HowToSheet
          open={showHowTo}
          gameTitle="Memory Match"
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
    const totalStars = roundResults.reduce((acc, r) => acc + r.stars, 0);
    const maxStars = TOTAL_ROUNDS * 3;
    // For DailyComparisonStrip: map "score" to stars-earned-out-of-max
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
              {memoryTier(totalStars).title}
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
              {totalStars}/{maxStars} stars across {TOTAL_ROUNDS} rounds
            </span>
          </div>

          {/* Per-round stars table */}
          <div className="flex flex-col" style={{
            width: "100%", maxWidth: 360,
            padding: "12px 0", borderRadius: 16,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
            gap: 0,
          }}>
            {roundResults.map((r, i) => (
              <div key={i} className="flex items-center" style={{
                padding: "10px 16px",
                borderBottom: i < roundResults.length - 1
                  ? "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)"
                  : "none",
                gap: 12,
              }}>
                <div className="flex items-center justify-center" style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
                }}>
                  <span style={{
                    fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--foreground)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {i + 1}
                  </span>
                </div>
                <div className="flex flex-col" style={{ gap: 2, minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                    {ROUNDS[i].pairs} pairs
                  </span>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                    {r.moves} moves
                  </span>
                </div>
                <StarRow count={r.stars} />
              </div>
            ))}
          </div>

          <DailyComparisonStrip yourScore={totalStars} total={maxStars} />

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
          gameTitle="Memory Match"
          isDesktop={isDesktop}
        />
      </div>
    );
  }

  // ─── PLAYING ──────────────────────────────────────────────────────────
  const matchedPairs = cards.filter((c) => c.matched).length / 2;
  return (
    <div className="flex flex-col" style={containerStyle}>
      <TopExitBar onExit={() => navigate(-1)} />

      {/* Top bar — round + pairs found + moves */}
      <div className="flex items-center justify-between" style={{
        padding: "12px 16px", borderBottom: "0.5px solid var(--border)", gap: 12,
      }}>
        <span style={{
          fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
          letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700,
        }}>
          Round {roundIdx + 1} of {TOTAL_ROUNDS}
        </span>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <Check size={12} style={{ color: "var(--success-500)" }} strokeWidth={3} />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
              {matchedPairs}/{cfg.pairs}
            </span>
          </div>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
            ·
          </span>
          <span style={{
            fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-foreground)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {moves} moves
          </span>
          <HintButton remaining={hintsLeft} onTap={useHint} accent={ACCENT} />
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, backgroundColor: "var(--card)", position: "relative" }}>
        <motion.div
          animate={{ width: `${(matchedPairs / cfg.pairs) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: "100%", backgroundColor: ACCENT }}
        />
      </div>

      {/* Card grid — centered */}
      <div className="flex-1 flex items-center justify-center" style={{ padding: "20px 16px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cfg.cols}, ${cfg.cardW}px)`,
          gridAutoRows: `${cfg.cardH}px`,
          gap: 8,
        }}>
          {cards.map((card, i) => {
            const isPreview = previewIdx.includes(i);
            const previewCard = isPreview ? { ...card, flipped: true } : card;
            return (
              <FlipCard
                key={card.id}
                card={previewCard}
                width={cfg.cardW}
                height={cfg.cardH}
                onTap={() => tapCard(i)}
                disabled={locked || card.flipped || card.matched || isPreview}
              />
            );
          })}
        </div>
      </div>

      {/* Round-complete celebration overlay — tap to advance early, or auto */}
      <AnimatePresence>
        {roundComplete && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (roundIdx + 1 >= TOTAL_ROUNDS) setPhase("result");
              else setRoundIdx((i) => i + 1);
            }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
              padding: "16px",
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              backgroundColor: "var(--card)",
              borderTop: "0.5px solid var(--border)",
              maxWidth: isDesktop ? 720 : undefined,
              marginLeft: isDesktop ? "auto" : undefined,
              marginRight: isDesktop ? "auto" : undefined,
              cursor: "pointer", border: "none", width: "100%",
            }}
          >
            <div className="flex items-center justify-center" style={{ gap: 8 }}>
              <Check size={18} style={{ color: "var(--success-500)" }} strokeWidth={3} />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", fontWeight: 700 }}>
                Round {roundIdx + 1} complete · {starsFromMoves(moves, cfg.pairs)} stars
              </span>
              <ChevronRight size={16} style={{ color: "var(--muted-foreground)" }} />
            </div>
            <div className="flex items-center justify-center" style={{ gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                {roundIdx + 1 >= TOTAL_ROUNDS ? "Tap to see your results" : `Tap for Round ${roundIdx + 2}`}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FlipCard({
  card, width, height, onTap, disabled,
}: {
  card: Card;
  width: number;
  height: number;
  onTap: () => void;
  disabled: boolean;
}) {
  const isUp = card.flipped || card.matched;
  const CardIcon = card.Icon;
  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={onTap}
      disabled={disabled}
      style={{
        width, height, borderRadius: 12,
        padding: 0, border: "none", background: "transparent",
        cursor: disabled && !card.matched ? "default" : "pointer",
        perspective: 600,
      }}
      aria-label={isUp ? `Card showing ${card.iconKey}` : "Face-down card"}
    >
      <motion.div
        animate={{ rotateY: isUp ? 180 : 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: "relative", width: "100%", height: "100%",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Face-down side */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 12,
          backgroundColor: ACCENT,
          backfaceVisibility: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 0 -4px 0 color-mix(in srgb, var(--black) 15%, transparent), inset 0 2px 0 color-mix(in srgb, var(--white) 18%, transparent)",
        }}>
          <div style={{
            width: "50%", height: "50%", borderRadius: 8,
            border: "1.5px dashed color-mix(in srgb, var(--white) 35%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "color-mix(in srgb, var(--white) 55%, transparent)" }}>?</span>
          </div>
        </div>

        {/* Face-up side */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 12,
          backgroundColor: card.matched
            ? "color-mix(in srgb, var(--success-500) 18%, var(--card))"
            : "var(--card)",
          border: card.matched
            ? "1px solid var(--success-500)"
            : `1px solid color-mix(in srgb, ${ACCENT} 35%, var(--border))`,
          transform: "rotateY(180deg)",
          backfaceVisibility: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CardIcon
            size={Math.max(28, Math.floor(width * 0.42))}
            style={{ color: card.matched ? "var(--success-500)" : ACCENT }}
            strokeWidth={2.25}
          />
        </div>
      </motion.div>
    </motion.button>
  );
}

function StarRow({ count }: { count: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center" style={{ gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={14}
          style={{
            color: i <= count ? "var(--warning-500)" : "color-mix(in srgb, var(--foreground) 20%, transparent)",
            fill: i <= count ? "var(--warning-500)" : "transparent",
          }}
          strokeWidth={2}
        />
      ))}
    </div>
  );
}

function memoryTier(totalStars: number): { title: string } {
  const maxStars = TOTAL_ROUNDS * 3;
  if (totalStars >= maxStars)     return { title: "Memory Master!" };
  if (totalStars >= maxStars - 2) return { title: "Sharp Mind" };
  if (totalStars >= maxStars - 4) return { title: "Good Recall" };
  if (totalStars >= 3)            return { title: "Keep practising" };
  return { title: "Memory in training" };
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
