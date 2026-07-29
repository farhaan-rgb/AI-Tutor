/**
 * Guided handhold tour — a coachmark banner reused across chapter-home,
 * Explain, and Solve. Manually triggered only (a "Take the tour" button on
 * chapter-home), never auto-fired on enrollment. State travels as URL query
 * params (?tour=1&step=N), same convention this app already uses for
 * demo/preview/sku/chapter — not a Context/Provider, since the tour spans
 * three independent route screens.
 *
 * Two modes per step:
 *  - Self-paced: a CTA button the student taps to move on (used where there's
 *    no specific real action to wait for, e.g. the curriculum overview).
 *  - Real-action-gated (`waiting`): no button — the card just names the real
 *    thing to go do (tap the Jump sheet, watch the video, solve the problem),
 *    and the screen advances the tour itself once that real state actually
 *    changes. This is the point of a *handhold* tour — it should watch for
 *    the student actually doing the thing, not just clicking through slides.
 *
 * Placed inline in each screen's header column (not fixed/overlaid) so it
 * never fights the floating tutor button, bottom input bars, or the
 * freemium unlock banner for z-index/space.
 */
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { typo } from "./premium-ui";

export const TOTAL_TOUR_STEPS = 5;

export function TourCard({
  step,
  title,
  body,
  ctaLabel,
  onCta,
  waiting,
  onExit,
}: {
  step: number;
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
  waiting?: boolean;
  onExit: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="shrink-0"
        style={{ margin: "0 20px 14px", position: "relative" }}
      >
        <div
          style={{
            borderRadius: 14,
            padding: "12px 14px",
            background: "color-mix(in srgb, var(--primary) 8%, var(--card))",
            border: "1.5px solid color-mix(in srgb, var(--primary) 35%, transparent)",
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <span style={{ ...typo.badgeStyle, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--primary)" }}>
              Guided tour · Step {step} of {TOTAL_TOUR_STEPS}
            </span>
            <button
              onClick={onExit}
              aria-label="End tour"
              className="flex items-center justify-center"
              style={{ width: 22, height: 22, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer" }}
            >
              <X style={{ width: 14, height: 14, color: "var(--muted-foreground)" }} />
            </button>
          </div>

          <p style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)", marginBottom: 4 }}>{title}</p>
          <p style={{ ...typo.metaStyle, lineHeight: 1.5, marginBottom: waiting || ctaLabel ? 10 : 0 }}>{body}</p>

          {waiting ? (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--primary)" }}
              />
              <span style={{ ...typo.metaStyle, fontWeight: "var(--font-weight-semibold)", color: "var(--primary)" }}>Go ahead — try it</span>
            </div>
          ) : ctaLabel && onCta ? (
            <button
              onClick={onCta}
              style={{
                ...typo.badgeStyle, padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                background: "var(--primary)", color: "var(--white)",
              }}
            >
              {ctaLabel}
            </button>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Pulsing highlight ring — dropped in as a sibling inside a `position:
// relative` wrapper around the REAL element the tour is pointing at (the
// actual Jump-to-Lesson button, the actual Explain icon, ...), not a
// standalone illustration. This is what makes a step read as "tap THIS",
// not just "tap something described in a card somewhere else on screen".
export function TourHighlightRing({ radius = 16 }: { radius?: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.25, 0.9, 0.25], scale: [0.97, 1.05, 0.97] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute pointer-events-none"
      style={{
        inset: -6, borderRadius: radius, zIndex: 5,
        border: "2px solid var(--primary)",
        boxShadow: "0 0 14px color-mix(in srgb, var(--primary) 55%, transparent)",
      }}
    />
  );
}

// Small anchored callout with a caret — placed as a normal sibling right
// next to (not fixed/globally positioned over) the real element it's
// pointing at, so "pointing" is guaranteed by markup order + a couple of CSS
// offsets, not by measuring the DOM. `caretSide="top"` means the real
// target sits ABOVE this bubble (the common case: point up at a header
// button); `"bottom"` points down at something below.
export function TourPointer({
  step,
  text,
  waiting = true,
  ctaLabel,
  onCta,
  onExit,
  caretSide = "top",
  align = "end",
  width = 220,
}: {
  step: number;
  text: string;
  waiting?: boolean;
  ctaLabel?: string;
  onCta?: () => void;
  onExit: () => void;
  caretSide?: "top" | "bottom";
  align?: "start" | "end" | "center";
  width?: number;
}) {
  // Center alignment uses a calc()-based left offset, not `transform:
  // translateX(-50%)` — framer-motion drives this element's own `transform`
  // for the entrance animation (the initial/animate `y`), and it overwrites
  // any static `transform` set via the style prop, silently breaking the
  // centering (the bubble rendered, just shifted off to one side).
  const horizontal = align === "start" ? { left: 0 } : align === "end" ? { right: 0 } : { left: `calc(50% - ${width / 2}px)` };
  const caretHorizontal = align === "center" ? { left: "calc(50% - 6px)" } : align === "start" ? { left: 18 } : { right: 18 };
  return (
    <motion.div
      initial={{ opacity: 0, y: caretSide === "top" ? -6 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="absolute"
      style={{
        zIndex: 60, width,
        ...(caretSide === "top" ? { top: "calc(100% + 12px)" } : { bottom: "calc(100% + 12px)" }),
        ...horizontal,
      }}
    >
      {caretSide === "top" ? (
        <div style={{ position: "absolute", top: -6, ...caretHorizontal, width: 12, height: 12, background: "var(--card)", borderLeft: "1.5px solid color-mix(in srgb, var(--primary) 35%, transparent)", borderTop: "1.5px solid color-mix(in srgb, var(--primary) 35%, transparent)", transform: "rotate(45deg)" }} />
      ) : (
        <div style={{ position: "absolute", bottom: -6, ...caretHorizontal, width: 12, height: 12, background: "var(--card)", borderRight: "1.5px solid color-mix(in srgb, var(--primary) 35%, transparent)", borderBottom: "1.5px solid color-mix(in srgb, var(--primary) 35%, transparent)", transform: "rotate(45deg)" }} />
      )}
      <div
        style={{
          position: "relative", borderRadius: 12, padding: "10px 12px",
          background: "var(--card)", border: "1.5px solid color-mix(in srgb, var(--primary) 35%, transparent)",
          boxShadow: "0 8px 20px -6px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <span style={{ ...typo.badgeStyle, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--primary)", fontSize: 9 }}>
            Step {step} of {TOTAL_TOUR_STEPS}
          </span>
          <button
            onClick={onExit}
            aria-label="End tour"
            className="flex items-center justify-center shrink-0"
            style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer" }}
          >
            <X style={{ width: 12, height: 12, color: "var(--muted-foreground)" }} />
          </button>
        </div>
        <p style={{ ...typo.metaStyle, lineHeight: 1.4, color: "var(--foreground)", marginBottom: ctaLabel ? 8 : 0 }}>{text}</p>
        {waiting && !ctaLabel && (
          <div className="flex items-center gap-1.5" style={{ marginTop: 2 }}>
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }}
            />
            <span style={{ ...typo.metaStyle, fontSize: 10, fontWeight: "var(--font-weight-semibold)", color: "var(--primary)" }}>Tap it</span>
          </div>
        )}
        {ctaLabel && onCta && (
          <button
            onClick={onCta}
            style={{
              ...typo.badgeStyle, fontSize: 11, padding: "6px 12px", borderRadius: 16, border: "none", cursor: "pointer",
              background: "var(--primary)", color: "var(--white)",
            }}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}
