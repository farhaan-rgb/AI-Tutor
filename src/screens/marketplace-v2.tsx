/**
 * Marketplace — v2 (long-scroll editorial layout)
 *
 * Header
 *   StatusBar + page title + search + cart + filter button
 *   Filter button opens a LEFT SLIDE-OUT SHEET for categories (YouTube-style)
 *   Age filter sits below as text tabs with underline indicator
 *
 * Feed sections
 *   Test Prep        → full-width hero cards with autoplaying demo video
 *   Summer Crash     → horizontal snap-scroll carousel with autoplaying demo
 *   Music · Live     → 2-col grid of pure image cards
 *   Music · Self     → 2-col grid of pure image cards
 *   Learning Apps    → premium feature card with eyebrow, description, CTA
 *
 * Card info matches v1: title + subtitle. Optional discount pill + ENROLLED tag.
 * No prices, no ratings, no demo/play/duration overlays. When `videoUrl` is
 * provided, a muted autoplay loop replaces the synthesized poster.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart, Search, ChevronRight, ChevronDown, Users, X, Check,
  Sparkles, BookOpen, Music, Flame, LayoutGrid,
  Baby, Backpack, GraduationCap, Briefcase,
} from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import { DUMMY_OTHER_COURSES, DUMMY_CRASH_COURSE_INFO } from "../shared/classroom-catalog";

// ─── Categories ──────────────────────────────────────────────────────────────

type FeedCategory = "all" | "test-prep" | "music" | "crash" | "apps";

interface CategoryItem {
  id: FeedCategory;
  label: string;
  Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
}

const CATEGORIES: CategoryItem[] = [
  { id: "all",       label: "All",          Icon: Sparkles },
  { id: "test-prep", label: "Test Prep",    Icon: BookOpen },
  { id: "music",     label: "Music",        Icon: Music },
  { id: "crash",     label: "Summer Crash", Icon: Flame },
  { id: "apps",      label: "Apps",         Icon: LayoutGrid },
];

// ─── Age filter — text tabs ──────────────────────────────────────────────────

type AgeFilterId = "all" | "kids" | "school" | "high-school" | "college";

interface AgeFilter {
  id: AgeFilterId;
  label: string;
  Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
}

const AGE_FILTERS: AgeFilter[] = [
  { id: "all",         label: "For You",     Icon: Sparkles },
  { id: "kids",        label: "Class 1–5",   Icon: Baby },
  { id: "school",      label: "Class 6–10",  Icon: Backpack },
  { id: "high-school", label: "Class 11–12", Icon: GraduationCap },
  { id: "college",     label: "College+",    Icon: Briefcase },
];

const AGE_VISIBILITY: Record<AgeFilterId, { testPrep: boolean; music: boolean; crash: boolean; apps: boolean }> = {
  all:           { testPrep: true,  music: true, crash: true,  apps: true },
  kids:          { testPrep: false, music: true, crash: false, apps: true },
  school:        { testPrep: false, music: true, crash: true,  apps: true },
  "high-school": { testPrep: true,  music: true, crash: true,  apps: true },
  college:       { testPrep: true,  music: true, crash: false, apps: true },
};

// ─── Data ────────────────────────────────────────────────────────────────────

const CAT_GROUP = DUMMY_OTHER_COURSES.find((g) => g.examKey === "cat")!;
const CRASH_ACCENT = DUMMY_CRASH_COURSE_INFO.accentColor;
const EXPRESS_ACCENT = "#29d6d6";
const CRASH_CLASSES = [6, 7, 8, 9, 10] as const;

// Dummy demo videos (publicly hosted samples — replace with real lecture clips)
const CAT_DEMO_VIDEO_3M = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
const CAT_DEMO_VIDEO_6M = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
const CRASH_DEMO_VIDEO  = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

interface MusicProduct {
  id: string;
  title: string;
  subtitle: string;
  format: "live" | "self";
  price: number;
  originalPrice: number;
  thumbImage: string;
}

// TODO(api): GET /api/marketplace/music-courses
const MUSIC_PRODUCTS: MusicProduct[] = [
  { id: "piano-group",             format: "live", title: "Piano / Keyboard",  subtitle: "4–12 sessions", price: 1499, originalPrice: 2499, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg" },
  { id: "guitar-group",            format: "live", title: "Guitar Learning",   subtitle: "4–12 sessions", price: 1499, originalPrice: 2499, thumbImage: "/guitar-course.webp" },
  { id: "western-vocals-group",    format: "live", title: "Western Vocals",    subtitle: "4–12 sessions", price: 1499, originalPrice: 2499, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg" },
  { id: "hindustani-vocals-group", format: "live", title: "Hindustani Vocals", subtitle: "4–12 sessions", price: 1499, originalPrice: 2499, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg" },
  { id: "piano-self",              format: "self", title: "Piano / Keyboard",  subtitle: "10 songs",      price: 999,  originalPrice: 1999, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg" },
  { id: "guitar-self",             format: "self", title: "Guitar Learning",   subtitle: "10 songs",      price: 999,  originalPrice: 1999, thumbImage: "/guitar-course.webp" },
  { id: "western-vocals-self",     format: "self", title: "Western Vocals",    subtitle: "10 songs",      price: 999,  originalPrice: 1999, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg" },
  { id: "hindustani-vocals-self",  format: "self", title: "Hindustani Vocals", subtitle: "10 songs",      price: 999,  originalPrice: 1999, thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function discountPct(price: number, original: number) {
  if (!original || original <= price) return 0;
  return Math.round((1 - price / original) * 100);
}

// ─── CategoryTabs — icon + label tabs with animated underline ───────────────

function CategoryTabs({ active, onChange }: { active: FeedCategory; onChange: (id: FeedCategory) => void }) {
  return (
    <div
      className="flex"
      style={{
        paddingLeft: 8, paddingRight: 8,
        overflowX: "auto",
        scrollbarWidth: "none",
        backgroundColor: "var(--background)",
        borderBottom: "0.5px solid color-mix(in srgb, var(--border) 40%, transparent)",
      }}
    >
      {CATEGORIES.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <motion.button
            key={id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(id)}
            className="flex items-center shrink-0"
            style={{
              position: "relative",
              gap: 6,
              height: 48,
              paddingLeft: 12, paddingRight: 12,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            <Icon
              size={15}
              style={{
                color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                filter: isActive
                  ? "drop-shadow(0 0 8px color-mix(in srgb, var(--primary) 60%, transparent))"
                  : undefined,
              }}
            />
            <span
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                letterSpacing: isActive ? "-0.01em" : 0,
              }}
            >
              {label}
            </span>
            {isActive && (
              <motion.div
                layoutId="category-tab-underline"
                transition={{ type: "spring", damping: 30, stiffness: 380 }}
                style={{
                  position: "absolute",
                  left: 12, right: 12, bottom: 0,
                  height: 3,
                  borderRadius: 3,
                  background: "linear-gradient(90deg, color-mix(in srgb, var(--primary) 70%, #fff) 0%, var(--primary) 100%)",
                  boxShadow: "0 0 12px color-mix(in srgb, var(--primary) 70%, transparent), 0 0 4px color-mix(in srgb, var(--primary) 100%, transparent)",
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── AudienceSheet — bottom sheet for class selection ───────────────────────

function AudienceSheet({
  open, active, onClose, onChange,
}: {
  open: boolean;
  active: AgeFilterId;
  onClose: () => void;
  onChange: (id: AgeFilterId) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              zIndex: 60,
            }}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            style={{
              position: "fixed",
              left: 0, right: 0, bottom: 0,
              zIndex: 61,
              maxHeight: "85vh",
              backgroundColor: "var(--card)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
              borderBottom: "none",
              boxShadow: [
                "0 -16px 48px rgba(0,0,0,0.55)",
                "inset 0 0.5px 0 color-mix(in srgb, var(--primary) 30%, rgba(255,255,255,0.06))",
              ].join(", "),
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              paddingBottom: 24,
            }}
          >
            {/* Brand-tinted halo at top */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: -80, left: "50%", transform: "translateX(-50%)",
                width: 340, height: 200,
                borderRadius: "50%",
                background: "radial-gradient(circle, color-mix(in srgb, var(--primary) 45%, transparent) 0%, transparent 70%)",
                filter: "blur(36px)",
                opacity: 0.55,
                pointerEvents: "none",
              }}
            />

            {/* Drag handle */}
            <div className="flex items-center justify-center" style={{ paddingTop: 10, paddingBottom: 6 }}>
              <div
                style={{
                  width: 40, height: 4, borderRadius: 2,
                  backgroundColor: "color-mix(in srgb, var(--foreground) 22%, transparent)",
                }}
              />
            </div>

            {/* Header */}
            <div
              className="flex items-start justify-between"
              style={{ position: "relative", padding: "8px 20px 18px" }}
            >
              <div className="flex flex-col" style={{ gap: 4, paddingRight: 12, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  What class are you in?
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                  We'll show what's right for your level.
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 32, height: 32, borderRadius: 9999,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
                  border: "0.5px solid color-mix(in srgb, var(--border) 40%, transparent)",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                <X size={16} style={{ color: "var(--foreground)" }} />
              </motion.button>
            </div>

            {/* List */}
            <div style={{ padding: "0 12px", position: "relative", overflowY: "auto" }}>
              {AGE_FILTERS.map(({ id, label, Icon }) => {
                const isActive = active === id;
                return (
                  <motion.button
                    key={id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onChange(id); onClose(); }}
                    className="flex items-center"
                    style={{
                      width: "100%",
                      gap: 12,
                      marginBottom: 4,
                      paddingLeft: 12, paddingRight: 12,
                      height: 56,
                      borderRadius: 14,
                      background: isActive
                        ? "linear-gradient(180deg, color-mix(in srgb, var(--primary) 22%, var(--card)) 0%, color-mix(in srgb, var(--primary) 10%, var(--card)) 100%)"
                        : "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: isActive
                        ? [
                            "inset 0 0 0 0.5px color-mix(in srgb, var(--primary) 55%, transparent)",
                            "inset 0 0.5px 0 color-mix(in srgb, var(--primary) 45%, rgba(255,255,255,0.35))",
                            "0 4px 14px color-mix(in srgb, var(--primary) 22%, transparent)",
                          ].join(", ")
                        : undefined,
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: isActive
                          ? "linear-gradient(160deg, color-mix(in srgb, var(--primary) 48%, var(--card)) 0%, color-mix(in srgb, var(--primary) 26%, var(--card)) 100%)"
                          : "color-mix(in srgb, var(--foreground) 6%, transparent)",
                        border: isActive
                          ? "0.5px solid color-mix(in srgb, var(--primary) 60%, transparent)"
                          : "0.5px solid color-mix(in srgb, var(--border) 30%, transparent)",
                        boxShadow: isActive
                          ? "inset 0 0.5px 0 rgba(255,255,255,0.18), 0 0 12px color-mix(in srgb, var(--primary) 40%, transparent)"
                          : undefined,
                      }}
                    >
                      <Icon
                        size={18}
                        style={{
                          color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                          filter: isActive ? "drop-shadow(0 0 6px color-mix(in srgb, var(--primary) 60%, transparent))" : undefined,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        flex: 1,
                        textAlign: "left",
                        fontSize: "var(--text-sm)",
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "var(--primary)" : "var(--foreground)",
                      }}
                    >
                      {label}
                    </span>
                    {isActive && (
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 20, height: 20, borderRadius: 9999,
                          backgroundColor: "var(--primary)",
                          boxShadow: "0 0 10px color-mix(in srgb, var(--primary) 60%, transparent)",
                        }}
                      >
                        <Check size={12} style={{ color: "var(--background)" }} strokeWidth={3} />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footnote */}
            <div
              style={{
                position: "relative",
                padding: "14px 20px 0",
                marginTop: 8,
                borderTop: "0.5px solid color-mix(in srgb, var(--border) 30%, transparent)",
              }}
            >
              <p style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.5 }}>
                You can change this anytime — courses, crash plans and apps will update to match.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── SectionHeader — premium with accent bar ────────────────────────────────

function SectionHeader({
  title, count, accent, onSeeAll,
}: {
  title: string;
  count?: number;
  accent?: string;
  onSeeAll?: () => void;
}) {
  const bar = accent ?? "var(--primary)";
  return (
    <div
      className="flex items-center justify-between"
      style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 12 }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <span
          aria-hidden
          style={{
            width: 3, height: 18, borderRadius: 2,
            background: `linear-gradient(180deg, ${bar} 0%, color-mix(in srgb, ${bar} 60%, transparent) 100%)`,
            boxShadow: `0 0 8px color-mix(in srgb, ${bar} 50%, transparent)`,
          }}
        />
        <h2
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 800,
            color: "var(--foreground)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        {count !== undefined && (
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)" }}>
            ({count})
          </span>
        )}
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="flex items-center"
          style={{
            gap: 2, background: "transparent", border: "none",
            cursor: "pointer", padding: 0, fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--primary)" }}>
            See all
          </span>
          <ChevronRight size={14} style={{ color: "var(--primary)" }} />
        </button>
      )}
    </div>
  );
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function DiscountBadge({ pct }: { pct: number }) {
  return (
    <div
      className="flex items-center"
      style={{
        paddingLeft: 7, paddingRight: 7, height: 22, borderRadius: 4,
        background: "linear-gradient(180deg, rgba(184,80,72,0.92) 0%, rgba(160,68,62,0.92) 100%)",
        border: "0.5px solid rgba(255,255,255,0.14)",
        boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.2)",
      }}
    >
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "#fff", letterSpacing: 0.3 }}>
        {pct}% OFF
      </span>
    </div>
  );
}

