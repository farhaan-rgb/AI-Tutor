/**
 * Arena Event — one contest, end to end. Before its window opens it's LOCKED with
 * a live countdown + a preview of the rules and reward roadmap. Once LIVE:
 *   • ladder → climb a level ladder (up to 50), with a per-event leaderboard and a
 *     reward roadmap (gems + badges per level; the big prize at the top).
 *   • exam   → a single timed paper (rules + start).
 *   • sprint → the daily warm-up (start).
 *
 * Everything that ranks you lives inside this screen — there's no season carried in.
 *
 * Route: /arena/event?id=<eventId>
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Lock, Trophy, Award, Check, Play, Ticket, Clock, Target, Heart, RefreshCw, ScrollText, Sparkles, Crown, Star, Mountain, X, Info } from "lucide-react";
import { HeartIcon } from "../shared/heart-icon";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { useArenaState, eventProgress, dailyDoneToday } from "../shared/arena";
import {
  getEvent, eventStatus, currentLevel, rewardRoadmap, getEventLeaderboard, getEventRank,
  dailyFieldStats, dailyBeatPct, fmtDuration,
  type ArenaEvent, type RewardStop, type EventProgress,
} from "../shared/arena-events";
import { OlympiadIcon, CountdownBlocks, CountdownInline, Avatar, OlympiadTag } from "./olympiad-ui";
import { arenaBack } from "./arena-ui";

type Tab = "levels" | "board" | "rewards";

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state } = useArenaState();
  const ev = getEvent(params.get("id") ?? "");

  const [tab, setTab] = useState<Tab>("levels");
  const [showRules, setShowRules] = useState(false);

  useEffect(() => { if (!ev) navigate("/arena", { replace: true }); }, [ev, navigate]);
  if (!ev) return null;

  const { phase } = eventStatus(ev);
  const comingSoon = !!ev.comingSoon;
  const locked = phase === "locked";
  const ended = phase === "ended";
  const passLocked = ev.gate === "gyd-pass" && !state.isPaid;
  const isLadder = ev.format === "ladder";
  const prog = eventProgress(state, ev.id);
  const myScore = prog?.score ?? 0;
  const level = currentLevel(prog);
  const sprintDone = ev.format === "sprint" && dailyDoneToday(state); // once-a-day: played today

  function enter() {
    if (passLocked) { navigate("/marketplace/games-pass"); return; }
    navigate(`/arena/level?event=${ev!.id}`);
  }

  // The join label is the SAME whether the event is locked or live — when locked the
  // button just sits disabled with a countdown beneath it, so the action is always legible.
  const cta = (() => {
    if (comingSoon) return { label: "Coming soon", sub: undefined as string | undefined };
    if (passLocked) return { label: "Unlock with GYD Max", sub: undefined as string | undefined };
    if (sprintDone) return { label: "Played today", sub: "New sprint at midnight" };
    if (!isLadder) return { label: ev.format === "exam" ? "Start paper" : "Start sprint", sub: undefined };
    if ((prog?.highestCleared ?? 0) === 0) return { label: "Start · Level 1", sub: undefined };
    if (prog && ev.maxLevel && prog.highestCleared >= ev.maxLevel) return { label: "Replay levels", sub: "Ladder complete" };
    return { label: `Continue · Level ${level}`, sub: undefined };
  })();
  const blocked = locked || sprintDone; // CTA disabled (locked event OR daily already played)

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 48, padding: "0 8px 0 4px", gap: 4 }}>
          <button onClick={() => arenaBack(navigate)} aria-label="Back" className="flex items-center justify-center shrink-0"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={22} style={{ color: "var(--foreground)" }} />
          </button>
          <span className="truncate" style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)" }}>{ev.title}</span>
        </div>
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "12px 16px 120px" }}>
        <div className="flex flex-col" style={{ gap: 16, flexShrink: 0 }}>
        {/* Hero — kept light: small icon, soft glow, one quiet meta line */}
        <div className="relative w-full overflow-hidden" style={{ borderRadius: 12, padding: 14, background: `color-mix(in srgb, ${ev.accent} 11%, var(--card))`, border: `0.5px solid color-mix(in srgb, ${ev.accent} 24%, var(--border))` }}>
          <div aria-hidden style={{ position: "absolute", top: -36, right: -28, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${ev.accent} 0%, transparent 70%)`, opacity: 0.13 }} />
          <div className="flex items-center" style={{ gap: 12, position: "relative" }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: 44, height: 44, borderRadius: 12, background: `color-mix(in srgb, ${ev.accent} 22%, var(--card))`, border: `1px solid color-mix(in srgb, ${ev.accent} 34%, transparent)` }}>
              <OlympiadIcon iconKey={ev.iconKey} size={22} color={ev.accent} />
            </div>
            <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.2 }}>{ev.title}</span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 500, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ev.theme}</span>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: 8, marginTop: 10, position: "relative", minWidth: 0 }}>
            {!locked && !ended && (
              <span className="inline-flex items-center shrink-0" style={{ gap: 5, height: 22, padding: "0 8px", borderRadius: 8, backgroundColor: "var(--error-d2)", border: "1px solid var(--error-d4)" }}>
                <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: "var(--error-500)" }} />
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--error-500)" }}>Live</span>
                <CountdownInline to={ev.endsAt} compact size="var(--text-2xs)" color="var(--error-500)" />
              </span>
            )}
            {ended && <span className="shrink-0" style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--muted-foreground)" }}>Ended</span>}
            {ev.gate === "gyd-pass" && <OlympiadTag label="GYD Max" variant="max" icon={Crown} />}
            <span className="truncate" style={{ flex: 1, minWidth: 0, fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>{ev.recurrence.split(" · ")[0]}</span>
          </div>
        </div>

        {/* LOCKED — countdown + preview (or a teaser when the date isn't set yet) */}
        {locked && (
          <>
            {comingSoon ? (
              <div className="flex flex-col items-center text-center" style={{ gap: 10, padding: "24px 20px", borderRadius: 12, position: "relative", overflow: "hidden", background: `color-mix(in srgb, ${ev.accent} 10%, var(--card))`, border: `0.5px solid color-mix(in srgb, ${ev.accent} 28%, var(--border))` }}>
                <div aria-hidden style={{ position: "absolute", top: -40, right: -30, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${ev.accent} 0%, transparent 70%)`, opacity: 0.18 }} />
                <span className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 12, position: "relative", background: `color-mix(in srgb, ${ev.accent} 22%, var(--card))`, border: `1px solid color-mix(in srgb, ${ev.accent} 38%, transparent)` }}>
                  <Sparkles size={22} style={{ color: ev.accent }} />
                </span>
                <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)" }}>Coming soon</span>
                {ev.teaser && <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: ev.accent }}>{ev.teaser}</span>}
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>We'll announce the exact date soon — here's what to expect.</span>
              </div>
            ) : (
              <div className="flex flex-col items-center" style={{ gap: 12, padding: "20px 16px", borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
                <span className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                  <Lock size={13} /> Opens in
                </span>
                <CountdownBlocks to={ev.startsAt} accent={ev.accent} />
              </div>
            )}
            <RulesEntry ev={ev} onClick={() => setShowRules(true)} />
            {!comingSoon && isLadder && prog?.lastRun && <LastRunCard ev={ev} run={prog.lastRun} />}
            {isLadder && <RewardRoadmapTrack ev={ev} highestCleared={0} />}
          </>
        )}

        {/* LIVE / ENDED */}
        {!locked && (
          <>
            {isLadder && <ProgressStrip ev={ev} score={myScore} level={level} accuracy={prog?.bestAccuracy ?? 0} attempts={prog?.attempts ?? 0} />}

            {isLadder ? (
              <>
                <Tabs tab={tab} setTab={setTab} />
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col" style={{ gap: 12 }}>
                    {tab === "levels" && <LevelLadder ev={ev} highestCleared={prog?.highestCleared ?? 0} onPlay={(lvl) => navigate(`/arena/level?event=${ev.id}&level=${lvl}`)} passLocked={passLocked} />}
                    {tab === "board" && <Leaderboard ev={ev} myScore={myScore} />}
                    {tab === "rewards" && <RewardRoadmapTrack ev={ev} highestCleared={prog?.highestCleared ?? 0} />}
                  </motion.div>
                </AnimatePresence>
              </>
            ) : ev.format === "exam" ? (
              <>
                <RulesEntry ev={ev} onClick={() => setShowRules(true)} />
                <Leaderboard ev={ev} myScore={myScore} />
              </>
            ) : (
              // Daily Sprint — once a day, then a LinkedIn-games style "where you stand today".
              <>
                <SprintFacts ev={ev} />
                <DailyToday ev={ev} done={sprintDone ? state.dailyDone : undefined} />
              </>
            )}
          </>
        )}
        </div>
      </div>

      {/* Sticky CTA — z-index above the scrolling content (roadmap nodes carry
          their own z-index) so content scrolls BEHIND it, not over it. */}
      <div className="fixed bottom-0 left-0 right-0" style={{ zIndex: 30, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", background: "linear-gradient(to top, var(--background) 72%, transparent)" }}>
        <div className="w-full max-w-2xl mx-auto">
          <motion.button whileTap={blocked ? undefined : { scale: 0.99 }} onClick={() => { if (!blocked) enter(); }} disabled={blocked}
            className="flex items-center justify-center w-full" style={{
              height: 44, borderRadius: 12, border: "none", gap: 8,
              backgroundColor: blocked ? "var(--disabled-bg)" : "var(--primary-500)",
              color: blocked ? "var(--disabled-text)" : "var(--white)",
              boxShadow: blocked ? "none" : "0 6px 20px color-mix(in srgb, var(--primary-500) 32%, transparent)",
              fontSize: "var(--text-sm)", fontWeight: 600, cursor: blocked ? "not-allowed" : "pointer",
            }}>
            {comingSoon ? <Sparkles size={16} /> : sprintDone ? <Check size={16} /> : locked ? <Lock size={16} /> : passLocked ? <Ticket size={16} /> : <Play size={16} fill="var(--white)" />}
            {cta.label}
          </motion.button>
          {cta.sub && <span className="block text-center" style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", marginTop: 6 }}>{cta.sub}</span>}
        </div>
      </div>

      <RulesSheet ev={ev} open={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}

// ─── Small bits ────────────────────────────────────────────────────────────────
function Tabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { id: Tab; label: string }[] = [{ id: "levels", label: "Levels" }, { id: "board", label: "Rankings" }, { id: "rewards", label: "Rewards" }];
  return (
    <div className="flex" style={{ gap: 4, padding: 4, borderRadius: 12, backgroundColor: "var(--card-bg-secondary)" }}>
      {items.map((it) => {
        const sel = tab === it.id;
        return (
          <button key={it.id} onClick={() => setTab(it.id)} className="flex-1" style={{
            height: 36, borderRadius: 8, border: "none", cursor: "pointer",
            backgroundColor: sel ? "var(--card)" : "transparent",
            color: sel ? "var(--foreground)" : "var(--muted-foreground)",
            fontSize: "var(--text-sm)", fontWeight: 700,
          }}>{it.label}</button>
        );
      })}
    </div>
  );
}

function ProgressStrip({ ev, score, level, accuracy, attempts }: { ev: ArenaEvent; score: number; level: number; accuracy: number; attempts: number }) {
  const rank = getEventRank(ev, score);
  const played = attempts > 0;
  const cells = [
    { label: "Your level", value: `${Math.min(level, ev.maxLevel ?? 50)}/${ev.maxLevel ?? 50}` },
    { label: "Event rank", value: played ? `#${rank}` : "—" },
    { label: "Best accuracy", value: played ? `${accuracy}%` : "—" },
  ];
  return (
    <div className="flex" style={{ gap: 8, padding: 12, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      {cells.map((c, k) => (
        <div key={c.label} className="flex flex-col" style={{ flex: 1, gap: 2, borderLeft: k > 0 ? "0.5px solid var(--border)" : "none", paddingLeft: k > 0 ? 12 : 0 }}>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{c.value}</span>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

// A daily sprint needs no rules card — the hero already says it. Just the 3 facts
// that aren't in the hero, in the same compact strip the ladder uses for progress.
function SprintFacts({ ev }: { ev: ArenaEvent }) {
  const cells = [
    { label: "Questions", value: `${ev.questionsPerLevel ?? 7}` },
    { label: "Lives", value: `${ev.livesPerLevel ?? 3}` },
    { label: "Question types", value: "Mixed" },
  ];
  return (
    <div className="flex" style={{ gap: 8, padding: 12, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      {cells.map((c, k) => (
        <div key={c.label} className="flex flex-col" style={{ flex: 1, gap: 2, borderLeft: k > 0 ? "0.5px solid var(--border)" : "none", paddingLeft: k > 0 ? 12 : 0 }}>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{c.value}</span>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

// Daily Sprint "Today" — LinkedIn-games style. Once you've played, it shows where
// you stand vs everyone who's played today (score, time, accuracy vs the field);
// before that, a teaser of today's averages. A compact top-3, not a big board.
function DailyToday({ ev, done }: { ev: ArenaEvent; done?: { score: number; accuracy: number; correct: number; total: number; timeSec: number } }) {
  const field = dailyFieldStats(ev);
  const top3 = getEventLeaderboard(ev, done?.score ?? 0, "national").slice(0, 3);
  const beatPct = done ? dailyBeatPct(done.score, field.avgScore) : 0;
  const medal = ["var(--warning-500)", "color-mix(in srgb, var(--foreground) 55%, transparent)", "color-mix(in srgb, var(--warning-500) 60%, var(--error-500))"];

  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <div className="flex flex-col" style={{ borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)", overflow: "hidden" }}>
        <div className="flex items-center justify-between" style={{ padding: "14px 16px 12px" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Today</span>
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>{field.participants.toLocaleString("en-IN")} played</span>
        </div>
        <div style={{ height: 0.5, backgroundColor: "var(--border)" }} />

        {done ? (
          <>
            {/* where you stand */}
            <div className="flex flex-col items-center text-center" style={{ gap: 6, padding: "16px 16px 14px" }}>
              <span style={{ fontSize: "var(--text-2xl, 30px)", fontWeight: 800, color: ev.accent, lineHeight: 1 }}>Top {100 - beatPct}%</span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontWeight: 500 }}>You beat {beatPct}% of players today</span>
            </div>
            <div className="flex" style={{ padding: "0 16px 16px", gap: 8 }}>
              {[
                { label: "Your score", value: done.score.toLocaleString("en-IN"), sub: `avg ${field.avgScore}` },
                { label: "Your time", value: fmtDuration(done.timeSec || field.avgTimeSec), sub: `avg ${fmtDuration(field.avgTimeSec)}` },
                { label: "Accuracy", value: `${done.accuracy}%`, sub: `${done.correct}/${done.total}` },
              ].map((c, k) => (
                <div key={c.label} className="flex flex-col" style={{ flex: 1, gap: 2, borderLeft: k > 0 ? "0.5px solid var(--border)" : "none", paddingLeft: k > 0 ? 12 : 0 }}>
                  <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{c.value}</span>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>{c.label}</span>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", opacity: 0.7 }}>{c.sub}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col" style={{ padding: "14px 16px 16px", gap: 12 }}>
            <div className="flex" style={{ gap: 8 }}>
              {[
                { label: "Avg score today", value: `${field.avgScore}` },
                { label: "Avg time today", value: fmtDuration(field.avgTimeSec) },
              ].map((c, k) => (
                <div key={c.label} className="flex flex-col" style={{ flex: 1, gap: 2, borderLeft: k > 0 ? "0.5px solid var(--border)" : "none", paddingLeft: k > 0 ? 12 : 0 }}>
                  <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{c.value}</span>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>{c.label}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Play today's sprint to see where you land against everyone.</span>
          </div>
        )}
      </div>

      {/* compact top 3 — social proof, not a full board */}
      <div className="flex flex-col" style={{ borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)", overflow: "hidden" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", padding: "14px 16px 10px" }}>Today's top 3</span>
        {top3.map((row, k) => (
          <div key={row.rank} className="flex items-center" style={{ gap: 12, padding: "10px 16px", borderTop: "0.5px solid var(--border)" }}>
            <span className="shrink-0 flex items-center justify-center" style={{ width: 24 }}><Trophy size={15} style={{ color: medal[k] }} /></span>
            <Avatar name={row.name} size={28} />
            <span className="truncate" style={{ flex: 1, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>{row.name}</span>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{row.score.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// On a locked recurring ladder: your result from the previous run — a reason to come back and beat it.
function LastRunCard({ ev, run }: { ev: ArenaEvent; run: NonNullable<EventProgress["lastRun"]> }) {
  const max = ev.maxLevel ?? 50;
  const cells = [
    { label: "Level reached", value: `${Math.min(run.level, max)}/${max}` },
    { label: "Your rank", value: `#${run.rank}` },
    { label: "Best accuracy", value: `${run.accuracy}%` },
  ];
  return (
    <div className="flex flex-col" style={{ gap: 10, padding: 14, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--muted-foreground)" }}>Your last run</span>
      <div className="flex" style={{ gap: 8 }}>
        {cells.map((c, k) => (
          <div key={c.label} className="flex flex-col" style={{ flex: 1, gap: 2, borderLeft: k > 0 ? "0.5px solid var(--border)" : "none", paddingLeft: k > 0 ? 12 : 0 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{c.value}</span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// The rules, as data — shared by the first-fold entry's count and the sheet.
function rulesRows(ev: ArenaEvent): { icon: typeof Clock; text: string }[] {
  if (ev.format === "exam") return [
    { icon: Clock, text: `${ev.durationMinutes}-minute paper · ${ev.questionCount} questions` },
    { icon: Trophy, text: ev.prizeLabel },
    { icon: Award, text: "National rank + certificate at close" },
  ];
  if (ev.format === "sprint") return [
    { icon: Target, text: `${ev.questionsPerLevel} quick questions · mixed types` },
    { icon: Heart, text: `${ev.livesPerLevel} lives · keep your streak alive` },
    { icon: Trophy, text: ev.prizeLabel },
  ];
  return [
    { icon: Target, text: `${ev.questionsPerLevel} questions per level · ${ev.maxLevel} levels to climb` },
    { icon: Heart, text: `${ev.livesPerLevel} wrong answers allowed per level` },
    { icon: Award, text: "Earn badges as you climb + a certificate for finishing the ladder" },
    { icon: RefreshCw, text: `Board resets ${ev.boardReset ?? "weekly"} — top ${ev.promoteTop} on points win ${ev.prizeLabel}` },
  ];
}

// First-fold entry — a single quiet row. Tapping it raises the rules sheet, so the
// fold stays scannable (countdown + this) instead of a long inline rules list.
function RulesEntry({ ev, onClick }: { ev: ArenaEvent; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center w-full text-left" style={{
      gap: 12, padding: "12px 14px", borderRadius: 12, cursor: "pointer",
      backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
    }}>
      <span className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: `color-mix(in srgb, ${ev.accent} 16%, transparent)`, border: `1px solid color-mix(in srgb, ${ev.accent} 30%, transparent)` }}>
        <Info size={18} style={{ color: ev.accent }} />
      </span>
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>How it works</span>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>Rules, lives &amp; how to win</span>
      </div>
      <ChevronRight size={18} style={{ color: "var(--muted-foreground)" }} />
    </button>
  );
}

// Rules bottom-sheet — backdrop fade + a spring rise, drag-to-dismiss, and rows that
// stagger in. (Matches the product's sheet language; tuned for a tactile, premium feel.)
function RulesSheet({ ev, open, onClose }: { ev: ArenaEvent; open: boolean; onClose: () => void }) {
  const rows = rulesRows(ev);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div onClick={onClose} aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "var(--overlay-strong)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.9 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_e, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}
            className="w-full max-w-2xl mx-auto"
            style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 61, backgroundColor: "var(--card)", borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTop: "0.5px solid var(--border)", paddingBottom: "calc(20px + env(safe-area-inset-bottom))", boxShadow: "0 -12px 40px rgba(0,0,0,0.5)" }}>
            <div className="flex justify-center" style={{ padding: "10px 0 4px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)" }} />
            </div>
            <div className="flex items-center justify-between" style={{ padding: "8px 16px 12px" }}>
              <span className="truncate" style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>How it works</span>
              <button onClick={onClose} aria-label="Close" className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>
            <div style={{ height: 0.5, backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)", margin: "0 16px" }} />
            <div style={{ padding: 16 }}>
              <div className="flex flex-col" style={{ borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
                {rows.map((row, k) => (
                  <motion.div key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + k * 0.05, duration: 0.25 }}
                    className="flex items-start" style={{ gap: 12, padding: "14px 16px", borderTop: k === 0 ? "none" : "0.5px solid color-mix(in srgb, var(--foreground) 8%, transparent)" }}>
                    <span className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `color-mix(in srgb, ${ev.accent} 16%, transparent)` }}>
                      <row.icon size={16} style={{ color: ev.accent }} />
                    </span>
                    <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--foreground)", fontWeight: 500, lineHeight: 1.4, paddingTop: 5 }}>{row.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Level ladder ──────────────────────────────────────────────────────────────
function LevelLadder({ ev, highestCleared, onPlay, passLocked }: {
  ev: ArenaEvent; highestCleared: number; onPlay: (level: number) => void; passLocked: boolean;
}) {
  const max = ev.maxLevel ?? 50;
  const roadmap = new Map(rewardRoadmap(ev).map((s) => [s.level, s]));
  const current = Math.min(highestCleared + 1, max);
  // Ascending: Level 1 at the top → the Final at the bottom (a natural climb,
  // matching the reward roadmap). Auto-scroll to the level you're on so you
  // always land where you are, not at the far end.
  const levels = Array.from({ length: max }, (_, k) => k + 1);
  const currentRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => currentRef.current?.scrollIntoView({ block: "center" }));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="flex flex-col" style={{ borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)", overflow: "hidden" }}>
      {levels.map((lvl) => {
        const cleared = lvl <= highestCleared;
        const isCurrent = lvl === current && !passLocked;
        const isLocked = lvl > current || passLocked;
        const stop = roadmap.get(lvl);
        const tappable = (isCurrent || cleared) && !passLocked;
        return (
          <button key={lvl} ref={isCurrent ? currentRef : undefined} disabled={!tappable} onClick={() => tappable && onPlay(lvl)}
            className="flex items-center w-full text-left" style={{
              gap: 12, padding: "10px 16px", borderTop: lvl === 1 ? "none" : "0.5px solid var(--border)",
              backgroundColor: isCurrent ? `color-mix(in srgb, ${ev.accent} 12%, transparent)` : "transparent",
              cursor: tappable ? "pointer" : "default",
            }}>
            <span className="flex items-center justify-center shrink-0" style={{
              width: 30, height: 30, borderRadius: 9999,
              backgroundColor: cleared ? "var(--success-500)" : isCurrent ? ev.accent : "var(--card-bg-secondary)",
              color: cleared || isCurrent ? "var(--white)" : "var(--muted-foreground)",
              fontSize: "var(--text-xs)", fontWeight: 800,
            }}>
              {cleared ? <Check size={15} /> : isLocked ? <Lock size={13} /> : lvl}
            </span>
            <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: isLocked ? "var(--muted-foreground)" : "var(--foreground)" }}>
                Level {lvl}{lvl === max ? " · Final" : ""}
              </span>
              {stop && <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>{stopLabel(stop)}</span>}
            </div>
            {stop && <RewardGlyph stop={stop} accent={ev.accent} dim={isLocked} />}
            {isCurrent && <span className="inline-flex items-center" style={{ gap: 4, fontSize: "var(--text-2xs)", fontWeight: 800, color: ev.accent }}><Play size={11} fill={ev.accent} /> PLAY</span>}
          </button>
        );
      })}
    </div>
  );
}

function stopLabel(s: RewardStop): string {
  if (s.cert) return s.badge ? `${s.cert} + ${s.badge} badge` : s.cert;
  if (s.prizeLabel) return `Top prize · ${s.prizeLabel}`;
  if (s.badge) return `${s.badge} badge${s.hearts ? ` · ${s.hearts} hearts` : ""}`;
  return `${s.hearts} hearts`;
}

function RewardGlyph({ stop, accent, dim, onAccent }: { stop: RewardStop; accent: string; dim?: boolean; onAccent?: boolean }) {
  if (stop.icon === "heart") return <HeartIcon size={18} style={{ flexShrink: 0, opacity: dim ? 0.5 : 1 }} />;
  const Icon = stop.cert ? ScrollText : stop.icon === "trophy" ? Trophy : Award;
  const color = onAccent ? "var(--white)" : dim ? "var(--muted-foreground)" : stop.icon === "trophy" ? "var(--warning-500)" : accent;
  return <Icon size={18} style={{ color, flexShrink: 0 }} />;
}

// ─── Leaderboard ───────────────────────────────────────────────────────────────
function Leaderboard({ ev, myScore }: { ev: ArenaEvent; myScore: number }) {
  const board = getEventLeaderboard(ev, myScore, "national");
  const me = board.find((e) => e.isMe);
  const top = board.slice(0, 20);
  const reset = ev.boardReset ?? (ev.format === "ladder" ? "every week" : "daily");
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <div className="flex items-center" style={{ gap: 6, padding: "2px 4px 0" }}>
        <Trophy size={13} style={{ color: "var(--warning-500)", flexShrink: 0 }} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 600, lineHeight: 1.3 }}>
          Top {ev.promoteTop} win {ev.prizeLabel} · resets {reset}
        </span>
      </div>
      <div className="flex flex-col" style={{ borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)", overflow: "hidden" }}>
        {top.map((row, k) => <Row key={row.rank} rank={row.rank} name={row.name} score={row.score} isMe={row.isMe} top={k === 0} divider={k > 0} />)}
        {me && me.rank > 20 && <>
          <div style={{ height: 0.5, backgroundColor: "var(--border)" }} />
          <Row rank={me.rank} name="You" score={me.score} isMe divider={false} />
        </>}
      </div>
    </div>
  );
}

function Row({ rank, name, score, isMe, top, divider }: { rank: number; name: string; score: number; isMe?: boolean; top?: boolean; divider?: boolean }) {
  return (
    <div className="flex items-center" style={{
      gap: 12, padding: "10px 16px", borderTop: divider ? "0.5px solid var(--border)" : "none",
      backgroundColor: isMe ? "color-mix(in srgb, var(--primary-500) 12%, transparent)" : "transparent",
    }}>
      <span className="shrink-0 text-center" style={{ width: 24, fontSize: "var(--text-sm)", fontWeight: 800, color: top ? "var(--warning-500)" : "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{rank}</span>
      <Avatar name={name} size={28} />
      <span className="truncate" style={{ flex: 1, fontSize: "var(--text-sm)", fontWeight: isMe ? 800 : 600, color: "var(--foreground)" }}>{name}</span>
      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{score.toLocaleString("en-IN")}</span>
    </div>
  );
}

// ─── Reward roadmap ──────────────────────────────────────────────────────────
// Distinct medallion per milestone so the climb reads as a real badge set, not the
// same ribbon four times: a starter sparkle → a star → a summit → the champion crown.
const ROADMAP_TIER_ICONS = [Sparkles, Star, Mountain];
function roadmapGlyph(s: RewardStop, k: number) { return s.cert ? Crown : (ROADMAP_TIER_ICONS[k] ?? Award); }
// 3D medal sheen — light hits top, shades to the base color at the rim.
const medalGrad = (c: string) => `radial-gradient(circle at 50% 28%, color-mix(in srgb, ${c} 85%, var(--white)) 0%, ${c} 56%, color-mix(in srgb, ${c} 50%, var(--black)) 100%)`;

function RewardRoadmapTrack({ ev, highestCleared }: { ev: ArenaEvent; highestCleared: number }) {
  const stops = rewardRoadmap(ev);
  const claimed = stops.filter((s) => s.level <= highestCleared).length;
  const nextIdx = stops.findIndex((s) => s.level > highestCleared);
  const last = stops.length - 1;
  const idleLine = `color-mix(in srgb, ${ev.accent} 22%, transparent)`;

  return (
    <div className="flex flex-col" style={{ borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)", overflow: "hidden" }}>
      <div className="flex items-center" style={{ gap: 12, padding: "16px 16px 14px" }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Rewards roadmap</span>
        <span className="shrink-0 inline-flex items-center justify-center" style={{
          height: 24, padding: "0 10px", borderRadius: 9999, fontSize: "var(--text-2xs)", fontWeight: 800,
          color: ev.accent, backgroundColor: `color-mix(in srgb, ${ev.accent} 14%, transparent)`, fontVariantNumeric: "tabular-nums",
        }}>{claimed}/{stops.length}</span>
      </div>
      <div style={{ height: 0.5, backgroundColor: "var(--border)" }} />

      <div className="flex flex-col" style={{ padding: "8px 16px 4px" }}>
        {stops.map((s, k) => {
          const reached = s.level <= highestCleared;
          const isNext = k === nextIdx;
          const isFinal = k === last;
          const upperDone = k > 0 && stops[k - 1].level <= highestCleared;
          const lowerDone = reached;

          return (
            <div key={s.level} className="flex" style={{ gap: 14 }}>
              {/* spine + medallion node. Lines sit BEHIND the opaque node (zIndex) so
                  the connector never shows through the badge. */}
              <div className="relative flex justify-center shrink-0" style={{ width: 40 }}>
                {k > 0 && <div style={{ position: "absolute", top: 0, height: 20, width: 2, borderRadius: 2, zIndex: 0, backgroundColor: upperDone ? "var(--success-500)" : idleLine }} />}
                {!isFinal && <div style={{ position: "absolute", top: 20, bottom: 0, width: 2, borderRadius: 2, zIndex: 0, backgroundColor: lowerDone ? "var(--success-500)" : idleLine }} />}
                {(() => {
                  const Glyph = roadmapGlyph(s, k);
                  const lit = reached || isNext;          // a real medal sheen
                  const c = reached ? "var(--success-500)" : ev.accent;
                  return (
                    <span className="flex items-center justify-center" style={{
                      position: "relative", zIndex: 1, width: 40, height: 40, borderRadius: 9999, flexShrink: 0,
                      background: lit ? medalGrad(c) : `color-mix(in srgb, ${ev.accent} 18%, var(--card))`,
                      border: lit ? `1.5px solid color-mix(in srgb, ${c} 45%, var(--white))` : `1px solid color-mix(in srgb, ${ev.accent} 30%, transparent)`,
                      boxShadow: isNext ? `0 0 14px color-mix(in srgb, ${ev.accent} 45%, transparent)` : isFinal ? `0 0 0 3px color-mix(in srgb, ${ev.accent} 14%, transparent)` : "none",
                    }}>
                      {reached
                        ? <Check size={18} style={{ color: "var(--white)" }} />
                        : <Glyph size={18} style={{ color: isNext ? "var(--white)" : `color-mix(in srgb, ${ev.accent} 70%, var(--muted-foreground))` }} />}
                    </span>
                  );
                })()}
              </div>

              {/* content */}
              <div className="flex items-start" style={{ flex: 1, minWidth: 0, gap: 8, paddingTop: 8, paddingBottom: isFinal ? 12 : 18 }}>
                <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <span className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                    Level {s.level}
                    {isFinal && <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: ev.accent, padding: "1px 6px", borderRadius: 9999, backgroundColor: `color-mix(in srgb, ${ev.accent} 16%, transparent)` }}>FINAL</span>}
                  </span>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600, lineHeight: 1.4 }}>{stopLabel(s)}</span>
                </div>
                {reached
                  ? <span className="shrink-0" style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--success-500)" }}>CLAIMED</span>
                  : isNext
                    ? <span className="shrink-0" style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: ev.accent }}>NEXT</span>
                    : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
