/**
 * Live Class Feedback Sheet — auto-rises after a live class ends.
 *
 * Pattern (WhatsApp-style adaptive chips):
 *   ① 5-face rating (Lucide icons — no emojis)
 *   ② Chip set ADAPTS to the rating:
 *       - rating ≤ 3 (Poor/Not great/OK): "What went wrong?" → issue chips
 *       - rating ≥ 4 (Good/Great):        "What stood out?"  → praise chips
 *   ③ Optional 1-line note
 *   ④ Submit → toast → /learning-path
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { FeedbackSheet } from "../app/components/ui/feedback-sheet";
import { RatingPicker, FACE_LABELS } from "../app/components/ui/rating-picker";
import { TagChipGroup, type ChipOption } from "../app/components/ui/tag-chip-group";
import { useClassFeedback } from "../shared/feedback-storage";

interface Props {
  open: boolean;
  onClose: () => void;
  // Receives the submitted rating so the parent can chain into the
  // share sheet for ≥ 4-star ratings (PRD §4 post-positive-feedback trigger).
  onSubmitted?: (rating: number) => void;
  classId: string;
  teacherName?: string;     // accepted but no longer used in copy
  isDesktop?: boolean;
}

// Low-rating reasons — what went wrong.
// "Couldn't see board" was dropped — there's no physical board; the teaching
// surface is a digital whiteboard / slides / shared screen, so "Slides unclear"
// captures the real complaint. "Got disconnected" added based on Tier-2/3
// connectivity persona — top live-class complaint.
const PROBLEM_CHIPS: ChipOption[] = [
  { value: "audio",       label: "Audio issues" },
  { value: "video",       label: "Video lag" },
  { value: "slides",      label: "Slides unclear" },
  { value: "pace",        label: "Too fast" },
  { value: "doubts",      label: "Doubts unanswered" },
  { value: "concept",     label: "Concept unclear" },
  { value: "disconnect",  label: "Got disconnected" },
];

// High-rating reasons — what stood out.
// "Engaging teacher" was dropped — students don't say "engaging"; they say
// the class was easy to follow. "Easy to follow" reads as actual praise from
// a 16yr-old.
const PRAISE_CHIPS: ChipOption[] = [
  { value: "clear",       label: "Clear explanation" },
  { value: "easy",        label: "Easy to follow" },
  { value: "pace-good",   label: "Right pace" },
  { value: "examples",    label: "Good examples" },
  { value: "doubts-good", label: "Doubts answered" },
];

export function LiveClassFeedbackSheet({ open, onClose, onSubmitted, classId, isDesktop }: Props) {
  const feedback = useClassFeedback(classId);
  const [rating, setRating] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Adaptive chip pool. Whenever rating crosses 3↔4 we reset tags because the
  // chip set fundamentally changes (problems vs praise are non-overlapping).
  const isLowRating = rating > 0 && rating <= 3;
  const isHighRating = rating >= 4;
  const chipPool = isLowRating ? PROBLEM_CHIPS : isHighRating ? PRAISE_CHIPS : [];
  const chipHeading = isLowRating ? "What went wrong?" : isHighRating ? "What stood out?" : "";

  function setRatingAndResetTags(next: number) {
    // Reset chips when crossing rating-pool boundary (≤3 ↔ ≥4)
    const crossed = (rating <= 3 && next >= 4) || (rating >= 4 && next <= 3);
    if (crossed) setTags([]);
    setRating(next);
  }

  const canSubmit = rating > 0;

  function handleSubmit() {
    feedback.submit({
      rating,
      // Old shape: techIssues + classIssues. We collapse into a single `tags`
      // array via the legacy field for now — server can split if it cares.
      techIssues: tags,
      classIssues: [],
      comment: comment.trim(),
    });
    setSubmitted(true);
    const submittedRating = rating;
    setTimeout(() => {
      onSubmitted?.(submittedRating);
      reset();
    }, 1400);
  }

  function reset() {
    setRating(0);
    setTags([]);
    setComment("");
    setSubmitted(false);
  }

  function handleSkip() {
    onClose();
    reset();
  }

  return (
    <FeedbackSheet
      open={open}
      onClose={handleSkip}
      isDesktop={isDesktop}
      footer={!submitted ? (
        <div className="flex flex-col" style={{ gap: 8 }}>
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
            Submit
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSkip}
            className="flex items-center justify-center w-full"
            style={{
              height: 36, borderRadius: 12, border: "none",
              backgroundColor: "transparent", cursor: "pointer",
              fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)",
            }}
          >
            Skip
          </motion.button>
        </div>
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
            {/* Headline only — no subtitle. */}
            <h2 style={{
              fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--foreground)",
              margin: 0, letterSpacing: -0.3, textAlign: "center", paddingTop: 4,
            }}>
              How was today's class?
            </h2>

            {/* Face rating — icon + label stacked per slot for clean alignment */}
            <RatingPicker
              value={rating}
              onChange={setRatingAndResetTags}
              variant="face"
              size={32}
              labels={FACE_LABELS}
            />

            {/* Adaptive chips — single motion.div stays mounted once
                rating > 0; chip pool + heading swap in place on bucket
                change, so the sheet never reshapes (the height-collapse
                animation was pulling the sheet bottom up + down on rating
                toggles). */}
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
                  {chipHeading}
                </span>
                <TagChipGroup
                  options={chipPool.map((o) => ({
                    ...o,
                    color: isLowRating ? "var(--error-500)" : "var(--success-500)",
                  }))}
                  value={tags}
                  onChange={setTags}
                  multi
                />
              </motion.div>
            )}

            {/* Optional comment — placeholder does the work, no label. */}
            {rating > 0 && (
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isLowRating
                  ? "Anything else? (optional)"
                  : "What did you love? (optional)"}
                style={{
                  height: 44, paddingLeft: 12, paddingRight: 12,
                  borderRadius: 12, border: "none",
                  backgroundColor: "var(--card-bg-secondary)",
                  color: "var(--foreground)",
                  fontSize: "var(--text-sm)",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            )}

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
            <div className="flex items-center justify-center" style={{
              width: 64, height: 64, borderRadius: 9999,
              backgroundColor: "color-mix(in srgb, var(--success-500) 16%, transparent)",
            }}>
              <Check size={32} style={{ color: "var(--success-500)" }} strokeWidth={3} />
            </div>
            <h2 style={{
              fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)",
              margin: 0, letterSpacing: -0.2, textAlign: "center",
            }}>
              Thanks for the feedback
            </h2>
          </motion.div>
        )}
      </AnimatePresence>
    </FeedbackSheet>
  );
}
