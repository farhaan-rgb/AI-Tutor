/**
 * VocabularyFast Pack — Marketplace Detail Page
 *
 * Third-party partner PDP. Reuses the marketplace shell but with:
 *  - Code-rendered partner hero (no banner asset)
 *  - "Powered by VocabularyFast" attribution + verified-partner pill
 *  - Embedded Try-3-words sample mini-flow (the conversion engine)
 *  - How-it-works methodology cards mirroring vocabularyfast.com/how-it-works
 *  - FAQ accordion mirroring their FAQ
 *  - States: not-purchased | purchased | coming-soon | age-mismatch advisory
 *
 * Route: /marketplace/vocab/:packId
 * Post-purchase CTA: navigates to /marketplace/webview/vf-<packId> (the
 * webview shell that calls the auto-account-launch API and renders inside
 * PrepMaster chrome).
 */

import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  X, BookOpen, CheckCircle2, Clock, Sparkles, Volume2, Image as ImageIcon,
  ChevronDown, ChevronUp, Phone, BellRing, Brain, Repeat, Flame,
  Plus, Minus, Play,
} from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import {
  getVocabFastPack,
  VOCABFAST_BRAND,
  VOCABFAST_PRICING,
} from "../shared/classroom-catalog";
import { useVocabFastPurchases } from "../shared/feedback-storage";
import { CourseReviewsPreview } from "./course-reviews-preview";

// ─── Hero ─────────────────────────────────────────────────────────────────────

function VocabFastHero({ packTitle, packAudience, examTarget }: {
  packTitle: string;
  packAudience: string;
  examTarget: string | undefined;
}) {
  const accent = VOCABFAST_BRAND.accentColor;

  return (
    <div
      style={{
        width: "100%", aspectRatio: "1312 / 740",
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #05122e 0%, #0a1e4a 55%, #15326b 100%)",
        flexShrink: 0,
      }}
    >
      {/* Diagonal accent lines */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        background:
          "repeating-linear-gradient(112deg, transparent 0 24px, rgba(255,255,255,0.04) 24px 25px, transparent 25px 48px, rgba(0,0,0,0.18) 48px 49px)",
        mixBlendMode: "overlay",
      }} />

      {/* Radial glow */}
      <div aria-hidden style={{
        position: "absolute", top: "-12%", right: "-8%", width: "60%", height: "70%", borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}40 0%, ${accent}10 50%, transparent 75%)`,
        filter: "blur(2px)",
      }} />

      {/* Big initial — visual anchor (uses pack's primary word's first letter) */}
      <span style={{
        position: "absolute", right: "4%", bottom: "-10%",
        fontSize: "min(48vw, 280px)", fontWeight: 900, lineHeight: 1, letterSpacing: -6,
        background: `linear-gradient(180deg, #ffffff 0%, ${accent} 80%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text", color: "transparent",
        filter: `drop-shadow(0 0 18px ${accent}66) drop-shadow(0 6px 10px rgba(0,0,0,0.5))`,
        opacity: 0.28, pointerEvents: "none",
      }}>
        Aa
      </span>

      {/* Title block */}
      <div style={{
        position: "absolute", left: "5%", bottom: "10%",
        display: "flex", flexDirection: "column", gap: 4,
        maxWidth: "70%",
      }}>
        <span style={{
          fontSize: "var(--text-xs)", fontWeight: 700, color: accent,
          letterSpacing: 1.6, textTransform: "uppercase",
        }}>
          {examTarget ?? packAudience}
        </span>
        <span style={{
          fontSize: 24, fontWeight: 900, color: "#fff",
          lineHeight: 1.1, letterSpacing: -0.4,
          textShadow: "0 2px 12px rgba(0,0,0,0.55)",
        }}>
          {packTitle}
        </span>
      </div>

      {/* Status-bar legibility gradient */}
      <div aria-hidden style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "30%",
        background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

