/**
 * Arena — the Events Hub (the new spine). A scheduled feed of contests, scoped by
 * your division (inferred) + subject. Each contest is self-contained: its own level
 * ladder, leaderboard and reward roadmap (see arena-event). The persistent League/
 * Tier season is retired — ranking now lives inside each event.
 *
 * Top of the feed = the daily habit loop (free Spin + Daily Sprint). Below it,
 * Live contests, then "Opening soon" locked events counting down to their window.
 *
 * Route: /arena
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft, ChevronDown, Gift, History, Sparkles, Zap, Lock, CalendarClock, Ticket, Trophy, Crown, type LucideIcon } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { HeartIcon } from "../shared/heart-icon";
import { useArenaState, getDivision, getSubject, canSpinNow, eventProgress } from "../shared/arena";
import {
  listEvents, eventStatus, currentLevel, getEventRank, type ArenaEvent,
} from "../shared/arena-events";
import { CountdownInline, OlympiadIcon } from "./olympiad-ui";
import { arenaBack, ArenaCoverCard, HeroMotif } from "./arena-ui";

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, setActiveSubject, reset } = useArenaState();

  // Auto-hide the context chrome on scroll-down (same behaviour as before).
  const scrollRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);
  const [hideChrome, setHideChrome] = useState(false);
  const [chromeH, setChromeH] = useState(0);
  useLayoutEffect(() => {
    if (chromeRef.current) setChromeH(chromeRef.current.offsetHeight);
  }, [state.subjects.length, state.divisionId]);
  function onScroll() {
    const y = scrollRef.current?.scrollTop ?? 0;
    if (y < 40) setHideChrome(false);
    else if (y > lastY.current + 6) setHideChrome(true);
    else if (y < lastY.current - 6) setHideChrome(false);
    lastY.current = y;
  }

  // Preview demo toggle: ?demo=new / ?demo=pro.
  const demo = params.get("demo");
  const appliedDemo = useRef<string | null>(null);
  useEffect(() => {
    if ((demo === "new" || demo === "pro") && appliedDemo.current !== demo) {
      appliedDemo.current = demo;
      reset(demo);
    }
  }, [demo, reset]);

  useEffect(() => {
    if (!state.onboarded) navigate("/arena/onboarding", { replace: true });
  }, [state.onboarded, navigate]);
  if (!state.onboarded) return null;

  const division = getDivision(state.divisionId);

  // Events for the active subject (anySubject events always show). One feed, no
  // section split: live events first, then locked — each ordered by its own
  // countdown (soonest-ending live / soonest-opening locked) so the most
  // time-sensitive card sits nearest the top. The card's ENDS/OPENS chip already
  // signals live-vs-opening, so no section labels are needed.
  const visible = listEvents().filter((e) => e.anySubject || e.subjectId === state.activeSubjectId);
  const sprint = visible.find((e) => e.format === "sprint");
  const PHASE_ORDER = { live: 0, locked: 1, ended: 2 } as const;
  // One continuous feed: live → locked → coming-soon teasers (which render disabled,
  // last in the list — no separate section, just keep scrolling).
  const feed = visible
    .filter((e) => e.format !== "sprint")
    .map((e) => ({ e, st: eventStatus(e) }))
    .filter(({ st }) => st.phase !== "ended")
    .sort((a, b) =>
      Number(!!a.e.comingSoon) - Number(!!b.e.comingSoon) ||
      PHASE_ORDER[a.st.phase] - PHASE_ORDER[b.st.phase] ||
      a.st.countdownTo - b.st.countdownTo);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 48, padding: "0 8px 0 4px", gap: 4 }}>
          <button onClick={() => arenaBack(navigate, "/classes")} aria-label="Back" className="flex items-center justify-center shrink-0"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={22} style={{ color: "var(--foreground)" }} />
          </button>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)" }}>Arena</span>
          <div style={{ flex: 1 }} />
          <HeartsPill hearts={state.hearts} onClick={() => navigate("/arena/hearts")} />
          <IconAction icon={Gift} label="Rewards" accent="var(--warning-500)" onClick={() => navigate("/arena/rewards")} />
          <IconAction icon={History} label="Results" accent="var(--primary-400)" onClick={() => navigate("/arena/my-events")} />
        </div>
        <motion.div initial={false} animate={{ height: hideChrome ? 0 : (chromeH || "auto"), opacity: hideChrome ? 0 : 1 }}
          transition={{ height: { duration: 0.32, ease: [0.32, 0.72, 0, 1] }, opacity: { duration: 0.2, ease: "easeOut" } }}
          style={{ overflow: "hidden" }}>
          <div ref={chromeRef}>
            <div className="flex items-center" style={{ gap: 8, padding: "12px 16px", overflowX: "auto", scrollbarWidth: "none" }}>
              <button onClick={() => navigate("/arena/onboarding")} className="shrink-0 flex items-center" style={{
                height: 30, padding: "0 12px", borderRadius: 9999, gap: 4, cursor: "pointer",
                backgroundColor: "var(--card-bg-secondary)", border: "0.5px solid var(--border)",
              }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--foreground)" }}>{division.label}</span>
                <ChevronDown size={12} style={{ color: "var(--muted-foreground)" }} />
              </button>
              <div className="shrink-0" style={{ width: 1, height: 18, backgroundColor: "var(--border)" }} />
              {state.subjects.map((sid) => {
                const sel = sid === state.activeSubjectId;
                return (
                  <button key={sid} onClick={() => setActiveSubject(sid)} className="shrink-0" style={{
                    height: 30, padding: "0 12px", borderRadius: 9999, cursor: "pointer",
                    fontSize: "var(--text-xs)", fontWeight: 600,
                    color: sel ? "var(--primary-300)" : "var(--muted-foreground)",
                    backgroundColor: sel ? "color-mix(in srgb, var(--primary-500) 14%, transparent)" : "var(--card)",
                    border: sel ? "1px solid var(--primary-500)" : "0.5px solid var(--border)",
                  }}>
                    {getSubject(sid).label}
                  </button>
                );
              })}
              <button aria-label="Manage subjects" className="shrink-0 flex items-center justify-center" onClick={() => navigate("/arena/onboarding")}
                style={{ height: 36, width: 36, borderRadius: 9999, cursor: "pointer", color: "var(--muted-foreground)", backgroundColor: "var(--card)", border: "0.5px solid var(--border)", fontSize: "var(--text-base)", lineHeight: 1 }}>+</button>
            </div>
          </div>
        </motion.div>
      </GlassHeader>

      <div ref={scrollRef} onScroll={onScroll} className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "12px 16px 32px", gap: 16 }}>
        {/* Daily habit row — free Spin + Daily Sprint */}
        <div className="flex" style={{ gap: 12 }}>
          <SpinTile ready={canSpinNow(state)} onClick={() => navigate("/arena/spin")} />
          {sprint && <SprintTile ev={sprint} onClick={() => navigate(`/arena/event?id=${sprint.id}`)} />}
        </div>

        {feed.map(({ e }, i) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.05, ease: [0.32, 0.72, 0, 1] }} className="shrink-0">
            <EventCard ev={e} state={state} onClick={() => navigate(`/arena/event?id=${e.id}`)} />
          </motion.div>
        ))}

        {feed.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center" style={{ padding: "40px 24px", gap: 8 }}>
            <CalendarClock size={32} style={{ color: "var(--muted-foreground)" }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>No contests for {getSubject(state.activeSubjectId).label} yet</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>Switch subject above, or warm up with the Daily Sprint.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Header bits ───────────────────────────────────────────────────────────────
function HeartsPill({ hearts, onClick }: { hearts: number; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.94 }} onClick={onClick} aria-label={`${hearts} hearts`} className="flex items-center shrink-0" style={{
      height: 32, padding: "0 10px", borderRadius: 9999, gap: 5, cursor: "pointer",
      background: "linear-gradient(145deg, color-mix(in srgb, var(--purple-500) 22%, transparent) 0%, color-mix(in srgb, var(--purple-500) 8%, transparent) 100%)",
      border: "0.5px solid color-mix(in srgb, var(--purple-500) 32%, transparent)",
    }}>
      <HeartIcon size={15} />
      <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{hearts.toLocaleString("en-IN")}</span>
    </motion.button>
  );
}

