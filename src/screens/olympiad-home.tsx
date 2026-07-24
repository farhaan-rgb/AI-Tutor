/**
 * Olympiad Home — discovery surface. Groups the catalogue by phase (Live now ›
 * Closing soon › Open › Upcoming › Results out) and headlines the live/flagship
 * event. Each card deep-links to the detail page. A light "Series" strip nudges
 * repeat participation (a should-have from the research synthesis).
 *
 * Route: /olympiad
 */

import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Award, CheckCircle2, CalendarClock, Trophy } from "lucide-react";
import { GlassHeader, StatusBar, StaggerList, StaggerItem } from "../shared/premium-ui";
import {
  listOlympiads, olympiadStatus, useOlympiadState, formatCount, isRankCertificate,
  type Olympiad, type OlympiadPhase, type OlympiadAttempt,
} from "../shared/olympiads";
import {
  OlympiadIcon, StatusPill, OlympiadTag, CountdownInline,
} from "./olympiad-ui";

const SECTION_ORDER: { phases: OlympiadPhase[]; title: string }[] = [
  { phases: ["live"], title: "Live now" },
  // Closing-soon is just an urgency state of open registration — one section,
  // the CLOSING SOON pill + countdown on the card carry the urgency.
  { phases: ["registration-closing", "registration-open"], title: "Open for registration" },
  { phases: ["upcoming"], title: "Upcoming" },
  { phases: ["grading", "results-out"], title: "Results & past" },
];

export function Component() {
  const navigate = useNavigate();
  const state = useOlympiadState();
  const all = listOlympiads();
  const now = Date.now();

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, padding: "0 16px 0 8px", gap: 8 }}>
          <button onClick={() => navigate("/classes-v1")} aria-label="Back" className="flex items-center justify-center"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <span style={{ flex: 1, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>Olympiads</span>
          {/* Rewards — a labelled, gold-tinted pill (AntD tag / reward-entry
              language) so it reads as a real affordance, not a floating glyph. */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/olympiad/rewards")}
            aria-label="Your rewards"
            className="flex items-center shrink-0"
            style={{
              gap: 6, height: 32, padding: "0 12px", borderRadius: 8, cursor: "pointer",
              backgroundColor: "transparent",
              border: "1px solid var(--white-alpha-25)",
              fontFamily: "var(--font-family-inter)",
            }}
          >
            <Award size={15} style={{ color: "var(--warning-500)" }} />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--foreground)" }}>Rewards</span>
          </motion.button>
        </div>
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 32px", gap: 24 }}>
        {SECTION_ORDER.map(({ phases, title }) => {
          const items = all.filter((o) => phases.includes(olympiadStatus(o, now).phase));
          if (items.length === 0) return null;
          return (
            <section key={title} className="flex flex-col" style={{ gap: 12 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)" }}>{title}</span>
              <StaggerList className="flex flex-col" style={{ gap: 12 }}>
                {items.map((o) => {
                  const attempt = state.getAttempt(o.id);
                  // Past events you sat → jump straight to your result (the post-
                  // event hub). Everything else → detail (register / enter / about).
                  const dest = attempt && olympiadStatus(o, now).resultsOut
                    ? `/olympiad/${o.id}/result`
                    : `/olympiad/${o.id}`;
                  return (
                    <StaggerItem key={o.id}>
                      <OlympiadCard
                        o={o}
                        registered={state.isRegistered(o.id)}
                        attempt={attempt}
                        onClick={() => navigate(dest)}
                      />
                    </StaggerItem>
                  );
                })}
              </StaggerList>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Marketplace/discover-style thumbnail card: a brand-tinted hero (subject icon
// + exam label, with Free/₹ and status overlays) on top, content panel below.
function OlympiadCard({ o, registered, attempt, onClick }: {
  o: Olympiad; registered: boolean; attempt?: OlympiadAttempt; onClick: () => void;
}) {
  const s = olympiadStatus(o);
  const accent = o.accent;
  const free = o.entryType === "free";
  const liveAccent = s.isLive;
  // Top-right status chip is shown ONLY when it adds info beyond the section
  // header: the live marquee, and a register-urgency nudge for non-registrants.
  const showStatus = s.isLive || (s.phase === "registration-closing" && !registered);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      aria-label={`${o.title} — ${o.subject}`}
      className="flex flex-col w-full text-left overflow-hidden"
      style={{
        borderRadius: 16, cursor: "pointer", backgroundColor: "var(--card)",
        border: liveAccent
          ? "0.5px solid color-mix(in srgb, var(--error-500) 32%, var(--border))"
          : "0.5px solid var(--border)",
        fontFamily: "var(--font-family-inter)",
      }}
    >
      {/* ── Hero thumbnail ──────────────────────────────────────────────── */}
      <div className="relative w-full" style={{
        aspectRatio: "16 / 7",
        background: `color-mix(in srgb, ${accent} 14%, var(--card))`,
      }}>
        {/* brand wash + corner glow */}
        <div aria-hidden style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, transparent) 0%, transparent 70%)` }} />
        <div aria-hidden style={{ position: "absolute", bottom: -32, right: -32, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`, opacity: 0.3 }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 55%, color-mix(in srgb, var(--black) 28%, transparent) 100%)" }} />

        {/* centered identity */}
        <div className="absolute flex flex-col items-center" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", gap: 4 }}>
          <OlympiadIcon iconKey={o.iconKey} size={44} color={accent} />
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: accent, opacity: 0.9 }}>
            {o.examLabel}
          </span>
        </div>

        {/* top-left — entry type */}
        <span className="absolute inline-flex items-center" style={{
          top: 8, left: 8, height: 20, padding: "0 8px", borderRadius: 8,
          fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--white)",
          backgroundColor: free ? "var(--success-600)" : "color-mix(in srgb, var(--purple-500) 88%, var(--black))",
        }}>
          {free ? "Free" : "GYD Max"}
        </span>

        {/* top-right — status (only when it adds info: live / closing-urgency) */}
        {showStatus && (
          <span className="absolute" style={{ top: 8, right: 8 }}>
            {s.isLive
              ? <StatusPill phase="live" />
              : <OlympiadTag label="Closing soon" variant="warning" />}
          </span>
        )}
      </div>

      {/* ── Content panel ───────────────────────────────────────────────── */}
      <div className="flex flex-col w-full" style={{ padding: 16, gap: 8 }}>
        <span style={{
          fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {o.title}
        </span>
        <span className="truncate" style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
          {o.subject} · {formatCount(o.participantCount)} joined
        </span>
        {/* Concrete exam schedule — the absolute "when" (countdown below gives "how soon") */}
        <span className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-xs)", color: "var(--foreground)", fontWeight: 500 }}>
          <CalendarClock size={13} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          {fmtExamSchedule(o.startsAt)}
        </span>
        {/* Left chip in a flex-1 wrapper so the time signal is ALWAYS pinned
            right — even when there's no chip (empty span) — for consistent
            "STARTS IN …" placement across every card. */}
        <div className="flex items-center w-full" style={{ gap: 8, marginTop: 2 }}>
          <div className="flex items-center" style={{ flex: 1, minWidth: 0 }}>
            <OutcomeChip o={o} registered={registered} attempt={attempt} />
          </div>
          <OutcomeTime o={o} registered={registered} attempt={attempt} />
        </div>
      </div>
    </motion.button>
  );
}

// Absolute exam schedule for the card — e.g. "Sat, 9 Jun · 3:14 PM".
function fmtExamSchedule(startsAt: number): string {
  const d = new Date(startsAt);
  const date = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  return `${date} · ${time}`;
}

// Exactly ONE time signal per card, chosen by phase × registration so two
// countdowns never collide. Label muted, value coloured only when urgent.
function TimeSignal({ o, registered }: { o: Olympiad; registered: boolean }) {
  const s = olympiadStatus(o);
  let label: string | null = null;
  let to: number | null = null;
  let color = "var(--foreground)";

  if (s.isLive) { label = "Ends in"; to = s.windowEndsAt; color = "var(--error-500)"; }
  else if (s.isEnded) { /* static text below */ }
  else if (!registered && s.phase === "registration-closing") { label = "Closes in"; to = o.registrationClosesAt; color = "var(--warning-500)"; }
  else { label = "Starts in"; to = o.startsAt; color = "var(--foreground)"; }

  return (
    <span className="inline-flex items-center" style={{ gap: 6, whiteSpace: "nowrap", flexShrink: 0 }}>
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.3, fontWeight: 600 }}>{label}</span>
      {to != null && <CountdownInline to={to} color={color} compact />}
    </span>
  );
}

