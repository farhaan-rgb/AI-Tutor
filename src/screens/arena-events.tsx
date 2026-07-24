/**
 * Arena · All Events — the single source of truth for "what's happening in Arena."
 * Two clearly different kinds, grouped so the difference is obvious:
 *   • LEAGUES — recurring, quick, jump-in-anytime (Daily Sprint, Weekend League).
 *     Flat action cards: the verb is "Play / Join", no registration.
 *   • CHAMPIONSHIPS — scheduled national events with prizes & certificates. Rich
 *     thumbnail cards (the marketplace-style hero): the verb is "Register".
 * A segmented filter narrows to one kind. Past events live in My Events.
 *
 * Route: /arena/events
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, Gift, Zap, Play, CalendarClock } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { useArenaState, getActiveEvent, type WeekendEvent } from "../shared/arena";
import { listOlympiads, olympiadStatus, formatCount, type Olympiad } from "../shared/olympiads";
import { CountdownInline, OlympiadHeader, OlympiadIcon, StatusPill, OlympiadTag } from "./olympiad-ui";
import { arenaBack } from "./arena-ui";

type Filter = "all" | "leagues" | "champs";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "leagues", label: "Play now" },
  { id: "champs", label: "Championships" },
];

export function Component() {
  const navigate = useNavigate();
  const { state } = useArenaState();
  const [filter, setFilter] = useState<Filter>("all");

  const ev = getActiveEvent();
  const eventEntry = state.eventEntry?.eventId === ev?.id ? state.eventEntry : undefined;

  // Championships still ongoing or upcoming (past ones live in My Events).
  const champs = listOlympiads()
    .map((o) => ({ o, s: olympiadStatus(o) }))
    .filter(({ s }) => !s.isEnded)
    .sort((a, b) => (a.s.isLive === b.s.isLive ? a.o.startsAt - b.o.startsAt : a.s.isLive ? -1 : 1))
    .map(({ o }) => o);

  const showLeagues = filter !== "champs";
  const showChamps = filter !== "leagues";

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="All events" onBack={() => arenaBack(navigate)} />
        <div className="flex items-center" style={{ gap: 8, padding: "0 16px 12px" }}>
          {FILTERS.map((f) => {
            const sel = filter === f.id;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)} className="shrink-0"
                style={{
                  height: 32, padding: "0 14px", borderRadius: 9999, cursor: "pointer",
                  fontSize: "var(--text-xs)", fontWeight: 600,
                  color: sel ? "var(--primary-300)" : "var(--muted-foreground)",
                  backgroundColor: sel ? "color-mix(in srgb, var(--primary-500) 14%, transparent)" : "var(--card)",
                  border: sel ? "1px solid var(--primary-500)" : "0.5px solid var(--border)",
                }}>
                {f.label}
              </button>
            );
          })}
        </div>
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 32px", gap: 24 }}>
        {/* ── Leagues — recurring, instant ────────────────────────────────── */}
        {showLeagues && (
          <div className="flex flex-col" style={{ gap: 10 }}>
            <SectionHead title="Play now" sub="Quick & recurring — jump in anytime, climb your level" />
            <DailySprintRow
              energy={state.energy}
              onClick={() => navigate(state.energy > 0 ? "/arena/play" : "/arena")}
            />
            {ev && <LeagueRow ev={ev} rank={eventEntry?.rank} onClick={() => navigate("/arena/event")} />}
          </div>
        )}

        {/* ── Championships — scheduled, national, register ───────────────── */}
        {showChamps && (
          <div className="flex flex-col" style={{ gap: 12 }}>
            <SectionHead title="Championships" sub="Big national events — register, compete & earn certificates" />
            {champs.length > 0
              ? champs.map((o) => <ChampThumb key={o.id} o={o} onClick={() => navigate(`/olympiad/${o.id}`, { state: { from: "/arena/events" } })} />)
              : <EmptyLine text="No championships open right now — check back soon." />}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col" style={{ gap: 2, padding: "0 4px" }}>
      <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)" }}>{title}</span>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{sub}</span>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center" style={{ padding: 24, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center" }}>{text}</span>
    </div>
  );
}

// Daily Sprint as an always-on league entry — the everyday, zero-friction one.
function DailySprintRow({ energy, onClick }: { energy: number; onClick: () => void }) {
  const out = energy <= 0;
  return (
    <motion.button whileTap={{ scale: 0.99 }} onClick={onClick} className="flex items-center text-left w-full"
      style={{ gap: 12, padding: 14, borderRadius: 12, cursor: "pointer", flexShrink: 0, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "color-mix(in srgb, var(--warning-500) 16%, transparent)" }}>
        <Zap size={20} style={{ color: "var(--warning-500)" }} />
      </div>
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <span className="flex items-center" style={{ gap: 8 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Daily Sprint</span>
          <OlympiadTag label="Always on" variant="success" />
        </span>
        <span className="truncate" style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
          {out ? "Refills tomorrow" : `${energy} left today · clear questions to climb`}
        </span>
      </div>
      <span className="flex items-center shrink-0" style={{ gap: 4, fontSize: "var(--text-xs)", fontWeight: 700, color: out ? "var(--muted-foreground)" : "var(--primary-300)" }}>
        {!out && <Play size={13} style={{ color: "var(--primary-300)" }} fill="var(--primary-300)" />}{out ? "Tomorrow" : "Play"}
      </span>
    </motion.button>
  );
}

// Weekend / recurring league — flat tinted action card (not a thumbnail).
function LeagueRow({ ev, rank, onClick }: { ev: WeekendEvent; rank?: number; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.99 }} type="button" onClick={onClick}
      className="text-left w-full relative" style={{
        display: "block", flexShrink: 0, padding: 16, borderRadius: 12, cursor: "pointer", overflow: "hidden",
        background: `linear-gradient(155deg, color-mix(in srgb, ${ev.accent} 20%, var(--card)) 0%, var(--card) 75%)`,
        border: `1px solid color-mix(in srgb, ${ev.accent} 38%, transparent)`,
      }}>
      <div aria-hidden style={{ position: "absolute", top: -32, right: -32, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${ev.accent} 0%, transparent 70%)`, opacity: 0.28 }} />
      <div className="flex flex-col w-full" style={{ gap: 8, position: "relative", zIndex: 1 }}>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-2xs)", fontWeight: 700, color: ev.accent, textTransform: "uppercase", letterSpacing: 0.4 }}>
            <Zap size={12} style={{ color: ev.accent }} /> Weekend League · 2-day
          </span>
          <span className="flex items-center" style={{ gap: 4, fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
            Ends in <CountdownInline to={ev.endsAt} compact color="var(--muted-foreground)" />
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)" }}>{ev.title}</span>
          <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
        </div>
        <span className="flex items-center" style={{ gap: 6, fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
          <Gift size={13} style={{ color: "var(--warning-500)" }} /> {ev.prizeLabel} · free to enter
          {rank != null && <span style={{ color: ev.accent, fontWeight: 700 }}> · ranked #{rank}</span>}
        </span>
      </div>
    </motion.button>
  );
}

// Championship — marketplace-style thumbnail hero + content panel (the design
// language carried over from the Olympiad catalogue, which students respond to).
function ChampThumb({ o, onClick }: { o: Olympiad; onClick: () => void }) {
  const s = olympiadStatus(o);
  const accent = o.accent;
  const free = o.entryType === "free";
  const to = s.isLive ? s.windowEndsAt : s.phase === "registration-closing" ? o.registrationClosesAt : o.startsAt;
  const toLabel = s.isLive ? "Ends in" : s.phase === "registration-closing" ? "Closes in" : "Starts in";
  const toColor = s.isLive ? "var(--error-500)" : s.phase === "registration-closing" ? "var(--warning-500)" : "var(--foreground)";
  return (
    <motion.button type="button" whileTap={{ scale: 0.99 }} onClick={onClick} aria-label={`${o.title} — ${o.subject}`}
      className="flex flex-col w-full text-left overflow-hidden"
      style={{
        borderRadius: 12, cursor: "pointer", backgroundColor: "var(--card)",
        border: s.isLive ? "0.5px solid color-mix(in srgb, var(--error-500) 32%, var(--border))" : "0.5px solid var(--border)",
      }}>
      {/* Hero */}
      <div className="relative w-full" style={{ aspectRatio: "16 / 7", background: `color-mix(in srgb, ${accent} 14%, var(--card))` }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, transparent) 0%, transparent 70%)` }} />
        <div aria-hidden style={{ position: "absolute", bottom: -32, right: -32, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`, opacity: 0.3 }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 55%, color-mix(in srgb, var(--black) 28%, transparent) 100%)" }} />
        <div className="absolute flex flex-col items-center" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", gap: 4 }}>
          <OlympiadIcon iconKey={o.iconKey} size={44} color={accent} />
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: accent, opacity: 0.9 }}>{o.examLabel}</span>
        </div>
        <span className="absolute inline-flex items-center" style={{
          top: 8, left: 8, height: 20, padding: "0 8px", borderRadius: 8,
          fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
          color: free ? "var(--success-500)" : "color-mix(in srgb, var(--mark-review-500) 80%, var(--white))",
          backgroundColor: free ? "var(--success-d2)" : "color-mix(in srgb, var(--mark-review-500) 22%, var(--black))",
          border: `1px solid ${free ? "var(--success-d4)" : "color-mix(in srgb, var(--mark-review-500) 55%, transparent)"}`,
        }}>{free ? "Free" : "GYD Max"}</span>
        {(s.isLive || s.phase === "registration-closing") && (
          <span className="absolute" style={{ top: 8, right: 8 }}>
            {s.isLive ? <StatusPill phase="live" /> : <OlympiadTag label="Closing soon" variant="warning" />}
          </span>
        )}
      </div>
      {/* Content */}
      <div className="flex flex-col w-full" style={{ padding: 16, gap: 8 }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{o.title}</span>
        <span className="truncate" style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{o.subject} · {formatCount(o.participantCount)} joined</span>
        <div className="flex items-center justify-between w-full" style={{ gap: 8, marginTop: 2 }}>
          <span className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-xs)", color: "var(--foreground)", fontWeight: 500 }}>
            <CalendarClock size={13} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            {fmtSchedule(o.startsAt)}
          </span>
          <span className="inline-flex items-center shrink-0" style={{ gap: 6, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.3, fontWeight: 600 }}>{toLabel}</span>
            <CountdownInline to={to} color={toColor} compact />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function fmtSchedule(startsAt: number): string {
  const d = new Date(startsAt);
  const date = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  return `${date} · ${time}`;
}
