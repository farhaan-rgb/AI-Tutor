/**
 * Arena Level Result — what happens after a level (or a sprint run). Celebrates a
 * clear (score + gems banked, new rank, milestone badges) or frames a fail (out of
 * lives) with a retry. Pulls the result the play engine stashed in state.
 *
 * Route: /arena/level-result?event=<eventId>
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Trophy, Target, Zap, ListOrdered, Check, X, ChevronDown, Award, Flag } from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import { HeartIcon } from "../shared/heart-icon";
import { useArenaState, eventProgress } from "../shared/arena";
import { getEvent, currentLevel, getEventRank, rewardRoadmap } from "../shared/arena-events";
import { arenaBack } from "./arena-ui";

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state } = useArenaState();
  const result = state.lastLevelResult;
  const ev = getEvent(params.get("event") ?? result?.eventId ?? "");
  const [showReview, setShowReview] = useState(false);

  useEffect(() => { if (!result || !ev) navigate("/arena", { replace: true }); }, [result, ev, navigate]);
  if (!result || !ev) return null;

  const prog = eventProgress(state, ev.id);
  const cleared = result.cleared;
  const isLadder = ev.format === "ladder";
  const nextLevel = currentLevel(prog);
  const rank = getEventRank(ev, prog?.score ?? 0);
  const milestone = cleared && result.newHighest ? rewardRoadmap(ev).find((s) => s.level === result.level && (s.badge || s.prizeLabel)) : undefined;
  const accent = cleared ? "var(--success-500)" : "var(--error-500)";

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <StatusBar />
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "24px 16px 120px" }}>
        <div className="flex flex-col" style={{ gap: 16, flexShrink: 0 }}>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center" style={{ gap: 12, padding: "24px 16px", borderRadius: 12, position: "relative", overflow: "hidden", background: `color-mix(in srgb, ${accent} 14%, var(--card))`, border: `0.5px solid color-mix(in srgb, ${accent} 32%, var(--border))` }}>
          <div aria-hidden style={{ position: "absolute", top: -50, left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`, opacity: 0.2 }} />
          <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 9999, background: `color-mix(in srgb, ${accent} 24%, var(--card))`, border: `1.5px solid ${accent}`, position: "relative" }}>
            {cleared ? (result.reachedMax ? <Flag size={30} style={{ color: accent }} /> : <Trophy size={30} style={{ color: accent }} />) : <X size={30} style={{ color: accent }} />}
          </motion.div>
          <div className="flex flex-col" style={{ gap: 4, position: "relative" }}>
            <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--foreground)" }}>
              {cleared ? (result.reachedMax ? "Ladder complete!" : isLadder ? `Level ${result.level} cleared!` : "Sprint done!") : "Out of lives"}
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontWeight: 500 }}>
              {cleared
                ? (result.newHighest ? `New best on ${ev.title} — you're now rank #${rank}` : `Sharpened up — ${result.accuracy}% accuracy`)
                : `You cleared ${result.correct}/${result.total}. Give it another go.`}
            </span>
          </div>
        </motion.div>

        {/* Milestone badge unlocked */}
        {milestone && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center" style={{ gap: 12, padding: 14, borderRadius: 12, background: "linear-gradient(135deg, color-mix(in srgb, var(--warning-500) 22%, var(--card)) 0%, var(--card) 70%)", border: "1px solid color-mix(in srgb, var(--warning-500) 36%, transparent)" }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "color-mix(in srgb, var(--warning-500) 22%, transparent)" }}>
              {milestone.prizeLabel ? <Trophy size={20} style={{ color: "var(--warning-500)" }} /> : <Award size={20} style={{ color: "var(--warning-500)" }} />}
            </div>
            <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--foreground)" }}>{milestone.prizeLabel ? "Top prize unlocked" : `${milestone.badge} unlocked`}</span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>{milestone.prizeLabel ?? "Milestone badge added to your rewards"}</span>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="flex" style={{ gap: 8 }}>
          <Stat icon={Target} label="Correct" value={`${result.correct}/${result.total}`} />
          <Stat icon={Zap} label="Accuracy" value={`${result.accuracy}%`} />
          {cleared && result.newHighest
            ? <Stat heart label="Hearts" value={`+${result.heartsGained}`} />
            : <Stat icon={Trophy} label="Event score" value={`${(prog?.score ?? 0).toLocaleString("en-IN")}`} />}
        </div>

        {cleared && result.newHighest && (
          <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontWeight: 600 }}>Banked this level</span>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--success-500)", fontVariantNumeric: "tabular-nums" }}>
              +{result.scoreGained.toLocaleString("en-IN")} pts
              <span style={{ color: "var(--teal-500)" }}>+{result.xpGained} XP</span>
            </span>
          </div>
        )}

        {/* Review (collapsed) */}
        <div className="flex flex-col" style={{ borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)", overflow: "hidden" }}>
          <button onClick={() => setShowReview((v) => !v)} className="flex items-center w-full" style={{ gap: 10, padding: "14px 16px", background: "none", border: "none", cursor: "pointer" }}>
            <ListOrdered size={16} style={{ color: "var(--muted-foreground)" }} />
            <span style={{ flex: 1, textAlign: "left", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Review {result.review.length} answers</span>
            <ChevronDown size={16} style={{ color: "var(--muted-foreground)", transform: showReview ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {showReview && result.review.map((r, k) => (
            <div key={k} className="flex flex-col" style={{ gap: 6, padding: "12px 16px", borderTop: "0.5px solid var(--border)" }}>
              <div className="flex items-start" style={{ gap: 8 }}>
                <span className="flex items-center justify-center shrink-0" style={{ width: 18, height: 18, borderRadius: 9999, marginTop: 1, backgroundColor: r.ok ? "var(--success-500)" : "var(--error-500)" }}>
                  {r.ok ? <Check size={11} style={{ color: "var(--white)" }} /> : <X size={11} style={{ color: "var(--white)" }} />}
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)", lineHeight: 1.4 }}>{r.prompt}</span>
              </div>
              {!r.ok && (
                <div className="flex flex-col" style={{ gap: 2, paddingLeft: 26 }}>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>You: {r.pickedText ?? (r.picked != null ? r.options[r.picked] : "—")}</span>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--success-500)", fontWeight: 600 }}>Answer: {r.correctText ?? r.options[r.correct]}</span>
                </div>
              )}
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", paddingLeft: 26, lineHeight: 1.4 }}>{r.explanation}</span>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Sticky CTAs */}
      <div className="fixed bottom-0 left-0 right-0" style={{ padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", background: "linear-gradient(to top, var(--background) 60%, transparent)" }}>
        <div className="w-full max-w-2xl mx-auto flex flex-col" style={{ gap: 8 }}>
          {cleared && !result.reachedMax && isLadder && (
            <Primary onClick={() => navigate(`/arena/level?event=${ev.id}&level=${nextLevel}`, { replace: true })}>
              Next level — Level {nextLevel}
            </Primary>
          )}
          {!cleared && (
            <Primary onClick={() => navigate(`/arena/level?event=${ev.id}&level=${result.level}`, { replace: true })}>
              Retry Level {result.level}
            </Primary>
          )}
          <button onClick={() => arenaBack(navigate, `/arena/event?id=${ev.id}`)} className="flex items-center justify-center w-full" style={{
            height: 44, borderRadius: 12, border: "0.5px solid var(--border)", backgroundColor: "var(--card)",
            color: "var(--foreground)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer",
          }}>
            Back to {ev.title}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent = "var(--foreground)", heart = false }: { icon?: typeof Target; label: string; value: string; accent?: string; heart?: boolean }) {
  return (
    <div className="flex flex-col items-center" style={{ flex: 1, gap: 4, padding: "14px 8px", borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      {heart ? <HeartIcon size={16} /> : Icon ? <Icon size={16} style={{ color: accent }} /> : null}
      <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function Primary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button whileTap={{ scale: 0.99 }} onClick={onClick} className="flex items-center justify-center w-full" style={{
      height: 44, borderRadius: 12, border: "none", gap: 8, backgroundColor: "var(--primary-500)", color: "var(--white)",
      boxShadow: "0 6px 20px color-mix(in srgb, var(--primary-500) 32%, transparent)",
      fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer",
    }}>{children}</motion.button>
  );
}
