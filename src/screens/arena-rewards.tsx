/**
 * Rewards & Achievements — the trophy case. Structured so each thing you've earned
 * reads at a glance (inspired by Duolingo achievements, Apple Fitness awards and
 * game reward vaults):
 *   • Your rewards— CRED-style collectible-card gallery (claim / claimed / locked);
 *                   claimable count sits inline in the section header, no banner.
 *   • Badges      — a medal GRID (earned = gold medal, locked = ghost + level), so
 *                   the whole wall is visible and nothing clips.
 *   • Certificates— EVENT credentials only (olympiad category → My Certificates).
 *
 * Route: /arena/rewards
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, ChevronRight, Gift, Ticket, Award, Check, Lock, Music, GraduationCap,
  Tent, FileText, Trophy, Crown, Mountain, Star, Target, Shield, Medal, CreditCard, Percent, Package, type LucideIcon,
} from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { HeartIcon } from "../shared/heart-icon";
import { useArenaState, eventProgress, ARENA_REWARDS, type ArenaReward } from "../shared/arena";
import { listEvents, rewardRoadmap } from "../shared/arena-events";
import { formatIssuedDate, type Certificate, type CertificateCategory } from "../shared/certificates";
import { useOlympiadState } from "../shared/olympiads";
import { CertThumb } from "./cert-thumb";
import { arenaBack } from "./arena-ui";

type RewardStatus = "claim" | "claimed" | "locked";
const STATUS_ORDER: Record<RewardStatus, number> = { claim: 0, claimed: 1, locked: 2 };
const KIND_ICON: Record<string, LucideIcon> = { voucher: Ticket, badge: Award, coupon: Gift, giftcard: CreditCard, discount: Percent, pass: Ticket, merch: Package };
const CERT_ICON: Record<CertificateCategory, LucideIcon> = { music: Music, course: GraduationCap, camp: Tent, "test-series": FileText, olympiad: Trophy };

// Each reward tier wears its own collectible-card colourway — like a CRED card stack.
const TIER_THEME: Record<string, { label: string; c: string }> = {
  top:       { label: "Prize",     c: "var(--warning-500)" },  // gold — cash / gift cards
  streak:    { label: "Streak",    c: "var(--success-500)" },  // emerald — habit rewards
  sponsor:   { label: "Sponsored", c: "var(--teal-500)" },     // teal — brand perks
  promotion: { label: "Bonus",     c: "var(--purple-500)" },   // violet — boosts
};
const themeFor = (tier: string) => TIER_THEME[tier] ?? TIER_THEME.top;

// A badge gets a glyph from its name so the wall reads as distinct achievements, not
// a row of identical medals.
function badgeIcon(label: string): LucideIcon {
  const s = label.toLowerCase();
  if (/champion|grandmaster|master/.test(s)) return Crown;
  if (/climber|summit|peak|ascend/.test(s)) return Mountain;
  if (/hero|legend/.test(s)) return Star;
  if (/seeker|scout|explorer|hunt/.test(s)) return Target;
  if (/boss|slayer|guardian|defender/.test(s)) return Shield;
  if (/medal|pro|elite/.test(s)) return Medal;
  return Award;
}

export function Component() {
  const navigate = useNavigate();
  const { state, getClaim, claim } = useArenaState();
  const { earnedCertificates } = useOlympiadState();
  const [toast, setToast] = useState<string | null>(null);

  // 1. Claimable rewards (claim → claimed → locked) for the collectible-card gallery.
  const rewardRows = ARENA_REWARDS.map((reward) => {
    const earned = reward.earned(state);
    const claimed = getClaim(reward.id) === "claimed";
    const status: RewardStatus = !earned ? "locked" : claimed ? "claimed" : "claim";
    return { reward, status };
  }).sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const claimableCount = rewardRows.filter((r) => r.status === "claim").length;

  // 2. Milestone badges across ladder contests (de-duped by name, keep earned).
  const ladders = listEvents().filter((e) => e.format === "ladder");
  const allBadges = ladders.flatMap((e) => {
    const cleared = eventProgress(state, e.id)?.highestCleared ?? 0;
    return rewardRoadmap(e).filter((s) => s.badge).map((s) => ({ label: s.badge!, sub: e.title, earned: s.level <= cleared, level: s.level }));
  });
  const byLabel = new Map<string, (typeof allBadges)[number]>();
  for (const b of allBadges) { const cur = byLabel.get(b.label); if (!cur || (b.earned && !cur.earned)) byLabel.set(b.label, b); }
  const badges = [...byLabel.values()].sort((a, b) => Number(b.earned) - Number(a.earned) || a.level - b.level);
  const earnedBadges = badges.filter((b) => b.earned).length;
  // Show only what the user has actually earned. Locked badges appear ONLY as a
  // teaser when nothing's been earned yet, so the section isn't empty.
  const shownBadges = earnedBadges > 0 ? badges.filter((b) => b.earned) : badges;

  // 3. Certificates — ONLY event/arena credentials (olympiad category). Course / music
  //    / camp certs belong to the main Certificates surface, not the Arena rewards wall.
  const certificates: Certificate[] = earnedCertificates.filter((c) => c.category === "olympiad");

  function doClaim(id: string, title: string) {
    claim(id);
    setToast(`${title} claimed`);
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 48, padding: "0 8px 0 4px", gap: 4 }}>
          <button onClick={() => arenaBack(navigate)} aria-label="Back" className="flex items-center justify-center shrink-0"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={22} style={{ color: "var(--foreground)" }} />
          </button>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)" }}>Rewards</span>
        </div>
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "12px 16px 32px", gap: 20 }}>

        {/* Reward gallery — CRED-style horizontally-scrolling collectible cards */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          <div className="flex items-center justify-between" style={{ padding: "0 4px" }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)" }}>Your rewards</span>
            {claimableCount > 0 && (
              <span className="inline-flex items-center" style={{ gap: 5, fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--warning-500)" }}>
                <Gift size={12} /> {claimableCount} ready to claim
              </span>
            )}
          </div>
          <div style={{ marginLeft: -16, marginRight: -16, overflowX: "auto", scrollbarWidth: "none", scrollSnapType: "x mandatory" }}>
            <div className="flex" style={{ gap: 12, padding: "4px 16px 8px", width: "max-content" }}>
              {rewardRows.map(({ reward, status }, i) => (
                <RewardCard key={reward.id} reward={reward} status={status} index={i} onClaim={() => doClaim(reward.id, reward.title)} />
              ))}
            </div>
          </div>
        </div>

        {/* Badges — medal grid */}
        {badges.length > 0 && (
          <Section title="Badges" right={<span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{earnedBadges}/{badges.length} earned</span>}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {shownBadges.map((b, k) => <BadgeMedal key={k} label={b.label} earned={b.earned} level={b.level} />)}
            </div>
          </Section>
        )}

        {/* Certificates — rail → My Certificates */}
        {certificates.length > 0 && (
          <Section title="Certificates" right={
            <button onClick={() => navigate("/my-certificates")} className="inline-flex items-center" style={{ gap: 2, background: "none", border: "none", cursor: "pointer", color: "var(--primary-300)", fontSize: "var(--text-xs)", fontWeight: 700 }}>
              See all <ChevronRight size={14} />
            </button>
          }>
            <div style={{ marginLeft: -16, marginRight: -16, overflowX: "auto", scrollbarWidth: "none" }}>
              <div className="flex" style={{ gap: 12, padding: "0 16px", width: "max-content" }}>
                {certificates.map((c) => <CertCard key={c.id} cert={c} onClick={() => navigate("/my-certificates")} />)}
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* Claim toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="flex items-center" style={{
              position: "absolute", left: 16, right: 16, bottom: 24, gap: 8, padding: "12px 16px", borderRadius: 12,
              backgroundColor: "color-mix(in srgb, var(--warning-500) 18%, var(--card))",
              border: "1px solid color-mix(in srgb, var(--warning-500) 40%, transparent)",
            }}>
            <Check size={16} style={{ color: "var(--warning-500)" }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Bits ────────────────────────────────────────────────────────────────────
function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <div className="flex items-center justify-between" style={{ padding: "0 4px" }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)" }}>{title}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

// A collectible reward card — premium tinted surface, foil sheen, guilloché rings and
// a medallion. Claimable cards glow + sweep a shine and tap-to-claim; claimed wear a
// seal; locked are dimmed with their unlock condition. (CRED card-stack energy.)
function RewardCard({ reward, status, index, onClaim }: { reward: ArenaReward; status: RewardStatus; index: number; onClaim: () => void }) {
  const t = themeFor(reward.tier);
  const c = t.c;
  const Icon = KIND_ICON[reward.kind] ?? Gift;
  const claimable = status === "claim";
  const claimed = status === "claimed";
  const locked = status === "locked";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.42), type: "spring", stiffness: 240, damping: 22 }}
      whileTap={claimable ? { scale: 0.97 } : undefined}
      onClick={claimable ? onClaim : undefined}
      className="relative flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 184, height: 236, borderRadius: 12, padding: 16, scrollSnapAlign: "start",
        cursor: claimable ? "pointer" : "default",
        background: `linear-gradient(165deg, color-mix(in srgb, ${c} 34%, var(--background)) 0%, color-mix(in srgb, ${c} 9%, var(--background)) 58%, var(--background) 100%)`,
        border: `1px solid color-mix(in srgb, ${c} ${claimable ? 50 : 28}%, transparent)`,
        boxShadow: claimable ? `0 8px 28px color-mix(in srgb, ${c} 26%, transparent)` : "none",
      }}>
      {/* guilloché rings */}
      <div aria-hidden style={{ position: "absolute", top: -46, right: -40, width: 150, height: 150, borderRadius: 9999, border: `1px solid color-mix(in srgb, ${c} 22%, transparent)` }} />
      <div aria-hidden style={{ position: "absolute", top: -26, right: -20, width: 110, height: 110, borderRadius: 9999, border: `1px solid color-mix(in srgb, ${c} 13%, transparent)` }} />
      {/* animated foil sweep (claimable only) */}
      {claimable && (
        <motion.div aria-hidden initial={{ x: "-130%" }} animate={{ x: "260%" }} transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
          style={{ position: "absolute", top: 0, bottom: 0, width: "42%", background: "linear-gradient(115deg, transparent 0%, color-mix(in srgb, var(--white) 24%, transparent) 50%, transparent 100%)", pointerEvents: "none" }} />
      )}

      {/* tier tag + claimed seal */}
      <div className="flex items-center justify-between" style={{ position: "relative" }}>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: `color-mix(in srgb, ${c} 58%, var(--white))` }}>{t.label}</span>
        {claimed && <span className="inline-flex items-center justify-center" style={{ width: 18, height: 18, borderRadius: 9999, backgroundColor: "var(--success-500)" }}><Check size={11} style={{ color: "var(--white)" }} /></span>}
      </div>

      {/* medallion */}
      <div className="flex items-center justify-center" style={{ flex: 1, position: "relative" }}>
        <div className="flex items-center justify-center" style={{
          width: 64, height: 64, borderRadius: 9999,
          background: locked ? "var(--card-bg-secondary)" : `radial-gradient(circle at 50% 30%, color-mix(in srgb, ${c} 86%, var(--white)) 0%, ${c} 56%, color-mix(in srgb, ${c} 50%, var(--black)) 100%)`,
          border: locked ? "1px solid var(--border)" : `1.5px solid color-mix(in srgb, ${c} 46%, var(--white))`,
          boxShadow: locked ? "none" : `0 6px 18px color-mix(in srgb, ${c} 40%, transparent)`,
        }}>
          {locked ? <Lock size={26} style={{ color: "var(--muted-foreground)" }} />
            : reward.kind === "gems" ? <HeartIcon size={28} color="var(--white)" />
            : <Icon size={28} style={{ color: "var(--white)" }} />}
        </div>
      </div>

      {/* title + sub */}
      <div className="flex flex-col" style={{ gap: 2, position: "relative", marginBottom: 10 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{reward.title}</span>
        <span className="truncate" style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>{reward.sub}</span>
      </div>

      {/* footer state */}
      {claimable && (
        <div className="flex items-center justify-center" style={{ gap: 4, height: 34, borderRadius: 9999, backgroundColor: "var(--white)", color: "var(--background)", fontSize: "var(--text-sm)", fontWeight: 700, position: "relative" }}>
          Claim now <ChevronRight size={15} />
        </div>
      )}
      {claimed && (
        <div className="flex items-center justify-center" style={{ gap: 6, height: 34, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--success-500) 16%, transparent)", color: "var(--success-500)", fontSize: "var(--text-2xs)", fontWeight: 800, position: "relative" }}>
          <Check size={13} /> Claimed
        </div>
      )}
      {locked && (
        <div className="flex items-center justify-center" style={{ gap: 6, height: 34, borderRadius: 9999, backgroundColor: "var(--card-bg-secondary)", color: "var(--muted-foreground)", fontSize: "var(--text-2xs)", fontWeight: 700, position: "relative" }}>
          <Lock size={12} /> Locked
        </div>
      )}
    </motion.div>
  );
}

