/**
 * Review Write Sheet — student rates a course they've purchased and used.
 * Triggered from RateThisCourseBanner on:
 *   - /learning-path (test-prep)
 *   - /crash-course-hub (crash courses)
 *
 * 2-step bottom sheet:
 *   ① 5-star rating
 *   ② Tag chips (optional · Coursera-style structured) + optional 1-line comment
 *   ③ Success — "Thanks. Your review is live."
 *
 * Reviews are always posted under the user's identity (no anonymous mode).
 * Eligibility is caller-enforced — banner shows only on the post-purchase
 * surface.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ShieldCheck, Star, BookOpen } from "lucide-react";
import { FeedbackSheet } from "../app/components/ui/feedback-sheet";
import { RatingPicker } from "../app/components/ui/rating-picker";
import { TagChipGroup } from "../app/components/ui/tag-chip-group";
import { useReviews } from "../shared/feedback-storage";

// Labels under the 5-star picker. Mirrors the face-picker pattern from the
// live-class sheet — gives the user a hint of what each rating means + fills
// what would otherwise be an empty middle band of the sheet.
const STAR_LABELS = ["Poor", "Fair", "OK", "Good", "Great"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  packId: string;
  packTitle: string;
  isDesktop?: boolean;
}

// Praise chips — surfaced when rating ≥ 4 ("what stood out")
const PRAISE_TAGS = [
  { value: "concept-clarity", label: "Concept clarity" },
  { value: "solutions",       label: "Solutions clear" },
  { value: "syllabus",        label: "Full syllabus covered" },
  { value: "shortcut",        label: "Good shortcuts taught" },
  { value: "mock-pattern",    label: "Mock pattern accurate" },
];

// Problem chips — surfaced when rating ≤ 3 ("what went wrong")
const PROBLEM_TAGS = [
  { value: "concept-unclear", label: "Concept unclear" },
  { value: "pace-fast",       label: "Too fast" },
  { value: "shallow",         label: "Shallow coverage" },
  { value: "outdated",        label: "Feels outdated" },
  { value: "support",         label: "Slow doubt-solving" },
];

export function ReviewWriteSheet({ open, onClose, packId, packTitle, isDesktop }: Props) {
  const reviews = useReviews(packId);
  const [rating, setRating] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Rating-only minimum: tag chips + comment are optional enrichment.
  const canSubmit = rating > 0;

  // Adaptive chip pool — matches the live-class feedback pattern (praise
  // vs problem chips don't overlap; we reset selections when crossing
  // the 3↔4 boundary).
  const isLowRating  = rating > 0 && rating <= 3;
  const isHighRating = rating >= 4;
  const chipPool = isLowRating ? PROBLEM_TAGS : isHighRating ? PRAISE_TAGS : [];
  const chipHeading = isLowRating ? "What went wrong?" : isHighRating ? "What stood out?" : "";
  const chipColor   = isLowRating ? "var(--error-500)" : "var(--success-500)";

  function setRatingAndResetTags(next: number) {
    const crossed = (rating <= 3 && next >= 4) || (rating >= 4 && next <= 3);
    if (crossed) setTags([]);
    setRating(next);
  }

  function handleSubmit() {
    // Reviews are always posted under the user's identity — no anonymous mode.
    reviews.submit({ rating, tags, comment: comment.trim(), anonymous: false });
    setSubmitted(true);
  }

  function reset() {
    setRating(0);
    setTags([]);
    setComment("");
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
          Post review
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
            {/* Header — small book-icon tile + headline + subtitle. Gives
                context, fills the otherwise-empty top band, signals what
                kind of feedback this is (course-level, not bug-report). */}
            <div className="flex flex-col items-center" style={{ gap: 10, paddingTop: 4 }}>
              <div className="flex items-center justify-center" style={{
                width: 48, height: 48, borderRadius: 12,
                backgroundColor: "var(--card-bg-secondary)",
              }}>
                <BookOpen size={22} style={{ color: "var(--warning-500)" }} strokeWidth={2} />
              </div>
              <div className="flex flex-col items-center" style={{ gap: 4 }}>
                <h2 style={{
                  fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--foreground)",
                  margin: 0, letterSpacing: -0.3, textAlign: "center",
                }}>
                  Rate {packTitle}
                </h2>
                <p style={{
                  fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
                  margin: 0, lineHeight: 1.45, textAlign: "center", maxWidth: 320,
                }}>
                  Your honest review helps other students choose with confidence.
                </p>
              </div>
            </div>

            {/* Star rating — with labels under each star (mirrors the face
                picker on live-class). Fills the picker band cleanly. */}
            <RatingPicker
              value={rating}
              onChange={setRatingAndResetTags}
              variant="star"
              size={32}
              labels={STAR_LABELS}
            />

            {/* Centerpiece — multi-line textarea. Sized to invite real
                writing (App Store / Coursera / Udemy pattern). Sits ABOVE
                the chip section so users gravitate to writing first, with
                chips as enrichment rather than a shortcut. */}
            {rating > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col"
                style={{ gap: 8 }}
              >
                <span style={{
                  fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)",
                  letterSpacing: 0.8, textTransform: "uppercase",
                }}>
                  Tell other students about it
                </span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isLowRating
                    ? "What didn't work for you? What could be better?"
                    : "What stood out? What do you wish more students knew?"}
                  rows={4}
                  maxLength={500}
                  style={{
                    minHeight: 112,
                    padding: 12,
                    borderRadius: 12, border: "none",
                    backgroundColor: "var(--card-bg-secondary)",
                    color: "var(--foreground)",
                    fontSize: "var(--text-sm)",
                    fontFamily: "inherit",
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.5,
                  }}
                />
                {/* Character counter — quiet, only shows when user starts
                    typing. Lets them know there's room without making it
                    feel like an exam. */}
                {comment.length > 0 && (
                  <span style={{
                    alignSelf: "flex-end",
                    fontSize: "var(--text-2xs)",
                    color: "var(--muted-foreground)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {comment.length} / 500
                  </span>
                )}
              </motion.div>
            )}

            {/* Adaptive chips — demoted to enrichment after the textarea.
                Single motion.div that stays mounted once rating > 0;
                children swap in place on bucket change (no sheet reshape). */}
            {rating > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: 0.04 }}
                className="flex flex-col"
                style={{ gap: 8 }}
              >
                <span style={{
                  fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--muted-foreground)",
                  letterSpacing: 0.8, textTransform: "uppercase",
                }}>
                  {chipHeading} <span style={{ color: "var(--muted-foreground)", fontWeight: 500, letterSpacing: 0, textTransform: "none" }}>· quick tags (optional)</span>
                </span>
                <TagChipGroup
                  options={chipPool.map((o) => ({ ...o, color: chipColor }))}
                  value={tags}
                  onChange={setTags}
                  multi
                />
              </motion.div>
            )}

            {/* Trust */}
            <div className="flex items-center justify-center" style={{ gap: 6, paddingTop: 2 }}>
              <ShieldCheck size={12} style={{ color: "var(--success-500)" }} />
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                Verified buyer · helps other students decide
              </span>
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
            style={{ gap: 12, padding: "32px 16px 24px" }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 9999,
              backgroundColor: "color-mix(in srgb, var(--success-500) 18%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check size={32} style={{ color: "var(--success-500)" }} strokeWidth={3} />
            </div>
            <div className="flex flex-col items-center" style={{ gap: 4, maxWidth: 320 }}>
              <h2 style={{
                fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)",
                margin: 0, letterSpacing: -0.2, textAlign: "center",
              }}>
                Your review is live
              </h2>
              <p style={{
                fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
                margin: 0, lineHeight: 1.45, textAlign: "center",
              }}>
                Thanks — this helps another aspirant decide.
              </p>
            </div>
            <div className="flex items-center" style={{ gap: 4, marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i <= rating ? "var(--warning-500)" : "none"}
                  style={{ color: "var(--warning-500)" }}
                  strokeWidth={1.75}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </FeedbackSheet>
  );
}
