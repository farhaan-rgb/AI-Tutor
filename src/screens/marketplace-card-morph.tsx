/**
 * Card Morph — iOS App Store-style route-bridging hero transition.
 *
 * Flow on tap:
 *   1. Capture the card's bounding rect.
 *   2. Trigger navigation to the real detail route immediately.
 *   3. Render a fullscreen overlay positioned at the card's rect; spring it
 *      to a hero strip at the top of the viewport (full width).
 *   4. Once the morph settles, fade the overlay out — the detail page
 *      mounted underneath is now visible. No intermediate preview screen.
 *
 * Public API:
 *   <CardMorphProvider> — wraps the app root so the overlay survives navigation
 *   <MorphableCard data={...}>{cardJSX}</MorphableCard> — interceptor wrapper
 *
 * The provider is mounted in RootLayout, so any screen can opt into morphs
 * just by wrapping its cards in <MorphableCard>.
 */

import { createContext, useContext, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { OtherCourse } from "../shared/classroom-catalog";
import type { Product, MockTest } from "./marketplace-premium-cards";
import { TestSeriesHeroInner } from "./marketplace-premium-cards";
import type { Game } from "./marketplace-v1";
import { GameArt } from "./game-art";

// ─── Types ────────────────────────────────────────────────────────────────────

type MorphData =
  | { type: "thumb"; data: OtherCourse; onView: () => void }
  | { type: "photo"; data: Product; onView: () => void }
  | { type: "mock";  data: MockTest;   onView: () => void }
  | { type: "game";  data: Game;       onView: () => void };

interface ActiveMorph {
  id: number;
  rect: DOMRect;
  morph: MorphData;
}

interface MorphContextValue {
  open: (rect: DOMRect, morph: MorphData) => void;
}

const MorphContext = createContext<MorphContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CardMorphProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveMorph | null>(null);

  const open = (rect: DOMRect, morph: MorphData) => {
    setActive({ id: Date.now(), rect, morph });
  };

  return (
    <MorphContext.Provider value={{ open }}>
      {children}
      <AnimatePresence>
        {active && (
          <CardMorphOverlay
            key={active.id}
            active={active}
            onDone={() => setActive(null)}
          />
        )}
      </AnimatePresence>
    </MorphContext.Provider>
  );
}

// ─── MorphableCard wrapper ────────────────────────────────────────────────────