function EnrolledPill({ accent }: { accent: string }) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: 4,
        paddingLeft: 6, paddingRight: 8, height: 22, borderRadius: 4,
        backgroundColor: `${accent}26`,
        border: `0.5px solid ${accent}66`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6, height: 6, borderRadius: 9999,
          backgroundColor: accent, boxShadow: `0 0 6px ${accent}`,
        }}
      />
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: accent, letterSpacing: 0.4 }}>
        ENROLLED
      </span>
    </div>
  );
}

// ─── SynthesizedPoster — gradient + brand letter (poster fallback) ──────────

function SynthesizedPoster({ accent, letter, size = "md" }: { accent: string; letter: string; size?: "sm" | "md" | "lg" }) {
  const fontSize = size === "lg" ? (letter.length > 1 ? 64 : 96) : size === "md" ? (letter.length > 1 ? 44 : 64) : (letter.length > 1 ? 28 : 40);
  const ls = size === "lg" ? (letter.length > 1 ? -2 : -4) : size === "md" ? (letter.length > 1 ? -1.5 : -3) : (letter.length > 1 ? -1 : -2);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 30%, #0a0408) 0%, color-mix(in srgb, ${accent} 14%, #0a0408) 55%, color-mix(in srgb, ${accent} 38%, #0a0408) 100%)`,
      }}
    >
      {/* Corner halo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -60, right: -60, width: 200, height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          filter: "blur(24px)",
          opacity: 0.55,
          pointerEvents: "none",
        }}
      />
      {/* Top specular sweep */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0, right: 0, top: 0, height: "40%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Brand letter */}
      <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0 }}>
        <span
          style={{
            fontSize,
            fontWeight: 900,
            color: accent,
            opacity: 0.85,
            letterSpacing: ls,
            lineHeight: 1,
            textShadow: `0 0 28px ${accent}aa, 0 2px 6px ${accent}55`,
          }}
        >
          {letter}
        </span>
      </div>
      {/* Bottom vignette */}
      <div
        aria-hidden
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 60,
          background: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Hairline rim — inside */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          boxShadow: `inset 0 0.5px 0 color-mix(in srgb, ${accent} 25%, rgba(255,255,255,0.15)), inset 0 -0.5px 0 rgba(0,0,0,0.4)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── AutoVideo — silent looping preview, fades in over the poster ───────────

function AutoVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const tryPlay = () => v.play().catch(() => { /* autoplay blocked */ });
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener("loadeddata", tryPlay, { once: true });
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onCanPlay={() => setReady(true)}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "cover", display: "block",
        opacity: ready ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    />
  );
}

// ─── CourseHeroCard — full-width premium card (Test Prep) ───────────────────

function CourseHeroCard({
  accent, letter, title, subtitle, pct, enrolled, videoUrl, onClick,
}: {
  accent: string;
  letter: string;
  title: string;
  subtitle: string;
  pct?: number;
  enrolled?: boolean;
  videoUrl?: string;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      style={{ cursor: "pointer", marginBottom: 16, paddingLeft: 16, paddingRight: 16 }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          borderRadius: 16,
          overflow: "hidden",
          border: `0.5px solid ${accent}40`,
          backgroundColor: "var(--card)",
          boxShadow: `0 8px 24px ${accent}1a, 0 1px 0 ${accent}33 inset`,
        }}
      >
        <SynthesizedPoster accent={accent} letter={letter} size="lg" />
        {videoUrl && <AutoVideo src={videoUrl} />}

        {/* Top-left: discount only */}
        {pct ? (
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <DiscountBadge pct={pct} />
          </div>
        ) : null}

        {/* Bottom-left: enrolled */}
        {enrolled && (
          <div style={{ position: "absolute", bottom: 10, left: 10 }}>
            <EnrolledPill accent={accent} />
          </div>
        )}
      </div>

      {/* Title row */}
      <div className="flex flex-col" style={{ paddingTop: 10, gap: 4 }}>
        <p
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 700,
            color: "var(--foreground)",
            lineHeight: 1.3,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--muted-foreground)",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

// ─── CourseScrollItem — fixed-width card for horizontal carousel ────────────

function CourseScrollItem({
  accent, letter, title, subtitle, enrolled, videoUrl, onClick, width = 220,
}: {
  accent: string;
  letter: string;
  title: string;
  subtitle: string;
  enrolled?: boolean;
  videoUrl?: string;
  onClick: () => void;
  width?: number;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        flex: `0 0 ${width}px`,
        scrollSnapAlign: "start",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3/2",
          borderRadius: 12,
          overflow: "hidden",
          border: `0.5px solid ${accent}40`,
          backgroundColor: "var(--card)",
          boxShadow: `0 6px 18px ${accent}1a`,
        }}
      >
        <SynthesizedPoster accent={accent} letter={letter} size="md" />
        {videoUrl && <AutoVideo src={videoUrl} />}

        {enrolled && (
          <div style={{ position: "absolute", bottom: 6, left: 6 }}>
            <EnrolledPill accent={accent} />
          </div>
        )}
      </div>

      <div className="flex flex-col" style={{ paddingTop: 8, gap: 2 }}>
        <p
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            color: "var(--foreground)",
            lineHeight: 1.3,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--muted-foreground)",
            lineHeight: 1.3,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

// ─── ProductImageCard — pure image card (Music) ─────────────────────────────

function ProductImageCard({
  thumbImage, title, subtitle, price, originalPrice, formatLabel, onClick,
}: {
  thumbImage: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  formatLabel?: string;
  onClick: () => void;
}) {
  const pct = discountPct(price, originalPrice);
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{ cursor: "pointer", width: "100%" }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3/2",
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "var(--card)",
          border: "0.5px solid color-mix(in srgb, var(--border) 40%, transparent)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
        }}
      >
        <img
          src={thumbImage}
          alt={title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* Bottom dark vignette for legibility */}
        <div
          aria-hidden
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: 40,
            background: "linear-gradient(0deg, rgba(0,0,0,0.45) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Format label */}
        {formatLabel && (
          <div
            className="flex items-center"
            style={{
              position: "absolute", top: 6, left: 6,
              paddingLeft: 6, paddingRight: 6, height: 18, borderRadius: 3,
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "0.5px solid rgba(255,255,255,0.14)",
            }}
          >
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "#fff", letterSpacing: 0.4 }}>
              {formatLabel}
            </span>
          </div>
        )}

        {/* Discount */}
        {pct >= 10 && (
          <div
            style={{
              position: "absolute", top: 6, right: 6,
              paddingLeft: 6, paddingRight: 6, height: 18, borderRadius: 3,
              background: "linear-gradient(180deg, rgba(184,80,72,0.92) 0%, rgba(160,68,62,0.92) 100%)",
              display: "flex", alignItems: "center",
              border: "0.5px solid rgba(255,255,255,0.12)",
            }}
          >
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "#fff" }}>
              {pct}% OFF
            </span>
          </div>
        )}
      </div>

      {/* Title + subtitle only */}
      <div className="flex flex-col" style={{ paddingTop: 8, gap: 2 }}>
        <p
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            color: "var(--foreground)",
            lineHeight: 1.3,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--muted-foreground)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

// ─── AppFeatureCard — compact horizontal feature card ───────────────────────

function AppFeatureCard({
  accent, letter, eyebrow, title, tagline, onClick,
}: {
  accent: string;
  letter: string;
  eyebrow: string;
  title: string;
  tagline: string;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      style={{ cursor: "pointer", marginLeft: 16, marginRight: 16, marginBottom: 16 }}
    >
      <div
        style={{
          position: "relative",
          padding: 14,
          borderRadius: 16,
          overflow: "hidden",
          background: `linear-gradient(140deg, color-mix(in srgb, ${accent} 22%, var(--card)) 0%, color-mix(in srgb, ${accent} 10%, var(--card)) 100%)`,
          border: `0.5px solid ${accent}40`,
          boxShadow: [
            `0 8px 22px ${accent}24`,
            `inset 0 0.5px 0 color-mix(in srgb, ${accent} 45%, rgba(255,255,255,0.25))`,
            "inset 0 -0.5px 0 rgba(0,0,0,0.3)",
          ].join(", "),
        }}
      >
        {/* Decorative halo top-right */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -50, right: -40, width: 160, height: 160,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
            filter: "blur(24px)",
            opacity: 0.45,
            pointerEvents: "none",
          }}
        />

        {/* Single horizontal row: icon · content · CTA */}
        <div className="flex items-center" style={{ gap: 12, position: "relative" }}>
          {/* Icon tile */}
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 56, height: 56, borderRadius: 12,
              background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 88%, #fff) 0%, ${accent} 50%, color-mix(in srgb, ${accent} 70%, #000) 100%)`,
              boxShadow: [
                `0 4px 14px ${accent}55`,
                "inset 0 1px 0 rgba(255,255,255,0.45)",
                "inset 0 -1px 0 rgba(0,0,0,0.18)",
              ].join(", "),
              position: "relative",
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: -1, lineHeight: 1 }}>
              {letter}
            </span>
            <div
              aria-hidden
              style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "50%",
                borderTopLeftRadius: 12, borderTopRightRadius: 12,
                background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <span
              style={{
                fontSize: "var(--text-2xs)",
                fontWeight: 800,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: accent,
                lineHeight: 1.1,
              }}
            >
              {eyebrow}
            </span>
            <p
              style={{
                fontSize: "var(--text-base)",
                fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {title}
            </p>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--muted-foreground)",
                lineHeight: 1.35,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {tagline}
            </p>
          </div>

          {/* Tap affordance */}
          <ChevronRight
            size={18}
            style={{
              color: "color-mix(in srgb, var(--foreground) 50%, transparent)",
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Layout wrappers ─────────────────────────────────────────────────────────

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        paddingLeft: 16, paddingRight: 16,
      }}
    >
      {children}
    </div>
  );
}

