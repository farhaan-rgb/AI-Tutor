/**
 * Arena Result — the post-sprint moment. A shareable rank card (the #1 growth
 * surface) + the run's stats + rank movement, then play-again / standings.
 *
 * Route: /arena/result
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Share2, Play, ArrowUp, Gift, MessageCircle, Copy, Download, GraduationCap, Swords, Check, ChevronRight } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { useArenaState, getSubject, activeSubjectId, getActiveEvent, activeLevel, type WeekendEvent, type EventEntry } from "../shared/arena";
import { MetricTile, OlympiadHeader } from "./olympiad-ui";
import { ConfettiBurst } from "./certificate-view";
import { Zap, arenaBack } from "./arena-ui";
import { FireIcon } from "../shared/heart-icon";

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state } = useArenaState();
  const [showShare, setShowShare] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const isEvent = params.get("mode") === "event";
  const r = state.lastResult;
  const ev = getActiveEvent();
  const entry = ev && state.eventEntry?.eventId === ev.id ? state.eventEntry : undefined;

  // Deep-link / refresh with no run in memory → back to the hub (from an effect).
  const missing = isEvent ? !entry : !r;
  useEffect(() => {
    if (missing) navigate("/arena", { replace: true });
  }, [missing, navigate]);
  if (missing) return null;

  if (isEvent && entry && ev) {
    return <EventResult ev={ev} entry={entry} subject={getSubject(activeSubjectId(state)).label} showShare={showShare} setShowShare={setShowShare} navigate={navigate} />;
  }
  if (!r) return null; // narrows r for the sprint path

  const subject = getSubject(r.subjectId);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="League run" onBack={() => arenaBack(navigate)} />
      </GlassHeader>

      <ConfettiBurst />

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 32px", gap: 16, overflowX: "hidden" }}>
        {/* Hero — a daily sprint is solo practice (no rank/leaderboard), so the hero
            IS your SKILL: Level + progress, with a "Levelled up!" when this run grew it. */}
        <ResultHero
          accent={subject.accent} subject={subject.label}
          info={activeLevel(state)} levelledUp={r.levelAfter > r.levelBefore}
        />

        {/* Stats */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <div className="flex" style={{ gap: 8 }}>
            <MetricTile label="Points" value={`+${r.xp}`} sub="score" color="var(--warning-500)" />
            <MetricTile label="Accuracy" value={`${r.accuracy}%`} sub={`${r.correct}/${r.answered}`} />
            <MetricTile label="Best streak" value={`${r.bestStreak}`} sub="in a row" />
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <MetricTile label="Correct" value={`${r.correct}`} color="var(--success-500)" />
            <MetricTile label="Wrong" value={`${r.incorrect}`} color="var(--error-500)" />
            <MetricTile label="Total pts" value={`${r.pointsAfter.toLocaleString("en-IN")}`} sub="total" color={subject.accent} />
          </div>
        </div>

        {/* Learning loop — review your misses (E7-1) */}
        {r.review.length > 0 && (
          <ReviewRow misses={r.review.filter((q) => q.picked !== q.correct).length} reviewed={!!r.reviewed} onOpen={() => navigate("/arena/review")} xpReward={0} />
        )}

        {/* Actions — Play again is the primary next step; Challenge sits below. A solo
            sprint has no leaderboard, so there's no standings link here. */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          {state.energy > 0 && (
            <button type="button" onClick={() => navigate("/arena/play", { replace: true })}
              className="flex items-center justify-center w-full"
              style={{ height: 44, borderRadius: 12, gap: 8, border: "none", cursor: "pointer", backgroundColor: "var(--primary-500)", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
              <Play size={16} style={{ color: "var(--white)" }} /> Play again
            </button>
          )}
          <div className="flex" style={{ gap: 8 }}>
            <SecondaryBtn icon={Swords} label="Challenge a friend" onClick={() => setShowChallenge(true)} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showShare && <ShareSheet onClose={() => setShowShare(false)} />}
        {showChallenge && <ShareSheet kind="challenge" onClose={() => setShowChallenge(false)} />}
      </AnimatePresence>
    </div>
  );
}

// Weekend-event result — its own national-rank card, prize callout + actions.
function EventResult({ ev, entry, subject, showShare, setShowShare, navigate }: {
  ev: WeekendEvent; entry: EventEntry; subject: string;
  showShare: boolean; setShowShare: (v: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const won = entry.rank <= ev.promoteTop;
  const [showChallenge, setShowChallenge] = useState(false);
  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="Event result" onBack={() => arenaBack(navigate)} />
      </GlassHeader>

      {won && <ConfettiBurst />}

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 32px", gap: 20, overflowX: "hidden" }}>
        {/* Event rank card — shareable */}
        <div className="flex flex-col items-center text-center" style={{
          gap: 8, padding: "24px 20px", borderRadius: 12, overflow: "hidden", position: "relative", maxWidth: "100%",
          background: `linear-gradient(155deg, color-mix(in srgb, ${ev.accent} 22%, var(--card)) 0%, var(--card) 75%)`,
          border: `1px solid color-mix(in srgb, ${ev.accent} 40%, transparent)`,
        }}>
          <div aria-hidden style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${ev.accent} 0%, transparent 70%)`, opacity: 0.22 }} />
          <span className="truncate" style={{ maxWidth: "100%", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: ev.accent, zIndex: 1 }}>Arena · {ev.title}</span>
          <span style={{ fontSize: 52, fontWeight: 800, color: "var(--foreground)", lineHeight: 1.05, fontVariantNumeric: "tabular-nums", zIndex: 1 }}>#{entry.rank}</span>
          <span className="truncate" style={{ maxWidth: "100%", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", zIndex: 1 }}>nationally in {subject}</span>
          <div className="flex items-center justify-center flex-wrap" style={{ gap: "4px 16px", marginTop: 4, zIndex: 1 }}>
            <span className="flex items-center" style={{ gap: 6, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--warning-500)" }}>
              <Zap size={14} style={{ color: "var(--warning-500)" }} /> {entry.score} pts
            </span>
            <span className="flex items-center" style={{ gap: 6, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
              <FireIcon size={14} /> {entry.bestStreak} streak
            </span>
          </div>
        </div>

        {/* Prize zone */}
        {won ? (
          <div className="flex items-center justify-center" style={{ gap: 8 }}>
            <Gift size={18} style={{ color: "var(--success-500)" }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--success-500)" }}>In the prize zone — Top {ev.promoteTop} win {ev.prizeLabel}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>Top {ev.promoteTop} win {ev.prizeLabel} — improve before it ends</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <div className="flex" style={{ gap: 8 }}>
            <MetricTile label="Score" value={`${entry.score}`} sub="pts" color="var(--warning-500)" />
            <MetricTile label="Accuracy" value={`${entry.accuracy}%`} sub={`${entry.correct}/${entry.answered}`} />
            <MetricTile label="Best streak" value={`${entry.bestStreak}`} sub="in a row" />
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <MetricTile label="Correct" value={`${entry.correct}`} color="var(--success-500)" />
            <MetricTile label="Wrong" value={`${entry.incorrect}`} color="var(--error-500)" />
            <MetricTile label="Reached" value={`Q${entry.reachedLevel}`} sub={entry.ranOutOfLives ? "out of lives" : "cleared"} />
          </div>
        </div>

        {/* Learning loop */}
        {entry.review.length > 0 && (
          <ReviewRow misses={entry.review.filter((q) => q.picked !== q.correct).length} reviewed={!!entry.reviewed} onOpen={() => navigate("/arena/review?mode=event")} xpReward={0} />
        )}

        {/* Actions */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <button type="button" onClick={() => setShowShare(true)}
            className="flex items-center justify-center w-full"
            style={{ height: 44, borderRadius: 12, gap: 8, border: "none", cursor: "pointer", backgroundColor: "var(--primary-500)", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
            <Share2 size={16} style={{ color: "var(--white)" }} /> Share my result
          </button>
          <div className="flex" style={{ gap: 8 }}>
            <SecondaryBtn icon={Swords} label="Challenge" onClick={() => setShowChallenge(true)} />
            <SecondaryBtn icon={Play} label="Improve" onClick={() => navigate("/arena/play?mode=event")} />
          </div>
          <button type="button" onClick={() => navigate("/arena/event")}
            className="flex items-center justify-center w-full"
            style={{ height: 40, background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
            View full leaderboard
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showShare && <ShareSheet onClose={() => setShowShare(false)} />}
        {showChallenge && <ShareSheet kind="challenge" onClose={() => setShowChallenge(false)} />}
      </AnimatePresence>
    </div>
  );
}

// Result hero — a daily sprint is SOLO practice (no rank, no leaderboard), so the
// hero IS your SKILL: big Level, a "Levelled up!" celebration when this run grew it,
// and the progress bar toward the next level.
function ResultHero({ accent, subject, info, levelledUp }: {
  accent: string; subject: string;
  info: ReturnType<typeof activeLevel>; levelledUp: boolean;
}) {
  return (
    <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex flex-col items-center text-center" style={{
        borderRadius: 12, overflow: "hidden", position: "relative", maxWidth: "100%", gap: 6, padding: "24px 20px 20px",
        background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 24%, var(--card)) 0%, var(--card) 72%)`,
        border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
      }}>
      <div aria-hidden style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`, opacity: 0.22 }} />
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: accent, zIndex: 1 }}>{subject} skill</span>
      <span style={{ fontSize: 52, fontWeight: 800, color: "var(--foreground)", lineHeight: 1.05, zIndex: 1 }}>Level {info.level}</span>
      {levelledUp && (
        <span className="inline-flex items-center" style={{ gap: 4, height: 22, padding: "0 10px", borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--success-500) 18%, transparent)", color: "var(--success-500)", fontSize: "var(--text-2xs)", fontWeight: 800, zIndex: 1 }}>
          <ArrowUp size={12} style={{ color: "var(--success-500)" }} /> Levelled up!
        </span>
      )}
      <div className="w-full" style={{ marginTop: 8, zIndex: 1 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>Skill progress</span>
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--foreground)" }}>{info.toNextLabel}</span>
        </div>
        <div style={{ height: 8, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--black) 30%, transparent)", overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${info.pct}%` }} transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ height: "100%", borderRadius: 9999, backgroundColor: levelledUp ? "var(--success-500)" : accent }} />
        </div>
      </div>
    </motion.div>
  );
}

