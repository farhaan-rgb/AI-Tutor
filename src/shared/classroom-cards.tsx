import { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, CalendarDays, Clock, Heart } from "lucide-react";
import {
  DUMMY_SUMMER_CAMP_SHARED,
  type ExamCourse,
  type OtherCourse,
  type SummerCampBatch,
} from "./classroom-catalog";
import { useTheme } from "../app/contexts/theme-context";

interface CourseThumbnailProps {
  exam: string;
  shortLabel: string;
  plan: string;
  accentColor: string;
  examBadgeBg: string;
  examBadgeBorder: string;
  examAccent: string;
  gradientBg: string;
}

export function CourseThumbnail({ exam, shortLabel, plan, examAccent }: CourseThumbnailProps) {
  return (
    <div
      style={{
        width: "100%",
        height: 128,
        background: `linear-gradient(135deg, color-mix(in srgb, ${examAccent} 22%, var(--card)) 0%, color-mix(in srgb, ${examAccent} 32%, var(--card)) 50%, color-mix(in srgb, ${examAccent} 42%, var(--card)) 100%)`,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(45deg, color-mix(in srgb, var(--foreground) 4%, transparent) 0px, color-mix(in srgb, var(--foreground) 4%, transparent) 1px, transparent 1px, transparent 10px)",
      }} />

      <div style={{ position: "absolute", top: -32, right: -32, width: 108, height: 108, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)" }} />
      <div style={{ position: "absolute", bottom: -20, left: -20, width: 64, height: 64, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--foreground) 6%, transparent)" }} />

      <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0, paddingBottom: 24 }}>
        <span style={{ fontSize: 76, fontWeight: 800, color: examAccent, opacity: 0.55, letterSpacing: -3, lineHeight: 1 }}>
          {exam.split(" ")[0]}
        </span>
      </div>

      <div className="flex items-center justify-between" style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        paddingLeft: 12, paddingRight: 12, paddingBottom: 10, paddingTop: 20,
      }}>
        <div
          className="flex items-center justify-center"
          style={{
            paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 6,
            backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)",
            border: `1px solid ${examAccent}`,
          }}
        >
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", color: examAccent }}>{shortLabel}</span>
        </div>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>{plan}</span>
      </div>
    </div>
  );
}

interface CourseCardProps {
  course: ExamCourse;
  exam: string;
  shortLabel: string;
  accentColor: string;
  examBadgeBg: string;
  examBadgeBorder: string;
  examAccent: string;
  gradientBg: string;
  onClick?: () => void;
}

