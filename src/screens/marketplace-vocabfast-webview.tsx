/**
 * VocabularyFast Webview — post-purchase learning surface.
 *
 * Wraps vocabularyfast.com/learn/<pack> in a PrepMaster chrome (back button,
 * pack title, partner attribution, open-in-browser fallback).
 *
 * Auto-account hand-off:
 *   Production → POST https://vocabularyfast.com/api/teachmint/launch
 *                { teachmint_user_id, name, email, phone, packs: [packId] }
 *                ← { redirect_url: "...?token=xyz" }
 *   Then iframe loads redirect_url.
 *
 * Dev/demo: we don't have the API yet, so we show a brief "Launching..."
 * splash, then attempt to iframe the public pack URL. If X-Frame-Options
 * blocks (likely — most Vercel/Next sites do), the iframe stays empty and the
 * "Open in new tab" fallback in the header is the escape hatch. The mocked
 * learning preview below the empty iframe area communicates that real users
 * will see their own pack here.
 *
 * Route: /marketplace/webview/vf-:packSuffix
 *   packSuffix is the part after "vf-" (e.g., "cat" → loads "vf-cat" pack).
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ExternalLink, Brain, Sparkles, AlertCircle } from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import {
  getVocabFastPack,
  VOCABFAST_BRAND,
} from "../shared/classroom-catalog";

function getPackUrl(packId: string, isTrial: boolean) {
  // pack id format: vf-cat → /learn/cat ; vf-grade-8 → /learn/grade-8
  const slug = packId.replace(/^vf-/, "");
  const base = `https://vocabularyfast.com/learn/${slug}`;
  return isTrial ? `${base}?onboarding=true` : base;
}

export function Component() {
  const navigate = useNavigate();
  const { packSuffix } = useParams();
  const [searchParams] = useSearchParams();
  const isTrial = searchParams.get("trial") === "1";
  const packId = `vf-${packSuffix ?? ""}`;
  const pack = getVocabFastPack(packId);

  // Launch states:
  //   "launching"   → splash, simulating auto-account hand-off (skipped on trial)
  //   "loading"     → iframe loading
  //   "loaded"      → iframe finished loading (we trust load event)
  //   "blocked"     → iframe didn't load in time; show fallback
  //   "not-found"   → invalid pack
  // Trial flow is anonymous — no account hand-off, skip launching splash.
  const initialState = pack ? (isTrial ? "loading" : "launching") : "not-found";
  const [state, setState] = useState<"launching" | "loading" | "loaded" | "blocked" | "not-found">(initialState);

  // Auto-advance from launching → loading after ~1.4s (feels like real account hand-off).
  useEffect(() => {
    if (state !== "launching") return;
    const t = setTimeout(() => setState("loading"), 1400);
    return () => clearTimeout(t);
  }, [state]);

  // If iframe doesn't fire onLoad within 6s, assume X-Frame-Options blocked it.
  useEffect(() => {
    if (state !== "loading") return;
    const t = setTimeout(() => {
      setState((current) => (current === "loading" ? "blocked" : current));
    }, 6000);
    return () => clearTimeout(t);
  }, [state]);

  if (!pack || state === "not-found") {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ height: "100dvh", backgroundColor: "var(--background)", padding: 24, gap: 16, textAlign: "center" }}
      >
        <AlertCircle size={32} style={{ color: "var(--muted-foreground)" }} />
        <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--foreground)" }}>
          Pack unavailable
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
          We couldn't open this vocabulary pack. Try again from your Classes tab.
        </span>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/classes", { replace: true })}
          style={{
            marginTop: 8, height: 40, paddingLeft: 16, paddingRight: 16,
            borderRadius: 12, border: "1px solid var(--primary)",
            backgroundColor: "transparent", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--primary)" }}>
            Back to Classes
          </span>
        </motion.button>
      </div>
    );
  }

  const url = getPackUrl(pack.id, isTrial);

  return (
    <div
      style={{
        height: "100dvh",
        backgroundColor: "var(--background)",
        display: "flex", flexDirection: "column",
      }}
    >
      <StatusBar />

      {/* Chrome header */}
      <div
        className="flex items-center"
        style={{
          height: 56, paddingLeft: 8, paddingRight: 12, gap: 8,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex items-center justify-center shrink-0"
          style={{
            width: 44, height: 44, borderRadius: 8,
            border: "none", backgroundColor: "transparent", cursor: "pointer",
          }}
        >
          <ArrowLeft size={20} style={{ color: "var(--foreground)" }} />
        </motion.button>

        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: 6 }}>
            <span style={{
              fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)",
              lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {pack.title}
            </span>
            {isTrial && (
              <span style={{
                fontSize: 9, fontWeight: 800,
                color: VOCABFAST_BRAND.accentColor, letterSpacing: 0.6,
                paddingLeft: 5, paddingRight: 5, height: 16,
                display: "inline-flex", alignItems: "center",
                borderRadius: 4,
                backgroundColor: VOCABFAST_BRAND.accentSoft,
                border: `0.5px solid ${VOCABFAST_BRAND.accentBorder}`,
              }}>
                FREE TRIAL
              </span>
            )}
          </div>
          <div className="flex items-center" style={{ gap: 4 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 14, height: 14, borderRadius: 3,
                background: "linear-gradient(135deg, #1c4922 0%, #2e7032 100%)",
              }}
            >
              <Brain size={8} style={{ color: "#b7eb8f" }} />
            </div>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
              {VOCABFAST_BRAND.partnerLabel}
            </span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          aria-label="Open in browser"
          className="flex items-center justify-center shrink-0"
          style={{
            gap: 4, height: 32, paddingLeft: 10, paddingRight: 10, borderRadius: 8,
            backgroundColor: VOCABFAST_BRAND.accentSoft,
            border: `1px solid ${VOCABFAST_BRAND.accentBorder}`,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <ExternalLink size={12} style={{ color: VOCABFAST_BRAND.accentColor }} />
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: VOCABFAST_BRAND.accentColor }}>
            Open in browser
          </span>
        </motion.button>
      </div>

      {/* Body — launching | loading | iframe | blocked */}
      <div
        className="flex-1"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <AnimatePresence mode="wait">
          {state === "launching" && <LaunchingSplash key="launching" packTitle={pack.title} />}
          {state === "blocked" && (
            <BlockedFallback
              key="blocked"
              url={url}
              packTitle={pack.title}
              onRetry={() => setState("loading")}
            />
          )}
        </AnimatePresence>

        {/* Iframe — mounted during loading/loaded so the launch event has time
            to fire. Visually hidden during launching/blocked overlays. */}
        {(state === "loading" || state === "loaded") && (
          <iframe
            src={url}
            title={pack.title}
            onLoad={() => setState("loaded")}
            style={{
              width: "100%", height: "100%", border: "none",
              backgroundColor: "var(--background)",
            }}
            // Allow audio, fullscreen, and clipboard for the embedded learning UX.
            allow="autoplay; clipboard-write; clipboard-read; fullscreen"
            referrerPolicy="no-referrer"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}

        {/* Loading shimmer overlay while iframe is fetching */}
        {state === "loading" && <LoadingShimmer />}
      </div>
    </div>
  );
}

