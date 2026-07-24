/**
 * Arena · My Events & Results — your event history in one place.
 *   • Results — events you've finished (your rank / score), tap to the full result.
 * This is the "where did I place" surface the hub deliberately keeps OFF the home
 * (no all-time board) — your past lives here, on demand. (Registration flow is
 * retired, so there's no "upcoming / registered" group — only finished events.)
 *
 * Route: /arena/my-events
 */

import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Flame, Trophy } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { useArenaState, getActiveEvent } from "../shared/arena";
import { listOlympiads, olympiadStatus, useOlympiadState, type Olympiad, type OlympiadAttempt, type OlympiadIconKey } from "../shared/olympiads";
import { OlympiadHeader, OlympiadIcon } from "./olympiad-ui";
import { arenaBack, ArenaCoverCard } from "./arena-ui";

// Finished arena events with my placement. Tapping opens the (recurring) event.
// TODO(api): GET /api/arena/me/results — replace with server-served event history.
const DUMMY_PAST_RESULTS: {
  eventId: string; accent: string; iconKey: OlympiadIconKey; heroLabel: string;
  statLabel: string; statValue: string; title: string; meta: string;
}[] = [
  { eventId: "speed-climb", accent: "var(--teal-500)", iconKey: "science", heroLabel: "Speed Climb", statLabel: "Rank", statValue: "#14", title: "Speed Climb · Physics", meta: "Cleared 28/30 · 2,180 pts" },
  { eventId: "saturday-showdown", accent: "var(--purple-500)", iconKey: "math", heroLabel: "Saturday Showdown", statLabel: "Rank", statValue: "#3", title: "Saturday Showdown", meta: "Top 5 · ₹500 voucher won" },
];

export function Component() {
  const navigate = useNavigate();
  const { state } = useArenaState();
  const { getAttempt } = useOlympiadState();

  const ev = getActiveEvent();
  const leagueEntry = state.eventEntry?.eventId === ev?.id ? state.eventEntry : undefined;

  const all = listOlympiads();
  // Finished championships you actually attempted (have a result).
  const completedChamps = all
    .map((o) => ({ o, attempt: getAttempt(o.id) }))
    .filter(({ o, attempt }) => attempt && olympiadStatus(o).isEnded)
    .sort((a, b) => (b.attempt!.submittedAt) - (a.attempt!.submittedAt));

  const hasResults = !!leagueEntry || completedChamps.length > 0 || DUMMY_PAST_RESULTS.length > 0;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="My events & results" onBack={() => arenaBack(navigate)} />
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 32px", gap: 24 }}>
        {/* ── Results ─────────────────────────────────────────────────────── */}
        {hasResults && (
          <div className="flex flex-col" style={{ gap: 10 }}>
            {leagueEntry && (
              <LeagueResultRow
                title={ev?.title ?? "Weekend League"}
                rank={leagueEntry.rank} score={leagueEntry.score} accent={ev?.accent}
                onClick={() => navigate("/arena/event")}
              />
            )}
            {completedChamps.map(({ o, attempt }) => (
              <ChampResultRow key={o.id} o={o} attempt={attempt!} onClick={() => navigate(`/olympiad/${o.id}/result`)} />
            ))}
            {DUMMY_PAST_RESULTS.map((r) => (
              <EventResultRow key={r.eventId} r={r} onClick={() => navigate(`/arena/event?id=${r.eventId}`)} />
            ))}
          </div>
        )}

        {/* ── Empty ───────────────────────────────────────────────────────── */}
        {!hasResults && (
          <div className="flex flex-col items-center text-center" style={{ gap: 12, padding: "48px 24px" }}>
            <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
              <Trophy size={26} style={{ color: "var(--muted-foreground)" }} />
            </div>
            <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>No events yet</span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", maxWidth: 260, lineHeight: 1.5 }}>Join a league or championship — your ranks and certificates will show up here.</span>
            <button onClick={() => navigate("/arena")} className="flex items-center justify-center"
              style={{ height: 44, padding: "0 20px", borderRadius: 12, marginTop: 4, border: "none", cursor: "pointer", backgroundColor: "var(--primary-500)", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
              Browse events
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Frosted hero pill (top-right) — ONE shape for every result/status, mirroring the
// home cards' HeroTimeChip so the whole family reads as one. `label · value` for a
// result (AIR 6 / Rank #3); a green-dot "Registered" for an upcoming event. Putting
// the result here (not a footer) keeps it prominent and kills the empty bottom row.
function HeroPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center" style={{
      gap: 5, height: 22, padding: "0 9px", borderRadius: 9999,
      backgroundColor: "color-mix(in srgb, var(--black) 55%, transparent)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      fontSize: "var(--text-2xs)", fontWeight: 700,
    }}>{children}</span>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <HeroPill>
      <span style={{ color: "color-mix(in srgb, var(--white) 60%, transparent)", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
      <span style={{ color: "var(--white)", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </HeroPill>
  );
}

// Same cover-card language as the Arena home (shared ArenaCoverCard) — so an event
// looks like itself everywhere. Only the data differs: results carry their AIR/rank
// in the footer; registered events carry the schedule + a "Registered" status.
function LeagueResultRow({ title, rank, score, accent, onClick }: { title: string; rank: number; score: number; accent?: string; onClick: () => void }) {
  const c = accent ?? "var(--purple-500)";
  return (
    <ArenaCoverCard
      accent={c}
      heroIcon={<Flame size={26} style={{ color: c }} />}
      heroLabel="Weekend League"
      statusRight={<StatPill label="Rank" value={`#${rank}`} />}
      title={title}
      meta={`League · ${score.toLocaleString("en-IN")} pts`}
      onClick={onClick}
    />
  );
}

function EventResultRow({ r, onClick }: { r: (typeof DUMMY_PAST_RESULTS)[number]; onClick: () => void }) {
  return (
    <ArenaCoverCard
      accent={r.accent}
      heroIcon={<OlympiadIcon iconKey={r.iconKey} size={26} color={r.accent} />}
      heroLabel={r.heroLabel}
      statusRight={<StatPill label={r.statLabel} value={r.statValue} />}
      title={r.title}
      meta={r.meta}
      onClick={onClick}
    />
  );
}

function ChampResultRow({ o, attempt, onClick }: { o: Olympiad; attempt: OlympiadAttempt; onClick: () => void }) {
  return (
    <ArenaCoverCard
      accent={o.accent}
      heroIcon={<OlympiadIcon iconKey={o.iconKey} size={26} color={o.accent} />}
      heroLabel={o.examLabel}
      statusRight={<StatPill label="AIR" value={attempt.rank.toLocaleString("en-IN")} />}
      title={o.title}
      meta={`${attempt.score}/${o.maxScore} · ${attempt.percentile} %ile`}
      onClick={onClick}
    />
  );
}