function BadgeMedal({ label, earned, level }: { label: string; earned: boolean; level: number }) {
  const Icon = badgeIcon(label);
  return (
    <div className="flex flex-col items-center text-center" style={{
      gap: 8, padding: "16px 8px", borderRadius: 12,
      background: earned ? "linear-gradient(180deg, color-mix(in srgb, var(--warning-500) 10%, var(--card)) 0%, var(--card) 70%)" : "var(--card)",
      border: earned ? "0.5px solid color-mix(in srgb, var(--warning-500) 28%, var(--border))" : "0.5px solid var(--border)",
    }}>
      <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
        {/* soft halo behind earned medals */}
        {earned && <div aria-hidden style={{ position: "absolute", inset: -6, borderRadius: 9999, background: "radial-gradient(circle, color-mix(in srgb, var(--warning-500) 40%, transparent) 0%, transparent 70%)" }} />}
        {/* HEXAGONAL medal — deliberately a different shape from the round reward-card
            medallions, so badges read as achievements, not as more reward icons. */}
        <div aria-hidden style={{
          position: "absolute", width: 56, height: 56,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: earned ? "color-mix(in srgb, var(--warning-500) 55%, var(--white))" : "color-mix(in srgb, var(--foreground) 14%, transparent)",
          filter: earned ? "drop-shadow(0 4px 14px color-mix(in srgb, var(--warning-500) 38%, transparent))" : "none",
        }} />
        <div className="relative flex items-center justify-center" style={{
          width: 50, height: 50,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: earned
            ? "radial-gradient(circle at 50% 28%, color-mix(in srgb, var(--warning-500) 90%, var(--white)) 0%, var(--warning-500) 52%, color-mix(in srgb, var(--warning-500) 50%, var(--black)) 100%)"
            : "var(--card-bg-secondary)",
        }}>
          <Icon size={22} style={{ color: earned ? "var(--white)" : "var(--muted-foreground)", opacity: earned ? 1 : 0.55 }} />
        </div>
        {/* status gem at the medal's bottom point — check (earned) or lock (locked) */}
        <span className="absolute flex items-center justify-center" style={{
          left: "50%", bottom: -2, transform: "translateX(-50%)", width: 18, height: 18, borderRadius: 9999, border: "2px solid var(--card)",
          backgroundColor: earned ? "var(--success-500)" : "var(--card-bg-secondary)",
        }}>
          {earned ? <Check size={10} style={{ color: "var(--white)" }} /> : <Lock size={9} style={{ color: "var(--muted-foreground)" }} />}
        </span>
      </div>
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: earned ? "var(--foreground)" : "var(--muted-foreground)", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{label}</span>
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: earned ? "var(--success-500)" : "var(--muted-foreground)" }}>
        {earned ? "Earned" : `Level ${level}`}
      </span>
    </div>
  );
}

function CertCard({ cert, onClick }: { cert: Certificate; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col shrink-0 text-left" style={{ width: 220, borderRadius: 12, overflow: "hidden", backgroundColor: "var(--card)", border: "0.5px solid var(--border)", cursor: "pointer" }}>
      <CertThumb cert={cert} />
      <div className="flex flex-col" style={{ padding: 12, gap: 4 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 36 }}>{cert.courseTitle}</span>
        <span className="truncate" style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>{cert.organization}</span>
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{formatIssuedDate(cert.issuedOn)}</span>
      </div>
    </button>
  );
}
