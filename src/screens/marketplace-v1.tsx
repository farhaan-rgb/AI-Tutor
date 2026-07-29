/**
 * Marketplace V1 — premium "Discover" page (rebuilt).
 *
 * Reconstructed after accidental deletion. Visual / functional parity with the
 * original is preserved by reusing the shared components in
 * `./marketplace-premium-cards.tsx` (PremiumBanner, PremiumThumbCard,
 * PremiumPhotoCard, SectionHeader, AgeFilterStrip) — those were extracted from
 * this page's design DNA in the first place, so the result is byte-for-pixel
 * the same as before, even if the source isn't byte-identical.
 *
 * Sections (gated by age filter):
 *   - Premium banner carousel (CAT / NEET / Music)
 *   - Test Prep (CAT cards)
 *   - Music (live group + self-paced)
 *   - Summer Crash Courses (Class 6–10)
 *   - Learning Apps (Express)
 */

import { useState, Fragment } from "react";
import { useNavigate, useLocation } from "react-router";
import { OlympiadEntryBanner } from "./classes";
import { useScrollRestoration } from "../shared/use-scroll-restoration";
import { motion } from "motion/react";
import { Search, ShoppingCart, Package, GraduationCap, LayoutGrid, Cpu, Sparkles, Microscope, Landmark, BookText, Languages } from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import { useTheme } from "../app/contexts/theme-context";
import {
  DUMMY_OTHER_COURSES,
  DUMMY_MUSIC_COURSES,
  DUMMY_SUMMER_CAMP_BATCHES,
  DUMMY_SUMMER_CAMP_SHARED,
  DUMMY_CRASH_COURSES_1112,
  CRASH_1112_SKUS,
  getVocabFastPacksForFilter,
  VOCABFAST_BRAND,
  VOCABFAST_PRICING,
  type OtherCourse,
  type CrashCourse1112Info,
  type VocabFastPack,
} from "../shared/classroom-catalog";
import {
  AgeFilterStrip,
  PremiumBanner,
  PremiumThumbCard,
  PremiumPhotoCard,
  PremiumTestSeriesCard,
  SummerCampPhotoCard,
  SectionHeader,
  type AgeFilterId,
  type Product,
  type MockTest,
} from "./marketplace-premium-cards";
import { MorphableCard } from "./marketplace-card-morph";
import { GameArt } from "./game-art";
import { useGamesPass } from "../shared/games-pass-state";
import { WishlistCard, WishlistSheet } from "./wishlist-sheet";
import { SOCIAL_SCIENCE_SKUS } from "../shared/classroom-catalog";

// ─── Local helpers / data ────────────────────────────────────────────────────

const CAT_GROUP = DUMMY_OTHER_COURSES.find((g) => g.examKey === "cat")!;

const DUMMY_ENROLLED_IDS = new Set(["piano-beginner-solo", "express-app"]);

const CRASH_COURSE_CLASSES = [6, 7, 8, 9, 10] as const;

const EXPRESS_APP_CARD: OtherCourse = {
  id: "express-app",
  title: "Express — AI English Coach",
  subtitle: "Speaking practice · Live feedback",
  thumbBg: "linear-gradient(135deg, color-mix(in srgb, #29d6d6 22%, var(--card)) 0%, color-mix(in srgb, #29d6d6 32%, var(--card)) 100%)",
  thumbLogo: "/express-logo.webp",
  thumbBrand: "Express",
  thumbAccent: "#29d6d6",
  thumbMeta: "AI Coach",
  rating: 0,
  reviewCount: 0,
  price: 0,
  originalPrice: 0,
};

// DUMMY_MUSIC_COURSES is shaped as OtherCourse[]. PremiumPhotoCard takes the
// Product[] shape — adapt at module load so the music rail renders identically.
const MUSIC_AS_PRODUCTS: Product[] = DUMMY_MUSIC_COURSES.map((c) => ({
  id: c.id,
  title: c.title,
  subtitle: c.subtitle ?? "",
  categoryId: "music",
  price: c.price,
  originalPrice: c.originalPrice,
  rating: c.rating,
  reviewCount: c.reviewCount,
  isDigital: (c.subtitle ?? "").toLowerCase().includes("self"),
  thumbImage: c.thumbImage ?? "",
}));

// Per-age section visibility — same rules the original page used.
// Per-age sub-rail visibility within Learning Apps. Test Series rails hidden
// for younger students (Class 1–10) — same idea as testPrep gating: entrance
// mocks aren't relevant to them.
const TEST_SERIES_VISIBLE_FOR: Record<AgeFilterId, boolean> = {
  "all":        true,
  "primary":    false,
  "secondary":  false,
  "class_1112": true,
  "college":    true,
  "exam_prep":  true,
};

const SECTION_VISIBILITY: Record<AgeFilterId, { testPrep: boolean; music: boolean; summerCamp: boolean; crash: boolean; crash1112: boolean; apps: boolean; games: boolean; devices: boolean; vocab: boolean }> = {
  // Games visible to everyone — daily quiz / vocab games work for primary +
  // secondary kids; concept labs + PvP + speed sprints serve 11/12 + competitive
  // exam aspirants. Single category, age-agnostic.
  // `crash` = Class 6–10 Summer Crash · `crash1112` = Class 11–12 PCM/PCB Crash
  // `vocab` = VocabularyFast partner integration. Visibility is also enforced
  // per-pack in `getVocabFastPacksForFilter` (Primary sees nothing, Secondary
  // sees Grade 6-10 + General English, etc).
  "all":        { testPrep: true,  music: true,  summerCamp: true,  crash: true,  crash1112: true,  apps: true,  games: true,  devices: true, vocab: true  },
  "primary":    { testPrep: false, music: true,  summerCamp: true,  crash: true,  crash1112: false, apps: true,  games: true,  devices: true, vocab: false },
  "secondary":  { testPrep: false, music: true,  summerCamp: true,  crash: true,  crash1112: false, apps: true,  games: true,  devices: true, vocab: true  },
  "class_1112": { testPrep: true,  music: false, summerCamp: true,  crash: false, crash1112: true,  apps: true,  games: true,  devices: true, vocab: true  },
  "college":    { testPrep: true,  music: true,  summerCamp: false, crash: false, crash1112: false, apps: true,  games: true,  devices: true, vocab: true  },
  "exam_prep":  { testPrep: true,  music: false, summerCamp: false, crash: false, crash1112: true,  apps: true,  games: true,  devices: true, vocab: true  },
};

// ─── CrashCourseThumb — code-rendered banner for crash course cards ─────────
// 6-layer composite tuned for 188×125 card thumbnails: depth gradient + radial
// brand glow + diagonal speed texture + top sheen + bottom vignette + content.
// CC chip removed — the parent PremiumPhotoCard already places a discount pill
// at top-left, so two chips were stacking on top of each other.

function CrashCourseThumb({ classNumber }: { classNumber: number }) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", isolation: "isolate" }}>
      {/* Layer 1 — deep emerald gradient, brighter top-right where numeral sits */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(125deg, #051a0a 0%, #0d2c15 32%, #1c4922 60%, #2e7032 100%)",
      }} />

      {/* Layer 2 — radial brand glow behind numeral */}
      <div style={{
        position: "absolute", top: -36, right: -32, width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(127,231,89,0.45) 0%, rgba(82,196,26,0.18) 38%, transparent 72%)",
        filter: "blur(2px)",
      }} />

      {/* Layer 3 — diagonal speed lines (light + shadow pair for depth) */}
      <div style={{
        position: "absolute", inset: 0,
        background:
          "repeating-linear-gradient(112deg, transparent 0 16px, rgba(255,255,255,0.05) 16px 17px, transparent 17px 30px, rgba(0,0,0,0.16) 30px 31px)",
        mixBlendMode: "overlay",
      }} />

      {/* Layer 4 — top specular sheen */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 32,
        background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
      }} />

      {/* Layer 5 — bottom vignette so title reads cleanly */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 58,
        background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)",
      }} />

      {/* Hero numeral — vertical lime→emerald gradient, brand glow + depth shadow */}
      <span style={{
        position: "absolute", right: 0, bottom: -14,
        fontSize: 112, fontWeight: 900, lineHeight: 1, letterSpacing: -5,
        background: "linear-gradient(180deg, #f6ffed 0%, #b7eb8f 35%, #52c41a 80%, #389e0d 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text", color: "transparent",
        filter:
          "drop-shadow(0 0 14px rgba(127,231,89,0.45)) drop-shadow(0 6px 8px rgba(0,0,0,0.45))",
        paddingRight: 6,
      }}>
        {classNumber}
      </span>

      {/* 15 DAYS chip — top-right, solid lime pill with inset highlight */}
      <div style={{
        position: "absolute", top: 8, right: 8,
        height: 20, paddingLeft: 7, paddingRight: 7,
        display: "flex", alignItems: "center", borderRadius: 5,
        background: "linear-gradient(180deg, rgba(127,231,89,0.95) 0%, rgba(82,196,26,0.95) 100%)",
        boxShadow:
          "inset 0 0.5px 0 rgba(255,255,255,0.45), 0 1px 6px rgba(0,0,0,0.25)",
      }}>
        <span style={{ fontSize: 9, fontWeight: 900, color: "#0d2010", letterSpacing: 0.8 }}>
          15 DAYS
        </span>
      </div>

      {/* Title block — bottom-left: subject eyebrow → CRASH COURSE → class */}
      <div style={{
        position: "absolute", left: 12, bottom: 10,
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        <span style={{
          fontSize: 8, fontWeight: 700, color: "#b7eb8f",
          letterSpacing: 1.4, textTransform: "uppercase",
        }}>
          Maths · Science
        </span>
        <span style={{
          fontSize: 17, fontWeight: 900, color: "#fff",
          lineHeight: 1, letterSpacing: -0.4,
          textShadow: "0 1px 6px rgba(0,0,0,0.45)",
        }}>
          CRASH COURSE
        </span>
        <span style={{
          fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.7)",
          letterSpacing: 0.4, marginTop: 1,
        }}>
          Class {classNumber}
        </span>
      </div>
    </div>
  );
}