function IconAction({ icon: Icon, label, accent, onClick }: { icon: typeof Gift; label: string; accent: string; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} whileHover={{ y: -1 }} type="button" onClick={onClick} aria-label={label} className="flex items-center justify-center shrink-0" style={{
      width: 32, height: 32, borderRadius: 8, cursor: "pointer",
      background: `linear-gradient(145deg, color-mix(in srgb, ${accent} 22%, transparent) 0%, color-mix(in srgb, ${accent} 7%, transparent) 100%)`,
      border: `0.5px solid color-mix(in srgb, ${accent} 30%, transparent)`,
    }}>
      <Icon size={16} style={{ color: accent }} strokeWidth={2.2} />
    </motion.button>
  );
}

// ─── Daily row tiles ─────────────────────────────────────────────────────────
/** Shared shell for the two daily-habit tiles — bold gradient, corner glow, a
 *  glowing icon badge, hover-lift, and a quiet "go" chevron. */
function DailyTile({ accent, icon: Icon, title, status, statusHot, ready, onClick }: {
  accent: string; icon: typeof Sparkles; title: string; status: string; statusHot?: boolean; ready?: boolean; onClick: () => void;
}) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} whileHover={{ y: -2 }} onClick={onClick} className="flex flex-col text-left" style={{
      flex: 1, minWidth: 0, height: 108, padding: 16, borderRadius: 12, cursor: "pointer", position: "relative", overflow: "hidden", gap: 12,
      backgroundColor: "var(--card)",
      border: `0.5px solid color-mix(in srgb, ${accent} 28%, var(--border))`,
    }}>
      {/* soft accent wash behind the icon — colour identity without the muddy fill */}
      <div aria-hidden style={{ position: "absolute", top: -44, left: -34, width: 124, height: 124, borderRadius: "50%", background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`, opacity: 0.12 }} />
      <span className="flex items-center justify-center" style={{
        width: 40, height: 40, borderRadius: 12, position: "relative",
        background: `color-mix(in srgb, ${accent} 16%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
      }}>
        {ready
          ? <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="flex"><Icon size={20} style={{ color: accent }} /></motion.span>
          : <Icon size={20} style={{ color: accent }} />}
      </span>
      <div className="flex flex-col" style={{ gap: 3, position: "relative" }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.1 }}>{title}</span>
        <span className="inline-flex items-center" style={{ gap: 5, fontSize: "var(--text-2xs)", fontWeight: 700, color: statusHot ? accent : "var(--muted-foreground)" }}>
          {statusHot && <span style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: accent }} />}
          {status}
        </span>
      </div>
    </motion.button>
  );
}