export function MorphableCard({
  data,
  children,
}: {
  data: MorphData;
  children: React.ReactNode;
}) {
  const ctx = useContext(MorphContext);
  const ref = useRef<HTMLDivElement>(null);

  // Graceful fallback: if no provider, fire onView directly with no morph.
  if (!ctx) {
    return (
      <div
        ref={ref}
        style={{ flexShrink: 0, cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          data.onView();
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{ flexShrink: 0, cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) {
          data.onView();
          return;
        }
        // Start the morph and navigate in parallel — the detail page mounts
        // behind the overlay while the hero springs into place.
        ctx.open(rect, data);
        data.onView();
      }}
    >
      {children}
    </div>
  );
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

// Visual target — height of the morphed hero strip at the top of the viewport.
// Tuned to match each destination route's hero so the morph fades into the
// destination in-place with no resize jump.
//   - thumb/mock → 260px (marketplace-product, course-detail)
//   - photo      → viewport width × 2/3 (3:2 aspect, matches card aspect ratio
//                   so the image grows uniformly with no re-crop)
const HERO_HEIGHT_DEFAULT = 260;
function heroTargetHeight(type: MorphData["type"]) {
  if (type === "photo") {
    const vw = typeof window !== "undefined" ? window.innerWidth : 375;
    return vw * (2 / 3);
  }
  // game → 240px (matches the GameArt canvas inside game-detail's cinematic hero)
  if (type === "game") return 240;
  return HERO_HEIGHT_DEFAULT;
}

function CardMorphOverlay({
  active,
  onDone,
}: {
  active: ActiveMorph;
  onDone: () => void;
}) {
  const { rect, morph } = active;
  const [phase, setPhase] = useState<"morph" | "fade">("morph");

  // Switch to fade phase shortly after the spring settles.
  useEffect(() => {
    const t = setTimeout(() => setPhase("fade"), 360);
    return () => clearTimeout(t);
  }, []);

  // Lock body scroll while the morph is playing, restore after.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Card visual portion — thumb/mock cards have a 3:2 colored region on top
  // with a title/subtitle below; photo cards are full-bleed (no text below).
  const hasTextBelow = morph.type !== "photo";
  const cardVisualHeight = hasTextBelow ? rect.width * (2 / 3) : rect.height;

  // Target hero height depends on the destination route.
  const heroTarget = heroTargetHeight(morph.type);

  // Hero morph uses CSS transform: scale instead of animating width/height.
  // The hero is *rendered* at full destination size (100vw × heroTarget) with
  // a single fixed look — only transform changes during the morph. That means
  // every pixel inside (glow, brand letter, badges) scales uniformly with the
  // container, eliminating per-frame visual jumps that show up as flicker
  // when the layout box itself resizes.
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 375;
  const heroScaleX = rect.width / viewportWidth;
  const heroScaleY = cardVisualHeight / heroTarget;
  // Element border-radius pre-scale so the *visual* radius is 14 at start.
  // Scale uniformly using min so the radius stays roughly circular.
  const minScale = Math.min(heroScaleX, heroScaleY);
  const initialBR = minScale > 0 ? 14 / minScale : 14;

  // Title text — animates from card-text-below region to the title block on
  // the destination page. Uses transform scale so the text grows continuously
  // (rather than re-flowing on width change).
  const TEXT_PADDING_X = 16;
  const TEXT_TARGET_WIDTH = viewportWidth - 2 * TEXT_PADDING_X;
  const TEXT_TARGET_TOP = heroTarget + 16;
  const textInitialScale = rect.width / TEXT_TARGET_WIDTH;

  const title = getMorphTitle(morph);
  const subtitle = getMorphSubtitle(morph);

  return (
    <>
      {/* Backdrop dim — the rest of the screen darkens while the card lifts */}
      <motion.div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          backgroundColor: "#000",
          pointerEvents: "none",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "morph" ? 0.55 : 0 }}
        transition={
          phase === "morph"
            ? { duration: 0.32, ease: [0.32, 0.72, 0, 1] }
            : { duration: 0.22, ease: "easeOut" }
        }
      />
      {/* Card-to-hero morph — transform-scaled from card rect to fullscreen hero */}
      <motion.div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: viewportWidth,
          height: heroTarget,
          zIndex: 1000,
          overflow: "hidden",
          pointerEvents: "none",
          boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
          transformOrigin: "top left",
          willChange: "transform, opacity, border-radius",
        }}
        initial={{
          x: rect.left,
          y: rect.top,
          scaleX: heroScaleX,
          scaleY: heroScaleY,
          borderRadius: initialBR,
          opacity: 1,
        }}
        animate={
          phase === "morph"
            ? { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 0, opacity: 1 }
            : { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 0, opacity: 0 }
        }
        transition={
          phase === "morph"
            ? { type: "spring", damping: 32, stiffness: 280, mass: 0.85 }
            : { duration: 0.24, ease: [0.32, 0.72, 0, 1] }
        }
        onAnimationComplete={() => {
          if (phase === "fade") onDone();
        }}
      >
        {morph.type === "thumb" && <ThumbHero course={morph.data} />}
        {morph.type === "photo" && <PhotoHero product={morph.data} />}
        {morph.type === "mock"  && <MockHero test={morph.data} />}
        {morph.type === "game"  && <GameHero game={morph.data} />}
      </motion.div>
      {/* Title text — slides + scales into the destination title position */}
      {hasTextBelow && title && (
        <motion.div
          aria-hidden
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: TEXT_TARGET_WIDTH,
            transformOrigin: "top left",
            pointerEvents: "none",
            zIndex: 1001,
            willChange: "transform, opacity",
          }}
          initial={{
            x: rect.left,
            y: rect.top + cardVisualHeight + 10,
            scale: textInitialScale,
            opacity: 1,
          }}
          animate={
            phase === "morph"
              ? { x: TEXT_PADDING_X, y: TEXT_TARGET_TOP, scale: 1, opacity: 1 }
              : { x: TEXT_PADDING_X, y: TEXT_TARGET_TOP, scale: 1, opacity: 0 }
          }
          transition={
            phase === "morph"
              ? { type: "spring", damping: 32, stiffness: 280, mass: 0.85 }
              : { duration: 0.18, ease: [0.32, 0.72, 0, 1] }
          }
        >
          <p
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 700,
              color: "var(--foreground)",
              lineHeight: 1.3,
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </p>
          {subtitle && (
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--muted-foreground)",
                lineHeight: 1.4,
                margin: "4px 0 0 0",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {subtitle}
            </p>
          )}
        </motion.div>
      )}
    </>
  );
}

// ─── Hero visuals (fill the overlay) ──────────────────────────────────────────