const HOW_IT_WORKS_CARDS = [
  {
    icon: Brain,
    title: "Keyword-based mnemonics",
    body: "Every word gets a memorable keyword based on how it sounds or looks. \"Occlude\" → \"Oak cloud.\" Your brain anchors meaning to a familiar phrase.",
  },
  {
    icon: ImageIcon,
    title: "Memory link with AI visual",
    body: "A short scene ties the keyword to the meaning — illustrated by AI. Once you visualise it, you remember it.",
  },
  {
    icon: Repeat,
    title: "Spaced repetition",
    body: "Words come back for review just before you'd forget them — so 5 minutes a day compounds into permanent vocabulary.",
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────
// Mirrors the FAQItem pattern from music-course-detail.tsx so this matches
// the canonical PDP FAQ shape. Devs can reuse the same SDUI `faq` component
// across all marketplace product pages.

interface FAQ {
  question: string;
  answer: string;
}

// TODO(copy): final FAQ answers to be sourced from VocabularyFast — these are
// neutral approximations and should be replaced with partner-provided copy
// before production.
// TODO(api): GET /api/faqs?category=vocabfast
const VOCABFAST_FAQS: FAQ[] = [
  {
    question: "How is a word \"mastered\"?",
    answer: "A word is marked mastered after you recall it correctly across multiple spaced reviews.",
  },
  {
    question: "What happens if I forget a word I've already mastered?",
    answer: "It returns to the review queue automatically. Spaced repetition is designed around this — re-remembering is what builds long-term retention.",
  },
  {
    question: "What kinds of questions will I see in practice?",
    answer: "Practice covers meaning recall, keyword recall, and usage in a sentence.",
  },
  {
    question: "Will I get audio for every word?",
    answer: "Yes — every word in the pack has audio pronunciation.",
  },
];

interface FAQItemProps { item: FAQ; isLast: boolean; }

function FAQItem({ item, isLast }: FAQItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex flex-col"
        style={{
          paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16,
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", flex: 1, textAlign: "left" }}>
            {item.question}
          </span>
          <div style={{ flexShrink: 0 }}>
            {open
              ? <Minus size={16} style={{ color: "var(--muted-foreground)" }} />
              : <Plus size={16} style={{ color: "var(--muted-foreground)" }} />
            }
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <span style={{ display: "block", marginTop: 8, fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.55, textAlign: "left" }}>
                {item.answer}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      {!isLast && <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 16 }} />}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function Component() {
  const navigate = useNavigate();
  const { packId } = useParams();
  const [descExpanded, setDescExpanded] = useState(false);

  const pack = getVocabFastPack(packId);
  const purchases = useVocabFastPurchases();
  const isPurchased = pack ? purchases.isPurchased(pack.id) : false;

  // 404 fallback — invalid pack id
  if (!pack) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ height: "100dvh", backgroundColor: "var(--background)", padding: 24, gap: 16, textAlign: "center" }}
      >
        <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--foreground)" }}>
          Pack not found
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
          The vocabulary pack you're looking for doesn't exist or has been moved.
        </span>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/marketplace-v1", { replace: true })}
          style={{
            marginTop: 8, height: 40, paddingLeft: 16, paddingRight: 16,
            borderRadius: 12, border: "1px solid var(--primary)",
            backgroundColor: "transparent", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--primary)" }}>
            Back to marketplace
          </span>
        </motion.button>
      </div>
    );
  }

  const isComingSoon = pack.availability === "coming-soon";
  const discountPct = useMemo(
    () => Math.round((1 - VOCABFAST_PRICING.packPrice / VOCABFAST_PRICING.packOriginalPrice) * 100),
    []
  );

  function handlePrimaryCTA() {
    if (isComingSoon) {
      // Notify-me — V1 just toasts via existing wishlist infra; for now,
      // navigate to wishlist sheet on marketplace-v1.
      navigate("/marketplace-v1?vocab-notify=" + pack.id);
      return;
    }
    if (isPurchased) {
      // Already purchased → launch webview directly.
      navigate(`/marketplace/webview/vf-${pack.id.replace("vf-", "")}`);
      return;
    }
    // Not purchased → go through checkout. Entitlement is granted on
    // /marketplace/order-confirm (post-payment), not here.
    navigate("/marketplace/checkout", {
      state: {
        source: "vocabfast",
        packId: pack.id,
        packTitle: pack.title,
        price: VOCABFAST_PRICING.packPrice,
        originalPrice: VOCABFAST_PRICING.packOriginalPrice,
      },
    });
  }

  const ctaLabel = isComingSoon
    ? "Notify me when live"
    : isPurchased
    ? "Continue learning"
    : "Unlock pack";

  // What's-included list — pulled from pack metadata so coming-soon packs
  // still show what they'll eventually offer.
  const benefits: { icon: typeof Sparkles; label: string }[] = [
    { icon: BookOpen, label: `${pack.wordsCount.toLocaleString("en-IN")} curated words` },
    { icon: Brain,    label: "Keyword mnemonic for every word" },
    { icon: ImageIcon, label: "AI-generated visual memory scene" },
    { icon: Volume2,  label: "Audio pronunciation" },
    { icon: Repeat,   label: "Spaced repetition review queue" },
    { icon: Flame,    label: "Streak, analytics and recall rate" },
    { icon: CheckCircle2, label: "One-time payment · no auto-renewal" },
  ];

  return (
    <div
      style={{
        height: "100dvh",
        position: "relative",
        backgroundColor: "var(--background)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Floating close */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate(-1)}
        aria-label="Close"
        className="flex items-center justify-center"
        style={{
          position: "absolute", top: 52, right: 12, zIndex: 50,
          width: 36, height: 36, borderRadius: 9999,
          backgroundColor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "none", cursor: "pointer",
        }}
      >
        <X size={20} style={{ color: "#fff" }} />
      </motion.button>

      <div className="flex-1 overflow-y-auto">

        {/* Hero */}
        <div style={{ position: "relative" }}>
          <VocabFastHero
            packTitle={pack.title}
            packAudience={pack.audience}
            examTarget={pack.examTarget}
          />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, pointerEvents: "none" }}>
            <StatusBar />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col" style={{ padding: 16, gap: 20 }}>

          {/* Title block */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
              <div
                className="flex items-center justify-center"
                style={{
                  paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 4,
                  backgroundColor: VOCABFAST_BRAND.accentSoft,
                  border: `1px solid ${VOCABFAST_BRAND.accentBorder}`,
                }}
              >
                <span style={{
                  fontSize: "var(--text-2xs)", fontWeight: 700,
                  color: VOCABFAST_BRAND.accentColor, letterSpacing: 1,
                }}>
                  VOCABULARY PACK
                </span>
              </div>
              {isComingSoon && (
                <div
                  className="flex items-center justify-center"
                  style={{
                    paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 4,
                    backgroundColor: "color-mix(in srgb, var(--warning-500) 14%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
                  }}
                >
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--warning-500)", letterSpacing: 0.6 }}>
                    COMING SOON
                  </span>
                </div>
              )}
              {isPurchased && (
                <div
                  className="flex items-center justify-center"
                  style={{
                    gap: 4,
                    paddingLeft: 6, paddingRight: 8, height: 20, borderRadius: 4,
                    backgroundColor: "color-mix(in srgb, var(--success-500) 14%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--success-500) 30%, transparent)",
                  }}
                >
                  <CheckCircle2 size={11} style={{ color: "var(--success-500)" }} />
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--success-500)", letterSpacing: 0.5 }}>
                    PURCHASED
                  </span>
                </div>
              )}
            </div>

            <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.3 }}>
              {pack.title}
            </span>

            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
              {pack.audience}{pack.examTarget ? ` · ${pack.examTarget}` : ""}
            </span>

            {/* Stats row */}
            <div className="flex items-center" style={{ gap: 12, flexWrap: "wrap", marginTop: 4 }}>
              <div className="flex items-center" style={{ gap: 4 }}>
                <BookOpen size={12} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  {pack.wordsCount.toLocaleString("en-IN")} words
                </span>
              </div>
              <div className="flex items-center" style={{ gap: 4 }}>
                <Clock size={12} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  ~{pack.daysToMaster} days
                </span>
              </div>
              <div className="flex items-center" style={{ gap: 4 }}>
                <Volume2 size={12} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  Audio + AI visuals
                </span>
              </div>
            </div>
          </div>

          {/* Pricing — hide when purchased (CTA stickyfoot says "Continue") */}
          {!isPurchased && !isComingSoon && (
            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--foreground)" }}>
                ₹{VOCABFAST_PRICING.packPrice.toLocaleString("en-IN")}
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
                ₹{VOCABFAST_PRICING.packOriginalPrice.toLocaleString("en-IN")}
              </span>
              <div
                className="flex items-center justify-center"
                style={{
                  paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 4,
                  backgroundColor: "color-mix(in srgb, var(--warning-500) 14%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
                }}
              >
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--warning-500)" }}>
                  {discountPct}% off
                </span>
              </div>
            </div>
          )}

          {/* Free Trial CTA — opens vocabularyfast.com/learn/<pack>?onboarding=true
              in our webview. Anonymous trial (no sign-in needed) per partner's
              own free-trial flow. Hidden once purchased. */}
          {!isPurchased && !isComingSoon && (
            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(`/marketplace/webview/vf-${pack.id.replace("vf-", "")}?trial=1`)}
              className="flex items-center"
              style={{
                gap: 12, padding: 16, borderRadius: 12,
                backgroundColor: "var(--card)",
                border: `1px solid ${VOCABFAST_BRAND.accentBorder}`,
                cursor: "pointer", fontFamily: "inherit", textAlign: "left",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 40, height: 40, borderRadius: 8,
                  backgroundColor: VOCABFAST_BRAND.accentSoft,
                }}
              >
                <Play size={18} fill={VOCABFAST_BRAND.accentColor} style={{ color: VOCABFAST_BRAND.accentColor }} />
              </div>
              <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                  Try free trial
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  Open VocabularyFast preview · No sign-up needed
                </span>
              </div>
              <ChevronDown size={16} style={{ color: VOCABFAST_BRAND.accentColor, transform: "rotate(-90deg)", flexShrink: 0 }} />
            </motion.button>
          )}

          {/* About this pack — pack-specific description.
              Placed FIRST (before What you'll get) so users read the high-
              level overview before scanning the feature checklist. */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{
              fontSize: "var(--text-base)", fontWeight: 600,
              color: "var(--muted-foreground)",
            }}>
              About this pack
            </span>
            <div style={{ padding: 16, backgroundColor: "var(--card)", borderRadius: 12 }}>
              <p style={{
                fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.6, margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: descExpanded ? undefined : 5,
                WebkitBoxOrient: "vertical",
                overflow: descExpanded ? "visible" : "hidden",
              }}>
                {pack.description}
              </p>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="flex items-center"
                style={{
                  gap: 4, marginTop: 4, background: "none", border: "none", cursor: "pointer",
                  paddingTop: 8, paddingBottom: 8, paddingLeft: 0, paddingRight: 0,
                  fontFamily: "inherit", minHeight: 44,
                }}
              >
                <span style={{ fontSize: "var(--text-sm)", color: "var(--primary)", fontWeight: 600 }}>
                  {descExpanded ? "Show less" : "Show more"}
                </span>
                {descExpanded
                  ? <ChevronUp size={14} style={{ color: "var(--primary)" }} />
                  : <ChevronDown size={14} style={{ color: "var(--primary)" }} />
                }
              </button>
            </div>
          </div>

          {/* What you'll get */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{
              fontSize: "var(--text-base)", fontWeight: 600,
              color: "var(--muted-foreground)",
            }}>
              What you'll get
            </span>
            <div className="flex flex-col" style={{ padding: 16, backgroundColor: "var(--card)", borderRadius: 12 }}>
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={i}>
                    <div className="flex items-center" style={{ gap: 12, paddingTop: i === 0 ? 0 : 12, paddingBottom: i === benefits.length - 1 ? 0 : 12 }}>
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          backgroundColor: VOCABFAST_BRAND.accentSoft,
                        }}
                      >
                        <Icon size={16} style={{ color: VOCABFAST_BRAND.accentColor }} />
                      </div>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)" }}>{b.label}</span>
                    </div>
                    {i < benefits.length - 1 && (
                      <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 44 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* How it works */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span style={{
              fontSize: "var(--text-base)", fontWeight: 600,
              color: "var(--muted-foreground)",
            }}>
              How it works
            </span>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {HOW_IT_WORKS_CARDS.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div
                    key={i}
                    className="flex"
                    style={{
                      gap: 12, padding: 16, borderRadius: 12,
                      backgroundColor: "var(--card)",
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 36, height: 36, borderRadius: 8,
                        backgroundColor: VOCABFAST_BRAND.accentSoft,
                      }}
                    >
                      <Icon size={18} style={{ color: VOCABFAST_BRAND.accentColor }} />
                    </div>
                    <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 4 }}>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                        {c.title}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.55 }}>
                        {c.body}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* About VocabularyFast — partner credibility block.
              Mirrors the music-course "About FSM" pattern so the SDUI vendor
              spec is consistent across PDPs. */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <span style={{
              fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)",
              color: "var(--gray-500)",
            }}>
              About {VOCABFAST_BRAND.name}
            </span>
            <div className="flex items-center" style={{ gap: 12 }}>
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 56, height: 56, borderRadius: 9999,
                  background: "linear-gradient(135deg, #1c4922 0%, #2e7032 100%)",
                  border: "1px solid color-mix(in srgb, #b7eb8f 30%, transparent)",
                }}
              >
                <Brain size={28} style={{ color: "#b7eb8f" }} />
              </div>
              <div className="flex flex-col" style={{ gap: 2 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                  {VOCABFAST_BRAND.name}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  Verified Teachmint Partner · {VOCABFAST_BRAND.hostName}
                </span>
              </div>
            </div>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--secondary-foreground)", lineHeight: 1.6 }}>
              {VOCABFAST_BRAND.name} is a vocabulary learning platform built around the keyword-mnemonic method and spaced repetition. Each word is paired with a memorable keyword, a memory-link scene, audio pronunciation, and example sentences. Packs are available for school grades, board prep, and standardised exams.
            </span>
          </div>

          {/* FAQ — uses the canonical FAQItem pattern from music-course-detail
              so the SDUI `faq` component spec is consistent across all PDPs. */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <span style={{
              fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)",
              color: "var(--gray-500)",
            }}>
              Frequently asked questions
            </span>
            <div style={{ borderRadius: 12, backgroundColor: "var(--card)", overflow: "hidden" }}>
              {VOCABFAST_FAQS.map((faq, idx) => (
                <FAQItem key={idx} item={faq} isLast={idx === VOCABFAST_FAQS.length - 1} />
              ))}
            </div>
          </div>

          {/* Reviews preview */}
          <CourseReviewsPreview courseId={pack.id} />

          {/* Have questions */}
          <div
            className="flex items-center"
            style={{
              gap: 12, padding: 12, borderRadius: 12,
              backgroundColor: "var(--card)",
              marginBottom: 80,
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 40, height: 40, borderRadius: 8,
                backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
              }}
            >
              <Phone size={20} style={{ color: "var(--foreground)" }} />
            </div>
            <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
                Have questions?
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Talk to a Teachmint expert
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { window.location.href = "tel:+919876543210"; }}
              className="flex items-center justify-center shrink-0"
              style={{
                height: 36, paddingLeft: 14, paddingRight: 14, borderRadius: 8,
                backgroundColor: "transparent", border: "1px solid var(--primary)",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--primary)" }}>
                Call Now
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          paddingLeft: 16, paddingRight: 16, paddingTop: 12,
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))" as unknown as number,
          backgroundColor: "var(--card)",
          backdropFilter: "blur(12px)",
          borderTop: `0.5px solid ${VOCABFAST_BRAND.accentBorder}`,
        }}
      >
        <div className="flex flex-col" style={{ gap: 2 }}>
          {isPurchased ? (
            <>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--success-500)" }}>
                You own this pack
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                {pack.wordsCount.toLocaleString("en-IN")} words
              </span>
            </>
          ) : isComingSoon ? (
            <>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--warning-500)" }}>
                Launching soon
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                We'll send one alert when it goes live
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center" style={{ gap: 6 }}>
                <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--foreground)" }}>
                  ₹{VOCABFAST_PRICING.packPrice.toLocaleString("en-IN")}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
                  ₹{VOCABFAST_PRICING.packOriginalPrice.toLocaleString("en-IN")}
                </span>
                <div
                  className="flex items-center justify-center"
                  style={{
                    paddingLeft: 6, paddingRight: 6, height: 18, borderRadius: 4,
                    backgroundColor: "color-mix(in srgb, var(--warning-500) 15%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
                  }}
                >
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--warning-500)" }}>
                    {discountPct}% off
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
                One-time payment · No auto-renewal
              </span>
            </>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePrimaryCTA}
          className="flex items-center justify-center"
          style={{
            height: 44, paddingLeft: 16, paddingRight: 16, minWidth: 140,
            borderRadius: 12, gap: 6,
            backgroundColor: isComingSoon ? "var(--warning-500)" : VOCABFAST_BRAND.accentColor,
            border: "none", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {isComingSoon && <BellRing size={14} style={{ color: "#fff" }} />}
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>
            {ctaLabel}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
