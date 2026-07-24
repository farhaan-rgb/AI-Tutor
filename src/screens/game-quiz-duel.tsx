/**
 * Brain Battle — playable 1v1 MCQ battle for Class 4–8 kids.
 * Route: /marketplace/game/quiz-duel/play  (id kept stable; UI title rebranded)
 *
 * 4 phases controlled by local state:
 *   1. select     — bot selection grid (chess.com style). Kid picks an AI
 *                   opponent at their level. Replaces the previous fake
 *                   "Finding real opponent..." matching phase.
 *   2. playing    — 10 questions, 6s each. Live bot score on top bar.
 *   3. resolving  — 1.5s slide-up toast showing correct answer + delta
 *   4. result     — Win/Lose banner, final score, bot unlock progression,
 *                   Play again + pass-aware trial-gate sheet
 *
 * Bots replace the random-CPU opponent — see src/shared/brain-battle-bots.ts.
 * Each bot has named identity, skill (accuracy %), and answer speed (ms).
 * Beat a bot → unlock the next tier (chess-style progression).
 *
 * Question bank is still local stub. A real impl needs server-side question
 * delivery + leaderboard persistence.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Trophy, ChevronRight, Lock, Sparkles } from "lucide-react";
import { useGamesPass } from "../shared/games-pass-state";
import { TrialGateSheet } from "./trial-gate-sheet";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { DUMMY_GAMES } from "./marketplace-v1";
import {
  TopExitBar,
  DailyComparisonStrip,
  OtherGamesRail,
  HowToButton,
  HowToSheet,
  HintButton,
  MAX_HINTS,
  type HowToStep,
} from "../shared/game-result-shared";

const HOW_TO_STEPS: HowToStep[] = [
  { title: "Pick an opponent", body: "Bots are ranked by tier — Beginner, Intermediate, Advanced, Boss. Start easy and climb." },
  { title: "Answer 10 quick questions", body: "Each question has a 6-second timer. Tap the answer before the bot does." },
  { title: "Beat them to unlock the next", body: "Win against a bot to unlock the next tier. Lose, and try again — no streak lost." },
];
import {
  BOTS, type Bot, useBotProgress, getBotUnlockedBy,
} from "../shared/brain-battle-bots";

const QUESTION_DURATION_SEC = 6;
const TOTAL_QUESTIONS = 10;
const ACCENT = "var(--mark-review-500)"; // Brain Battle's per-game purple accent
const POINTS_CORRECT = 10;
const POINTS_WRONG = 0;

// TODO(api): real question bank from server. Class 4–8 mixed-subject questions
// for the kid audience (Math + Science + GK + English). Used here as demo stubs.
type DemoQ = {
  id: string;
  stem: string;
  options: string[];
  correctIdx: number;
  topic: string;
};
const DEMO_QUESTIONS: DemoQ[] = [
  {
    id: "q1", stem: "Which planet in our solar system has the most visible rings?",
    options: ["Mars", "Jupiter", "Saturn", "Neptune"],
    correctIdx: 2, topic: "Science",
  },
  {
    id: "q2", stem: "What is 15 × 6?",
    options: ["80", "85", "90", "96"],
    correctIdx: 2, topic: "Math",
  },
  {
    id: "q3", stem: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correctIdx: 1, topic: "Math",
  },
  {
    id: "q4", stem: "Plants make food using sunlight. This process is called:",
    options: ["Respiration", "Photosynthesis", "Digestion", "Germination"],
    correctIdx: 1, topic: "Science",
  },
  {
    id: "q5", stem: "The opposite of 'expand' is:",
    options: ["Stretch", "Inflate", "Contract", "Spread"],
    correctIdx: 2, topic: "English",
  },
  {
    id: "q6", stem: "Which is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctIdx: 3, topic: "GK",
  },
  {
    id: "q7", stem: "What is 1/4 + 1/4?",
    options: ["1/8", "1/2", "2/8", "1/4"],
    correctIdx: 1, topic: "Math",
  },
  {
    id: "q8", stem: "Which animal lays eggs and is also a mammal?",
    options: ["Bat", "Whale", "Platypus", "Dolphin"],
    correctIdx: 2, topic: "Science",
  },
  {
    id: "q9", stem: "Who wrote 'The Jungle Book'?",
    options: ["Roald Dahl", "Rudyard Kipling", "Ruskin Bond", "R K Narayan"],
    correctIdx: 1, topic: "GK",
  },
  {
    id: "q10", stem: "What is the capital of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Perth"],
    correctIdx: 2, topic: "GK",
  },
];

const PLAYER = { name: "You", initial: "Y" };

type Phase = "select" | "playing" | "resolving" | "result";

export function Component() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const [showHowTo, setShowHowTo] = useState(false);
  const pass = useGamesPass();
  const botProgress = useBotProgress();

  const [phase, setPhase] = useState<Phase>("select");
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [showTrialGate, setShowTrialGate] = useState(false);

  // Each entry into the result phase counts as one played round; track once
  // so the trial gate fires after the promised N free rounds, not on every
  // result screen. Brain Battle's trial level count lives on the Game data.
  const GAME_ID = "quiz-duel";
  const TRIAL_LEVELS = 3;
  useEffect(() => {
    if (phase !== "result") return;
    pass.trackPlay(GAME_ID);
    // Auto-raise the gate sheet only when the trial is exhausted.
    if (pass.active) return;
    const plays = pass.playsFor(GAME_ID) + 1; // +1 because trackPlay above is async
    if (plays < TRIAL_LEVELS) return;
    const t = setTimeout(() => setShowTrialGate(true), 900);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Mark the bot as beaten once the result phase shows a win. Runs once per
  // entry into result; the markBotBeaten function is idempotent (no-op if
  // already beaten). Kept as an effect to avoid setState during render.
  useEffect(() => {
    if (phase !== "result" || !selectedBot) return;
    const won = playerScore > opponentScore;
    if (!won) return;
    botProgress.markBotBeaten(selectedBot.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectedBot, playerScore, opponentScore]);
  const [qIdx, setQIdx] = useState(0);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION_SEC);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [eliminatedIdxs, setEliminatedIdxs] = useState<Set<number>>(new Set());

  const currentQ = DEMO_QUESTIONS[qIdx];

  function useFiftyFifty() {
    if (hintsLeft <= 0 || chosenIdx !== null) return;
    const wrongIdxs = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== currentQ.correctIdx && !eliminatedIdxs.has(i));
    if (wrongIdxs.length < 2) return;
    const shuffled = [...wrongIdxs].sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedIdxs(new Set([...eliminatedIdxs, ...shuffled]));
    setHintsLeft((h) => h - 1);
  }

  // ── playing — tick the 6s countdown
  useEffect(() => {
    if (phase !== "playing") return;
    setTimeLeft(QUESTION_DURATION_SEC);
    setChosenIdx(null);
    setEliminatedIdxs(new Set());
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, qIdx]);

  // ── resolving → next or result. Bot uses its own accuracy + speed range.
  const opponentChoiceRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== "resolving" || !selectedBot) return;
    // Bot simulated answer — uses per-bot accuracy (chess-style skill level)
    const botCorrect = Math.random() < selectedBot.accuracy;
    opponentChoiceRef.current = botCorrect
      ? currentQ.correctIdx
      : (currentQ.correctIdx + 1) % 4;
    if (botCorrect) setOpponentScore((s) => s + POINTS_CORRECT);
    const t = setTimeout(() => {
      if (qIdx + 1 >= TOTAL_QUESTIONS) {
        setPhase("result");
      } else {
        setQIdx((i) => i + 1);
        setPhase("playing");
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, qIdx, currentQ.correctIdx, selectedBot]);

  // ── auto-resolve when timer hits 0 with no answer
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft === 0) {
      setPhase("resolving");
    }
  }, [phase, timeLeft]);

  function pickOption(idx: number) {
    if (phase !== "playing" || chosenIdx !== null) return;
    setChosenIdx(idx);
    if (idx === currentQ.correctIdx) {
      setPlayerScore((s) => s + POINTS_CORRECT);
    } else {
      setPlayerScore((s) => s + POINTS_WRONG);
    }
    setPhase("resolving");
  }

  function startBattle(bot: Bot) {
    setSelectedBot(bot);
    setQIdx(0);
    setChosenIdx(null);
    setPlayerScore(0);
    setOpponentScore(0);
    setTimeLeft(QUESTION_DURATION_SEC);
    setHintsLeft(MAX_HINTS);
    setEliminatedIdxs(new Set());
    opponentChoiceRef.current = null;
    setPhase("playing");
  }

  function playAgain() {
    // Back to the bot selection screen — kid can pick a new (or same) opponent
    setSelectedBot(null);
    setQIdx(0);
    setChosenIdx(null);
    setPlayerScore(0);
    setOpponentScore(0);
    setTimeLeft(QUESTION_DURATION_SEC);
    opponentChoiceRef.current = null;
    setPhase("select");
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

  // ──────────────────────────────────────────────────────────────────────
  // Phase 1 — SELECT BOT
  if (phase === "select") {
    return (
      <div className="flex flex-col" style={containerStyle}>
        <TopExitBar onExit={() => navigate(-1)} />
        <div className="flex-1" style={{ overflowY: "auto", padding: "24px 16px 32px" }}>
          <div className="flex flex-col items-center" style={{ gap: 8, marginBottom: 24 }}>
            <span style={{
              fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.2,
              color: "var(--muted-foreground)", textTransform: "uppercase",
            }}>
              Brain Battle · Choose your opponent
            </span>
            <h1 style={{
              fontSize: 24, fontWeight: 800, color: "var(--foreground)",
              margin: 0, letterSpacing: -0.4, textAlign: "center",
            }}>
              Who do you want to play?
            </h1>
            <span style={{
              fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
              textAlign: "center", maxWidth: 320,
            }}>
              All opponents are AI bots. Beat one to unlock the next.
            </span>
            <div style={{ marginTop: 4 }}>
              <HowToButton onTap={() => setShowHowTo(true)} accent={ACCENT} />
            </div>
          </div>

          {/* Tier-grouped bot cards */}
          {[1, 2, 3, 4].map((tier) => {
            const tierBots = BOTS.filter((b) => b.tier === tier);
            const tierLabel = tier === 1 ? "Beginner"
              : tier === 2 ? "Intermediate"
              : tier === 3 ? "Advanced"
              : "Boss";
            return (
              <div key={tier} className="flex flex-col" style={{ gap: 12, marginBottom: 20 }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <span style={{
                    fontSize: "var(--text-2xs)", fontWeight: 700,
                    color: "var(--muted-foreground)", letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}>
                    Tier {tier} · {tierLabel}
                  </span>
                </div>
                <div className="flex" style={{ gap: 12, flexWrap: "wrap" }}>
                  {tierBots.map((bot) => {
                    const unlocked = botProgress.isBotUnlocked(bot.id);
                    const beaten = botProgress.beaten.has(bot.id);
                    return (
                      <BotCard
                        key={bot.id}
                        bot={bot}
                        unlocked={unlocked}
                        beaten={beaten}
                        onTap={() => startBattle(bot)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <HowToSheet
          open={showHowTo}
          gameTitle="Brain Battle"
          steps={HOW_TO_STEPS}
          accent={ACCENT}
          onClose={() => setShowHowTo(false)}
          isDesktop={isDesktop}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // Phase 4 — RESULT
  if (phase === "result") {
    const won = playerScore > opponentScore;
    const tied = playerScore === opponentScore;
    const bannerColor = won ? "var(--success-500)" : tied ? "var(--warning-500)" : "var(--error-500)";
    const botName = selectedBot?.name ?? "Bot";
    const bannerLabel = won ? `You beat ${botName}!` : tied ? `Tied with ${botName}` : `${botName} won this round`;

    // The bot we just unlocked by winning (used for the "X unlocked!" message).
    // markBotBeaten itself runs in the useEffect above — this is just read-time
    // derivation for the UI.
    const justUnlockedBot = won && selectedBot ? getBotUnlockedBy(selectedBot.id) : undefined;
    const showJustUnlocked = won && !!justUnlockedBot;

    return (
      <div className="flex flex-col" style={containerStyle}>
        <TopExitBar onExit={() => navigate(-1)} />
        <div className="flex-1 flex flex-col items-center" style={{ padding: 24, paddingTop: 32, paddingBottom: 40, gap: 24, overflowY: "auto", minHeight: 0 }}>
          {/* Banner */}
          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <Trophy size={48} style={{ color: bannerColor }} />
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: "var(--foreground)",
              margin: 0, letterSpacing: -0.5, textAlign: "center",
            }}>
              {bannerLabel}
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontWeight: 500 }}>
              {won ? "+15 XP earned" : tied ? "+5 XP earned" : "+2 XP earned · keep practising"}
            </span>
          </div>

          {/* "Bot unlocked" celebration — only shows when this win unlocks a new bot */}
          {showJustUnlocked && justUnlockedBot && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 18 }}
              className="flex items-center"
              style={{
                width: "100%", maxWidth: 360,
                padding: "12px 14px", borderRadius: 12,
                backgroundColor: `color-mix(in srgb, ${justUnlockedBot.accent} 14%, var(--card))`,
                border: `1px solid color-mix(in srgb, ${justUnlockedBot.accent} 40%, var(--border))`,
                gap: 12,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9999, flexShrink: 0,
                backgroundColor: `color-mix(in srgb, ${justUnlockedBot.accent} 22%, var(--card))`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "var(--text-sm)", fontWeight: 800,
                color: justUnlockedBot.accent,
              }}>
                {justUnlockedBot.initial}
              </div>
              <div className="flex flex-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                  {justUnlockedBot.name} unlocked!
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  {justUnlockedBot.description}
                </span>
              </div>
              <Sparkles size={16} style={{ color: justUnlockedBot.accent, flexShrink: 0 }} />
            </motion.div>
          )}

          {/* Score line */}
          <div className="flex items-center" style={{ gap: 24, padding: "16px 24px", borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <ScoreColumn label={PLAYER.name} score={playerScore} isWinner={won} accent={ACCENT} />
            <span style={{ width: 1, height: 48, backgroundColor: "var(--border)" }} />
            <ScoreColumn label={botName} score={opponentScore} isWinner={!won && !tied} accent={selectedBot?.accent ?? "var(--muted-foreground)"} />
          </div>

          {/* Trial gate — shown when user does NOT have Games Pass. This is
              the demo conversion moment after the free trial round. With pass
              active, this collapses to a quieter cross-sell to other games. */}
          {/* Cross-sell card — only when pass is active. Without pass, the
              bottom-sheet TrialGateSheet (mounted at the bottom of this phase)
              handles conversion instead. */}
          {pass.active && (
            <div
              className="flex items-center"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                backgroundColor: "var(--card)",
                gap: 12, cursor: "pointer",
              }}
              onClick={() => navigate("/marketplace-v1")}
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
            </div>
          )}

          {/* Daily comparison + Other games rail (LinkedIn-style) */}
          <DailyComparisonStrip yourScore={playerScore / POINTS_CORRECT} total={TOTAL_QUESTIONS} />
          <div style={{ width: "100%", maxWidth: 360 }}>
            <OtherGamesRail currentGameId="quiz-duel" games={DUMMY_GAMES} />
          </div>

          {/* CTAs — Play again primary, Back secondary */}
          <div className="flex flex-col w-full" style={{ gap: 8, maxWidth: 360 }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={playAgain}
              className="flex items-center justify-center"
              style={{
                width: "100%", height: 44, borderRadius: 12, border: "none",
                backgroundColor: ACCENT, cursor: "pointer",
                fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)",
              }}
            >
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
        {/* Trial-gate bottom sheet — auto-rises 0.9s after result renders
            when user does not have an active pass. */}
        <TrialGateSheet
          open={showTrialGate}
          onClose={() => setShowTrialGate(false)}
          gameTitle="Brain Battle"
          isDesktop={isDesktop}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // Phase 2 + 3 — PLAYING / RESOLVING (same layout, only overlay differs)
  const correctIdx = currentQ.correctIdx;
  const opponentChoiceIdx = opponentChoiceRef.current;
  const resolving = phase === "resolving";
  const playerCorrect = chosenIdx !== null && chosenIdx === correctIdx;

  return (
    <div className="flex flex-col" style={containerStyle}>
      <TopExitBar onExit={() => navigate(-1)} />

      {/* Top bar — countdown + opponent + your score */}
      <div className="flex items-center justify-between" style={{
        padding: "12px 16px",
        borderBottom: "0.5px solid var(--border)",
        gap: 12,
      }}>
        <CountdownRing seconds={timeLeft} total={QUESTION_DURATION_SEC} />
        <div className="flex items-center" style={{ gap: 12 }}>
          <ScoreCompact label={selectedBot?.name ?? "Bot"} score={opponentScore} accent={selectedBot?.accent ?? "var(--muted-foreground)"} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 700 }}>VS</span>
          <ScoreCompact label={PLAYER.name} score={playerScore} accent={ACCENT} />
        </div>
      </div>

      {/* Question progress */}
      <div style={{
        height: 4,
        backgroundColor: "var(--card)",
        position: "relative",
      }}>
        <motion.div
          initial={{ width: `${(qIdx / TOTAL_QUESTIONS) * 100}%` }}
          animate={{ width: `${((qIdx + 1) / TOTAL_QUESTIONS) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{
            height: "100%",
            backgroundColor: ACCENT,
          }}
        />
      </div>

      {/* Question + options */}
      <div className="flex-1" style={{ padding: "24px 16px", paddingBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8, gap: 8 }}>
          <span style={{
            fontSize: "var(--text-2xs)", fontWeight: 700,
            color: "var(--muted-foreground)", letterSpacing: 0.6,
            textTransform: "uppercase",
          }}>
            Q {qIdx + 1} of {TOTAL_QUESTIONS} · {currentQ.topic}
          </span>
          <HintButton remaining={hintsLeft} onTap={useFiftyFifty} accent={ACCENT} />
        </div>
        <p style={{
          fontSize: "var(--text-base)", color: "var(--foreground)",
          lineHeight: 1.55, margin: "0 0 24px",
        }}>
          {currentQ.stem}
        </p>

        <div className="flex flex-col" style={{ gap: 8 }}>
          {currentQ.options.map((opt, idx) => {
            const isChosen = chosenIdx === idx;
            const isCorrect = resolving && idx === correctIdx;
            const isWrongChosen = resolving && isChosen && idx !== correctIdx;
            const isOpponentChose = resolving && opponentChoiceIdx === idx;
            const isEliminated = eliminatedIdxs.has(idx) && !resolving;

            const bg = isCorrect
              ? "color-mix(in srgb, var(--success-500) 16%, var(--card))"
              : isWrongChosen
              ? "color-mix(in srgb, var(--error-500) 16%, var(--card))"
              : isChosen
              ? `color-mix(in srgb, ${ACCENT} 14%, var(--card))`
              : isEliminated
              ? "color-mix(in srgb, var(--muted-foreground) 6%, var(--card))"
              : "var(--card)";
            const border = isCorrect
              ? "1px solid var(--success-500)"
              : isWrongChosen
              ? "1px solid var(--error-500)"
              : isChosen
              ? `1px solid ${ACCENT}`
              : "1px solid var(--border)";

            return (
              <motion.button
                key={idx}
                whileTap={chosenIdx === null && !resolving && !isEliminated ? { scale: 0.99 } : undefined}
                onClick={() => { if (!isEliminated) pickOption(idx); }}
                disabled={chosenIdx !== null || resolving || isEliminated}
                className="flex items-center w-full text-left"
                style={{
                  gap: 12, padding: "14px 12px", borderRadius: 12,
                  backgroundColor: bg,
                  border,
                  cursor: chosenIdx === null && !resolving && !isEliminated ? "pointer" : "default",
                  opacity: isEliminated ? 0.4 : 1,
                  textDecoration: isEliminated ? "line-through" : "none",
                  transition: "background-color 0.15s ease, border-color 0.15s ease, opacity 0.2s",
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 9999,
                  backgroundColor: isCorrect ? "var(--success-500)" : isWrongChosen ? "var(--error-500)" : isChosen ? ACCENT : "transparent",
                  border: isCorrect || isWrongChosen || isChosen ? "none" : "1.5px solid color-mix(in srgb, var(--foreground) 25%, transparent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {(isCorrect || isWrongChosen || isChosen) && (
                    isCorrect ? (
                      <Check size={12} style={{ color: "var(--white)", strokeWidth: 3 }} />
                    ) : (
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--white)" }}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                    )
                  )}
                  {!(isCorrect || isWrongChosen || isChosen) && (
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                  )}
                </div>
                <span style={{
                  flex: 1,
                  fontSize: "var(--text-sm)",
                  color: "var(--foreground)",
                  lineHeight: 1.5,
                }}>
                  {opt}
                </span>
                {/* Opponent marker */}
                {isOpponentChose && (
                  <div className="flex items-center justify-center" style={{
                    width: 20, height: 20, borderRadius: 9999,
                    backgroundColor: "color-mix(in srgb, var(--muted-foreground) 30%, var(--card))",
                    border: "0.5px solid var(--border)",
                    fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)",
                    flexShrink: 0,
                  }}>
                    {selectedBot?.initial ?? "?"}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Resolve toast — 1.5s slide-up */}
      <AnimatePresence>
        {resolving && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
              padding: "16px 16px",
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              backgroundColor: "var(--card)",
              borderTop: "0.5px solid var(--border)",
              maxWidth: isDesktop ? 720 : undefined,
              marginLeft: isDesktop ? "auto" : undefined,
              marginRight: isDesktop ? "auto" : undefined,
            }}
          >
            <div className="flex items-center justify-between" style={{ gap: 12 }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9999,
                  backgroundColor: playerCorrect ? "var(--success-500)" : "var(--error-500)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {playerCorrect ? (
                    <Check size={14} style={{ color: "var(--white)", strokeWidth: 3 }} />
                  ) : (
                    <X size={14} style={{ color: "var(--white)", strokeWidth: 3 }} />
                  )}
                </div>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", fontWeight: 600 }}>
                  {playerCorrect
                    ? `Correct! +${POINTS_CORRECT} XP`
                    : chosenIdx === null
                    ? "Time's up · no points"
                    : `Wrong · correct was ${String.fromCharCode(65 + correctIdx)}`}
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

// ─── Helper components ───────────────────────────────────────────────────────

// BotCard — single bot tile in the selection grid. Locked bots show a lock
// icon + the prerequisite name; unlocked ones are tappable; beaten ones show
// a small check badge.
function BotCard({
  bot, unlocked, beaten, onTap,
}: {
  bot: Bot;
  unlocked: boolean;
  beaten: boolean;
  onTap: () => void;
}) {
  const prerequisite = bot.unlockedAfter
    ? BOTS.find((b) => b.id === bot.unlockedAfter)
    : undefined;
  return (
    <motion.button
      whileTap={unlocked ? { scale: 0.97 } : undefined}
      onClick={unlocked ? onTap : undefined}
      disabled={!unlocked}
      style={{
        width: 156, padding: 12, borderRadius: 12,
        backgroundColor: "var(--card)",
        border: beaten
          ? `1px solid ${bot.accent}`
          : unlocked
            ? `0.5px solid color-mix(in srgb, ${bot.accent} 30%, var(--border))`
            : "0.5px solid var(--border)",
        cursor: unlocked ? "pointer" : "not-allowed",
        opacity: unlocked ? 1 : 0.55,
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
        textAlign: "left",
      }}
      aria-label={unlocked ? `Play against ${bot.name}` : `${bot.name} is locked`}
    >
      <div className="flex items-center" style={{ gap: 8, width: "100%" }}>
        {/* Initial bubble */}
        <div style={{
          width: 36, height: 36, borderRadius: 9999, flexShrink: 0,
          backgroundColor: unlocked
            ? `color-mix(in srgb, ${bot.accent} 22%, var(--card))`
            : "var(--card-bg-secondary)",
          border: unlocked
            ? `1px solid color-mix(in srgb, ${bot.accent} 50%, transparent)`
            : "0.5px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "var(--text-sm)", fontWeight: 800,
          color: unlocked ? bot.accent : "var(--muted-foreground)",
        }}>
          {unlocked ? bot.initial : <Lock size={14} style={{ color: "var(--muted-foreground)" }} />}
        </div>
        {beaten && (
          <div style={{
            width: 18, height: 18, borderRadius: 9999,
            backgroundColor: "var(--success-500)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginLeft: "auto",
          }}>
            <Check size={10} style={{ color: "var(--white)" }} strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="flex flex-col" style={{ gap: 2, width: "100%" }}>
        <span style={{
          fontSize: "var(--text-sm)", fontWeight: 700,
          color: unlocked ? "var(--foreground)" : "var(--muted-foreground)",
          lineHeight: 1.3,
        }}>
          {bot.name}
        </span>
        <span style={{
          fontSize: "var(--text-2xs)",
          color: "var(--muted-foreground)",
          lineHeight: 1.4,
        }}>
          {unlocked
            ? bot.description
            : `Beat ${prerequisite?.name ?? "previous bot"} to unlock`}
        </span>
      </div>
    </motion.button>
  );
}

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const RADIUS = 14;
  const STROKE = 3;
  const circumference = 2 * Math.PI * RADIUS;
  const pct = seconds / total;
  const offset = circumference * (1 - pct);
  const critical = seconds <= 2;
  const color = critical ? "var(--error-500)" : "var(--warning-500)";

  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      <div style={{ position: "relative", width: 32, height: 32 }}>
        <svg width={32} height={32} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={16} cy={16} r={RADIUS} fill="none" stroke="color-mix(in srgb, var(--foreground) 14%, transparent)" strokeWidth={STROKE} />
          <circle
            cx={16} cy={16} r={RADIUS} fill="none" stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.2s" }}
          />
        </svg>
        <span style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "var(--text-xs)", fontWeight: 700, color,
          fontVariantNumeric: "tabular-nums",
        }}>
          {seconds}
        </span>
      </div>
    </div>
  );
}

function ScoreCompact({ label, score, accent }: { label: string; score: number; accent: string }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 2 }}>
      <span style={{
        fontSize: "var(--text-2xs)", fontWeight: 600,
        color: "var(--muted-foreground)", letterSpacing: 0.3,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: "var(--text-base)", fontWeight: 700,
        color: accent, lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
      }}>
        {score}
      </span>
    </div>
  );
}

function ScoreColumn({ label, score, isWinner, accent }: { label: string; score: number; isWinner: boolean; accent: string }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 4, minWidth: 80 }}>
      <span style={{
        fontSize: "var(--text-2xs)", fontWeight: 600,
        color: "var(--muted-foreground)", letterSpacing: 0.4, textTransform: "uppercase",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 32, fontWeight: 800,
        color: isWinner ? "var(--success-500)" : accent,
        lineHeight: 1, letterSpacing: -1,
        fontVariantNumeric: "tabular-nums",
      }}>
        {score}
      </span>
    </div>
  );
}