function SpinTile({ ready, onClick }: { ready: boolean; onClick: () => void }) {
  return (
    <DailyTile accent="var(--warning-500)" icon={Sparkles} title="Daily Spin" ready={ready} statusHot={ready}
      status={ready ? "Free spin ready" : "Come back tomorrow"} onClick={onClick} />
  );
}

function SprintTile({ ev, onClick }: { ev: ArenaEvent; onClick: () => void }) {
  return (
    <DailyTile accent={ev.accent} icon={Zap} title="Daily Sprint"
      status="7 questions · ~2 min" onClick={onClick} />
  );
}

// ─── Contest card ──────────────────────────────────────────────────────────────
function formatLabel(ev: ArenaEvent): string {
  if (ev.format === "ladder") return `Ladder · ${ev.maxLevel} levels`;
  if (ev.format === "exam") return `Exam · ${ev.durationMinutes} min`;
  return "Daily";
}

// The prize, surfaced as a reward badge — the thing students actually chase. Hearts
// reward → Heart glyph + purple tint; anything else (cash/voucher) → Trophy + gold.
function RewardChip({ prize }: { prize: string }) {
  const isHearts = /hearts/i.test(prize);
  const tint = isHearts ? "var(--purple-400)" : "var(--warning-500)";
  return (
    <span className="inline-flex items-center" style={{ gap: 6, maxWidth: "100%" }}>
      {isHearts ? <HeartIcon size={13} /> : <Trophy size={13} style={{ color: tint, flexShrink: 0 }} />}
      <span className="truncate" style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--foreground)" }}>{prize}</span>
    </span>
  );
}

// ONE frosted-glass chip language for everything floating on a card hero. The glass
// (semi-transparent + blur) lets the hero wash show through, so chips feel native to
// the card instead of stuck-on stickers. `tint` drives icon/text/border; base is shared.
const PURPLE_TINT = "color-mix(in srgb, var(--mark-review-500) 78%, var(--white))"; // light AntD purple
const OPENS_TINT = "color-mix(in srgb, var(--white) 70%, transparent)";

