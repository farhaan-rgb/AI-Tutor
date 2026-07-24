/**
 * Olympiad Detail — the event page. Status-aware: the sticky CTA + context card
 * adapt to every phase (upcoming · registration open/closing · live · grading ·
 * results-out) crossed with the user's registration + attempt state. Covers the
 * edge states the research synthesis called out: registration-closed-stranger,
 * exam-in-progress, exam-ended, missed-it → practice-this-paper (unrated).
 *
 * Route: /olympiad/:olympiadId
 */

import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarClock, Clock, FileText, Trophy, Award,
  Bell, BellRing, Lock, Medal, CheckCircle2, ChevronLeft, ChevronDown,
} from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import {
  getOlympiadById, olympiadStatus, useOlympiadState, getLeaderboard, formatCount,
  type Olympiad, type OlympiadPhase, type OlympiadAttempt,
} from "../shared/olympiads";
import { useGydMax } from "../shared/feedback-storage";
import {
  OlympiadIcon, StatusPill, EntryBadge, ParticipantStat, CountdownBlocks, PrizeList, Podium, olympiadBack,
} from "./olympiad-ui";
import { RegisterSheet } from "./olympiad-register";

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString("en-IN", {
    day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  // Honour where we came from (e.g. the Arena hub) so back doesn't strand the user
  // in the standalone Olympiad world. Falls back to the Olympiad home.
  const backTo = (location.state as { from?: string } | null)?.from ?? "/olympiad";
  const goBack = () => olympiadBack(navigate, backTo);
  const { olympiadId } = useParams<{ olympiadId: string }>();
  const o = olympiadId ? getOlympiadById(olympiadId) : undefined;
  const state = useOlympiadState();
  const gyd = useGydMax();

  if (!o) return <NotFound onBack={goBack} />;

  const s = olympiadStatus(o);
  const registered = state.isRegistered(o.id);
  const attempt = state.getAttempt(o.id);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", position: "relative", fontFamily: "var(--font-family-inter)" }}>
      {/* Floating back — over the hero, always visible */}
      <button
        aria-label="Back"
        onClick={goBack}
        className="flex items-center justify-center"
        style={{
          position: "absolute", top: 52, left: 12, zIndex: 50,
          width: 36, height: 36, borderRadius: 9999, border: "none", cursor: "pointer",
          backgroundColor: "var(--overlay-strong)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <ChevronLeft size={20} style={{ color: "var(--white)" }} />
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Full-bleed brand hero */}
        <Hero o={o} phase={s.phase} />

        {/* Title block */}
        <div className="flex flex-col" style={{ padding: 16, gap: 6, borderBottom: "0.5px solid var(--border)" }}>
          <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.25 }}>{o.title}</span>
          <span style={{ fontSize: "var(--text-sm)", color: o.accent, fontWeight: 600 }}>{o.tagline}</span>
          <div style={{ marginTop: 2 }}><ParticipantStat count={o.participantCount} /></div>
        </div>

        <div className="w-full max-w-2xl mx-auto flex flex-col" style={{ padding: "16px 16px 120px", gap: 16 }}>
          {s.resultsOut ? (
            // Concluded event → lead with the outcome (who won, the field), not a
            // forward-looking spec sheet. The pre-event detail is demoted into a
            // collapsed "Event details" block below.
            <>
              {attempt && <ContextCard o={o} registered={registered} attempt={attempt} />}
              <WinnersCard o={o} />
              <EventDetails o={o} />
            </>
          ) : (
            <>
              {/* Context card — countdown / result summary by phase */}
              <ContextCard o={o} registered={registered} attempt={attempt} />

              {/* About */}
              <Section title="About">
                <p style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.6 }}>{o.description}</p>
              </Section>

              {/* Schedule */}
              <Section title="Schedule">
                <InfoRow icon={CalendarClock} label="Exam starts" value={formatDateTime(o.startsAt)} />
                <InfoRow icon={Clock} label="Duration" value={`${o.durationMinutes} min`} />
                {!s.registrationClosed && (
                  <InfoRow icon={Lock} label="Reg. closes" value={formatDateTime(o.registrationClosesAt)} />
                )}
                <InfoRow icon={Trophy} label="Results" value={formatDateTime(o.resultsAt)} />
              </Section>

              {/* Exam pattern / syllabus */}
              <Section title="Exam pattern">
                <InfoRow icon={FileText} label="Questions" value={`${o.questionCount} · ${o.maxScore} marks`} />
                <InfoRow icon={FileText} label="Marking" value={o.pattern} />
                <div className="flex flex-wrap" style={{ gap: 8, marginTop: 4 }}>
                  {o.sections.map((sec) => (
                    <SubjectChip key={sec} label={sec} />
                  ))}
                </div>
              </Section>

              {/* Prizes */}
              <Section title="Prizes">
                <PrizeList prizes={o.prizes} />
              </Section>

              {/* Certificate */}
              <Section title="Certificates">
                <CertList o={o} />
              </Section>
            </>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <StickyCTA o={o} registered={registered} hasAttempt={!!attempt} gydActive={gyd.active}
        onRegister={() => setShowRegister(true)}
        onRemind={() => state.register(o.id)}
        onEnter={() => navigate(`/olympiad/${o.id}/lobby`)}
        onResult={() => navigate(`/olympiad/${o.id}/result`)}
        onLeaderboard={() => navigate(`/olympiad/${o.id}/leaderboard`)}
        onPractice={() => navigate(`/my-test-series/oly-${o.id}/mock/exam/take?practice=1`)}
        onBrowse={() => navigate("/olympiad")}
        onGetMax={() => navigate("/paywall-v2")}
      />

      {/* Registration — a bottom sheet over the event, not a separate page */}
      <AnimatePresence>
        {showRegister && <RegisterSheet o={o} onClose={() => setShowRegister(false)} />}
      </AnimatePresence>
    </div>
  );
}

