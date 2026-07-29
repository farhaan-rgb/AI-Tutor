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
