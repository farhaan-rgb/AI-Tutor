/**
 * Wishlist / Request Sheet — general-purpose "tell us anything" bottom sheet.
 * Not tied to courses — users can ask for ANY product, feature, or fix.
 *
 * Triggered from:
 *   - <WishlistCard> at the bottom of marketplace-v1
 *   - empty-state in marketplace-search
 *   - (future) profile / help / live-class — single-textarea makes it reusable
 *
 * Flow:
 *   ① free-text message
 *   ② optional phone (for WhatsApp update when shipped)
 *   ③ submit → success
 *
 * Strict AntD tokens (no rgba/hex), strict 4px grid.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Check, ChevronRight } from "lucide-react";
import { FeedbackSheet } from "../app/components/ui/feedback-sheet";
import { useWishlist } from "../shared/feedback-storage";

interface Props {
  open: boolean;
  onClose: () => void;
  source?: string;
  initialMessage?: string;
  isDesktop?: boolean;
}

export function WishlistSheet({ open, onClose, source = "discover", initialMessage = "", isDesktop }: Props) {
  const wishlist = useWishlist();
  const [message, setMessage] = useState(initialMessage);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = message.trim().length >= 3;

  function handleSubmit() {
    // Phone is not asked here — the logged-in user's number is on record.
    wishlist.submit({
      message: message.trim(),
      contactPhone: "",
      source,
    });
    setSubmitted(true);
  }

  function reset() {
    setMessage("");
    setSubmitted(false);
  }

  return (
    <FeedbackSheet
      open={open}
      onClose={() => { onClose(); reset(); }}
      isDesktop={isDesktop}
      footer={!submitted ? (
        <motion.button
          whileTap={canSubmit ? { scale: 0.98 } : undefined}
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="flex items-center justify-center w-full"
          style={{
            height: 44, borderRadius: 12, border: "none",
            cursor: canSubmit ? "pointer" : "not-allowed",
            backgroundColor: canSubmit ? "var(--primary-500)" : "var(--disabled-bg)",
            fontSize: "var(--text-sm)", fontWeight: 600,
            color: canSubmit ? "var(--white)" : "var(--disabled-text)",
            letterSpacing: 0.2,
            transition: "background-color 0.2s ease",
          }}
        >
          Send
        </motion.button>
      ) : null}
    >
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col"
            style={{ gap: 20 }}
          >
            {/* Header */}
            <div className="flex flex-col items-center" style={{ gap: 12, paddingTop: 4 }}>
              <div className="flex items-center justify-center" style={{
                width: 48, height: 48, borderRadius: 12,
                backgroundColor: "var(--card-bg-secondary)",
              }}>
                <Sparkles size={20} style={{ color: "var(--primary-500)" }} strokeWidth={2} />
              </div>
              <div className="flex flex-col items-center" style={{ gap: 4 }}>
                <h2 style={{
                  fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--foreground)",
                  margin: 0, letterSpacing: -0.3, textAlign: "center",
                }}>
                  What should we add?
                </h2>
                <p style={{
                  fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
                  margin: 0, lineHeight: 1.45, textAlign: "center", maxWidth: 320,
                }}>
                  Tell us what's missing from the marketplace — we prioritize it for the next batch.
                </p>
              </div>
            </div>

            {/* Message — focused on marketplace catalog asks. Placeholder
                primes concrete examples (exam packs, courses, etc.) so the
                signal is actionable for the catalog team. */}
            <div className="flex flex-col" style={{ gap: 8 }}>
              <label style={{
                fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)",
                letterSpacing: 0.8, textTransform: "uppercase",
              }}>
                Your suggestion
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g., RRB NTPC mocks, Spanish learning app, HC Verma Vol 2…"
                rows={4}
                style={{
                  minHeight: 96, padding: 12,
                  borderRadius: 12, border: "none",
                  backgroundColor: "var(--card-bg-secondary)",
                  color: "var(--foreground)",
                  fontSize: "var(--text-sm)",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                  lineHeight: 1.5,
                }}
              />
            </div>

          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="flex flex-col items-center justify-center"
            style={{ gap: 16, padding: "32px 16px 24px" }}
          >
            <div className="flex items-center justify-center" style={{
              width: 64, height: 64, borderRadius: 9999,
              backgroundColor: "color-mix(in srgb, var(--success-500) 16%, transparent)",
            }}>
              <Check size={32} style={{ color: "var(--success-500)" }} strokeWidth={3} />
            </div>
            <div className="flex flex-col items-center" style={{ gap: 4, maxWidth: 320 }}>
              <h2 style={{
                fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)",
                margin: 0, letterSpacing: -0.2, textAlign: "center",
              }}>
                We hear you
              </h2>
              <p style={{
                fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
                margin: 0, lineHeight: 1.45, textAlign: "center",
              }}>
                Thanks — we'll take a look.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </FeedbackSheet>
  );
}

/**
 * WishlistCard — passive inline card. AntD-clean: solid card surface, hairline
 * border, chevron affordance instead of a chunky CTA pill. Reads as a quiet
 * "got something to say?" row, not a marketing banner.
 */
export function WishlistCard({ onTap }: { onTap: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      onClick={onTap}
      className="flex items-center w-full text-left"
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: "var(--card)",
        border: "0.5px solid var(--border)",
        gap: 12, cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <div className="flex items-center justify-center" style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        backgroundColor: "var(--card-bg-secondary)",
      }}>
        <Sparkles size={16} style={{ color: "var(--primary-500)" }} strokeWidth={2} />
      </div>
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3 }}>
          Can't find what you need?
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
          Tell us what to add to the marketplace
        </span>
      </div>
      <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
    </motion.button>
  );
}