// Full-bleed brand hero (marketplace product-detail pattern): accent wash +
// corner glow + vignette, centered seal + exam label, status-bar legibility
// gradient on top, status/entry chips bottom-left.
function Hero({ o, phase }: { o: Olympiad; phase: OlympiadPhase }) {
  const accent = o.accent;
  return (
    <div className="relative w-full" style={{
      height: 240, overflow: "hidden",
      background: `color-mix(in srgb, ${accent} 16%, var(--card))`,
    }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 30%, transparent) 0%, transparent 70%)` }} />
      <div aria-hidden style={{ position: "absolute", bottom: -48, right: -48, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`, opacity: 0.34 }} />
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 45%, color-mix(in srgb, var(--black) 32%, transparent) 100%)" }} />

      {/* status-bar legibility gradient + overlay */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 88, background: "linear-gradient(180deg, color-mix(in srgb, var(--black) 45%, transparent) 0%, transparent 100%)", zIndex: 2 }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, pointerEvents: "none" }}>
        <StatusBar />
      </div>

      {/* centered identity */}
      <div className="absolute flex flex-col items-center" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", gap: 12 }}>
        <div className="flex items-center justify-center" style={{
          width: 88, height: 88, borderRadius: 24,
          background: `linear-gradient(155deg, ${accent} 0%, color-mix(in srgb, ${accent} 60%, var(--black)) 100%)`,
          boxShadow: `0 8px 32px color-mix(in srgb, ${accent} 40%, transparent)`,
        }}>
          <OlympiadIcon iconKey={o.iconKey} size={44} />
        </div>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.8, textTransform: "uppercase", color: accent }}>
          {o.examLabel}
        </span>
      </div>

      {/* status + entry chips */}
      <div className="absolute flex items-center" style={{ bottom: 12, left: 16, gap: 8, zIndex: 4 }}>
        <StatusPill phase={phase} />
        <EntryBadge o={o} />
      </div>
    </div>
  );
}

function ContextCard({ o, registered, attempt }: { o: Olympiad; registered: boolean; attempt?: OlympiadAttempt }) {
  const s = olympiadStatus(o);

  // Time-based phases → countdown.
  let label: string | null = null;
  let to: number | null = null;
  if (s.isUpcoming) { label = registered ? "You're registered · starts in" : "Exam starts in"; to = o.startsAt; }
  else if (s.phase === "registration-closing") { label = "Registration closes in"; to = o.registrationClosesAt; }
  else if (s.isLive) { label = "Live window closes in"; to = s.windowEndsAt; }
  else if (s.phase === "grading") { label = "Results & rankings in"; to = o.resultsAt; }

  const cardStyle = {
    gap: 8, padding: 20, borderRadius: 16,
    backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
  } as const;

  if (to && label) {
    return (
      <div className="flex flex-col items-center" style={cardStyle}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600, marginBottom: 4 }}>{label}</span>
        <CountdownBlocks to={to} accent={o.accent} />
      </div>
    );
  }

  // Results out → show the rank UP FRONT (no "scroll down to see it" teaser).
  if (attempt) {
    return (
      <div className="flex flex-col items-center text-center" style={cardStyle}>
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Your result</span>
        <span className="inline-flex items-center" style={{ gap: 8, fontSize: "var(--text-2xl)", fontWeight: 800, color: o.accent, lineHeight: 1.1 }}>
          <Trophy size={24} style={{ color: o.accent }} />
          AIR {attempt.rank.toLocaleString("en-IN")}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
          {attempt.percentile} percentile · {attempt.score}/{o.maxScore}
        </span>
      </div>
    );
  }

  // Results out, didn't attempt.
  return (
    <div className="flex flex-col items-center" style={cardStyle}>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Results are out</span>
      <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>National rankings published</span>
    </div>
  );
}

