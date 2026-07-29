/**
 * AI Tutor guided journey — "Watch → Practice → Enroll," reached from the
 * home popup (feature-promo-modal.tsx). A hand-held, linear trial of the
 * actual product before asking for enrollment, using one real worked
 * example end to end: Maths Ch.1's "Unique prime factorisation" concept and
 * its own real Practice problem (does 4ⁿ ever end in 0?) — the same example
 * in both steps, so the journey tells one coherent story (learn it, then
 * solve it yourself) rather than two disconnected samples.
 *
 * Deliberately self-contained rather than embedding the real
 * ai-tutor-explain.tsx screen — that file is under active, unrelated
 * development elsewhere (a video/narration feature) — so the Explain step's
 * content here is duplicated from its real TOPIC_COPY entry, not invented.
 * The Practice step reuses the actual PracticeProblem data directly (a safe
 * import — ai-tutor-solve.tsx isn't shared with that other work), rendered
 * as a simplified step-reveal rather than the full app's trap-picker UI,
 * since this is a guided single pass, not the real practice flow itself.
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2, X } from "lucide-react";
import { StatusBar, typo } from "../shared/premium-ui";
import { PRACTICE_SETS } from "./ai-tutor-solve";

const SKU = "ncert-10-maths";
const CRASH_PRICE = 999;
const CRASH_ORIGINAL_PRICE = 1999;

// Real content, duplicated from ai-tutor-explain.tsx's TOPIC_COPY["unique-factorisation"]
// (see file header for why this isn't imported directly).
const EXPLAIN_STEP = {
  title: "Unique prime factorisation",
  chapterLabel: "Real Numbers · Chapter 1",
  intro:
    "Every composite number breaks down into primes in exactly one way, ignoring order — that's the Fundamental Theorem of Arithmetic. Write those primes in any order you like — 2 × 3 × 5 × 7 is the same factorisation as 7 × 5 × 3 × 2, still one fact about the number.",
  exampleLabel: "Factor tree · 32760",
  exampleLines: ["32760 = 2 × 2 × 2 × 3 × 3 × 5 × 7 × 13", "= 2³ × 3² × 5 × 7 × 13"],
  closing:
    "That's what uniqueness actually guarantees — once you know a number's real prime factors, that's the only real answer there is. Next, let's use this to answer a real question: can 4ⁿ ever end in the digit 0?",
};

const PRACTICE_PROBLEM = PRACTICE_SETS["unique-factorisation"][0];

const STEPS = ["Watch", "Practice", "Enroll"] as const;

export function Component() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [revealedSteps, setRevealedSteps] = useState(0);

  function exit() {
    navigate("/classes-v1?demo=ai-tutor");
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
      <StatusBar />

      <div className="flex items-center gap-3 shrink-0" style={{ padding: "10px 20px 12px" }}>
        <button onClick={exit} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "var(--radius-button)", background: "var(--card)", border: "1px solid var(--border)" }}>
          <ArrowLeft style={{ width: 18, height: 18, color: "var(--foreground)" }} />
        </button>
        <div className="flex-1 flex items-center" style={{ gap: 6 }}>
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center" style={{ gap: 4 }}>
              <div style={{ width: "100%", height: 4, borderRadius: 2, background: i <= step ? "var(--primary)" : "var(--border)" }} />
              <span style={{ fontSize: "var(--text-2xs)", color: i === step ? "var(--primary)" : "var(--muted-foreground)", fontWeight: i === step ? "var(--font-weight-semibold)" : "var(--font-weight-normal)" }}>{label}</span>
            </div>
          ))}
        </div>
        <button onClick={exit} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "var(--radius-button)", background: "var(--card)", border: "1px solid var(--border)" }} aria-label="Exit">
          <X style={{ width: 16, height: 16, color: "var(--muted-foreground)" }} />
        </button>
      </div>
      <div style={{ height: 1, background: "var(--border)" }} />

      <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px 24px" }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="watch" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                <Sparkles style={{ width: 14, height: 14, color: "var(--primary)" }} />
                <span style={typo.metaStyle}>{EXPLAIN_STEP.chapterLabel}</span>
              </div>
              <p style={{ ...typo.pageTitleStyle, marginBottom: 14 }}>{EXPLAIN_STEP.title}</p>
              <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", lineHeight: 1.6, marginBottom: 18 }}>{EXPLAIN_STEP.intro}</p>

              <div style={{ padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 20 }}>
                <p style={{ ...typo.metaStyle, fontWeight: "var(--font-weight-semibold)", color: "var(--primary)", marginBottom: 10 }}>{EXPLAIN_STEP.exampleLabel}</p>
                {EXPLAIN_STEP.exampleLines.map((line, i) => (
                  <p key={i} style={{ ...typo.cardBodyStyle, color: "var(--foreground)", fontFamily: "monospace", fontSize: "var(--text-sm)", margin: "4px 0" }}>{line}</p>
                ))}
              </div>

              <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", lineHeight: 1.6 }}>{EXPLAIN_STEP.closing}</p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="practice" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                <Sparkles style={{ width: 14, height: 14, color: "var(--primary)" }} />
                <span style={typo.metaStyle}>{PRACTICE_PROBLEM.label} · Real Numbers</span>
              </div>
              <p style={{ ...typo.pageTitleStyle, marginBottom: 14 }}>Try it yourself</p>
              <div style={{ padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 16 }}>
                <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", lineHeight: 1.5 }}>{PRACTICE_PROBLEM.questionText}</p>
              </div>

              <div className="flex flex-col" style={{ gap: 10 }}>
                {PRACTICE_PROBLEM.steps!.slice(0, revealedSteps).map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 14, borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)" }}>
                    <p style={{ ...typo.metaStyle, marginBottom: 4 }}>{s.prompt}</p>
                    <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", fontWeight: "var(--font-weight-semibold)" }}>{s.answer}</p>
                    {s.trap && (
                      <p style={{ ...typo.metaStyle, marginTop: 6, color: "var(--warning-600, var(--warning))" }}>
                        Common mistake: {s.trap.wrongGuess} — {s.trap.hint}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              {revealedSteps < PRACTICE_PROBLEM.steps!.length ? (
                <button
                  onClick={() => setRevealedSteps((n) => n + 1)}
                  className="flex items-center justify-center gap-2"
                  style={{ width: "100%", height: 46, borderRadius: 12, background: "var(--card)", border: "1.5px solid var(--primary)", cursor: "pointer", marginTop: 14 }}
                >
                  <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary)" }}>
                    {revealedSteps === 0 ? "Show the first step" : "Show the next step"}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2" style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "color-mix(in srgb, var(--success) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)" }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: "var(--success)", flexShrink: 0 }} />
                  <span style={{ ...typo.metaStyle, color: "var(--foreground)" }}>{PRACTICE_PROBLEM.verifyLine}</span>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="enroll" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
              <div className="flex items-center justify-center" style={{ marginBottom: 16 }}>
                <div className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)" }}>
                  <Sparkles style={{ width: 30, height: 30, color: "var(--white)" }} />
                </div>
              </div>
              <p style={{ ...typo.pageTitleStyle, textAlign: "center", marginBottom: 6 }}>That's your AI Tutor</p>
              <p style={{ ...typo.cardBodyStyle, color: "var(--muted-foreground)", textAlign: "center", marginBottom: 22, lineHeight: 1.5 }}>
                Every concept explained, every problem solved step by step — for all 14 real chapters of Class 10 Maths, anytime you need it.
              </p>

              <div className="flex items-center justify-between" style={{ padding: "16px 18px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 20 }}>
                <div className="flex flex-col" style={{ gap: 2 }}>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <span style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>₹{CRASH_PRICE.toLocaleString("en-IN")}</span>
                    <div className="flex items-center justify-center" style={{ paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 6, backgroundColor: "var(--warning-alpha-15)", border: "1px solid var(--warning-alpha-30)" }}>
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--warning-600)" }}>50% off</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>₹{CRASH_ORIGINAL_PRICE.toLocaleString("en-IN")}</span>
                </div>
                <span style={{ ...typo.metaStyle }}>X Maths NCERT</span>
              </div>

              <button
                onClick={() => navigate(`/crash-course-enrolled?sku=${SKU}`)}
                className="flex items-center justify-center"
                style={{ width: "100%", height: 48, borderRadius: 12, background: "var(--primary)", border: "none", cursor: "pointer", marginBottom: 10 }}
              >
                <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>Enroll Now</span>
              </button>
              <button
                onClick={() => navigate(`/ai-tutor/curriculum-preview?demo=ai-tutor&sku=${SKU}`)}
                className="flex items-center justify-center"
                style={{ width: "100%", height: 40, background: "transparent", border: "none", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>See the full curriculum first</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step < 2 && (
        <div className="flex items-center shrink-0" style={{ padding: "12px 16px calc(16px + env(safe-area-inset-bottom)) 16px", backgroundColor: "var(--card)", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && revealedSteps < PRACTICE_PROBLEM.steps!.length}
            className="flex items-center justify-center gap-2"
            style={{
              width: "100%", height: 46, borderRadius: 12, border: "none",
              background: step === 1 && revealedSteps < PRACTICE_PROBLEM.steps!.length ? "var(--button-disabled-bg)" : "var(--primary)",
              cursor: step === 1 && revealedSteps < PRACTICE_PROBLEM.steps!.length ? "not-allowed" : "pointer",
              opacity: step === 1 && revealedSteps < PRACTICE_PROBLEM.steps!.length ? 0.6 : 1,
            }}
          >
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>
              {step === 0 ? "Try a real problem" : "See what's included"}
            </span>
            <ArrowRight style={{ width: 16, height: 16, color: "var(--white)" }} />
          </button>
        </div>
      )}
    </div>
  );
}