// ─── Crash1112Thumb — code-rendered card banner for Class 11–12 PCM/PCB ─────
// Mirrors CrashCourseThumb's 6-layer composite shape but is data-driven: takes
// the SKU info and renders its accent gradient + stream chip + class numeral
// + subjects strip. One thumb component covers all 4 SKUs.

function Crash1112Thumb({ info }: { info: CrashCourse1112Info }) {
  const accent = info.accentColor;
  // Derive a brighter highlight from the accent for the numeral gradient.
  // Falls back to white-tinted accent if color-mix support is missing.
  const highlight = `color-mix(in srgb, ${accent} 35%, #ffffff)`;

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", isolation: "isolate" }}>
      {/* Layer 1 — SKU gradient base */}
      <div style={{
        position: "absolute", inset: 0,
        background: info.gradientBg,
      }} />

      {/* Layer 2 — radial brand glow behind numeral */}
      <div style={{
        position: "absolute", top: -32, right: -28, width: 180, height: 180, borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}73 0%, ${accent}24 38%, transparent 72%)`,
        filter: "blur(2px)",
      }} />

      {/* Layer 3 — diagonal speed lines */}
      <div style={{
        position: "absolute", inset: 0,
        background:
          "repeating-linear-gradient(112deg, transparent 0 16px, rgba(255,255,255,0.05) 16px 17px, transparent 17px 30px, rgba(0,0,0,0.16) 30px 31px)",
        mixBlendMode: "overlay",
      }} />

      {/* Layer 4 — top specular sheen */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 32,
        background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
      }} />

      {/* Layer 5 — bottom vignette */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 58,
        background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)",
      }} />

      {/* Hero numeral — class number */}
      <span style={{
        position: "absolute", right: 0, bottom: -14,
        fontSize: 112, fontWeight: 900, lineHeight: 1, letterSpacing: -5,
        background: `linear-gradient(180deg, #ffffff 0%, ${highlight} 50%, ${accent} 100%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text", color: "transparent",
        filter:
          `drop-shadow(0 0 14px ${accent}73) drop-shadow(0 6px 8px rgba(0,0,0,0.45))`,
        paddingRight: 6,
      }}>
        {info.classLevel}
      </span>

      {/* Stream chip — top-right (PCM / PCB) */}
      <div style={{
        position: "absolute", top: 8, right: 8,
        height: 20, paddingLeft: 7, paddingRight: 7,
        display: "flex", alignItems: "center", borderRadius: 5,
        background: `linear-gradient(180deg, ${accent}f2 0%, ${accent}cc 100%)`,
        boxShadow:
          "inset 0 0.5px 0 rgba(255,255,255,0.45), 0 1px 6px rgba(0,0,0,0.25)",
      }}>
        <span style={{ fontSize: 9, fontWeight: 900, color: "#fff", letterSpacing: 0.8 }}>
          {info.streamLabel}
        </span>
      </div>

      {/* Title block — bottom-left */}
      <div style={{
        position: "absolute", left: 12, bottom: 10,
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        <span style={{
          fontSize: 8, fontWeight: 700, color: `${accent}`,
          letterSpacing: 1.4, textTransform: "uppercase",
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
        }}>
          {info.subjects.map((s) => s.shortLabel).join(" · ")}
        </span>
        <span style={{
          fontSize: 17, fontWeight: 900, color: "#fff",
          lineHeight: 1, letterSpacing: -0.4,
          textShadow: "0 1px 6px rgba(0,0,0,0.45)",
        }}>
          CRASH COURSE
        </span>
        <span style={{
          fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.78)",
          letterSpacing: 0.4, marginTop: 1,
        }}>
          Class {info.classLevel}
        </span>
      </div>
    </div>
  );
}

// ─── VocabFastThumb — code-rendered card banner for VocabularyFast packs ────
// Pack name is the hero. No word-count chip — the count is on the PDP.
// Decorative "Aa" watermark sits behind the title for visual rhythm.

