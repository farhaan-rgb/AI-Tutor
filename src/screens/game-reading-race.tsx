/**
 * Reading Race — short-passage comprehension game for Class 4–6 kids.
 * Route: /marketplace/game/reading-race/play
 *
 * Why this game completes the catalog:
 *   - Reading comprehension is the third gap I flagged in the catalog audit:
 *     Indian parents universally worry about their child's reading ability.
 *     None of the existing 8 games tests passage-to-Q comprehension.
 *   - Distinct mechanic from anything shipped: read a short passage → answer
 *     2-3 comprehension Qs about it. Tests sustained attention, not flash recall.
 *
 * Mechanic:
 *   - 3 passages per session (picked from a 6-passage curated bank).
 *   - Each passage: 50-70 words, India-context, Class 4 reading level.
 *   - 3 MCQ comprehension Qs per passage (main idea / detail / inference mix).
 *   - No per-question timer — comprehension is sustained reading, not flash.
 *   - 2 wrongs on a question → reveal answer + advance (gentle).
 *
 * Paid game. Trial gate after 3 sessions.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, Trophy, RefreshCw, ChevronRight, BookOpen,
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
  { title: "Read the short story", body: "A 50-70 word passage is shown at the top. Take your time." },
  { title: "Answer 3 questions", body: "Each story has 3 multiple-choice questions about what you read." },
  { title: "Complete all stories", body: "Easy = 2 stories, Medium = 3, Hard = 4. No timer." },
];

// Difficulty maps to how many passages per session (more = more reading).
const PASSAGES_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 2,
  medium: 3,
  hard: 4,
};

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCENT = "var(--warning-600)";       // Deeper amber — warm book / library vibe
const QUESTIONS_PER_PASSAGE = 3;
const MAX_WRONG_PER_QUESTION = 2;
const CORRECT_HOLD_MS = 1100;
const REVEAL_HOLD_MS = 1900;
const WRONG_RESET_MS = 700;

const GAME_ID = "reading-race";
const TRIAL_LEVELS = 3;

// ─── Passage bank ────────────────────────────────────────────────────────────
// India-context, Class 4 reading level. 6 curated passages; 3 picked per
// session. Words kept simple, sentences short, each passage has clear factual
// answers.
// TODO(api): server bank with difficulty bands + per-kid progress + larger pool.
interface Question {
  q: string;
  options: string[];
  correctIdx: number;
}
interface Passage {
  id: string;
  title: string;
  body: string;
  questions: Question[];
}

const PASSAGE_BANK: Passage[] = [
  {
    id: "curious-cat",
    title: "The Curious Cat",
    body: "Whiskers was a young cat who lived in a small Indian village. Every morning, she watched birds fly above the mango trees. One day, she decided to climb the tallest tree to see them up close. Halfway up, she got scared and meowed loudly. A boy named Ravi heard her and helped her down.",
    questions: [
      {
        q: "Where did Whiskers live?",
        options: ["A big city", "A small Indian village", "A jungle", "A farmhouse"],
        correctIdx: 1,
      },
      {
        q: "What did Whiskers want to see up close?",
        options: ["Mangoes", "Other cats", "Birds", "Ravi"],
        correctIdx: 2,
      },
      {
        q: "Who helped Whiskers come down?",
        options: ["Her owner", "A bird", "Another cat", "A boy named Ravi"],
        correctIdx: 3,
      },
    ],
  },
  {
    id: "holi-festival",
    title: "Holi Festival",
    body: "Holi is one of India's most colourful festivals, celebrated every spring. People come together to throw coloured powders and water at each other. The night before Holi, families light big bonfires. The next morning, friends and neighbours play with colours and eat sweets together.",
    questions: [
      {
        q: "When is Holi celebrated?",
        options: ["Winter", "Summer", "Spring", "Autumn"],
        correctIdx: 2,
      },
      {
        q: "What do people throw at each other during Holi?",
        options: ["Water and flowers", "Coloured powders and water", "Rice", "Mangoes"],
        correctIdx: 1,
      },
      {
        q: "What happens the night before Holi?",
        options: ["People sleep early", "Families light big bonfires", "Children sing songs", "They cook breakfast"],
        correctIdx: 1,
      },
    ],
  },
  {
    id: "solar-system",
    title: "Our Solar System",
    body: "Our solar system has eight planets that orbit the Sun. Earth is the third planet from the Sun and the only one known to have life. Mercury is closest to the Sun, and Neptune is the farthest. Jupiter is the largest planet, big enough to fit all the others inside it.",
    questions: [
      {
        q: "How many planets are in our solar system?",
        options: ["Seven", "Eight", "Nine", "Ten"],
        correctIdx: 1,
      },
      {
        q: "Which planet is closest to the Sun?",
        options: ["Earth", "Jupiter", "Mercury", "Neptune"],
        correctIdx: 2,
      },
      {
        q: "What makes Jupiter special?",
        options: ["It's the closest to the Sun", "It has life", "It's the largest planet", "It has the most moons"],
        correctIdx: 2,
      },
    ],
  },
  {
    id: "cricket-india",
    title: "Cricket in India",
    body: "Cricket is the most popular sport in India. Children play it in streets, parks, and fields with whatever bats and balls they can find. Sachin Tendulkar is one of India's most famous cricketers. He is called the 'Master Blaster' because of his amazing batting skills.",
    questions: [
      {
        q: "What is India's most popular sport?",
        options: ["Football", "Hockey", "Cricket", "Kabaddi"],
        correctIdx: 2,
      },
      {
        q: "What is Sachin Tendulkar's nickname?",
        options: ["The Captain", "Master Blaster", "The King", "Mr Cricket"],
        correctIdx: 1,
      },
      {
        q: "Where do Indian children play cricket?",
        options: ["Only in stadiums", "Streets, parks, and fields", "Only at school", "Only on weekends"],
        correctIdx: 1,
      },
    ],
  },
  {
    id: "how-rain-forms",
    title: "How Rain Forms",
    body: "Rain begins when the Sun heats water in oceans and lakes. The water turns into invisible vapour and rises into the sky. Up there, the vapour cools and forms tiny water droplets that gather together as clouds. When the droplets become too heavy, they fall to the ground as rain.",
    questions: [
      {
        q: "What makes the water turn into vapour?",
        options: ["The wind", "The Sun's heat", "The cold", "The Moon"],
        correctIdx: 1,
      },
      {
        q: "Where does water vapour go?",
        options: ["Stays on the ground", "Sinks", "Rises into the sky", "Disappears"],
        correctIdx: 2,
      },
      {
        q: "When does rain fall?",
        options: ["When clouds disappear", "When droplets get too heavy", "When the Sun sets", "When the wind stops"],
        correctIdx: 1,
      },
    ],
  },
  {
    id: "wise-old-tree",
    title: "The Wise Old Tree",
    body: "In a quiet forest stood an old banyan tree. Animals from miles around came to rest under its wide branches. Birds nested in its leaves, monkeys swung from its roots, and rabbits hid in its shade. The tree had stood there for over two hundred years, sharing its home with every creature.",
    questions: [
      {
        q: "What kind of tree is in the forest?",
        options: ["Mango", "Oak", "Banyan", "Coconut"],
        correctIdx: 2,
      },
      {
        q: "How old is the tree?",
        options: ["Fifty years", "One hundred years", "Over two hundred years", "Five hundred years"],
        correctIdx: 2,
      },
      {
        q: "Which animal is NOT mentioned in the story?",
        options: ["Birds", "Monkeys", "Rabbits", "Foxes"],
        correctIdx: 3,
      },
    ],
  },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type Phase = "intro" | "reading" | "result";
type Feedback = "none" | "correct" | "wrong" | "revealed";

// ─── Component ───────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const pass = useGamesPass();

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [showHowTo, setShowHowTo] = useState(false);
  const passagesPerSession = PASSAGES_BY_DIFFICULTY[difficulty];
  const [phase, setPhase] = useState<Phase>("intro");
  const [passages, setPassages] = useState<Passage[]>([]);
  const [passageIdx, setPassageIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  // Per-question
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [wrongOnThisQ, setWrongOnThisQ] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>("none");
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [eliminatedIdxs, setEliminatedIdxs] = useState<Set<number>>(new Set());
  const vibe = getVibe(difficulty);

  function useFiftyFifty() {
    if (hintsLeft <= 0 || feedback !== "none" || !currentQuestion) return;
    const wrongIdxs = currentQuestion.options
      .map((_, i) => i)
      .filter((i) => i !== currentQuestion.correctIdx && !eliminatedIdxs.has(i));
    if (wrongIdxs.length < 2) return;
    const shuffled = [...wrongIdxs].sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedIdxs(new Set([...eliminatedIdxs, ...shuffled]));
    setHintsLeft((h) => h - 1);
  }

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

  const currentPassage = passages[passageIdx];
  const currentQuestion = currentPassage?.questions[questionIdx];
  const totalQuestions = passagesPerSession * QUESTIONS_PER_PASSAGE;

  // Reset per-question
  useEffect(() => {
    if (phase !== "reading") return;
    setChosenIdx(null);
    setWrongOnThisQ(0);
    setFeedback("none");
    setEliminatedIdxs(new Set());
  }, [phase, passageIdx, questionIdx]);

  function advance() {
    // Next question in passage, or next passage, or result
    if (questionIdx + 1 < QUESTIONS_PER_PASSAGE) {
      setQuestionIdx((i) => i + 1);
    } else if (passageIdx + 1 < passagesPerSession) {
      setPassageIdx((i) => i + 1);
      setQuestionIdx(0);
    } else {
      setPhase("result");
    }
  }

  function pickOption(idx: number) {
    if (feedback !== "none" || !currentQuestion) return;
    setChosenIdx(idx);
    if (idx === currentQuestion.correctIdx) {
      setFeedback("correct");
      setTotalCorrect((c) => c + 1);
      const t = setTimeout(() => advance(), CORRECT_HOLD_MS);
      return () => clearTimeout(t);
    }
    const nextWrong = wrongOnThisQ + 1;
    setWrongOnThisQ(nextWrong);
    if (nextWrong >= MAX_WRONG_PER_QUESTION) {
      setFeedback("revealed");
      const t = setTimeout(() => advance(), REVEAL_HOLD_MS);
      return () => clearTimeout(t);
    }
    setFeedback("wrong");
    const t = setTimeout(() => {
      setChosenIdx(null);
      setFeedback("none");
    }, WRONG_RESET_MS);
    return () => clearTimeout(t);
  }

  function startGame() {
    setPassages(shuffle(PASSAGE_BANK).slice(0, passagesPerSession));
    setPassageIdx(0);
    setQuestionIdx(0);
    setTotalCorrect(0);
    setHintsLeft(MAX_HINTS);
    setEliminatedIdxs(new Set());
    setPhase("reading");
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
            Reading Race · Class 4–6
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
              background: `linear-gradient(135deg, ${ACCENT} 0%, color-mix(in srgb, ${ACCENT} 65%, var(--background)) 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 16px 40px color-mix(in srgb, ${ACCENT} 55%, transparent), inset 0 2px 0 color-mix(in srgb, var(--white) 32%, transparent)`,
            }}>
              <BookOpen size={44} style={{ color: "var(--white)" }} strokeWidth={2.25} />
            </div>
          </div>

          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <h1 style={{ fontSize: vibe.titleSize, fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: vibe.letterSpacing, lineHeight: "40px", minHeight: 40 }}>
              Reading Race
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center", maxWidth: 280 }}>
              Read short stories. Answer questions. No timer.
            </span>
          </div>

          <div className="flex items-center" style={{
            gap: 16, padding: "12px 20px", borderRadius: 12,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
          }}>
            <StatCol value={`${passagesPerSession}`} label="Stories" />
            <Divider />
            <StatCol value={`${totalQuestions}`} label="Questions" />
            <Divider />
            <StatCol value="Read" label="At your pace" />
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
            <BookOpen size={16} style={{ color: "var(--white)" }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)" }}>
              Start reading
            </span>
          </motion.button>
        </div>
        <HowToSheet
          open={showHowTo}
          gameTitle="Reading Race"
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
              {readingTier(totalCorrect, totalQuestions).title}
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
              {totalCorrect}/{totalQuestions} questions correct
            </span>
          </div>

          <div className="flex" style={{
            width: "100%", maxWidth: 360, padding: "16px 0", borderRadius: 16,
            backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
          }}>
            <BreakdownCol label="Correct" value={totalCorrect} color="var(--success-500)" />
            <BreakdownDivider />
            <BreakdownCol label="Missed" value={totalQuestions - totalCorrect} color="var(--muted-foreground)" />
          </div>

          <DailyComparisonStrip yourScore={totalCorrect} total={totalQuestions} />

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
              New stories
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
          gameTitle="Reading Race"
          isDesktop={isDesktop}
        />
      </div>
    );
  }

  // ─── READING ──────────────────────────────────────────────────────────
  if (!currentPassage || !currentQuestion) return null;
  const correct = feedback === "correct";
  const wrong = feedback === "wrong";
  const showRevealed = feedback === "revealed";
  const interactionsDisabled = feedback !== "none";

  // Overall question number across the session
  const qNumber = passageIdx * QUESTIONS_PER_PASSAGE + questionIdx + 1;

  return (
    <div className="flex flex-col" style={containerStyle}>
      <TopExitBar onExit={() => navigate(-1)} />

      {/* Top bar — story counter + question progress */}
      <div className="flex items-center justify-between" style={{
        padding: "12px 16px", borderBottom: "0.5px solid var(--border)", gap: 12,
      }}>
        <span style={{
          fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
          letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700,
        }}>
          Story {passageIdx + 1} of {passagesPerSession}
        </span>
        <div className="flex items-center" style={{ gap: 10 }}>
          <span style={{
            fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--foreground)",
            fontVariantNumeric: "tabular-nums",
          }}>
            Q {qNumber}/{totalQuestions}
          </span>
          <HintButton remaining={hintsLeft} onTap={useFiftyFifty} accent={ACCENT} />
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, backgroundColor: "var(--card)", position: "relative" }}>
        <motion.div
          animate={{ width: `${(qNumber / totalQuestions) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: "100%", backgroundColor: ACCENT }}
        />
      </div>

      {/* Passage card */}
      <div style={{ padding: "20px 16px 8px" }}>
        <div style={{
          padding: 16, borderRadius: 12,
          backgroundColor: `color-mix(in srgb, ${ACCENT} 8%, var(--card))`,
          border: `0.5px solid color-mix(in srgb, ${ACCENT} 24%, var(--border))`,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <BookOpen size={14} style={{ color: ACCENT }} />
            <span style={{
              fontSize: "var(--text-2xs)", fontWeight: 700, color: ACCENT,
              letterSpacing: 0.6, textTransform: "uppercase",
            }}>
              {currentPassage.title}
            </span>
          </div>
          <p style={{
            fontSize: "var(--text-sm)", color: "var(--foreground)",
            lineHeight: 1.6, margin: 0,
          }}>
            {currentPassage.body}
          </p>
        </div>
      </div>

      {/* Question + options */}
      <motion.div
        animate={wrong ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className="flex-1"
        style={{ padding: "16px 16px 0" }}
      >
        <span style={{
          fontSize: "var(--text-2xs)", fontWeight: 700,
          color: "var(--muted-foreground)", letterSpacing: 0.4,
          textTransform: "uppercase", display: "block", marginBottom: 8,
        }}>
          Question {questionIdx + 1} of {QUESTIONS_PER_PASSAGE}
        </span>
        <p style={{
          fontSize: "var(--text-base)", color: "var(--foreground)",
          lineHeight: 1.5, margin: "0 0 16px", fontWeight: 600,
        }}>
          {currentQuestion.q}
        </p>

        <div className="flex flex-col" style={{ gap: 8 }}>
          {currentQuestion.options.map((opt, idx) => {
            const isChosen = chosenIdx === idx;
            const isCorrectAnswer = idx === currentQuestion.correctIdx;
            const isWrongChosen = wrong && isChosen;
            const isRevealedAnswer = (showRevealed || correct) && isCorrectAnswer;
            const isEliminated = eliminatedIdxs.has(idx) && !interactionsDisabled;
            const bg = isRevealedAnswer
              ? "color-mix(in srgb, var(--success-500) 16%, var(--card))"
              : isWrongChosen
                ? "color-mix(in srgb, var(--error-500) 14%, var(--card))"
                : isChosen
                  ? `color-mix(in srgb, ${ACCENT} 14%, var(--card))`
                  : isEliminated
                    ? "color-mix(in srgb, var(--muted-foreground) 6%, var(--card))"
                    : "var(--card)";
            const border = isRevealedAnswer
              ? "1px solid var(--success-500)"
              : isWrongChosen
                ? "1px solid var(--error-500)"
                : isChosen
                  ? `1px solid ${ACCENT}`
                  : "0.5px solid var(--border)";

            return (
              <motion.button
                key={idx}
                whileTap={!interactionsDisabled && !isEliminated ? { scale: 0.99 } : undefined}
                onClick={() => { if (!isEliminated) pickOption(idx); }}
                disabled={interactionsDisabled || isEliminated}
                className="flex items-center w-full text-left"
                style={{
                  gap: 12, padding: "12px 12px", borderRadius: 12,
                  backgroundColor: bg, border,
                  cursor: interactionsDisabled || isEliminated ? "default" : "pointer",
                  opacity: isEliminated ? 0.4 : 1,
                  textDecoration: isEliminated ? "line-through" : "none",
                  transition: "background-color 0.15s, border-color 0.15s, opacity 0.2s",
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 9999, flexShrink: 0,
                  backgroundColor: isRevealedAnswer
                    ? "var(--success-500)"
                    : isWrongChosen
                      ? "var(--error-500)"
                      : isChosen
                        ? ACCENT
                        : "transparent",
                  border: isRevealedAnswer || isWrongChosen || isChosen
                    ? "none"
                    : "1.5px solid color-mix(in srgb, var(--foreground) 25%, transparent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isRevealedAnswer ? (
                    <Check size={12} style={{ color: "var(--white)" }} strokeWidth={3} />
                  ) : (
                    <span style={{
                      fontSize: "var(--text-2xs)", fontWeight: 700,
                      color: isWrongChosen || isChosen ? "var(--white)" : "var(--muted-foreground)",
                    }}>
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
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Feedback band */}
      <div style={{ minHeight: 24, padding: "12px 16px 0", textAlign: "center" }}>
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
              Good reading!
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
              Read again — the answer is in the story
            </motion.span>
          )}
          {showRevealed && (
            <motion.span
              key="revealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)" }}
            >
              The answer was {String.fromCharCode(65 + currentQuestion.correctIdx)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom padding for safe-area */}
      <div style={{ height: 24, paddingBottom: "max(24px, env(safe-area-inset-bottom))" }} />
    </div>
  );
}

function readingTier(correct: number, total: number): { title: string } {
  const ratio = correct / total;
  if (ratio >= 1)    return { title: "Reading Champion!" };
  if (ratio >= 0.85) return { title: "Strong Reader" };
  if (ratio >= 0.6)  return { title: "Good Reader" };
  if (ratio >= 0.3)  return { title: "Keep reading" };
  return { title: "Reader in training" };
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
