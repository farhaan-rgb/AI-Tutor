/**
 * CourseOverflowMenu — 3-dot overflow icon in the in-course header.
 * Replaces `RateThisCourseBanner` as the always-available entry.
 *
 * Menu items: About this course · Give feedback · Share with a friend.
 *
 * Also hosts:
 *   - Auto-rise of the review-write sheet (carried over from RateThisCourseBanner)
 *   - Share sheet for the manual share entry
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { MoreVertical, Info, MessageSquareText, Share2, X as XIcon, Award, CheckCircle2, Circle } from "lucide-react";
import { createPortal } from "react-dom";
import {
  useReviews,
  consumePendingAutorise,
  setAutoriseCooldown,
} from "../shared/feedback-storage";
import { ReviewWriteSheet } from "./review-write-sheet";
import { ShareSheet } from "./share-sheet";
import type { ProductKind } from "../shared/referral-copy";

// When provided, a "Certificate" row appears in the menu. The certificate
// unlocks only once every subject in the course is completed.
export interface CertificateMenuConfig {
  courseId: string;
  subjects: { id: string; name: string }[];
  completedSubjectIds: string[];
}

interface Props {
  courseId: string;
  courseTitle: string;
  // Where "About this course" navigates. Each parent passes its own destination.
  aboutHref?: string;
  // Which product kind drives the share message template.
  productKind?: ProductKind;
  isDesktop?: boolean;
  // Pass to surface a certificate-eligibility row + status sheet.
  certificate?: CertificateMenuConfig;
}

export function CourseOverflowMenu({
  courseId,
  courseTitle,
  aboutHref,
  productKind = "test-prep",
  isDesktop,
  certificate,
}: Props) {
  const navigate = useNavigate();
  const reviews = useReviews(courseId);
  const own = reviews.userOwnReview;

  const [menuOpen, setMenuOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);

  const wasAutoRisen = useRef(false);

  // Auto-rise review sheet — carried over from RateThisCourseBanner.
  // `own` is intentionally excluded from deps: we only want to consume the
  // pending-autorise flag once per courseId mount. Re-firing on `own` flips
  // (e.g., after a submit) would risk re-opening the sheet immediately.
  useEffect(() => {
    if (own) return;
    if (consumePendingAutorise(courseId)) {
      wasAutoRisen.current = true;
      const raf = requestAnimationFrame(() => setReviewOpen(true));
      return () => cancelAnimationFrame(raf);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  function handleReviewClose() {
    setReviewOpen(false);
    if (wasAutoRisen.current) {
      setAutoriseCooldown(courseId);
    }
    wasAutoRisen.current = false;
  }

  function handleAbout() {
    setMenuOpen(false);
    if (aboutHref) {
      navigate(aboutHref);
    } else {
      // Sensible default — course-detail screen
      navigate("/course-detail");
    }
  }

  function handleFeedback() {
    setMenuOpen(false);
    setReviewOpen(true);
  }

  function handleShare() {
    setMenuOpen(false);
    setShareOpen(true);
  }

  function handleCertificate() {
    setMenuOpen(false);
    setCertOpen(true);
  }

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => setMenuOpen(true)}
        aria-label="Course options"
        style={{
          width: 44, height: 44, borderRadius: 9999,
          backgroundColor: "transparent", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0,
          position: "relative",
        }}
      >
        <MoreVertical size={20} style={{ color: "var(--foreground)" }} strokeWidth={2} />
        {own && (
          <span
            aria-hidden
            style={{
              position: "absolute", top: 8, right: 8,
              width: 8, height: 8, borderRadius: 9999,
              backgroundColor: "var(--success-500)",
              border: "2px solid var(--background)",
            }}
          />
        )}
      </motion.button>

      <OverflowMenuPopover
        title={courseTitle}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          {
            icon: <Info size={20} />,
            label: "About this course",
            onClick: handleAbout,
          },
          ...(certificate
            ? [{
                icon: <Award size={20} />,
                label: "Certificate",
                onClick: handleCertificate,
              }]
            : []),
          {
            icon: <MessageSquareText size={20} />,
            label: own ? "Edit your feedback" : "Give feedback",
            onClick: handleFeedback,
            trailingDot: !!own,
          },
          {
            icon: <Share2 size={20} />,
            label: "Refer a friend",
            onClick: handleShare,
          },
        ]}
      />

      {certificate && (
        <CertificateStatusSheet
          open={certOpen}
          onClose={() => setCertOpen(false)}
          courseTitle={courseTitle}
          config={certificate}
          onView={() => { setCertOpen(false); navigate(`/course-complete/${certificate.courseId}`); }}
        />
      )}

      <ReviewWriteSheet
        open={reviewOpen}
        onClose={handleReviewClose}
        packId={courseId}
        packTitle={courseTitle}
        isDesktop={isDesktop}
      />

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        trigger="manual"
        productKind={productKind}
        productName={courseTitle}
        isDesktop={isDesktop}
      />
    </>
  );
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  trailingDot?: boolean;
  destructive?: boolean;
}

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  title?: string;
}

function OverflowMenuPopover({ open, onClose, items, title }: PopoverProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              backgroundColor: "color-mix(in srgb, var(--background) 50%, transparent)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 101,
              backgroundColor: "var(--card)",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              maxWidth: 720, marginLeft: "auto", marginRight: "auto",
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
            }}
          >
            <div aria-hidden style={{
              padding: "12px 0 4px",
              display: "flex", justifyContent: "center",
            }}>
              <div style={{
                width: 36, height: 4, borderRadius: 9999,
                backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)",
              }} />
            </div>

            {/* Header — title on left, close X on right (matches Recording
                Name / Add Attachment sheet language used elsewhere). */}
            {title && (
              <div className="flex items-center justify-between" style={{ padding: "8px 16px 12px" }}>
                <h3 style={{
                  margin: 0, flex: 1, minWidth: 0,
                  fontSize: "var(--text-base)", fontWeight: 700,
                  color: "var(--foreground)",
                  letterSpacing: -0.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    width: 32, height: 32, borderRadius: 9999,
                    backgroundColor: "transparent", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", padding: 0,
                    color: "var(--muted-foreground)",
                    marginRight: -8,
                  }}
                >
                  <XIcon size={20} />
                </button>
              </div>
            )}

            <div
              aria-hidden
              style={{
                height: 0.5,
                backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)",
                margin: "0 16px",
              }}
            />

            {/* Action rows wrapped in a card-secondary container — matches
                the "Options" / "Recording Name" / "Add Attachment" sheet
                pattern. Inline dividers separate the rows; no divider after
                the last row. */}
            <div style={{ padding: "16px" }}>
              <div
                className="flex flex-col"
                style={{
                  borderRadius: 12,
                  backgroundColor: "var(--card-bg-secondary)",
                  overflow: "hidden",
                }}
              >
                {items.map((item, i) => (
                  <div key={i}>
                    <motion.button
                      whileTap={{ scale: 0.99 }}
                      onClick={item.onClick}
                      className="flex items-center w-full"
                      style={{
                        gap: 12,
                        padding: "0 16px",
                        minHeight: 56,
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div className="flex items-center" style={{ flex: 1, gap: 8, minWidth: 0 }}>
                        <span style={{
                          fontSize: "var(--text-base)",
                          fontWeight: 500,
                          color: item.destructive ? "var(--error-500)" : "var(--foreground)",
                        }}>
                          {item.label}
                        </span>
                        {item.trailingDot && (
                          <span
                            aria-hidden
                            style={{
                              width: 8, height: 8, borderRadius: 9999,
                              backgroundColor: "var(--success-500)",
                            }}
                          />
                        )}
                      </div>
                      <span
                        aria-hidden
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 24, height: 24,
                          color: item.destructive ? "var(--error-500)" : "var(--foreground)",
                        }}
                      >
                        {item.icon}
                      </span>
                    </motion.button>
                    {i < items.length - 1 && (
                      <div
                        aria-hidden
                        style={{
                          height: 0.5,
                          backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)",
                          margin: "0 16px",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ─────────── CERTIFICATE STATUS SHEET ───────────
   Surfaced from the overflow "Certificate" row. The certificate is gated on
   completing EVERY subject in the course — until then this explains what's
   left, naming the pending subjects so the student knows exactly what to
   finish. Once all subjects are done it offers to view the earned cert. */

interface CertSheetProps {
  open: boolean;
  onClose: () => void;
  courseTitle: string;
  config: CertificateMenuConfig;
  onView: () => void;
}

function CertificateStatusSheet({ open, onClose, courseTitle, config, onView }: CertSheetProps) {
  if (typeof document === "undefined") return null;

  const total = config.subjects.length;
  const completed = config.subjects.filter((s) => config.completedSubjectIds.includes(s.id));
  const doneCount = completed.length;
  const remaining = config.subjects.filter((s) => !config.completedSubjectIds.includes(s.id));
  const earned = total > 0 && doneCount === total;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              backgroundColor: "color-mix(in srgb, var(--background) 50%, transparent)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 101,
              backgroundColor: "var(--card)",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              maxWidth: 720, marginLeft: "auto", marginRight: "auto",
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
            }}
          >
            {/* Drag handle */}
            <div aria-hidden style={{ padding: "12px 0 4px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: 36, height: 4, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between" style={{ padding: "8px 16px 12px" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", letterSpacing: -0.2 }}>
                Certificate
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 32, height: 32, borderRadius: 9999, backgroundColor: "transparent", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
                  color: "var(--muted-foreground)", marginRight: -8,
                }}
              >
                <XIcon size={20} />
              </button>
            </div>

            <div aria-hidden style={{ height: 0.5, backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)", margin: "0 16px" }} />

            <div className="flex flex-col" style={{ padding: 16, gap: 16 }}>
              {/* Status hero */}
              <div className="flex flex-col items-center text-center" style={{ gap: 8, paddingTop: 8 }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 64, height: 64, borderRadius: 9999,
                    backgroundColor: earned
                      ? "color-mix(in srgb, var(--success-500) 16%, transparent)"
                      : "color-mix(in srgb, var(--warning-500) 16%, transparent)",
                  }}
                >
                  <Award size={32} style={{ color: earned ? "var(--success-500)" : "var(--warning-500)" }} />
                </div>
                <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>
                  {earned ? "Certificate ready" : "Certificate locked"}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.5, maxWidth: 320 }}>
                  {earned
                    ? `You've completed every subject in ${courseTitle}. Your certificate is ready to view and share.`
                    : `Your ${courseTitle} certificate will appear here once you complete all ${total} subjects.`}
                </span>
              </div>

              {/* Progress + subject checklist */}
              <div className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 12, backgroundColor: "var(--card-bg-secondary)" }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>Course progress</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>
                    {doneCount} of {total} subjects
                  </span>
                </div>

                {/* Progress bar */}
                <div aria-hidden style={{ height: 6, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 9999, backgroundColor: earned ? "var(--success-500)" : "var(--primary)" }} />
                </div>

                {/* Subject rows */}
                <div className="flex flex-col" style={{ gap: 8, marginTop: 4 }}>
                  {config.subjects.map((s) => {
                    const isDone = config.completedSubjectIds.includes(s.id);
                    return (
                      <div key={s.id} className="flex items-center" style={{ gap: 8 }}>
                        {isDone
                          ? <CheckCircle2 size={18} style={{ color: "var(--success-500)", flexShrink: 0 }} />
                          : <Circle size={18} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />}
                        <span style={{ fontSize: "var(--text-sm)", color: isDone ? "var(--foreground)" : "var(--muted-foreground)" }}>
                          {s.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pending nudge — names what's left */}
              {!earned && remaining.length > 0 && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.5, textAlign: "center" }}>
                  Still to complete: {remaining.map((s) => s.name).join(", ")}
                </span>
              )}

              {/* View CTA — only when earned */}
              {earned && (
                <button
                  type="button"
                  onClick={onView}
                  className="flex items-center justify-center w-full"
                  style={{
                    height: 44, gap: 8, borderRadius: 12, cursor: "pointer",
                    background: "var(--gradient-primary-btn)", border: "none", color: "var(--white)",
                    fontSize: "var(--text-sm)", fontWeight: 600,
                  }}
                >
                  <Award size={18} />
                  View certificate
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