function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        paddingLeft: 16, paddingRight: 16, paddingBottom: 4,
        overflowX: "auto",
        scrollbarWidth: "none",
        scrollSnapType: "x mandatory",
        scrollPaddingLeft: 16,
        scrollPaddingRight: 16,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function Component() {
  const navigate = useNavigate();
  const [age, setAge] = useState<AgeFilterId>("all");
  const [category, setCategory] = useState<FeedCategory>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const enrolledCrashClass = typeof window !== "undefined"
    ? Number(localStorage.getItem("cc_selected_class")) || null
    : null;

  const ageVis = AGE_VISIBILITY[age];

  const showTestPrep = ageVis.testPrep && (category === "all" || category === "test-prep");
  const showCrash    = ageVis.crash    && (category === "all" || category === "crash");
  const showMusic    = ageVis.music    && (category === "all" || category === "music");
  const showApps     = ageVis.apps     && (category === "all" || category === "apps");
  const noneVisible  = !showTestPrep && !showCrash && !showMusic && !showApps;

  const catCourses = CAT_GROUP.courses.filter((c) => c.id === "cat-3m" || c.id === "cat-6m");
  const liveGroupMusic = MUSIC_PRODUCTS.filter((p) => p.format === "live");
  const selfPacedMusic = MUSIC_PRODUCTS.filter((p) => p.format === "self");

  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          backgroundColor: "var(--background)",
          flexShrink: 0,
        }}
      >
        <StatusBar />
        <div className="flex items-center justify-between" style={{ padding: "12px 16px", height: 56 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
            Discover
          </span>
          <div className="flex items-center" style={{ gap: 6 }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilterOpen(true)}
              aria-label="Choose your class"
              className="flex items-center"
              style={{
                gap: 6,
                height: 32,
                paddingLeft: 10, paddingRight: 8,
                borderRadius: 9999,
                background: age !== "all"
                  ? "linear-gradient(180deg, color-mix(in srgb, var(--primary) 24%, var(--card)) 0%, color-mix(in srgb, var(--primary) 12%, var(--card)) 100%)"
                  : "color-mix(in srgb, var(--foreground) 6%, transparent)",
                border: age !== "all"
                  ? "0.5px solid color-mix(in srgb, var(--primary) 50%, transparent)"
                  : "0.5px solid color-mix(in srgb, var(--border) 40%, transparent)",
                boxShadow: age !== "all"
                  ? "inset 0 0.5px 0 color-mix(in srgb, var(--primary) 35%, rgba(255,255,255,0.4)), 0 2px 8px color-mix(in srgb, var(--primary) 20%, transparent)"
                  : undefined,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Users
                size={13}
                style={{
                  color: age !== "all" ? "var(--primary)" : "var(--muted-foreground)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  color: age !== "all" ? "var(--primary)" : "var(--foreground)",
                  whiteSpace: "nowrap",
                }}
              >
                {AGE_FILTERS.find((a) => a.id === age)?.label ?? "For You"}
              </span>
              <ChevronDown
                size={12}
                style={{
                  color: age !== "all" ? "var(--primary)" : "var(--muted-foreground)",
                  flexShrink: 0,
                }}
              />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/marketplace/search")}
              aria-label="Search"
              style={{
                width: 36, height: 36, borderRadius: 9999,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "transparent", border: "none", cursor: "pointer",
              }}
            >
              <Search size={20} style={{ color: "var(--foreground)" }} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/marketplace/cart")}
              aria-label="View cart"
              style={{
                width: 36, height: 36, borderRadius: 9999,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "transparent", border: "none", cursor: "pointer", position: "relative",
              }}
            >
              <ShoppingCart size={20} style={{ color: "var(--foreground)" }} />
              <span
                style={{
                  position: "absolute", top: 2, right: 2,
                  width: 16, height: 16, borderRadius: 9999,
                  backgroundColor: "var(--primary-600)", color: "var(--white)",
                  fontSize: "var(--text-2xs)", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                3
              </span>
            </motion.button>
          </div>
        </div>

        {/* Category filter — text tabs (the primary visible filter) */}
        <CategoryTabs active={category} onChange={setCategory} />
      </div>

      {/* Left slide-out sheet for AUDIENCE / age */}
      <AudienceSheet
        open={filterOpen}
        active={age}
        onClose={() => setFilterOpen(false)}
        onChange={setAge}
      />

      {/* Scrollable feed */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 96, paddingTop: 16 }}>
        {/* Test Prep — full-width hero */}
        {showTestPrep && (
          <section style={{ marginBottom: 24 }}>
            <SectionHeader title="Test Prep" count={catCourses.length} accent={CAT_GROUP.examAccent} />
            {catCourses.map((c) => (
              <CourseHeroCard
                key={c.id}
                accent={CAT_GROUP.examAccent}
                letter="CAT"
                title={`${c.title} · ${c.plan}`}
                subtitle={`${CAT_GROUP.shortLabel} · ${c.topics} topics`}
                pct={discountPct(c.price, c.originalPrice)}
                videoUrl={c.id === "cat-3m" ? CAT_DEMO_VIDEO_3M : CAT_DEMO_VIDEO_6M}
                onClick={() => navigate(`/course-detail?exam=cat&plan=${c.id}`)}
              />
            ))}
          </section>
        )}

        {/* Summer Crash — horizontal snap-scroll carousel */}
        {showCrash && (
          <section style={{ marginBottom: 24 }}>
            <SectionHeader title="Summer Crash Course" count={CRASH_CLASSES.length} accent={CRASH_ACCENT} />
            <HScroll>
              {CRASH_CLASSES.map((cls) => (
                <CourseScrollItem
                  key={cls}
                  accent={CRASH_ACCENT}
                  letter={String(cls)}
                  title={`Class ${cls} Summer Crash`}
                  subtitle="Maths & Science · 15 Days"
                  enrolled={enrolledCrashClass === cls}
                  videoUrl={CRASH_DEMO_VIDEO}
                  onClick={() => navigate(`/crash-course-detail?class=${cls}`)}
                />
              ))}
            </HScroll>
          </section>
        )}

        {/* Music · Live Group */}
        {showMusic && (
          <section style={{ marginBottom: 24 }}>
            <SectionHeader title="Music · Live Group" count={liveGroupMusic.length} />
            <Grid>
              {liveGroupMusic.map((p) => (
                <ProductImageCard
                  key={p.id}
                  thumbImage={p.thumbImage}
                  title={p.title}
                  subtitle={p.subtitle}
                  price={p.price}
                  originalPrice={p.originalPrice}
                  onClick={() => navigate(`/marketplace/music/${p.id}`)}
                />
              ))}
            </Grid>
          </section>
        )}

        {/* Music · Self-Paced */}
        {showMusic && (
          <section style={{ marginBottom: 24 }}>
            <SectionHeader title="Music · Self-Paced" count={selfPacedMusic.length} />
            <Grid>
              {selfPacedMusic.map((p) => (
                <ProductImageCard
                  key={p.id}
                  thumbImage={p.thumbImage}
                  title={p.title}
                  subtitle={p.subtitle}
                  price={p.price}
                  originalPrice={p.originalPrice}
                  onClick={() => navigate(`/marketplace/music/${p.id}`)}
                />
              ))}
            </Grid>
          </section>
        )}

        {/* Apps */}
        {showApps && (
          <section style={{ marginBottom: 24 }}>
            <SectionHeader title="Learning Apps" accent={EXPRESS_ACCENT} />
            <AppFeatureCard
              accent={EXPRESS_ACCENT}
              letter="E"
              eyebrow="AI ENGLISH COACH"
              title="Express"
              tagline="Practice speaking with an AI tutor"
              onClick={() => navigate("/marketplace/apps")}
            />
          </section>
        )}

        {/* Empty state */}
        {noneVisible && (
          <div
            className="flex flex-col items-center justify-center"
            style={{ padding: "60px 32px", gap: 8, textAlign: "center" }}
          >
            <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>
              Nothing matches
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
              Try a different age group or category
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
