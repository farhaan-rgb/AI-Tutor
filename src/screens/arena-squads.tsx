/**
 * Arena · Squads & Collective boards (E5-3 / E5-4) — the VIRALITY surface (PRD §11,
 * Priority #1). Every screen here exists to make one thing obvious: invite/recruit,
 * and *why now*. So the hero leads with your collective rank + the concrete gap to
 * the group above you ("2,094 XP from #3"), and the invite/recruit action is the
 * primary CTA — not a buried link.
 *   • My Squad — you + squadmates, combined score, squad-vs-squad board, invite.
 *   • School vs School — your school's national standing, recruit classmates.
 *
 * Route: /arena/squads
 */

import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { UserPlus, Crown, GraduationCap, Users, ArrowUp, Share2 } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import {
  useArenaState, getMySquad, squadCombined, getSquadBoard, getSchoolBoard,
  MY_SCHOOL_NAME, type CollectiveRow,
} from "../shared/arena";
import { OlympiadHeader, Avatar, OlympiadTag } from "./olympiad-ui";
import { arenaBack } from "./arena-ui";

type Tab = "squad" | "school";

export function Component() {
  const navigate = useNavigate();
  const { state } = useArenaState();
  const [tab, setTab] = useState<Tab>("squad");

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="Squads & Schools" onBack={() => arenaBack(navigate)} />
        <div className="flex items-center" style={{ gap: 8, padding: "0 16px 12px" }}>
          {([["squad", "My Squad"], ["school", "School vs School"]] as [Tab, string][]).map(([id, label]) => {
            const sel = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} className="shrink-0"
                style={{
                  height: 32, padding: "0 14px", borderRadius: 9999, cursor: "pointer",
                  fontSize: "var(--text-xs)", fontWeight: 600,
                  color: sel ? "var(--primary-300)" : "var(--muted-foreground)",
                  backgroundColor: sel ? "color-mix(in srgb, var(--primary-500) 14%, transparent)" : "var(--card)",
                  border: sel ? "1px solid var(--primary-500)" : "0.5px solid var(--border)",
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 32px", gap: 16 }}>
        {tab === "squad" ? <SquadView state={state} /> : <SchoolView state={state} />}
      </div>
    </div>
  );
}

// Rank + the concrete gap to the group directly above — the "why recruit now" hook.
function rankInfo(rows: CollectiveRow[]) {
  const me = rows.find((r) => r.isMe);
  if (!me) return { rank: rows.length, total: rows.length, gap: 0, leader: false };
  const above = rows.find((r) => r.rank === me.rank - 1);
  return { rank: me.rank, total: rows.length, gap: above ? above.score - me.score : 0, leader: me.rank === 1 };
}

function RankPill({ rank, total }: { rank: number; total: number }) {
  const top = rank <= 3;
  return (
    <span className="inline-flex items-baseline" style={{
      gap: 3, height: 28, padding: "0 12px", borderRadius: 9999,
      backgroundColor: top ? "color-mix(in srgb, var(--warning-500) 18%, transparent)" : "var(--card-bg-secondary)",
      border: top ? "0.5px solid color-mix(in srgb, var(--warning-500) 40%, transparent)" : "0.5px solid var(--border)",
    }}>
      <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: top ? "var(--warning-500)" : "var(--foreground)", fontVariantNumeric: "tabular-nums", lineHeight: "28px" }}>#{rank}</span>
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>of {total}</span>
    </span>
  );
}

// The recruit hook: "X behind #N — invite to close the gap", or a lead banner at #1.
function GapNudge({ gap, unit, leader, action }: { gap: number; unit: string; leader: boolean; action: string }) {
  if (leader) {
    return (
      <div className="flex items-center" style={{ gap: 8, padding: "10px 12px", borderRadius: 12, backgroundColor: "color-mix(in srgb, var(--success-500) 12%, transparent)", border: "0.5px solid color-mix(in srgb, var(--success-500) 30%, transparent)" }}>
        <Crown size={15} style={{ color: "var(--success-500)", flexShrink: 0 }} />
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--foreground)" }}>You're #1 — {action} to defend the lead.</span>
      </div>
    );
  }
  return (
    <div className="flex items-center" style={{ gap: 8, padding: "10px 12px", borderRadius: 12, backgroundColor: "color-mix(in srgb, var(--primary-500) 12%, transparent)", border: "0.5px solid color-mix(in srgb, var(--primary-500) 28%, transparent)" }}>
      <ArrowUp size={15} style={{ color: "var(--primary-300)", flexShrink: 0 }} />
      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--foreground)" }}>
        <span style={{ color: "var(--primary-300)", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{gap.toLocaleString("en-IN")} {unit}</span> to the spot above — {action} to climb.
      </span>
    </div>
  );
}

function PrimaryCTA({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button type="button" className="flex items-center justify-center w-full"
      style={{ height: 44, borderRadius: 12, gap: 8, cursor: "pointer", backgroundColor: "var(--primary-500)", border: "none", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
      {icon} {label}
    </button>
  );
}

// Premium "this is YOUR group" card chrome — subtle brand tint so it reads as
// home base, distinct from the flat leaderboard rows below.
const HERO_STYLE = {
  background: "linear-gradient(135deg, color-mix(in srgb, var(--primary-500) 13%, var(--card)), var(--card) 70%)",
  border: "1px solid color-mix(in srgb, var(--primary-500) 28%, transparent)",
};

function SquadView({ state }: { state: ReturnType<typeof useArenaState>["state"] }) {
  const squad = getMySquad(state);
  const combined = squadCombined(squad);
  const board = getSquadBoard(state);
  const { rank, total, gap, leader } = rankInfo(board);

  return (
    <>
      {/* Your squad — hero */}
      <div className="flex flex-col" style={{ gap: 14, padding: 16, borderRadius: 12, ...HERO_STYLE }}>
        <div className="flex items-start justify-between" style={{ gap: 12 }}>
          <div className="flex items-center" style={{ gap: 10, minWidth: 0 }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "color-mix(in srgb, var(--primary-500) 18%, transparent)" }}>
              <Users size={20} style={{ color: "var(--primary-300)" }} />
            </div>
            <div className="flex flex-col" style={{ minWidth: 0, gap: 1 }}>
              <span className="truncate" style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)" }}>{squad.name}</span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                {combined.toLocaleString("en-IN")} XP combined · {squad.members.length} members
              </span>
            </div>
          </div>
          <RankPill rank={rank} total={total} />
        </div>

        <GapNudge gap={gap} unit="XP" leader={leader} action="invite a friend" />

        {/* Members — who's pulling weight, you highlighted */}
        <div className="flex flex-col" style={{ gap: 10 }}>
          {squad.members.map((m, i) => (
            <div key={m.name + i} className="flex items-center" style={{ gap: 12 }}>
              {i === 0 ? <Crown size={14} style={{ color: "var(--warning-500)", flexShrink: 0, width: 16 }} /> : <span style={{ width: 16, textAlign: "center", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{i + 1}</span>}
              <Avatar name={m.name} size={28} />
              <span className="truncate" style={{ flex: 1, minWidth: 0, fontSize: "var(--text-sm)", fontWeight: m.isMe ? 700 : 500, color: m.isMe ? "var(--primary-300)" : "var(--foreground)" }}>{m.name}</span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{m.xp.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>

        <PrimaryCTA icon={<UserPlus size={16} />} label="Invite a friend" />
      </div>

      {/* Squad-vs-squad board */}
      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", padding: "0 4px" }}>Squad rankings</span>
      <CollectiveBoard rows={board} unit="XP" />
    </>
  );
}

function SchoolView({ state }: { state: ReturnType<typeof useArenaState>["state"] }) {
  const board = getSchoolBoard(state);
  const { rank, total, gap, leader } = rankInfo(board);

  return (
    <>
      {/* Your school — hero */}
      <div className="flex flex-col" style={{ gap: 14, padding: 16, borderRadius: 12, ...HERO_STYLE }}>
        <div className="flex items-start justify-between" style={{ gap: 12 }}>
          <div className="flex items-center" style={{ gap: 10, minWidth: 0 }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "color-mix(in srgb, var(--primary-500) 18%, transparent)" }}>
              <GraduationCap size={20} style={{ color: "var(--primary-300)" }} />
            </div>
            <div className="flex flex-col" style={{ minWidth: 0, gap: 1 }}>
              <span className="truncate" style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)" }}>{MY_SCHOOL_NAME}</span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>Your school · ranked nationally</span>
            </div>
          </div>
          <RankPill rank={rank} total={total} />
        </div>

        <GapNudge gap={gap} unit="pts" leader={leader} action="recruit a classmate" />

        <PrimaryCTA icon={<Share2 size={16} />} label="Recruit classmates" />
      </div>

      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", padding: "0 4px" }}>School rankings</span>
      <CollectiveBoard rows={board} unit="pts" />
    </>
  );
}

function CollectiveBoard({ rows, unit }: { rows: CollectiveRow[]; unit: string }) {
  return (
    <div className="flex flex-col" style={{ flexShrink: 0, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)", overflow: "hidden" }}>
      {rows.map((r, i) => (
        <div key={`${r.rank}-${r.name}`} className="flex items-center" style={{
          gap: 12, padding: "12px",
          backgroundColor: r.isMe ? "color-mix(in srgb, var(--primary-500) 12%, transparent)" : "transparent",
          borderTop: i === 0 ? "none" : "0.5px solid color-mix(in srgb, var(--foreground) 7%, transparent)",
        }}>
          <span className="flex items-center justify-center shrink-0" style={{ width: 24, fontSize: "var(--text-sm)", fontWeight: 700, color: r.rank <= 3 ? "var(--warning-500)" : "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{r.rank}</span>
          <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <span className="flex items-center" style={{ gap: 6, minWidth: 0 }}>
              <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: r.isMe ? 700 : 500, color: r.isMe ? "var(--primary-300)" : "var(--foreground)" }}>{r.name}</span>
              {r.isMe && <OlympiadTag label="You" variant="success" />}
            </span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{r.members.toLocaleString("en-IN")} players</span>
          </div>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
            {r.score.toLocaleString("en-IN")}<span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 500 }}> {unit}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
