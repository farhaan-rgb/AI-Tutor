/**
 * FeedbackSheet — generic bottom sheet shell for the 3 feedback features.
 * Provides: backdrop + slide-up animation + drag handle + scrollable body +
 * sticky footer. Caller renders the body + footer content.
 *
 * Used by: wishlist-sheet, live-class-feedback-sheet, review-write-sheet.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  open: boolean;
  onClose: () => void;
  isDesktop?: boolean;
  children: React.ReactNode;
  // Optional sticky footer rendered below scrollable body.
  footer?: React.ReactNode;
  // Override max height (default 88vh — leaves a peek of the page behind).
  maxHeight?: string;
}

export function FeedbackSheet({ open, onClose, isDesktop, children, footer, maxHeight = "88vh" }: Props) {
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Render via portal so `position: fixed` is anchored to the viewport, not
  // to any transformed ancestor in the parent's render tree (motion.div
  // animations, DevicePreviewToolbar scale, etc. all create containing
  // blocks that would otherwise scope our fixed-position sheet).
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              backgroundColor: "color-mix(in srgb, var(--background) 60%, transparent)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 101,
              backgroundColor: "var(--card)",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              maxHeight,
              maxWidth: isDesktop ? 720 : undefined,
              marginLeft: isDesktop ? "auto" : undefined,
              marginRight: isDesktop ? "auto" : undefined,
              display: "flex", flexDirection: "column",
            }}
            // Drag-to-dismiss (touch + mouse)
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
          >
            {/* Drag handle */}
            <div aria-hidden style={{
              padding: "12px 0 4px",
              display: "flex", justifyContent: "center", flexShrink: 0,
            }}>
              <div style={{
                width: 36, height: 4, borderRadius: 9999,
                backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)",
              }} />
            </div>

            {/* Scrollable body */}
            <div style={{
              flex: 1, minHeight: 0, overflowY: "auto",
              padding: "8px 16px 16px",
            }}>
              {children}
            </div>

            {/* Sticky footer */}
            {footer && (
              <div style={{
                flexShrink: 0,
                padding: "12px 16px",
                paddingBottom: "max(16px, env(safe-area-inset-bottom))",
                borderTop: "0.5px solid color-mix(in srgb, var(--foreground) 10%, transparent)",
                backgroundColor: "var(--card)",
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
