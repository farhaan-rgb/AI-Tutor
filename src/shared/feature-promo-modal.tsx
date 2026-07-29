/**
 * AI Tutor promo popup — shown once on the home screen to pull attention
 * toward the guided "try it" journey rather than just the Discover listing.
 * Outcome-framed copy (rule: name what the product solves, not a feature
 * list) mirroring the same value props used on the Discover cards and
 * curriculum-preview screen, kept to the single strongest 3, not all 10
 * discussed earlier — a promo popup gets a few seconds of attention, not a
 * full pitch.
 *
 * Shown once per browser (localStorage flag), not on every visit — a promo
 * that reappears every time you open the app reads as nagging, not
 * inviting. "Reset demo" clears the flag so the pitch can be re-shown.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Clock, ListChecks, X } from "lucide-react";

export const PROMO_DISMISSED_KEY = "ai_tutor_promo_dismissed";

const VALUE_PROPS = [
  { icon: Clock, text: "Ask anytime — no waiting for tuition hours" },
  { icon: Sparkles, text: "Every problem solved step by step" },
  { icon: ListChecks, text: "Every real question in the book, so nothing surprises you" },
];

export function FeaturePromoModal() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(PROMO_DISMISSED_KEY) === "1") return;
    // A short delay so this doesn't slam into view the instant the screen
    // paints — long enough to register as "the app noticed I'm here," not
    // long enough to miss it entirely on a quick visit.
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    localStorage.setItem(PROMO_DISMISSED_KEY, "1");
    setVisible(false);
  }

  function tryIt() {
    localStorage.setItem(PROMO_DISMISSED_KEY, "1");
    setVisible(false);
    navigate("/ai-tutor/try-it");
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 200, padding: 20 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 340, borderRadius: 20,
              background: "var(--card)", border: "1px solid var(--border)",
              boxShadow: "var(--elevation-xl)", overflow: "hidden",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{ height: 120, background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)", position: "relative" }}
            >
              <button
                onClick={dismiss}
                className="flex items-center justify-center"
                style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.2)", border: "none", cursor: "pointer" }}
                aria-label="Dismiss"
              >
                <X style={{ width: 15, height: 15, color: "var(--white)" }} />
              </button>
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center justify-center"
                style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }}
              >
                <Sparkles style={{ width: 28, height: 28, color: "var(--white)" }} />
              </motion.div>
            </div>

            <div style={{ padding: "20px 22px 22px" }}>
              <p style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", margin: "0 0 6px", lineHeight: 1.3 }}>
                Never stuck on a problem again
              </p>
              <p style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", margin: "0 0 16px", lineHeight: 1.4 }}>
                Meet your AI Tutor — a real teacher for every concept and problem in your NCERT textbook.
              </p>

              <div className="flex flex-col" style={{ gap: 10, marginBottom: 20 }}>
                {VALUE_PROPS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center" style={{ gap: 10 }}>
                    <div className="flex items-center justify-center shrink-0" style={{ width: 26, height: 26, borderRadius: 8, background: "color-mix(in srgb, var(--primary) 14%, var(--card))", border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}>
                      <Icon style={{ width: 13, height: 13, color: "var(--primary)" }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--foreground)", lineHeight: 1.3 }}>{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={tryIt}
                className="flex items-center justify-center"
                style={{ width: "100%", height: 46, borderRadius: 12, background: "var(--primary)", border: "none", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>Try it now — takes 2 minutes</span>
              </button>
              <button
                onClick={dismiss}
                className="flex items-center justify-center"
                style={{ width: "100%", height: 32, marginTop: 6, background: "transparent", border: "none", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>Maybe later</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