function SecondaryBtn({ icon: Icon, label, onClick }: { icon: typeof Play; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center justify-center" style={{
      flex: 1, height: 44, borderRadius: 12, gap: 8, cursor: "pointer",
      backgroundColor: "transparent", border: "1px solid var(--white-alpha-25)",
      color: "var(--foreground)", fontSize: "var(--text-sm)", fontWeight: 600,
    }}>
      <Icon size={16} /> {label}
    </button>
  );
}

function ReviewRow({ misses, reviewed, onOpen, xpReward }: { misses: number; reviewed: boolean; onOpen: () => void; xpReward: number }) {
  const xp = xpReward > 0; // event reviews don't grant league XP — don't promise it
  const sub = reviewed
    ? (xp ? `Reviewed · +${xpReward} pts` : "Reviewed")
    : misses > 0
    ? (xp ? `${misses} missed · see why · +${xpReward} pts` : `${misses} missed · see why`)
    : "Perfect run · see the set";
  return (
    <motion.button whileTap={{ scale: 0.99 }} type="button" onClick={onOpen} className="flex items-center w-full text-left"
      style={{
        gap: 12, padding: 16, borderRadius: 12, cursor: "pointer", backgroundColor: "var(--card)",
        border: `0.5px solid ${reviewed ? "var(--border)" : "color-mix(in srgb, var(--primary-500) 40%, var(--border))"}`,
      }}>
      <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "color-mix(in srgb, var(--primary-500) 14%, transparent)" }}>
        <GraduationCap size={20} style={{ color: "var(--primary-400)" }} />
      </div>
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Review your answers</span>
        <span className="truncate" style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{sub}</span>
      </div>
      {reviewed
        ? <Check size={18} style={{ color: "var(--success-500)", flexShrink: 0 }} />
        : <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />}
    </motion.button>
  );
}