export function CourseCard({ course, exam, shortLabel, accentColor, examBadgeBg, examBadgeBorder, examAccent, gradientBg, onClick }: CourseCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col shrink-0"
      style={{ width: 208, borderRadius: 12, overflow: "hidden", backgroundColor: "var(--card)", cursor: "pointer" }}
    >
      <CourseThumbnail
        exam={exam}
        shortLabel={shortLabel}
        plan={course.plan}
        accentColor={accentColor}
        examBadgeBg={examBadgeBg}
        examBadgeBorder={examBadgeBorder}
        examAccent={examAccent}
        gradientBg={gradientBg}
      />

      <div className="flex flex-col" style={{ padding: 16, gap: 8 }}>
        <span style={{
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-bold)",
          color: "var(--foreground)",
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {course.title}
        </span>

        <div className="flex flex-col" style={{ gap: 4 }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <Clock size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{course.plan}</span>
          </div>
          <div className="flex items-center" style={{ gap: 4 }}>
            <BookOpen size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{course.topics} topics</span>
          </div>
        </div>

        <div className="flex items-center" style={{ gap: 6 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
            &#x20B9;{course.price.toLocaleString("en-IN")}
          </span>
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
            &#x20B9;{course.originalPrice.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface SummerCampThumbnailProps {
  batch: SummerCampBatch;
}

const SUMMER_CAMP_THUMBNAILS: Record<string, Record<string, string>> = {
  explorer: {
    light: "/summer-camp-explorer-light.png",
    dark: "/summer-camp-explorer-dark.png",
  },
  creator: {
    light: "/summer-camp-creator-light.png",
    dark: "/summer-camp-creator-dark.png",
  },
};

export function SummerCampThumbnail({ batch }: SummerCampThumbnailProps) {
  const { theme } = useTheme();
  const src = SUMMER_CAMP_THUMBNAILS[batch.track]?.[theme] ?? SUMMER_CAMP_THUMBNAILS.explorer.dark;
  return (
    <div style={{ width: "100%", height: 128, position: "relative", overflow: "hidden", flexShrink: 0, backgroundColor: "var(--card)" }}>
      <img
        src={src}
        alt={`AI Summer Camp ${batch.trackLabel}`}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

// ─── OtherCourseCard — marketplace-style card (188px, 3:2 thumbnail) ─────────
interface OtherCourseCardProps {
  course: OtherCourse;
  onClick?: () => void;
  hideWishlist?: boolean;
}

function discountPct(price: number, original: number) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export function OtherCourseCard({ course, onClick, hideWishlist }: OtherCourseCardProps) {
  const { theme } = useTheme();
  const [wishlisted, setWishlisted] = useState(false);
  const [imgFailed, setImgFailed] = useState(!course.thumbImage);
  const pct = discountPct(course.price, course.originalPrice);
  const isLight = theme === "light";
  const isAppMode = !!course.thumbLogo;
  const thumbAccent = isLight ? (course.thumbAccentLight ?? course.thumbAccent ?? "var(--foreground)") : (course.thumbAccent ?? "var(--foreground)");
  const thumbBg = isAppMode
    ? `linear-gradient(135deg, color-mix(in srgb, ${thumbAccent} 6%, var(--card)) 0%, color-mix(in srgb, ${thumbAccent} 12%, var(--card)) 100%)`
    : isLight ? (course.thumbBgLight ?? course.thumbBg ?? "var(--card)") : (course.thumbBg ?? "var(--card)");
  const stripeColor = isLight ? "var(--black-alpha-4)" : "var(--white-alpha-4)";
  const circleColor1 = isLight ? "var(--black-alpha-8)" : "var(--white-alpha-8)";
  const circleColor2 = isLight ? "var(--black-alpha-6)" : "var(--white-alpha-6)";

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{ width: 188, flexShrink: 0, cursor: "pointer" }}
    >
      <div style={{ position: "relative", aspectRatio: "3/2", borderRadius: 8, overflow: "hidden" }}>
        {!imgFailed && course.thumbImage ? (
          <img
            src={course.thumbImage}
            alt={course.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%", position: "relative",
            background: thumbBg, overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `repeating-linear-gradient(45deg, ${stripeColor} 0px, ${stripeColor} 1px, transparent 1px, transparent 10px)`,
            }} />
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: 9999, backgroundColor: circleColor1 }} />
            <div style={{ position: "absolute", bottom: -12, left: -12, width: 48, height: 48, borderRadius: 9999, backgroundColor: circleColor2 }} />
            {isAppMode && (
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 160,
                  height: 160,
                  borderRadius: 9999,
                  background: `radial-gradient(circle, color-mix(in srgb, ${thumbAccent} 24%, transparent) 0%, transparent 65%)`,
                  pointerEvents: "none",
                }}
              />
            )}
            {course.thumbLogo ? (
              <div
                className="flex items-center justify-center"
                style={{ position: "absolute", inset: 0, paddingBottom: 8 }}
              >
                <div
                  style={{
                    width: 64, height: 64, borderRadius: 14,
                    overflow: "hidden", flexShrink: 0,
                    backgroundColor: "var(--card)",
                    boxShadow: "0 2px 8px color-mix(in srgb, var(--foreground) 14%, transparent)",
                  }}
                >
                  <img
                    src={course.thumbLogo}
                    alt={course.thumbBrand ?? course.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              </div>
            ) : course.thumbLabel ? (
              <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0, paddingBottom: 12 }}>
                <span style={{ fontSize: 52, fontWeight: 800, color: thumbAccent, opacity: 0.55, letterSpacing: -2, lineHeight: 1 }}>
                  {course.thumbLabel}
                </span>
              </div>
            ) : null}
            {(course.thumbLabel || course.thumbLogo) && (course.thumbTag || course.thumbLabel || course.thumbMeta) && (
              <div className="flex items-center justify-between" style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                paddingLeft: 8, paddingRight: 8, paddingBottom: 8, paddingTop: 16,
              }}>
                {(course.thumbTag || course.thumbLabel) ? (
                  <div className="flex items-center justify-center" style={{
                    paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 6,
                    border: `1px solid ${thumbAccent}`,
                    backgroundColor: `color-mix(in srgb, ${thumbAccent} 12%, transparent)`,
                  }}>
                    <span style={{
                      fontSize: "var(--text-xs)", fontWeight: 700,
                      color: thumbAccent, letterSpacing: 0.4,
                    }}>
                      {course.thumbTag ?? course.thumbLabel}
                    </span>
                  </div>
                ) : <span />}
                {course.thumbMeta && (
                  <span style={{
                    fontSize: "var(--text-xs)", fontWeight: 600,
                    color: "var(--foreground)",
                  }}>
                    {course.thumbMeta}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        {pct >= 10 && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            backgroundColor: "var(--error-600)", color: "var(--white)",
            fontSize: "var(--text-2xs)", fontWeight: 700,
            padding: "2px 6px", borderRadius: 4,
          }}>
            {pct}% OFF
          </div>
        )}
        {!hideWishlist && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); setWishlisted((w) => !w); }}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            style={{
              position: "absolute", top: 4, right: 4,
              width: 24, height: 24, borderRadius: 9999,
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: "var(--black-alpha-50)", border: "none", cursor: "pointer",
            }}
          >
            <Heart
              size={16}
              style={{ color: wishlisted ? "var(--error-500)" : "var(--white)" }}
              fill={wishlisted ? "var(--error-500)" : "none"}
            />
          </motion.button>
        )}
      </div>

      <div className="flex flex-col gap-1" style={{ padding: "8px 8px 8px 0" }}>
        <p style={{
          fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)",
          lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0,
        }}>
          {course.title}
        </p>
        {course.subtitle && (
          <p style={{
            fontSize: "var(--text-2xs)", fontWeight: 400,
            color: "var(--secondary-foreground)", lineHeight: 1.2,
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", margin: 0,
          }}>
            {course.subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface SummerCampCardProps {
  batch: SummerCampBatch;
  onClick?: () => void;
}

export function SummerCampCard({ batch, onClick }: SummerCampCardProps) {
  const { dateRange } = DUMMY_SUMMER_CAMP_SHARED;
  const { accentColor, badgeBg, badgeBorder } = batch;
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col shrink-0"
      style={{ width: 220, borderRadius: 12, overflow: "hidden", backgroundColor: "var(--card)", cursor: "pointer" }}
    >
      <SummerCampThumbnail batch={batch} />

      <div className="flex flex-col" style={{ padding: 12, gap: 8 }}>
        {/* Badges row: track + grade side by side */}
        <div className="flex items-center" style={{ gap: 8 }}>
          <div className="flex items-center justify-center" style={{ paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 4, backgroundColor: badgeBg, border: `1.5px solid ${badgeBorder}` }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-bold)", color: accentColor, letterSpacing: 1, whiteSpace: "nowrap" }}>
              {batch.trackLabel.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-center" style={{ paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 4, backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}40` }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: accentColor, whiteSpace: "nowrap" }}>
              {batch.grade}
            </span>
          </div>
        </div>

        {/* Title */}
        <span style={{
          fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)",
          lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {batch.title}
        </span>

        {/* Date */}
        <div className="flex items-center" style={{ gap: 4 }}>
          <CalendarDays size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{dateRange}</span>
        </div>

        {/* Seats left */}
        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: accentColor }}>
          {batch.seatsLeft} seats left
        </span>
      </div>
    </motion.div>
  );
}
