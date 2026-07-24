/**
 * Olympiad Register — a lightweight bottom SHEET (not a full page) opened from
 * the detail screen, so the event stays visible behind it. Minimal-friction:
 * name pre-filled, one-tap confirm → an in-sheet success state. GYD Max events
 * for non-members route to the plan paywall instead. Identity ask is
 * proportional to stakes (name for free; name + roll for Max / prize events).
 *
 * The /olympiad/:id/register route now just redirects to the detail page — the
 * form lives in `RegisterSheet`, rendered by the detail screen on demand.
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router";
import { motion } from "motion/react";
import { ShieldCheck, Crown, Lock, X, CheckCircle2 } from "lucide-react";
import { olympiadStatus, useOlympiadState, type Olympiad } from "../shared/olympiads";
import { useGydMax } from "../shared/feedback-storage";

/** The /register route is vestigial now — bounce to the event; Register opens a sheet. */
export function Component() {
  const { olympiadId } = useParams<{ olympiadId: string }>();
  return <Navigate to={`/olympiad/${olympiadId ?? ""}`} replace />;
}

export function RegisterSheet({ o, onClose }: { o: Olympiad; onClose: () => void }) {
  const navigate = useNavigate();
  const state = useOlympiadState();
  const gyd = useGydMax();

  // TODO(api): prefill from GET /api/me/profile
  const [name, setName] = useState("Rahul Sharma");
  const [grade, setGrade] = useState("Class 12");
  const [city, setCity] = useState("Mumbai");
  const [roll, setRoll] = useState("");
  const [done, setDone] = useState(false);

  const s = olympiadStatus(o);
  const isMax = o.entryType === "max";
  const locked = isMax && !gyd.active;            // Max event, non-member → upsell gate
  const canSubmit = name.trim().length > 1 && (!isMax || roll.trim().length >= 4);
  const enabled = locked || (canSubmit && !s.registrationClosed);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  function onSubmit() {
    if (locked) { onClose(); navigate("/paywall-v2"); return; }
    if (!canSubmit) return;
    state.register(o.id);
    setDone(true);
  }

  return (
    <div className="fixed inset-0" role="dialog" aria-modal="true" aria-label="Register" style={{ zIndex: 100, fontFamily: "var(--font-family-inter)" }}>
      {/* backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, backgroundColor: "var(--overlay-strong)" }}
      />
      {/* panel */}
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="absolute bottom-0 left-0 right-0 w-full max-w-2xl mx-auto flex flex-col"
        style={{
          backgroundColor: "var(--card)", borderTopLeftRadius: 20, borderTopRightRadius: 20,
          maxHeight: "90dvh", paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        }}
      >
        {/* drag handle */}
        <div className="flex justify-center" style={{ paddingTop: 12 }}>
          <span style={{ width: 36, height: 4, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)" }} />
        </div>

        {done ? (
          <SuccessBody o={o} onClose={onClose} />
        ) : (
          <>
            {/* header */}
            <div className="flex items-center justify-between" style={{ padding: "8px 16px 12px" }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>
                Register{o.entryType === "free" ? " · Free" : ""}
              </span>
              <button onClick={onClose} aria-label="Close" className="flex items-center justify-center"
                style={{ width: 32, height: 32, background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* form */}
            <div className="flex flex-col overflow-y-auto" style={{ padding: "0 16px 16px", gap: 12 }}>
              <Field label="Full name (as on certificate)" value={name} onChange={setName} />
              <Field label="Class / grade" value={grade} onChange={setGrade} />
              <Field label="City" value={city} onChange={setCity} />
              {isMax && <Field label="Roll / ID number" value={roll} onChange={setRoll} placeholder="Required for prize events" />}

              {isMax && (
                <div className="flex items-start" style={{
                  gap: 12, padding: 12, borderRadius: 12,
                  backgroundColor: "color-mix(in srgb, var(--purple-500) 10%, transparent)",
                  border: "0.5px solid color-mix(in srgb, var(--purple-500) 25%, transparent)",
                }}>
                  {gyd.active
                    ? <Crown size={16} style={{ color: "var(--purple-500)", marginTop: 2, flexShrink: 0 }} />
                    : <Lock size={16} style={{ color: "var(--purple-500)", marginTop: 2, flexShrink: 0 }} />}
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                    {gyd.active
                      ? "Included in your GYD Max plan — register free, no extra payment."
                      : "Exclusive to GYD Max members. Get the plan to enter this and every future Max event."}
                  </span>
                </div>
              )}

              <div className="flex items-start" style={{ gap: 12, padding: 12, borderRadius: 12, backgroundColor: "var(--card-bg-secondary)", border: "0.5px solid var(--border)" }}>
                <ShieldCheck size={16} style={{ color: "var(--success-500)", marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                  {isMax
                    ? "Your name + roll appear on the rankings and your rank certificate. One attempt per registration."
                    : "Your name is printed on your certificate. One attempt per registration."}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div style={{ padding: "4px 16px 0" }}>
              <motion.button
                type="button"
                whileTap={enabled ? { scale: 0.98 } : undefined}
                onClick={onSubmit}
                disabled={!enabled}
                className="flex items-center justify-center w-full"
                style={{
                  height: 44, borderRadius: 12, border: "none", gap: 8,
                  fontSize: "var(--text-sm)", fontWeight: 600,
                  cursor: enabled ? "pointer" : "default",
                  color: enabled ? "var(--white)" : "var(--disabled-text)",
                  backgroundColor: !enabled ? "var(--disabled-bg)" : locked ? "var(--purple-500)" : "var(--primary-500)",
                }}
              >
                {locked && <Crown size={16} style={{ color: "var(--white)" }} />}
                {locked ? "Get GYD Max" : "Confirm registration"}
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function SuccessBody({ o, onClose }: { o: Olympiad; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center text-center" style={{ padding: "16px 24px 8px", gap: 12 }}>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
        <CheckCircle2 size={48} style={{ color: "var(--success-500)" }} strokeWidth={2} />
      </motion.div>
      <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)" }}>You're registered</span>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", maxWidth: 300, lineHeight: 1.5 }}>
        We'll remind you before {o.title} begins. Enter from here when the window opens.
      </span>
      <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onClose}
        className="flex items-center justify-center w-full" style={{
          height: 44, borderRadius: 12, border: "none", marginTop: 4, cursor: "pointer",
          backgroundColor: "var(--primary-500)", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600,
        }}>
        Done
      </motion.button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="flex flex-col" style={{ gap: 8 }}>
      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          height: 44, padding: "0 16px", borderRadius: 12,
          backgroundColor: "var(--card-bg-secondary)", border: "0.5px solid var(--border)",
          color: "var(--foreground)", fontSize: "var(--text-sm)", outline: "none",
          fontFamily: "var(--font-family-inter)",
        }}
      />
    </label>
  );
}
