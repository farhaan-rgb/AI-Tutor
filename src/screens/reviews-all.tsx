/**
 * Reviews All — full-screen list of reviews for a Test Series pack.
 * Route: /marketplace/product/:id/reviews
 *
 * Surfaces ALL reviews with filters (5★/4★/3★/2★/1★/All) + sort
 * (Most helpful / Newest). Per Persona research, 3-star reviews are surfaced
 * deliberately (review-readers hunt for honest negatives before buying).
 */

import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Star, ThumbsUp, Filter } from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { useReviews, formatReviewTag, type UserReview } from "../shared/feedback-storage";

type Filter = "all" | 5 | 4 | 3 | 2 | 1;
type Sort = "helpful" | "newest";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: 5,     label: "5★" },
  { value: 4,     label: "4★" },
  { value: 3,     label: "3★" },
  { value: 2,     label: "2★" },
  { value: 1,     label: "1★" },
];

export function Component() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const packId = params.id ?? "";
  const reviews = useReviews(packId);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("helpful");

  const filtered = useMemo(() => {
    let list = [...reviews.reviews];
    if (filter !== "all") list = list.filter((r) => r.rating === filter);
    if (sort === "helpful") list.sort((a, b) => b.helpfulCount - a.helpfulCount);
    else list.sort((a, b) => b.submittedAt - a.submittedAt);
    return list;
  }, [reviews.reviews, filter, sort]);

  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        minHeight: "100dvh",
        maxWidth: isDesktop ? 720 : undefined,
        marginLeft: isDesktop ? "auto" : undefined,
        marginRight: isDesktop ? "auto" : undefined,
      }}
    >
      {/* Header — single sticky parent containing StatusBar, back/title row,
          AND the filter/sort row below so they scroll together. Previously
          the filter row used a separate `top: 96` which floated free of the
          header on viewport-height changes. */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        backgroundColor: "var(--background)",
        borderBottom: "0.5px solid color-mix(in srgb, var(--foreground) 10%, transparent)",
      }}>
        <StatusBar />
        <div className="flex items-center" style={{ padding: "4px 8px 4px 4px", gap: 8, height: 48 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 44, height: 44, borderRadius: 9999,
              backgroundColor: "transparent", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={20} style={{ color: "var(--foreground)" }} />
          </motion.button>
          <h1 style={{
            fontSize: "var(--text-base)", fontWeight: 700,
            color: "var(--foreground)", margin: 0,
          }}>
            Ratings & reviews
          </h1>
        </div>
      </div>

      {/* Summary header */}
      <div className="flex items-center" style={{ padding: "20px 16px", gap: 20 }}>
        <div className="flex flex-col items-center" style={{ gap: 4 }}>
          <span style={{
            fontSize: 36, fontWeight: 800, color: "var(--foreground)",
            lineHeight: 1, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums",
          }}>
            {reviews.average.toFixed(1)}
          </span>
          <div className="flex items-center" style={{ gap: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={12}
                fill={i <= Math.round(reviews.average) ? "var(--warning-500)" : "none"}
                style={{ color: "var(--warning-500)" }}
                strokeWidth={1.75}
              />
            ))}
          </div>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
            {reviews.total} reviews
          </span>
        </div>

        {/* Distribution bars */}
        <div className="flex flex-col" style={{ flex: 1, gap: 6 }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.distribution[star as 1 | 2 | 3 | 4 | 5];
            const pct = reviews.total === 0 ? 0 : (count / reviews.total) * 100;
            return (
              <div key={star} className="flex items-center" style={{ gap: 8 }}>
                <span style={{
                  fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
                  width: 12, fontVariantNumeric: "tabular-nums",
                }}>
                  {star}
                </span>
                <div style={{
                  flex: 1, height: 6, borderRadius: 9999,
                  backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${pct}%`, height: "100%",
                    backgroundColor: "var(--warning-500)",
                    transition: "width 0.3s ease",
                  }} />
                </div>
                <span style={{
                  fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
                  width: 24, textAlign: "right", fontVariantNumeric: "tabular-nums",
                }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter + Sort — sticky top precisely matches header height
          (StatusBar 44 + back/title row 48 = 92) so it pins flush below
          the header at the top of the viewport when summary scrolls away. */}
      <div style={{
        position: "sticky", top: 92, zIndex: 10,
        backgroundColor: "var(--background)",
        borderBottom: "0.5px solid color-mix(in srgb, var(--foreground) 10%, transparent)",
        padding: "8px 16px",
      }}>
        <div className="flex items-center" style={{ gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <motion.button
                key={String(f.value)}
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilter(f.value)}
                style={{
                  height: 32, paddingLeft: 12, paddingRight: 12,
                  borderRadius: 9999, border: "none", cursor: "pointer",
                  flexShrink: 0,
                  backgroundColor: active
                    ? "color-mix(in srgb, var(--primary-500) 18%, transparent)"
                    : "var(--card-bg-secondary)",
                  fontFamily: "inherit",
                }}
              >
                <span style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--primary-500)" : "var(--foreground)",
                  letterSpacing: 0.2,
                }}>
                  {f.label}
                </span>
              </motion.button>
            );
          })}
          <div style={{ flex: 1 }} />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setSort((s) => s === "helpful" ? "newest" : "helpful")}
            className="flex items-center"
            style={{
              height: 32, paddingLeft: 10, paddingRight: 12,
              borderRadius: 9999, border: "none", cursor: "pointer",
              backgroundColor: "var(--card-bg-secondary)",
              gap: 6, flexShrink: 0, fontFamily: "inherit",
            }}
          >
            <Filter size={12} style={{ color: "var(--muted-foreground)" }} />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--foreground)" }}>
              {sort === "helpful" ? "Most helpful" : "Newest"}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Reviews list */}
      <div style={{ padding: "8px 16px 32px" }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center" style={{ padding: 48, gap: 8 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
              No {filter !== "all" ? `${filter}-star` : ""} reviews yet
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textAlign: "center" }}>
              Try a different filter
            </span>
          </div>
        ) : (
          filtered.map((r, i) => <ReviewRow key={i} review={r} />)
        )}
      </div>
    </div>
  );
}

function ReviewRow({ review }: { review: UserReview }) {
  const daysAgo = Math.floor((Date.now() - review.submittedAt) / (1000 * 60 * 60 * 24));
  return (
    <div style={{
      padding: "16px 0",
      borderBottom: "0.5px solid color-mix(in srgb, var(--foreground) 8%, transparent)",
    }}>
      <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9999,
          backgroundColor: "color-mix(in srgb, var(--primary-500) 18%, var(--card))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "var(--text-xs)", fontWeight: 700,
          color: "var(--primary-500)", flexShrink: 0,
        }}>
          {(review.authorHandle[0] ?? "?").toUpperCase()}
        </div>
        <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
            {review.authorHandle}
          </span>
          {review.authorBadge && (
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--success-500)", fontWeight: 600 }}>
              {review.authorBadge}
            </span>
          )}
        </div>
        <div className="flex items-center" style={{ gap: 2 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={10}
              fill={i <= review.rating ? "var(--warning-500)" : "none"}
              style={{ color: "var(--warning-500)" }}
              strokeWidth={1.75}
            />
          ))}
        </div>
      </div>

      {review.tags.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: 6, marginBottom: 8 }}>
          {review.tags.map((t) => (
            <span key={t} style={{
              height: 22, paddingLeft: 8, paddingRight: 8,
              borderRadius: 4, display: "inline-flex", alignItems: "center",
              backgroundColor: "var(--card-bg-secondary)",
              fontSize: "var(--text-2xs)", fontWeight: 600,
              color: "var(--muted-foreground)", letterSpacing: 0.2,
            }}>
              {formatReviewTag(t)}
            </span>
          ))}
        </div>
      )}

      {review.comment && (
        <p style={{
          fontSize: "var(--text-sm)", color: "var(--foreground)",
          lineHeight: 1.5, margin: "0 0 8px",
        }}>
          {review.comment}
        </p>
      )}

      <div className="flex items-center" style={{ gap: 12 }}>
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
          {daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`}
        </span>
        <button
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: 0, fontFamily: "inherit",
          }}
        >
          <ThumbsUp size={11} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 500 }}>
            {review.helpfulCount > 0 ? `Helpful · ${review.helpfulCount}` : "Helpful"}
          </span>
        </button>
      </div>
    </div>
  );
}