function StickyCTA({
  o, registered, hasAttempt, gydActive,
  onRegister, onRemind, onEnter, onResult, onLeaderboard, onPractice, onBrowse, onGetMax,
}: {
  o: Olympiad; registered: boolean; hasAttempt: boolean; gydActive: boolean;
  onRegister: () => void; onRemind: () => void; onEnter: () => void; onResult: () => void;
  onLeaderboard: () => void; onPractice: () => void; onBrowse: () => void; onGetMax: () => void;
}) {
  const s = olympiadStatus(o);

  // Resolve primary action + any secondary, per phase × user-state.
  let primary: { label: string; onClick: () => void; disabled?: boolean; color?: string; icon?: typeof Bell } | null = null;
  let secondary: React.ReactNode = null;

  if (s.resultsOut) {
    if (hasAttempt) {
      // Attempted → they have a rank, so the leaderboard is relevant.
      primary = { label: "View your result", onClick: onResult };
      secondary = <SecondaryBtn label="Rankings" onClick={onLeaderboard} />;
    } else {
      // Missed / never joined → no rank. Results are public, so the one useful
      // action is the leaderboard. No "Browse" — the header back button already
      // returns to the hub.
      primary = { label: "View rankings", onClick: onLeaderboard };
    }
  } else if (s.phase === "grading") {
    primary = hasAttempt
      ? { label: "Awaiting results", onClick: () => {}, disabled: true }
      : { label: "Exam ended", onClick: () => {}, disabled: true };
    if (!hasAttempt) secondary = <SecondaryBtn label="Browse" onClick={onBrowse} />;
  } else if (s.isLive) {
    if (registered) primary = { label: "Enter exam now", onClick: onEnter };
    else {
      primary = { label: "Registration closed · in progress", onClick: () => {}, disabled: true };
      secondary = <SecondaryBtn label="Browse" onClick={onBrowse} />;
    }
  } else { // upcoming / registration phases
    if (s.registrationClosed && !registered) {
      primary = { label: "Registration closed", onClick: () => {}, disabled: true };
      secondary = <SecondaryBtn label="Browse" onClick={onBrowse} />;
    } else if (registered) {
      // Confirmation. Free events were a one-tap "Remind me", so phrase it as a
      // reminder; paid/Max went through the register sheet, so "You're registered".
      primary = o.entryType === "free"
        ? { label: "Reminder set", onClick: () => {}, disabled: true, color: "var(--success-500)", icon: BellRing }
        : { label: "You're registered", onClick: () => {}, disabled: true, color: "var(--success-500)" };
    } else if (s.canRegister) {
      // Free → one-tap "Remind me" (no form; profile has your name). Max non-member
      // → paywall. Max member → the register sheet (it needs roll/identity).
      primary = o.entryType === "max"
        ? (gydActive
            ? { label: "Register", onClick: onRegister }
            : { label: "Get GYD Max to enter", onClick: onGetMax, color: "var(--purple-500)" })
        : { label: "Remind me", onClick: onRemind, icon: Bell };
    } else {
      primary = { label: `Opens ${new Date(o.registrationOpensAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`, onClick: () => {}, disabled: true };
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0" style={{
      backdropFilter: "blur(16px)",
      backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
      borderTop: "0.5px solid var(--border)",
      padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
    }}>
      <div className="w-full max-w-2xl mx-auto flex items-center" style={{ gap: 8 }}>
        {secondary}
        {primary && (
          <motion.button
            type="button"
            whileTap={primary.disabled ? undefined : { scale: 0.98 }}
            onClick={primary.onClick}
            disabled={primary.disabled}
            className="flex items-center justify-center"
            style={{
              flex: 1, height: 44, padding: "0 16px", borderRadius: 12, border: "none", gap: 8,
              fontSize: "var(--text-sm)", fontWeight: 600, whiteSpace: "nowrap",
              cursor: primary.disabled ? "default" : "pointer",
              color: primary.disabled ? "var(--disabled-text)" : "var(--white)",
              backgroundColor: primary.disabled ? "var(--disabled-bg)" : (primary.color ?? "var(--primary-500)"),
            }}
          >
            {primary.icon && <primary.icon size={16} />}
            {primary.label}
          </motion.button>
        )}
      </div>
    </div>
  );
}

function SecondaryBtn({ label, onClick, icon: Icon, active }: {
  label: string; onClick: () => void; icon?: typeof Bell; active?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} className="flex items-center justify-center"
      style={{
        flex: 1, height: 44, padding: "0 20px", borderRadius: 12, gap: 8, cursor: "pointer",
        fontSize: "var(--text-sm)", fontWeight: 600,
        color: active ? "var(--success-500)" : "var(--foreground)",
        backgroundColor: "transparent",
        border: `1px solid ${active ? "var(--success-500)" : "var(--white-alpha-25)"}`,
      }}>
      {Icon && <Icon size={16} />}
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{
      gap: 12, padding: 16, borderRadius: 16,
      backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
    }}>
      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>{title}</span>
      {children}
    </div>
  );
}

