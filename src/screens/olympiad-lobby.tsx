/**
 * Olympiad Lobby — the single pre-exam page for a live Olympiad. Everyone
 * gathers here before the common start instant. Shows a live countdown,
 * candidate social proof, and the essential rules recap (this is also the
 * instructions — there's no separate instructions screen in the Olympiad
 * path). The "Start exam" gate is hard two-sided: locked until T-0, open only
 * during the live window (start → start+grace), closed after. Starting hands
 * off directly to the reused take engine.
 *
 * Route: /olympiad/:olympiadId/lobby
 */

import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { Lock, Users, Clock, FileText, ShieldCheck } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import {
  getOlympiadById, olympiadStatus, useOlympiadState, formatCount,
} from "../shared/olympiads";
import { OlympiadSeal, StatusPill, CountdownBlocks, OlympiadHeader, olympiadBack } from "./olympiad-ui";

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
  const registered = state.isRegistered(o.id);
  const attempt = state.getAttempt(o.id);
  const canStart = s.canEnter && !attempt && registered;

  // ~62% of registered are "online" — believable social proof.
  const onlineCount = Math.round(o.participantCount * 0.62);

  function gateState(): { label: string; sub: string; tone: "wait" | "go" | "closed" | "done" } {
    if (attempt) return { label: "You've already submitted", sub: "One attempt per registration.", tone: "done" };
    if (!registered) return { label: "Register to take part", sub: "You haven't registered for this Olympiad.", tone: "closed" };
    if (s.isUpcoming) return { label: "Start unlocks at T-0", sub: "The paper stays sealed until everyone starts together.", tone: "wait" };
    if (s.canEnter) return { label: "Start exam", sub: "The exam is live — start now.", tone: "go" };
    return { label: "Entry closed", sub: "The live window has ended.", tone: "closed" };
  }
  const gate = gateState();

  function onStart() {
    if (!canStart || !o) return;
    // Straight into the take engine — no separate instructions screen.
    navigate(`/my-test-series/oly-${o.id}/mock/exam/take`);
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="Exam lobby" onBack={() => olympiadBack(navigate, `/olympiad/${o.id}`)}
          right={<div style={{ paddingRight: 8 }}><StatusPill phase={s.phase} /></div>} />
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 140px", gap: 16 }}>
        {/* Hero countdown */}
        <div className="flex flex-col items-center text-center" style={{
          gap: 12, padding: 24, borderRadius: 16,
          backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
        }}>
          <OlympiadSeal o={o} size={56} />
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>{o.title}</span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
            {s.isUpcoming ? "Exam starts in" : s.canEnter ? "Live window closes in" : "Window closed"}
          </span>
          {s.isUpcoming && <CountdownBlocks to={o.startsAt} accent={o.accent} />}
          {s.canEnter && <CountdownBlocks to={s.windowEndsAt} accent="var(--error-500)" />}
          <span className="flex items-center" style={{ gap: 8, fontSize: "var(--text-xs)", color: "var(--muted-foreground)", marginTop: 4 }}>
            <Users size={13} /> {formatCount(onlineCount)} candidates in the lobby
          </span>
        </div>

        {/* Rules recap — this is the only pre-exam info (no separate
            instructions screen). Keep it to the essentials. */}
        <div className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Before you start</span>
          <Rule icon={FileText} text={`${o.questionCount} questions · ${o.maxScore} marks · ${o.pattern}`} />
          <Rule icon={Clock} text={`${o.durationMinutes} minutes · timer auto-submits at the end`} />
          <Rule icon={ShieldCheck} text="Server-timed — tab switches & refreshes don't pause the clock" />
          <Rule icon={Lock} text={`Single attempt · no late entry once the ${o.graceMinutes}-min grace passes`} />
        </div>
      </div>

      {/* Sticky Start gate */}
      <div className="fixed bottom-0 left-0 right-0" style={{
        backdropFilter: "blur(16px)",
        backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
        borderTop: "0.5px solid var(--border)",
        padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
      }}>
        <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ gap: 8 }}>
          {/* Status line only when the action is gated — when you can start, the button speaks for itself */}
          {!canStart && gate.tone !== "done" && (
            <span role="status" aria-live="polite" style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textAlign: "center" }}>
              {gate.sub}
            </span>
          )}
          {gate.tone === "done" ? (
            <button type="button" onClick={() => navigate(`/olympiad/${o.id}/result`)}
              className="flex items-center justify-center w-full"
              style={{ height: 44, borderRadius: 12, border: "none", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)", backgroundColor: "var(--primary-500)", cursor: "pointer" }}>
              View your result
            </button>
          ) : (
            <motion.button
              type="button"
              whileTap={canStart ? { scale: 0.98 } : undefined}
              onClick={onStart}
              disabled={!canStart}
              className="flex items-center justify-center w-full"
              style={{
                height: 44, borderRadius: 12, border: "none",
                fontSize: "var(--text-sm)", fontWeight: 600,
                cursor: canStart ? "pointer" : "default",
                color: canStart ? "var(--white)" : "var(--disabled-text)",
                backgroundColor: canStart ? "var(--primary-500)" : "var(--disabled-bg)",
              }}
            >
              {gate.label}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

function Rule({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <div className="flex items-center" style={{ gap: 12 }}>
      <Icon size={15} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
      <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>{text}</span>
    </div>
  );
}