function ThumbHero({ course }: { course: OtherCourse }) {
  const accent = course.thumbAccent ?? "#888";
  const isAppMode = !!course.thumbLogo;
  // Identical recipe to the marketplace-product detail hero so the morph fades
  // out into a pixel-identical destination — no swap.
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: `color-mix(in srgb, ${accent} 10%, #0a0408)` }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${accent}40 0%, ${accent}18 45%, transparent 100%)` }} />
      <div aria-hidden style={{ position: "absolute", top: -100, right: -80, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${accent} 0%, ${accent}55 35%, transparent 70%)`, filter: "blur(36px)", opacity: 0.7 }} />
      <div aria-hidden style={{ position: "absolute", bottom: -80, left: -60, width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`, filter: "blur(44px)", opacity: 0.35 }} />

      <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0 }}>
        {isAppMode ? (
          <div
            className="flex items-center justify-center"
            style={{
              width: 110, height: 110, borderRadius: 24,
              background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 88%, #fff) 0%, ${accent} 50%, color-mix(in srgb, ${accent} 70%, #000) 100%)`,
              boxShadow: [`0 4px 14px ${accent}66`, `0 18px 40px ${accent}44`, "inset 0 1.5px 0 rgba(255,255,255,0.5)"].join(", "),
            }}
          >
            <span style={{ fontSize: 58, fontWeight: 900, color: "#fff", letterSpacing: -1.5, lineHeight: 1, textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
              {(course.thumbBrand ?? course.title)[0]}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 124, fontWeight: 900, color: accent, opacity: 0.88, letterSpacing: -4, lineHeight: 1, textShadow: [`0 0 56px ${accent}99`, `0 4px 18px ${accent}55`].join(", ") }}>
            {course.thumbLabel ?? course.title.slice(0, 3).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

function PhotoHero({ product }: { product: Product }) {
  // Scrims matched pixel-for-pixel to marketplace-product.tsx ImageGallery so
  // the overlay fade-out lands on a visually identical destination — no scrim
  // height or opacity shift during handoff.
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "var(--card)" }}>
      <img
        src={product.thumbImage}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {/* Top scrim — matches ImageGallery */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 112, background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 50%, transparent 100%)", pointerEvents: "none" }} />
      {/* Bottom scrim — matches ImageGallery */}
      <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 100%)", pointerEvents: "none" }} />
    </div>
  );
}

function MockHero({ test }: { test: MockTest }) {
  // Morph hero matches the detail-page hero pixel-for-pixel so the overlay
  // fade-out lands on a visually identical destination — no OFF pill, no exam
  // chip, no "N plans" meta (those live in the title block on the detail page,
  // not over the thumbnail).
  const rangeLabel = test.minCount && test.maxCount && test.minCount !== test.maxCount
    ? `${test.minCount} - ${test.maxCount}`
    : undefined;

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "var(--card)", overflow: "hidden" }}>
      <TestSeriesHeroInner test={test} scale={2.4} heroLabel={rangeLabel} />
      {/* Top scrim — pixel-matched to MockTestHero in marketplace-product.tsx so
          the overlay fade-out lands on the same gradient the detail page paints. */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 88, background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)", pointerEvents: "none" }} />
    </div>
  );
}

function GameHero({ game }: { game: Game }) {
  // Pixel-matched to game-detail.tsx's cinematic hero: same accent gradient
  // (28% → 14% → background), same GameArt at 0.85 opacity, same bottom scrim.
  // Morph fades out into a visually identical destination.
  const accent = game.accent;
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 28%, var(--background)) 0%, color-mix(in srgb, ${accent} 14%, var(--background)) 60%, var(--background) 100%)`,
    }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.85 }}>
        <GameArt archetype={game.archetype} accent={accent} />
      </div>
      <div aria-hidden style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
        background: "linear-gradient(180deg, transparent 0%, var(--background) 100%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

// ─── Title/subtitle extraction ────────────────────────────────────────────────

function getMorphTitle(morph: MorphData): string | undefined {
  if (morph.type === "thumb") return morph.data.title;
  if (morph.type === "mock")  return morph.data.title;
  if (morph.type === "photo") return morph.data.title;
  if (morph.type === "game")  return morph.data.title;
  return undefined;
}

function getMorphSubtitle(morph: MorphData): string | undefined {
  if (morph.type === "thumb") return morph.data.subtitle;
  if (morph.type === "mock")  return `${morph.data.questionCount.toLocaleString("en-IN")} questions`;
  if (morph.type === "photo") return morph.data.subtitle;
  if (morph.type === "game")  return morph.data.subtitle;
  return undefined;
}
