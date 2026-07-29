/**
 * AI Tutor home teaser — a passive, 3-slide visual carousel shown once on
 * the home screen, purely to give a taste of what the course is before
 * asking for a click. Deliberately NOT interactive (no step-by-step
 * problem, no real practice attempt) — that's a different, separate
 * "handholding journey" concept, not this. Skip is always available; the
 * only real action is the final CTA into the course.
 *
 * Each slide's hero is a REAL image, not an abstract icon — screenshots of
 * the actual product (slides 2-3), since a genuine screenshot builds more
 * familiarity and interest than a generic illustration ever could. Slides 2
 * and 3 both use the same real "Real Numbers" chapter thread (Proving √p is
 * irrational → the 4ⁿ practice problem) as the rest of this build, so the
 * two feature slides point at the same real content a student would
 * actually land on.
 *
 * Slide 1 is a real side-by-side comparison, not a single photo: the left
 * image is a composite of real, verified crops from the actual NCERT
 * jemh101.pdf (the chapter-1 title box + the real "1.1 Introduction" /
 * "1.2 The Fundamental Theorem of Arithmetic" / "1.3 Revisiting Irrational
 * Numbers" section headings, each cropped from its own real page — see
 * scratchpad build notes), and the right image is a real screenshot of the
 * app's own chapter-home view for the exact same chapter, showing the same
 * "1.2"/"1.3" section labels. The point is proving the 1:1 structural match
 * directly, not just asserting it in copy.
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
    // Comparison pair instead of a single image — see file header.
    images: [
      { src: "/promo-textbook-skeleton.jpg", alt: "Real crops from the actual NCERT textbook (jemh101.pdf) — Chapter 1 title and its real 1.1/1.2/1.3 section headings", label: "The real textbook", bg: "#ffffff" },
      { src: "/promo-app-chapter.jpg", alt: "Real screenshot — the app's chapter view for the same chapter, same section labels", label: "In the app", bg: "#0a0a0a" },
    ],
    headline: "Your exact textbook, chapter by chapter",
    caption: "Every chapter, every section — arranged exactly like your real NCERT textbook, so nothing here feels unfamiliar.",
  },
  {
    icon: Video,
    accent: "#9254de",
    gradient: "linear-gradient(160deg, #170a28 0%, #2d1457 100%)",
    image: "/promo-explain.jpg",
    imageAlt: "Real screenshot — the AI tutor explaining 'Proving √p is irrational', with a follow-up question box",
    headline: "A real tutor for every topic",
    caption: "Watch a tutor explain each concept — and ask anything, anytime you're stuck.",
  },
  {
    icon: ListChecks,
    accent: "#13c2c2",
    gradient: "linear-gradient(160deg, #04211f 0%, #08403d 100%)",
    image: "/promo-practice.jpg",
    imageAlt: "Real screenshot — a step-by-step practice problem being solved",
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
        <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: "8px 32px 0" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
              style={{ maxWidth: 300, width: "100%" }}
            >
              {current.images ? (
                // Side-by-side real comparison (slide 1 only) — two frames,
                // each labelled, so the 1:1 structural match is shown, not
                // just claimed in copy.
                <div className="flex items-start" style={{ width: "100%", gap: 10, marginBottom: 16 }}>
                  {current.images.map((img) => (
                    <div key={img.src} className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="relative flex items-start justify-center"
                        style={{
                          width: "100%", aspectRatio: "3 / 4", borderRadius: 14, overflow: "hidden",
                          background: img.bg,
                          border: `1.5px solid color-mix(in srgb, ${current.accent} 45%, transparent)`,
                          boxShadow: `0 10px 24px -8px color-mix(in srgb, ${current.accent} 35%, transparent)`,
                        }}
                      >
                        {/* object-fit: contain, not cover — this is a real
                            side-by-side proof (rule 0c-style discipline: no
                            content may be silently cropped out of a "look,
                            it's the same real structure" comparison). The
                            textbook composite is landscape and the app
                            screenshot is portrait, so contain (not cover)
                            is the only way both stay fully legible inside
                            the same 3:4 frame. */}
                        <img src={img.src} alt={img.alt} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "rgba(255,255,255,0.65)", marginTop: 8 }}>{img.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                // Real screenshot / real course photo — not an abstract icon.
                // Fixed 3:4 frame with object-fit:cover so both single-image
                // slides read as one consistent card treatment.
                <div
                  className="relative"
                  style={{
                    width: "100%", aspectRatio: "3 / 4", borderRadius: 18, overflow: "hidden", marginBottom: 22,
                    border: `1.5px solid color-mix(in srgb, ${current.accent} 45%, transparent)`,
                    boxShadow: `0 12px 32px -8px color-mix(in srgb, ${current.accent} 35%, transparent)`,
                  }}
                >
                  <img src={current.image} alt={current.imageAlt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div
                    className="flex items-center justify-center absolute"
                    style={{
                      bottom: 10, right: 10, width: 38, height: 38, borderRadius: "50%",
                      background: `color-mix(in srgb, ${current.accent} 30%, black)`,
                      border: `1.5px solid color-mix(in srgb, ${current.accent} 60%, transparent)`,
                      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                    }}
                  >
                    <Icon style={{ width: 18, height: 18, color: current.accent, strokeWidth: 2 }} />
                  </div>
                </div>
              )}

              <p style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--white)", textAlign: "center", margin: "0 0 10px", lineHeight: 1.3 }}>
                {current.headline}
              </p>
              <p style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.7)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
                {current.caption}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots + Next/CTA */}
        <div className="flex flex-col items-center shrink-0" style={{ padding: "16px 24px calc(28px + env(safe-area-inset-bottom))", gap: 18 }}>
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