function HeroChip({ tint, icon: Icon, dot, children }: { tint: string; icon?: LucideIcon; dot?: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center" style={{
      gap: 5, height: 22, padding: "0 8px", borderRadius: 8, whiteSpace: "nowrap",
      backgroundColor: "color-mix(in srgb, var(--black) 50%, transparent)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      border: `0.5px solid color-mix(in srgb, ${tint} 38%, transparent)`,
      fontSize: "var(--text-2xs)", fontWeight: 800, color: tint,
    }}>
      {dot && <motion.span animate={{ opacity: [1, 0.25, 1], scale: [1, 0.7, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: tint }} />}
      {Icon && <Icon size={11} style={{ color: tint }} />}
      {children}
    </span>
  );
}

const GateChip = ({ pass }: { pass: boolean }) => pass
  ? <HeroChip tint={PURPLE_TINT} icon={Crown}>GYD Max</HeroChip>
  : <HeroChip tint="var(--success-500)">Free</HeroChip>;

const LiveTag = ({ to }: { to: number }) => (
  <HeroChip tint="var(--error-500)" dot>
    <span style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>Live</span>
    <CountdownInline to={to} compact size="var(--text-2xs)" color="var(--error-500)" />
  </HeroChip>
);

const OpensTag = ({ to }: { to: number }) => (
  <HeroChip tint={OPENS_TINT} icon={Lock}>
    <span style={{ textTransform: "uppercase", letterSpacing: 0.3 }}>Opens</span>
    <CountdownInline to={to} compact size="var(--text-2xs)" color="var(--white)" />
  </HeroChip>
);

function EventCard({ ev, state, onClick }: { ev: ArenaEvent; state: ReturnType<typeof useArenaState>["state"]; onClick: () => void }) {
  const { phase } = eventStatus(ev);
  const locked = phase === "locked";
  const pass = ev.gate === "gyd-pass";
  const prog = eventProgress(state, ev.id);
  const meta = ev.format === "exam" ? `${ev.questionCount} questions · ${ev.durationMinutes} min` : ev.recurrence;

  // Coming-soon teaser — a quiet, dimmed, non-interactive card that sits at the tail
  // of the feed. One neutral "Coming soon" tag; no countdown, no duplicate chips.
  if (ev.comingSoon) {
    return (
      <ArenaCoverCard
        accent={ev.accent}
        heroIcon={<OlympiadIcon iconKey={ev.iconKey} size={26} color={ev.accent} />}
        heroLabel={formatLabel(ev)}
        motif={<HeroMotif format={ev.format} accent={ev.accent} />}
        pill={<HeroChip tint="var(--muted-foreground)">Coming soon</HeroChip>}
        title={ev.title}
        meta={ev.teaser ?? ev.theme}
        footerLeft={<span className="inline-flex items-center" style={{ gap: 5, fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>{ev.recurrence}</span>}
        disabled
        onClick={onClick}
      />
    );
  }

  // Your progress leads if you've played; otherwise the PRIZE leads — that's the hook.
  const footerLeft = ev.format === "ladder" && prog && prog.highestCleared > 0
    ? <span className="inline-flex items-center" style={{ gap: 8, fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--muted-foreground)" }}>
        <span style={{ color: "var(--foreground)" }}>Level {currentLevel(prog)}</span>
        <span>Rank #{getEventRank(ev, prog.score)}</span>
      </span>
    : <RewardChip prize={ev.prizeLabel} />;

  return (
    <ArenaCoverCard
      accent={ev.accent}
      heroIcon={<OlympiadIcon iconKey={ev.iconKey} size={26} color={ev.accent} />}
      heroLabel={formatLabel(ev)}
      motif={<HeroMotif format={ev.format} accent={ev.accent} />}
      pill={<GateChip pass={pass} />}
      statusRight={locked ? <OpensTag to={ev.startsAt} /> : <LiveTag to={ev.endsAt} />}
      liveAccent={!locked}
      title={ev.title}
      meta={meta}
      footerLeft={footerLeft}
      footerRight={locked
        ? <span className="inline-flex items-center" style={{ gap: 4, fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--muted-foreground)" }}><Lock size={12} /> Locked</span>
        : pass && !state.isPaid
          ? <span className="inline-flex items-center" style={{ gap: 4, fontSize: "var(--text-2xs)", fontWeight: 700, color: "color-mix(in srgb, var(--mark-review-500) 80%, var(--white))" }}><Ticket size={12} /> Pass</span>
          : undefined}
      onClick={onClick}
    />
  );
}
