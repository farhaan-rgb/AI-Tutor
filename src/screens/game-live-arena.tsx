/**
 * Sunday Showdown — live event lobby for the weekly quiz arena.
 * Route: /marketplace/game/live-quiz-arena/play  (id stable; UI title "Sunday Showdown")
 *
 * NOT a real live event yet. This is an honest lobby:
 *   - Countdown to next Sunday 7 PM IST (real, ticking)
 *   - Sample leaderboard clearly labeled while the live event rolls out
 *   - "What to expect" card describing the event format
 *   - Notify-me toggle (local state — no real push backend wired)
 *   - Pass-gated CTA: no-pass → checkout, pass-active → reminder ("we'll let you know
 *     when the live mechanic launches")
 *
 * Why this exists (vs leaving as SOON):
 *   - Pass-holders need to see what they're paying for; a SOON wall hides the value
 *   - Anticipation + sample leaderboard build appetite without faking a live event
 *   - When real-time multiplayer infra ships, the lobby content swaps to live data
 *     while the surrounding chrome (hero, "what to expect", sticky CTA) stays
 *
 * What's deliberately NOT here:
 *   - Fake "X kids playing now" counters
 *   - Fake "live now — join!" buttons
 *   - Prize amounts or specific names that imply a real event has happened
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Trophy, Bell, BellOff, Users, Clock, Award, CalendarDays,
} from "lucide-react";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { useGamesPass } from "../shared/games-pass-state";
import { GAMES_PASS } from "./marketplace-v1";
import { TopExitBar } from "../shared/game-result-shared";

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCENT = "var(--error-500)";   // Sunday Showdown's per-game red

// Sample leaderboard — Indian-context names + cities. Clearly labeled as
// illustrative below; no claim that these are real Sunday winners.
// TODO(api): swap for GET /api/games/sunday-showdown/leaderboard once
// the live mechanic ships and we have real round-end data.
const SAMPLE_LEADERBOARD: { rank: number; name: string; city: string; points: number }[] = [
  { rank: 1,  name: "Aarav S.",   city: "Mumbai",     points: 2840 },
  { rank: 2,  name: "Priya K.",   city: "Bangalore",  points: 2720 },
  { rank: 3,  name: "Riyaan M.",  city: "Delhi",      points: 2690 },
  { rank: 4,  name: "Ishaan T.",  city: "Hyderabad",  points: 2580 },
  { rank: 5,  name: "Anaya G.",   city: "Chennai",    points: 2510 },
  { rank: 6,  name: "Vihaan B.",  city: "Pune",       points: 2470 },
  { rank: 7,  name: "Saanvi R.",  city: "Kolkata",    points: 2420 },
  { rank: 8,  name: "Kabir N.",   city: "Ahmedabad",  points: 2380 },
  { rank: 9,  name: "Aanya D.",   city: "Jaipur",     points: 2340 },
  { rank: 10, name: "Arjun L.",   city: "Indore",     points: 2300 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Next Sunday at 7:00 PM in local time. If it's currently Sunday before 7 PM,
// returns today at 7 PM; otherwise returns the following Sunday.
function nextSunday7pm(): Date {
  const now = new Date();
  const day = now.getDay();         // 0 = Sun, 6 = Sat
  let daysToAdd: number;
  if (day === 0) {
    const sevenPMToday = new Date(now);
    sevenPMToday.setHours(19, 0, 0, 0);
    daysToAdd = now < sevenPMToday ? 0 : 7;
  } else {
    daysToAdd = 7 - day;
  }
  const target = new Date(now);
  target.setDate(now.getDate() + daysToAdd);
  target.setHours(19, 0, 0, 0);
  return target;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function diffToCountdown(target: Date): Countdown {
  const totalMs = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);
  return { days, hours, minutes, seconds, totalMs };
}

function formatDateChip(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
}

// ─── Component ───────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const pass = useGamesPass();

  const [targetDate] = useState(nextSunday7pm);
  const [countdown, setCountdown] = useState<Countdown>(() => diffToCountdown(targetDate));
  const [notifyMe, setNotifyMe] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setCountdown(diffToCountdown(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const containerStyle: React.CSSProperties = {
    fontFamily: "var(--font-family-inter)",
    backgroundColor: "var(--background)",
    minHeight: "100dvh",
    maxWidth: isDesktop ? 720 : undefined,
    marginLeft: isDesktop ? "auto" : undefined,
    marginRight: isDesktop ? "auto" : undefined,
    display: "flex", flexDirection: "column",
  };

  return (
    <div style={containerStyle}>
      <TopExitBar onExit={() => navigate(-1)} />

      <div className="flex-1 min-h-0" style={{ overflowY: "auto", paddingBottom: 120 }}>
        {/* ─── Hero ──────────────────────────────────────────────────── */}
        <div style={{
          position: "relative", paddingBottom: 24,
          background: `linear-gradient(180deg, color-mix(in srgb, ${ACCENT} 26%, var(--background)) 0%, color-mix(in srgb, ${ACCENT} 10%, var(--background)) 50%, var(--background) 100%)`,
        }}>
          <div className="flex flex-col items-center" style={{ paddingTop: 24, gap: 16 }}>
            {/* Icon block + halo */}
            <div style={{
              position: "relative", width: 120, height: 120,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div aria-hidden style={{
                position: "absolute", inset: 0, borderRadius: 9999,
                background: `radial-gradient(circle, color-mix(in srgb, ${ACCENT} 38%, transparent) 0%, transparent 70%)`,
                filter: "blur(10px)",
              }} />
              <div style={{
                position: "relative", width: 88, height: 88, borderRadius: 24,
                background: `linear-gradient(135deg, ${ACCENT} 0%, color-mix(in srgb, var(--warning-500) 50%, ${ACCENT}) 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 16px 40px color-mix(in srgb, ${ACCENT} 55%, transparent), inset 0 2px 0 color-mix(in srgb, var(--white) 32%, transparent)`,
              }}>
                <Trophy size={40} style={{ color: "var(--white)" }} strokeWidth={2.25} />
              </div>
            </div>

            <div className="flex flex-col items-center" style={{ gap: 4, padding: "0 24px" }}>
              <span style={{
                fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.2,
                color: "var(--muted-foreground)", textTransform: "uppercase",
              }}>
                Sunday Showdown · Class 4–8
              </span>
              <h1 style={{
                fontSize: 32, fontWeight: 800, color: "var(--foreground)",
                margin: 0, letterSpacing: -0.6, lineHeight: 1.1, textAlign: "center",
              }}>
                Weekly live quiz
              </h1>
              <span style={{
                fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
                textAlign: "center", maxWidth: 280, marginTop: 4,
              }}>
                Every Sunday · 7 PM IST · Top 100 win prizes
              </span>
            </div>
          </div>
        </div>

        {/* ─── Countdown card ─────────────────────────────────────────── */}
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{
            padding: 20, borderRadius: 16,
            backgroundColor: `color-mix(in srgb, ${ACCENT} 8%, var(--card))`,
            border: `0.5px solid color-mix(in srgb, ${ACCENT} 24%, var(--border))`,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <CalendarDays size={14} style={{ color: ACCENT }} />
              <span style={{
                fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--muted-foreground)",
                letterSpacing: 0.6, textTransform: "uppercase",
              }}>
                Next event
              </span>
              <span style={{
                fontSize: "var(--text-2xs)", fontWeight: 700, color: ACCENT,
                letterSpacing: 0.4, marginLeft: "auto",
              }}>
                {formatDateChip(targetDate)}
              </span>
            </div>

            {/* Countdown digits */}
            <div className="flex items-center justify-center" style={{ gap: 8 }}>
              <CountdownDigit value={countdown.days}    label="Days" />
              <CountdownColon />
              <CountdownDigit value={countdown.hours}   label="Hours" />
              <CountdownColon />
              <CountdownDigit value={countdown.minutes} label="Mins" />
              <CountdownColon />
              <CountdownDigit value={countdown.seconds} label="Secs" />
            </div>

            {/* Notify-me toggle */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setNotifyMe((v) => !v)}
              className="flex items-center justify-center"
              style={{
                width: "100%", height: 40, borderRadius: 8, gap: 8,
                backgroundColor: notifyMe ? `color-mix(in srgb, ${ACCENT} 14%, var(--card))` : "var(--card)",
                border: notifyMe ? `0.5px solid ${ACCENT}` : "0.5px solid var(--border)",
                cursor: "pointer",
              }}
            >
              {notifyMe
                ? <Bell size={14} style={{ color: ACCENT }} />
                : <BellOff size={14} style={{ color: "var(--muted-foreground)" }} />}
              <span style={{
                fontSize: "var(--text-sm)", fontWeight: 600,
                color: notifyMe ? ACCENT : "var(--foreground)",
              }}>
                {notifyMe ? "Reminder on" : "Notify me before it starts"}
              </span>
            </motion.button>
          </div>
        </div>

        {/* ─── What to expect ─────────────────────────────────────────── */}
        <div style={{ padding: "24px 16px 0" }}>
          <SectionTitle>What to expect</SectionTitle>
          <div className="flex flex-col" style={{
            gap: 16,
            padding: 16, borderRadius: 16, backgroundColor: "var(--card)",
            border: "0.5px solid var(--border)",
          }}>
            <ExpectRow Icon={Clock}  color="var(--warning-500)" title="30 fast questions"      body="10 seconds each · no second chances" />
            <ExpectRow Icon={Users}  color="var(--primary-500)" title="Live rankings"       body="See where you rank in real time" />
            <ExpectRow Icon={Award}  color={ACCENT}             title="Top 100 win prizes"     body="Real prizes posted to your address" />
            <ExpectRow Icon={Trophy} color="var(--success-500)" title="One weekly champion"    body="Highest score on the night takes the crown" />
          </div>
        </div>

        {/* ─── Top players · sample ───────────────────────────────────── */}
        <div style={{ padding: "24px 16px 0" }}>
          <div className="flex items-baseline" style={{ gap: 8, marginBottom: 12 }}>
            <SectionTitle>Top players</SectionTitle>
            <span style={{
              fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
              fontStyle: "italic", marginLeft: "auto",
            }}>
              Sample · live data rolls out soon
            </span>
          </div>
          <div style={{
            borderRadius: 16, backgroundColor: "var(--card)",
            border: "0.5px solid var(--border)", overflow: "hidden",
          }}>
            {SAMPLE_LEADERBOARD.map((entry, i) => (
              <LeaderboardRow key={entry.rank} entry={entry} isLast={i === SAMPLE_LEADERBOARD.length - 1} accent={ACCENT} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Sticky CTA — pass gate ─────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        maxWidth: isDesktop ? 720 : undefined,
        marginLeft: isDesktop ? "auto" : undefined,
        marginRight: isDesktop ? "auto" : undefined,
      }}>
        {pass.active ? (
          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--success-500)" }}>
              Pass active · You're in
            </span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
              {pass.daysLeft} days left · Live event launches soon
            </span>
          </div>
        ) : (
          <>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/marketplace/games-pass")}
              className="flex items-center justify-center w-full"
              style={{
                height: 44, borderRadius: 12, gap: 8, border: "none",
                backgroundColor: ACCENT, cursor: "pointer",
              }}
            >
              <Trophy size={16} style={{ color: "var(--white)" }} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)", letterSpacing: 0.2 }}>
                Get Games Pass to join
              </span>
            </motion.button>
            <p style={{
              fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
              textAlign: "center", marginTop: 6, marginBottom: 0, lineHeight: 1.4,
            }}>
              {GAMES_PASS.label} · ₹{GAMES_PASS.price} / {GAMES_PASS.durationLabel} · includes all 7 premium games
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CountdownDigit({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center" style={{ gap: 4, minWidth: 56 }}>
      <span style={{
        fontSize: 32, fontWeight: 800, color: "var(--foreground)",
        fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: -1,
      }}>
        {padded}
      </span>
      <span style={{
        fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)",
        letterSpacing: 0.4, textTransform: "uppercase",
      }}>
        {label}
      </span>
    </div>
  );
}

function CountdownColon() {
  return (
    <span aria-hidden style={{
      fontSize: 28, fontWeight: 800, color: "var(--muted-foreground)",
      paddingBottom: 16, opacity: 0.5,
    }}>
      :
    </span>
  );
}

function ExpectRow({
  Icon, color, title, body,
}: {
  Icon: typeof Trophy;
  color: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start" style={{ gap: 12 }}>
      <div className="flex items-center justify-center" style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        backgroundColor: "var(--card-bg-secondary)",
      }}>
        <Icon size={16} style={{ color }} strokeWidth={2.25} />
      </div>
      <div className="flex flex-col" style={{ gap: 2, minWidth: 0, flex: 1, paddingTop: 2 }}>
        <span style={{
          fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3,
        }}>
          {title}
        </span>
        <span style={{
          fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4,
        }}>
          {body}
        </span>
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry, isLast, accent,
}: {
  entry: { rank: number; name: string; city: string; points: number };
  isLast: boolean;
  accent: string;
}) {
  const isPodium = entry.rank <= 3;
  const rankColor = entry.rank === 1
    ? "var(--warning-500)"
    : entry.rank === 2
      ? "var(--muted-foreground)"
      : entry.rank === 3
        ? "color-mix(in srgb, var(--warning-500) 60%, var(--muted-foreground))"
        : "var(--muted-foreground)";
  return (
    <div className="flex items-center" style={{
      padding: "10px 16px",
      borderBottom: isLast ? "none" : "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
      gap: 12,
    }}>
      <div className="flex items-center justify-center" style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        backgroundColor: isPodium ? `color-mix(in srgb, ${rankColor} 18%, transparent)` : "var(--card-bg-secondary)",
      }}>
        <span style={{
          fontSize: "var(--text-xs)", fontWeight: 800, color: rankColor,
          fontVariantNumeric: "tabular-nums",
        }}>
          {entry.rank}
        </span>
      </div>
      <div className="flex flex-col" style={{ gap: 2, minWidth: 0, flex: 1 }}>
        <span style={{
          fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3,
        }}>
          {entry.name}
        </span>
        <span style={{
          fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", letterSpacing: 0.2,
        }}>
          {entry.city}
        </span>
      </div>
      <span style={{
        fontSize: "var(--text-sm)", fontWeight: 700,
        color: isPodium ? rankColor : "var(--foreground)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {entry.points.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "var(--text-2xs)", fontWeight: 600,
      color: "var(--muted-foreground)", letterSpacing: 0.8,
      textTransform: "uppercase",
      margin: "0 0 10px",
    }}>
      {children}
    </p>
  );
}
