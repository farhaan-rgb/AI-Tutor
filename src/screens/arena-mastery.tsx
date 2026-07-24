/**
 * Arena · Mastery Map — per-concept progress across ALL the subjects your active
 * track covers (an exam isn't one subject — JEE = Physics/Chemistry/Maths). You
 * see you're improving even when you don't win, and weak areas surface for
 * targeted practice. One overall % up top, then a section per subject (weakest
 * concept first).
 *
 * Route: /arena/mastery
 */

import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import {
  useArenaState, getMastery, getDivision, getSubject, activeLevel,
  type MasteryConcept, type LevelInfo, type Subject,
} from "../shared/arena";
import { OlympiadHeader, OlympiadIcon } from "./olympiad-ui";
import { arenaBack } from "./arena-ui";

function barColor(pct: number): string {
  return pct < 45 ? "var(--error-500)" : pct < 70 ? "var(--warning-500)" : "var(--success-500)";
}

export function Component() {
  const navigate = useNavigate();
  const { state } = useArenaState();
  const division = getDivision(state.divisionId);
  const level = activeLevel(state);
  const activeSubject = getSubject(state.activeSubjectId);
  const subjects = getMastery(state);
  const allConcepts = subjects.flatMap((s) => s.concepts);
  const overall = allConcepts.length ? Math.round(allConcepts.reduce((s, m) => s + m.pct, 0) / allConcepts.length) : 0;
  // Weakest concepts (with their subject) — drives the targeted-practice CTA.
  const focus = subjects
    .flatMap((s) => s.concepts.map((c) => ({ ...c, subjectId: s.subjectId })))
    .filter((m) => m.pct < 50)
    .sort((a, b) => a.pct - b.pct);
  const topFocus = focus[0];
  const overallColor = barColor(overall);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="Skills" onBack={() => arenaBack(navigate)} />
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 32px", gap: 16 }}>
        {/* Level — your SKILL headline (drives question difficulty). Mastery below
            is the per-concept detail behind it. */}
        <LevelHero subject={activeSubject} info={level} />

        {/* Overall — across the whole track */}
        <div className="flex items-center" style={{ gap: 16, padding: 16, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
          <div className="flex items-center justify-center shrink-0" style={{
            width: 64, height: 64, borderRadius: 9999,
            background: `conic-gradient(${overallColor} ${overall * 3.6}deg, var(--card-bg-secondary) 0deg)`,
          }}>
            <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 9999, backgroundColor: "var(--card)" }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)" }}>{overall}%</span>
            </div>
          </div>
          <div className="flex flex-col" style={{ gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>{division.label} mastery</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
              {subjects.map((s) => s.label).join(" · ")}
            </span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
              {focus.length > 0 ? `${focus.length} concept${focus.length > 1 ? "s" : ""} to shore up` : "Solid across the board"}
            </span>
          </div>
        </div>

        {/* One section per subject the track covers */}
        {subjects.map((s) => {
          const avg = Math.round(s.concepts.reduce((a, c) => a + c.pct, 0) / s.concepts.length);
          return (
            <div key={s.subjectId} className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
              {/* Subject header — name + avg + slim avg bar */}
              <div className="flex flex-col" style={{ gap: 8 }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>{s.label}</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
                    {avg}% avg
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 9999, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${avg}%` }} transition={{ duration: 0.5 }}
                    style={{ height: "100%", borderRadius: 9999, backgroundColor: barColor(avg) }} />
                </div>
              </div>
              <div aria-hidden style={{ height: 0.5, backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)" }} />
              {/* Concepts — compact aligned rows, weakest first */}
              <div className="flex flex-col" style={{ gap: 2 }}>
                {s.concepts.map((m) => <ConceptRow key={m.concept} m={m} />)}
              </div>
            </div>
          );
        })}

        {/* Targets the weakest concept when there's one to shore up. (Text-only, 40h/12r;
            avoids the word "Practice" — that's a separate tab.) */}
        <button type="button"
          onClick={() => navigate(topFocus ? `/arena/play?subject=${topFocus.subjectId}&focus=${encodeURIComponent(topFocus.concept)}` : "/arena/play")}
          className="flex items-center justify-center w-full"
          style={{ height: 44, borderRadius: 12, border: "none", cursor: "pointer", backgroundColor: "var(--primary-500)", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
          {topFocus ? `Sharpen ${topFocus.concept}` : "Start daily sprint"}
        </button>
      </div>
    </div>
  );
}

/** Level hero — your skill in the active subject. Level only ever grows and it's
 *  what decides how hard your questions are; the mastery breakdown below is why. */
function LevelHero({ subject, info }: { subject: Subject; info: LevelInfo }) {
  return (
    <div className="flex flex-col relative" style={{
      flexShrink: 0, gap: 14, padding: 16, borderRadius: 12, overflow: "hidden",
      // Mesh material — two accent light sources over the dark card for depth.
      background: `radial-gradient(135% 95% at 4% -10%, color-mix(in srgb, ${subject.accent} 34%, transparent) 0%, transparent 54%), radial-gradient(120% 95% at 106% 112%, color-mix(in srgb, ${subject.accent} 20%, transparent) 0%, transparent 56%), linear-gradient(160deg, color-mix(in srgb, ${subject.accent} 13%, var(--card)) 0%, var(--card) 70%)`,
      border: `1px solid color-mix(in srgb, ${subject.accent} 34%, transparent)`,
      boxShadow: `inset 0 1px 0 color-mix(in srgb, var(--white) 12%, transparent)`,
    }}>
      <div className="flex items-center" style={{ gap: 12, position: "relative", zIndex: 1 }}>
        <div className="flex items-center justify-center shrink-0" style={{
          width: 48, height: 48, borderRadius: 12,
          background: `radial-gradient(circle at 50% 28%, color-mix(in srgb, ${subject.accent} 80%, var(--white)) 0%, ${subject.accent} 52%, color-mix(in srgb, ${subject.accent} 58%, var(--black)) 100%)`,
          border: `1.5px solid color-mix(in srgb, ${subject.accent} 45%, var(--white))`,
          boxShadow: `0 0 22px color-mix(in srgb, ${subject.accent} 50%, transparent)`,
        }}>
          <OlympiadIcon iconKey={subject.iconKey} size={24} color="var(--white)" />
        </div>
        <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: `color-mix(in srgb, ${subject.accent} 55%, var(--white))` }}>{subject.label}</span>
          <span style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>Level {info.level}</span>
        </div>
      </div>
      <div className="flex flex-col" style={{ gap: 7, position: "relative", zIndex: 1 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>Skill progress</span>
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--foreground)" }}>{info.toNextLabel}</span>
        </div>
        <div style={{ height: 6, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--black) 32%, transparent)", overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${info.pct}%` }} transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ height: "100%", borderRadius: 9999, background: `linear-gradient(90deg, ${subject.accent} 0%, color-mix(in srgb, ${subject.accent} 65%, var(--white)) 100%)`, boxShadow: `0 0 12px color-mix(in srgb, ${subject.accent} 60%, transparent)` }} />
        </div>
      </div>
    </div>
  );
}

function ConceptRow({ m }: { m: MasteryConcept }) {
  const color = barColor(m.pct);
  return (
    <div className="flex items-center" style={{ gap: 12, minHeight: 36 }}>
      <span className="truncate" style={{ flex: 1, minWidth: 0, fontSize: "var(--text-sm)", color: "var(--foreground)" }}>{m.concept}</span>
      {/* aligned mini track — same width every row for easy comparison */}
      <div style={{ width: 88, height: 6, borderRadius: 9999, backgroundColor: "var(--card-bg-secondary)", overflow: "hidden", flexShrink: 0 }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 0.5 }}
          style={{ height: "100%", borderRadius: 9999, backgroundColor: color }} />
      </div>
      <span style={{ width: 40, textAlign: "right", fontSize: "var(--text-xs)", fontWeight: 700, color, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{m.pct}%</span>
    </div>
  );
}
