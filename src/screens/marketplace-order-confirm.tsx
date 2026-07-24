/**
 * Marketplace Order Confirm — Post-purchase confirmation screen
 * Route: /marketplace/order-confirm
 */

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { X, CheckCircle2, Zap, Copy, Sparkles, CalendarClock, Play, ChevronRight, FileText, Brain, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { Card, typo } from "../shared/premium-ui";
import { ProductImageFallback } from "./marketplace-shared";
import { getPackById } from "../shared/test-series-progress";
import { getVocabFastPack, VOCABFAST_BRAND } from "../shared/classroom-catalog";
import { useVocabFastPurchases } from "../shared/feedback-storage";
import { getOlympiadById, useOlympiadState } from "../shared/olympiads";

// ─── Dummy Data ───────────────────────────────────────────────────────────────
// TODO(api): GET /api/orders/latest
const DUMMY_ORDER = {
  id: "PM2024050801",
  items: [
    {
      id: "item-1",
      title: "Primebook 2 Pro — 14\" · 6GB · 128GB",
      qty: 1,
      categoryId: "devices",
    },
    {
      id: "item-2",
      title: "JEE Main 2027 — 12-Month Complete Course",
      qty: 1,
      categoryId: "courses",
    },
  ],
};

// ─── Confetti dots ────────────────────────────────────────────────────────────
const CONFETTI = [
  { color: "var(--primary)",      x: -88, y: -56, delay: 0.08, size: 8 },
  { color: "var(--warning-500)",  x:  88, y: -56, delay: 0.13, size: 10 },
  { color: "var(--success-500)",  x: -108, y: 16, delay: 0.18, size: 6 },
  { color: "var(--error-500)",    x:  108, y: 16, delay: 0.23, size: 8 },
  { color: "var(--purple-400)",   x: -64, y: 80, delay: 0.28, size: 6 },
  { color: "var(--orange-400)",   x:  64, y: 80, delay: 0.33, size: 10 },
  { color: "var(--primary-300)",  x:  20, y: -96, delay: 0.1,  size: 6 },
  { color: "var(--warning-300)",  x: -20, y: -96, delay: 0.2,  size: 8 },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as {
    slotLabel?: string;
    testSeriesPackId?: string;
    planLabel?: string;
    packCount?: number;
    source?: string;
    packId?: string;
    packTitle?: string;
    olympiadPackId?: string;
  };
  const slotLabel = state.slotLabel ?? null;
  const testSeriesPack = state.testSeriesPackId ? getPackById(state.testSeriesPackId) : undefined;
  const isTestSeries = !!testSeriesPack;
  // VocabularyFast partner purchase
  const vocabPack = state.source === "vocabfast" && state.packId ? getVocabFastPack(state.packId) : null;
  const isVocab = !!vocabPack;
  const vocabPurchases = useVocabFastPurchases();
  // Olympiad paid entry — grant the registration on this post-payment mount.
  const olympiad = state.source === "olympiad" && state.olympiadPackId ? getOlympiadById(state.olympiadPackId) : null;
  const isOlympiad = !!olympiad;
  const olympiadState = useOlympiadState();

  // Grant the VocabularyFast entitlement on order-confirm mount — this is
  // the post-payment moment, so this is where ownership flips. Idempotent
  // (the hook no-ops if already purchased).
  useEffect(() => {
    if (vocabPack && !vocabPurchases.isPurchased(vocabPack.id)) {
      vocabPurchases.purchase(vocabPack.id, { totalWords: vocabPack.wordsCount });
    }
    // We intentionally omit vocabPurchases from deps — its identity changes
    // on every render (event subscription returns a fresh object) which
    // would cause this effect to fire on each render. The vocabPack id is
    // the stable signal we care about.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabPack?.id]);

  // Grant the Olympiad registration on this post-payment mount (idempotent).
  useEffect(() => {
    if (olympiad && !olympiadState.isRegistered(olympiad.id)) {
      olympiadState.register(olympiad.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [olympiad?.id]);

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
      {/* Header — X only, right-aligned */}
      <div className="flex items-center justify-end" style={{ padding: "52px 12px 0" }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/marketplace-v1")}
          aria-label="Close"
          style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "none", border: "none" }}
        >
          <X style={{ width: 20, height: 20, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
        </motion.button>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto flex flex-col"
        style={{ padding: "0 16px 24px", gap: 16 }}
      >
        {/* ── Hero ── */}
        <div className="flex flex-col items-center" style={{ paddingTop: 20, paddingBottom: 8, position: "relative" }}>
          {/* Ambient glow */}
          <div style={{
            position: "absolute",
            top: 0, left: "50%",
            transform: "translateX(-50%)",
            width: 240, height: 200,
            background: "radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--success-500) 18%, transparent) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Confetti */}
          {CONFETTI.map((dot, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], x: dot.x, y: dot.y, scale: [0, 1, 0.6] }}
              transition={{ duration: 0.9, delay: dot.delay, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: dot.size, height: dot.size,
                borderRadius: 9999,
                backgroundColor: dot.color,
                top: "40%", left: "50%",
                marginTop: -(dot.size / 2), marginLeft: -(dot.size / 2),
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Checkmark — outer ring + inner circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.08 }}
            style={{ position: "relative", width: 100, height: 100 }}
          >
            {/* Outer soft ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{
                position: "absolute", inset: -8,
                borderRadius: 9999,
                border: "1.5px solid color-mix(in srgb, var(--success-500) 30%, transparent)",
              }}
            />
            <div className="flex items-center justify-center" style={{
              width: 100, height: 100, borderRadius: 9999,
              background: "radial-gradient(circle, color-mix(in srgb, var(--success-500) 28%, transparent) 0%, color-mix(in srgb, var(--success-500) 10%, transparent) 100%)",
            }}>
              <CheckCircle2 style={{ width: 52, height: 52, color: "var(--success-500)", strokeWidth: 1.5 }} />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.25 }}
            className="flex flex-col items-center"
            style={{ gap: 6, marginTop: 20 }}
          >
            <div className="flex items-center" style={{ gap: 8 }}>
              <Sparkles style={{ width: 16, height: 16, color: "var(--warning-500)", strokeWidth: 1.5 }} />
              <span style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-xl, 20px)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--foreground)",
              }}>
                {isOlympiad ? "You're registered!" : isTestSeries ? "Test Series Unlocked!" : isVocab ? "Vocabulary Pack Unlocked!" : "You're all set!"}
              </span>
              <Sparkles style={{ width: 16, height: 16, color: "var(--warning-500)", strokeWidth: 1.5 }} />
            </div>
            <span style={{ ...typo.cardBodyStyle, textAlign: "center", maxWidth: 280 }}>
              {isTestSeries
                ? "Your mock tests are ready. Start with Mock 1 — it's a full-length pattern test."
                : isVocab && vocabPack
                ? `Your ${vocabPack.shortLabel} vocabulary pack is ready. We've set up your account — tap below to start.`
                : "Order confirmed. Get ready to start learning."}
            </span>
          </motion.div>
        </div>

        {/* ── Order info card (ID + Delivery combined) ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.2 }}
        >
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {/* Order ID row */}
            <div className="flex items-center justify-between" style={{ padding: "14px 16px" }}>
              <div className="flex flex-col" style={{ gap: 2 }}>
                <span style={{ ...typo.metaStyle }}>Order ID</span>
                <span style={{
                  fontFamily: "monospace",
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--primary-300)",
                  letterSpacing: "0.5px",
                }}>
                  #{DUMMY_ORDER.id}
                </span>
              </div>
              <button
                aria-label="Copy order ID"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Copy style={{ width: 16, height: 16, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: "0.5px", backgroundColor: "var(--border)", margin: "0 16px" }} />

            {/* Access row */}
            <div className="flex items-center" style={{ padding: "14px 16px", gap: 12 }}>
              <Zap style={{ width: 18, height: 18, color: "var(--success-500)", strokeWidth: 1.5, flexShrink: 0 }} />
              <div className="flex flex-col" style={{ gap: 2 }}>
                <span style={{ ...typo.metaStyle }}>Access</span>
                <span style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--foreground)",
                }}>
                  Available immediately
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Weekly slot (Live Group Class only) ── */}
        {slotLabel && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.2 }}
          >
            <Card style={{ padding: 16 }}>
              <div className="flex items-center" style={{ gap: 12 }}>
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                  }}
                >
                  <CalendarClock style={{ width: 18, height: 18, color: "var(--primary)", strokeWidth: 1.5 }} />
                </div>
                <div className="flex flex-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ ...typo.metaStyle }}>Your weekly slot</span>
                  <span style={{
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)",
                  }}>
                    {slotLabel}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Items ordered ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, duration: 0.2 }}
        >
          <Card style={{ padding: 16 }}>
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--foreground)",
              display: "block",
              marginBottom: 12,
            }}>
              {isTestSeries ? "Your Test Series" : isVocab ? "Your Vocabulary Pack" : "Items Ordered"}
            </span>
            {isVocab && vocabPack ? (
              <div className="flex items-start" style={{ gap: 12 }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44, height: 44, borderRadius: 9,
                    backgroundColor: VOCABFAST_BRAND.accentSoft,
                    border: `0.5px solid ${VOCABFAST_BRAND.accentBorder}`,
                    flexShrink: 0,
                  }}
                >
                  <Brain size={20} style={{ color: VOCABFAST_BRAND.accentColor }} />
                </div>
                <div className="flex flex-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)",
                    lineHeight: 1.4,
                  }}>
                    {vocabPack.title}
                  </span>
                  <span style={{ ...typo.metaStyle }}>
                    {vocabPack.wordsCount.toLocaleString("en-IN")} words · {vocabPack.audience}
                  </span>
                  <span style={{ ...typo.metaStyle, color: VOCABFAST_BRAND.accentColor, marginTop: 4 }}>
                    {VOCABFAST_BRAND.partnerLabel}
                  </span>
                </div>
              </div>
            ) : isTestSeries && testSeriesPack ? (
              <div className="flex items-start" style={{ gap: 12 }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44, height: 44, borderRadius: 9,
                    backgroundColor: `${testSeriesPack.examAccent}1f`,
                    border: `0.5px solid ${testSeriesPack.examAccent}66`,
                    flexShrink: 0,
                  }}
                >
                  <FileText size={20} style={{ color: testSeriesPack.examAccent }} />
                </div>
                <div className="flex flex-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)",
                    lineHeight: 1.4,
                  }}>
                    {testSeriesPack.title}
                  </span>
                  <span style={{ ...typo.metaStyle }}>
                    {state.planLabel ?? testSeriesPack.planLabel} pack · {state.packCount ?? testSeriesPack.totalMocks} mocks · {testSeriesPack.pattern}
                  </span>
                  <span style={{ ...typo.metaStyle, color: testSeriesPack.examAccent, marginTop: 4 }}>
                    Valid till {testSeriesPack.validTill}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: 12 }}>
                {DUMMY_ORDER.items.map((item) => (
                  <div key={item.id} className="flex items-center" style={{ gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <ProductImageFallback categoryId={item.categoryId} iconSize={22} />
                    </div>
                    <div className="flex flex-col" style={{ gap: 2, flex: 1 }}>
                      <span style={{
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-weight-medium)",
                        color: "var(--foreground)",
                        lineHeight: "1.35",
                      }}>
                        {item.title}
                      </span>
                      <span style={{ ...typo.metaStyle }}>Qty: {item.qty}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ── Fixed CTA footer ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.52, duration: 0.2 }}
        style={{ padding: "12px 16px 28px", borderTop: "0.5px solid var(--border)", backgroundColor: "var(--background)", flexShrink: 0 }}
      >
        {isOlympiad && olympiad ? (
          <div className="flex flex-col" style={{ gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/olympiad/${olympiad.id}`)}
              className="flex items-center justify-center w-full"
              style={{
                height: 44, borderRadius: 12, gap: 8, border: "none", cursor: "pointer",
                background: `linear-gradient(180deg, color-mix(in srgb, ${olympiad.accent} 95%, white) 0%, ${olympiad.accent} 100%)`,
                boxShadow: `0 4px 14px color-mix(in srgb, ${olympiad.accent} 36%, transparent)`,
              }}
            >
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "#fff" }}>
                View event details
              </span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/olympiad")}
              className="flex items-center justify-center w-full"
              style={{ height: 44, borderRadius: 12, gap: 4, cursor: "pointer", backgroundColor: "transparent", border: "1px solid var(--border)" }}
            >
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)" }}>
                Browse Olympiads
              </span>
              <ChevronRight size={14} style={{ color: "var(--muted-foreground)" }} />
            </motion.button>
          </div>
        ) : isVocab && vocabPack ? (
          <div className="flex flex-col" style={{ gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/marketplace/webview/vf-${vocabPack.id.replace("vf-", "")}`)}
              className="flex items-center justify-center w-full"
              style={{
                height: 44, borderRadius: 12, gap: 8, border: "none", cursor: "pointer",
                background: `linear-gradient(180deg, color-mix(in srgb, ${VOCABFAST_BRAND.accentColor} 95%, white) 0%, ${VOCABFAST_BRAND.accentColor} 100%)`,
                boxShadow: `0 4px 14px color-mix(in srgb, ${VOCABFAST_BRAND.accentColor} 36%, transparent)`,
              }}
            >
              <ExternalLink size={14} style={{ color: "#fff" }} />
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "#fff" }}>
                Open {VOCABFAST_BRAND.name}
              </span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/classes")}
              className="flex items-center justify-center w-full"
              style={{
                height: 44, borderRadius: 12, gap: 4, cursor: "pointer",
                backgroundColor: "transparent",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)" }}>
                View in Classes
              </span>
              <ChevronRight size={14} style={{ color: "var(--muted-foreground)" }} />
            </motion.button>
          </div>
        ) : isTestSeries && testSeriesPack ? (
          <div className="flex flex-col" style={{ gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/my-test-series/${testSeriesPack.packId}`)}
              className="flex items-center justify-center w-full"
              style={{
                height: 44, borderRadius: 12, gap: 8, border: "none", cursor: "pointer",
                background: `linear-gradient(180deg, color-mix(in srgb, ${testSeriesPack.examAccent} 95%, white) 0%, ${testSeriesPack.examAccent} 100%)`,
                boxShadow: `0 4px 14px color-mix(in srgb, ${testSeriesPack.examAccent} 36%, transparent)`,
              }}
            >
              <Play size={14} style={{ color: "#fff", fill: "#fff" }} />
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "#fff" }}>
                Take First Mock
              </span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/classes")}
              className="flex items-center justify-center w-full"
              style={{
                height: 44, borderRadius: 12, gap: 4, cursor: "pointer",
                backgroundColor: "transparent",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--foreground)" }}>
                View My Test Series
              </span>
              <ChevronRight size={14} style={{ color: "var(--muted-foreground)" }} />
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/marketplace-v1")}
            className="flex items-center justify-center w-full"
            style={{ height: 44, borderRadius: 12, backgroundColor: "var(--primary)", border: "none", cursor: "pointer" }}
          >
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--white)",
            }}>
              Continue Shopping
            </span>
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
