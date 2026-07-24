/**
 * Word Wizard — playable spelling game for Class 1–4 kids.
 * Route: /marketplace/game/word-wars/play  (id stable; UI title is "Word Wizard")
 *
 * Free game in the hybrid model (see SESSION.md / marketplace-v1.tsx).
 * No trial gate, no Pass plumbing. Cross-sell card on result handles soft
 * conversion to the Pass for the 4 paid games.
 *
 * Phases:
 *   1. intro   — wizard hat + stats row + "Start spelling" CTA
 *   2. playing — 10 words, tap-to-place letter tiles into slots, 3 hints,
 *                auto-reveal after 3 wrong attempts (no shaming the kid)
 *   3. result  — Wizard level title, breakdown (first try / hint / revealed),
 *                cross-sell to Pass (adaptive copy by pass state)
 *
 * Design principles for the Class 1–4 audience (vs the older Brain Battle /
 * Daily Drill which use MCQ + timers):
 *   - No timer. Class 1–4 kids panic; spelling is a vocabulary skill, not a
 *     speed skill at this age.
 *   - Tap-to-place over drag. Small fingers + drag = frustration. Tap a tile
 *     to fly it into the next empty slot; tap a filled slot to return a letter.
 *   - Forgiving feedback. Wrong attempt softly shakes + clears, no red Xs.
 *     After 3 wrongs we reveal the word and move on. No "you failed" copy.
 *   - Visual context. Each word has a Lucide icon (Cat, Apple, etc.) so a
 *     kid who can't yet read the hint still has a clue.
 *   - 44px touch targets per WCAG / iOS minimums.
 *
 * v1 ships silent. Audio (Web Speech API for letter + word pronunciation)
 * is a clear next polish if engagement is good — left out now because
 * cross-browser TTS quality is unpredictable and permissions are fiddly.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, Check, ChevronRight, Lightbulb, RefreshCw,
  Cat, Dog, Sun, Car, Bus, Bird, Fish, BookOpen, Star, Moon,
  Cake, Apple, Home, Smile, TrainFront, Cloud, Heart, TreeDeciduous,
  Flame, Trophy,
} from "lucide-react";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { useGamesPass } from "../shared/games-pass-state";
import { GAMES_PASS, DUMMY_GAMES } from "./marketplace-v1";
import {
  TopExitBar,
  DailyComparisonStrip,
  OtherGamesRail,
  DifficultyPicker,
  HowToButton,
  HowToSheet,
  HintButton,
  getVibe,
  type Difficulty as GameDifficulty,
  type HowToStep,
} from "../shared/game-result-shared";

const HOW_TO_STEPS: HowToStep[] = [
  { title: "Look at the picture", body: "The icon and hint tell you what word to spell." },
  { title: "Tap letter tiles", body: "Tap a tile to fly it into the next empty slot. Tap a slot to send the letter back." },
  { title: "Spell all 10 words", body: "Use a hint if stuck (3 per round). After 3 wrong tries, the word reveals itself." },
];

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCENT = "var(--mark-review-500)";   // Word Wizard's per-game purple
const TOTAL_WORDS = 10;
const HINTS_PER_ROUND = 3;
const MAX_WRONG_ATTEMPTS = 3;              // After this, reveal + advance
const CORRECT_HOLD_MS = 1400;              // Celebrate before next word
const REVEAL_HOLD_MS = 2200;               // Show revealed answer before advancing
const WRONG_RESET_MS = 600;                // Shake-and-clear delay

type Difficulty = 1 | 2 | 3;
type LucideIcon = typeof Cat;

interface Word {
  word: string;
  hint: string;
  Icon: LucideIcon;
  difficulty: Difficulty;
}

// TODO(api): GET /api/marketplace/games/word-wars/bank — curated Class 1–4 words
// with Lucide-mappable visuals. Bank stays small + tested at launch.
const WORD_BANK: Word[] = [
  // ── 3-letter (easy) — Class 1–2 ──
  { word: "CAT",   hint: "A small furry pet that says meow",     Icon: Cat,       difficulty: 1 },
  { word: "DOG",   hint: "Your best friend that barks",          Icon: Dog,       difficulty: 1 },
  { word: "SUN",   hint: "Bright star that lights up our day",   Icon: Sun,       difficulty: 1 },
  { word: "CAR",   hint: "Has four wheels and drives",           Icon: Car,       difficulty: 1 },
  { word: "BUS",   hint: "Big vehicle that takes kids to school", Icon: Bus,      difficulty: 1 },
  // ── 4-letter (medium) — Class 2–3 ──
  { word: "BIRD",  hint: "It flies and sings in the morning",    Icon: Bird,      difficulty: 2 },
  { word: "FISH",  hint: "Lives in water, has fins",             Icon: Fish,      difficulty: 2 },
  { word: "BOOK",  hint: "Has pages with stories inside",        Icon: BookOpen,  difficulty: 2 },
  { word: "STAR",  hint: "Twinkles in the night sky",            Icon: Star,      difficulty: 2 },
  { word: "MOON",  hint: "Glows white at night",                 Icon: Moon,      difficulty: 2 },
  { word: "CAKE",  hint: "Sweet treat with candles on birthdays", Icon: Cake,     difficulty: 2 },
  { word: "TREE",  hint: "Tall and green, has leaves",           Icon: TreeDeciduous, difficulty: 2 },
  // ── 5-letter (hard) — Class 3–4 ──
  { word: "APPLE", hint: "Red fruit a teacher might give you",   Icon: Apple,     difficulty: 3 },
  { word: "HOUSE", hint: "Where your family lives",              Icon: Home,      difficulty: 3 },
  { word: "SMILE", hint: "Shows on your face when happy",        Icon: Smile,     difficulty: 3 },
  { word: "TRAIN", hint: "Long vehicle that runs on tracks",     Icon: TrainFront, difficulty: 3 },
  { word: "CLOUD", hint: "Soft and fluffy in the sky",           Icon: Cloud,     difficulty: 3 },
  { word: "HEART", hint: "Shape of love",                        Icon: Heart,     difficulty: 3 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Pick 10 words for the round, weighted by selected difficulty.
// Easy   = mostly 3-letter (7·1 + 3·2 + 0·3)
// Medium = balanced       (4·1 + 4·2 + 2·3) ← previous default
// Hard   = mostly 5-letter (2·1 + 4·2 + 4·3)
function pickRoundWords(diff: GameDifficulty): Word[] {
  const e = shuffle(WORD_BANK.filter((w) => w.difficulty === 1));
  const m = shuffle(WORD_BANK.filter((w) => w.difficulty === 2));
  const h = shuffle(WORD_BANK.filter((w) => w.difficulty === 3));
  if (diff === "easy")   return [...e.slice(0, 5), ...m.slice(0, 5)];
  if (diff === "hard")   return [...m.slice(0, 4), ...h.slice(0, 6)];
  return [...e.slice(0, 4), ...m.slice(0, 4), ...h.slice(0, 2)];
}

// Build the scrambled tile set. Pads with up to 2 vowel distractors when the
// word is short, so a 3-letter kid still picks from a 5-tile pool (still solvable,
// not trivially obvious).
function buildTiles(word: string): string[] {
  const letters = word.split("");
  const vowelPool = ["A", "E", "I", "O", "U"].filter((v) => !letters.includes(v));
  const distractorCount = Math.max(0, 5 - letters.length);
  const withDistractors = [...letters, ...shuffle(vowelPool).slice(0, distractorCount)];
  return shuffle(withDistractors);
}

type Phase = "intro" | "playing" | "result";
type WordResult = "first-try" | "with-hint" | "revealed";

// ─── Component ───────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const pass = useGamesPass();

  const [difficulty, setDifficulty] = useState<GameDifficulty>("medium");
  const [showHowTo, setShowHowTo] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const vibe = getVibe(difficulty);
  const [words, setWords] = useState<Word[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [results, setResults] = useState<WordResult[]>([]);

  // Per-word state
  const [tiles, setTiles] = useState<{ letter: string; placed: boolean; key: string }[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [feedback, setFeedback] = useState<"none" | "correct" | "wrong" | "revealed">("none");

  const currentWord = words[wordIdx];

  // Reset state when entering a new word
  useEffect(() => {
    if (phase !== "playing" || !currentWord) return;
    const scrambled = buildTiles(currentWord.word);
    setTiles(scrambled.map((letter, i) => ({ letter, placed: false, key: `${wordIdx}-${i}-${letter}` })));
    setSlots(Array(currentWord.word.length).fill(null));
    setHintsUsed(0);
    setWrongAttempts(0);
    setFeedback("none");
  }, [phase, wordIdx, currentWord]);

  // Validation — when slots fill, evaluate and set feedback ONLY (no timers
  // here). Splitting timer logic into a separate effect avoids a deps-cleanup
  // race: previously, this effect's cleanup would clearTimeout the reset
  // timer the moment feedback flipped to "wrong", leaving tiles disabled
  // forever (feedback stuck at "wrong").
  useEffect(() => {
    if (phase !== "playing" || !currentWord || feedback !== "none") return;
    if (!slots.every((s) => s !== null)) return;

    const attempt = slots.join("");
    if (attempt === currentWord.word) {
      setFeedback("correct");
      const result: WordResult = hintsUsed > 0 ? "with-hint" : "first-try";
      setResults((r) => [...r, result]);
      return;
    }

    const nextWrong = wrongAttempts + 1;
    setWrongAttempts(nextWrong);
    if (nextWrong >= MAX_WRONG_ATTEMPTS) {
      setFeedback("revealed");
      setSlots(currentWord.word.split(""));
      setResults((r) => [...r, "revealed"]);
      return;
    }
    setFeedback("wrong");
  }, [slots, currentWord, phase, hintsUsed, wrongAttempts, feedback]);

  // Timeout effect — schedules the post-feedback action (advance / reset)
  // based on feedback state. Owns all timers; safe from validation-effect
  // re-fires.
  useEffect(() => {
    if (phase !== "playing" || !currentWord) return;
    if (feedback === "correct" || feedback === "revealed") {
      const hold = feedback === "correct" ? CORRECT_HOLD_MS : REVEAL_HOLD_MS;
      const t = setTimeout(() => {
        if (wordIdx + 1 >= TOTAL_WORDS) setPhase("result");
        else setWordIdx((i) => i + 1);
      }, hold);
      return () => clearTimeout(t);
    }
    if (feedback === "wrong") {
      const t = setTimeout(() => {
        setSlots(Array(currentWord.word.length).fill(null));
        setTiles((arr) => arr.map((tile) => ({ ...tile, placed: false })));
        setFeedback("none");
      }, WRONG_RESET_MS);
      return () => clearTimeout(t);
    }
  }, [feedback, phase, currentWord, wordIdx]);

  function tapTile(tileIdx: number) {
    if (feedback !== "none") return;
    const tile = tiles[tileIdx];
    if (tile.placed) return;
    const nextSlotIdx = slots.findIndex((s) => s === null);
    if (nextSlotIdx === -1) return;
    setSlots((s) => s.map((v, i) => (i === nextSlotIdx ? tile.letter : v)));
    setTiles((t) => t.map((v, i) => (i === tileIdx ? { ...v, placed: true } : v)));
  }

  function tapSlot(slotIdx: number) {
    if (feedback !== "none") return;
    const letter = slots[slotIdx];
    if (letter === null) return;
    setSlots((s) => s.map((v, i) => (i === slotIdx ? null : v)));
    // Return the first placed tile of this letter back to the pool
    setTiles((t) => {
      const idx = t.findIndex((tile) => tile.letter === letter && tile.placed);
      if (idx === -1) return t;
      return t.map((v, i) => (i === idx ? { ...v, placed: false } : v));
    });
  }

  function useHint() {
    if (feedback !== "none" || hintsUsed >= HINTS_PER_ROUND || !currentWord) return;
    const correct = currentWord.word.split("");
    // Find the first slot that's wrong or empty
    const targetSlot = slots.findIndex((s, i) => s !== correct[i]);
    if (targetSlot === -1) return;
    const needed = correct[targetSlot];

    // If slot has the wrong letter, return that tile first
    setTiles((t) => {
      let updated = t;
      if (slots[targetSlot] !== null) {
        const wrongIdx = t.findIndex((tile) => tile.letter === slots[targetSlot] && tile.placed);
        if (wrongIdx !== -1) updated = updated.map((v, i) => (i === wrongIdx ? { ...v, placed: false } : v));
      }
      // Place a correct-letter tile (must be unplaced)
      const corrIdx = updated.findIndex((tile) => tile.letter === needed && !tile.placed);
      if (corrIdx === -1) return updated;
      return updated.map((v, i) => (i === corrIdx ? { ...v, placed: true } : v));
    });
    setSlots((s) => s.map((v, i) => (i === targetSlot ? needed : v)));
    setHintsUsed((h) => h + 1);
  }

  function startGame() {
    setWords(pickRoundWords(difficulty));
    setWordIdx(0);
    setResults([]);
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
            Word Wizard · Class 1–4
          </span>

          {/* Wand icon with halo + sparkle */}
          <div style={{
            position: "relative",
            width: 140, height: 140,
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
              <Sparkles size={44} style={{ color: "var(--white)" }} strokeWidth={2.25} />
            </div>
          </div>

          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <h1 style={{ fontSize: vibe.titleSize, fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: vibe.letterSpacing, lineHeight: "40px", minHeight: 40 }}>
              Word Wizard
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center" }}>
              Spell 10 words to become the grand wizard
            </span>
          </div>

          {/* Stats row — mirrors Daily Drill's layout, no timer column */}
          <div className="flex items-center" style={{
            gap: 16, padding: "12px 20px", borderRadius: 12,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
          }}>
            <StatCol value={`${TOTAL_WORDS}`} label="Words" />
            <Divider />
            <StatCol value={`${HINTS_PER_ROUND}`} label="Hints" />
            <Divider />
            <StatCol value="Tap" label="To play" />
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
              Start spelling
            </span>
          </motion.button>
        </div>
        <HowToSheet
          open={showHowTo}
          gameTitle="Word Wizard"
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
    const firstTry = results.filter((r) => r === "first-try").length;
    const withHint = results.filter((r) => r === "with-hint").length;
    const revealedCount = results.filter((r) => r === "revealed").length;
    const totalCorrect = firstTry + withHint;
    const wizardTier = wizardLevel(totalCorrect);

    return (
      <div className="flex flex-col" style={containerStyle}>
        <TopExitBar onExit={() => navigate(-1)} />
        <div className="flex-1 flex flex-col items-center" style={{ padding: 24, paddingTop: 32, paddingBottom: 40, gap: 24, overflowY: "auto", minHeight: 0 }}>
          {/* Wizard level — celebratory disk */}
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
              {wizardTier.title}
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
              {totalCorrect}/{TOTAL_WORDS} spelled correctly
            </span>
          </div>

          {/* Breakdown — first try / with hint / revealed */}
          <div className="flex" style={{
            width: "100%", maxWidth: 360, padding: "16px 0", borderRadius: 16,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
          }}>
            <BreakdownCol label="First try" value={firstTry} color="var(--success-500)" />
            <BreakdownDivider />
            <BreakdownCol label="With hint" value={withHint} color="var(--warning-500)" />
            <BreakdownDivider />
            <BreakdownCol label="Revealed" value={revealedCount} color="var(--muted-foreground)" />
          </div>

          {/* Cross-sell — free game pattern. Adapts copy by pass state. */}
          <motion.div
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate(pass.active ? "/marketplace-v1" : "/marketplace/games-pass")}
            className="flex items-center"
            style={{
              width: "100%", maxWidth: 360,
              padding: "12px 14px", borderRadius: 12,
              backgroundColor: "var(--card)",
              border: `0.5px solid color-mix(in srgb, ${ACCENT} 30%, var(--border))`,
              gap: 12, cursor: "pointer",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              backgroundColor: `color-mix(in srgb, ${ACCENT} 18%, transparent)`,
              border: `0.5px solid color-mix(in srgb, ${ACCENT} 36%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Flame size={16} style={{ color: ACCENT }} />
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

          {/* Daily comparison — score-tied percentile vs other players */}
          <DailyComparisonStrip yourScore={totalCorrect} total={TOTAL_WORDS} />

          {/* Other games rail — push to next game */}
          <div style={{ width: "100%", maxWidth: 360 }}>
            <OtherGamesRail currentGameId="word-wars" games={DUMMY_GAMES} />
          </div>

          {/* CTAs */}
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
      </div>
    );
  }

  // ─── PLAYING ──────────────────────────────────────────────────────────
  if (!currentWord) return null;
  const WordIcon = currentWord.Icon;
  const correct = feedback === "correct";
  const wrong = feedback === "wrong";
  const showRevealed = feedback === "revealed";
  const interactionsDisabled = feedback !== "none";

  return (
    <div className="flex flex-col" style={containerStyle}>
      <TopExitBar onExit={() => navigate(-1)} />

      {/* Top bar — Q counter + hint chip */}
      <div className="flex items-center justify-between" style={{
        padding: "12px 16px", borderBottom: "0.5px solid var(--border)", gap: 12,
      }}>
        <span style={{
          fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
          letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700,
        }}>
          Word {wordIdx + 1} of {TOTAL_WORDS}
        </span>
        <HintButton
          remaining={HINTS_PER_ROUND - hintsUsed}
          onTap={useHint}
          accent={ACCENT}
        />
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, backgroundColor: "var(--card)", position: "relative" }}>
        <motion.div
          initial={{ width: `${(wordIdx / TOTAL_WORDS) * 100}%` }}
          animate={{ width: `${((wordIdx + 1) / TOTAL_WORDS) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: "100%", backgroundColor: ACCENT }}
        />
      </div>

      {/* Icon + hint */}
      <div className="flex flex-col items-center" style={{ padding: "24px 16px 8px", gap: 12 }}>
        <motion.div
          key={`icon-${wordIdx}`}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="flex items-center justify-center"
          style={{
            width: 88, height: 88, borderRadius: 20,
            backgroundColor: `color-mix(in srgb, ${ACCENT} 14%, var(--card))`,
            border: `0.5px solid color-mix(in srgb, ${ACCENT} 30%, transparent)`,
          }}
        >
          <WordIcon size={44} style={{ color: ACCENT }} strokeWidth={2} />
        </motion.div>
        <p style={{
          fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
          margin: 0, lineHeight: 1.4, textAlign: "center", maxWidth: 320,
        }}>
          {currentWord.hint}
        </p>
      </div>

      {/* Slots — target word */}
      <motion.div
        animate={wrong ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-center"
        style={{ padding: "20px 16px 12px", gap: 8 }}
      >
        {slots.map((letter, i) => {
          const isCorrectReveal = (correct || showRevealed) && letter !== null;
          return (
            <motion.button
              key={`slot-${wordIdx}-${i}`}
              whileTap={!interactionsDisabled && letter !== null ? { scale: 0.94 } : undefined}
              onClick={() => tapSlot(i)}
              disabled={interactionsDisabled || letter === null}
              style={{
                width: 44, height: 52, borderRadius: 8,
                backgroundColor: isCorrectReveal
                  ? "color-mix(in srgb, var(--success-500) 18%, var(--card))"
                  : letter !== null
                    ? `color-mix(in srgb, ${ACCENT} 14%, var(--card))`
                    : "var(--card)",
                border: isCorrectReveal
                  ? "1px solid var(--success-500)"
                  : letter !== null
                    ? `1px solid ${ACCENT}`
                    : `1px dashed color-mix(in srgb, var(--foreground) 22%, transparent)`,
                cursor: !interactionsDisabled && letter !== null ? "pointer" : "default",
                fontSize: "var(--text-lg)", fontWeight: 800,
                color: isCorrectReveal ? "var(--success-500)" : "var(--foreground)",
                fontVariantNumeric: "tabular-nums",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background-color 0.15s ease, border-color 0.15s ease",
              }}
            >
              {letter ?? ""}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Feedback toast — inline, replaces the bottom-fixed toast pattern of other
          games. For kids, feedback should be near the action, not at the bottom. */}
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
              {hintsUsed > 0 ? "Spelled it!" : "First try — wizardly!"}
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
              Almost — try again
            </motion.span>
          )}
          {showRevealed && (
            <motion.span
              key="revealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)" }}
            >
              That word was tricky — let's try the next one
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Tiles — scrambled letters */}
      <div className="flex flex-wrap items-center justify-center" style={{
        padding: "20px 16px 0", gap: 8,
      }}>
        {tiles.map((tile, i) => (
          <motion.button
            key={tile.key}
            whileTap={!interactionsDisabled && !tile.placed ? { scale: 0.92 } : undefined}
            onClick={() => tapTile(i)}
            disabled={interactionsDisabled || tile.placed}
            animate={tile.placed ? { opacity: 0.25, scale: 0.92 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            style={{
              width: 44, height: 44, borderRadius: 8,
              backgroundColor: tile.placed
                ? "var(--card)"
                : `color-mix(in srgb, ${ACCENT} 18%, var(--card))`,
              border: tile.placed
                ? "0.5px solid var(--border)"
                : `1px solid color-mix(in srgb, ${ACCENT} 40%, transparent)`,
              boxShadow: tile.placed ? "none" : `0 2px 8px color-mix(in srgb, ${ACCENT} 22%, transparent)`,
              cursor: !interactionsDisabled && !tile.placed ? "pointer" : "default",
              fontSize: "var(--text-lg)", fontWeight: 800,
              color: tile.placed ? "var(--muted-foreground)" : "var(--foreground)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {tile.letter}
          </motion.button>
        ))}
      </div>

    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Wizard tier title — light identity reward, no shaming at low scores.
function wizardLevel(correct: number): { title: string } {
  if (correct >= 10) return { title: "Grand Wizard!" };
  if (correct >= 8)  return { title: "Master Wizard" };
  if (correct >= 6)  return { title: "Apprentice Wizard" };
  if (correct >= 4)  return { title: "Spellcaster" };
  return { title: "Wizard in training" };
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
