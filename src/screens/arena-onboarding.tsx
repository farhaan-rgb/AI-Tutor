/**
 * Arena Onboarding — the only real decision is which SUBJECTS to compete in.
 * Your DIVISION (class/exam) is inferred but correctable via a clear bottom-sheet
 * picker — it's the fairness group you compete inside, and it decides which
 * subjects are offered. Subjects carry icon + accent so the screen reads lively,
 * not like a form.
 *
 * Route: /arena/onboarding
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Check, GraduationCap, ChevronDown, X as XIcon } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { useArenaState, getDivision, getSubject, subjectsForDivision, DIVISIONS, type DivisionId } from "../shared/arena";
import { OlympiadHeader, OlympiadIcon } from "./olympiad-ui";
import { arenaBack } from "./arena-ui";

export function Component() {
  const navigate = useNavigate();
  const { state, place } = useArenaState();
  const managing = state.onboarded && state.subjects.length > 0;

  const [divId, setDivId] = useState<DivisionId>(state.divisionId);
  const [showDivSheet, setShowDivSheet] = useState(false);
  const division = getDivision(divId);
  const offered = subjectsForDivision(divId);
  const divChanged = divId !== state.divisionId;
  const [picked, setPicked] = useState<string[]>(
    managing ? state.subjects.filter((s) => offered.includes(s)) : [offered[0]],
  );

  function chooseDivision(id: DivisionId) {
    setDivId(id);
    setShowDivSheet(false);
    // Reset subjects to the new division's offering (old standings won't carry).
    if (id !== state.divisionId) setPicked([subjectsForDivision(id)[0]]);
    else setPicked(state.subjects.filter((s) => subjectsForDivision(id).includes(s)));
  }
  function toggle(id: string) {
    // No cap — every division offers ≤3 subjects, so a "max 3" never bound
    // anything. Pick any subset (Save just needs ≥1).
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }
  function onContinue() {
    if (!picked.length) return;
    place(picked, divId);
    navigate("/arena", { replace: true });
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title={managing ? "Your subjects" : "Join the Arena"} onBack={() => arenaBack(navigate, managing ? "/arena" : "/classes")} />
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "20px 16px 120px", gap: 20 }}>
        {/* Division — a clear "Competing in" selector → bottom-sheet picker */}
        <div className="flex flex-col" style={{ gap: 6 }}>
          <motion.button whileTap={{ scale: 0.99 }} type="button" onClick={() => setShowDivSheet(true)}
            className="flex items-center w-full text-left" style={{
              gap: 12, padding: "12px 14px", borderRadius: 12, cursor: "pointer",
              backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
            }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "color-mix(in srgb, var(--primary-500) 14%, transparent)" }}>
              <GraduationCap size={18} style={{ color: "var(--primary-400)" }} />
            </div>
            <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 1 }}>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Competing in</span>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>{division.label}</span>
            </div>
            <span className="flex items-center shrink-0" style={{ gap: 4, fontSize: "var(--text-xs)", color: "var(--primary-400)", fontWeight: 600 }}>
              Change <ChevronDown size={14} style={{ color: "var(--primary-400)" }} />
            </span>
          </motion.button>
          {divChanged && (
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--warning-500)", padding: "0 4px" }}>
              Changing your class resets your standings.
            </span>
          )}
        </div>

        {/* Subjects — the hero decision, with icon + accent for life. No cap:
            every division offers ≤3 subjects, so a "max 3" never restricted. */}
        <div className="flex flex-col" style={{ gap: 4 }}>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--foreground)" }}>Pick your subjects</span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>Compete in the ones you want · change anytime</span>
        </div>

        <div className="grid grid-cols-2" style={{ gap: 10 }}>
          {offered.map((sid) => {
            const subject = getSubject(sid);
            const sel = picked.includes(sid);
            return (
              <motion.button
                key={sid}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggle(sid)}
                className="flex items-center text-left"
                style={{
                  minHeight: 64, borderRadius: 12, cursor: "pointer", gap: 10, padding: "0 12px",
                  backgroundColor: sel ? `color-mix(in srgb, ${subject.accent} 14%, var(--card))` : "var(--card)",
                  border: sel ? `1.5px solid ${subject.accent}` : "0.5px solid var(--border)",
                  transition: "background-color 0.15s, border-color 0.15s",
                }}
              >
                <div className="flex items-center justify-center shrink-0" style={{
                  width: 38, height: 38, borderRadius: 10,
                  backgroundColor: `color-mix(in srgb, ${subject.accent} ${sel ? 22 : 14}%, transparent)`,
                }}>
                  <OlympiadIcon iconKey={subject.iconKey} size={20} color={subject.accent} />
                </div>
                <span className="flex-1" style={{ fontSize: "var(--text-base)", fontWeight: 600, color: sel ? "var(--foreground)" : "var(--foreground)" }}>{subject.label}</span>
                {sel && (
                  <div className="flex items-center justify-center shrink-0" style={{ width: 20, height: 20, borderRadius: 9999, backgroundColor: subject.accent }}>
                    <Check size={13} style={{ color: "var(--white)", strokeWidth: 3 }} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0" style={{
        backdropFilter: "blur(16px)", backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
        borderTop: "0.5px solid var(--border)", padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
      }}>
        <div className="w-full max-w-2xl mx-auto">
          <motion.button
            whileTap={picked.length ? { scale: 0.98 } : undefined}
            disabled={!picked.length}
            onClick={onContinue}
            className="flex items-center justify-center w-full"
            style={{
              height: 44, borderRadius: 12, border: "none",
              fontSize: "var(--text-sm)", fontWeight: 600,
              cursor: picked.length ? "pointer" : "default",
              color: picked.length ? "var(--white)" : "var(--disabled-text)",
              backgroundColor: picked.length ? "var(--primary-500)" : "var(--disabled-bg)",
            }}
          >
            {managing ? "Save" : "Enter Arena"}
          </motion.button>
        </div>
      </div>

      {/* Division picker — bottom sheet. Explains WHY the class matters (fairness). */}
      <AnimatePresence>
        {showDivSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDivSheet(false)}
              className="fixed inset-0" style={{ backgroundColor: "var(--overlay-heavy)", zIndex: 200 }}
            />
            <motion.div
              role="dialog" aria-modal="true" aria-label="Choose your class or exam"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed bottom-0 left-0 right-0 overflow-hidden"
              style={{ backgroundColor: "var(--card)", borderRadius: "20px 20px 0 0", zIndex: 201, boxShadow: "0 -8px 40px var(--shadow-overlay)" }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)", margin: "12px auto 0" }} />
              <div className="flex items-start justify-between" style={{ padding: "8px 16px 12px" }}>
                <div className="flex flex-col" style={{ gap: 2 }}>
                  <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>Your class or exam</span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>You compete only against others in the same group.</span>
                </div>
                <button onClick={() => setShowDivSheet(false)} aria-label="Close" className="flex items-center justify-center shrink-0"
                  style={{ width: 32, height: 32, background: "none", border: "none", cursor: "pointer", marginRight: -4 }}>
                  <XIcon size={20} style={{ color: "var(--muted-foreground)" }} />
                </button>
              </div>
              <div style={{ padding: "0 16px calc(16px + env(safe-area-inset-bottom))" }}>
                <div style={{ borderRadius: 12, overflow: "hidden", backgroundColor: "var(--card-bg-secondary)" }}>
                  {DIVISIONS.map((d, i) => {
                    const sel = d.id === divId;
                    return (
                      <button key={d.id} onClick={() => chooseDivision(d.id)}
                        className="flex items-center justify-between w-full text-left"
                        style={{
                          minHeight: 52, padding: "0 16px", gap: 8, cursor: "pointer", background: "transparent",
                          border: "none",
                          borderTop: i === 0 ? "none" : "0.5px solid color-mix(in srgb, var(--foreground) 8%, transparent)",
                        }}>
                        <span style={{ fontSize: "var(--text-base)", fontWeight: sel ? 700 : 500, color: sel ? "var(--primary-300)" : "var(--foreground)" }}>{d.label}</span>
                        {sel && <Check size={18} style={{ color: "var(--primary-400)", flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
