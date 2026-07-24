/**
 * Arena · What's Next (E0-4 + Delivery Plan §3.2) — an always-on roadmap/changelog
 * feed so users see what just shipped and what's coming. Turns missing features
 * into anticipation instead of dead ends.
 *
 * Route: /arena/whats-next
 */

import { useNavigate } from "react-router";
import { Check, Clock, Sparkles, type LucideIcon } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { OlympiadHeader, OlympiadTag } from "./olympiad-ui";
import { arenaBack } from "./arena-ui";

type Status = "live" | "soon" | "planned";

// TODO(api): GET /api/arena/roadmap — server-driven so it updates without a release.
const ITEMS: { title: string; sub: string; status: Status }[] = [
  { title: "Daily Sprint & Leagues", sub: "Clear questions to climb your skill level, Bronze → Champion", status: "live" },
  { title: "Weekend Events", sub: "Longer contests, bigger prizes", status: "live" },
  { title: "Championships", sub: "Scheduled national events + certificates", status: "live" },
  { title: "Post-arena review", sub: "Learn from your misses before the next run", status: "live" },
  { title: "Challenge a friend", sub: "Pull friends into your arena", status: "live" },
  { title: "Squads", sub: "Team up — combined score, squad board", status: "live" },
  { title: "School vs School", sub: "Collective pride boards", status: "live" },
  { title: "Mastery map", sub: "Your concept-level progress over time", status: "live" },
  { title: "Refer & earn", sub: "Invite friends for gems (never affects rank)", status: "live" },
  { title: "Global events", sub: "Everyone competes at once — Diwali Dhamaka", status: "soon" },
  { title: "Smart notifications", sub: "Nudges when a weekend event's about to end", status: "soon" },
  { title: "Cosmetics & rank-card skins", sub: "Express yourself (never affects rank)", status: "planned" },
  { title: "Parent progress reports", sub: "Premium analytics for parents", status: "planned" },
];

const META: Record<Status, { label: string; variant: "success" | "warning" | "neutral"; icon: LucideIcon; color: string }> = {
  live: { label: "Live", variant: "success", icon: Check, color: "var(--success-500)" },
  soon: { label: "Coming soon", variant: "warning", icon: Clock, color: "var(--warning-500)" },
  planned: { label: "Planned", variant: "neutral", icon: Sparkles, color: "var(--muted-foreground)" },
};

export function Component() {
  const navigate = useNavigate();
  const order: Status[] = ["live", "soon", "planned"];

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="What's next" onBack={() => arenaBack(navigate)} />
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "8px 16px 32px", gap: 20 }}>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
          Where the Arena is headed. We ship in stages so it always feels finished — here's what's live and what's coming.
        </span>

        {order.map((status) => {
          const items = ITEMS.filter((it) => it.status === status);
          if (!items.length) return null;
          const m = META[status];
          return (
            <div key={status} className="flex flex-col" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: m.color, textTransform: "uppercase", letterSpacing: 0.4, padding: "0 4px" }}>{m.label}</span>
              {items.map((it) => (
                <div key={it.title} className="flex items-center" style={{ gap: 12, padding: 16, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
                  <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: `color-mix(in srgb, ${m.color} 14%, transparent)` }}>
                    <m.icon size={18} style={{ color: m.color }} />
                  </div>
                  <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>{it.title}</span>
                    <span className="truncate" style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{it.sub}</span>
                  </div>
                  <OlympiadTag label={m.label} variant={m.variant} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
