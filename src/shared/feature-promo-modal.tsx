/**
 * AI Tutor home teaser — a passive, 3-slide visual carousel shown once on
 * the home screen, purely to give a taste of what the course is before
 * asking for a click. Deliberately NOT interactive (no step-by-step
 * problem, no real practice attempt) — that's a different, separate
 * "handholding journey" concept, not this. Skip is always available; the
 * only real action is the final CTA into the course.
 *
 * Three slides, matching exactly what should be communicated here:
 *  1. The real textbook curriculum is replicated chapter-by-chapter — a
 *     student sees the same structure they already know, not something
 *     unfamiliar.
 *  2. Every topic has a tutor-led video, plus the ability to ask anything.
 *  3. Every real problem in the book is available — solve it yourself and
 *     get feedback, or ask the AI tutor to solve it for you.
 *
 * Shown once per browser (localStorage flag) — "Reset demo" clears it so
 * the pitch can be re-shown.
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Video, ListChecks, ArrowRight } from "lucide-react";

export const PROMO_DISMISSED_KEY = "ai_tutor_promo_dismissed";
const SKU = "ncert-10-maths";

const SLIDES = [
  {
    icon: BookOpen,
    accent: "#597ef7",
    gradient: "linear-gradient(160deg, #0a1128 0%, #142657 100%)",
    headline: "Your exact textbook, chapter by chapter",
    caption: "Every chapter, every section — arranged exactly like your real NCERT textbook, so nothing here feels unfamiliar.",
  },
  {
    icon: Video,
    accent: "#9254de",
    gradient: "linear-gradient(160deg, #170a28 0%, #2d1457 100%)",
    headline: "A real tutor for every topic",
    caption: "Watch a tutor explain each concept on video — and ask anything, anytime you're stuck.",
  },
  {
    icon: ListChecks,
    accent: "#13c2c2",
    gradient: "linear-gradient(160deg, #04211f 0%, #08403d 100%)",
    headline: "Every problem in the book — your way",
    caption: "Solve it yourself and get real feedback, or ask your AI tutor to solve it for you, step by step.",
  },
];

export function FeaturePromoModal() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(() => localStorage.getItem(PROMO_DISMISSED_KEY) !== "1");
  const [slide, setSlide] = useState(0);

  function dismiss() {
    localStorage.setItem(PROMO_DISMISSED_KEY, "1");
    setVisible(false);
  }

  function goToCourse() {
    localStorage.setItem(PROMO_DISMISSED_KEY, "1");
    setVisible(false);
    navigate(`/ai-tutor/curriculum-preview?demo=ai-tutor&sku=${SKU}`);
  }

  if (!visible) return null;

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex flex-col"
        style={{ zIndex: 200, background: current.gradient, transition: "background 0.4s ease" }}
      >
        {/* Skip — always available, every slide */}
        <div className="flex justify-end shrink-0" style={{ padding: "18px 20px 0" }}>
          <button
            onClick={dismiss}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 20, padding: "7px 16px", cursor: "pointer" }}
          >
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "rgba(255,255,255,0.85)" }}>Skip</span>
          </button>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: "0 32px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
              style={{ maxWidth: 320 }}
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="flex items-center justify-center"
                style={{
                  width: 116, height: 116, borderRadius: "50%", marginBottom: 28,
                  background: `radial-gradient(circle, color-mix(in srgb, ${current.accent} 30%, transparent) 0%, transparent 70%)`,
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: 84, height: 84, borderRadius: "50%", background: `color-mix(in srgb, ${current.accent} 22%, black)`, border: `1.5px solid color-mix(in srgb, ${current.accent} 50%, transparent)` }}
                >
                  <Icon style={{ width: 38, height: 38, color: current.accent, strokeWidth: 1.75 }} />
                </div>
              </motion.div>

              <p style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--white)", textAlign: "center", margin: "0 0 12px", lineHeight: 1.3 }}>
                {current.headline}
              </p>
              <p style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.7)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
                {current.caption}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots + Next/CTA */}
        <div className="flex flex-col items-center shrink-0" style={{ padding: "0 24px calc(28px + env(safe-area-inset-bottom))", gap: 20 }}>
          <div className="flex items-center" style={{ gap: 7 }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: i === slide ? 20 : 7, height: 7, borderRadius: 4, border: "none", cursor: "pointer",
                  background: i === slide ? current.accent : "rgba(255,255,255,0.25)",
                  transition: "all 0.25s ease",
                }}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={goToCourse}
              className="flex items-center justify-center gap-2"
              style={{ width: "100%", height: 50, borderRadius: 14, background: current.accent, border: "none", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>Explore the course</span>
              <ArrowRight style={{ width: 16, height: 16, color: "var(--white)" }} />
            </button>
          ) : (
            <button
              onClick={() => setSlide((s) => s + 1)}
              className="flex items-center justify-center gap-2"
              style={{ width: "100%", height: 50, borderRadius: 14, background: "rgba(255,255,255,0.12)", border: `1.5px solid ${current.accent}`, cursor: "pointer" }}
            >
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}>Next</span>
              <ArrowRight style={{ width: 16, height: 16, color: "var(--white)" }} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
