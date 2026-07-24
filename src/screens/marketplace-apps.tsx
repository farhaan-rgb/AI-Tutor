/**
 * Marketplace Apps — Partner education apps directory
 * Grid of curated learning apps; taps open the WebView shell
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Star, ChevronRight, WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar, GlassHeader, typo } from "../shared/premium-ui";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PartnerApp {
  id: string;
  name: string;
  tagline: string;
  gradient: string;
  iconLabel: string;
  iconBg: string;
  logoUrl?: string;
  category: string;
  rating: number;
  reviews: string;
  isFeatured?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// TODO(api): GET /api/marketplace/partner-apps
const DUMMY_PARTNER_APPS: PartnerApp[] = [
  {
    id: "app-pw",
    name: "Physics Wallah",
    tagline: "Free JEE & NEET classes from top educators",
    gradient: "linear-gradient(135deg, var(--primary-800) 0%, var(--purple-600) 100%)",
    iconLabel: "PW",
    iconBg: "var(--primary-600)",
    logoUrl: "https://www.google.com/s2/favicons?domain=pw.live&sz=128",
    category: "JEE / NEET",
    rating: 4.7,
    reviews: "2.1M",
    isFeatured: true,
  },
  {
    id: "app-unacademy",
    name: "Unacademy",
    tagline: "Live classes for UPSC, SSC, Banking & more",
    gradient: "linear-gradient(135deg, var(--success-700) 0%, var(--success-500) 100%)",
    iconLabel: "UN",
    iconBg: "var(--success-600)",
    logoUrl: "https://www.google.com/s2/favicons?domain=unacademy.com&sz=128",
    category: "Multi-Exam",
    rating: 4.5,
    reviews: "1.4M",
    isFeatured: true,
  },
  {
    id: "app-khan",
    name: "Khan Academy",
    tagline: "Free world-class education for everyone",
    gradient: "linear-gradient(135deg, var(--warning-700) 0%, var(--warning-500) 100%)",
    iconLabel: "KA",
    iconBg: "var(--warning-600)",
    logoUrl: "https://www.google.com/s2/favicons?domain=khanacademy.org&sz=128",
    category: "K–12 Concepts",
    rating: 4.8,
    reviews: "3.2M",
  },
  {
    id: "app-byjus",
    name: "BYJU'S",
    tagline: "Engaging videos for Class 4–10 + IIT JEE",
    gradient: "linear-gradient(135deg, var(--purple-600) 0%, var(--primary-400) 100%)",
    iconLabel: "BY",
    iconBg: "var(--purple-600)",
    logoUrl: "https://www.google.com/s2/favicons?domain=byjus.com&sz=128",
    category: "K–12 + JEE",
    rating: 4.4,
    reviews: "1.8M",
  },
  {
    id: "app-duolingo",
    name: "Duolingo",
    tagline: "Learn a language in 5 minutes a day",
    gradient: "linear-gradient(135deg, var(--success-600) 0%, var(--cyan-400) 100%)",
    iconLabel: "DL",
    iconBg: "var(--success-500)",
    logoUrl: "https://www.google.com/s2/favicons?domain=duolingo.com&sz=128",
    category: "Languages",
    rating: 4.9,
    reviews: "4.6M",
  },
  {
    id: "app-coursera",
    name: "Coursera",
    tagline: "University-level courses & certifications",
    gradient: "linear-gradient(135deg, var(--primary-600) 0%, var(--cyan-400) 100%)",
    iconLabel: "CR",
    iconBg: "var(--primary-500)",
    logoUrl: "https://www.google.com/s2/favicons?domain=coursera.org&sz=128",
    category: "Certifications",
    rating: 4.6,
    reviews: "980K",
  },
  {
    id: "app-testbook",
    name: "Testbook",
    tagline: "Mock tests for SSC, Banking & Railway",
    gradient: "linear-gradient(135deg, var(--error-700) 0%, var(--orange-400) 100%)",
    iconLabel: "TB",
    iconBg: "var(--error-600)",
    logoUrl: "https://www.google.com/s2/favicons?domain=testbook.com&sz=128",
    category: "Govt Exams",
    rating: 4.6,
    reviews: "1.2M",
  },
  {
    id: "app-vedantu",
    name: "Vedantu",
    tagline: "Live tutoring + recorded courses for K–12",
    gradient: "linear-gradient(135deg, var(--cyan-600) 0%, var(--primary-400) 100%)",
    iconLabel: "VD",
    iconBg: "var(--cyan-600)",
    logoUrl: "https://www.google.com/s2/favicons?domain=vedantu.com&sz=128",
    category: "K–12 Live",
    rating: 4.5,
    reviews: "860K",
  },
  {
    id: "app-embibe",
    name: "Embibe",
    tagline: "AI-personalized learning for JEE & NEET",
    gradient: "linear-gradient(135deg, var(--purple-600) 0%, var(--error-500) 100%)",
    iconLabel: "EM",
    iconBg: "var(--purple-500)",
    logoUrl: "https://www.google.com/s2/favicons?domain=embibe.com&sz=128",
    category: "AI Learning",
    rating: 4.3,
    reviews: "640K",
  },
  {
    id: "app-toppr",
    name: "Toppr",
    tagline: "Adaptive practice for CBSE & competitive exams",
    gradient: "linear-gradient(135deg, var(--warning-800) 0%, var(--orange-400) 100%)",
    iconLabel: "TP",
    iconBg: "var(--warning-700)",
    logoUrl: "https://www.google.com/s2/favicons?domain=toppr.com&sz=128",
    category: "Adaptive Practice",
    rating: 4.4,
    reviews: "720K",
  },
];

const FEATURED_APPS = DUMMY_PARTNER_APPS.filter((a) => a.isFeatured);
const ALL_APPS = DUMMY_PARTNER_APPS;

// ─── App Logo Icon ────────────────────────────────────────────────────────────
// Logos use a 3-source fallback chain: Google S2 favicons → DuckDuckGo → initials tile.
// Google S2 is most reliable (Google CDN), DuckDuckGo catches the few Google misses.
function AppLogoIcon({ app, size, radius }: { app: PartnerApp; size: number; radius: number }) {
  const domain = app.logoUrl?.match(/domain=([^&]+)/)?.[1];
  const sources = domain
    ? [
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      ]
    : [];
  const [srcIdx, setSrcIdx] = useState(0);
  const showLogo = sources.length > 0 && srcIdx < sources.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: showLogo ? "var(--white)" : app.gradient,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
      boxShadow: showLogo
        ? "0 0 0 1px color-mix(in srgb, var(--background) 12%, transparent)"
        : "0 2px 8px color-mix(in srgb, var(--background) 40%, transparent)",
    }}>
      {showLogo ? (
        <img
          key={srcIdx}
          src={sources[srcIdx]}
          alt={app.name}
          onError={() => setSrcIdx((i) => i + 1)}
          referrerPolicy="no-referrer"
          loading="lazy"
          style={{ width: "72%", height: "72%", objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)", letterSpacing: "0.02em" }}>
          {app.iconLabel}
        </span>
      )}
    </div>
  );
}

// ─── Featured App Card ────────────────────────────────────────────────────────
function FeaturedAppCard({ app, onPress }: { app: PartnerApp; onPress: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      style={{
        flexShrink: 0,
        width: 200,
        borderRadius: 16,
        overflow: "hidden",
        background: app.gradient,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        padding: 0,
        position: "relative",
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 20%, color-mix(in srgb, var(--white) 18%, transparent) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div className="flex flex-col" style={{ padding: 16, gap: 12, minHeight: 140 }}>
        <AppLogoIcon app={app} size={44} radius={12} />
        <div className="flex flex-col" style={{ gap: 4, flex: 1 }}>
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>
            {app.name}
          </span>
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "color-mix(in srgb, var(--white) 75%, transparent)", lineHeight: 1.35 }}>
            {app.tagline}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: 4 }}>
            <Star style={{ width: 12, height: 12, fill: "color-mix(in srgb, var(--white) 90%, transparent)", color: "color-mix(in srgb, var(--white) 90%, transparent)", strokeWidth: 0 }} />
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "color-mix(in srgb, var(--white) 90%, transparent)" }}>
              {app.rating}
            </span>
          </div>
          <div style={{ height: 28, paddingLeft: 12, paddingRight: 12, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--white) 20%, transparent)", display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}>Open</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── App List Row ─────────────────────────────────────────────────────────────
function AppListRow({ app, onPress }: { app: PartnerApp; onPress: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onPress}
      className="w-full flex items-center"
      style={{
        gap: 12, padding: "12px 16px",
        backgroundColor: "transparent", border: "none",
        cursor: "pointer", textAlign: "left",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <AppLogoIcon app={app} size={48} radius={12} />

      <div className="flex flex-col" style={{ flex: 1, gap: 4, overflow: "hidden" }}>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
          {app.name}
        </span>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {app.tagline}
        </span>
      </div>

      <div style={{
        height: 32, paddingLeft: 16, paddingRight: 16, flexShrink: 0,
        borderRadius: 9999,
        border: "1px solid color-mix(in srgb, var(--primary) 50%, transparent)",
        display: "flex", alignItems: "center",
      }}>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary-300)" }}>
          Open
        </span>
      </div>
    </motion.button>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function AppsSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Featured skeleton */}
      <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, paddingTop: 48, paddingBottom: 4 }}>
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
            style={{ width: 200, height: 140, borderRadius: 16, backgroundColor: "var(--border)", flexShrink: 0 }}
          />
        ))}
      </div>
      {/* List skeleton */}
      <div style={{ marginTop: 24 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center" style={{ gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.08 }}
              style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "var(--border)", flexShrink: 0 }}
            />
            <div className="flex flex-col" style={{ flex: 1, gap: 8 }}>
              <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.08 }} style={{ height: 12, width: "55%", borderRadius: 8, backgroundColor: "var(--border)" }} />
              <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.08 + 0.1 }} style={{ height: 12, width: "80%", borderRadius: 8, backgroundColor: "var(--border)" }} />
            </div>
            <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.08 }} style={{ width: 52, height: 32, borderRadius: 9999, backgroundColor: "var(--border)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
function AppsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ flex: 1, padding: 40, gap: 16, minHeight: 320 }}>
      <div style={{ width: 64, height: 64, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--error-500) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--error-500) 20%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <WifiOff style={{ width: 28, height: 28, color: "var(--error-500)", strokeWidth: 1.5 }} />
      </div>
      <div className="flex flex-col items-center" style={{ gap: 8 }}>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", textAlign: "center" }}>
          Couldn't load apps
        </span>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center", lineHeight: 1.5 }}>
          Check your connection and try again.
        </span>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="flex items-center"
        style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 9999, backgroundColor: "var(--primary)", border: "none", cursor: "pointer", gap: 8 }}
      >
        <RefreshCw style={{ width: 16, height: 16, color: "var(--white)", strokeWidth: 2 }} />
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}>Retry</span>
      </motion.button>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionLabel({ title }: { title: string }) {
  return (
    <div className="flex items-center" style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 20, paddingBottom: 8, gap: 8 }}>
      <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
        {title}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  // TODO(api): replace with real fetch; simulate async load for now
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, [loadKey]);

  return (
    <div className="flex flex-col" style={{ fontFamily: "var(--font-family-inter)", backgroundColor: "var(--background)", minHeight: "100vh" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, paddingLeft: 8, paddingRight: 16, gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{ width: 44, height: 44, borderRadius: 9999, border: "none", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: "var(--foreground)", strokeWidth: 2 }} />
          </motion.button>
          <span style={{ ...typo.pageTitleStyle }}>Partner Apps</span>
        </div>
      </GlassHeader>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AppsSkeleton />
            </motion.div>
          )}

          {!isLoading && hasError && (
            <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AppsError onRetry={() => setLoadKey((k) => k + 1)} />
            </motion.div>
          )}

          {!isLoading && !hasError && (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Featured Apps — horizontal scroll */}
              <SectionLabel title="Featured" />
              <div className="flex" style={{ gap: 12, paddingLeft: 16, paddingRight: 16, paddingBottom: 4, overflowX: "auto", scrollbarWidth: "none" }}>
                {FEATURED_APPS.map((app) => (
                  <FeaturedAppCard
                    key={app.id}
                    app={app}
                    onPress={() => navigate(`/marketplace/webview/${app.id}`)}
                  />
                ))}
              </div>

              {/* All Apps — list */}
              <SectionLabel title="All Apps" />
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {ALL_APPS.map((app) => (
                  <AppListRow
                    key={app.id}
                    app={app}
                    onPress={() => navigate(`/marketplace/webview/${app.id}`)}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-center" style={{ padding: "20px 16px 40px" }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <ChevronRight style={{ width: 16, height: 16, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
                  <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                    More apps coming soon
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
