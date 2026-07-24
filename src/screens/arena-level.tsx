/**
 * Arena Level — the universal event play engine. One level = one stage you must
 * clear: a set of questions (mixed types), a per-question speed timer, and a
 * lives budget. Run out of lives → the level fails (retry it). Clear every
 * question with lives to spare → the level is cleared, you bank score + gems and
 * the ladder opens the next rung.
 *
 * Renders ALL question types so climbing means real knowledge, not guessing:
 *   mcq · boolean · assertion (single tap) · multi (select-all + submit) ·
 *   fill (type the answer) · match (pair up) · order (arrange the sequence).
 *
 * Route: /arena/level?event=<id>&level=<n>   (level defaults to your next rung;
 *        sprint events play one stage; exam events play a single clamped paper)
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, Check, ArrowRight, RotateCcw } from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import { arenaBack } from "./arena-ui";
import { useArenaState, questionPoints, type Question, type ReviewItem } from "../shared/arena";
import {
  getEvent, getLevelQuestions, livesForLevel, levelClearScore, heartsForLevel, xpForLevel, currentLevel,
  checkChoice, checkMulti, checkFill, deterministicShuffle, type LevelResult,
} from "../shared/arena-events";

const EXAM_CAP = 8; // prototype clamp for exam papers (TODO(api): full 60-Q timed paper)

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, enterEvent, completeLevel } = useArenaState();

  const eventId = params.get("event") ?? "";
  const ev = getEvent(eventId);

  // DEV walkthrough mode — wrong answers never cost a life, so the whole level-up
  // flow (and every question type, which only unlocks on higher levels) can be
  // walked end to end. CHAMPIONS LADDER is the designated test event: it's always
  // in dev mode (no URL needed — just open and play). Any other event can opt in
  // with ?dev=1 (persists for the session; ?dev=0 clears it).
  // TODO(api): remove before production — this is a build-time test aid only.
  const devParam = params.get("dev");
  if (typeof sessionStorage !== "undefined") {
    if (devParam === "1") sessionStorage.setItem("arena-dev", "1");
    else if (devParam === "0") sessionStorage.removeItem("arena-dev");
  }
  const devMode = eventId === "champions-ladder"
    || devParam === "1"
    || (typeof sessionStorage !== "undefined" && sessionStorage.getItem("arena-dev") === "1");

  // Resolve the level being played (sprint/exam are always a single stage).
  const isLadder = ev?.format === "ladder";
  const progress = state.events[eventId];
  const paramLevel = Number(params.get("level"));
  const level = isLadder ? (Number.isFinite(paramLevel) && paramLevel > 0 ? paramLevel : currentLevel(progress)) : 1;

  // Build the question set once.
  const questions = useRef<Question[]>(ev ? clampForExam(ev.format, getLevelQuestions(ev, level)) : []).current;
  const maxLives = ev ? (ev.format === "exam" ? questions.length : livesForLevel(ev, level)) : 3;

  const [i, setI] = useState(0);
  const [disp, setDisp] = useState({ lives: maxLives, score: 0, streak: 0 });
  const [secondsLeft, setSecondsLeft] = useState(questions[0]?.perSeconds ?? 30);
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");

  // Per-question selection state (reset on each question).
  const [choice, setChoice] = useState<number | null>(null);        // mcq/boolean/assertion
  const [multi, setMulti] = useState<number[]>([]);                 // multi
  const [text, setText] = useState("");                            // fill
  const [assign, setAssign] = useState<(number | null)[]>([]);      // match: left→shuffled-right idx
  const [orderPick, setOrderPick] = useState<number[]>([]);         // order: shuffled idxs in chosen order
  const [lastOk, setLastOk] = useState(false);

  // Authoritative tallies (refs — timers/closures stay correct).
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const answeredRef = useRef(0);
  const livesRef = useRef(maxLives);
  const streakRef = useRef(0);
  const bestRef = useRef(0);
  const lockedRef = useRef(false);   // this question already resolved
  const endedRef = useRef(false);
  const startedAtRef = useRef(Date.now()); // total run time (for the daily "your time")
  const reviewRef = useRef<ReviewItem[]>([]);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = questions[i];

  // Stable shuffles for match/order so the scramble doesn't jump on re-render.
  const shKey = ev ? `${ev.id}-L${level}-q${i}` : `q${i}`;
  const rightShuffle = useRef<{ items: string[]; order: number[] }>({ items: [], order: [] });
  const orderShuffle = useRef<{ items: string[]; order: number[] }>({ items: [], order: [] });
  if (q?.type === "match" && rightShuffle.current.items.length === 0) {
    rightShuffle.current = deterministicShuffle((q.pairs ?? []).map((p) => p.right), shKey);
  }
  if (q?.type === "order" && orderShuffle.current.items.length === 0) {
    orderShuffle.current = deterministicShuffle(q.sequence ?? [], shKey);
  }

  // Bad deep-link → back to the hub.
  useEffect(() => {
    if (!ev || questions.length === 0) navigate("/arena", { replace: true });
    else enterEvent(ev.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-question countdown (re-armed when the index changes).
  useEffect(() => {
    if (!q) return;
    lockedRef.current = false;
    setPhase("answering");
    setChoice(null); setMulti([]); setText(""); setAssign(new Array((q.pairs ?? []).length).fill(null)); setOrderPick([]);
    rightShuffle.current = { items: [], order: [] };
    orderShuffle.current = { items: [], order: [] };
    setSecondsLeft(q.perSeconds);
    const start = Date.now();
    const id = setInterval(() => {
      if (lockedRef.current) return;
      const left = q.perSeconds - (Date.now() - start) / 1000;
      if (left <= 0) { clearInterval(id); setSecondsLeft(0); resolve(true); }
      else setSecondsLeft(left);
    }, 100);
    return () => { clearInterval(id); if (advanceTimer.current) clearTimeout(advanceTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  if (!ev || !q) return null;

  // ── Resolve the current question (manual submit OR timeout) ─────────────────
  function resolve(timedOut: boolean) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    answeredRef.current += 1;

    let ok = false;
    let pickedText = "—";
    let correctText = "";

    if (!timedOut) {
      switch (q.type ?? "mcq") {
        case "multi":
          ok = checkMulti(q, multi);
          pickedText = multi.map((k) => q.options[k]).join(", ") || "—";
          correctText = (q.correctSet ?? []).map((k) => q.options[k]).join(", ");
          break;
        case "fill":
          ok = checkFill(q, text);
          pickedText = text || "—";
          correctText = q.answer ?? "";
          break;
        case "match": {
          const pairs = q.pairs ?? [];
          ok = pairs.length > 0 && pairs.every((p, li) => assign[li] != null && rightShuffle.current.items[assign[li]!] === p.right);
          pickedText = pairs.map((p, li) => `${p.left}→${assign[li] != null ? rightShuffle.current.items[assign[li]!] : "?"}`).join("  ");
          correctText = pairs.map((p) => `${p.left}→${p.right}`).join("  ");
          break;
        }
        case "order": {
          const seq = q.sequence ?? [];
          const picked = orderPick.map((si) => orderShuffle.current.items[si]);
          ok = picked.length === seq.length && picked.every((v, k) => v === seq[k]);
          pickedText = picked.join(" → ") || "—";
          correctText = seq.join(" → ");
          break;
        }
        default: // mcq / boolean / assertion
          ok = choice != null && checkChoice(q, choice);
          pickedText = choice != null ? q.options[choice] : "—";
          correctText = q.options[q.correct] ?? "";
      }
    } else {
      correctText = correctTextFor(q);
    }

    if (ok) {
      const pts = questionPoints(q, true, secondsLeft);
      scoreRef.current += pts;
      correctRef.current += 1;
      streakRef.current += 1;
      if (streakRef.current > bestRef.current) bestRef.current = streakRef.current;
    } else {
      streakRef.current = 0;
      if (!devMode) livesRef.current -= 1;
    }

    reviewRef.current.push({
      prompt: q.prompt, options: q.options, correct: q.correct,
      picked: (q.type ?? "mcq") === "mcq" || q.type === "boolean" || q.type === "assertion" ? choice : null,
      concept: q.concept, explanation: q.explanation, pickedText, correctText, ok,
    });

    setLastOk(ok);
    setDisp({ lives: Math.max(0, livesRef.current), score: scoreRef.current, streak: streakRef.current });
    setPhase("feedback");
    advanceTimer.current = setTimeout(advance, 1300);
  }

  function advance() {
    if (livesRef.current <= 0) { finish(false); return; }
    if (i >= questions.length - 1) { finish(true); return; }
    setI((n) => n + 1);
  }

  function finish(survivedAll: boolean) {
    if (endedRef.current) return;
    endedRef.current = true;
    const cleared = survivedAll && livesRef.current > 0;
    const total = questions.length;
    const accuracy = answeredRef.current > 0 ? Math.round((correctRef.current / answeredRef.current) * 100) : 0;
    const prevHighest = state.events[ev!.id]?.highestCleared ?? 0;
    const result: LevelResult = {
      eventId: ev!.id, level, cleared,
      correct: correctRef.current, total,
      livesLeft: Math.max(0, livesRef.current), accuracy,
      scoreGained: cleared ? Math.round(levelClearScore(scoreRef.current, level) * (ev!.pointsMultiplier ?? 1)) : 0,
      heartsGained: cleared ? heartsForLevel(level) : 0,
      xpGained: cleared ? xpForLevel(level) : 0,
      newHighest: cleared && level > prevHighest,
      reachedMax: isLadder && cleared && level >= (ev!.maxLevel ?? 1),
      review: reviewRef.current,
      daily: ev!.format === "sprint",
      timeSec: Math.round((Date.now() - startedAtRef.current) / 1000),
    };
    completeLevel(result);
    navigate(`/arena/level-result?event=${ev!.id}`, { replace: true });
  }

  // ── Can the player submit right now? ────────────────────────────────────────
  const t = q.type ?? "mcq";
  const canSubmit =
    t === "multi" ? multi.length > 0
    : t === "fill" ? text.trim().length > 0
    : t === "match" ? assign.length > 0 && assign.every((a) => a != null)
    : t === "order" ? orderPick.length === (q.sequence ?? []).length
    : false; // choice types auto-submit on tap

  const pct = Math.max(0, Math.min(100, (secondsLeft / q.perSeconds) * 100));
  const barColor = pct > 50 ? "var(--success-500)" : pct > 20 ? "var(--warning-500)" : "var(--error-500)";
  const inFeedback = phase === "feedback";

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <StatusBar />

      {/* Top bar — exit · level/question · lives */}
      <div className="flex items-center" style={{ height: 52, padding: "0 12px", gap: 12 }}>
        <button onClick={() => arenaBack(navigate, `/arena/event?id=${ev.id}`)} aria-label="Exit level" className="flex items-center justify-center shrink-0"
          style={{ width: 36, height: 36, background: "none", border: "none", cursor: "pointer" }}>
          <X size={20} style={{ color: "var(--muted-foreground)" }} />
        </button>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
          {isLadder
            ? <>Level {level}<span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}> · Q {i + 1}/{questions.length}</span></>
            : <>Question {i + 1}<span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>/{questions.length}</span></>}
        </span>
        <div className="flex-1" />
        {devMode && (
          <span className="inline-flex items-center shrink-0" style={{
            height: 22, padding: "0 8px", borderRadius: 9999, gap: 4,
            backgroundColor: "color-mix(in srgb, var(--success-500) 16%, transparent)",
            border: "0.5px solid color-mix(in srgb, var(--success-500) 36%, transparent)",
            fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.4, color: "var(--success-500)",
          }}>DEV · ∞</span>
        )}
        <div className="flex items-center" style={{ gap: 4 }}>
          {Array.from({ length: maxLives }).map((_, k) => (
            <Heart key={k} size={16} fill={k < disp.lives ? "var(--error-500)" : "transparent"}
              style={{ color: k < disp.lives ? "var(--error-500)" : "var(--muted-foreground)" }} />
          ))}
        </div>
      </div>

      {/* Speed bar */}
      <div style={{ height: 4, margin: "0 12px", borderRadius: 9999, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: barColor, borderRadius: 9999, transition: "width 0.1s linear" }} />
      </div>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0" style={{ padding: "20px 16px", gap: 16, overflowY: "auto" }}>
        <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.4 }}>{q.prompt}</span>

        {/* Answer surface by type */}
        {(t === "mcq" || t === "boolean" || t === "assertion") && (
          <ChoiceOptions q={q} picked={choice} inFeedback={inFeedback} onPick={(idx) => { setChoice(idx); resolve(false); }} />
        )}
        {t === "multi" && (
          <MultiOptions q={q} selected={multi} inFeedback={inFeedback}
            onToggle={(idx) => setMulti((s) => s.includes(idx) ? s.filter((k) => k !== idx) : [...s, idx])} />
        )}
        {t === "fill" && (
          <FillInput value={text} inFeedback={inFeedback} ok={lastOk} answer={q.answer ?? ""} accent={ev.accent}
            onChange={setText} onSubmit={() => canSubmit && resolve(false)} />
        )}
        {t === "match" && (
          <MatchBoard q={q} right={rightShuffle.current.items} assign={assign} inFeedback={inFeedback}
            onAssign={(li, ri) => setAssign((s) => { const n = [...s]; n[li] = n[li] === ri ? null : ri; return n; })} />
        )}
        {t === "order" && (
          <OrderBoard items={orderShuffle.current.items} pick={orderPick} inFeedback={inFeedback}
            onTap={(si) => setOrderPick((s) => s.includes(si) ? s.filter((k) => k !== si) : [...s, si])}
            onReset={() => setOrderPick([])} />
        )}
      </div>

      {/* Submit (non-choice types) + feedback footer */}
      <div className="w-full max-w-2xl mx-auto" style={{ padding: "0 16px 16px", flexShrink: 0 }}>
        <AnimatePresence mode="wait">
          {inFeedback ? (
            <motion.div key="fb" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center" style={{ height: 44, gap: 8 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: lastOk ? "var(--success-500)" : "var(--error-500)" }}>
                {lastOk ? `Correct · +${questionPoints(q, true, secondsLeft)} pts` : devMode ? "Not quite" : "Not quite · −1 life"}
              </span>
            </motion.div>
          ) : (t !== "mcq" && t !== "boolean" && t !== "assertion") ? (
            <motion.button key="submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              disabled={!canSubmit} onClick={() => resolve(false)}
              className="flex items-center justify-center w-full" style={{
                height: 44, borderRadius: 12, border: "none", gap: 8,
                backgroundColor: canSubmit ? "var(--primary-500)" : "var(--disabled-bg)",
                color: canSubmit ? "var(--white)" : "var(--disabled-text)",
                fontSize: "var(--text-sm)", fontWeight: 600, cursor: canSubmit ? "pointer" : "default",
              }}>
              Submit answer <ArrowRight size={16} />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clampForExam(format: string, qs: Question[]): Question[] {
  return format === "exam" ? qs.slice(0, EXAM_CAP) : qs;
}

function correctTextFor(q: Question): string {
  switch (q.type ?? "mcq") {
    case "fill": return q.answer ?? "";
    case "multi": return (q.correctSet ?? []).map((k) => q.options[k]).join(", ");
    case "match": return (q.pairs ?? []).map((p) => `${p.left}→${p.right}`).join("  ");
    case "order": return (q.sequence ?? []).join(" → ");
    default: return q.options[q.correct] ?? "";
  }
}

// ─── Answer surfaces (presentational — selection lives in the parent) ──────────
function optStyle(state: "idle" | "right" | "wrong" | "dim") {
  const map = {
    idle: { bg: "var(--card)", border: "0.5px solid var(--border)", fg: "var(--foreground)" },
    right: { bg: "color-mix(in srgb, var(--success-500) 16%, transparent)", border: "1px solid var(--success-500)", fg: "var(--success-500)" },
    wrong: { bg: "color-mix(in srgb, var(--error-500) 16%, transparent)", border: "1px solid var(--error-500)", fg: "var(--error-500)" },
    dim: { bg: "var(--card)", border: "0.5px solid var(--border)", fg: "var(--muted-foreground)" },
  };
  return map[state];
}

function ChoiceOptions({ q, picked, inFeedback, onPick }: { q: Question; picked: number | null; inFeedback: boolean; onPick: (i: number) => void }) {
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      {q.options.map((opt, idx) => {
        const isCorrect = idx === q.correct, isPicked = picked === idx;
        let s: "idle" | "right" | "wrong" | "dim" = "idle";
        if (inFeedback) s = isCorrect ? "right" : isPicked ? "wrong" : "dim";
        const st = optStyle(s);
        return (
          <motion.button key={idx} whileTap={inFeedback ? undefined : { scale: 0.99 }} disabled={inFeedback} onClick={() => onPick(idx)}
            className="flex items-center justify-between text-left w-full" style={{
              minHeight: 56, padding: "12px 16px", borderRadius: 12, gap: 12,
              backgroundColor: st.bg, border: st.border, color: st.fg,
              fontSize: "var(--text-base)", fontWeight: 600, cursor: inFeedback ? "default" : "pointer",
            }}>
            <span>{opt}</span>
            {inFeedback && isCorrect && <Check size={18} style={{ color: "var(--success-500)", flexShrink: 0 }} />}
            {inFeedback && isPicked && !isCorrect && <X size={18} style={{ color: "var(--error-500)", flexShrink: 0 }} />}
          </motion.button>
        );
      })}
    </div>
  );
}

function MultiOptions({ q, selected, inFeedback, onToggle }: { q: Question; selected: number[]; inFeedback: boolean; onToggle: (i: number) => void }) {
  const correctSet = q.correctSet ?? [];
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      {q.options.map((opt, idx) => {
        const isSel = selected.includes(idx), isCorrect = correctSet.includes(idx);
        let s: "idle" | "right" | "wrong" | "dim" = isSel ? "right" : "idle";
        if (inFeedback) s = isCorrect ? "right" : isSel ? "wrong" : "dim";
        const st = optStyle(s);
        return (
          <button key={idx} disabled={inFeedback} onClick={() => onToggle(idx)}
            className="flex items-center text-left w-full" style={{
              minHeight: 52, padding: "10px 16px", borderRadius: 12, gap: 12,
              backgroundColor: st.bg, border: st.border, color: st.fg,
              fontSize: "var(--text-base)", fontWeight: 600, cursor: inFeedback ? "default" : "pointer",
            }}>
            <span className="flex items-center justify-center shrink-0" style={{
              width: 20, height: 20, borderRadius: 6,
              border: `1.5px solid ${isSel || (inFeedback && isCorrect) ? "currentColor" : "var(--muted-foreground)"}`,
              backgroundColor: isSel || (inFeedback && isCorrect) ? "currentColor" : "transparent",
            }}>
              {(isSel || (inFeedback && isCorrect)) && <Check size={13} style={{ color: "var(--background)" }} />}
            </span>
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function FillInput({ value, inFeedback, ok, answer, accent, onChange, onSubmit }: {
  value: string; inFeedback: boolean; ok: boolean; answer: string; accent: string; onChange: (v: string) => void; onSubmit: () => void;
}) {
  const border = inFeedback ? (ok ? "1px solid var(--success-500)" : "1px solid var(--error-500)") : `1px solid ${accent}`;
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <input
        value={value} disabled={inFeedback} autoFocus inputMode="text"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
        placeholder="Type your answer"
        style={{
          height: 56, padding: "0 16px", borderRadius: 12, border, outline: "none",
          backgroundColor: "var(--card)", color: "var(--foreground)",
          fontSize: "var(--text-lg)", fontWeight: 700, fontFamily: "var(--font-family-inter)",
        }}
      />
      {inFeedback && !ok && (
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--success-500)" }}>Answer: {answer}</span>
      )}
    </div>
  );
}

function MatchBoard({ q, right, assign, inFeedback, onAssign }: {
  q: Question; right: string[]; assign: (number | null)[]; inFeedback: boolean; onAssign: (li: number, ri: number) => void;
}) {
  const pairs = q.pairs ?? [];
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const usedRight = new Set(assign.filter((a) => a != null) as number[]);
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      {pairs.map((p, li) => {
        const ri = assign[li];
        const correct = ri != null && right[ri] === p.right;
        const border = inFeedback ? (correct ? "1px solid var(--success-500)" : "1px solid var(--error-500)")
          : activeLeft === li ? "1px solid var(--foreground)" : "0.5px solid var(--border)";
        return (
          <button key={li} disabled={inFeedback} onClick={() => setActiveLeft(activeLeft === li ? null : li)}
            className="flex items-center justify-between text-left w-full" style={{
              minHeight: 52, padding: "8px 12px 8px 16px", borderRadius: 12, gap: 8,
              backgroundColor: "var(--card)", border, cursor: inFeedback ? "default" : "pointer",
            }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--foreground)" }}>{p.left}</span>
            <span className="flex items-center justify-center" style={{
              minWidth: 72, height: 36, padding: "0 12px", borderRadius: 8,
              backgroundColor: ri != null ? "var(--card-bg-secondary)" : "transparent",
              border: ri != null ? "none" : "0.5px dashed var(--muted-foreground)",
              fontSize: "var(--text-sm)", fontWeight: 700, color: ri != null ? "var(--foreground)" : "var(--muted-foreground)",
            }}>{ri != null ? right[ri] : "—"}</span>
          </button>
        );
      })}
      {/* Right-option chips — tap a left row, then a chip to assign */}
      {!inFeedback && (
        <div className="flex flex-wrap" style={{ gap: 8, marginTop: 4 }}>
          {right.map((r, ri) => {
            const used = usedRight.has(ri);
            return (
              <button key={ri} disabled={activeLeft == null} onClick={() => { if (activeLeft != null) { onAssign(activeLeft, ri); setActiveLeft(null); } }}
                style={{
                  height: 36, padding: "0 14px", borderRadius: 9999,
                  backgroundColor: used ? "var(--card)" : "color-mix(in srgb, var(--foreground) 8%, transparent)",
                  border: "0.5px solid var(--border)", opacity: activeLeft == null ? 0.5 : 1,
                  fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)",
                  cursor: activeLeft == null ? "default" : "pointer",
                }}>{r}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderBoard({ items, pick, inFeedback, onTap, onReset }: {
  items: string[]; pick: number[]; inFeedback: boolean; onTap: (si: number) => void; onReset: () => void;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <div className="flex flex-col" style={{ gap: 8 }}>
        {items.map((it, si) => {
          const rank = pick.indexOf(si);
          const placed = rank >= 0;
          return (
            <button key={si} disabled={inFeedback} onClick={() => onTap(si)}
              className="flex items-center text-left w-full" style={{
                minHeight: 52, padding: "8px 16px", borderRadius: 12, gap: 12,
                backgroundColor: placed ? "color-mix(in srgb, var(--foreground) 8%, transparent)" : "var(--card)",
                border: placed ? "1px solid var(--foreground)" : "0.5px solid var(--border)",
                cursor: inFeedback ? "default" : "pointer",
              }}>
              <span className="flex items-center justify-center shrink-0" style={{
                width: 24, height: 24, borderRadius: 9999,
                backgroundColor: placed ? "var(--foreground)" : "var(--card-bg-secondary)",
                color: placed ? "var(--background)" : "var(--muted-foreground)",
                fontSize: "var(--text-xs)", fontWeight: 800,
              }}>{placed ? rank + 1 : "·"}</span>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--foreground)" }}>{it}</span>
            </button>
          );
        })}
      </div>
      {!inFeedback && pick.length > 0 && (
        <button onClick={onReset} className="flex items-center justify-center self-start" style={{
          height: 36, padding: "0 12px", borderRadius: 8, gap: 6, background: "none",
          border: "0.5px solid var(--border)", color: "var(--muted-foreground)",
          fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer",
        }}><RotateCcw size={14} /> Reset order</button>
      )}
    </div>
  );
}