function CertRow({ icon: Icon, title, sub, accent }: { icon: typeof Clock; title: string; sub: string; accent: string }) {
  return (
    <div className="flex items-center" style={{ gap: 12 }}>
      <div className="flex items-center justify-center shrink-0" style={{
        width: 36, height: 36, borderRadius: 8,
        backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
      }}>
        <Icon size={18} style={{ color: `color-mix(in srgb, ${accent} 88%, var(--foreground))` }} />
      </div>
      <div className="flex flex-col min-w-0" style={{ gap: 2 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>{title}</span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{sub}</span>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between" style={{ gap: 16 }}>
      <span className="flex items-center shrink-0" style={{ gap: 8, fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
        <Icon size={15} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
        {label}
      </span>
      <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)", textAlign: "right", flex: 1, minWidth: 0 }}>{value}</span>
    </div>
  );
}

// Results-out outcome: actual national winners (podium) + the scale of the
// field. This is what people open a concluded Olympiad for — not the spec.
function WinnersCard({ o }: { o: Olympiad }) {
  // TODO(api): GET /api/olympiads/:id/leaderboard?top=3 — winners are server-ranked.
  const top3 = getLeaderboard(o, null, "all-india", 3).slice(0, 3);
  const topper = top3[0];
  return (
    <div className="flex flex-col" style={{ gap: 16, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>National winners</span>
        <span className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--success-500)", textTransform: "uppercase", letterSpacing: 0.4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: "var(--success-500)" }} /> Results out
        </span>
      </div>

      <Podium top3={top3} maxScore={o.maxScore} />

      <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textAlign: "center", lineHeight: 1.5 }}>
        Out of {formatCount(o.participantCount)} who took it · topper scored {topper.score}/{o.maxScore}
      </span>
    </div>
  );
}

// Pre-event spec, demoted to a collapsed accordion once results are out — kept
// for reference (pattern, prizes, certificates) but no longer the headline.
function EventDetails({ o }: { o: Olympiad }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col" style={{ borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)", overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full"
        style={{ padding: 16, background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Event details</span>
        <ChevronDown size={18} style={{ color: "var(--muted-foreground)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div className="flex flex-col" style={{ gap: 20, padding: "0 16px 16px" }}>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.6 }}>{o.description}</p>

              <div className="flex flex-col" style={{ gap: 12 }}>
                <InfoRow icon={CalendarClock} label="Held on" value={formatDateTime(o.startsAt)} />
                <InfoRow icon={Clock} label="Duration" value={`${o.durationMinutes} min`} />
                <InfoRow icon={FileText} label="Questions" value={`${o.questionCount} · ${o.maxScore} marks`} />
                <InfoRow icon={FileText} label="Marking" value={o.pattern} />
                <div className="flex flex-wrap" style={{ gap: 8, marginTop: 2 }}>
                  {o.sections.map((sec) => <SubjectChip key={sec} label={sec} />)}
                </div>
              </div>

              <div className="flex flex-col" style={{ gap: 12 }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4 }}>Prizes</span>
                <PrizeList prizes={o.prizes} />
              </div>

              <div className="flex flex-col" style={{ gap: 12 }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4 }}>Certificates</span>
                <CertList o={o} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubjectChip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--foreground)",
      padding: "4px 12px", borderRadius: 9999,
      backgroundColor: "var(--card-bg-secondary)", border: "0.5px solid var(--border)",
    }}>{label}</span>
  );
}

function CertList({ o }: { o: Olympiad }) {
  return (
    <>
      <CertRow icon={Award} title="Participation" sub="Everyone who attempts" accent="var(--warning-500)" />
      <div style={{ height: "0.5px", backgroundColor: "var(--border)" }} />
      <CertRow icon={Medal} title="Rank" sub={`Top ${o.rankCertThreshold.toLocaleString("en-IN")} nationally`} accent="var(--warning-500)" />
      <div className="flex items-center" style={{ gap: 6, marginTop: 2 }}>
        <CheckCircle2 size={13} style={{ color: "var(--success-500)" }} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>Auto-issued · verifiable</span>
      </div>
    </>
  );
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", overflow: "hidden", gap: 12, backgroundColor: "var(--background)" }}>
      <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>Olympiad not found</span>
      <button onClick={onBack} style={{ color: "var(--primary-400)", background: "none", border: "none", cursor: "pointer", fontSize: "var(--text-sm)" }}>
        Back to Olympiads
      </button>
    </div>
  );
}
