/**
 * Game Detail — landing page when a student taps a game card.
 * Route: /marketplace/game/:id
 *
 * Audience: Class 1–8 (kids). Voice / inspiration: kid-friendly mobile game
 * intros (Khan Academy Kids, Toca Boca, Math Kingdom) + App Store layout
 * conventions for the page bones.
 *
 * What's NOT here on purpose:
 *   - Ratings + review counts → real numbers are too small at launch and a
 *     "★ 4.7 / 18,240 ratings" line would look fake.
 *   - "Players installed" → same reason.
 *   - JEE / NEET exam tags → wrong audience.
 *
 * What IS here (game-intro feel):
 *   - Cinematic hero + GameArt
 *   - Chip strip: Grade · Levels · Topic · Price (no ratings, no players)
 *   - About this game
 *   - What you'll learn — 4 small skill chips
 *   - Pricing card — visible, explains the free-trial + unlock model
 *   - Sticky Play CTA with pricing line
 */

import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { X, Play, Layers, Sparkles, Lock } from "lucide-react";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { StatusBar } from "../shared/premium-ui";
import { getGameById, GAMES_PASS, type Game } from "./marketplace-v1";
import { GameArt } from "./game-art";
import { useGamesPass } from "../shared/games-pass-state";

// One-paragraph "About this game" body — written for the kid + parent reading
// together. Short sentences, concrete actions, no marketing flourish.
function aboutBody(g: Game): string {
  switch (g.id) {
    case "brain-sprint":
      return "Climb 60 math peaks one level at a time. Solve quick arithmetic to power your climber up the mountain — the faster you answer, the higher you go.";
    case "word-wars":
      return "Cast spelling spells across 50 magical adventures. Build words, learn new ones, and unlock new wizard hats as you level up.";
    case "concept-labs":
      return "Drag ingredients, mix chemicals, and run experiments in 40 mini-labs. Each correct setup unlocks the next science world.";
    case "quiz-duel":
      return "Challenge a classmate to a 1v1 quiz duel. 10 questions, 6 seconds each — fastest right answer wins the round.";
    case "daily-sprint":
      return "10 fun questions every day across subjects. Don't break your streak — 7 days in a row unlocks bonus rewards.";
    case "live-quiz-arena":
      return "Join thousands of kids for a live quiz event every Sunday 7 PM. Real-time rankings, weekly prizes for the top 100.";
    default:
      return g.subtitle;
  }
}