// Bottom-left chip — outcome-aware. Past events show the YOUR-OUTCOME (rank /
// missed / didn't-join); upcoming/live show registration state. No generic
// "Registered" on a finished event (where it tells the user nothing useful).
function OutcomeChip({ o, registered, attempt }: { o: Olympiad; registered: boolean; attempt?: OlympiadAttempt }) {
  const s = olympiadStatus(o);
  if (s.isEnded) {
    if (attempt) {
      const merit = isRankCertificate(o, attempt.rank);
      return <OlympiadTag label={`AIR ${attempt.rank.toLocaleString("en-IN")}`} variant={merit ? "warning" : "neutral"} icon={merit ? Trophy : undefined} />;
    }
    if (registered) return <OlympiadTag label="Missed" variant="neutral" />;
    return <OlympiadTag label="Didn't join" variant="neutral" />;
  }
  return registered
    ? <OlympiadTag label="Registered" variant="success" icon={CheckCircle2} />
    : <span />;
}

// Bottom-right — for past events, the result detail (percentile) or status;
// otherwise the live countdown.
function OutcomeTime({ o, registered, attempt }: { o: Olympiad; registered: boolean; attempt?: OlympiadAttempt }) {
  const s = olympiadStatus(o);
  if (s.isEnded) {
    if (attempt && s.resultsOut) {
      return <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>{attempt.percentile} %ile</span>;
    }
    return <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>{s.resultsOut ? "Results out" : "Grading"}</span>;
  }
  return <TimeSignal o={o} registered={registered} />;
}