// Lightweight bottom sheet — WhatsApp-first (the India sharing surface).
// `kind` toggles between sharing the rank card and challenging a friend (E5-2).
function ShareSheet({ onClose, kind = "share" }: { onClose: () => void; kind?: "share" | "challenge" }) {
  const isChallenge = kind === "challenge";
  const title = isChallenge ? "Challenge a friend" : "Share your rank card";
  const note = isChallenge ? "Same arena · scores compared." : undefined;
  const rows: { icon: typeof MessageCircle; label: string; color: string }[] = isChallenge
    ? [
        { icon: MessageCircle, label: "Challenge on WhatsApp", color: "var(--success-500)" },
        { icon: Copy, label: "Copy challenge link", color: "var(--foreground)" },
      ]
    : [
        { icon: MessageCircle, label: "Share on WhatsApp", color: "var(--success-500)" },
        { icon: Copy, label: "Copy link", color: "var(--foreground)" },
        { icon: Download, label: "Save image", color: "var(--foreground)" },
      ];
  return (
    <motion.div className="fixed inset-0 flex flex-col justify-end" style={{ zIndex: 60, backgroundColor: "var(--overlay-strong)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={(e) => e.stopPropagation()}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="w-full max-w-2xl mx-auto flex flex-col" style={{
          backgroundColor: "var(--card)", borderRadius: "20px 20px 0 0",
          padding: "12px 16px calc(16px + env(safe-area-inset-bottom))", gap: 4,
        }}>
        <div style={{ width: 36, height: 4, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)", alignSelf: "center", marginBottom: 8 }} />
        <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", padding: "4px 4px 0" }}>{title}</span>
        {note && <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", padding: "0 4px 8px" }}>{note}</span>}
        <div className="flex flex-col" style={{ marginTop: note ? 0 : 8, backgroundColor: "var(--card-bg-secondary)", borderRadius: 12, overflow: "hidden" }}>
          {rows.map((row, idx) => (
            <button key={row.label} type="button" onClick={onClose} className="flex items-center w-full text-left"
              style={{
                minHeight: 56, padding: "0 16px", gap: 12, background: "none", cursor: "pointer",
                borderBottom: idx < rows.length - 1 ? "0.5px solid color-mix(in srgb, var(--foreground) 10%, transparent)" : "none",
                borderTop: "none", borderLeft: "none", borderRight: "none",
              }}>
              <row.icon size={20} style={{ color: row.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "var(--text-base)", fontWeight: 500, color: "var(--foreground)" }}>{row.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