// ─── Launching splash ────────────────────────────────────────────────────────

function LaunchingSplash({ packTitle }: { packTitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center"
      style={{
        position: "absolute", inset: 0,
        backgroundColor: "var(--background)",
        gap: 16, padding: 24, textAlign: "center",
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        className="flex items-center justify-center"
        style={{
          width: 72, height: 72, borderRadius: 9999,
          border: `2px solid ${VOCABFAST_BRAND.accentBorder}`,
          borderTopColor: VOCABFAST_BRAND.accentColor,
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 48, height: 48, borderRadius: 12,
            background: "linear-gradient(135deg, #1c4922 0%, #2e7032 100%)",
          }}
        >
          <Brain size={24} style={{ color: "#b7eb8f" }} />
        </div>
      </motion.div>
      <div className="flex flex-col" style={{ gap: 4 }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>
          Launching {packTitle}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
          Setting up your account on {VOCABFAST_BRAND.hostName}…
        </span>
      </div>
      <div className="flex items-center" style={{ gap: 6, marginTop: 8 }}>
        <Sparkles size={12} style={{ color: VOCABFAST_BRAND.accentColor }} />
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
          No sign-in needed — we've handled it
        </span>
      </div>
    </motion.div>
  );
}

// ─── Loading shimmer ─────────────────────────────────────────────────────────

function LoadingShimmer() {
  return (
    <div
      className="flex flex-col"
      style={{
        position: "absolute", inset: 0,
        backgroundColor: "var(--background)",
        padding: 24, gap: 16, pointerEvents: "none",
      }}
    >
      {[88, 32, 24, 200, 64].map((h, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
          style={{
            height: h, width: i % 2 === 0 ? "100%" : "70%",
            borderRadius: 12, backgroundColor: "var(--card-bg-secondary)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Blocked fallback ────────────────────────────────────────────────────────

function BlockedFallback({
  url, packTitle, onRetry,
}: {
  url: string;
  packTitle: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center"
      style={{
        position: "absolute", inset: 0,
        backgroundColor: "var(--background)",
        padding: 24, gap: 16, textAlign: "center",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 64, height: 64, borderRadius: 12,
          backgroundColor: VOCABFAST_BRAND.accentSoft,
          border: `1px solid ${VOCABFAST_BRAND.accentBorder}`,
        }}
      >
        <ExternalLink size={28} style={{ color: VOCABFAST_BRAND.accentColor }} />
      </div>

      <div className="flex flex-col" style={{ gap: 8, maxWidth: 320 }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>
          Opens best in your browser
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.55 }}>
          {packTitle} runs on {VOCABFAST_BRAND.hostName}. We've set up your account — tap below to continue learning.
        </span>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        className="flex items-center justify-center"
        style={{
          gap: 6, height: 44, paddingLeft: 20, paddingRight: 20, borderRadius: 12,
          backgroundColor: VOCABFAST_BRAND.accentColor,
          border: "none", cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <ExternalLink size={14} style={{ color: "#fff" }} />
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "#fff" }}>
          Open in browser
        </span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        style={{
          background: "transparent", border: "none", padding: 8,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textDecoration: "underline" }}>
          Try again
        </span>
      </motion.button>
    </motion.div>
  );
}