export function Component() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const pass = useGamesPass();
  const game = params.id ? getGameById(params.id) : undefined;

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", backgroundColor: "var(--background)", gap: 12, padding: 24 }}>
        <span style={{ fontSize: "var(--text-base)", color: "var(--foreground)", fontWeight: 600 }}>Game not found</span>
        <button onClick={() => navigate("/marketplace-v1")} style={{ background: "none", border: "none", color: "var(--primary-500)", cursor: "pointer" }}>Back to marketplace</button>
      </div>
    );
  }

  const accent = game.accent;
  const isComingSoon = game.status?.kind === "soon";
  const isLiveEvent = game.archetype === "live";
  const isFree = game.pricing.isFree;
  // Two games have dedicated /play screens; the other four route to Brain
  // Battle (quiz-duel) as a labelled demo stand-in so stakeholders see what's
  // shipped vs in-pipeline. CTA copy makes the stand-in explicit (not a
  // silent bait-and-switch).
  const PLAY_ROUTES: Record<string, string> = {
    "quiz-duel":    "/marketplace/game/quiz-duel/play",
    "daily-sprint": "/marketplace/game/daily-sprint/play",
    "word-wars":    "/marketplace/game/word-wars/play",
    "brain-sprint": "/marketplace/game/brain-sprint/play",
    "concept-labs": "/marketplace/game/concept-labs/play",
    "live-quiz-arena": "/marketplace/game/live-quiz-arena/play",
    "memory-match":    "/marketplace/game/memory-match/play",
    "pattern-puzzles": "/marketplace/game/pattern-puzzles/play",
    "reading-race":    "/marketplace/game/reading-race/play",
  };
  const hasOwnPlay = game.id in PLAY_ROUTES;
  const playRoute = PLAY_ROUTES[game.id] ?? "/marketplace/game/quiz-duel/play";

  // CTA copy — pass + playable + free aware. Free games never reference the
  // Pass in their CTA; paid games show trial framing when no pass.
  const ctaLabel = isComingSoon ? "Coming soon"
    : isLiveEvent && !pass.active ? "Get Games Pass to join"
    : isLiveEvent ? "Open live arena"
    : hasOwnPlay ? "Play now"
    : "Try demo gameplay";
  const trialCopy = game.pricing.trialLevels === 1
    ? "One round free"
    : `First ${game.pricing.trialLevels} rounds free`;
  const ctaSublabel = isComingSoon ? null
    : isFree && !hasOwnPlay ? "Free · full game launching soon"
    : isFree && pass.active ? `Pass active · ${pass.daysLeft} days left`
    : isFree ? "Free · play as much as you want"
    : pass.active ? `Pass active · ${pass.daysLeft} days left`
    : isLiveEvent ? `Live events included with ${GAMES_PASS.label} · ₹${GAMES_PASS.price} / ${GAMES_PASS.durationLabel}`
    : !hasOwnPlay ? `Full game launching soon · sample available now`
    : `${trialCopy} · ${GAMES_PASS.label} ₹${GAMES_PASS.price} / ${GAMES_PASS.durationLabel} unlocks all`;
  // CTA tap: live event without pass → checkout; everything else → play route.
  const handlePlay = () => {
    if (isComingSoon) return;
    if (isLiveEvent && !pass.active) navigate("/marketplace/games-pass");
    else navigate(playRoute);
  };

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
      {/* Floating Close (X) — position:fixed so it pins to the viewport on
          scroll. Wrapped in a fixed container with the same max-width as the
          page so on desktop the X lands at the right edge of the centered
          container, not the viewport edge. */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        pointerEvents: "none",
        maxWidth: isDesktop ? 720 : undefined,
        marginLeft: isDesktop ? "auto" : undefined,
        marginRight: isDesktop ? "auto" : undefined,
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          aria-label="Close"
          style={{
            position: "absolute", top: 52, right: 12,
            pointerEvents: "auto",
            width: 32, height: 32, borderRadius: 9999,
            backgroundColor: "color-mix(in srgb, var(--black) 55%, transparent)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", border: "none",
          }}
        >
          <X size={16} style={{ color: "var(--foreground)" }} />
        </motion.button>
      </div>

      <div className="flex-1 min-h-0" style={{ overflowY: "auto", paddingBottom: 120 }}>
        {/* ─── Cinematic Hero — accent gradient + game art + scrim */}
        <div style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 30%, var(--background)) 0%, color-mix(in srgb, ${accent} 14%, var(--background)) 60%, var(--background) 100%)`,
        }}>
          <StatusBar />
          <div style={{ position: "relative", height: 240, overflow: "hidden" }}>
            <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.92 }}>
              <GameArt archetype={game.archetype} accent={accent} />
            </div>
            <div aria-hidden style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
              background: "linear-gradient(180deg, transparent 0%, var(--background) 100%)",
              pointerEvents: "none",
            }} />
          </div>
        </div>

        {/* ─── Title block — compact */}
        <div className="flex flex-col" style={{ padding: "0 16px", marginTop: -16, gap: 8, position: "relative" }}>
          <h1 style={{
            fontSize: "var(--text-2xl)", fontWeight: 800, letterSpacing: -0.4,
            color: "var(--foreground)", margin: 0, lineHeight: 1.15,
          }}>
            {game.title}
          </h1>
          <p style={{
            fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
            margin: 0, lineHeight: 1.45,
          }}>
            {game.subtitle}
          </p>
        </div>

        {/* ─── Chip strip — Grade · Levels (or "Weekly") · Topic · Trial.
            NO ratings, NO player counts, NO per-game prices (single SKU is
            the Games Pass, surfaced in the pricing card below). Borderless,
            hairline dividers. */}
        <div className="flex items-stretch" style={{ marginTop: 16, padding: "8px 16px", gap: 0 }}>
          <ChipCol top={game.gradeRange} bottom="grade" />
          <ChipDivider />
          <ChipCol
            top={isLiveEvent ? "Weekly" : `${game.levels}`}
            bottom={isLiveEvent ? "live event" : "levels"}
          />
          <ChipDivider />
          <ChipCol top={game.topic} bottom="topic" />
          <ChipDivider />
          <ChipCol
            top={
              isFree
                ? <span style={{ color: "var(--success-500)" }}>Free</span>
                : pass.active
                  ? <span style={{ color: "var(--success-500)" }}>Active</span>
                  : isLiveEvent
                    ? <span style={{ color: accent }}>Pass</span>
                    : <span style={{ color: "var(--success-500)" }}>{game.pricing.trialLevels} free</span>
            }
            bottom={
              isFree ? "always"
              : pass.active ? `${pass.daysLeft}d left`
              : isLiveEvent ? "to join"
              : game.pricing.trialLevels === 1 ? "free round" : "free rounds"
            }
          />
        </div>

        {/* ─── About this game — single paragraph, kid-friendly copy */}
        <div style={{ padding: "20px 16px 0" }}>
          <SectionTitle>About this game</SectionTitle>
          <p style={{
            fontSize: "var(--text-sm)", color: "var(--foreground)",
            lineHeight: 1.55, margin: 0,
          }}>
            {aboutBody(game)}
          </p>
        </div>

        {/* ─── What you'll learn — accent-tinted skill chips, no outlines.
            Replaces the old JEE/NEET exam tags band. */}
        {game.whatYouLearn.length > 0 && (
          <div style={{ padding: "20px 16px 0" }}>
            <SectionTitle>What you'll learn</SectionTitle>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {game.whatYouLearn.map((skill) => (
                <span key={skill} className="flex items-center" style={{
                  fontSize: "var(--text-xs)", fontWeight: 600,
                  color: accent,
                  paddingLeft: 12, paddingRight: 12, height: 28,
                  borderRadius: 8,
                  backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
                  gap: 8,
                }}>
                  <Sparkles size={12} style={{ color: accent }} />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── Pricing card — single SKU. Two rows: free trial + Games Pass.
            Hidden entirely when (a) game is free (no cost question to answer),
            (b) user already has the pass (chip strip closes the question), or
            (c) game is coming soon. */}
        {!isComingSoon && !pass.active && !isFree && (
          <div style={{ padding: "20px 16px 0" }}>
            <SectionTitle>How to play</SectionTitle>
            <div style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: `color-mix(in srgb, ${accent} 8%, var(--card))`,
              display: "flex", flexDirection: "column", gap: 16,
            }}>
              {isLiveEvent ? (
                <PricingRow
                  Icon={Layers} iconBg={accent}
                  title={`${GAMES_PASS.label} — ₹${GAMES_PASS.price} / ${GAMES_PASS.durationLabel}`}
                  body="Required to join · includes all 7 premium games + future live events"
                />
              ) : (
                <>
                  <PricingRow
                    Icon={Play} iconBg={accent}
                    title={game.pricing.trialLevels === 1
                      ? "One round — Free"
                      : `First ${game.pricing.trialLevels} rounds — Free`}
                    body="Try before you buy · no signup needed"
                  />
                  <PricingRow
                    Icon={Lock} iconBg={accent}
                    title={`${GAMES_PASS.label} — ₹${GAMES_PASS.price} / ${GAMES_PASS.durationLabel}`}
                    body="Unlocks all 7 premium games · future games · live events"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Play CTA — 44h primary-500. Pricing line below the button. */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        maxWidth: isDesktop ? 720 : undefined,
        marginLeft: isDesktop ? "auto" : undefined,
        marginRight: isDesktop ? "auto" : undefined,
      }}>
        <motion.button
          whileTap={isComingSoon ? undefined : { scale: 0.98 }}
          disabled={isComingSoon}
          onClick={handlePlay}
          className="flex items-center justify-center w-full"
          style={{
            height: 44, borderRadius: 12, gap: 8, border: "none",
            cursor: isComingSoon ? "not-allowed" : "pointer",
            backgroundColor: isComingSoon ? "var(--disabled-bg)" : "var(--primary-500)",
            transition: "background-color 0.2s ease",
          }}
        >
          {!isComingSoon && <Play size={16} style={{ color: "var(--white)", fill: "var(--white)" }} />}
          <span style={{
            fontSize: "var(--text-sm)", fontWeight: 600,
            color: isComingSoon ? "var(--disabled-text)" : "var(--white)",
            letterSpacing: 0.2,
          }}>
            {ctaLabel}
          </span>
        </motion.button>
        {ctaSublabel && (
          <p style={{
            fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
            textAlign: "center", marginTop: 6, marginBottom: 0, lineHeight: 1.4,
          }}>
            {ctaSublabel}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "var(--text-2xs)", fontWeight: 600,
      color: "var(--muted-foreground)", letterSpacing: 0.8,
      textTransform: "uppercase",
      margin: "0 0 10px",
    }}>
      {children}
    </p>
  );
}

function ChipCol({ top, bottom }: { top: React.ReactNode; bottom: string }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ flex: 1, gap: 4 }}>
      <div className="flex items-center" style={{
        fontSize: "var(--text-sm)", fontWeight: 700,
        color: "var(--foreground)", lineHeight: 1,
        gap: 4,
      }}>
        {top}
      </div>
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 500, letterSpacing: 0.3 }}>
        {bottom}
      </span>
    </div>
  );
}

function ChipDivider() {
  return <span aria-hidden style={{ width: 1, alignSelf: "center", height: 28, backgroundColor: "color-mix(in srgb, var(--foreground) 12%, transparent)" }} />;
}

function PricingRow({ Icon, iconBg, title, body }: {
  Icon: typeof Play;
  iconBg: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start" style={{ gap: 12 }}>
      <div className="flex items-center justify-center" style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        backgroundColor: `color-mix(in srgb, ${iconBg} 22%, transparent)`,
      }}>
        <Icon size={14} style={{ color: iconBg }} />
      </div>
      <div className="flex flex-col" style={{ gap: 2, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3 }}>
          {title}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
          {body}
        </span>
      </div>
    </div>
  );
}

