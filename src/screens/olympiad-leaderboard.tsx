/**
 * Olympiad Leaderboard — published AFTER the window closes (never live during
 * the exam, per the credibility bar from research). Multi-scope (All-India /
 * City / School), podium for the top 3, ranked rows, a sticky "your rank" bar
 * when the user is off-screen, the published tie-break rule, and the cohort
 * size. Before results time it shows a locked state with a countdown.
 *
 * Route: /olympiad/:olympiadId/leaderboard
 */

import { useNavigate, useParams } from "react-router";
import { Lock } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import {
  getOlympiadById, olympiadStatus, useOlympiadState, getLeaderboard, formatCount,
} from "../shared/olympiads";
import {
  Podium, LeaderboardRow, CountdownBlocks, OlympiadHeader, olympiadBack,
} from "./olympiad-ui";

export function Component() {
  const navigate = useNavigate();
  const { olympiadId } = useParams<{ olympiadId: string }>();
  const o = olympiadId ? getOlympiadById(olympiadId) : undefined;
  const state = useOlympiadState();

  if (!o) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)" }}>
        <span style={{ color: "var(--foreground)" }}>Olympiad not found</span>
      </div>
    );
  }

  const s = olympiadStatus(o);
  const attempt = state.getAttempt(o.id);
  const me = attempt ? { rank: attempt.rank, score: attempt.score } : null;

  // Locked until results are out.
  if (!s.resultsOut) {
    return (
      <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
        <GlassHeader><StatusBar /><OlympiadHeader title="Rankings" onBack={() => olympiadBack(navigate, `/olympiad/${o.id}`)} /></GlassHeader>
        <div className="flex flex-col items-center justify-center text-center" style={{ flex: 1, gap: 16, padding: 24 }}>
          <Lock size={36} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>Rankings locked</span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", maxWidth: 300 }}>
            To keep the rankings fair, the leaderboard publishes only after the exam window closes.
          </span>
          <div className="flex flex-col items-center" style={{ gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4 }}>Results in</span>
            <CountdownBlocks to={o.resultsAt} accent={o.accent} />
          </div>
        </div>
      </div>
    );
  }

  // Lean board: podium (top 3) + a short ranked list. If you're outside it,
  // a sticky bar carries your rank — no need to render hundreds of strangers.
  const TOP_N = 12;
  const entries = getLeaderboard(o, me, "all-india", TOP_N);
  const top3 = entries.filter((e) => e.rank <= 3).sort((a, b) => a.rank - b.rank);
  const rest = entries.filter((e) => e.rank > 3 && e.rank <= TOP_N).sort((a, b) => a.rank - b.rank);
  const myOffBoard = me && me.rank > TOP_N ? entries.find((e) => e.isMe) : null;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="Rankings" onBack={() => olympiadBack(navigate, `/olympiad/${o.id}`)} />
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: `16px 16px ${myOffBoard ? 96 : 32}px`, gap: 16 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>{o.title}</span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{formatCount(o.participantCount)} ranked</span>
        </div>

        {/* Podium */}
        {top3.length === 3 && (
          <div style={{ padding: "8px 0 0" }}>
            <Podium top3={top3} maxScore={o.maxScore} />
          </div>
        )}

        {/* Ranked rows */}
        <div style={{ borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)", overflow: "hidden" }}>
          {rest.map((e, i) => (
            <LeaderboardRow key={e.rank} entry={e} maxScore={o.maxScore} isLast={i === rest.length - 1} />
          ))}
        </div>
      </div>

      {/* Sticky my-rank when off the visible board */}
      {myOffBoard && (
        <div className="fixed bottom-0 left-0 right-0" style={{
          backdropFilter: "blur(16px)",
          backgroundColor: "color-mix(in srgb, var(--background) 85%, transparent)",
          borderTop: "0.5px solid var(--border)",
          padding: "8px 16px calc(8px + env(safe-area-inset-bottom))",
        }}>
          <div className="w-full max-w-2xl mx-auto" style={{ borderRadius: 12, overflow: "hidden", backgroundColor: "color-mix(in srgb, var(--primary-500) 12%, transparent)" }}>
            <LeaderboardRow entry={myOffBoard} maxScore={o.maxScore} isLast />
          </div>
        </div>
      )}
    </div>
  );
}