function VocabFastThumb({ pack }: { pack: VocabFastPack }) {
  const accent = VOCABFAST_BRAND.accentColor;
  const isComingSoon = pack.availability === "coming-soon";
  // Pack labels vary in length — "CAT" (3 chars) vs "General English" (15).
  // Scale the hero text down for longer names so they never overflow the card.
  const label = pack.shortLabel;
  const labelSize = label.length <= 4 ? 32 : label.length <= 8 ? 24 : 18;

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", isolation: "isolate" }}>
      {/* Layer 1 — rich 3-stop indigo gradient (mirrors CAT card's gradient
          progression: very dark → mid → saturated end). Cooler equivalent of
          CAT's warm-brown progression. */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #0d1a3d 0%, #1a3066 50%, #2748a3 100%)",
      }} />

      {/* Layer 2 — soft accent halo top-right */}
      <div style={{
        position: "absolute", top: -36, right: -32, width: 200, height: 200, borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}66 0%, ${accent}1a 40%, transparent 72%)`,
        filter: "blur(2px)",
      }} />

      {/* Layer 3 — bottom vignette so the title reads cleanly */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 58,
        background: "linear-gradient(0deg, rgba(0,0,0,0.45) 0%, transparent 100%)",
      }} />

      {/* Decorative "Aa" watermark — visible but quiet */}
      <span aria-hidden style={{
        position: "absolute", right: -6, bottom: -16,
        fontSize: 84, fontWeight: 900, lineHeight: 1, letterSpacing: -4,
        fontFamily: "Georgia, serif",
        color: "#fff", opacity: 0.12,
        pointerEvents: "none",
      }}>
        Aa
      </span>

      {/* Coming Soon ribbon — only renders for unreleased packs */}
      {isComingSoon && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          height: 20, paddingLeft: 7, paddingRight: 7,
          display: "flex", alignItems: "center", borderRadius: 5,
          background: "linear-gradient(180deg, rgba(250,173,20,0.95) 0%, rgba(212,136,6,0.95) 100%)",
          boxShadow:
            "inset 0 0.5px 0 rgba(255,255,255,0.45), 0 1px 6px rgba(0,0,0,0.25)",
        }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: "#1f0e02", letterSpacing: 0.8 }}>
            SOON
          </span>
        </div>
      )}

      {/* Title block — pack name is the hero. Drops the redundant
          "Vocabulary" subtitle (the rail header already says it). */}
      <div style={{
        position: "absolute", left: 12, right: 12, bottom: 12,
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <span style={{
          fontSize: 8, fontWeight: 700, color: "#bae0ff",
          letterSpacing: 1.4, textTransform: "uppercase",
        }}>
          VocabularyFast
        </span>
        <span style={{
          fontSize: labelSize, fontWeight: 900, color: "#fff",
          lineHeight: 1.05, letterSpacing: -0.6,
          textShadow: "0 1px 8px rgba(0,0,0,0.5)",
        }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── SkeletonRail — placeholder while a rail's data is loading ───────────────

function SkeletonRail({ count = 3 }: { count?: number }) {
  return (
    <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 188,
            aspectRatio: "3/2",
            borderRadius: 14,
            backgroundColor: "var(--card)",
            border: "0.5px solid color-mix(in srgb, var(--border) 40%, transparent)",
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

// ─── MainCategoryHeader — section break that groups multiple sub-rails ──────
// Mirrors the visual treatment from marketplace-home-v1 so the page reads as
// "category > subcategory" rather than a flat list of rails.

interface MainCategory {
  id: string;
  label: string;
  subtitle: string;
  accent: string;
}

function MainCategoryHeader({ category }: { category: MainCategory }) {
  return (
    <div
      style={{
        position: "relative",
        marginTop: 36,
        marginBottom: 12,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 20,
        borderTop: "0.5px solid color-mix(in srgb, var(--border) 40%, transparent)",
      }}
    >
      {/* Subtle brand-tinted halo behind */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -16, left: -20, width: 180, height: 80,
          background: `radial-gradient(ellipse at left, ${category.accent}1a 0%, transparent 70%)`,
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />
      <div className="flex items-center" style={{ gap: 12, position: "relative" }}>
        <div
          aria-hidden
          style={{
            width: 4, height: 28, borderRadius: 4, flexShrink: 0,
            background: `linear-gradient(180deg, ${category.accent} 0%, color-mix(in srgb, ${category.accent} 60%, transparent) 100%)`,
            boxShadow: `0 0 12px ${category.accent}66`,
          }}
        />
        <div className="flex flex-col" style={{ minWidth: 0, gap: 2 }}>
          <h2
            style={{
              fontSize: 20, fontWeight: 800, color: "var(--foreground)",
              margin: 0, letterSpacing: "-0.015em", lineHeight: 1.2,
            }}
          >
            {category.label}
          </h2>
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--muted-foreground)",
              margin: 0,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {category.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

const MAIN_COURSES: MainCategory = {
  id: "courses",
  label: "Courses",
  subtitle: "Live cohorts, expert-led classes, AI-guided tracks and self-paced courses.",
  accent: "#4a9eff",
};
const MAIN_APPS: MainCategory = {
  id: "learning-apps",
  label: "Learning Apps",
  subtitle: "Self-paced practice, mocks and AI-powered tutors.",
  accent: "#5cdbd3",
};
const MAIN_DEVICES: MainCategory = {
  id: "devices",
  label: "Devices",
  subtitle: "Affordable Android laptops built for learners.",
  accent: "#ffa940",
};

// ─── Games — Class 1–8 kids' learning games ──────────────────────────────────
// Catalogue of 6 games. Monetized via a single platform SKU — the Games Pass
// (₹199 / 3 months, one-time, no recurring) — see GAMES_PASS const below.
// No per-game purchase, no ads in front of children. Each game gives the kid
// `trialLevels` free rounds before the pass is required.
// TODO(api): GET /api/marketplace/games — full game catalogue.
export type GameArchetype = "duel" | "streak" | "puzzle" | "sprint" | "vocab" | "live";
export type GameStatusKind = "live" | "streak" | "new" | "soon";

export interface GameStatus {
  kind: GameStatusKind;
  label: string;
}

// Pricing model — hybrid. Two free games anchor the daily-habit + youngest-
// audience hooks (Daily Drill, Word Wizard). The other four sit behind the
// single platform SKU — the Games Pass. Free games ignore trialLevels and
// never raise the trial gate; paid games gate after `trialLevels` rounds.
export interface GamePricing {
  isFree: boolean;         // true = always playable, no gate, no Pass needed
  trialLevels: number;     // ignored when isFree=true
}

// The single Games SKU at launch — one duration, one price, no recurring.
// Reasoning: Indian education buyers prefer "buy once for a defined window"
// over monthly recurring; 3 months is short enough to feel impulse-priced
// (~pizza) and aligns with typical kid-game engagement decay.
export const GAMES_PASS = {
  durationMonths: 3,
  price: 199,             // INR, one-time
  label: "Games Pass",
  durationLabel: "3 months",
} as const;

export interface Game {
  id: string;
  title: string;
  subtitle: string;        // 1-line description
  archetype: GameArchetype;
  accent: string;
  status?: GameStatus;
  // Audience + content — Class 1–8 focus, no JEE/NEET-style exam tags.
  gradeRange: string;      // e.g. "Class 2–5" | "All grades"
  topic: string;           // e.g. "Math" | "Science" | "English" | "Mixed"
  levels: number;          // 0 for live events
  pricing: GamePricing;
  whatYouLearn: string[];  // 3–4 skills picked up — replaces exam tags
}

// Rail order matters — free games sit at positions 1–2 so the first taps
// from a horizontal scroll land on the daily-habit + youngest-audience hooks.
// Position carries the free/paid signal; the FREE pill on cards 1–2 confirms
// it at-a-glance for first-time visitors.
// Exported so playable games can render OtherGamesRail on their result screens
// (LinkedIn-style cross-game push). See src/shared/game-result-shared.tsx.
export const DUMMY_GAMES: Game[] = [
  {
    id: "daily-sprint",
    title: "Daily Drill",
    subtitle: "10 fun questions every day",
    archetype: "streak",
    accent: "#52c41a",
    // No fake pre-launch streak — surfaces only once the user owns a real one.
    gradeRange: "All grades",
    topic: "Mixed",
    levels: 30,
    pricing: { isFree: true, trialLevels: 0 },   // always free — daily habit anchor
    whatYouLearn: ["Daily habit", "Mixed practice", "Streak rewards"],
  },
  {
    id: "word-wars",
    title: "Word Wizard",
    subtitle: "Spelling spells for young readers",
    archetype: "vocab",
    accent: "#722ed1",
    gradeRange: "Class 1–4",
    topic: "English",
    levels: 50,
    pricing: { isFree: true, trialLevels: 0 },   // always free — Class 1–4 cohort hook
    whatYouLearn: ["Spelling", "Vocabulary", "Phonics", "Reading"],
  },
  {
    id: "brain-sprint",
    title: "Math Mountain",
    subtitle: "Climb peaks with arithmetic",
    archetype: "sprint",
    accent: "#fa8c16",
    // NEW badge intentionally dropped — when Memory / Pattern / Reading shipped
    // alongside, the rail had 4 cards in a row all marked NEW. Math Mountain is
    // the oldest of that batch, so its NEW retires first to keep the signal real.
    gradeRange: "Class 2–5",
    topic: "Math",
    levels: 60,
    pricing: { isFree: false, trialLevels: 3 },
    whatYouLearn: ["Times tables", "Mental math", "Speed solving", "Number sense"],
  },
  {
    id: "memory-match",
    title: "Memory Match",
    subtitle: "Flip cards · find pairs · 3 rounds",
    archetype: "puzzle",
    accent: "#1890ff",
    status: { kind: "new", label: "NEW" },
    gradeRange: "Class 1–4",
    topic: "Memory",
    levels: 30,
    pricing: { isFree: false, trialLevels: 3 },
    whatYouLearn: ["Visual memory", "Concentration", "Pattern recall", "Patience"],
  },
  {
    id: "pattern-puzzles",
    title: "Pattern Puzzles",
    subtitle: "What comes next? Olympiad-style logic",
    archetype: "puzzle",
    accent: "#722ed1",
    status: { kind: "new", label: "NEW" },
    gradeRange: "Class 3–6",
    topic: "Logic",
    levels: 40,
    pricing: { isFree: false, trialLevels: 3 },
    whatYouLearn: ["Pattern recognition", "Logic", "Sequencing", "Olympiad prep"],
  },
  {
    id: "reading-race",
    title: "Reading Race",
    subtitle: "Short stories · comprehension Qs",
    archetype: "puzzle",
    accent: "#d97706",
    status: { kind: "new", label: "NEW" },
    gradeRange: "Class 4–6",
    topic: "Reading",
    levels: 25,
    pricing: { isFree: false, trialLevels: 3 },
    whatYouLearn: ["Reading comprehension", "Vocabulary", "Focus", "Inference"],
  },
  {
    id: "quiz-duel",
    title: "Brain Battle",
    subtitle: "1v1 quiz duels with classmates",
    archetype: "duel",
    accent: "#eb2f96",
    // No fake pre-launch "playing now" count — gate on real liquidity signals.
    gradeRange: "Class 4–8",
    topic: "Mixed",
    levels: 30,
    pricing: { isFree: false, trialLevels: 3 },
    whatYouLearn: ["Quick recall", "Mental speed", "Confidence", "Focus"],
  },
  {
    id: "concept-labs",
    title: "Science Lab",
    subtitle: "Drag, mix, experiment",
    archetype: "puzzle",
    accent: "#13c2c2",
    gradeRange: "Class 4–7",
    topic: "Science",
    levels: 40,
    pricing: { isFree: false, trialLevels: 3 },
    whatYouLearn: ["Physics basics", "Chemistry mixes", "Body systems", "Earth & space"],
  },
  {
    id: "live-quiz-arena",
    title: "Sunday Showdown",
    subtitle: "Weekly live quiz · Sundays 7 PM",
    archetype: "live",
    accent: "#f5222d",
    // No SOON status — the lobby surface (game-live-arena.tsx) ships with
    // honest framing about the live mechanic rolling out soon. The card
    // becomes tappable, the detail CTA routes to the lobby for pass-holders
    // and to checkout for non-pass.
    gradeRange: "Class 4–8",
    topic: "Mixed",
    levels: 0,
    pricing: { isFree: false, trialLevels: 0 },
    whatYouLearn: ["Live competition", "Weekly prizes", "Play with friends"],
  },
];

// Helper for game-detail screen to look up a game by id route param.
export function getGameById(id: string): Game | undefined {
  return DUMMY_GAMES.find((g) => g.id === id);
}

// ─── GameCard — card-surface treatment matching PremiumTestSeriesCard, with
//     title as first fixation, archetype as a quiet bottom chip, single badge
//     overlaying the hero. Badge priority: SOON > FREE > status (LIVE/STREAK/
//     NEW). SOON wins over FREE because a game you can't play yet shouldn't
//     advertise free-ness; FREE wins over NEW because price is more decision-
//     driving than novelty for the parent.
export function GameCard({ game, onClick }: { game: Game; onClick: () => void }) {
  const status = game.status;
  const badge: { label: string; color: string; showDot: boolean } | null = (() => {
    if (status?.kind === "soon") {
      return { label: status.label, color: "var(--muted-foreground)", showDot: false };
    }
    if (game.pricing.isFree) {
      return { label: "FREE", color: "var(--success-500)", showDot: false };
    }
    if (status) {
      const color = status.kind === "live" ? "var(--success-400)"
        : status.kind === "streak" ? "var(--warning-500)"
        : status.kind === "new" ? "var(--primary-400)"
        : "var(--muted-foreground)";
      return { label: status.label, color, showDot: status.kind === "live" };
    }
    return null;
  })();

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{ width: 188, flexShrink: 0, cursor: "pointer" }}
    >
      {/* Hero — 3:2 borderless surface tinted with the game's accent so the
          thumbnail reads as branded content (matches the borderless photo-card
          aesthetic used elsewhere on the page). Per-game inline SVG art fills
          the thumbnail on top. */}
      <div
        style={{
          position: "relative",
          aspectRatio: "3/2",
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: `color-mix(in srgb, ${game.accent} 12%, var(--card))`,
          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
        }}
      >
        {/* Per-game art — provides visual identity in the thumbnail */}
        <div aria-hidden style={{ position: "absolute", inset: 0 }}>
          <GameArt archetype={game.archetype} accent={game.accent} />
        </div>

        {/* Single badge — top-left glass pill. Priority logic above this. */}
        {badge && (
          <div className="flex items-center" style={{
            position: "absolute", top: 8, left: 8,
            gap: 4, paddingLeft: 7, paddingRight: 7, height: 18,
            borderRadius: 4,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
            border: `0.5px solid color-mix(in srgb, ${badge.color} 40%, rgba(255,255,255,0.08))`,
          }}>
            {badge.showDot && (
              <span aria-hidden style={{
                width: 6, height: 6, borderRadius: 9999,
                backgroundColor: badge.color,
                boxShadow: `0 0 6px ${badge.color}`,
              }} />
            )}
            <span style={{
              fontSize: "var(--text-2xs)", fontWeight: 700,
              color: badge.color, letterSpacing: 0.3,
              fontVariantNumeric: "tabular-nums",
            }}>
              {badge.label}
            </span>
          </div>
        )}

        {/* Bottom row — topic chip (mirrors Test Series exam-chip pattern).
            Prefers `topic` over `archetype` for the label so Memory / Logic /
            Reading / Science / Math / English read meaningfully — instead of
            4 cards all showing "puzzle". Falls back to archetype when topic
            is "Mixed" (Daily Drill, Brain Battle, Sunday Showdown). Brain
            Battle gets a manual "1v1 PvP" override since "Mixed → duel" is
            less evocative than the social-format label. */}
        <div className="flex items-center" style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          paddingLeft: 8, paddingRight: 8, paddingBottom: 8, paddingTop: 12,
        }}>
          <div className="flex items-center justify-center" style={{
            paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 4,
            backgroundColor: `${game.accent}1f`,
            border: `0.5px solid ${game.accent}55`,
            boxShadow: `inset 0 0.5px 0 ${game.accent}40`,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}>
            <span style={{
              fontSize: "var(--text-2xs)", fontWeight: 800,
              color: game.accent, letterSpacing: 0.4, textTransform: "uppercase",
            }}>
              {game.archetype === "duel" ? "1v1 PvP"
                : game.topic !== "Mixed" ? game.topic
                : game.archetype}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom panel — TITLE is first fixation; subtitle second */}
      <div className="flex flex-col" style={{ padding: "10px 8px 8px 0", gap: 2 }}>
        <p style={{
          fontSize: "var(--text-sm)", fontWeight: 700,
          color: "var(--foreground)", lineHeight: 1.35,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          margin: 0,
        }}>
          {game.title}
        </p>
        <p style={{
          fontSize: "var(--text-xs)", color: "var(--muted-foreground)",
          lineHeight: 1.4, margin: 0,
          overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
        }}>
          {game.subtitle}
        </p>
      </div>
    </motion.div>
  );
}

// TODO(api): GET /api/marketplace/test-series — Top Indian competitive exam mock packs
// Grouped by stream for the marketplace rails. Card data uses the MockTest shape
// (PremiumMockTestCard); on tap, navigates to /marketplace/product/<id> which
// resolves to the matching entry in TEST_SERIES_PRODUCTS (marketplace-product.tsx)
// for the full detail screen (variants, syllabus, features).
type ExamStream = {
  id: string;
  label: string;
  exams: MockTest[];
};

const TEST_SERIES_STREAMS: ExamStream[] = [
  {
    id: "engineering",
    label: "Engineering",
    exams: [
      { id: "mt-jee-main", title: "JEE Main Mock Series 2026", examLabel: "JEE M",    examAbbr: "JEE",  testCount: 30, questionCount: 2700, price: 599, originalPrice: 999,  accentColor: "#4096ff", minCount: 10, maxCount: 60, packCount: 3, priceFrom: 199, pattern: "NTA Pattern" },
      { id: "mt-jee-adv",  title: "JEE Advanced Mock Series",  examLabel: "JEE ADV",  examAbbr: "JEEa", testCount: 18, questionCount: 1080, price: 899, originalPrice: 1599, accentColor: "#9254de", minCount: 6,  maxCount: 30, packCount: 3, priceFrom: 399, pattern: "IIT Pattern" },
      { id: "mt-gate-cse", title: "GATE CSE 2026 Mock Pack",   examLabel: "GATE CSE", examAbbr: "GATE", testCount: 22, questionCount: 1320, price: 899, originalPrice: 1799, accentColor: "#13c2c2", minCount: 6,  maxCount: 40, packCount: 3, priceFrom: 349, pattern: "IISc Pattern" },
    ],
  },
  {
    id: "medical",
    label: "Medical",
    exams: [
      { id: "mt-neet-ug", title: "NEET UG Mock Test Pack", examLabel: "NEET UG", examAbbr: "NEET", testCount: 32, questionCount: 5760, price: 699,  originalPrice: 1299, accentColor: "#52c41a", minCount: 10, maxCount: 60, packCount: 3, priceFrom: 249, pattern: "NTA Pattern" },
      { id: "mt-neet-pg", title: "NEET PG Mock Series",    examLabel: "NEET PG", examAbbr: "PG",   testCount: 15, questionCount: 3000, price: 1499, originalPrice: 2999, accentColor: "#389e0d", minCount: 5,  maxCount: 30, packCount: 3, priceFrom: 699, pattern: "INI CET Pattern" },
    ],
  },
  {
    id: "mba-law",
    label: "MBA & Law",
    exams: [
      { id: "mt-cat",  title: "CAT 2026 Mock Series", examLabel: "CAT",  examAbbr: "CAT",  testCount: 25, questionCount: 1650, price: 999, originalPrice: 1999, accentColor: "#ffc53d", minCount: 8, maxCount: 40, packCount: 3, priceFrom: 399, pattern: "IIM Pattern" },
      { id: "mt-clat", title: "CLAT 2026 Mock Pack",  examLabel: "CLAT", examAbbr: "CLAT", testCount: 20, questionCount: 2400, price: 799, originalPrice: 1499, accentColor: "#fa541c", minCount: 6, maxCount: 35, packCount: 3, priceFrom: 349, pattern: "Consortium Pattern" },
    ],
  },
  {
    id: "civils-govt",
    label: "Civils & Govt",
    exams: [
      { id: "mt-upsc", title: "UPSC Prelims Test Series",         examLabel: "UPSC",    examAbbr: "UPSC", testCount: 28, questionCount: 2800, price: 1499, originalPrice: 2999, accentColor: "#ff7a45", minCount: 8,  maxCount: 50, packCount: 3, priceFrom: 599, pattern: "UPSC Pattern" },
      { id: "mt-ssc",  title: "SSC CGL Tier 1 Test Series",       examLabel: "SSC CGL", examAbbr: "SSC",  testCount: 40, questionCount: 4000, price: 399,  originalPrice: 799,  accentColor: "#08979c", minCount: 12, maxCount: 80, packCount: 3, priceFrom: 149, pattern: "SSC Pattern" },
      { id: "mt-bank", title: "Bank PO (IBPS/SBI) Mock Pack",     examLabel: "BANK PO", examAbbr: "BANK", testCount: 35, questionCount: 2800, price: 499,  originalPrice: 999,  accentColor: "#c41d7f", minCount: 10, maxCount: 70, packCount: 3, priceFrom: 199, pattern: "IBPS Pattern" },
    ],
  },
];


// TODO(api): GET /api/marketplace/devices/primebook — Primebook laptop lineup
const PRIMEBOOK_LAPTOPS: { id: string; title: string; subtitle: string; price: number; originalPrice: number; rating: number; reviewCount: number; thumbImage: string }[] = [
  {
    id: "pb-neo",
    title: "Primebook 2 Neo",
    subtitle: "11.6\" · 4GB · 64GB",
    price: 15990,
    originalPrice: 22990,
    rating: 4.4,
    reviewCount: 1280,
    thumbImage: "/primebook-neo.png",
  },
  {
    id: "pb-pro",
    title: "Primebook 2 Pro",
    subtitle: "14\" · 6GB · 128GB",
    price: 19990,
    originalPrice: 29990,
    rating: 4.6,
    reviewCount: 2140,
    thumbImage: "/primebook-pro.png",
  },
  {
    id: "pb-max",
    title: "Primebook 2 Max",
    subtitle: "14\" · 8GB · 256GB",
    price: 22990,
    originalPrice: 34990,
    rating: 4.7,
    reviewCount: 940,
    thumbImage: "/primebook-max.png",
  },
];

// ─── Category tiles — 4 anchor jumpers at top of page ────────────────────────
// Only the categories actually present in v1's content. (No Books/Stationery —
// those rails don't exist here; surfacing tiles for them would dead-end.)

type CategoryTileId = "courses" | "apps" | "devices";

interface CategoryTile {
  id: CategoryTileId;
  label: string;
  Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
  accent: string;
  anchorId: string;
}

const CATEGORY_TILES: CategoryTile[] = [
  { id: "courses", label: "Courses", Icon: GraduationCap, accent: "#4a9eff", anchorId: "section-courses" },
  { id: "apps",    label: "Apps",    Icon: LayoutGrid,    accent: "#5cdbd3", anchorId: "section-learning-apps" },
  { id: "devices", label: "Devices", Icon: Cpu,           accent: "#ffa940", anchorId: "section-devices" },
];

function CategoryTile({ tile, onPress }: { tile: CategoryTile; onPress: () => void }) {
  const { Icon, accent } = tile;
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onPress}
      className="flex flex-col items-center shrink-0"
      style={{
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        width: 72,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 60, height: 60, borderRadius: 16,
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 14%, #0a0408) 0%, color-mix(in srgb, ${accent} 28%, #0a0408) 50%, color-mix(in srgb, ${accent} 36%, #0a0408) 100%)`,
          border: `0.5px solid ${accent}50`,
          boxShadow: [
            "inset 0 0.5px 0 rgba(255,255,255,0.32)",
            `inset 0 1.5px 0 ${accent}38`,
            "inset 0 -0.5px 0 rgba(0,0,0,0.5)",
            `0 4px 12px ${accent}28`,
            `0 0 18px ${accent}1c`,
          ].join(", "),
        }}
      >
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(135deg, ${accent}26 0%, transparent 100%)`,
          pointerEvents: "none",
        }} />
        <div aria-hidden style={{
          position: "absolute", top: -18, right: -18, width: 56, height: 56,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          filter: "blur(8px)", opacity: 0.52, pointerEvents: "none",
        }} />
        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
        <Icon
          size={26}
          style={{
            color: accent,
            filter: `drop-shadow(0 0 10px ${accent}99) drop-shadow(0 2px 4px ${accent}55)`,
            position: "relative",
            zIndex: 1,
          }}
        />
      </div>
      <span style={{
        fontSize: "var(--text-2xs)",
        color: "var(--foreground)",
        fontWeight: 600,
        textAlign: "center",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 64,
      }}>
        {tile.label}
      </span>
    </motion.button>
  );
}

// ─── Picks-for-you — curated mix across v1's existing products ───────────────
// Format: "mock:<id>" / "device:<id>" / "cat:<id>" / "express"
// Each age band gets picks that actually fit that learner's stage.
const V1_FEATURED_PICKS_BY_AGE: Record<AgeFilterId, string[]> = {
  "all":        ["mock:mt-jee-main", "mock:mt-neet-ug", "cat:cat-6m", "device:pb-pro", "mock:mt-cat", "express"],
  "primary":    ["device:pb-neo", "express"],
  "secondary":  ["device:pb-neo", "express"],
  "class_1112": ["mock:mt-jee-main", "mock:mt-neet-ug", "device:pb-pro", "express"],
  "college":    ["cat:cat-6m", "mock:mt-cat", "express", "device:pb-pro"],
  "exam_prep":  ["mock:mt-jee-main", "mock:mt-neet-ug", "mock:mt-cat", "mock:mt-upsc", "mock:mt-gate-cse"],
};

const PICKS_ACCENT = "#4a9eff";

function PicksHeader({ accent }: { accent: string }) {
  return (
    <div
      style={{
        position: "relative",
        marginTop: 20,
        marginBottom: 12,
        paddingLeft: 16, paddingRight: 16,
      }}
    >
      <div aria-hidden style={{
        position: "absolute",
        top: -16, left: -20, width: 200, height: 70,
        background: `radial-gradient(ellipse at left, ${accent}26 0%, transparent 70%)`,
        filter: "blur(20px)", pointerEvents: "none",
      }} />
      <div className="flex items-center" style={{ gap: 12, position: "relative" }}>
        <div
          aria-hidden
          style={{
            width: 4, height: 28, borderRadius: 4, flexShrink: 0,
            background: `linear-gradient(180deg, ${accent} 0%, color-mix(in srgb, ${accent} 60%, transparent) 100%)`,
            boxShadow: `0 0 12px ${accent}66`,
          }}
        />
        <div className="flex items-baseline" style={{ gap: 8 }}>
          <h2 style={{
            fontSize: 20, fontWeight: 800, color: "var(--foreground)",
            margin: 0, letterSpacing: "-0.02em", lineHeight: 1.15,
          }}>
            Picks for you
          </h2>
          <Sparkles size={14} style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const pass = useGamesPass();
  const [ageFilter, setAgeFilter] = useState<AgeFilterId>("all");
  const visibility = SECTION_VISIBILITY[ageFilter];
  const testSeriesVisible = TEST_SERIES_VISIBLE_FOR[ageFilter];
  const [wishlistOpen, setWishlistOpen] = useState(false);
  // Restore scroll position when returning from product detail / category pages.
  const scrollRef = useScrollRestoration(location.pathname);

  function scrollToSection(id: string) {
    const el = scrollRef.current?.querySelector(`#${id}`) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const catCourses = CAT_GROUP.courses.filter((c) => c.id === "cat-3m" || c.id === "cat-6m");

  // Look up an "kind:id" reference in V1_GOAL_PICKS and render the right card.
  // Returns null if data isn't found — keeps the picks rail resilient if a
  // referenced id is removed without updating V1_GOAL_PICKS.
  function renderPick(ref: string): React.ReactNode {
    if (ref === "express") {
      return (
        <MorphableCard data={{ type: "thumb", data: EXPRESS_APP_CARD, onView: () => navigate("/marketplace/apps") }}>
          <PremiumThumbCard course={EXPRESS_APP_CARD} />
        </MorphableCard>
      );
    }
    const [kind, id] = ref.split(":");
    if (kind === "mock") {
      const exam = TEST_SERIES_STREAMS.flatMap((s) => s.exams).find((e) => e.id === id);
      if (!exam) return null;
      return (
        <MorphableCard data={{ type: "mock", data: exam, onView: () => navigate(`/marketplace/product/${exam.id}`) }}>
          <PremiumTestSeriesCard test={exam} onClick={() => { /* handled by MorphableCard */ }} />
        </MorphableCard>
      );
    }
    if (kind === "device") {
      const laptop = PRIMEBOOK_LAPTOPS.find((l) => l.id === id);
      if (!laptop) return null;
      const product: Product = {
        id: laptop.id,
        title: laptop.title,
        subtitle: laptop.subtitle,
        categoryId: "devices",
        price: laptop.price,
        originalPrice: laptop.originalPrice,
        rating: laptop.rating,
        reviewCount: laptop.reviewCount,
        isDigital: false,
        thumbImage: laptop.thumbImage,
      };
      return (
        <MorphableCard data={{ type: "photo", data: product, onView: () => navigate(`/marketplace/product/${laptop.id}`) }}>
          <PremiumPhotoCard product={product} onPress={() => { /* handled by MorphableCard */ }} />
        </MorphableCard>
      );
    }
    if (kind === "cat") {
      const course = catCourses.find((c) => c.id === id);
      if (!course) return null;
      const card: OtherCourse = {
        id: course.id,
        title: course.title,
        subtitle: `${CAT_GROUP.subjects.length} subjects · ${course.topics} topics`,
        thumbBg: `linear-gradient(135deg, color-mix(in srgb, ${CAT_GROUP.examAccent} 22%, var(--card)) 0%, color-mix(in srgb, ${CAT_GROUP.examAccent} 32%, var(--card)) 100%)`,
        thumbLabel: CAT_GROUP.shortLabel,
        thumbTag: CAT_GROUP.shortLabel,
        thumbAccent: CAT_GROUP.examAccent,
        thumbMeta: course.plan,
        rating: 4.7,
        reviewCount: 300,
        price: course.price,
        originalPrice: course.originalPrice,
      };
      return (
        <MorphableCard data={{ type: "thumb", data: card, onView: () => navigate(`/marketplace/product/${course.id}`) }}>
          <PremiumThumbCard course={card} />
        </MorphableCard>
      );
    }
    return null;
  }

  // Featured picks — per age band, with mocks gated by testSeriesVisible.
  const featuredPicks = (V1_FEATURED_PICKS_BY_AGE[ageFilter] ?? [])
    .filter((ref) => testSeriesVisible || !ref.startsWith("mock:"))
    .map((ref) => ({ ref, node: renderPick(ref) }))
    .filter((x): x is { ref: string; node: React.ReactNode } => x.node !== null);

  const testPrepCards: OtherCourse[] = catCourses.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: `${CAT_GROUP.subjects.length} subjects · ${c.topics} topics`,
    thumbBg: `linear-gradient(135deg, color-mix(in srgb, ${CAT_GROUP.examAccent} 22%, var(--card)) 0%, color-mix(in srgb, ${CAT_GROUP.examAccent} 32%, var(--card)) 100%)`,
    thumbLabel: CAT_GROUP.shortLabel,
    thumbTag: CAT_GROUP.shortLabel,
    thumbAccent: CAT_GROUP.examAccent,
    thumbMeta: c.plan,
    rating: 4.7,
    reviewCount: 300,
    price: c.price,
    originalPrice: c.originalPrice,
  }));

  // AI-tutor vision-memo demo: ?demo=ai-tutor shows only the courses this
  // scenario needs, instead of the full real marketplace. Bottom nav still
  // wraps this screen as normal (rendered by AppLayout, not by this component).
  const isAiTutorDemo = new URLSearchParams(location.search).get("demo") === "ai-tutor";
  if (isAiTutorDemo) {
    const demoCourses = [
      {
        sku: "ncert-10-maths",
        accent: "#597ef7",
        // Class, then subject, then NCERT — subject is what a student is
        // actually scanning for, so it comes right after the class number
        // instead of getting buried after "NCERT" (which, combined with
        // "Class 10," was eating most of the card's title line before the
        // subject even appeared). "X" (roman numeral 10, the real NCERT/
        // CBSE convention — "Class X") instead of "Class 10" — shorter, and
        // matches how these boards actually label the grade themselves.
        title: "X Maths NCERT",
        // Subtitle is a value-prop hook, not a syllabus descriptor — "Full
        // NCERT Syllabus" (the old copy) is what every course claims, so it
        // gives a scrolling student no actual reason to tap this one over
        // any other. Outcome-framed instead: names the moment the product
        // solves (stuck on a problem, no one around to ask), not a feature.
        subtitle: "Solved step by step — ask anytime",
        image: "/ncert-10-maths-listing.jpg",
        imageAlt: "Teacher presenting the Class 10 NCERT Maths textbook",
      },
      {
        sku: "ncert-10-science",
        // Same accent as Maths — both are the same AI Tutor product, just a
        // different subject, and having Science suddenly switch to purple
        // read as two different products rather than one course catalog.
        accent: "#597ef7",
        title: "X Science NCERT",
        subtitle: "Explained step by step — ask anytime",
        image: "/ncert-10-science-listing.jpg",
        imageAlt: "Teacher presenting the Class 10 NCERT Science textbook",
      },
      {
        sku: "ncert-10-english",
        accent: "#597ef7",
        title: "X English NCERT",
        subtitle: "Every question in both books, answered",
        imageAlt: "Open book — Class 10 NCERT English textbooks",
      },
      {
        sku: "ncert-10-hindi",
        accent: "#597ef7",
        title: "X Hindi NCERT",
        subtitle: "Every question in both books, answered",
        imageAlt: "Open book — Class 10 NCERT Hindi textbooks",
      },
      {
        // Not a real sku — same underlying course/content as "ncert-10-maths"
        // above (real sku passed through in the onClick below), just a
        // second Discover entry point that skips curriculum-preview's
        // free-Chapter-1-only gate entirely and drops straight into
        // chapter-home with every built topic explorable, no enroll banner.
        // For demoing/reviewing the full course structure without the
        // paywall getting in the way — Chapters 3–14 still show their real
        // "not yet built" placeholder rows (that's a content-completeness
        // state, not a paywall, so there's nothing to unlock there).
        sku: "ncert-10-maths-unlocked",
        accent: "#597ef7",
        title: "X Maths NCERT — All Unlocked",
        subtitle: "Every built chapter and topic, open — no enrollment, no paywall",
        image: "/ncert-10-maths-listing.jpg",
        imageAlt: "Teacher presenting the Class 10 NCERT Maths textbook",
      },
      {
        // Not a real sku itself — "Class X Social" groups the four real
        // Social Science books (History, Geography, Political Science,
        // Economics) behind one Discover card, since Social Science isn't
        // one course the way Maths/Science are. Tapping through always
        // opens the subject picker (ai-tutor-social-subjects.tsx), which
        // then routes into whichever real course/sku the student picks.
        sku: "social",
        accent: "#597ef7",
        title: "X Social NCERT",
        subtitle: "Every chapter — even the ones tuition skips",
        image: "/ncert-10-history-listing.jpg",
        imageAlt: "Teacher presenting the Class 10 NCERT Social Science textbook",
      },
    ];
    return (
      <div style={{ fontFamily: "var(--font-family-inter)", backgroundColor: "var(--background)", height: "100vh", overflowY: "auto" }}>
        <StatusBar />
        <div style={{ padding: "8px 20px 16px" }}>
          <span style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>Discover</span>
        </div>
        <div style={{ padding: "0 20px 32px" }}>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", marginBottom: 12 }}>{demoCourses.length} courses available</p>
          {/* Side by side, not stacked — two courses shouldn't need a full
              scroll each just to compare. Text is trimmed to title + one
              short line; the full pitch already lives on curriculum-preview,
              one tap away, so repeating it here was pure redundancy. */}
          <div className="grid grid-cols-2" style={{ gap: 12 }}>
            {demoCourses.map((course) => {
              // "Class X Social" isn't a real sku — "enrolled" means enrolled
              // in any one of the four real Social Science courses behind
              // it. Either way, tapping it always opens the subject picker
              // (there's more than one subject to choose between, so unlike
              // Maths/Science there's no single "continue" destination).
              const isSocial = course.sku === "social";
              const isEnglish = course.sku === "ncert-10-english";
              const isHindi = course.sku === "ncert-10-hindi";
              // Always-unlocked entry point — deliberately never reads/writes
              // cc_enrolled_ncert-10-maths, so it can't affect (or be
              // affected by) the real "X Maths NCERT" card's own enrolled
              // state just above it.
              const isMathsUnlocked = course.sku === "ncert-10-maths-unlocked";
              const isEnrolledInDemoCourse = isMathsUnlocked
                ? false
                : isSocial
                ? SOCIAL_SCIENCE_SKUS.some((sku) => localStorage.getItem(`cc_enrolled_${sku}`) === "1")
                : localStorage.getItem(`cc_enrolled_${course.sku}`) === "1";
              return (
                <button
                  key={course.sku}
                  onClick={() =>
                    navigate(
                      isMathsUnlocked
                        ? "/ai-tutor/chapter-home?sku=ncert-10-maths"
                        : isSocial
                        ? "/ai-tutor/social-subjects?demo=ai-tutor"
                        : isEnrolledInDemoCourse
                        // Already enrolled — tapping the listing again should
                        // continue straight into the course (same real
                        // destination as the Classrooms card on classes-v1),
                        // not bounce back out to the classes tab. That
                        // detour was also the one thing making the guided
                        // tour's entry point unreachable from here, since
                        // the tour only lives on Chapter Home.
                        ? `/ai-tutor/chapter-home?sku=${course.sku}`
                        : `/ai-tutor/curriculum-preview?demo=ai-tutor&sku=${course.sku}`
                    )
                  }
                  className="flex flex-col text-left min-w-0"
                  style={{ borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer" }}
                >
                  <div style={{ position: "relative" }}>
                    {/* Distinguishes these cards from an ordinary course listing at a
                        glance, before the subtitle hook even gets read — same job as
                        a "bestseller"/"new" ribbon on a marketplace listing. Warm gold
                        rather than the course's own blue accent so it doesn't blend
                        into the ENROLLED badge's color language. */}
                    <div
                      className="flex items-center"
                      style={{
                        position: "absolute", top: 6, left: 6, zIndex: 1, gap: 3,
                        paddingLeft: 5, paddingRight: 6, height: 18, borderRadius: 4,
                        backgroundColor: "rgba(250,173,20,0.9)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                      }}
                    >
                      <Sparkles style={{ width: 9, height: 9, color: "#1f0e02" }} />
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#1f0e02", letterSpacing: 0.3 }}>{isMathsUnlocked ? "ALL UNLOCKED" : "AI TUTOR"}</span>
                    </div>
                    {course.image ? (
                      <img
                        src={course.image}
                        alt={course.imageAlt}
                        style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center"
                        style={{ width: "100%", height: 110, background: `linear-gradient(135deg, color-mix(in srgb, ${course.accent} 22%, #0a0612) 0%, color-mix(in srgb, ${course.accent} 45%, #0a0612) 100%)` }}
                      >
                        {isSocial ? (
                          <Landmark style={{ width: 30, height: 30, color: "rgba(255,255,255,0.85)" }} />
                        ) : isEnglish ? (
                          <BookText style={{ width: 30, height: 30, color: "rgba(255,255,255,0.85)" }} />
                        ) : isHindi ? (
                          <Languages style={{ width: 30, height: 30, color: "rgba(255,255,255,0.85)" }} />
                        ) : (
                          <Microscope style={{ width: 30, height: 30, color: "rgba(255,255,255,0.85)" }} />
                        )}
                      </div>
                    )}
                    {isEnrolledInDemoCourse && (
                      <div
                        className="flex items-center"
                        style={{
                          position: "absolute", bottom: 6, left: 6, gap: 3,
                          paddingLeft: 5, paddingRight: 6, height: 18, borderRadius: 4,
                          backgroundColor: `${course.accent}26`,
                          border: `0.5px solid ${course.accent}66`,
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                        }}
                      >
                        <span aria-hidden style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: course.accent, boxShadow: `0 0 6px ${course.accent}`, flexShrink: 0 }} />
                        <span style={{ fontSize: 9, fontWeight: 800, color: course.accent, letterSpacing: 0.3 }}>ENROLLED</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", display: "block", marginBottom: 2 }}>
                      {course.title}
                    </span>
                    {/* 2-line clamp, not single-line truncate — the subtitle is now
                        an outcome-framed hook (e.g. "Stuck on a problem? Solved,
                        step by step — anytime"), not a short syllabus descriptor.
                        Single-line truncation was cutting these off right after
                        the hook and before the actual payoff — the exact part
                        doing the persuading. */}
                    <span
                      style={{
                        fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", marginBottom: 10,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35,
                      }}
                    >
                      {course.subtitle}
                    </span>
                    <div className="flex items-center justify-center gap-1.5" style={{ height: 34, borderRadius: "var(--radius-button)", background: course.accent, color: "var(--white)" }}>
                      <Sparkles style={{ width: 13, height: 13 }} />
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" }}>{isMathsUnlocked ? "Explore" : isEnrolledInDemoCourse ? "Continue" : "View"}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: "var(--font-family-inter)", backgroundColor: "var(--background)", height: "100vh" }}
    >
      {/* Single scroll container — header sticks to top so swipes anywhere scroll content */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ height: "100%" }}>
      {/* Sticky header — frosted glass so scrolled content is visually separated */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: "color-mix(in srgb, var(--background) 78%, transparent)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "0.5px solid color-mix(in srgb, var(--border) 70%, transparent)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.18)",
        }}
      >
        <StatusBar />
        <div className="flex items-center justify-between" style={{ padding: "16px 16px", height: 64 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)" }}>Discover</span>
          <div className="flex items-center" style={{ gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/marketplace/search")}
              aria-label="Search"
              style={{
                width: 32, height: 32, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "var(--border-secondary)",
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <Search size={16} style={{ color: "var(--foreground)" }} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/marketplace/orders")}
              aria-label="View my orders"
              style={{
                width: 32, height: 32, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "var(--border-secondary)",
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <Package size={16} style={{ color: "var(--foreground)" }} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/marketplace/cart")}
              aria-label="View cart"
              style={{
                width: 32, height: 32, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "var(--border-secondary)",
                border: "1px solid var(--border)",
                cursor: "pointer", position: "relative",
              }}
            >
              <ShoppingCart size={16} style={{ color: "var(--foreground)" }} />
              <span
                style={{
                  position: "absolute", top: 2, right: 2,
                  width: 16, height: 16, borderRadius: 9999,
                  backgroundColor: "var(--primary-600)",
                  color: "var(--white)",
                  fontSize: "var(--text-2xs)", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                3
              </span>
            </motion.button>
          </div>
        </div>

        <AgeFilterStrip value={ageFilter} onChange={setAgeFilter} />
      </div>

      {/* Content (parent handles scroll) */}
      <div style={{ paddingTop: 16, paddingBottom: 96 }}>

        <PremiumBanner />

        {/* ─── Category tiles — with subtle accent-bar header ─── */}
        <div style={{ marginTop: 20, marginBottom: 8 }}>
          <div
            style={{
              paddingLeft: 16, paddingRight: 16, marginBottom: 12,
            }}
            className="flex items-center"
          >
            <div
              aria-hidden
              style={{
                width: 3, height: 16, borderRadius: 3,
                background: `linear-gradient(180deg, ${PICKS_ACCENT} 0%, color-mix(in srgb, ${PICKS_ACCENT} 50%, transparent) 100%)`,
                boxShadow: `0 0 8px ${PICKS_ACCENT}55`,
                marginRight: 10,
              }}
            />
            <span style={{
              fontSize: "var(--text-2xs)",
              fontWeight: 700,
              color: "var(--muted-foreground)",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}>
              Browse
            </span>
          </div>
          <div
            className="flex items-start"
            style={{
              gap: 16,
              paddingLeft: 16, paddingRight: 16, paddingBottom: 4,
            }}
          >
            {CATEGORY_TILES.map((tile) => (
              <CategoryTile
                key={tile.id}
                tile={tile}
                onPress={() => scrollToSection(tile.anchorId)}
              />
            ))}
          </div>
        </div>

        {/* ─── Olympiads entry — discovery surface for the live-event feature ─── */}
        <div style={{ paddingBottom: 4 }}>
          <OlympiadEntryBanner onClick={() => navigate("/olympiad")} />
        </div>

        {/* ─── Picks for you — curated featured mix ─── */}
        {featuredPicks.length > 0 && (
          <section>
            <PicksHeader accent={PICKS_ACCENT} />
            <div
              className="flex"
              style={{
                gap: 12, paddingLeft: 16, paddingRight: 16, paddingBottom: 4,
                overflowX: "auto", scrollbarWidth: "none",
                scrollPaddingLeft: 16, scrollPaddingRight: 16,
                maskImage: "linear-gradient(to right, black 0%, black 94%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to right, black 0%, black 94%, transparent 100%)",
              }}
            >
              {featuredPicks.map(({ ref, node }) => (
                <Fragment key={ref}>{node}</Fragment>
              ))}
            </div>
          </section>
        )}

        {/* ─── MAIN: COURSES ─── */}
        {(visibility.testPrep || visibility.music || visibility.summerCamp || visibility.crash || visibility.crash1112) && (
          <section id="section-courses">
            <MainCategoryHeader category={MAIN_COURSES} />

            {/* Sub — Test Prep (CAT) */}
            {visibility.testPrep && (
              <section id="section-test-prep" style={{ marginBottom: 24 }}>
                <SectionHeader title="Test Prep" count={testPrepCards.length} />
                <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
                  {testPrepCards.map((course) => (
                    <MorphableCard
                      key={course.id}
                      data={{ type: "thumb", data: course, onView: () => navigate(`/course-detail?exam=cat&plan=${course.id}`) }}
                    >
                      <PremiumThumbCard course={course} />
                    </MorphableCard>
                  ))}
                </div>
                {testPrepCards.length === 0 && <SkeletonRail />}
              </section>
            )}

            {/* Sub — Music */}
            {visibility.music && (
              <section id="section-music" style={{ marginBottom: 24 }}>
                <SectionHeader title="Music" count={MUSIC_AS_PRODUCTS.length} />
                <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
                  {MUSIC_AS_PRODUCTS.map((product) => (
                    <MorphableCard
                      key={product.id}
                      data={{ type: "photo", data: product, onView: () => navigate(`/marketplace/music/${product.id}`) }}
                    >
                      <PremiumPhotoCard
                        product={product}
                        enrolled={DUMMY_ENROLLED_IDS.has(product.id)}
                        onPress={() => { /* handled by MorphableCard */ }}
                      />
                    </MorphableCard>
                  ))}
                </div>
              </section>
            )}

            {/* Sub — AI Summer Camp (Explorer + Creator batches) */}
            {visibility.summerCamp && (
              <section id="section-ai-summer-camp" style={{ marginBottom: 24 }}>
                <SectionHeader title="AI Summer Camp" count={DUMMY_SUMMER_CAMP_BATCHES.length} />
                <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
                  {DUMMY_SUMMER_CAMP_BATCHES.map((batch) => {
                    const thumbImage = `/summer-camp-${batch.track}-${theme === "light" ? "light" : "dark"}.png`;
                    const morphProduct: Product = {
                      id: batch.track,
                      title: batch.title,
                      subtitle: `${batch.grade} · ${DUMMY_SUMMER_CAMP_SHARED.daysLabel.split(" · ")[0]}`,
                      categoryId: "summer-camp",
                      price: DUMMY_SUMMER_CAMP_SHARED.price,
                      originalPrice: DUMMY_SUMMER_CAMP_SHARED.originalPrice,
                      rating: 4.9,
                      reviewCount: 500,
                      isDigital: true,
                      thumbImage,
                    };
                    return (
                      <MorphableCard
                        key={batch.track}
                        data={{ type: "photo", data: morphProduct, onView: () => navigate(`/ai-summer-camp?track=${batch.track}`) }}
                      >
                        <SummerCampPhotoCard batch={batch} />
                      </MorphableCard>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Sub — Summer Crash · single unified rail (Class 6-10 + 11-12 PCM/PCB) */}
            {(visibility.crash || visibility.crash1112) && (
              <section id="section-crash-courses" style={{ marginBottom: 24 }}>
                <SectionHeader
                  title="Summer Crash"
                  count={(visibility.crash ? CRASH_COURSE_CLASSES.length : 0) + (visibility.crash1112 ? CRASH_1112_SKUS.length : 0)}
                />
                <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
                  {visibility.crash && CRASH_COURSE_CLASSES.map((cls) => {
                    const product: Product = {
                      id: `crash-course-class-${cls}`,
                      title: `Class ${cls} Summer Crash Course`,
                      subtitle: "Maths & Science · 15 Days",
                      categoryId: "crash-course",
                      price: 999,
                      originalPrice: 1999,
                      rating: 0,
                      reviewCount: 0,
                      isDigital: true,
                      thumbImage: "",
                    };
                    return (
                      <MorphableCard
                        key={product.id}
                        data={{ type: "photo", data: product, onView: () => navigate(`/crash-course-detail?class=${cls}`) }}
                      >
                        <PremiumPhotoCard
                          product={product}
                          onPress={() => { /* handled by MorphableCard */ }}
                          thumbOverride={<CrashCourseThumb classNumber={cls} />}
                        />
                      </MorphableCard>
                    );
                  })}

                  {visibility.crash1112 && CRASH_1112_SKUS.map((sku) => {
                    const info = DUMMY_CRASH_COURSES_1112[sku];
                    const product: Product = {
                      id: sku,
                      title: info.title,
                      subtitle: info.subtitleShort,
                      categoryId: "crash-course",
                      price: 999,
                      originalPrice: 1999,
                      rating: 0,
                      reviewCount: 0,
                      isDigital: true,
                      thumbImage: "",
                    };
                    return (
                      <MorphableCard
                        key={sku}
                        data={{ type: "photo", data: product, onView: () => navigate(`/crash-course-detail?sku=${sku}`) }}
                      >
                        <PremiumPhotoCard
                          product={product}
                          onPress={() => { /* handled by MorphableCard */ }}
                          thumbOverride={<Crash1112Thumb info={info} />}
                        />
                      </MorphableCard>
                    );
                  })}
                </div>
              </section>
            )}
          </section>
        )}

        {/* ─── MAIN: LEARNING APPS (includes Test Series rails) ─── */}
        {visibility.apps && (
          <section id="section-learning-apps">
            <MainCategoryHeader category={MAIN_APPS} />

            {/* Sub — Vocabulary · VocabularyFast partner integration.
                Pack visibility per age filter handled by getVocabFastPacksForFilter.
                Coming-soon packs are filtered out of the rail (hidden until live);
                they remain reachable via direct URL/toolbar for QA.
                Lives FIRST in Learning Apps because vocab pairs naturally with
                any test prep journey (boards, JEE/NEET, CAT, GRE/SAT). */}
            {visibility.vocab && (() => {
              const packs = getVocabFastPacksForFilter(ageFilter)
                .filter((p) => p.availability !== "coming-soon");
              if (packs.length === 0) return null;
              return (
                <section id="section-vocab" style={{ marginBottom: 24 }}>
                  <SectionHeader title="Vocabulary" count={packs.length} />
                  <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
                    {packs.map((pack) => {
                      const isComingSoon = pack.availability === "coming-soon";
                      const product: Product = {
                        id: pack.id,
                        title: pack.title,
                        subtitle: isComingSoon
                          ? `${pack.audience} · Coming Soon`
                          : `${pack.audience} · ${pack.wordsCount.toLocaleString("en-IN")} words`,
                        categoryId: "vocab",
                        price: VOCABFAST_PRICING.packPrice,
                        originalPrice: VOCABFAST_PRICING.packOriginalPrice,
                        rating: 0,
                        reviewCount: 0,
                        isDigital: true,
                        thumbImage: "",
                      };
                      return (
                        <MorphableCard
                          key={pack.id}
                          data={{ type: "photo", data: product, onView: () => navigate(`/marketplace/vocab/${pack.id}`) }}
                        >
                          <PremiumPhotoCard
                            product={product}
                            onPress={() => { /* handled by MorphableCard */ }}
                            thumbOverride={<VocabFastThumb pack={pack} />}
                          />
                        </MorphableCard>
                      );
                    })}
                  </div>
                </section>
              );
            })()}

            {/* Games rail — FIRST sub-rail inside Learning Apps. Placement is
                age-agnostic on purpose: when we don't know the student's grade,
                Games is the universally relevant entry point — free, 60s,
                drop-in, applies to every audience (Class 1–5 / 6–10 / college /
                competitive). Below, English Coach + Test Series rails serve
                older / exam-prep audiences. */}
            {visibility.games && (
              <section id="section-games" style={{ marginBottom: 24 }}>
                {/* Pass-aware header: shows "PASS ACTIVE · 89d left" chip when
                    user owns the Games Pass, else just title + count. */}
                <div className="flex items-center justify-between" style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 12 }}>
                  <div className="flex items-baseline" style={{ gap: 8 }}>
                    <h2 style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.01em" }}>
                      Games
                    </h2>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>
                      ({DUMMY_GAMES.length})
                    </span>
                    {pass.active && (
                      <span style={{
                        fontSize: "var(--text-2xs)", fontWeight: 700,
                        color: "var(--success-500)", letterSpacing: 0.3,
                        paddingLeft: 6, paddingRight: 6, height: 18,
                        display: "inline-flex", alignItems: "center",
                        borderRadius: 4, marginLeft: 4,
                        backgroundColor: "color-mix(in srgb, var(--success-500) 14%, transparent)",
                      }}>
                        PASS ACTIVE · {pass.daysLeft}d
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
                  {DUMMY_GAMES.map((game) => (
                    <MorphableCard
                      key={game.id}
                      data={{ type: "game", data: game, onView: () => navigate(`/marketplace/game/${game.id}`) }}
                    >
                      <GameCard game={game} onClick={() => { /* handled by MorphableCard */ }} />
                    </MorphableCard>
                  ))}
                </div>
              </section>
            )}

            {/* Sub — Express AI English Coach */}
            <section id="section-english-coach" style={{ marginBottom: 24 }}>
              <SectionHeader title="English Coach" count={1} />
              <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
                <MorphableCard data={{ type: "thumb", data: EXPRESS_APP_CARD, onView: () => navigate("/marketplace/apps") }}>
                  <PremiumThumbCard course={EXPRESS_APP_CARD} />
                </MorphableCard>
              </div>
            </section>

            {/* Test Series rails — nested under Learning Apps, gated by age */}
            {TEST_SERIES_VISIBLE_FOR[ageFilter] && TEST_SERIES_STREAMS.map((stream) => (
              <section
                key={stream.id}
                id={`section-test-series-${stream.id}`}
                style={{ marginBottom: 24 }}
              >
                <SectionHeader title={`Test Series · ${stream.label}`} count={stream.exams.length} />
                <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
                  {stream.exams.map((exam) => (
                    <MorphableCard
                      key={exam.id}
                      data={{ type: "mock", data: exam, onView: () => navigate(`/marketplace/product/${exam.id}`) }}
                    >
                      <PremiumTestSeriesCard
                        test={exam}
                        onClick={() => { /* handled by MorphableCard */ }}
                      />
                    </MorphableCard>
                  ))}
                </div>
              </section>
            ))}
          </section>
        )}

        {/* ─── MAIN: DEVICES ─── */}
        {visibility.devices && (
          <section id="section-devices">
            <MainCategoryHeader category={MAIN_DEVICES} />

            {/* Sub — Primebook laptops */}
            <section id="section-primebook" style={{ marginBottom: 24 }}>
              <SectionHeader title="Learning Devices" count={PRIMEBOOK_LAPTOPS.length} />
              <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, overflowX: "auto", scrollbarWidth: "none" }}>
                {PRIMEBOOK_LAPTOPS.map((laptop) => {
                  const product: Product = {
                    id: laptop.id,
                    title: laptop.title,
                    subtitle: laptop.subtitle,
                    categoryId: "devices",
                    price: laptop.price,
                    originalPrice: laptop.originalPrice,
                    rating: laptop.rating,
                    reviewCount: laptop.reviewCount,
                    isDigital: false,
                    thumbImage: laptop.thumbImage,
                  };
                  return (
                    <MorphableCard
                      key={laptop.id}
                      data={{ type: "photo", data: product, onView: () => navigate(`/marketplace/product/${laptop.id}`) }}
                    >
                      <PremiumPhotoCard
                        product={product}
                        onPress={() => { /* handled by MorphableCard */ }}
                      />
                    </MorphableCard>
                  );
                })}
              </div>
            </section>
          </section>
        )}

        {/* ─── Wishlist CTA — "not finding what you want?" — passive intent
            capture (Duolingo failed-search pattern). Always visible; users
            can submit multiple requests over time. */}
        <div style={{ padding: "0 16px 16px" }}>
          <WishlistCard onTap={() => setWishlistOpen(true)} />
        </div>

      </div>
      </div>

      <WishlistSheet
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        source="discover"
      />
    </div>
  );
}
