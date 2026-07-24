/**
 * CourseReviewsPreview — inline reviews block for course detail pages.
 *
 * Visual language matches the existing device-product Ratings & Reviews
 * section in marketplace-product.tsx (RatingOverview + flat ReviewCard list):
 *   - Section title in muted-foreground
 *   - Rating overview: big number + small stars + total · 5 distribution bars
 *   - Flat review cards (NO card-surface bg)
 *   - "See all N reviews" link
 *
 * Per persona research, the preview shows 1 positive + 1 honest 3-star review.
 * Tag chips intentionally hidden in the preview (visible on the full /reviews
 * page) — keeps the preview clean and device-consistent.
 *
 * Empty state: no reviews yet → returns null.
 */

import { Link } from "react-router";
import { Star, ChevronRight } from "lucide-react";
import { useReviews, type UserReview } from "../shared/feedback-storage";

interface Props {
  courseId: string;
  showAllRoute?: string;     // default /marketplace/product/:courseId/reviews
}

export function CourseReviewsPreview({ courseId, showAllRoute }: Props) {
  const reviews = useReviews(courseId);
  if (reviews.total === 0) return null;

  // 1 positive + 1 honest 3-star (per persona research).
  const positive = [...reviews.reviews].sort((a, b) => b.helpfulCount - a.helpfulCount).find((r) => r.rating >= 4);
  const mid = [...reviews.reviews].find((r) => r.rating === 3);
  const picks = [positive, mid].filter((r): r is NonNullable<typeof r> => !!r).slice(0, 2);

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      {/* Section title — matches device section style */}
      <span style={{
        fontSize: "var(--text-base)",
        fontWeight: "var(--font-weight-semibold)",
        color: "var(--muted-foreground)",
      }}>
        Ratings & Reviews
      </span>

      {/* Rating overview — big number + distribution bars */}
      <div className="flex" style={{ gap: 16 }}>
        <div className="flex flex-col items-center justify-center" style={{ gap: 4, minWidth: 56 }}>
          <span style={{
            fontSize: 32, fontWeight: "var(--font-weight-bold)",
            color: "var(--foreground)", lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}>
            {reviews.average.toFixed(1)}
          </span>
          <StarRow rating={reviews.average} size={11} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
            {reviews.total.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex flex-col justify-center" style={{ flex: 1, gap: 4 }}>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.distribution[stars as 1 | 2 | 3 | 4 | 5];
            const pct = reviews.total === 0 ? 0 : Math.round((count / reviews.total) * 100);
            return (
              <div key={stars} className="flex items-center" style={{ gap: 8 }}>
                <span style={{
                  fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
                  width: 8, textAlign: "right",
                }}>
                  {stars}
                </span>
                <div style={{
                  flex: 1, height: 4, borderRadius: 9999,
                  backgroundColor: "var(--border)",
                }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 9999,
                    backgroundColor: "var(--warning-500)",
                  }} />
                </div>
                <span style={{
                  fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
                  width: 24,
                }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews — flat list, no card bg */}
      <div className="flex flex-col" style={{ gap: 16 }}>
        {picks.map((r, i) => <ReviewCard key={i} review={r} />)}
      </div>

      {/* See all — matches device CTA style */}
      <Link to={showAllRoute ?? `/marketplace/product/${courseId}/reviews`} style={{ textDecoration: "none" }}>
        <div
          className="flex items-center justify-center"
          style={{
            gap: 4, height: 40, borderRadius: 8,
            border: "1px solid var(--border)",
            backgroundColor: "transparent",
            cursor: "pointer",
          }}
        >
          <span style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}>
            See all {reviews.total.toLocaleString("en-IN")} reviews
          </span>
          <ChevronRight size={14} style={{ color: "var(--foreground)" }} />
        </div>
      </Link>
    </div>
  );
}

// ─── Helpers (mirror marketplace-product.tsx's device style) ────────────────

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{
            width: size, height: size,
            fill: i <= Math.round(rating) ? "var(--warning-500)" : "transparent",
            color: "var(--warning-500)",
            strokeWidth: 1.5,
          }}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: UserReview }) {
  const daysAgo = Math.floor((Date.now() - review.submittedAt) / (1000 * 60 * 60 * 24));
  const dateLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <div className="flex items-center" style={{ gap: 8 }}>
        <div className="flex items-center justify-center" style={{
          width: 40, height: 40, borderRadius: 9999,
          backgroundColor: "var(--primary)", flexShrink: 0,
        }}>
          <span style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--foreground)",
          }}>
            {(review.authorHandle[0] ?? "?").toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col" style={{ gap: 2, minWidth: 0 }}>
          <span style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}>
            {review.authorHandle}
          </span>
          <div className="flex items-center" style={{ gap: 8 }}>
            <StarRow rating={review.rating} size={11} />
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
              {dateLabel}
            </span>
          </div>
        </div>
      </div>
      {review.authorBadge && (
        <span style={{
          fontSize: "var(--text-2xs)",
          color: "var(--success-500)",
          fontWeight: 600,
          paddingLeft: 48,    // align with the text column under the avatar
        }}>
          {review.authorBadge}
        </span>
      )}
      {review.comment && (
        <span style={{
          fontSize: "var(--text-sm)",
          color: "var(--muted-foreground)",
          lineHeight: 1.6,
        }}>
          {review.comment}
        </span>
      )}
    </div>
  );
}
